/**
 * Tax智慧通 - 本機混合式搜尋 v2（無 AI）
 *
 * 分工：
 * - questionBank.js：每題資料（question / keywords / aliases / intent ...）
 * - searchDictionary.js：全域同義詞、意圖觸發詞、專業主題簡稱
 * - search.js：通用比對、計分、排序
 *
 * 對外介面維持：
 *   TaxSearch.search(bank, query, category)
 *   TaxSearch.norm(text)
 */
window.TaxSearch = (() => {
  const dictionary = window.TaxSearchDictionary || {
    aliasGroups: [],
    intentGroups: [],
    topicGroups: []
  };

  const norm = (s) => String(s || '')
    .toLowerCase()
    .replace(/[\s\u3000，。？！、；：,.!?()（）【】\[\]「」『』“”‘’《》〈〉<>\-_/\\]/g, '');

  const uniq = (arr) => [...new Set((arr || []).filter(Boolean))];
  const arr = (v) => Array.isArray(v) ? v : (v == null || v === '' ? [] : [v]);

  const stopWords = [
    '請問', '想問', '我想問', '我要', '我想', '請教', '麻煩', '一下',
    '的', '了', '呢', '嗎', '啊', '呀', '喔', '請', '要', '有', '無'
  ].map(norm);

  function fieldText(item) {
    const summary = item.summary ?? item['重點摘要'] ?? '';
    return {
      question: norm(item.question),
      summary: norm(summary),
      keywords: norm(arr(item.keywords).join(' ')),
      aliases: norm(arr(item.aliases).join(' ')),
      intents: arr(item.intent).map(norm),
      answer: norm(item.answer),
      legal: norm(item.legalBasis ?? item['法規依據'] ?? ''),
      category: norm(item.category)
    };
  }

  function containsAny(text, variants) {
    return uniq(variants).map(norm).filter(Boolean).some(v => text.includes(v));
  }

  function makeGroups() {
    const aliasGroups = arr(dictionary.aliasGroups).map(g => ({
      canonical: g.canonical,
      variants: uniq([g.canonical, ...arr(g.aliases)])
    }));
    const intentGroups = arr(dictionary.intentGroups).map(g => ({
      canonical: g.intent,
      variants: uniq([g.intent, ...arr(g.triggers)])
    }));
    const topicGroups = arr(dictionary.topicGroups).map(g => ({
      canonical: g.canonical,
      aliases: uniq([g.canonical, ...arr(g.aliases)])
    }));
    return { aliasGroups, intentGroups, topicGroups };
  }

  const groups = makeGroups();

  function matchedTopics(queryNorm) {
    const candidates = [];
    groups.topicGroups.forEach(group => {
      const hit = group.aliases
        .map(raw => ({ raw, n: norm(raw) }))
        .filter(x => x.n && queryNorm.includes(x.n))
        .sort((a, b) => b.n.length - a.n.length)[0];
      if (hit) candidates.push({ ...group, matchedAlias: hit.raw, _len: hit.n.length });
    });

    candidates.sort((a, b) => b._len - a._len);
    const out = [];
    candidates.forEach(group => {
      const c = norm(group.canonical);
      const redundant = out.some(existing => {
        const e = norm(existing.canonical);
        return e.includes(c) && e !== c;
      });
      if (!redundant) out.push(group);
    });
    return out;
  }

  function matchedNamedGroups(queryNorm, list) {
    return list.filter(group => group.variants.some(v => {
      const n = norm(v);
      return n && queryNorm.includes(n);
    }));
  }

  function removeKnownPhrases(queryNorm, topics, aliasMatches, intentMatches) {
    let rest = queryNorm;
    const phrases = [];
    topics.forEach(g => g.aliases.forEach(x => phrases.push(norm(x))));
    aliasMatches.forEach(g => g.variants.forEach(x => phrases.push(norm(x))));
    intentMatches.forEach(g => g.variants.forEach(x => phrases.push(norm(x))));
    stopWords.forEach(x => phrases.push(x));

    uniq(phrases).sort((a, b) => b.length - a.length).forEach(p => {
      if (p && rest.includes(p)) rest = rest.split(p).join('');
    });
    return rest;
  }

  function residualNgrams(rest) {
    if (!rest || rest.length < 2) return [];
    const grams = [];
    const maxLen = Math.min(4, rest.length);
    for (let len = maxLen; len >= 2; len--) {
      for (let i = 0; i <= rest.length - len; i++) {
        const g = rest.slice(i, i + len);
        if (!stopWords.includes(g)) grams.push(g);
      }
    }
    return uniq(grams).slice(0, 20);
  }

  function conceptMatch(fields, variants, includeIntent = false) {
    const v = uniq(variants).map(norm).filter(Boolean);
    const m = {
      question: containsAny(fields.question, v),
      keywords: containsAny(fields.keywords, v),
      aliases: containsAny(fields.aliases, v),
      summary: containsAny(fields.summary, v),
      answer: containsAny(fields.answer, v),
      legal: containsAny(fields.legal, v),
      category: containsAny(fields.category, v),
      intent: false
    };
    if (includeIntent) m.intent = fields.intents.some(x => v.includes(x));
    return m;
  }

  function weightedMatch(match, weights) {
    let s = 0;
    Object.keys(weights).forEach(k => { if (match[k]) s += weights[k] || 0; });
    return s;
  }

  function bigrams(s) {
    const n = norm(s);
    if (n.length < 2) return n ? [n] : [];
    const out = [];
    for (let i = 0; i < n.length - 1; i++) out.push(n.slice(i, i + 2));
    return out;
  }

  function diceSimilarity(a, b) {
    const aa = bigrams(a), bb = bigrams(b);
    if (!aa.length || !bb.length) return 0;
    const counts = new Map();
    bb.forEach(x => counts.set(x, (counts.get(x) || 0) + 1));
    let hit = 0;
    aa.forEach(x => {
      const c = counts.get(x) || 0;
      if (c > 0) { hit++; counts.set(x, c - 1); }
    });
    return (2 * hit) / (aa.length + bb.length);
  }

  function queryBigramCoverage(query, candidate) {
    const q = uniq(bigrams(query));
    if (!q.length) return 0;
    const c = new Set(bigrams(candidate));
    return q.filter(x => c.has(x)).length / q.length;
  }

  function candidateIntentScore(fields, queryIntents) {
    if (!queryIntents.length) return 0;
    let s = 0;
    const itemIntents = new Set(fields.intents);
    const queryNames = new Set(queryIntents.map(g => norm(g.canonical)));

    // 直接使用 questionBank.js 已標記的 intent，是候選排序的主要依據。
    queryNames.forEach(n => {
      if (itemIntents.has(n)) s += 72;
    });

    const apply = norm('申請');
    const repeat = norm('重複申請');
    const docs = norm('文件');
    const notice = norm('通知');
    const definition = norm('定義');
    const qualification = norm('資格');

    // 「申請」是很泛的意圖。若使用者沒有問「再申請／已申請過」，
    // 不讓重複申請、通知、定義等子題因為也含「申請」而壓過真正的申辦方式題。
    if (queryNames.has(apply) && !queryNames.has(repeat)) {
      if (itemIntents.has(repeat)) s -= 190;
      if (itemIntents.has(docs)) s += 88;
      if (itemIntents.has(notice) && !itemIntents.has(docs)) s -= 38;
      if (itemIntents.has(definition) && !itemIntents.has(docs)) s -= 28;
      if (itemIntents.has(qualification) && !itemIntents.has(docs)) s -= 16;

      // 這是通用問句結構，不涉及任何特定稅務主題。
      if (/^(如何申請|怎麼申請|如何申辦|怎麼申辦|如何辦理)/.test(fields.question)) s += 115;
      if (/應準備|應備|哪些文件|什麼文件/.test(fields.question)) s += 42;
    }

    if (queryNames.has(repeat)) {
      if (itemIntents.has(repeat)) s += 145;
      else s -= 35;
    }

    // 查詢同時帶有更具體意圖（文件、資格、通知...），命中該意圖再加分。
    const specific = [...queryNames].filter(x => x !== apply && x !== repeat);
    if (specific.length && specific.some(x => itemIntents.has(x))) s += 28;
    return s;
  }

  function score(item, rawQuery) {
    const q = norm(rawQuery);
    if (!q) return { score: 0, topicHit: true, coverage: 0 };

    const fields = fieldText(item);
    const topics = matchedTopics(q);
    const aliasMatches = matchedNamedGroups(q, groups.aliasGroups);
    const intentMatches = matchedNamedGroups(q, groups.intentGroups);
    const rest = removeKnownPhrases(q, topics, aliasMatches, intentMatches);
    const residuals = residualNgrams(rest);

    let s = 0;
    let matchedConcepts = 0;
    let totalConcepts = 0;

    // A. 完整片語命中。
    if (fields.question.includes(q)) s += 120;
    if (fields.keywords.includes(q)) s += 82;
    if (fields.aliases.includes(q)) s += 76;
    if (fields.summary.includes(q)) s += 68;
    if (fields.answer.includes(q)) s += 24;

    // B. 專業主題優先。
    let topicHitCount = 0;
    topics.forEach(topic => {
      totalConcepts++;
      const m = conceptMatch(fields, topic.aliases);
      const hit = m.question || m.keywords || m.aliases || m.summary || m.category;
      if (hit) { matchedConcepts++; topicHitCount++; }
      s += weightedMatch(m, {
        question: 100,
        keywords: 82,
        aliases: 74,
        summary: 66,
        category: 55,
        answer: 20,
        legal: 6
      });
    });

    // C. 查詢意圖；questionBank.js 的 item.intent 是主要依據。
    s += candidateIntentScore(fields, intentMatches);
    intentMatches.forEach(group => {
      totalConcepts++;
      const m = conceptMatch(fields, group.variants, true);
      const hit = m.intent || m.question || m.keywords || m.aliases || m.summary;
      if (hit) matchedConcepts++;
      s += weightedMatch(m, {
        intent: 88,
        question: 45,
        keywords: 30,
        aliases: 24,
        summary: 28,
        answer: 8
      });
    });

    // D. 全域同義詞／口語詞。
    aliasMatches.forEach(group => {
      totalConcepts++;
      const m = conceptMatch(fields, group.variants);
      const hit = m.question || m.keywords || m.aliases || m.summary || m.category;
      if (hit) matchedConcepts++;
      s += weightedMatch(m, {
        question: 34,
        keywords: 30,
        aliases: 32,
        summary: 23,
        category: 14,
        answer: 7
      });
    });

    // E. 題目自身 aliases 對使用者原查詢直接命中時加分。
    // 這使每題可有自己的自然問法，而 search.js 不必知道其內容。
    const itemAliases = arr(item.aliases).map(norm).filter(Boolean);
    itemAliases.forEach(a => {
      if (a && q.includes(a)) s += Math.min(28, 8 + a.length * 2);
    });

    // F. 未辨識的剩餘片段，僅低權重輔助。
    let residualHit = false;
    residuals.forEach(term => {
      const m = conceptMatch(fields, [term]);
      if (m.question || m.keywords || m.aliases || m.summary) residualHit = true;
      s += weightedMatch(m, {
        question: 7,
        keywords: 5,
        aliases: 5,
        summary: 4,
        answer: 1
      });
    });
    if (residuals.length) {
      totalConcepts++;
      if (residualHit) matchedConcepts++;
    }

    // G. 概念涵蓋率。
    const coverage = totalConcepts ? matchedConcepts / totalConcepts : 0;
    s += Math.round(coverage * 58);
    if (totalConcepts >= 2 && coverage === 1) s += 24;

    // H. 有明確主題時，未命中主題者大幅降權。
    const topicHit = topics.length === 0 || topicHitCount === topics.length;
    if (!topicHit) s *= 0.06;

    // I. 模糊比對只作小幅補助。
    const primaryText = `${fields.question}${fields.summary}${fields.keywords}${fields.aliases}`;
    const qCoverage = queryBigramCoverage(q, primaryText);
    const dice = diceSimilarity(q, fields.question);
    if (qCoverage >= 0.8) s += 16;
    else if (qCoverage >= 0.65) s += 9;
    else if (qCoverage >= 0.5) s += 4;
    if (dice >= 0.55) s += 6;

    return {
      score: Math.round(s * 100) / 100,
      topicHit,
      coverage
    };
  }

  function search(bank, q, category = '全部') {
    const list = Array.isArray(bank) ? bank : [];
    const filtered = category === '全部' ? list : list.filter(x => x.category === category);
    const raw = String(q || '').trim();
    if (!raw) return filtered.map(x => ({ ...x, _score: 0 }));

    const hasExplicitTopic = matchedTopics(norm(raw)).length > 0;

    return filtered
      .map(item => {
        const detail = score(item, raw);
        return { ...item, _score: detail.score, _topicHit: detail.topicHit };
      })
      .filter(x => (!hasExplicitTopic || x._topicHit) && x._score >= 10)
      .sort((a, b) => b._score - a._score || Number(a.id || 0) - Number(b.id || 0))
      .map(({ _topicHit, ...item }) => item);
  }

  return {
    search,
    norm,
    dictionaryVersion: dictionary.version || 'unknown'
  };
})();
