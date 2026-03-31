// ============================================================
// TypeScript type definitions for the entire game
// ============================================================

import type { AnimState, MoveType, FactionName } from '../constants/enums';

// ---- Character & Move Data ----

export interface CharacterStats {
  atk: number;
  def: number;
  spd: number;
}

export interface SpecialMove {
  name: string;
  nameEn: string;
  command: string[];
  type: MoveType;
  damage: number;
  energyCost: number;
  description: string;
  button?: string;
  color?: string;
  hits?: number;
  selfDamage?: number;
  buffDuration?: number;
  buffMultiplier?: number;
}

export interface UltimateMove {
  name: string;
  nameEn: string;
  type: MoveType;
  damage: number;
  energyCost: number;
  description: string;
  color?: string;
  hits?: number;
  selfDamage?: number;
}

export interface CharacterData {
  id: string;
  name: string;
  nameEn: string;
  faction: FactionName;
  color: string;
  weapon: string;
  weaponEn?: string;
  stats: CharacterStats;
  attack1Damage?: number;
  attack2Damage?: number;
  moves: SpecialMove[];
  specialMoves?: SpecialMove[];
  ultimate: UltimateMove;
}

export interface SoldierType {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  weapon: string;
  weaponEn?: string;
  stats: CharacterStats;
  healthMultiplier: number;
  attackRange: number;
  description: string;
  isRanged?: boolean;
  attack1Damage?: number;
  attack2Damage?: number;
  specialMoves?: SpecialMove[];
  ultimate?: UltimateMove;
}

// ---- Position & Velocity ----

export interface Vector2D {
  x: number;
  y: number;
}

// ---- Sprite System ----

export interface SpriteSheet {
  canvas: HTMLCanvasElement;
  frameCount: number;
  frameW: number;
  frameH: number;
  padX: number;
  padY: number;
}

export type SpriteSheets = Partial<Record<AnimState, SpriteSheet>>;

export interface SpriteConfig {
  position: Vector2D;
  imageSrc?: string;
  scale?: number;
  framesMax?: number;
  offset?: Vector2D;
  color?: string;
}

// ---- Fighter ----

export interface FighterConfig extends SpriteConfig {
  velocity?: Vector2D;
  charData: CharacterData | SoldierType;
  isSoldier?: boolean;
  soldierType?: string;
}

export interface AttackBox {
  position: Vector2D;
  width: number;
  height: number;
}

// ---- Projectile ----

export interface ProjectileConfig {
  position: Vector2D;
  vx: number;
  vy: number;
  damage: number;
  color: string;
  owner: unknown;
}

// ---- Story Mode ----

export interface DialogLine {
  speaker: string;
  text: string;
}

export interface StoryBattle {
  opponent: string;
  opponentType: 'character' | 'soldier';
  dialogBefore?: DialogLine[];
  dialogAfter?: DialogLine[];
}

export interface StoryChapter {
  id: string;
  title: string;
  titleEn: string;
  dialogsBefore: DialogLine[];
  battles: StoryBattle[];
  dialogsAfter: DialogLine[];
}

export interface StoryCampaign {
  title: string;
  titleEn: string;
  description: string;
  protagonist: string;
  availableHeroes: string[];
  chapters: StoryChapter[];
}

export type StoryCampaigns = Record<string, StoryCampaign>;

// ---- Game State ----

export interface HitEffect {
  x: number;
  y: number;
  text: string;
  timer: number;
  color: string;
}

export interface BackgroundParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
}

export interface ScreenShake {
  active: boolean;
  intensity: number;
  duration: number;
  timer: number;
}

export interface ScreenFlash {
  active: boolean;
  color: string;
  alpha: number;
  duration: number;
  timer: number;
}

export interface SlowMotion {
  active: boolean;
  factor: number;
  duration: number;
  timer: number;
}

// ---- Input ----

export interface InputBufferEntry {
  direction: string;
  time: number;
}

export interface KeyMapping {
  left: string;
  right: string;
  up: string;
  down: string;
  attack1: string;
  attack2: string;
  block: string;
  charge: string;
}

// ---- Difficulty Config ----

export interface DifficultyConfig {
  damageMultiplier: number;
  aiBlockRate: number;
  label: string;
}
