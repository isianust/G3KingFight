import { describe, it, expect } from 'vitest';
import {
  CANVAS_W,
  CANVAS_H,
  GRAVITY,
  GROUND_Y,
  MAX_ENERGY,
  ENERGY_GAIN_HIT,
  ENERGY_GAIN_HURT,
  ENERGY_GAIN_CHARGE,
  BLOCK_DAMAGE_REDUCTION,
  BLOCK_KNOCKBACK_REDUCTION,
  KNOCKDOWN_BAR_LIGHT,
  KNOCKDOWN_BAR_HEAVY,
  KNOCKDOWN_BAR_SPECIAL,
  HITSTUN_LIGHT,
  HITSTUN_HEAVY,
  HERO_MAX_HEALTH,
  SOLDIER_MAX_HEALTH,
  DEFAULT_SPEED,
  DEFAULT_JUMP_FORCE,
  DEFAULT_ROUND_TIME,
  INPUT_BUFFER_MAX_TIME,
  GAME_VERSION,
  LIGHT_ATTACK_DAMAGE,
  HEAVY_ATTACK_DAMAGE,
  LIGHT_ATTACK_KNOCKBACK,
  HEAVY_ATTACK_KNOCKBACK,
  STAGE_COUNT,
  STAGE_NAMES,
  DIFFICULTY_SETTINGS,
  FACTION_DATA,
  JOYSTICK_DEAD_ZONE,
  JOYSTICK_MAX_DIST,
} from '../constants/gameConfig';
import { ANIM, MOVE_TYPE, CMD, GameMode, Difficulty, FACTIONS } from '../constants/enums';

describe('Game Config Constants', () => {
  it('canvas dimensions are positive integers', () => {
    expect(CANVAS_W).toBe(1024);
    expect(CANVAS_H).toBe(576);
  });

  it('GROUND_Y is derived from CANVAS_H', () => {
    expect(GROUND_Y).toBe(CANVAS_H - 96);
  });

  it('GRAVITY is a positive number', () => {
    expect(GRAVITY).toBe(0.7);
    expect(GRAVITY).toBeGreaterThan(0);
  });

  it('energy system constants are valid', () => {
    expect(MAX_ENERGY).toBe(100);
    expect(ENERGY_GAIN_HIT).toBe(8);
    expect(ENERGY_GAIN_HURT).toBe(5);
    expect(ENERGY_GAIN_CHARGE).toBe(1.2);
  });

  it('combat reduction constants are between 0 and 1', () => {
    expect(BLOCK_DAMAGE_REDUCTION).toBeGreaterThan(0);
    expect(BLOCK_DAMAGE_REDUCTION).toBeLessThanOrEqual(1);
    expect(BLOCK_KNOCKBACK_REDUCTION).toBeGreaterThan(0);
    expect(BLOCK_KNOCKBACK_REDUCTION).toBeLessThanOrEqual(1);
  });

  it('knockdown bar values increase by severity', () => {
    expect(KNOCKDOWN_BAR_LIGHT).toBeLessThan(KNOCKDOWN_BAR_HEAVY);
    expect(KNOCKDOWN_BAR_HEAVY).toBeLessThan(KNOCKDOWN_BAR_SPECIAL);
  });

  it('hitstun values are positive', () => {
    expect(HITSTUN_LIGHT).toBe(8);
    expect(HITSTUN_HEAVY).toBe(12);
    expect(HITSTUN_HEAVY).toBeGreaterThan(HITSTUN_LIGHT);
  });

  it('fighter defaults are valid', () => {
    expect(HERO_MAX_HEALTH).toBe(200);
    expect(SOLDIER_MAX_HEALTH).toBe(40);
    expect(DEFAULT_SPEED).toBe(5);
    expect(DEFAULT_JUMP_FORCE).toBe(-15);
  });

  it('timer and input buffer are positive', () => {
    expect(DEFAULT_ROUND_TIME).toBe(99);
    expect(INPUT_BUFFER_MAX_TIME).toBe(30);
  });

  it('game version is a non-empty string', () => {
    expect(GAME_VERSION).toBe('V12');
  });

  it('attack damage and knockback values are valid', () => {
    expect(LIGHT_ATTACK_DAMAGE).toBe(8);
    expect(HEAVY_ATTACK_DAMAGE).toBe(15);
    expect(HEAVY_ATTACK_DAMAGE).toBeGreaterThan(LIGHT_ATTACK_DAMAGE);
    expect(LIGHT_ATTACK_KNOCKBACK).toBe(5);
    expect(HEAVY_ATTACK_KNOCKBACK).toBe(10);
  });

  it('STAGE_COUNT matches STAGE_NAMES length', () => {
    expect(STAGE_COUNT).toBe(6);
    expect(STAGE_NAMES).toHaveLength(STAGE_COUNT);
  });

  it('each stage has name, nameEn, and desc', () => {
    for (const stage of STAGE_NAMES) {
      expect(stage.name).toBeTruthy();
      expect(stage.nameEn).toBeTruthy();
      expect(stage.desc).toBeTruthy();
    }
  });

  it('joystick constants are valid', () => {
    expect(JOYSTICK_DEAD_ZONE).toBe(0.2);
    expect(JOYSTICK_MAX_DIST).toBe(45);
  });
});

