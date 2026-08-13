/**
 * Tax智慧通 - 搜尋語意字典
 *
 * 職責：
 * 1. 定義全域同義詞／簡稱（aliasGroups）。
 * 2. 定義常見查詢意圖（intentGroups）。
 * 3. 定義專業主題及其常見簡稱（topicGroups）。
 *
 * 注意：
 * - 這個檔案放「整個題庫共用的語言規則」，不要放單一題目的答案內容。
 * - 題庫轉檔工具會讀取本檔，依 Excel 的問題、摘要、關鍵字，自動產生 aliases 與 intent。
 * - 後續 search.js 也可以共用同一份字典，避免規則分散。
 */
window.TaxSearchDictionary = {
  version: '2026-08-13-v1',

  // canonical：正式／代表詞；aliases：使用者可能輸入的口語、簡稱或同義詞。
  aliasGroups: [
    { canonical: '出租', aliases: ['租屋', '房東', '租給', '租賃'] },
    { canonical: '自用', aliases: ['自住', '自己住', '設籍'] },
    { canonical: '身心障礙', aliases: ['身障', '殘障'] },
    { canonical: '使用牌照稅', aliases: ['牌照稅', '牌照'] },
    { canonical: '車輛', aliases: ['車子', '汽車'] },
    { canonical: '繳款書', aliases: ['稅單', '補單'] },
    { canonical: '分期繳納', aliases: ['分期', '分期繳稅'] },
    { canonical: '延期繳納', aliases: ['延期', '延繳'] },
    { canonical: '房屋', aliases: ['房子', '住宅'] },
    { canonical: '土地', aliases: ['地價'] },
    { canonical: '繳納證明', aliases: ['繳稅證明', '繳款證明'] },
    { canonical: '課稅明細', aliases: ['課稅資料', '稅籍明細'] },
    { canonical: '復查', aliases: ['行政救濟', '不服', '申訴'] },
    { canonical: '繳稅', aliases: ['繳款', '付款', '稅款繳納'] },
    { canonical: '遺產', aliases: ['繼承', '被繼承人'] },
    { canonical: '娃娃機', aliases: ['選物販賣機', '夾娃娃機'] },
    { canonical: '線上', aliases: ['網路', '網路申辦', '線上申辦', '線上申請'] },
    { canonical: '臨櫃', aliases: ['現場', '到場', '櫃台'] },
    { canonical: '申請', aliases: ['申辦', '辦理'] },
    { canonical: '應備文件', aliases: ['文件', '資料', '證件', '檢附文件', '應備資料'] },
    { canonical: '資格', aliases: ['條件', '適用資格', '申請資格'] },
    { canonical: '期限', aliases: ['截止日', '申請期限', '繳納期限', '申報期限'] },
    { canonical: '通知', aliases: ['訊息', '簡訊', '寄發通知'] },
    { canonical: '查詢', aliases: ['查', '查進度', '查紀錄'] },
    { canonical: '變更', aliases: ['更正', '修改'] },
    { canonical: '撤銷', aliases: ['取消', '解除'] },
    { canonical: '退稅', aliases: ['退還', '溢繳退稅', '退回稅款'] },

    // 專業主題的全域簡稱／常見錯字。
    { canonical: '房屋稅差別稅率2.0', aliases: ['差別稅率2.0'] },
    { canonical: '稅籍異動即時通', aliases: ['即時通', '異動即時通', '稅籍即時通', '稅藉異動即時通'] },
    { canonical: '自用住宅用地', aliases: ['自用住宅', '自住用地'] },
    { canonical: '公益出租人', aliases: ['公益出租'] },
    { canonical: '土地增值稅', aliases: ['土增稅'] },
    { canonical: '使用牌照稅', aliases: ['牌照稅'] },
    { canonical: '納稅者權利保護', aliases: ['納保'] },
    { canonical: 'PAY.TAIPEI', aliases: ['PAYTAIPEI'] }
  ],

  // intent 是「這一題主要回答哪一種問題」。
  // triggers 可出現在問題、摘要或關鍵字中；轉檔時會自動判斷。
  intentGroups: [
    { intent: '重複申請', triggers: ['再申請', '重新申請', '還要再申請', '申請過', '已經申請', '免重複申請'] },
    { intent: '申請', triggers: ['申請', '申辦', '辦理', '怎麼辦', '如何辦', '怎麼申請', '如何申請', '怎麼申辦', '如何申辦'] },
    { intent: '文件', triggers: ['文件', '資料', '證件', '應備', '應備文件', '要帶什麼', '帶什麼', '準備什麼', '要準備什麼', '檢附'] },
    { intent: '資格', triggers: ['資格', '條件', '符合', '適用', '可以嗎', '可不可以', '能不能', '是否可以', '誰可以'] },
    { intent: '期限', triggers: ['期限', '截止', '何時', '什麼時候', '幾號', '多久', '期間', '申請期限', '繳納期間'] },
    { intent: '費用', triggers: ['費用', '收費', '手續費', '多少錢', '免費'] },
    { intent: '稅率', triggers: ['稅率', '幾趴', '百分之', '課徵率'] },
    { intent: '金額', triggers: ['金額', '多少', '限額', '上限', '免稅額', '稅額'] },
    { intent: '定義', triggers: ['什麼是', '何謂', '是什麼', '意思', '定義'] },
    { intent: '通知', triggers: ['通知', '訊息', '簡訊', '寄發', '收到通知', '會通知'] },
    { intent: '查詢', triggers: ['查詢', '查', '進度', '紀錄', '哪裡查', '怎麼查'] },
    { intent: '變更', triggers: ['變更', '更正', '修改', '改成', '改按'] },
    { intent: '撤銷', triggers: ['撤銷', '取消', '解除'] },
    { intent: '退稅', triggers: ['退稅', '退還', '溢繳', '退回'] },
    { intent: '補救', triggers: ['補救', '逾期', '過期', '來不及', '忘了'] },
    { intent: '繳納', triggers: ['繳納', '繳稅', '繳款', '付款', '怎麼繳', '如何繳'] },
    { intent: '免稅', triggers: ['免稅', '免徵', '減免'] },
    { intent: '處罰', triggers: ['處罰', '罰鍰', '裁罰'] }
  ],

  // 主題詞清單供後續 search.js 使用；轉檔工具也可利用它補主題 aliases。
  topicGroups: [
    { canonical: '房屋稅差別稅率2.0', aliases: ['差別稅率2.0'] },
    { canonical: '臺北市分期繳納地方稅申請辦法', aliases: [] },
    { canonical: '稅籍異動即時通', aliases: ['即時通', '異動即時通', '稅籍即時通', '稅藉異動即時通'] },
    { canonical: '自用住宅用地', aliases: ['自用住宅', '自住用地'] },
    { canonical: '公益出租人', aliases: ['公益出租'] },
    { canonical: '一生一屋', aliases: [] },
    { canonical: '一生一次', aliases: [] },
    { canonical: '重購退稅', aliases: [] },
    { canonical: '使用牌照稅', aliases: ['牌照稅'] },
    { canonical: '土地增值稅', aliases: ['土增稅'] },
    { canonical: '電子繳款書', aliases: [] },
    { canonical: '電子繳納證明', aliases: [] },
    { canonical: '金融遺產', aliases: [] },
    { canonical: '雲端發票', aliases: [] },
    { canonical: '行動支付', aliases: [] },
    { canonical: '電子支付', aliases: [] },
    { canonical: '自然人憑證', aliases: [] },
    { canonical: '房屋稅', aliases: [] },
    { canonical: '地價稅', aliases: [] },
    { canonical: '契稅', aliases: [] },
    { canonical: '娛樂稅', aliases: [] },
    { canonical: '印花稅', aliases: [] },
    { canonical: '納保官', aliases: [] },
    { canonical: '行政救濟', aliases: [] },
    { canonical: '納稅者權利保護', aliases: ['納保'] },
    { canonical: '分期繳納', aliases: ['分期'] },
    { canonical: '延期繳納', aliases: ['延期', '延繳'] },
    { canonical: '繳納證明', aliases: [] },
    { canonical: '課稅明細', aliases: [] },
    { canonical: '豪宅稅', aliases: [] },
    { canonical: '高級住宅', aliases: [] },
    { canonical: 'PAY.TAIPEI', aliases: ['PAYTAIPEI'] },
    { canonical: 'KIOSK', aliases: [] }
  ]
};
