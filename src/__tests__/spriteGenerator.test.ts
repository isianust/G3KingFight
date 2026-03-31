import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { ANIM, type AnimState } from '../constants/enums';
import type { CharacterData, SoldierType, SpriteSheets } from '../types/index';

// jsdom does not implement getContext, so we stub it before importing the module.
const mockCtx = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  globalAlpha: 1,
  shadowColor: '',
  shadowBlur: 0,
  font: '',
  textAlign: '',
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  beginPath: vi.fn(),
  closePath: vi.fn(),
  arc: vi.fn(),
  ellipse: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  setTransform: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
} as unknown as CanvasRenderingContext2D;

const originalGetContext = HTMLCanvasElement.prototype.getContext;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(HTMLCanvasElement.prototype as any).getContext = function (type: string) {
  if (type === '2d') return mockCtx;
  return originalGetContext.call(this, type);
};

import {
  SPRITE_FRAMES,
  SOLDIER_SPRITE_FRAMES,
  generateCharacterSprites,
} from '../rendering/SpriteGenerator';

afterAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLCanvasElement.prototype as any).getContext = originalGetContext;
});

const ALL_ANIM_STATES: AnimState[] = [
  ANIM.IDLE,
  ANIM.RUN,
  ANIM.JUMP,
  ANIM.FALL,
  ANIM.ATTACK1,
  ANIM.ATTACK2,
  ANIM.SPECIAL,
  ANIM.ULTIMATE,
  ANIM.BLOCK,
  ANIM.CHARGE,
  ANIM.TAKE_HIT,
  ANIM.KNOCKDOWN,
  ANIM.GETUP,
  ANIM.DEATH,
];

const CHAR_WIDTH = 60;
const CHAR_HEIGHT = 100;
const EXPECTED_FRAME_W = CHAR_WIDTH + 60; // charWidth + padX*2
const EXPECTED_FRAME_H = CHAR_HEIGHT + 60; // charHeight + padY*2

function makeHeroData(): CharacterData {
  return {
    id: 'test-hero',
    name: 'Test Hero',
    nameEn: 'Test Hero',
    faction: 'wei' as CharacterData['faction'],
    color: '#ff0000',
    weapon: 'sword',
    stats: { hp: 100, attack: 10, defense: 5, speed: 5, special: 10 },
    moves: [],
    ultimate: { name: 'Ult', nameEn: 'Ult', damage: 50, type: 'damage' as const },
  } as CharacterData;
}

function makeSoldierData(): SoldierType {
  return {
    id: 'test-soldier',
    name: 'Test Soldier',
    nameEn: 'Test Soldier',
    color: '#00ff00',
    weapon: 'spear',
    stats: { hp: 50, attack: 5, defense: 3, speed: 3, special: 3 },
    healthMultiplier: 1,
    attackRange: 40,
    description: 'A test soldier',
  } as SoldierType;
}

/* ======================================================
   SPRITE_FRAMES
   ====================================================== */
describe('SPRITE_FRAMES', () => {
  it('has entries for all 14 animation states', () => {
    for (const state of ALL_ANIM_STATES) {
      expect(SPRITE_FRAMES).toHaveProperty(state);
    }
    expect(Object.keys(SPRITE_FRAMES)).toHaveLength(14);
  });

  it('has correct frame counts for each animation state', () => {
    expect(SPRITE_FRAMES[ANIM.IDLE]).toBe(4);
    expect(SPRITE_FRAMES[ANIM.RUN]).toBe(6);
    expect(SPRITE_FRAMES[ANIM.JUMP]).toBe(2);
    expect(SPRITE_FRAMES[ANIM.FALL]).toBe(2);
    expect(SPRITE_FRAMES[ANIM.ATTACK1]).toBe(4);
    expect(SPRITE_FRAMES[ANIM.ATTACK2]).toBe(4);
    expect(SPRITE_FRAMES[ANIM.SPECIAL]).toBe(6);
    expect(SPRITE_FRAMES[ANIM.ULTIMATE]).toBe(6);
    expect(SPRITE_FRAMES[ANIM.BLOCK]).toBe(2);
    expect(SPRITE_FRAMES[ANIM.CHARGE]).toBe(4);
    expect(SPRITE_FRAMES[ANIM.TAKE_HIT]).toBe(2);
    expect(SPRITE_FRAMES[ANIM.KNOCKDOWN]).toBe(3);
    expect(SPRITE_FRAMES[ANIM.GETUP]).toBe(3);
    expect(SPRITE_FRAMES[ANIM.DEATH]).toBe(4);
  });
});

