import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EffectsRenderer } from '../rendering/EffectsRenderer';
import { Fighter } from '../entities/Fighter';
import { MOVE_TYPE } from '../constants/enums';
import {
  CANVAS_W,
  CANVAS_H,
  LIGHT_ATTACK_DAMAGE,
  HEAVY_ATTACK_DAMAGE,
  LIGHT_ATTACK_KNOCKBACK,
  HEAVY_ATTACK_KNOCKBACK,
  ENERGY_GAIN_HIT,
  MAX_ENERGY,
} from '../constants';

// --------------- helpers ---------------

function createMockCtx(): CanvasRenderingContext2D {
  return {
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
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  } as unknown as CanvasRenderingContext2D;
}

function createFighter(overrides: Record<string, unknown> = {}): Fighter {
  return new Fighter({
    position: { x: 200, y: 300 },
    color: '#ff0000',
    ...overrides,
  });
}

/** Place the attacker's attackBox so it overlaps the defender. */
function positionForHit(attacker: Fighter, defender: Fighter): void {
  defender.position.x = attacker.position.x + attacker.attackBox.offset.x + 10;
  defender.position.y = attacker.position.y;
}

/** Place the defender far away so there is no overlap. */
function positionForMiss(attacker: Fighter, defender: Fighter): void {
  defender.position.x = attacker.position.x + 9999;
  defender.position.y = attacker.position.y;
}

// --------------- tests ---------------

