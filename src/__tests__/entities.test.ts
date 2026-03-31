import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Sprite } from '../entities/Sprite';
import { Fighter } from '../entities/Fighter';
import { Projectile } from '../entities/Projectile';
import { HERO_MAX_HEALTH, MAX_ENERGY, ENERGY_GAIN_HURT } from '../constants/gameConfig';
import { ANIM, CMD } from '../constants/enums';
import type { CharacterData } from '../types';

// Mock canvas context
function createMockCtx(): CanvasRenderingContext2D {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    shadowColor: '',
    shadowBlur: 0,
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
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  } as unknown as CanvasRenderingContext2D;
}

function createMockCharData(): CharacterData {
  return {
    id: 'test_char',
    name: 'Test',
    nameEn: 'Test',
    faction: '蜀漢',
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
}

// ============ Sprite Tests ============
describe('Sprite', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockCtx();
  });

  it('initializes with default values', () => {
    const sprite = new Sprite({ position: { x: 100, y: 200 } });
    expect(sprite.position).toEqual({ x: 100, y: 200 });
    expect(sprite.width).toBe(50);
    expect(sprite.height).toBe(150);
    expect(sprite.color).toBe('#888');
    expect(sprite.scale).toBe(1);
    expect(sprite.framesMax).toBe(1);
    expect(sprite.framesCurrent).toBe(0);
    expect(sprite.framesElapsed).toBe(0);
    expect(sprite.framesHold).toBe(8);
    expect(sprite.offset).toEqual({ x: 0, y: 0 });
    expect(sprite.image).toBeNull();
    expect(sprite.loaded).toBe(false);
  });

  it('accepts custom config', () => {
    const sprite = new Sprite({
      position: { x: 10, y: 20 },
      color: '#ff0000',
      width: 80,
      height: 120,
      scale: 2,
      framesMax: 4,
      offset: { x: 5, y: 10 },
    });
    expect(sprite.color).toBe('#ff0000');
    expect(sprite.width).toBe(80);
    expect(sprite.height).toBe(120);
    expect(sprite.scale).toBe(2);
    expect(sprite.framesMax).toBe(4);
    expect(sprite.offset).toEqual({ x: 5, y: 10 });
  });

  it('draw renders a rectangle when no image is loaded', () => {
    const sprite = new Sprite({ position: { x: 0, y: 0 } });
    sprite.draw(ctx);
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 50, 150);
  });

  it('animateFrames cycles through frames', () => {
    const sprite = new Sprite({ position: { x: 0, y: 0 }, framesMax: 3 });
    expect(sprite.framesCurrent).toBe(0);

    // framesHold = 8, so it should advance after 8 elapsed ticks
    for (let i = 0; i < 8; i++) {
      sprite.animateFrames();
    }
    expect(sprite.framesCurrent).toBe(1);

    for (let i = 0; i < 8; i++) {
      sprite.animateFrames();
    }
    expect(sprite.framesCurrent).toBe(2);

    // Wraps around
    for (let i = 0; i < 8; i++) {
      sprite.animateFrames();
    }
    expect(sprite.framesCurrent).toBe(0);
  });

  it('update calls draw and animateFrames', () => {
    const sprite = new Sprite({ position: { x: 0, y: 0 } });
    const drawSpy = vi.spyOn(sprite, 'draw');
    const animSpy = vi.spyOn(sprite, 'animateFrames');
    sprite.update(ctx);
    expect(drawSpy).toHaveBeenCalledWith(ctx);
    expect(animSpy).toHaveBeenCalled();
  });
});