describe('Difficulty Settings', () => {
  it('has easy, normal, hard levels', () => {
    expect(DIFFICULTY_SETTINGS).toHaveProperty('easy');
    expect(DIFFICULTY_SETTINGS).toHaveProperty('normal');
    expect(DIFFICULTY_SETTINGS).toHaveProperty('hard');
  });

  it('difficulty escalates across levels', () => {
    const { easy, normal, hard } = DIFFICULTY_SETTINGS;
    expect(easy.dmgMultiplier).toBeLessThan(normal.dmgMultiplier);
    expect(normal.dmgMultiplier).toBeLessThan(hard.dmgMultiplier);
    expect(easy.aiBlockRate).toBeLessThan(hard.aiBlockRate);
    expect(easy.aiAttackRate).toBeLessThan(hard.aiAttackRate);
  });

  it('each difficulty has required fields', () => {
    for (const key of Object.keys(DIFFICULTY_SETTINGS)) {
      const s = DIFFICULTY_SETTINGS[key];
      expect(s.label).toBeTruthy();
      expect(s.aiBlockRate).toBeGreaterThanOrEqual(0);
      expect(s.aiAttackRate).toBeGreaterThanOrEqual(0);
      expect(s.dmgMultiplier).toBeGreaterThan(0);
    }
  });
});

describe('Faction Data', () => {
  it('has all four factions', () => {
    expect(Object.keys(FACTION_DATA)).toHaveLength(4);
    expect(FACTION_DATA).toHaveProperty('蜀漢');
    expect(FACTION_DATA).toHaveProperty('曹魏');
    expect(FACTION_DATA).toHaveProperty('孫吳');
    expect(FACTION_DATA).toHaveProperty('群雄');
  });

  it('each faction has color, bgColor, label, labelEn', () => {
    for (const key of Object.keys(FACTION_DATA)) {
      const f = FACTION_DATA[key];
      expect(f.color).toMatch(/^#/);
      expect(f.bgColor).toMatch(/^#/);
      expect(f.label).toBeTruthy();
      expect(f.labelEn).toBeTruthy();
    }
  });
});

describe('ANIM enum', () => {
  it('has all expected animation states', () => {
    const expected = [
      'idle',
      'run',
      'jump',
      'fall',
      'attack1',
      'attack2',
      'special',
      'ultimate',
      'block',
      'charge',
      'takeHit',
      'knockdown',
      'getup',
      'death',
    ];
    const values = Object.values(ANIM);
    for (const v of expected) {
      expect(values).toContain(v);
    }
  });
});

describe('MOVE_TYPE enum', () => {
  it('has all expected move types', () => {
    const expected = [
      'projectile',
      'rush',
      'uppercut',
      'spin',
      'area',
      'counter',
      'buff',
      'grab',
      'multi',
      'slam',
    ];
    const values = Object.values(MOVE_TYPE);
    for (const v of expected) {
      expect(values).toContain(v);
    }
  });
});

describe('CMD command patterns', () => {
  it('QCF is down-downforward-forward', () => {
    expect(CMD.QCF).toEqual(['D', 'DF', 'F']);
  });

  it('QCB is down-downback-back', () => {
    expect(CMD.QCB).toEqual(['D', 'DB', 'B']);
  });

  it('DPF is forward-down-downforward', () => {
    expect(CMD.DPF).toEqual(['F', 'D', 'DF']);
  });

  it('all commands are non-empty arrays', () => {
    for (const key of Object.keys(CMD)) {
      const cmd = CMD[key as keyof typeof CMD];
      expect(Array.isArray(cmd)).toBe(true);
      expect(cmd.length).toBeGreaterThan(0);
    }
  });
});

describe('GameMode enum', () => {
  it('has PVP, PVC, STORY', () => {
    expect(GameMode.PVP).toBe('pvp');
    expect(GameMode.PVC).toBe('pvcpu');
    expect(GameMode.STORY).toBe('story');
  });
});

describe('Difficulty enum', () => {
  it('has EASY, NORMAL, HARD', () => {
    expect(Difficulty.EASY).toBe('easy');
    expect(Difficulty.NORMAL).toBe('normal');
    expect(Difficulty.HARD).toBe('hard');
  });
});

describe('FACTIONS', () => {
  it('maps to Chinese faction names', () => {
    expect(FACTIONS.SHU).toBe('蜀漢');
    expect(FACTIONS.WEI).toBe('曹魏');
    expect(FACTIONS.WU).toBe('孫吳');
    expect(FACTIONS.OTHER).toBe('群雄');
  });
});