/* ======================================================
   SOLDIER_SPRITE_FRAMES
   ====================================================== */
describe('SOLDIER_SPRITE_FRAMES', () => {
  it('has entries for all 14 animation states', () => {
    for (const state of ALL_ANIM_STATES) {
      expect(SOLDIER_SPRITE_FRAMES).toHaveProperty(state);
    }
    expect(Object.keys(SOLDIER_SPRITE_FRAMES)).toHaveLength(14);
  });

  it('has correct frame counts for each animation state', () => {
    expect(SOLDIER_SPRITE_FRAMES[ANIM.IDLE]).toBe(4);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.RUN]).toBe(4);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.JUMP]).toBe(2);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.FALL]).toBe(2);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.ATTACK1]).toBe(3);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.ATTACK2]).toBe(3);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.SPECIAL]).toBe(3);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.ULTIMATE]).toBe(3);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.BLOCK]).toBe(1);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.CHARGE]).toBe(2);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.TAKE_HIT]).toBe(2);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.KNOCKDOWN]).toBe(2);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.GETUP]).toBe(2);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.DEATH]).toBe(3);
  });

  it('differs from SPRITE_FRAMES where expected', () => {
    expect(SOLDIER_SPRITE_FRAMES[ANIM.RUN]).not.toBe(SPRITE_FRAMES[ANIM.RUN]);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.ATTACK1]).not.toBe(SPRITE_FRAMES[ANIM.ATTACK1]);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.ATTACK2]).not.toBe(SPRITE_FRAMES[ANIM.ATTACK2]);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.SPECIAL]).not.toBe(SPRITE_FRAMES[ANIM.SPECIAL]);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.ULTIMATE]).not.toBe(SPRITE_FRAMES[ANIM.ULTIMATE]);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.BLOCK]).not.toBe(SPRITE_FRAMES[ANIM.BLOCK]);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.CHARGE]).not.toBe(SPRITE_FRAMES[ANIM.CHARGE]);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.KNOCKDOWN]).not.toBe(SPRITE_FRAMES[ANIM.KNOCKDOWN]);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.GETUP]).not.toBe(SPRITE_FRAMES[ANIM.GETUP]);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.DEATH]).not.toBe(SPRITE_FRAMES[ANIM.DEATH]);
  });

  it('matches SPRITE_FRAMES where expected', () => {
    expect(SOLDIER_SPRITE_FRAMES[ANIM.IDLE]).toBe(SPRITE_FRAMES[ANIM.IDLE]);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.JUMP]).toBe(SPRITE_FRAMES[ANIM.JUMP]);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.FALL]).toBe(SPRITE_FRAMES[ANIM.FALL]);
    expect(SOLDIER_SPRITE_FRAMES[ANIM.TAKE_HIT]).toBe(SPRITE_FRAMES[ANIM.TAKE_HIT]);
  });
});

/* ======================================================
   generateCharacterSprites — hero
   ====================================================== */
