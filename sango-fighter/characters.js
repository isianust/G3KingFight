// ============================================================
// characters.js — Character roster, moves, soldiers for Sango Fighter
// ============================================================

/* ==========================================================
   Special Move Types
   ========================================================== */
const MOVE_TYPE = {
  PROJECTILE: 'projectile',   // 飛行道具
  RUSH: 'rush',               // 衝刺攻擊
  UPPERCUT: 'uppercut',       // 上挑/升龍
  SPIN: 'spin',               // 旋轉攻擊
  AREA: 'area',               // 範圍攻擊
  COUNTER: 'counter',         // 反擊技
  BUFF: 'buff',               // 增益
  GRAB: 'grab',               // 擒拿
  MULTI: 'multi',             // 連擊
  SLAM: 'slam'                // 下砸
};

/* ==========================================================
   Command Input Patterns
   (directions relative to facing: F=forward, B=back, D=down, U=up)
   ========================================================== */
const CMD = {
  QCF: ['D', 'DF', 'F'],           // ↓↘→  quarter circle forward
  QCB: ['D', 'DB', 'B'],           // ↓↙←  quarter circle back
  DPF: ['F', 'D', 'DF'],           // →↓↘  dragon punch forward
  HCF: ['B', 'DB', 'D', 'DF', 'F'], // ←↙↓↘→  half circle forward
  DD:  ['D', 'D'],                  // ↓↓  double down
  FF:  ['F', 'F'],                  // →→  double forward
  CHARGE_BF: ['B_HOLD', 'F'],      // ←(蓄)→ charge back then forward
  CHARGE_DU: ['D_HOLD', 'U']       // ↓(蓄)↑ charge down then up
};

/* ==========================================================
   CHARACTER ROSTER — 完整角色列表
   ========================================================== */
