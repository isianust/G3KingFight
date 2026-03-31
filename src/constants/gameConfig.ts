// ============================================================
// Game Configuration Constants
// ============================================================

/** Canvas dimensions */
export const CANVAS_W = 1024;
export const CANVAS_H = 576;

/** Physics */
export const GRAVITY = 0.7;
export const GROUND_Y = CANVAS_H - 96;

/** Energy system */
export const MAX_ENERGY = 100;
export const ENERGY_GAIN_HIT = 8;
export const ENERGY_GAIN_HURT = 5;
export const ENERGY_GAIN_CHARGE = 1.2;

/** Combat */
export const BLOCK_DAMAGE_REDUCTION = 0.7;
export const BLOCK_KNOCKBACK_REDUCTION = 0.5;

/** Knockdown bar */
export const KNOCKDOWN_BAR_LIGHT = 20;
export const KNOCKDOWN_BAR_HEAVY = 50;
export const KNOCKDOWN_BAR_SPECIAL = 100;

/** Hitstun frames */
export const HITSTUN_LIGHT = 8;
export const HITSTUN_HEAVY = 12;

/** Fighter defaults */
export const HERO_MAX_HEALTH = 200;
export const SOLDIER_MAX_HEALTH = 40;
export const DEFAULT_SPEED = 5;
export const DEFAULT_JUMP_FORCE = -15;

/** Timer */
export const DEFAULT_ROUND_TIME = 99;

/** Input buffer */
export const INPUT_BUFFER_MAX_TIME = 30;

/** Game version */
export const GAME_VERSION = 'V12';

/** Combat — basic attack damage and knockback */
export const LIGHT_ATTACK_DAMAGE = 8;
export const HEAVY_ATTACK_DAMAGE = 15;
export const LIGHT_ATTACK_KNOCKBACK = 5;
export const HEAVY_ATTACK_KNOCKBACK = 10;

/** Stage count */
export const STAGE_COUNT = 6;

/** Stage names / descriptions */
export const STAGE_NAMES: { name: string; nameEn: string; desc: string }[] = [
  { name: '黃昏戰場', nameEn: 'Battlefield at Dusk', desc: '夕陽西下的古戰場，紅霞映照刀劍之光。' },
  { name: '皇宮夜景', nameEn: 'Imperial Palace', desc: '月光下的皇宮庭院，燈火通明的權力中心。' },
  { name: '赤壁烽火', nameEn: 'Red Cliff', desc: '熊熊烈火中的赤壁，江面上戰火紛飛。' },
  { name: '竹林幽境', nameEn: 'Bamboo Forest', desc: '幽靜竹林中的對決，清風竹影中暗藏殺機。' },
  { name: '古橋破曉', nameEn: 'Ancient Bridge', desc: '破曉時分的古橋，晨霧瀰漫中一決勝負。' },
  { name: '藍天白雲', nameEn: 'Blue Sky Bliss', desc: '藍天白雲下的開闊地，天高雲淡豪氣萬千。' },
];

/** Difficulty settings */
export interface DifficultySettings {
  label: string;
  aiBlockRate: number;
  aiAttackRate: number;
  aiSpecialRate: number;
  aiUltRate: number;
  dmgMultiplier: number;
  statBonus: number;
}

export const DIFFICULTY_SETTINGS: Record<string, DifficultySettings> = {
  easy: {
    label: '初級',
    aiBlockRate: 0.4,
    aiAttackRate: 0.12,
    aiSpecialRate: 0.06,
    aiUltRate: 0.05,
    dmgMultiplier: 1.0,
    statBonus: 0,
  },
  normal: {
    label: '中級',
    aiBlockRate: 0.55,
    aiAttackRate: 0.18,
    aiSpecialRate: 0.1,
    aiUltRate: 0.08,
    dmgMultiplier: 1.3,
    statBonus: 1,
  },
  hard: {
    label: '高級',
    aiBlockRate: 0.7,
    aiAttackRate: 0.25,
    aiSpecialRate: 0.15,
    aiUltRate: 0.12,
    dmgMultiplier: 1.6,
    statBonus: 2,
  },
};

/** Faction visual data (color, bgColor, labels) keyed by faction name */
export const FACTION_DATA: Record<
  string,
  { color: string; bgColor: string; label: string; labelEn: string }
> = {
  蜀漢: { color: '#22aa44', bgColor: '#1a3a1a', label: '蜀漢', labelEn: 'Shu Han' },
  曹魏: { color: '#4444cc', bgColor: '#1a1a3a', label: '曹魏', labelEn: 'Cao Wei' },
  孫吳: { color: '#ee6622', bgColor: '#3a2a1a', label: '孫吳', labelEn: 'Sun Wu' },
  群雄: { color: '#cc2222', bgColor: '#3a1a1a', label: '群雄', labelEn: 'Other' },
};

/** Joystick constants */
export const JOYSTICK_DEAD_ZONE = 0.2;
export const JOYSTICK_MAX_DIST = 45;
