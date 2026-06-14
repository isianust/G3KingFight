// ============================================================
// stories.js — Story mode data for Sango Fighter
// ============================================================

/* ==========================================================
   STORY CAMPAIGNS — 故事模式戰役
   Each faction has a series of battles following historical events.
   ========================================================== */

var STORY_CAMPAIGNS = {
  // ===================== 蜀漢主線 =====================
  蜀漢: {
    title: '蜀漢傳',
    titleEn: 'Legend of Shu Han',
    description: '從桃園結義到三分天下，走過蜀漢英雄的征途',
    protagonist: 'zhaoyun',
    availableHeroes: ['guanyu', 'zhangfei', 'zhaoyun', 'machao', 'huangzhong'],
    chapters: [
      {
        id: 'shu_ch1',
        title: '第一章：黃巾之亂',
        titleEn: 'Chapter 1: Yellow Turban Rebellion',
        dialogsBefore: [
          { speaker: '旁白', text: '東漢末年，黃巾賊起，天下大亂...' },
          { speaker: '趙雲', text: '主公，黃巾賊已逼近城門！' },
          { speaker: '旁白', text: '蜀漢英雄挺身而出，討伐黃巾賊！' },
        ],
        battles: [
          {
            opponent: 'sword_soldier',
            opponentType: 'soldier',
            dialogBefore: [{ speaker: '趙雲', text: '區區小兵，看我槍法！' }],
          },
          {
            opponent: 'spear_soldier',
            opponentType: 'soldier',
            dialogBefore: [{ speaker: '趙雲', text: '再來！' }],
          },
          { opponent: 'blade_soldier', opponentType: 'soldier' },
        ],
        dialogsAfter: [
          { speaker: '趙雲', text: '黃巾賊已退，城池安全了。' },
          { speaker: '旁白', text: '蜀漢英雄初戰告捷，聲名漸起...' },
        ],
      },
      {
        id: 'shu_ch2',
        title: '第二章：虎牢關之戰',
        titleEn: 'Chapter 2: Battle of Hulao Pass',
        dialogsBefore: [
          { speaker: '旁白', text: '十八路諸侯討董卓，在虎牢關前遇到天下第一猛將...' },
          { speaker: '張飛', text: '三姓家奴！吃我一矛！' },
          { speaker: '關羽', text: '二弟莫急，我等兄弟三人齊上！' },
        ],
        battles: [
          { opponent: 'blade_soldier', opponentType: 'soldier' },
          { opponent: 'spear_soldier', opponentType: 'soldier' },
          {
            opponent: 'lvbu',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '呂布', text: '何人敢擋我去路？' },
              { speaker: '張飛', text: '燕人張飛在此！' },
            ],
            dialogAfter: [{ speaker: '旁白', text: '呂布敗退，諸侯軍士氣大振！' }],
          },
        ],
        dialogsAfter: [{ speaker: '旁白', text: '虎牢關一戰，劉關張三兄弟名震天下。' }],
      },
      {
        id: 'shu_ch3',
        title: '第三章：長坂坡',
        titleEn: 'Chapter 3: Battle of Changban',
        dialogsBefore: [
          { speaker: '旁白', text: '曹操大軍南下，劉備攜民渡江...' },
          { speaker: '趙雲', text: '主公家眷還在敵陣中！我去救！' },
          { speaker: '旁白', text: '趙子龍單騎救主，七進七出曹軍大營！' },
        ],
        battles: [
          { opponent: 'sword_soldier', opponentType: 'soldier' },
          { opponent: 'blade_soldier', opponentType: 'soldier' },
          { opponent: 'spear_soldier', opponentType: 'soldier' },
          {
            opponent: 'xiahouyuan',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '夏侯淵', text: '趙雲！你逃不出去了！' },
              { speaker: '趙雲', text: '子龍在此，誰敢攔我！' },
            ],
          },
          {
            opponent: 'xuchu',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '許褚', text: '看我虎癡之力！' },
              { speaker: '趙雲', text: '為了主公，誰來我都不怕！' },
            ],
          },
        ],
        dialogsAfter: [
          { speaker: '旁白', text: '趙雲懷抱幼主，殺出重圍，從此「常山趙子龍」之名威震天下！' },
        ],
      },
      {
        id: 'shu_ch4',
        title: '第四章：赤壁之戰',
        titleEn: 'Chapter 4: Battle of Red Cliff',
        dialogsBefore: [
          { speaker: '旁白', text: '孫劉聯軍在赤壁對抗曹操八十萬大軍...' },
          { speaker: '關羽', text: '華容道上，我來守住退路！' },
        ],
        battles: [
          { opponent: 'blade_soldier', opponentType: 'soldier' },
          { opponent: 'spear_soldier', opponentType: 'soldier' },
          {
            opponent: 'caocao',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '曹操', text: '雲長...念在昔日之情...' },
              { speaker: '關羽', text: '丞相...今日華容道，我義釋你！但下不為例！' },
            ],
            dialogAfter: [{ speaker: '旁白', text: '關羽義釋曹操，赤壁之戰以孫劉聯軍大勝告終。' }],
          },
        ],
        dialogsAfter: [{ speaker: '旁白', text: '赤壁大捷！曹操北歸，三分天下之勢已成。' }],
      },
      {
        id: 'shu_ch5',
        title: '第五章：定軍山',
        titleEn: 'Chapter 5: Battle of Mount Dingjun',
        dialogsBefore: [
          { speaker: '旁白', text: '劉備進軍漢中，與曹魏爭奪天下...' },
          { speaker: '黃忠', text: '老夫雖年邁，報國之心未減！' },
        ],
        battles: [
          { opponent: 'spear_soldier', opponentType: 'soldier' },
          { opponent: 'archer_soldier', opponentType: 'soldier' },
          {
            opponent: 'xuhuang',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '徐晃', text: '黃忠老匹夫，受死！' },
              { speaker: '黃忠', text: '年齡算什麼！看招！' },
            ],
          },
          {
            opponent: 'xiahouyuan',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '夏侯淵', text: '來犯者死！' },
              { speaker: '黃忠', text: '定軍山上，你命休矣！' },
            ],
            dialogAfter: [{ speaker: '旁白', text: '黃忠斬夏侯淵於定軍山下，漢中之戰大勝！' }],
          },
        ],
        dialogsAfter: [{ speaker: '旁白', text: '劉備奪取漢中，自稱漢中王，蜀漢基業已定！' }],
      },
    ],
  },

  // ===================== 曹魏主線 =====================
  曹魏: {
    title: '曹魏傳',
    titleEn: 'Legend of Cao Wei',
    description: '從刺殺董卓到統一北方，走過曹魏的霸業之路',
    protagonist: 'caocao',
    availableHeroes: ['caocao', 'xiahoudun', 'xiahouyuan', 'xuhuang', 'xuchu', 'dianwei'],
    chapters: [
      {
        id: 'wei_ch1',
        title: '第一章：刺殺董卓',
        titleEn: 'Chapter 1: Assassination of Dong Zhuo',
        dialogsBefore: [
          { speaker: '旁白', text: '董卓亂政，曹操決意行刺...' },
          { speaker: '曹操', text: '國賊當道，吾當以身殉國！' },
        ],
        battles: [
          { opponent: 'sword_soldier', opponentType: 'soldier' },
          { opponent: 'blade_soldier', opponentType: 'soldier' },
          {
            opponent: 'dongzhuo',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '董卓', text: '大膽！竟敢行刺本太師！' },
              { speaker: '曹操', text: '為天下蒼生，今日必除你！' },
            ],
            dialogAfter: [{ speaker: '旁白', text: '曹操刺殺未成，但已展露了他的雄心壯志。' }],
          },
        ],
        dialogsAfter: [{ speaker: '旁白', text: '曹操逃離洛陽，開始了他統一北方的征途。' }],
      },
      {
        id: 'wei_ch2',
        title: '第二章：濮陽之戰',
        titleEn: 'Chapter 2: Battle of Puyang',
        dialogsBefore: [
          { speaker: '旁白', text: '曹操與呂布爭奪兗州，在濮陽展開激戰...' },
          { speaker: '典韋', text: '主公放心，有我在，誰也近不了身！' },
        ],
        battles: [
          { opponent: 'spear_soldier', opponentType: 'soldier' },
          { opponent: 'blade_soldier', opponentType: 'soldier' },
          {
            opponent: 'lvbu',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '呂布', text: '曹操，今日便是你的死期！' },
              { speaker: '典韋', text: '想傷主公，先過我這關！' },
            ],
            dialogAfter: [{ speaker: '旁白', text: '典韋捨命護主，曹操安全撤退。' }],
          },
        ],
        dialogsAfter: [
          { speaker: '曹操', text: '典韋之勇，天下無雙！' },
          { speaker: '旁白', text: '曹操雖敗猶榮，更加堅定了統一天下的決心。' },
        ],
      },
      {
        id: 'wei_ch3',
        title: '第三章：官渡之戰',
        titleEn: 'Chapter 3: Battle of Guandu',
        dialogsBefore: [
          { speaker: '旁白', text: '曹操以少勝多，對抗袁紹百萬大軍...' },
          { speaker: '曹操', text: '兵不在多而在精！今日便讓袁紹知道！' },
        ],
        battles: [
          { opponent: 'spear_soldier', opponentType: 'soldier' },
          { opponent: 'archer_soldier', opponentType: 'soldier' },
          { opponent: 'blade_soldier', opponentType: 'soldier' },
          {
            opponent: 'yuanshao',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '袁紹', text: '曹阿瞞！你怎敢以弱抗強！' },
              { speaker: '曹操', text: '本初兄，勝敗不在兵多寡，在用兵之人！' },
            ],
            dialogAfter: [{ speaker: '曹操', text: '袁紹已敗，北方即將統一！' }],
          },
        ],
        dialogsAfter: [{ speaker: '旁白', text: '官渡大捷！曹操以寡擊眾，奠定了統一北方的基礎。' }],
      },
      {
        id: 'wei_ch4',
        title: '第四章：北征烏桓',
        titleEn: 'Chapter 4: Northern Campaign',
        dialogsBefore: [
          { speaker: '旁白', text: '曹操北征烏桓，掃除袁氏殘餘勢力...' },
          { speaker: '夏侯惇', text: '主公，敵軍已在前方列陣！' },
          { speaker: '曹操', text: '全軍出擊，一舉平定北方！' },
        ],
        battles: [
          { opponent: 'sword_soldier', opponentType: 'soldier' },
          { opponent: 'spear_soldier', opponentType: 'soldier' },
          { opponent: 'archer_soldier', opponentType: 'soldier' },
          { opponent: 'blade_soldier', opponentType: 'soldier' },
        ],
        dialogsAfter: [
          { speaker: '旁白', text: '曹操平定北方，統一了大半個中國，成為天下最強大的勢力。' },
          { speaker: '曹操', text: '北方已定，接下來...是南方！' },
        ],
      },
      {
        id: 'wei_ch5',
        title: '第五章：赤壁之戰',
        titleEn: 'Chapter 5: Battle of Red Cliff',
        dialogsBefore: [
          { speaker: '旁白', text: '曹操率八十萬大軍南下，孫劉聯軍在赤壁迎戰...' },
          { speaker: '曹操', text: '吾率百萬之眾，天下誰能擋我！' },
          { speaker: '夏侯惇', text: '主公小心，周瑜詭計多端！' },
        ],
        battles: [
          { opponent: 'sword_soldier', opponentType: 'soldier' },
          { opponent: 'spear_soldier', opponentType: 'soldier' },
          {
            opponent: 'huanggai',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '黃蓋', text: '曹丞相，老夫特來投降...' },
              { speaker: '曹操', text: '黃蓋？來得好！' },
            ],
          },
          {
            opponent: 'zhouyu',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '周瑜', text: '曹賊！赤壁將成你的葬身之地！' },
              { speaker: '曹操', text: '周瑜小兒，看我天下之威！' },
            ],
            dialogAfter: [{ speaker: '旁白', text: '赤壁大火起，曹軍損失慘重...' }],
          },
        ],
        dialogsAfter: [
          {
            speaker: '旁白',
            text: '赤壁之敗讓曹操損失慘重，但北方根基穩固。三分天下的格局就此形成。',
          },
          { speaker: '曹操', text: '可惜...可惜！終有一日我會捲土重來！' },
        ],
      },
    ],
  },

  // ===================== 孫吳主線 =====================
  孫吳: {
    title: '孫吳傳',
    titleEn: 'Legend of Sun Wu',
    description: '從江東起兵到赤壁大捷，走過孫吳的建國之路',
    protagonist: 'sunce',
    availableHeroes: ['sunjian', 'sunce', 'zhouyu', 'taishici', 'ganning', 'huanggai'],
    chapters: [
      {
        id: 'wu_ch1',
        title: '第一章：孫堅起兵',
        titleEn: 'Chapter 1: Sun Jian Takes Arms',
        dialogsBefore: [
          { speaker: '旁白', text: '黃巾之亂平定後，孫堅投身討董聯軍...' },
          { speaker: '孫堅', text: '江東猛虎在此！董賊休想逃！' },
        ],
        battles: [
          { opponent: 'sword_soldier', opponentType: 'soldier' },
          { opponent: 'blade_soldier', opponentType: 'soldier' },
          { opponent: 'spear_soldier', opponentType: 'soldier' },
          {
            opponent: 'dongzhuo',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '董卓', text: '孫堅！你敢與我為敵！' },
              { speaker: '孫堅', text: '國賊！看我古錠刀！' },
            ],
            dialogAfter: [{ speaker: '旁白', text: '孫堅大破董卓軍，攻入洛陽。' }],
          },
        ],
        dialogsAfter: [
          { speaker: '旁白', text: '孫堅攻入洛陽，得到傳國玉璽。江東基業由此開始。' },
          { speaker: '孫堅', text: '此玉璽...是天意要我孫家稱帝嗎...' },
        ],
      },
      {
        id: 'wu_ch2',
        title: '第二章：小霸王孫策',
        titleEn: 'Chapter 2: Little Conqueror Sun Ce',
        dialogsBefore: [
          { speaker: '旁白', text: '孫堅戰死後，孫策繼承父業，決心平定江東...' },
          { speaker: '孫策', text: '父親的遺志，由我來完成！江東必定統一！' },
          { speaker: '周瑜', text: '伯符兄，我與你共創大業！' },
        ],
        battles: [
          { opponent: 'sword_soldier', opponentType: 'soldier' },
          { opponent: 'spear_soldier', opponentType: 'soldier' },
          {
            opponent: 'taishici',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '太史慈', text: '來者何人？竟敢犯我神亭！' },
              { speaker: '孫策', text: '我乃孫策！願與你一決高下！' },
            ],
            dialogAfter: [
              { speaker: '孫策', text: '太史慈，你武藝高強！何不歸順於我？' },
              { speaker: '太史慈', text: '孫將軍英雄氣概，我願追隨！' },
            ],
          },
        ],
        dialogsAfter: [{ speaker: '旁白', text: '孫策收服太史慈，江東勢力日漸壯大。' }],
      },
      {
        id: 'wu_ch3',
        title: '第三章：統一江東',
        titleEn: 'Chapter 3: Unifying Jiangdong',
        dialogsBefore: [
          { speaker: '旁白', text: '孫策率軍掃平江東各地割據勢力...' },
          { speaker: '孫策', text: '江東之地，盡歸我孫家！' },
        ],
        battles: [
          { opponent: 'blade_soldier', opponentType: 'soldier' },
          { opponent: 'spear_soldier', opponentType: 'soldier' },
          { opponent: 'archer_soldier', opponentType: 'soldier' },
          { opponent: 'sword_soldier', opponentType: 'soldier' },
        ],
        dialogsAfter: [
          { speaker: '旁白', text: '孫策統一江東六郡，人稱「小霸王」。可惜天妒英才...' },
          { speaker: '孫策', text: '公瑾...江東...就託付給仲謀了...' },
          { speaker: '周瑜', text: '伯符！...我定不負你所託！' },
        ],
      },
      {
        id: 'wu_ch4',
        title: '第四章：赤壁之戰',
        titleEn: 'Chapter 4: Battle of Red Cliff',
        dialogsBefore: [
          { speaker: '旁白', text: '曹操百萬大軍南下，東吳存亡在此一戰...' },
          { speaker: '周瑜', text: '曹賊雖眾，我有良策！黃蓋！' },
          { speaker: '黃蓋', text: '都督放心，苦肉計已準備好了！' },
          { speaker: '甘寧', text: '我去百騎劫營，打他個措手不及！' },
        ],
        battles: [
          { opponent: 'blade_soldier', opponentType: 'soldier' },
          { opponent: 'spear_soldier', opponentType: 'soldier' },
          {
            opponent: 'xuchu',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '許褚', text: '東吳小兒，看我虎癡之力！' },
              { speaker: '甘寧', text: '鈴鐺一響，取你性命！' },
            ],
          },
          {
            opponent: 'caocao',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '曹操', text: '東風...怎會...可惡！' },
              { speaker: '周瑜', text: '曹賊！赤壁之火，為你而燃！' },
            ],
            dialogAfter: [{ speaker: '旁白', text: '赤壁大火燒盡曹軍連環戰船，大勝！' }],
          },
        ],
        dialogsAfter: [
          { speaker: '旁白', text: '赤壁大捷！東吳保住江東基業，三分天下之勢已定。' },
          { speaker: '周瑜', text: '此戰之後，曹賊再也無力南侵！' },
        ],
      },
      {
        id: 'wu_ch5',
        title: '第五章：夷陵之戰',
        titleEn: 'Chapter 5: Battle of Yiling',
        dialogsBefore: [
          { speaker: '旁白', text: '關羽被殺後，劉備舉全國之兵伐吳...' },
          { speaker: '旁白', text: '東吳面臨蜀漢大軍的猛攻...' },
        ],
        battles: [
          { opponent: 'spear_soldier', opponentType: 'soldier' },
          { opponent: 'sword_soldier', opponentType: 'soldier' },
          {
            opponent: 'zhangfei',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '張飛', text: '為二哥報仇！東吳鼠輩受死！' },
              { speaker: '甘寧', text: '張飛，今日之仇今日了！' },
            ],
          },
          {
            opponent: 'zhaoyun',
            opponentType: 'character',
            dialogBefore: [
              { speaker: '趙雲', text: '常山趙子龍在此！' },
              { speaker: '太史慈', text: '趙雲！且看我箭法！' },
            ],
          },
        ],
        dialogsAfter: [
          {
            speaker: '旁白',
            text: '夷陵之戰以東吳大勝告終，蜀漢元氣大傷。三國鼎立的格局更加穩固。',
          },
        ],
      },
    ],
  },
};
