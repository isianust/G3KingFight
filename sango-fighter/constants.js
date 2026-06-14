var ANIM = {
  IDLE: 'idle', RUN: 'run', JUMP: 'jump', FALL: 'fall',
  ATTACK1: 'attack1', ATTACK2: 'attack2', SPECIAL: 'special', ULTIMATE: 'ultimate',
  BLOCK: 'block', CHARGE: 'charge', TAKE_HIT: 'takeHit',
  KNOCKDOWN: 'knockdown', GETUP: 'getup', DEATH: 'death'
};

var MOVE_TYPE = {
  PROJECTILE: 'projectile', RUSH: 'rush', UPPERCUT: 'uppercut', SPIN: 'spin',
  AREA: 'area', COUNTER: 'counter', BUFF: 'buff', GRAB: 'grab', MULTI: 'multi', SLAM: 'slam'
};

var CMD = {
  QCF: ['D', 'DF', 'F'],
  QCB: ['D', 'DB', 'B'],
  DPF: ['F', 'D', 'DF'],
  HCF: ['B', 'DB', 'D', 'DF', 'F'],
  DD: ['D', 'D'],
  FF: ['F', 'F'],
  CHARGE_BF: ['B_HOLD', 'F'],
  CHARGE_DU: ['D_HOLD', 'U']
};

var FACTIONS = { SHU: '蜀漢', WEI: '曹魏', WU: '孫吳', OTHER: '群雄' };

var CANVAS_W = 1024;
var CANVAS_H = 576;

var GRAVITY = 0.7;
var GROUND_Y = CANVAS_H - 96;

var MAX_ENERGY = 100;
var ENERGY_GAIN_HIT = 8;
var ENERGY_GAIN_HURT = 5;
var ENERGY_GAIN_CHARGE = 1.2;

var BLOCK_DAMAGE_REDUCTION = 0.7;
var BLOCK_KNOCKBACK_REDUCTION = 0.5;
var KNOCKDOWN_BAR_LIGHT = 20;
var KNOCKDOWN_BAR_HEAVY = 50;
var KNOCKDOWN_BAR_SPECIAL = 100;
var HITSTUN_LIGHT = 8;
var HITSTUN_HEAVY = 12;

var HERO_MAX_HEALTH = 200;
var SOLDIER_MAX_HEALTH = 40;
var DEFAULT_SPEED = 5;
var DEFAULT_JUMP_FORCE = -15;

var DEFAULT_ROUND_TIME = 99;

var INPUT_BUFFER_MAX_TIME = 30;

var GAME_VERSION = 'V12';

var LIGHT_ATTACK_DAMAGE = 8;
var HEAVY_ATTACK_DAMAGE = 15;
var LIGHT_ATTACK_KNOCKBACK = 5;
var HEAVY_ATTACK_KNOCKBACK = 10;

var STAGE_COUNT = 6;
var STAGE_NAMES = [
  { name: '黃昏戰場', nameEn: 'Battlefield at Dusk', desc: '夕陽西下的古戰場，紅霞映照刀劍之光。' },
  { name: '皇宮夜景', nameEn: 'Imperial Palace', desc: '月光下的皇宮庭院，燈火通明的權力中心。' },
  { name: '赤壁烽火', nameEn: 'Red Cliff', desc: '熊熊烈火中的赤壁，江面上戰火紛飛。' },
  { name: '竹林幽境', nameEn: 'Bamboo Forest', desc: '幽靜竹林中的對決，清風竹影中暗藏殺機。' },
  { name: '古橋破曉', nameEn: 'Ancient Bridge', desc: '破曉時分的古橋，晨霧瀰漫中一決勝負。' },
  { name: '藍天白雲', nameEn: 'Blue Sky Bliss', desc: '藍天白雲下的開闊地，天高雲淡豪氣萬千。' }
];

var DIFFICULTY_SETTINGS = {
  easy: { label: '初級', aiBlockRate: 0.4, aiAttackRate: 0.12, aiSpecialRate: 0.06, aiUltRate: 0.05, dmgMultiplier: 1.0, statBonus: 0 },
  normal: { label: '中級', aiBlockRate: 0.55, aiAttackRate: 0.18, aiSpecialRate: 0.1, aiUltRate: 0.08, dmgMultiplier: 1.3, statBonus: 1 },
  hard: { label: '高級', aiBlockRate: 0.7, aiAttackRate: 0.25, aiSpecialRate: 0.15, aiUltRate: 0.12, dmgMultiplier: 1.6, statBonus: 2 }
};

var FACTION_DATA = {
  '蜀漢': { color: '#22aa44', bgColor: '#1a3a1a', label: '蜀漢', labelEn: 'Shu Han' },
  '曹魏': { color: '#4444cc', bgColor: '#1a1a3a', label: '曹魏', labelEn: 'Cao Wei' },
  '孫吳': { color: '#ee6622', bgColor: '#3a2a1a', label: '孫吳', labelEn: 'Sun Wu' },
  '群雄': { color: '#cc2222', bgColor: '#3a1a1a', label: '群雄', labelEn: 'Other' }
};

var JOYSTICK_DEAD_ZONE = 0.2;
var JOYSTICK_MAX_DIST = 45;