const CHARACTER_ROSTER = [
  // ===================== 蜀漢 =====================
  {
    id: 'guanyu', name: '關羽', nameEn: 'Guan Yu',
    faction: '蜀漢', color: '#22aa44', weapon: '青龍偃月刀',
    stats: { atk: 8, def: 7, spd: 5 },
    moves: [
      { name: '青龍出海', nameEn: 'Azure Dragon Rising', type: MOVE_TYPE.PROJECTILE, command: CMD.QCF, button: 'attack', damage: 18, energyCost: 15, description: '揮動青龍偃月刀釋出刀氣', color: '#44ff88' },
      { name: '拖刀計', nameEn: 'Trailing Blade', type: MOVE_TYPE.COUNTER, command: CMD.QCB, button: 'attack', damage: 22, energyCost: 20, description: '佯裝撤退後猛然反擊', color: '#88ff44' },
      { name: '春秋斬', nameEn: 'Spring-Autumn Slash', type: MOVE_TYPE.MULTI, command: CMD.DPF, button: 'attack', damage: 25, energyCost: 25, hits: 3, description: '連續三刀劈斬', color: '#66ff66' }
    ],
    ultimate: { name: '過五關斬六將', nameEn: 'Five Passes Six Generals', type: MOVE_TYPE.MULTI, damage: 60, energyCost: 100, hits: 6, description: '重現千里走單騎的絕世武藝', color: '#00ff44' }
  },
  {
    id: 'zhangfei', name: '張飛', nameEn: 'Zhang Fei',
    faction: '蜀漢', color: '#228833', weapon: '丈八蛇矛',
    stats: { atk: 9, def: 5, spd: 6 },
    moves: [
      { name: '吼聲震天', nameEn: 'Heaven-Shaking Roar', type: MOVE_TYPE.AREA, command: CMD.DD, button: 'attack', damage: 14, energyCost: 15, description: '怒吼震暈周圍敵人', color: '#ff8844' },
      { name: '蛇矛突刺', nameEn: 'Serpent Spear Thrust', type: MOVE_TYPE.RUSH, command: CMD.QCF, button: 'attack', damage: 20, energyCost: 20, description: '持矛猛力前衝突刺', color: '#ffaa44' },
      { name: '長坂怒吼', nameEn: 'Changban Fury', type: MOVE_TYPE.AREA, command: CMD.QCB, button: 'attack', damage: 28, energyCost: 30, description: '仿效長坂坡一吼退曹軍', color: '#ff6622' }
    ],
    ultimate: { name: '萬軍破陣', nameEn: 'Army Breaker', type: MOVE_TYPE.RUSH, damage: 55, energyCost: 100, description: '狂暴衝鋒撕裂一切', color: '#ff4400' }
  },
  {
    id: 'zhaoyun', name: '趙雲', nameEn: 'Zhao Yun',
    faction: '蜀漢', color: '#3399ee', weapon: '龍膽亮銀槍',
    stats: { atk: 7, def: 6, spd: 9 },
    moves: [
      { name: '龍膽突刺', nameEn: 'Dragon Gallbladder Thrust', type: MOVE_TYPE.RUSH, command: CMD.QCF, button: 'attack', damage: 16, energyCost: 15, description: '閃電般的槍術突進', color: '#44aaff' },
      { name: '翔龍斬', nameEn: 'Soaring Dragon Slash', type: MOVE_TYPE.UPPERCUT, command: CMD.DPF, button: 'attack', damage: 20, energyCost: 20, description: '以龍膽槍上挑敵人', color: '#66ccff' },
      { name: '七進七出', nameEn: 'Seven In Seven Out', type: MOVE_TYPE.MULTI, command: CMD.HCF, button: 'attack', damage: 30, energyCost: 30, hits: 7, description: '仿效長坂坡七次突圍的連擊', color: '#2288ff' }
    ],
    ultimate: { name: '一騎當千', nameEn: 'One Against Thousands', type: MOVE_TYPE.MULTI, damage: 65, energyCost: 100, hits: 10, description: '白馬銀槍縱橫百萬軍中', color: '#0066ff' }
  },
  {
    id: 'machao', name: '馬超', nameEn: 'Ma Chao',
    faction: '蜀漢', color: '#55bb55', weapon: '龍騎尖槍',
    stats: { atk: 8, def: 6, spd: 8 },
    moves: [
      { name: '西涼狂風', nameEn: 'Xiliang Wild Wind', type: MOVE_TYPE.SPIN, command: CMD.QCB, button: 'attack', damage: 18, energyCost: 15, description: '旋轉槍法捲起狂風', color: '#88dd66' },
      { name: '鐵騎衝鋒', nameEn: 'Iron Cavalry Charge', type: MOVE_TYPE.RUSH, command: CMD.FF, button: 'attack', damage: 22, energyCost: 20, description: '西涼騎兵般的高速衝鋒', color: '#66cc44' },
      { name: '天馬流星', nameEn: 'Heavenly Horse Meteor', type: MOVE_TYPE.SLAM, command: CMD.DPF, button: 'attack', damage: 26, energyCost: 25, description: '躍起後以槍重擊地面', color: '#44bb22' }
    ],
    ultimate: { name: '銀槍破甲', nameEn: 'Silver Spear Armor Breaker', type: MOVE_TYPE.MULTI, damage: 58, energyCost: 100, hits: 5, description: '狂暴連刺穿透一切防禦', color: '#22aa00' }
  },
  {
    id: 'huangzhong', name: '黃忠', nameEn: 'Huang Zhong',
    faction: '蜀漢', color: '#aa8833', weapon: '寶雕弓/斬馬刀',
    stats: { atk: 9, def: 4, spd: 4 },
    moves: [
      { name: '百步穿楊', nameEn: 'Arrow Through Willow', type: MOVE_TYPE.PROJECTILE, command: CMD.QCF, button: 'attack', damage: 20, energyCost: 15, description: '精準射出穿心之箭', color: '#ddaa44' },
      { name: '老將無敵', nameEn: 'Veteran Invincible', type: MOVE_TYPE.COUNTER, command: CMD.QCB, button: 'attack', damage: 24, energyCost: 20, description: '以老練之姿格擋後反擊', color: '#ccaa22' },
      { name: '落日斬', nameEn: 'Sunset Slash', type: MOVE_TYPE.SLAM, command: CMD.DPF, button: 'attack', damage: 28, energyCost: 25, description: '高舉刀從天而降的猛劈', color: '#bb9911' }
    ],
    ultimate: { name: '定軍山怒', nameEn: 'Fury of Mount Dingjun', type: MOVE_TYPE.AREA, damage: 62, energyCost: 100, description: '仿效定軍山斬夏侯淵的怒火', color: '#aa8800' }
  },

  // ===================== 曹魏 =====================
  {
    id: 'caocao', name: '曹操', nameEn: 'Cao Cao',
    faction: '曹魏', color: '#9944bb', weapon: '倚天劍/青釭劍',
    stats: { atk: 7, def: 7, spd: 7 },
    moves: [
      { name: '倚天劈', nameEn: 'Heavenly Sword Slash', type: MOVE_TYPE.PROJECTILE, command: CMD.QCF, button: 'attack', damage: 18, energyCost: 15, description: '以倚天劍釋出劍氣', color: '#bb66dd' },
      { name: '亂世雄心', nameEn: 'Warlord Ambition', type: MOVE_TYPE.BUFF, command: CMD.DD, button: 'attack', damage: 0, energyCost: 20, description: '短時間提升攻擊力', color: '#aa55cc', buffDuration: 300, buffMultiplier: 1.5 },
      { name: '天子令', nameEn: 'Emperor Decree', type: MOVE_TYPE.AREA, command: CMD.QCB, button: 'attack', damage: 22, energyCost: 25, description: '以帝王之威震懾四方', color: '#9944bb' }
    ],
    ultimate: { name: '挾天子令諸侯', nameEn: 'Command the Lords', type: MOVE_TYPE.MULTI, damage: 58, energyCost: 100, hits: 8, description: '藉天子之名行天下之威', color: '#7722aa' }
  },
  {
    id: 'xiahoudun', name: '夏侯惇', nameEn: 'Xiahou Dun',
    faction: '曹魏', color: '#4444cc', weapon: '碎鐵刀',
    stats: { atk: 7, def: 8, spd: 6 },
    moves: [
      { name: '拔矢啖睛', nameEn: 'Pull Arrow Eat Eye', type: MOVE_TYPE.COUNTER, command: CMD.QCB, button: 'attack', damage: 24, energyCost: 20, description: '以痛楚激發戰意的反擊', color: '#6666ff' },
      { name: '碎鐵斬', nameEn: 'Iron Breaker', type: MOVE_TYPE.SLAM, command: CMD.QCF, button: 'attack', damage: 20, energyCost: 15, description: '大刀劈碎一切', color: '#5555ee' },
      { name: '獨眼怒火', nameEn: 'One-Eye Fury', type: MOVE_TYPE.RUSH, command: CMD.DPF, button: 'attack', damage: 26, energyCost: 25, description: '怒火衝天的猛攻衝刺', color: '#4444dd' }
    ],
    ultimate: { name: '蓋世神威', nameEn: 'World-Shaking Power', type: MOVE_TYPE.MULTI, damage: 60, energyCost: 100, hits: 6, description: '獨眼戰將的極限爆發', color: '#3333cc' }
  },
  {
    id: 'xiahouyuan', name: '夏侯淵', nameEn: 'Xiahou Yuan',
    faction: '曹魏', color: '#5555dd', weapon: '鐵槍',
    stats: { atk: 7, def: 5, spd: 8 },
    moves: [
      { name: '急襲千里', nameEn: 'Thousand-Mile Raid', type: MOVE_TYPE.RUSH, command: CMD.FF, button: 'attack', damage: 18, energyCost: 15, description: '閃電般的高速突襲', color: '#7777ff' },
      { name: '虎步連斬', nameEn: 'Tiger Step Chain Slash', type: MOVE_TYPE.MULTI, command: CMD.QCF, button: 'attack', damage: 22, energyCost: 20, hits: 3, description: '虎步前進連續劈斬', color: '#6666ee' },
      { name: '定軍之箭', nameEn: 'Arrow of Dingjun', type: MOVE_TYPE.PROJECTILE, command: CMD.QCB, button: 'attack', damage: 16, energyCost: 15, description: '以強弓射出利箭', color: '#5555dd' }
    ],
    ultimate: { name: '疾風迅雷', nameEn: 'Swift Wind Rapid Thunder', type: MOVE_TYPE.RUSH, damage: 55, energyCost: 100, description: '以極速連擊化作雷霆', color: '#4444cc' }
  },
  {
    id: 'xuhuang', name: '徐晃', nameEn: 'Xu Huang',
    faction: '曹魏', color: '#6666bb', weapon: '開山大斧',
    stats: { atk: 8, def: 7, spd: 5 },
    moves: [
      { name: '開山斧', nameEn: 'Mountain-Splitting Axe', type: MOVE_TYPE.SLAM, command: CMD.DPF, button: 'attack', damage: 24, energyCost: 20, description: '以巨斧劈開大地', color: '#8888dd' },
      { name: '樊城突擊', nameEn: 'Fancheng Assault', type: MOVE_TYPE.RUSH, command: CMD.QCF, button: 'attack', damage: 20, energyCost: 15, description: '仿效樊城之戰的猛攻', color: '#7777cc' },
      { name: '鐵壁斬', nameEn: 'Iron Wall Slash', type: MOVE_TYPE.COUNTER, command: CMD.QCB, button: 'attack', damage: 22, energyCost: 20, description: '格擋後的猛力反擊', color: '#6666bb' }
    ],
    ultimate: { name: '關門捉賊', nameEn: 'Close Gate Catch Thief', type: MOVE_TYPE.GRAB, damage: 55, energyCost: 100, description: '困住敵人後的毀滅打擊', color: '#5555aa' }
  },
  {
    id: 'xuchu', name: '許褚', nameEn: 'Xu Chu',
    faction: '曹魏', color: '#7777aa', weapon: '巨錘',
    stats: { atk: 9, def: 9, spd: 3 },
    moves: [
      { name: '裸衣鬥', nameEn: 'Bare-Chested Duel', type: MOVE_TYPE.BUFF, command: CMD.DD, button: 'attack', damage: 0, energyCost: 20, description: '脫衣增加攻擊力', color: '#9999cc', buffDuration: 300, buffMultiplier: 1.6 },
      { name: '巨錘震地', nameEn: 'Giant Hammer Ground Pound', type: MOVE_TYPE.AREA, command: CMD.QCF, button: 'attack', damage: 26, energyCost: 25, description: '巨錘砸地引發震動', color: '#8888bb' },
      { name: '虎癡衝鋒', nameEn: 'Tiger Fool Charge', type: MOVE_TYPE.RUSH, command: CMD.FF, button: 'attack', damage: 22, energyCost: 20, description: '不顧一切的蠻力衝撞', color: '#7777aa' }
    ],
    ultimate: { name: '天崩地裂', nameEn: 'Heaven Collapse Earth Split', type: MOVE_TYPE.SLAM, damage: 65, energyCost: 100, description: '以天神之力將大地震碎', color: '#666699' }
  },
  {
    id: 'dianwei', name: '典韋', nameEn: 'Dian Wei',
    faction: '曹魏', color: '#888899', weapon: '雙鐵戟',
    stats: { atk: 10, def: 6, spd: 5 },
    moves: [
      { name: '雙戟旋風', nameEn: 'Twin Halberd Whirlwind', type: MOVE_TYPE.SPIN, command: CMD.QCF, button: 'attack', damage: 22, energyCost: 20, description: '旋轉雙戟形成旋風', color: '#aaaacc' },
      { name: '濮陽死戰', nameEn: 'Puyang Last Stand', type: MOVE_TYPE.COUNTER, command: CMD.QCB, button: 'attack', damage: 28, energyCost: 25, description: '以死戰之志反擊一切', color: '#9999bb' },
      { name: '鐵壁守護', nameEn: 'Iron Wall Guard', type: MOVE_TYPE.COUNTER, command: CMD.DD, button: 'attack', damage: 20, energyCost: 15, description: '堅不可摧的防禦反擊', color: '#8888aa' }
    ],
    ultimate: { name: '捨命護主', nameEn: 'Sacrifice for Lord', type: MOVE_TYPE.AREA, damage: 70, energyCost: 100, description: '燃燒生命的最強一擊（損失15%血量）', selfDamage: 15, color: '#777799' }
  },

  // ===================== 孫吳 =====================
  {
    id: 'sunjian', name: '孫堅', nameEn: 'Sun Jian',
    faction: '孫吳', color: '#ee6622', weapon: '古錠刀',
    stats: { atk: 8, def: 7, spd: 6 },
    moves: [
      { name: '江東猛虎', nameEn: 'Fierce Tiger of Jiangdong', type: MOVE_TYPE.RUSH, command: CMD.QCF, button: 'attack', damage: 20, energyCost: 15, description: '如猛虎下山般衝擊敵人', color: '#ff8844' },
      { name: '古錠刀斬', nameEn: 'Ancient Ingot Slash', type: MOVE_TYPE.SLAM, command: CMD.DPF, button: 'attack', damage: 24, energyCost: 20, description: '以古錠刀從上而下猛劈', color: '#ff7722' },
      { name: '傳國玉璽', nameEn: 'Imperial Jade Seal', type: MOVE_TYPE.BUFF, command: CMD.DD, button: 'attack', damage: 0, energyCost: 25, description: '傳國玉璽之力提升戰意', color: '#ffaa44', buffDuration: 360, buffMultiplier: 1.4 }
    ],
    ultimate: { name: '破虜將軍', nameEn: 'General Who Destroys Enemies', type: MOVE_TYPE.MULTI, damage: 60, energyCost: 100, hits: 6, description: '破虜將軍的終極猛攻', color: '#ee5500' }
  },
  {
    id: 'sunce', name: '孫策', nameEn: 'Sun Ce',
    faction: '孫吳', color: '#ff8833', weapon: '霸王槍',
    stats: { atk: 8, def: 6, spd: 8 },
    moves: [
      { name: '小霸王衝鋒', nameEn: 'Little Conqueror Charge', type: MOVE_TYPE.RUSH, command: CMD.FF, button: 'attack', damage: 18, energyCost: 15, description: '小霸王的無畏衝鋒', color: '#ffaa55' },
      { name: '霸王槍法', nameEn: 'Conqueror Spear Art', type: MOVE_TYPE.MULTI, command: CMD.QCF, button: 'attack', damage: 24, energyCost: 20, hits: 3, description: '霸王級的連續槍擊', color: '#ff9944' },
      { name: '江東雄風', nameEn: 'Jiangdong Heroic Wind', type: MOVE_TYPE.AREA, command: CMD.QCB, button: 'attack', damage: 22, energyCost: 25, description: '捲起江東大地的雄風', color: '#ff8833' }
    ],
    ultimate: { name: '神亭之戰', nameEn: 'Battle of Shenting', type: MOVE_TYPE.MULTI, damage: 62, energyCost: 100, hits: 8, description: '重現與太史慈決戰的氣魄', color: '#ff7711' }
  },
  {
    id: 'zhouyu', name: '周瑜', nameEn: 'Zhou Yu',
    faction: '孫吳', color: '#dd4444', weapon: '古錠刀/火計',
    stats: { atk: 7, def: 6, spd: 7 },
    moves: [
      { name: '赤壁之火', nameEn: 'Fire of Red Cliff', type: MOVE_TYPE.PROJECTILE, command: CMD.QCF, button: 'attack', damage: 20, energyCost: 15, description: '召喚赤壁大火攻擊', color: '#ff4422' },
      { name: '瑜亮爭鋒', nameEn: 'Yu-Liang Rivalry', type: MOVE_TYPE.COUNTER, command: CMD.QCB, button: 'attack', damage: 22, energyCost: 20, description: '以智謀看破敵招反擊', color: '#ff3311' },
      { name: '火計連環', nameEn: 'Chain Fire Strategy', type: MOVE_TYPE.MULTI, command: CMD.HCF, button: 'attack', damage: 28, energyCost: 30, hits: 4, description: '連環火計焚燒一切', color: '#ff2200' }
    ],
    ultimate: { name: '火燒連營', nameEn: 'Burning the Linked Camps', type: MOVE_TYPE.AREA, damage: 62, energyCost: 100, description: '以天縱之才引發滅世大火', color: '#dd0000' }
  },
  {
    id: 'taishici', name: '太史慈', nameEn: 'Taishi Ci',
    faction: '孫吳', color: '#cc6644', weapon: '雙鐵戟/弓',
    stats: { atk: 8, def: 6, spd: 7 },
    moves: [
      { name: '神射連珠', nameEn: 'Divine Arrow Chain', type: MOVE_TYPE.PROJECTILE, command: CMD.QCF, button: 'attack', damage: 16, energyCost: 15, description: '連續射出精準箭矢', color: '#ee8866' },
      { name: '雙戟旋殺', nameEn: 'Twin Halberd Spin Kill', type: MOVE_TYPE.SPIN, command: CMD.QCB, button: 'attack', damage: 22, energyCost: 20, description: '旋轉雙戟斬殺四方', color: '#dd7755' },
      { name: '北海突圍', nameEn: 'Beihai Breakthrough', type: MOVE_TYPE.RUSH, command: CMD.FF, button: 'attack', damage: 20, energyCost: 20, description: '仿效北海突圍的勇猛衝擊', color: '#cc6644' }
    ],
    ultimate: { name: '天下英雄', nameEn: 'Heroes of the World', type: MOVE_TYPE.MULTI, damage: 58, energyCost: 100, hits: 7, description: '天下英雄誰敵手的極限連擊', color: '#bb5533' }
  },
  {
    id: 'ganning', name: '甘寧', nameEn: 'Gan Ning',
    faction: '孫吳', color: '#ddaa22', weapon: '鏈刀',
    stats: { atk: 8, def: 5, spd: 8 },
    moves: [
      { name: '百騎劫營', nameEn: 'Hundred Riders Camp Raid', type: MOVE_TYPE.RUSH, command: CMD.QCF, button: 'attack', damage: 20, energyCost: 15, description: '如夜襲般的急速攻擊', color: '#ffcc44' },
      { name: '鈴鐺響', nameEn: 'Bell Ring', type: MOVE_TYPE.AREA, command: CMD.DD, button: 'attack', damage: 16, energyCost: 15, description: '鈴鐺聲響震懾敵人', color: '#eebb33' },
      { name: '錦帆賊斬', nameEn: 'Silk Sail Pirate Slash', type: MOVE_TYPE.MULTI, command: CMD.QCB, button: 'attack', damage: 24, energyCost: 25, hits: 3, description: '錦帆海盜的連環斬擊', color: '#ddaa22' }
    ],
    ultimate: { name: '夜襲曹營', nameEn: 'Night Raid on Cao Camp', type: MOVE_TYPE.RUSH, damage: 58, energyCost: 100, description: '如鬼魅般突襲敵營的致命一擊', color: '#cc9911' }
  },
  {
    id: 'huanggai', name: '黃蓋', nameEn: 'Huang Gai',
    faction: '孫吳', color: '#cc5500', weapon: '鐵鞭/火船',
    stats: { atk: 7, def: 8, spd: 5 },
    moves: [
      { name: '苦肉計', nameEn: 'Self-Torture Ruse', type: MOVE_TYPE.BUFF, command: CMD.DD, button: 'attack', damage: 0, energyCost: 15, description: '犧牲血量大幅提升攻擊（損失10%血）', color: '#ee7722', selfDamage: 10, buffDuration: 360, buffMultiplier: 1.8 },
      { name: '烈焰衝鋒', nameEn: 'Blazing Charge', type: MOVE_TYPE.RUSH, command: CMD.QCF, button: 'attack', damage: 22, energyCost: 20, description: '帶著火焰衝向敵人', color: '#ff6611' },
      { name: '老將之怒', nameEn: 'Veteran Fury', type: MOVE_TYPE.COUNTER, command: CMD.QCB, button: 'attack', damage: 24, energyCost: 20, description: '老當益壯的怒火反擊', color: '#dd5500' }
    ],
    ultimate: { name: '赤壁詐降', nameEn: 'False Surrender at Red Cliff', type: MOVE_TYPE.GRAB, damage: 60, energyCost: 100, description: '假意投降後引燃烈火', color: '#cc4400' }
  },

  // ===================== 群雄 =====================
  {
    id: 'lvbu', name: '呂布', nameEn: 'Lv Bu',
    faction: '群雄', color: '#cc2222', weapon: '方天畫戟',
    stats: { atk: 10, def: 8, spd: 7 },
    moves: [
      { name: '方天畫戟', nameEn: 'Sky Piercer', type: MOVE_TYPE.SPIN, command: CMD.QCF, button: 'attack', damage: 24, energyCost: 20, description: '旋轉方天畫戟橫掃一切', color: '#ff4444' },
      { name: '轅門射戟', nameEn: 'Gate Halberd Shot', type: MOVE_TYPE.PROJECTILE, command: CMD.QCB, button: 'attack', damage: 20, energyCost: 15, description: '以戟尖射出氣刃', color: '#ff3333' },
      { name: '無雙戰神', nameEn: 'Unmatched War God', type: MOVE_TYPE.BUFF, command: CMD.DD, button: 'attack', damage: 0, energyCost: 25, description: '化身天下無雙的戰神', color: '#ee2222', buffDuration: 240, buffMultiplier: 1.5 }
    ],
    ultimate: { name: '三英戰呂布', nameEn: 'Three Heroes vs Lv Bu', type: MOVE_TYPE.MULTI, damage: 75, energyCost: 100, hits: 10, description: '天下第一猛將的極限爆發', color: '#cc0000' }
  },
  {
    id: 'yuanshao', name: '袁紹', nameEn: 'Yuan Shao',
    faction: '群雄', color: '#bb88cc', weapon: '寶劍',
    stats: { atk: 6, def: 7, spd: 6 },
    moves: [
      { name: '河北霸主', nameEn: 'Overlord of Hebei', type: MOVE_TYPE.AREA, command: CMD.QCF, button: 'attack', damage: 18, energyCost: 15, description: '以四州之主的氣勢震懾', color: '#cc99dd' },
      { name: '四世三公', nameEn: 'Four Generations Ministers', type: MOVE_TYPE.BUFF, command: CMD.DD, button: 'attack', damage: 0, energyCost: 20, description: '仗著名門之後提升氣勢', color: '#bb88cc', buffDuration: 300, buffMultiplier: 1.4 },
      { name: '官渡之劍', nameEn: 'Sword of Guandu', type: MOVE_TYPE.SLAM, command: CMD.DPF, button: 'attack', damage: 22, energyCost: 20, description: '官渡決戰的全力一擊', color: '#aa77bb' }
    ],
    ultimate: { name: '百萬大軍', nameEn: 'Million Man Army', type: MOVE_TYPE.AREA, damage: 50, energyCost: 100, description: '召喚百萬大軍的氣勢碾壓', color: '#9966aa' }
  },
  {
    id: 'dongzhuo', name: '董卓', nameEn: 'Dong Zhuo',
    faction: '群雄', color: '#884422', weapon: '霸刀',
    stats: { atk: 9, def: 8, spd: 3 },
    moves: [
      { name: '暴虐揮刀', nameEn: 'Tyrannical Swing', type: MOVE_TYPE.SLAM, command: CMD.QCF, button: 'attack', damage: 26, energyCost: 20, description: '暴君的蠻力一刀', color: '#aa6644' },
      { name: '火燒洛陽', nameEn: 'Burn Luoyang', type: MOVE_TYPE.AREA, command: CMD.QCB, button: 'attack', damage: 22, energyCost: 25, description: '如同火燒洛陽的毀滅之火', color: '#cc5533' },
      { name: '霸道橫行', nameEn: 'Tyrant Way', type: MOVE_TYPE.GRAB, command: CMD.HCF, button: 'attack', damage: 24, energyCost: 25, description: '以蠻力擒住敵人重擊', color: '#994433' }
    ],
    ultimate: { name: '天下大亂', nameEn: 'Chaos Under Heaven', type: MOVE_TYPE.AREA, damage: 65, energyCost: 100, description: '使天下陷入混亂的暴君之力', color: '#772211' }
  }
];