// ============ Fighter Tests ============
describe('Fighter', () => {
  let fighter: Fighter;

  beforeEach(() => {
    fighter = new Fighter({
      position: { x: 100, y: 300 },
      color: '#ff0000',
    });
  });

  describe('constructor', () => {
    it('sets default health to HERO_MAX_HEALTH', () => {
      expect(fighter.maxHealth).toBe(HERO_MAX_HEALTH);
      expect(fighter.health).toBe(HERO_MAX_HEALTH);
    });

    it('soldier health scales by healthMultiplier', () => {
      const soldierType = {
        id: 'test_soldier',
        name: 'Test',
        nameEn: 'Test',
        color: '#aaa',
        weapon: 'Sword',
        stats: { atk: 3, def: 3, spd: 3 },
        healthMultiplier: 0.2,
        attackRange: 50,
        description: 'test',
      };
      const soldier = new Fighter({
        position: { x: 0, y: 0 },
        isSoldier: true,
        soldierType,
      });
      expect(soldier.maxHealth).toBe(HERO_MAX_HEALTH * 0.2);
      expect(soldier.health).toBe(soldier.maxHealth);
    });

    it('initializes energy to 0', () => {
      expect(fighter.energy).toBe(0);
      expect(fighter.maxEnergy).toBe(MAX_ENERGY);
    });

    it('initializes knockdown bar to 100', () => {
      expect(fighter.knockdownBar).toBe(100);
      expect(fighter.knockdownBarMax).toBe(100);
    });

    it('initializes facing right by default', () => {
      expect(fighter.facingRight).toBe(true);
    });

    it('starts not dead, not attacking, not blocking', () => {
      expect(fighter.dead).toBe(false);
      expect(fighter.isAttacking).toBe(false);
      expect(fighter.isBlocking).toBe(false);
      expect(fighter.isCharging).toBe(false);
    });

    it('initializes with IDLE animation', () => {
      expect(fighter.currentAnim).toBe(ANIM.IDLE);
    });
  });

  describe('startAttack', () => {
    it('starts light attack (type 1)', () => {
      fighter.startAttack(1);
      expect(fighter.isAttacking).toBe(true);
      expect(fighter.attackType).toBe(1);
      expect(fighter.attackDuration).toBe(8);
      expect(fighter.currentAnim).toBe(ANIM.ATTACK1);
      expect(fighter.hasHitThisSwing).toBe(false);
    });

    it('starts heavy attack (type 2)', () => {
      fighter.startAttack(2);
      expect(fighter.isAttacking).toBe(true);
      expect(fighter.attackType).toBe(2);
      expect(fighter.attackDuration).toBe(14);
      expect(fighter.currentAnim).toBe(ANIM.ATTACK2);
    });

    it('does not attack while already attacking', () => {
      fighter.startAttack(1);
      fighter.startAttack(2);
      // Should still be attack type 1
      expect(fighter.attackType).toBe(1);
    });

    it('does not attack while dead', () => {
      fighter.dead = true;
      fighter.startAttack(1);
      expect(fighter.isAttacking).toBe(false);
    });

    it('does not attack while in hitstun', () => {
      fighter.hitstun = 5;
      fighter.startAttack(1);
      expect(fighter.isAttacking).toBe(false);
    });

    it('does not attack while blocking', () => {
      fighter.isBlocking = true;
      fighter.startAttack(1);
      expect(fighter.isAttacking).toBe(false);
    });

    it('does not attack during cooldown', () => {
      fighter.attackCooldown = 10;
      fighter.startAttack(1);
      expect(fighter.isAttacking).toBe(false);
    });
  });

  describe('startBlock / stopBlock', () => {
    it('starts blocking', () => {
      fighter.startBlock();
      expect(fighter.isBlocking).toBe(true);
      expect(fighter.currentAnim).toBe(ANIM.BLOCK);
    });

    it('stops blocking and returns to idle', () => {
      fighter.startBlock();
      fighter.stopBlock();
      expect(fighter.isBlocking).toBe(false);
      expect(fighter.currentAnim).toBe(ANIM.IDLE);
    });

    it('does not block while dead', () => {
      fighter.dead = true;
      fighter.startBlock();
      expect(fighter.isBlocking).toBe(false);
    });

    it('does not block while attacking', () => {
      fighter.isAttacking = true;
      fighter.startBlock();
      expect(fighter.isBlocking).toBe(false);
    });
  });

  describe('startCharge / stopCharge', () => {
    it('starts charging', () => {
      fighter.startCharge();
      expect(fighter.isCharging).toBe(true);
      expect(fighter.currentAnim).toBe(ANIM.CHARGE);
    });

    it('stops charging', () => {
      fighter.startCharge();
      fighter.stopCharge();
      expect(fighter.isCharging).toBe(false);
      expect(fighter.currentAnim).toBe(ANIM.IDLE);
    });

    it('does not charge when already at max energy', () => {
      fighter.energy = MAX_ENERGY;
      fighter.startCharge();
      expect(fighter.isCharging).toBe(false);
    });

    it('does not charge while dead', () => {
      fighter.dead = true;
      fighter.startCharge();
      expect(fighter.isCharging).toBe(false);
    });
  });

  describe('takeHit', () => {
    it('reduces health by damage amount', () => {
      fighter.takeHit(30, 5, 'light');
      expect(fighter.health).toBe(HERO_MAX_HEALTH - 30);
    });

    it('grants energy when hurt', () => {
      fighter.takeHit(10, 5, 'light');
      expect(fighter.energy).toBe(ENERGY_GAIN_HURT);
    });

    it('caps energy at maxEnergy', () => {
      fighter.energy = MAX_ENERGY - 2;
      fighter.takeHit(10, 5, 'light');
      expect(fighter.energy).toBe(MAX_ENERGY);
    });

    it('sets dead=true when health reaches 0', () => {
      fighter.takeHit(HERO_MAX_HEALTH, 5, 'heavy');
      expect(fighter.health).toBe(0);
      expect(fighter.dead).toBe(true);
      expect(fighter.currentAnim).toBe(ANIM.DEATH);
    });

    it('does not take damage when dead', () => {
      fighter.dead = true;
      const healthBefore = fighter.health;
      fighter.takeHit(50, 5, 'light');
      expect(fighter.health).toBe(healthBefore);
    });

    it('does not take damage when invincible', () => {
      fighter.isInvincible = true;
      const healthBefore = fighter.health;
      fighter.takeHit(50, 5, 'light');
      expect(fighter.health).toBe(healthBefore);
    });

    it('does not take damage when knocked down', () => {
      fighter.isKnockedDown = true;
      const healthBefore = fighter.health;
      fighter.takeHit(50, 5, 'light');
      expect(fighter.health).toBe(healthBefore);
    });

    it('blocking prevents health damage and grants energy', () => {
      fighter.startBlock();
      const healthBefore = fighter.health;
      fighter.takeHit(50, 10, 'heavy');
      expect(fighter.health).toBe(healthBefore);
      expect(fighter.blockStun).toBe(8);
      expect(fighter.energy).toBe(3);
    });

    it('applies hitstun for light attacks', () => {
      fighter.takeHit(10, 5, 'light');
      expect(fighter.hitstun).toBe(8); // HITSTUN_LIGHT
    });

    it('applies hitstun for heavy attacks', () => {
      fighter.takeHit(10, 5, 'heavy');
      expect(fighter.hitstun).toBe(12); // HITSTUN_HEAVY
    });

    it('triggers knockdown when knockdown bar depleted', () => {
      // knockdownBar starts at 100, KNOCKDOWN_BAR_SPECIAL = 100
      fighter.takeHit(10, 5, 'special');
      expect(fighter.isKnockedDown).toBe(true);
      expect(fighter.currentAnim).toBe(ANIM.KNOCKDOWN);
      expect(fighter.knockdownBar).toBe(100); // reset after knockdown
    });

    it('light attacks deplete knockdown bar by 20', () => {
      fighter.takeHit(5, 2, 'light');
      expect(fighter.knockdownBar).toBe(80); // 100 - 20
    });

    it('heavy attacks deplete knockdown bar by 50', () => {
      fighter.takeHit(5, 2, 'heavy');
      expect(fighter.knockdownBar).toBe(50); // 100 - 50
    });

    it('stops charging when hit', () => {
      fighter.startCharge();
      fighter.takeHit(10, 5, 'light');
      expect(fighter.isCharging).toBe(false);
    });
  });

  describe('knockdown system', () => {
    it('_startKnockdown sets correct state', () => {
      fighter._startKnockdown(10);
      expect(fighter.isKnockedDown).toBe(true);
      expect(fighter.currentAnim).toBe(ANIM.KNOCKDOWN);
      expect(fighter.knockbackVel).toBe(15); // knockback * 1.5
      expect(fighter.velocity.y).toBe(-8);
      expect(fighter.onGround).toBe(false);
      expect(fighter.knockdownBar).toBe(fighter.knockdownBarMax);
    });

    it('_startGetup transitions from knockdown', () => {
      fighter._startKnockdown(5);
      fighter._startGetup();
      expect(fighter.isKnockedDown).toBe(false);
      expect(fighter.isGettingUp).toBe(true);
      expect(fighter.currentAnim).toBe(ANIM.GETUP);
    });

    it('_startInvincibility transitions from getup', () => {
      fighter._startGetup();
      fighter._startInvincibility();
      expect(fighter.isGettingUp).toBe(false);
      expect(fighter.isInvincible).toBe(true);
      expect(fighter.currentAnim).toBe(ANIM.IDLE);
    });
  });

  describe('command input', () => {
    it('recordInput stores direction', () => {
      fighter.recordInput('D');
      expect(fighter.inputBuffer).toContain('D');
    });

    it('recordInput does not duplicate consecutive same direction', () => {
      fighter.recordInput('D');
      fighter.recordInput('D');
      expect(fighter.inputBuffer).toHaveLength(1);
    });

    it('recordInput adds different directions', () => {
      fighter.recordInput('D');
      fighter.recordInput('DF');
      fighter.recordInput('F');
      expect(fighter.inputBuffer).toEqual(['D', 'DF', 'F']);
    });

    it('matchCommand returns true for matching pattern', () => {
      fighter.recordInput('D');
      fighter.recordInput('DF');
      fighter.recordInput('F');
      expect(fighter.matchCommand(['D', 'DF', 'F'])).toBe(true);
    });

    it('matchCommand returns false for non-matching pattern', () => {
      fighter.recordInput('D');
      fighter.recordInput('DB');
      expect(fighter.matchCommand(['D', 'DF', 'F'])).toBe(false);
    });

    it('matchCommand returns false if buffer too short', () => {
      fighter.recordInput('D');
      expect(fighter.matchCommand(['D', 'DF', 'F'])).toBe(false);
    });
  });

  describe('executeSpecialMove', () => {
    it('sets up special move state', () => {
      const charData = createMockCharData();
      fighter.charData = charData;
      fighter.energy = 50;

      const move = charData.moves[0];
      fighter.executeSpecialMove(move, false);

      expect(fighter.isUsingSpecial).toBe(true);
      expect(fighter.isUsingUltimate).toBe(false);
      expect(fighter.currentSpecialMove).toBe(move);
      expect(fighter.energy).toBe(50 - move.energyCost);
      expect(fighter.currentAnim).toBe(ANIM.SPECIAL);
      expect(fighter.isAttacking).toBe(true);
      expect(fighter.inputBuffer).toEqual([]);
    });

    it('sets up ultimate move state', () => {
      const charData = createMockCharData();
      fighter.charData = charData;
      fighter.energy = 100;

      const ult = charData.ultimate;
      fighter.executeSpecialMove(ult, true);

      expect(fighter.isUsingSpecial).toBe(true);
      expect(fighter.isUsingUltimate).toBe(true);
      expect(fighter.currentAnim).toBe(ANIM.ULTIMATE);
      expect(fighter.ultimateFlash).toBe(30);
      expect(fighter.energy).toBe(0);
    });
  });

  describe('trySpecialMove', () => {
    it('returns false for soldiers', () => {
      fighter.isSoldier = true;
      expect(fighter.trySpecialMove()).toBe(false);
    });

    it('returns false without charData', () => {
      expect(fighter.trySpecialMove()).toBe(false);
    });

    it('returns false when dead', () => {
      fighter.charData = createMockCharData();
      fighter.dead = true;
      expect(fighter.trySpecialMove()).toBe(false);
    });

    it('returns false when already using special', () => {
      fighter.charData = createMockCharData();
      fighter.isUsingSpecial = true;
      expect(fighter.trySpecialMove()).toBe(false);
    });

    it('executes matching special move with enough energy', () => {
      const charData = createMockCharData();
      fighter.charData = charData;
      fighter.energy = 50;

      // Input the QCF command
      fighter.recordInput('D');
      fighter.recordInput('DF');
      fighter.recordInput('F');

      const result = fighter.trySpecialMove();
      expect(result).toBe(true);
      expect(fighter.isUsingSpecial).toBe(true);
    });
  });
});

