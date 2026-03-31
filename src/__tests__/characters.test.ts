import { describe, it, expect } from 'vitest';
import { CHARACTER_ROSTER, SOLDIER_TYPES } from '../data/characters';
import { FACTIONS } from '../constants/enums';

describe('CHARACTER_ROSTER', () => {
  it('contains at least 20 characters', () => {
    expect(CHARACTER_ROSTER.length).toBeGreaterThanOrEqual(20);
  });

  const expectedIds = [
    'guanyu',
    'zhangfei',
    'zhaoyun',
    'machao',
    'huangzhong',
    'caocao',
    'xiahoudun',
    'xiahouyuan',
    'xuhuang',
    'xuchu',
    'dianwei',
    'sunjian',
    'sunce',
    'zhouyu',
    'taishici',
    'ganning',
    'huanggai',
    'lvbu',
    'yuanshao',
    'dongzhuo',
  ];

  it('contains all expected character IDs', () => {
    const ids = CHARACTER_ROSTER.map((c) => c.id);
    for (const id of expectedIds) {
      expect(ids).toContain(id);
    }
  });

  it('all characters have unique IDs', () => {
    const ids = CHARACTER_ROSTER.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each character has required fields', () => {
    for (const char of CHARACTER_ROSTER) {
      expect(char.id).toBeTruthy();
      expect(char.name).toBeTruthy();
      expect(char.nameEn).toBeTruthy();
      expect(char.faction).toBeTruthy();
      expect(char.color).toMatch(/^#/);
      expect(char.weapon).toBeTruthy();
    }
  });

  it('each character has valid stats', () => {
    for (const char of CHARACTER_ROSTER) {
      expect(char.stats.atk).toBeGreaterThan(0);
      expect(char.stats.def).toBeGreaterThan(0);
      expect(char.stats.spd).toBeGreaterThan(0);
    }
  });

  it('each character belongs to a valid faction', () => {
    const validFactions = Object.values(FACTIONS);
    for (const char of CHARACTER_ROSTER) {
      expect(validFactions).toContain(char.faction);
    }
  });

  it('each character has at least one special move', () => {
    for (const char of CHARACTER_ROSTER) {
      expect(char.moves.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('each character has an ultimate move', () => {
    for (const char of CHARACTER_ROSTER) {
      expect(char.ultimate).toBeDefined();
      expect(char.ultimate.name).toBeTruthy();
      expect(char.ultimate.nameEn).toBeTruthy();
      expect(char.ultimate.damage).toBeGreaterThan(0);
      expect(char.ultimate.energyCost).toBeGreaterThan(0);
    }
  });

  it('special moves have valid data', () => {
    for (const char of CHARACTER_ROSTER) {
      for (const move of char.moves) {
        expect(move.name).toBeTruthy();
        expect(move.nameEn).toBeTruthy();
        expect(move.type).toBeTruthy();
        expect(move.command).toBeDefined();
        expect(Array.isArray(move.command)).toBe(true);
        // BUFF moves may have 0 damage (they provide stat boosts instead)
        if (move.type === 'buff') {
          expect(move.damage).toBeGreaterThanOrEqual(0);
        } else {
          expect(move.damage).toBeGreaterThan(0);
        }
        expect(move.energyCost).toBeGreaterThanOrEqual(0);
        expect(move.description).toBeTruthy();
      }
    }
  });

  it('Shu faction has at least 5 characters', () => {
    const shu = CHARACTER_ROSTER.filter((c) => c.faction === FACTIONS.SHU);
    expect(shu.length).toBeGreaterThanOrEqual(5);
  });

  it('Wei faction has at least 5 characters', () => {
    const wei = CHARACTER_ROSTER.filter((c) => c.faction === FACTIONS.WEI);
    expect(wei.length).toBeGreaterThanOrEqual(5);
  });

  it('Wu faction has at least 5 characters', () => {
    const wu = CHARACTER_ROSTER.filter((c) => c.faction === FACTIONS.WU);
    expect(wu.length).toBeGreaterThanOrEqual(5);
  });
});

describe('SOLDIER_TYPES', () => {
  it('contains at least 4 soldier types', () => {
    expect(SOLDIER_TYPES.length).toBeGreaterThanOrEqual(4);
  });

  const expectedSoldierIds = ['sword_soldier', 'blade_soldier', 'spear_soldier', 'archer_soldier'];

  it('contains all expected soldier IDs', () => {
    const ids = SOLDIER_TYPES.map((s) => s.id);
    for (const id of expectedSoldierIds) {
      expect(ids).toContain(id);
    }
  });

  it('all soldiers have unique IDs', () => {
    const ids = SOLDIER_TYPES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each soldier has required fields', () => {
    for (const soldier of SOLDIER_TYPES) {
      expect(soldier.id).toBeTruthy();
      expect(soldier.name).toBeTruthy();
      expect(soldier.nameEn).toBeTruthy();
      expect(soldier.color).toMatch(/^#/);
      expect(soldier.weapon).toBeTruthy();
      expect(soldier.description).toBeTruthy();
    }
  });

  it('each soldier has valid stats', () => {
    for (const soldier of SOLDIER_TYPES) {
      expect(soldier.stats.atk).toBeGreaterThan(0);
      expect(soldier.stats.def).toBeGreaterThan(0);
      expect(soldier.stats.spd).toBeGreaterThan(0);
    }
  });

  it('each soldier has a healthMultiplier between 0 and 1', () => {
    for (const soldier of SOLDIER_TYPES) {
      expect(soldier.healthMultiplier).toBeGreaterThan(0);
      expect(soldier.healthMultiplier).toBeLessThanOrEqual(1);
    }
  });

  it('each soldier has a positive attackRange', () => {
    for (const soldier of SOLDIER_TYPES) {
      expect(soldier.attackRange).toBeGreaterThan(0);
    }
  });
});
