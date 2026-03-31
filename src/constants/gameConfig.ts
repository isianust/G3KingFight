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