// ============ Projectile Tests ============
describe('Projectile', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockCtx();
  });

  it('initializes with provided values', () => {
    const proj = new Projectile({
      x: 100,
      y: 200,
      vx: 10,
      damage: 20,
      color: '#ff0000',
      owner: {},
    });
    expect(proj.position).toEqual({ x: 100, y: 200 });
    expect(proj.vx).toBe(10);
    expect(proj.vy).toBe(0);
    expect(proj.damage).toBe(20);
    expect(proj.color).toBe('#ff0000');
    expect(proj.active).toBe(true);
    expect(proj.life).toBe(90);
  });

  it('uses default values for optional params', () => {
    const proj = new Projectile({
      x: 0,
      y: 0,
      vx: 5,
      damage: 10,
      owner: null,
    });
    expect(proj.color).toBe('#ffcc00');
    expect(proj.width).toBe(30);
    expect(proj.height).toBe(15);
    expect(proj.life).toBe(90);
    expect(proj.vy).toBe(0);
  });

  it('accepts custom dimensions and life', () => {
    const proj = new Projectile({
      x: 0,
      y: 0,
      vx: 5,
      vy: 2,
      damage: 10,
      owner: null,
      width: 50,
      height: 25,
      life: 120,
    });
    expect(proj.width).toBe(50);
    expect(proj.height).toBe(25);
    expect(proj.life).toBe(120);
    expect(proj.vy).toBe(2);
  });

  it('moves according to velocity on update', () => {
    const proj = new Projectile({
      x: 100,
      y: 200,
      vx: 10,
      vy: -2,
      damage: 15,
      owner: null,
    });
    proj.update(ctx);
    expect(proj.position.x).toBe(110);
    expect(proj.position.y).toBe(198);
    expect(proj.life).toBe(89);
  });

  it('decrements life each update', () => {
    const proj = new Projectile({
      x: 100,
      y: 100,
      vx: 5,
      damage: 10,
      owner: null,
      life: 3,
    });
    proj.update(ctx);
    expect(proj.life).toBe(2);
    proj.update(ctx);
    expect(proj.life).toBe(1);
    proj.update(ctx);
    expect(proj.life).toBe(0);
    expect(proj.active).toBe(false);
  });

  it('deactivates when life reaches 0', () => {
    const proj = new Projectile({
      x: 100,
      y: 100,
      vx: 0,
      damage: 5,
      owner: null,
      life: 1,
    });
    proj.update(ctx);
    expect(proj.active).toBe(false);
  });

  it('deactivates when going off-screen left', () => {
    const proj = new Projectile({
      x: -40,
      y: 100,
      vx: -20,
      damage: 5,
      owner: null,
    });
    proj.update(ctx);
    // position.x = -60, which is < -50
    expect(proj.active).toBe(false);
  });

  it('deactivates when going off-screen right', () => {
    const proj = new Projectile({
      x: 1080,
      y: 100,
      vx: 20,
      damage: 5,
      owner: null,
    });
    // CANVAS_W = 1024, so limit is 1074; position after update = 1100
    proj.update(ctx);
    expect(proj.active).toBe(false);
  });

  it('does not update when inactive', () => {
    const proj = new Projectile({
      x: 100,
      y: 100,
      vx: 10,
      damage: 5,
      owner: null,
    });
    proj.active = false;
    const xBefore = proj.position.x;
    const lifeBefore = proj.life;
    proj.update(ctx);
    expect(proj.position.x).toBe(xBefore);
    expect(proj.life).toBe(lifeBefore);
  });
});