/* ==========================================================
   SOLDIER TYPES — 小兵類型
   ========================================================== */
const SOLDIER_TYPES = [
  {
    id: 'sword_soldier', name: '劍兵', nameEn: 'Swordsman',
    weapon: '劍', color: '#888888',
    stats: { atk: 4, def: 4, spd: 5 },
    healthMultiplier: 0.2, // 1/5 of normal
    attackRange: 60, description: '基本劍兵，攻守平衡'
  },
  {
    id: 'blade_soldier', name: '刀兵', nameEn: 'Blade Soldier',
    weapon: '刀', color: '#999977',
    stats: { atk: 5, def: 3, spd: 5 },
    healthMultiplier: 0.2,
    attackRange: 65, description: '刀兵，攻擊較高'
  },
  {
    id: 'spear_soldier', name: '槍兵', nameEn: 'Spearman',
    weapon: '槍', color: '#777799',
    stats: { atk: 4, def: 5, spd: 4 },
    healthMultiplier: 0.2,
    attackRange: 80, description: '槍兵，攻擊距離較遠'
  },
  {
    id: 'archer_soldier', name: '弓兵', nameEn: 'Archer',
    weapon: '弓', color: '#887766',
    stats: { atk: 5, def: 2, spd: 6 },
    healthMultiplier: 0.2,
    attackRange: 200, description: '弓兵，可遠程攻擊',
    isRanged: true
  }
];

/* ==========================================================
   FACTION DATA — 勢力資料
   ========================================================== */
const FACTIONS = {
  '蜀漢': { color: '#22aa44', bgColor: '#1a3a1a', label: '蜀漢', labelEn: 'Shu Han' },
  '曹魏': { color: '#4444cc', bgColor: '#1a1a3a', label: '曹魏', labelEn: 'Cao Wei' },
  '孫吳': { color: '#ee6622', bgColor: '#3a2a1a', label: '孫吳', labelEn: 'Sun Wu' },
  '群雄': { color: '#cc2222', bgColor: '#3a1a1a', label: '群雄', labelEn: 'Other' }
};