describe('EffectsRenderer', () => {
  let fx: EffectsRenderer;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    fx = new EffectsRenderer();
    ctx = createMockCtx();
  });

  // ========== 1. reset ==========

  describe('reset()', () => {
    it('clears hitEffects, projectiles and resets screen state', () => {
      fx.hitEffects.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 5,
        maxLife: 10,
        r: 2,
        color: '#fff',
      });
      fx.triggerScreenShake(10, 20);
      fx.triggerScreenFlash('#fff', 0.5, 10);
      fx.triggerSlowMotion(15);

      fx.reset();

      expect(fx.hitEffects).toHaveLength(0);
      expect(fx.projectiles).toHaveLength(0);
      expect(fx.slowMotion.active).toBe(false);
      expect(fx.slowMotion.timer).toBe(0);
    });
  });

  // ========== 2. Screen shake ==========

  describe('triggerScreenShake / applyScreenShake', () => {
    it('sets intensity, duration and timer', () => {
      fx.triggerScreenShake(5, 10);
      // apply once — timer should decrement and return true
      const shaking = fx.applyScreenShake(ctx);
      expect(shaking).toBe(true);
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.translate).toHaveBeenCalled();
    });

    it('returns false when no shake is active', () => {
      expect(fx.applyScreenShake(ctx)).toBe(false);
      expect(ctx.save).not.toHaveBeenCalled();
    });

    it('decrements timer each call and eventually stops', () => {
      fx.triggerScreenShake(4, 3);
      expect(fx.applyScreenShake(ctx)).toBe(true); // timer 3→2
      expect(fx.applyScreenShake(ctx)).toBe(true); // timer 2→1
      expect(fx.applyScreenShake(ctx)).toBe(true); // timer 1→0
      expect(fx.applyScreenShake(ctx)).toBe(false); // timer 0
    });
  });

  // ========== 3. Screen flash ==========

  describe('triggerScreenFlash / drawScreenFlash', () => {
    it('draws a rectangle covering the canvas while timer > 0', () => {
      fx.triggerScreenFlash('#ff0000', 0.6, 5);

      fx.drawScreenFlash(ctx);

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, CANVAS_W, CANVAS_H);
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('does nothing when no flash is active', () => {
      fx.drawScreenFlash(ctx);
      expect(ctx.fillRect).not.toHaveBeenCalled();
    });

    it('decrements timer each call and fades alpha', () => {
      fx.triggerScreenFlash('#fff', 1.0, 4);

      // call 1 — timer 4→3, progress = 3/4 = 0.75, alpha = 0.75
      fx.drawScreenFlash(ctx);
      expect(ctx.globalAlpha).toBeCloseTo(0.75);

      // call 2 — timer 3→2, progress = 2/4 = 0.5
      fx.drawScreenFlash(ctx);
      expect(ctx.globalAlpha).toBeCloseTo(0.5);

      // call 3 — timer 2→1, progress = 1/4 = 0.25
      fx.drawScreenFlash(ctx);
      expect(ctx.globalAlpha).toBeCloseTo(0.25);

      // call 4 — timer 1→0, progress = 0
      fx.drawScreenFlash(ctx);
      expect(ctx.globalAlpha).toBeCloseTo(0.0);

      // no more drawing
      (ctx.fillRect as ReturnType<typeof vi.fn>).mockClear();
      fx.drawScreenFlash(ctx);
      expect(ctx.fillRect).not.toHaveBeenCalled();
    });
  });

  // ========== 4. Slow motion ==========

  describe('triggerSlowMotion / updateSlowMotion', () => {
    it('activates slow motion with a timer', () => {
      fx.triggerSlowMotion(10);
      expect(fx.slowMotion.active).toBe(true);
      expect(fx.slowMotion.timer).toBe(10);
      expect(fx.slowMotion.duration).toBe(10);
    });

    it('counts down and deactivates', () => {
      fx.triggerSlowMotion(3);
      fx.updateSlowMotion(); // 3→2
      expect(fx.slowMotion.active).toBe(true);
      fx.updateSlowMotion(); // 2→1
      expect(fx.slowMotion.active).toBe(true);
      fx.updateSlowMotion(); // 1→0 → deactivate
      expect(fx.slowMotion.active).toBe(false);
    });

    it('does nothing when not active', () => {
      fx.updateSlowMotion();
      expect(fx.slowMotion.active).toBe(false);
      expect(fx.slowMotion.timer).toBe(0);
    });
  });

  // ========== 5 & 6. spawnHitEffect ==========

  describe('spawnHitEffect', () => {
    it('spawns 10 circle particles for a normal hit and triggers shake(3,4)', () => {
      fx.spawnHitEffect(100, 200, false);

      const circles = fx.hitEffects.filter((p) => p.type === 'circle');
      expect(circles).toHaveLength(10);
      // screen shake was triggered (we verify by applying it)
      expect(fx.applyScreenShake(ctx)).toBe(true);
      // intensity 3, duration 4 — should exhaust in 4 ticks
      expect(fx.applyScreenShake(ctx)).toBe(true);
      expect(fx.applyScreenShake(ctx)).toBe(true);
      expect(fx.applyScreenShake(ctx)).toBe(true);
      expect(fx.applyScreenShake(ctx)).toBe(false);
    });

    it('spawns 20 circle + 8 line particles for a special hit and triggers shake(6,8)', () => {
      fx.spawnHitEffect(100, 200, true);

      const circles = fx.hitEffects.filter((p) => p.type === 'circle');
      const lines = fx.hitEffects.filter((p) => p.type === 'line');
      expect(circles).toHaveLength(20);
      expect(lines).toHaveLength(8);

      // All line sparks have a length property
      for (const l of lines) {
        expect(l.length).toBeGreaterThanOrEqual(12);
        expect(l.color).toBe('#ffffff');
      }

      // shake should last 8 ticks
      for (let i = 0; i < 8; i++) {
        expect(fx.applyScreenShake(ctx)).toBe(true);
      }
      expect(fx.applyScreenShake(ctx)).toBe(false);
    });
  });

  // ========== 7–13. checkAttackCollision ==========

  describe('checkAttackCollision', () => {
    let attacker: Fighter;
    let defender: Fighter;

    beforeEach(() => {
      attacker = createFighter();
      defender = createFighter({ position: { x: 400, y: 300 } });
    });

    // 7
    it('does nothing when attacker is not attacking', () => {
      attacker.isAttacking = false;
      positionForHit(attacker, defender);
      const healthBefore = defender.health;

      fx.checkAttackCollision(attacker, defender);

      expect(defender.health).toBe(healthBefore);
      expect(fx.hitEffects).toHaveLength(0);
    });

    // 8
    it('does nothing when hasHitThisSwing is true', () => {
      attacker.isAttacking = true;
      attacker.hasHitThisSwing = true;
      positionForHit(attacker, defender);
      const healthBefore = defender.health;

      fx.checkAttackCollision(attacker, defender);

      expect(defender.health).toBe(healthBefore);
    });

    // 9
    it('does nothing when defender is dead', () => {
      attacker.isAttacking = true;
      attacker.hasHitThisSwing = false;
      defender.dead = true;
      positionForHit(attacker, defender);

      fx.checkAttackCollision(attacker, defender);

      expect(fx.hitEffects).toHaveLength(0);
    });

    // 10
    it('applies light attack damage correctly', () => {
      attacker.isAttacking = true;
      attacker.hasHitThisSwing = false;
      attacker.attackType = 1;
      positionForHit(attacker, defender);

      vi.spyOn(defender, 'takeHit');
      fx.checkAttackCollision(attacker, defender);

      expect(defender.takeHit).toHaveBeenCalledWith(
        LIGHT_ATTACK_DAMAGE,
        expect.any(Number),
        'light',
      );
      expect(attacker.hasHitThisSwing).toBe(true);
    });

    // 11
    it('applies heavy attack damage correctly', () => {
      attacker.isAttacking = true;
      attacker.hasHitThisSwing = false;
      attacker.attackType = 2;
      positionForHit(attacker, defender);

      vi.spyOn(defender, 'takeHit');
      fx.checkAttackCollision(attacker, defender);

      expect(defender.takeHit).toHaveBeenCalledWith(
        HEAVY_ATTACK_DAMAGE,
        expect.any(Number),
        'heavy',
      );
    });

    // 12
    it('applies special move damage (melee type)', () => {
      attacker.isAttacking = true;
      attacker.hasHitThisSwing = false;
      attacker.isUsingSpecial = true;
      attacker.currentSpecialMove = {
        name: 'TestSpecial',
        nameEn: 'TestSpecial',
        type: MOVE_TYPE.RUSH,
        damage: 30,
        energyCost: 25,
        command: [],
        duration: 20,
        description: '',
      } as unknown as Fighter['currentSpecialMove'];
      positionForHit(attacker, defender);

      vi.spyOn(defender, 'takeHit');
      fx.checkAttackCollision(attacker, defender);

      expect(defender.takeHit).toHaveBeenCalledWith(
        30, // damage / 1 hit
        expect.any(Number),
        'special',
      );
    });

    // 13
    it('triggers flash, shake, and slow motion for ultimate attacks', () => {
      attacker.isAttacking = true;
      attacker.hasHitThisSwing = false;
      attacker.isUsingSpecial = true;
      attacker.isUsingUltimate = true;
      attacker.currentSpecialMove = {
        name: 'UltMove',
        nameEn: 'UltMove',
        type: MOVE_TYPE.RUSH,
        damage: 50,
        energyCost: 100,
        command: [],
        duration: 20,
        color: '#ffd700',
        description: '',
      } as unknown as Fighter['currentSpecialMove'];
      positionForHit(attacker, defender);

      vi.spyOn(defender, 'takeHit');
      fx.checkAttackCollision(attacker, defender);

      expect(defender.takeHit).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'special',
      );

      // Ultimate effects
      expect(fx.slowMotion.active).toBe(true);
      expect(fx.slowMotion.duration).toBe(8);

      // Screen flash was triggered — drawScreenFlash should draw
      fx.drawScreenFlash(ctx);
      expect(ctx.fillRect).toHaveBeenCalled();

      // Screen shake (ultimate triggers shake(10,12)) — should work for 12 ticks
      // (spawnHitEffect also triggers shake, but the ultimate shake(10,12) overwrites it)
      let shakeCount = 0;
      while (fx.applyScreenShake(ctx)) shakeCount++;
      expect(shakeCount).toBeGreaterThanOrEqual(1);
    });

    it('adds a damage number particle on hit', () => {
      attacker.isAttacking = true;
      attacker.hasHitThisSwing = false;
      attacker.attackType = 1;
      positionForHit(attacker, defender);

      fx.checkAttackCollision(attacker, defender);

      const dmgNumbers = fx.hitEffects.filter((p) => p.isDamageNumber);
      expect(dmgNumbers).toHaveLength(1);
      expect(dmgNumbers[0].damageText).toBe(String(LIGHT_ATTACK_DAMAGE));
    });

    // 14
    it('spawns a projectile (not melee hit) for projectile-type special at frame 5', () => {
      attacker.isAttacking = true;
      attacker.hasHitThisSwing = false;
      attacker.isUsingSpecial = true;
      attacker.attackFrame = 5;
      attacker.currentSpecialMove = {
        name: 'Fireball',
        nameEn: 'Fireball',
        type: MOVE_TYPE.PROJECTILE,
        damage: 25,
        energyCost: 30,
        command: [],
        duration: 20,
        color: '#ff6600',
        description: '',
      } as unknown as Fighter['currentSpecialMove'];
      positionForHit(attacker, defender);

      fx.checkAttackCollision(attacker, defender);

      expect(fx.projectiles).toHaveLength(1);
      expect(attacker.hasHitThisSwing).toBe(true);
      // No hit effects because this is a projectile spawn, not a melee hit
      expect(fx.hitEffects).toHaveLength(0);
    });

    it('does not spawn projectile for projectile-type special at frame != 5', () => {
      attacker.isAttacking = true;
      attacker.hasHitThisSwing = false;
      attacker.isUsingSpecial = true;
      attacker.attackFrame = 3;
      attacker.currentSpecialMove = {
        name: 'Fireball',
        nameEn: 'Fireball',
        type: MOVE_TYPE.PROJECTILE,
        damage: 25,
        energyCost: 30,
        command: [],
        duration: 20,
        color: '#ff6600',
        description: '',
      } as unknown as Fighter['currentSpecialMove'];
      positionForMiss(attacker, defender);

      fx.checkAttackCollision(attacker, defender);

      expect(fx.projectiles).toHaveLength(0);
    });

    // 15
    it('grants energy on hit (capped at maxEnergy)', () => {
      attacker.isAttacking = true;
      attacker.hasHitThisSwing = false;
      attacker.attackType = 1;
      attacker.energy = 0;
      positionForHit(attacker, defender);

      fx.checkAttackCollision(attacker, defender);

      expect(attacker.energy).toBe(ENERGY_GAIN_HIT);
    });

    it('caps energy at maxEnergy', () => {
      attacker.isAttacking = true;
      attacker.hasHitThisSwing = false;
      attacker.attackType = 1;
      attacker.energy = MAX_ENERGY - 2;
      positionForHit(attacker, defender);

      fx.checkAttackCollision(attacker, defender);

      expect(attacker.energy).toBe(MAX_ENERGY);
    });

    it('does not hit when attack box does not overlap defender', () => {
      attacker.isAttacking = true;
      attacker.hasHitThisSwing = false;
      attacker.attackType = 1;
      positionForMiss(attacker, defender);

      const healthBefore = defender.health;
      fx.checkAttackCollision(attacker, defender);

      expect(defender.health).toBe(healthBefore);
      expect(attacker.hasHitThisSwing).toBe(false);
    });

    it('respects attacker _atkMultiplier', () => {
      attacker.isAttacking = true;
      attacker.hasHitThisSwing = false;
      attacker.attackType = 1;
      attacker._atkMultiplier = 2;
      positionForHit(attacker, defender);

      vi.spyOn(defender, 'takeHit');
      fx.checkAttackCollision(attacker, defender);

      expect(defender.takeHit).toHaveBeenCalledWith(
        LIGHT_ATTACK_DAMAGE * 2,
        expect.any(Number),
        'light',
      );
    });

    it('respects defender _defMultiplier', () => {
      attacker.isAttacking = true;
      attacker.hasHitThisSwing = false;
      attacker.attackType = 2;
      defender._defMultiplier = 0.5;
      positionForHit(attacker, defender);

      vi.spyOn(defender, 'takeHit');
      fx.checkAttackCollision(attacker, defender);

      const expectedDamage = Math.round(HEAVY_ATTACK_DAMAGE * 1 * 0.5 * 1);
      expect(defender.takeHit).toHaveBeenCalledWith(expectedDamage, expect.any(Number), 'heavy');
    });

    it('knockback direction follows facingRight', () => {
      attacker.isAttacking = true;
      attacker.hasHitThisSwing = false;
      attacker.attackType = 1;
      attacker.facingRight = false;
      positionForHit(attacker, defender);

      vi.spyOn(defender, 'takeHit');
      fx.checkAttackCollision(attacker, defender);

      // knockDir = -1, force = LIGHT_ATTACK_KNOCKBACK → -5
      expect(defender.takeHit).toHaveBeenCalledWith(
        expect.any(Number),
        -LIGHT_ATTACK_KNOCKBACK,
        'light',
      );
    });
  });

  // ========== 16. spawnProjectile ==========

  describe('spawnProjectile', () => {
    it('creates a projectile facing right with correct velocity', () => {
      const owner = createFighter();
      owner.facingRight = true;

      fx.spawnProjectile(owner, { damage: 20, color: '#ff0000' });

      expect(fx.projectiles).toHaveLength(1);
      const proj = fx.projectiles[0];
      expect(proj.vx).toBe(8); // dir * 8
      expect(proj.damage).toBe(20);
      expect(proj.color).toBe('#ff0000');
      expect(proj.position.x).toBe(owner.position.x + owner.width + 10);
      expect(proj.position.y).toBe(owner.position.y + owner.height * 0.3);
    });

    it('creates a projectile facing left with negative velocity', () => {
      const owner = createFighter();
      owner.facingRight = false;

      fx.spawnProjectile(owner, { damage: 15 });

      const proj = fx.projectiles[0];
      expect(proj.vx).toBe(-8);
      expect(proj.position.x).toBe(owner.position.x - 40);
    });

    it('applies atk and buff multipliers to projectile damage', () => {
      const owner = createFighter();
      owner._atkMultiplier = 1.5;
      owner.buffMultiplier = 2;

      fx.spawnProjectile(owner, { damage: 10 });

      expect(fx.projectiles[0].damage).toBe(Math.round(10 * 1.5 * 2));
    });

    it('defaults color to #ffcc00 when not provided', () => {
      const owner = createFighter();
      fx.spawnProjectile(owner, { damage: 10 });
      expect(fx.projectiles[0].color).toBe('#ffcc00');
    });
  });

  // ========== 17 & 18. updateProjectiles ==========

  describe('updateProjectiles', () => {
    let player1: Fighter;
    let player2: Fighter;

    beforeEach(() => {
      player1 = createFighter();
      player2 = createFighter({ position: { x: 500, y: 300 } });
    });

    it('removes inactive projectiles', () => {
      fx.spawnProjectile(player1, { damage: 10 });
      fx.projectiles[0].active = false;

      fx.updateProjectiles(ctx, player1, player2);

      expect(fx.projectiles).toHaveLength(0);
    });

    it('hits the correct target (player2 for player1 projectile)', () => {
      fx.spawnProjectile(player1, { damage: 10 });
      const proj = fx.projectiles[0];
      // Position the projectile directly on top of player2
      proj.position.x = player2.position.x;
      proj.position.y = player2.position.y;

      vi.spyOn(player2, 'takeHit');
      fx.updateProjectiles(ctx, player1, player2);

      expect(player2.takeHit).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        'special',
      );
      // Projectile deactivated after hit
      expect(proj.active).toBe(false);
    });

    it('does not hit dead targets', () => {
      fx.spawnProjectile(player1, { damage: 10 });
      const proj = fx.projectiles[0];
      proj.position.x = player2.position.x;
      proj.position.y = player2.position.y;
      player2.dead = true;

      vi.spyOn(player2, 'takeHit');
      fx.updateProjectiles(ctx, player1, player2);

      expect(player2.takeHit).not.toHaveBeenCalled();
    });

    it('applies defender _defMultiplier to projectile damage', () => {
      fx.spawnProjectile(player1, { damage: 20 });
      const proj = fx.projectiles[0];
      proj.position.x = player2.position.x;
      proj.position.y = player2.position.y;
      player2._defMultiplier = 0.5;

      vi.spyOn(player2, 'takeHit');
      fx.updateProjectiles(ctx, player1, player2);

      expect(player2.takeHit).toHaveBeenCalledWith(
        Math.round(20 * 0.5),
        expect.any(Number),
        'special',
      );
    });

    it('grants attacker energy on projectile hit', () => {
      player1.energy = 0;
      fx.spawnProjectile(player1, { damage: 10 });
      const proj = fx.projectiles[0];
      proj.position.x = player2.position.x;
      proj.position.y = player2.position.y;

      fx.updateProjectiles(ctx, player1, player2);

      expect(player1.energy).toBe(ENERGY_GAIN_HIT);
    });

    it('caps attacker energy at maxEnergy on projectile hit', () => {
      player1.energy = MAX_ENERGY - 1;
      fx.spawnProjectile(player1, { damage: 10 });
      const proj = fx.projectiles[0];
      proj.position.x = player2.position.x;
      proj.position.y = player2.position.y;

      fx.updateProjectiles(ctx, player1, player2);

      expect(player1.energy).toBe(MAX_ENERGY);
    });

    it('spawns hit effects when projectile hits', () => {
      fx.spawnProjectile(player1, { damage: 10 });
      const proj = fx.projectiles[0];
      proj.position.x = player2.position.x;
      proj.position.y = player2.position.y;

      fx.updateProjectiles(ctx, player1, player2);

      // spawnHitEffect(_, _, true) → 20 circle + 8 line = 28 particles
      expect(fx.hitEffects.length).toBeGreaterThanOrEqual(28);
    });
  });

  // ========== 19. drawHitEffects ==========

  describe('drawHitEffects', () => {
    it('renders circle particles with arc and fill', () => {
      fx.hitEffects.push({
        x: 50,
        y: 60,
        vx: 1,
        vy: 1,
        life: 10,
        maxLife: 20,
        r: 3,
        color: '#ff0',
        type: 'circle',
      });

      fx.drawHitEffects(ctx);

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.arc).toHaveBeenCalled();
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('renders line particles with moveTo/lineTo/stroke', () => {
      fx.hitEffects.push({
        x: 50,
        y: 60,
        vx: 2,
        vy: 2,
        life: 5,
        maxLife: 10,
        r: 2,
        color: '#fff',
        type: 'line',
        length: 15,
      });

      fx.drawHitEffects(ctx);

      expect(ctx.moveTo).toHaveBeenCalled();
      expect(ctx.lineTo).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
    });

    it('renders damage numbers with fillText', () => {
      fx.hitEffects.push({
        x: 100,
        y: 50,
        vx: 0,
        vy: -2,
        life: 20,
        maxLife: 40,
        r: 0,
        color: '#fff',
        isDamageNumber: true,
        damageText: '15',
      });

      fx.drawHitEffects(ctx);

      expect(ctx.fillText).toHaveBeenCalledWith('-15', expect.any(Number), expect.any(Number));
    });

    it('decrements particle life and removes dead particles', () => {
      fx.hitEffects.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 1,
        maxLife: 10,
        r: 2,
        color: '#f00',
        type: 'circle',
      });

      fx.drawHitEffects(ctx);

      // life was 1, decremented to 0 → removed
      expect(fx.hitEffects).toHaveLength(0);
    });

    it('updates particle position each frame', () => {
      fx.hitEffects.push({
        x: 10,
        y: 20,
        vx: 3,
        vy: 4,
        life: 10,
        maxLife: 20,
        r: 2,
        color: '#f00',
        type: 'circle',
      });

      fx.drawHitEffects(ctx);

      expect(fx.hitEffects[0].x).toBe(13);
      // vy gets gravity: 4 + 0.25 (gravity applied after position update) → y = 20 + 4 = 24
      expect(fx.hitEffects[0].y).toBe(24);
    });

    it('applies gravity to circle particles vy', () => {
      fx.hitEffects.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 10,
        maxLife: 20,
        r: 2,
        color: '#f00',
        type: 'circle',
      });

      fx.drawHitEffects(ctx);

      expect(fx.hitEffects[0].vy).toBeCloseTo(0.25);
    });

    it('applies drag to circle particles vx', () => {
      fx.hitEffects.push({
        x: 0,
        y: 0,
        vx: 10,
        vy: 0,
        life: 10,
        maxLife: 20,
        r: 2,
        color: '#f00',
        type: 'circle',
      });

      fx.drawHitEffects(ctx);

      expect(fx.hitEffects[0].vx).toBeCloseTo(10 * 0.97);
    });

    it('removes damage number when life reaches 0', () => {
      fx.hitEffects.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: -1,
        life: 1,
        maxLife: 40,
        r: 0,
        color: '#fff',
        isDamageNumber: true,
        damageText: '8',
      });

      fx.drawHitEffects(ctx);

      expect(fx.hitEffects).toHaveLength(0);
    });

    it('handles multiple particles correctly', () => {
      for (let i = 0; i < 5; i++) {
        fx.hitEffects.push({
          x: i * 10,
          y: 0,
          vx: 1,
          vy: 0,
          life: 5,
          maxLife: 10,
          r: 2,
          color: '#fff',
          type: 'circle',
        });
      }

      fx.drawHitEffects(ctx);

      expect(fx.hitEffects).toHaveLength(5);
      expect(ctx.arc).toHaveBeenCalledTimes(5);
    });
  });
});
