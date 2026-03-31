// ============================================================
// Enumerations for game states, actions, and types
// ============================================================

/** Animation states */
export const ANIM = {
  IDLE: 'idle',
  RUN: 'run',
  JUMP: 'jump',
  FALL: 'fall',
  ATTACK1: 'attack1',
  ATTACK2: 'attack2',
  SPECIAL: 'special',
  ULTIMATE: 'ultimate',
  BLOCK: 'block',
  CHARGE: 'charge',
  TAKE_HIT: 'takeHit',
  KNOCKDOWN: 'knockdown',
  GETUP: 'getup',
  DEATH: 'death',
} as const;

export type AnimState = (typeof ANIM)[keyof typeof ANIM];

/** Move types for special moves */
export const MOVE_TYPE = {
  PROJECTILE: 'projectile',
  RUSH: 'rush',
  UPPERCUT: 'uppercut',
  SPIN: 'spin',
  AREA: 'area',
  COUNTER: 'counter',
  BUFF: 'buff',
  GRAB: 'grab',
  MULTI: 'multi',
  SLAM: 'slam',
} as const;

export type MoveType = (typeof MOVE_TYPE)[keyof typeof MOVE_TYPE];

/** Command input patterns */
export const CMD = {
  QCF: ['D', 'DF', 'F'] as string[],
  QCB: ['D', 'DB', 'B'] as string[],
  DPF: ['F', 'D', 'DF'] as string[],
  HCF: ['B', 'DB', 'D', 'DF', 'F'] as string[],
  DD: ['D', 'D'] as string[],
  FF: ['F', 'F'] as string[],
  CHARGE_BF: ['B_HOLD', 'F'] as string[],
  CHARGE_DU: ['D_HOLD', 'U'] as string[],
} as const;

/** Game modes */
export enum GameMode {
  PVP = 'pvp',
  PVC = 'pvcpu',
  STORY = 'story',
}

/** Difficulty levels */
export enum Difficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
}

/** Faction identifiers */
export const FACTIONS = {
  SHU: '蜀漢',
  WEI: '曹魏',
  WU: '孫吳',
  OTHER: '群雄',
} as const;

export type FactionName = (typeof FACTIONS)[keyof typeof FACTIONS];