describe('generateCharacterSprites (hero)', () => {
  let sheets: SpriteSheets;

  beforeAll(() => {
    sheets = generateCharacterSprites(makeHeroData(), CHAR_WIDTH, CHAR_HEIGHT);
  });

  it('returns a SpriteSheets object with all animation keys', () => {
    for (const state of ALL_ANIM_STATES) {
      expect(sheets[state]).toBeDefined();
    }
  });

  it('uses SPRITE_FRAMES frame counts', () => {
    for (const state of ALL_ANIM_STATES) {
      const sheet = sheets[state]!;
      expect(sheet.frameCount).toBe(SPRITE_FRAMES[state]);
    }
  });

  it('has correct frameW and frameH', () => {
    for (const state of ALL_ANIM_STATES) {
      const sheet = sheets[state]!;
      expect(sheet.frameW).toBe(EXPECTED_FRAME_W);
      expect(sheet.frameH).toBe(EXPECTED_FRAME_H);
    }
  });

  it('has padX: 30 and padY: 30', () => {
    for (const state of ALL_ANIM_STATES) {
      const sheet = sheets[state]!;
      expect(sheet.padX).toBe(30);
      expect(sheet.padY).toBe(30);
    }
  });

  it('has correct canvas dimensions', () => {
    for (const state of ALL_ANIM_STATES) {
      const sheet = sheets[state]!;
      const expectedWidth = EXPECTED_FRAME_W * SPRITE_FRAMES[state];
      expect(sheet.canvas.width).toBe(expectedWidth);
      expect(sheet.canvas.height).toBe(EXPECTED_FRAME_H);
    }
  });
});

/* ======================================================
   generateCharacterSprites — soldier
   ====================================================== */
describe('generateCharacterSprites (soldier)', () => {
  let sheets: SpriteSheets;

  beforeAll(() => {
    sheets = generateCharacterSprites(makeSoldierData(), CHAR_WIDTH, CHAR_HEIGHT, true);
  });

  it('returns a SpriteSheets object with all animation keys', () => {
    for (const state of ALL_ANIM_STATES) {
      expect(sheets[state]).toBeDefined();
    }
  });

  it('uses SOLDIER_SPRITE_FRAMES frame counts', () => {
    for (const state of ALL_ANIM_STATES) {
      const sheet = sheets[state]!;
      expect(sheet.frameCount).toBe(SOLDIER_SPRITE_FRAMES[state]);
    }
  });

  it('has correct frameW and frameH', () => {
    for (const state of ALL_ANIM_STATES) {
      const sheet = sheets[state]!;
      expect(sheet.frameW).toBe(EXPECTED_FRAME_W);
      expect(sheet.frameH).toBe(EXPECTED_FRAME_H);
    }
  });

  it('has padX: 30 and padY: 30', () => {
    for (const state of ALL_ANIM_STATES) {
      const sheet = sheets[state]!;
      expect(sheet.padX).toBe(30);
      expect(sheet.padY).toBe(30);
    }
  });

  it('has correct canvas dimensions', () => {
    for (const state of ALL_ANIM_STATES) {
      const sheet = sheets[state]!;
      const expectedWidth = EXPECTED_FRAME_W * SOLDIER_SPRITE_FRAMES[state];
      expect(sheet.canvas.width).toBe(expectedWidth);
      expect(sheet.canvas.height).toBe(EXPECTED_FRAME_H);
    }
  });
});

/* ======================================================
   generateCharacterSprites — null / undefined charData
   ====================================================== */
describe('generateCharacterSprites (null charData)', () => {
  it('returns valid sprite sheets when charData is null', () => {
    const sheets = generateCharacterSprites(null, CHAR_WIDTH, CHAR_HEIGHT);
    for (const state of ALL_ANIM_STATES) {
      expect(sheets[state]).toBeDefined();
      expect(sheets[state]!.frameCount).toBe(SPRITE_FRAMES[state]);
    }
  });

  it('returns valid sprite sheets when charData is undefined', () => {
    const sheets = generateCharacterSprites(undefined, CHAR_WIDTH, CHAR_HEIGHT);
    for (const state of ALL_ANIM_STATES) {
      expect(sheets[state]).toBeDefined();
      expect(sheets[state]!.frameCount).toBe(SPRITE_FRAMES[state]);
    }
  });

  it('still produces correct frame dimensions with null charData', () => {
    const sheets = generateCharacterSprites(null, CHAR_WIDTH, CHAR_HEIGHT);
    for (const state of ALL_ANIM_STATES) {
      const sheet = sheets[state]!;
      expect(sheet.frameW).toBe(EXPECTED_FRAME_W);
      expect(sheet.frameH).toBe(EXPECTED_FRAME_H);
      expect(sheet.padX).toBe(30);
      expect(sheet.padY).toBe(30);
    }
  });
});
