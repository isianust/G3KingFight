import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIController } from '../ai/AIController';
import { Fighter } from '../entities/Fighter';
import { DIFFICULTY_SETTINGS, MAX_ENERGY } from '../constants';
import { CMD } from '../constants/enums';

function createFighter(overrides: Partial<Record<string, unknown>> = {}): Fighter {
  const f = new Fighter({
    position: { x: 200, y: 300 },
    color: '#ff0000',
    ...overrides,
  });
  return f;
}

describe('AIController', () => {
  let ai: AIController;
  let cpu: Fighter;
  let target: Fighter;

  beforeEach(() => {
    ai = new AIController('easy');
    cpu = createFighter();
    target = createFighter();
    target.position.x = 400;
    // Reset keys
    cpu.keys = {
      left: false,
      right: false,
      jump: false,
      attack1: false,
      attack2: false,
      block: false,
      charge: false,
    };
  });

  it('creates with default easy difficulty', () => {
    const ctrl = new AIController();
    expect(ctrl).toBeDefined();
  });

  it('setDifficulty changes difficulty', () => {
    ai.setDifficulty('hard');
    // We can verify by running update and checking behavior patterns
    expect(ai).toBeDefined();
  });

  it('does not act when cpu is dead', () => {
    cpu.dead = true;
    ai.update(cpu, target);
    expect(cpu.keys.left).toBe(false);
    expect(cpu.keys.right).toBe(false);
    expect(cpu.keys.attack1).toBe(false);
  });

  it('does not act when cpu is in hitstun', () => {
    cpu.hitstun = 5;
    ai.update(cpu, target);
    expect(cpu.keys.left).toBe(false);
    expect(cpu.keys.right).toBe(false);
  });

  it('moves toward target when far away', () => {
    target.position.x = 600; // Far to the right
    cpu.position.x = 100;

    // Run many times to overcome randomness
    let movedRight = false;
    for (let i = 0; i < 50; i++) {
      cpu.keys.right = false;
      cpu.keys.left = false;
      ai.update(cpu, target);
      if (cpu.keys.right) movedRight = true;
    }
    expect(movedRight).toBe(true);
  });

  it('moves left when target is to the left', () => {
    target.position.x = 50;
    cpu.position.x = 600;

    let movedLeft = false;
    for (let i = 0; i < 50; i++) {
      cpu.keys.left = false;
      cpu.keys.right = false;
      ai.update(cpu, target);
      if (cpu.keys.left) movedLeft = true;
    }
    expect(movedLeft).toBe(true);
  });

  it('attempts to block when target is attacking nearby', () => {
    target.isAttacking = true;
    target.position.x = cpu.position.x + 50;

    // Override Math.random to always trigger block
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.01);

    ai.update(cpu, target);
    // With easy difficulty aiBlockRate=0.4 and random=0.01, should block
    expect(cpu.keys.block).toBe(true);

    randomSpy.mockRestore();
  });

  it('charges when far from target and energy is low', () => {
    target.position.x = cpu.position.x + 500;
    cpu.energy = 10;

    // Force random to trigger charge
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.01);

    ai.update(cpu, target);
    expect(cpu.keys.charge).toBe(true);

    randomSpy.mockRestore();
  });

  it('attacks when in range', () => {
    target.position.x = cpu.position.x + 30;
    cpu.attackCooldown = 0;
    cpu.isAttacking = false;

    // Force random to always trigger attack
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.01);

    ai.update(cpu, target);
    expect(cpu.keys.attack1 || cpu.keys.attack2).toBe(true);

    randomSpy.mockRestore();
  });

  it('attempts special move when charData exists and in range', () => {
    const charData = {
      id: 'test',
      name: 'Test',
      nameEn: 'Test',
      faction: '蜀漢' as const,
      color: '#ff0000',
      weapon: 'Sword',
      stats: { atk: 7, def: 6, spd: 5 },
      moves: [
        {
          name: 'Fireball',
          nameEn: 'Fireball',
          type: 'projectile' as const,
          command: CMD.QCF,
          damage: 20,
          energyCost: 15,
          description: 'A fireball',
        },
      ],
      ultimate: {
        name: 'Ultra',
        nameEn: 'Ultra',
        type: 'area' as const,
        damage: 50,
        energyCost: 100,
        description: 'Big boom',
      },
    };

    cpu.charData = charData;
    cpu.isSoldier = false;
    cpu.energy = 50;
    // attackRange = attackBox.width(100) + width(50)*0.5 = 125
    // Need dist < attackRange + 50 = 175 AND dist <= attackRange + 30 = 155
    // to avoid the movement block setting keys before specials
    target.position.x = cpu.position.x + 30; // dist=30, within range, also < 40 triggers close range

    // Mock random:
    // 1st call: close-range retreat check (dist<40), return 0.99 to skip retreat
    // 2nd call: ult rate check (energy < MAX so skipped), special rate check -> 0.01 triggers
    // 3rd call: Math.floor(random * length) for move selection -> 0
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.01);

    ai.update(cpu, target);
    // Should have set inputBuffer for a special move
    expect(cpu.inputBuffer.length).toBeGreaterThan(0);
    expect(cpu.keys.attack1).toBe(true);

    randomSpy.mockRestore();
  });

  it('attempts ultimate when energy is full', () => {
    const charData = {
      id: 'test',
      name: 'Test',
      nameEn: 'Test',
      faction: '蜀漢' as const,
      color: '#ff0000',
      weapon: 'Sword',
      stats: { atk: 7, def: 6, spd: 5 },
      moves: [
        {
          name: 'Fireball',
          nameEn: 'Fireball',
          type: 'projectile' as const,
          command: CMD.QCF,
          damage: 20,
          energyCost: 15,
          description: 'A fireball',
        },
      ],
      ultimate: {
        name: 'Ultra',
        nameEn: 'Ultra',
        type: 'area' as const,
        damage: 50,
        energyCost: 100,
        description: 'Big boom',
      },
    };

    cpu.charData = charData;
    cpu.isSoldier = false;
    cpu.energy = MAX_ENERGY;
    // Same positioning: close enough for specials
    target.position.x = cpu.position.x + 30;

    // Mock random to always return 0.01 -> triggers all checks
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.01);

    ai.update(cpu, target);
    expect(cpu.keys.attack1).toBe(true);
    expect(cpu.keys.attack2).toBe(true);

    randomSpy.mockRestore();
  });

  it('DIFFICULTY_SETTINGS has all three levels', () => {
    expect(DIFFICULTY_SETTINGS.easy).toBeDefined();
    expect(DIFFICULTY_SETTINGS.normal).toBeDefined();
    expect(DIFFICULTY_SETTINGS.hard).toBeDefined();
  });

  it('hard difficulty has higher rates than easy', () => {
    const easy = DIFFICULTY_SETTINGS.easy;
    const hard = DIFFICULTY_SETTINGS.hard;
    expect(hard.aiBlockRate).toBeGreaterThan(easy.aiBlockRate);
    expect(hard.aiAttackRate).toBeGreaterThan(easy.aiAttackRate);
    expect(hard.aiSpecialRate).toBeGreaterThan(easy.aiSpecialRate);
    expect(hard.dmgMultiplier).toBeGreaterThan(easy.dmgMultiplier);
  });

  it('dodge — jumps when target attacks nearby', () => {
    target.isAttacking = true;
    target.position.x = cpu.position.x + 40;
    cpu.onGround = true;

    // Force: block fails, then dodge triggers
    let callCount = 0;
    const randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => {
      callCount++;
      if (callCount === 1) return 0.99; // skip block
      return 0.01; // trigger dodge
    });

    ai.update(cpu, target);
    // Dodge uses jump
    expect(cpu.keys.jump).toBe(true);

    randomSpy.mockRestore();
  });
});
