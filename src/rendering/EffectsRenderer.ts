// ============================================================
// EffectsRenderer.ts — Screen effects (shake, flash, slowmo, hit effects)
// ============================================================

import {
  CANVAS_W,
  CANVAS_H,
  ENERGY_GAIN_HIT,
  LIGHT_ATTACK_DAMAGE,
  HEAVY_ATTACK_DAMAGE,
  LIGHT_ATTACK_KNOCKBACK,
  HEAVY_ATTACK_KNOCKBACK,
} from '../constants';
import { MOVE_TYPE } from '../constants/enums';
import type { Fighter } from '../entities/Fighter';
import { Projectile } from '../entities/Projectile';

/* ---------- Hit effect particle ---------- */
export interface HitEffectParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  r: number;
  color: string;
  type?: string;
  length?: number;
  isDamageNumber?: boolean;
  damageText?: string;
}

/* ---------- Screen-level effect state ---------- */
interface ScreenShake {
  intensity: number;
  duration: number;
  timer: number;
}

interface ScreenFlash {
  color: string;
  alpha: number;
  duration: number;
  timer: number;
}

interface SlowMotion {
  active: boolean;
  timer: number;
  duration: number;
}

export class EffectsRenderer {
  public hitEffects: HitEffectParticle[] = [];
  public projectiles: Projectile[] = [];
  private screenShake: ScreenShake = { intensity: 0, duration: 0, timer: 0 };
  private screenFlash: ScreenFlash = { color: '', alpha: 0, duration: 0, timer: 0 };
  public slowMotion: SlowMotion = { active: false, timer: 0, duration: 0 };

  reset(): void {
    this.hitEffects.length = 0;
    this.projectiles.length = 0;
    this.screenShake = { intensity: 0, duration: 0, timer: 0 };
    this.screenFlash = { color: '', alpha: 0, duration: 0, timer: 0 };
    this.slowMotion = { active: false, timer: 0, duration: 0 };
  }

  // ---- Screen shake ----

  triggerScreenShake(intensity: number, duration: number): void {
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
    this.screenShake.timer = duration;
  }

  applyScreenShake(ctx: CanvasRenderingContext2D): boolean {
    if (this.screenShake.timer > 0) {
      this.screenShake.timer--;
      const progress = this.screenShake.timer / this.screenShake.duration;
      const shakeX = (Math.random() - 0.5) * 2 * this.screenShake.intensity * progress;
      const shakeY = (Math.random() - 0.5) * 2 * this.screenShake.intensity * progress;
      ctx.save();
      ctx.translate(shakeX, shakeY);
      return true;
    }
    return false;
  }

  // ---- Screen flash ----

  triggerScreenFlash(color: string, alpha: number, duration: number): void {
    this.screenFlash.color = color;
    this.screenFlash.alpha = alpha;
    this.screenFlash.duration = duration;
    this.screenFlash.timer = duration;
  }

  drawScreenFlash(ctx: CanvasRenderingContext2D): void {
    if (this.screenFlash.timer > 0) {
      this.screenFlash.timer--;
      const progress = this.screenFlash.timer / this.screenFlash.duration;
      ctx.save();
      ctx.globalAlpha = this.screenFlash.alpha * progress;
      ctx.fillStyle = this.screenFlash.color;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();
    }
  }

  // ---- Slow motion ----

  triggerSlowMotion(duration: number): void {
    this.slowMotion.active = true;
    this.slowMotion.timer = duration;
    this.slowMotion.duration = duration;
  }

  updateSlowMotion(): void {
    if (this.slowMotion.active) {
      this.slowMotion.timer--;
      if (this.slowMotion.timer <= 0) {
        this.slowMotion.active = false;
      }
    }
  }

  // ---- Hit effects ----

  spawnHitEffect(x: number, y: number, isSpecial: boolean): void {
    const count = isSpecial ? 20 : 10;
    const colors = isSpecial
      ? ['#ffcc00', '#ff6600', '#ff0000', '#ffff00', '#ff3300', '#ffffff']
      : ['#ffcc00', '#ff6600', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = ((Math.PI * 2) / count) * i + (Math.random() - 0.5) * 0.5;
      const speed = (isSpecial ? 6 : 4) + Math.random() * (isSpecial ? 8 : 5);
      this.hitEffects.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 18 + Math.floor(Math.random() * 12),
        maxLife: 30,
        r: Math.random() * (isSpecial ? 7 : 4) + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'circle',
      });
    }

    if (isSpecial) {
      for (let j = 0; j < 8; j++) {
        const sparkAngle = ((Math.PI * 2) / 8) * j;
        this.hitEffects.push({
          x,
          y,
          vx: Math.cos(sparkAngle) * 10,
          vy: Math.sin(sparkAngle) * 10,
          life: 10,
          maxLife: 10,
          r: 2,
          color: '#ffffff',
          type: 'line',
          length: 12 + Math.random() * 8,
        });
      }
      this.triggerScreenShake(6, 8);
    } else {
      this.triggerScreenShake(3, 4);
    }
  }

  drawHitEffects(ctx: CanvasRenderingContext2D): void {
    for (let i = this.hitEffects.length - 1; i >= 0; i--) {
      const h = this.hitEffects[i];

      if (h.isDamageNumber) {
        h.x += h.vx;
        h.y += h.vy;
        h.life--;
        if (h.life <= 0) {
          this.hitEffects.splice(i, 1);
          continue;
        }
        const alpha = Math.min(1, h.life / h.maxLife);
        const scale = 1 + (1 - alpha) * 0.3;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold ' + Math.round(20 * scale) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText('-' + (h.damageText ?? ''), h.x, h.y);
        ctx.restore();
      } else {
        h.x += h.vx;
        h.y += h.vy;
        h.vy += 0.25;
        h.vx *= 0.97;
        h.life--;
        if (h.life <= 0) {
          this.hitEffects.splice(i, 1);
          continue;
        }
        const alpha2 = Math.min(1, h.life / h.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha2;

        if (h.type === 'line') {
          const lineLen = (h.length ?? 10) * (h.life / h.maxLife);
          ctx.strokeStyle = h.color;
          ctx.lineWidth = 2;
          ctx.shadowColor = h.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.moveTo(h.x, h.y);
          ctx.lineTo(h.x - (h.vx * lineLen) / 10, h.y - (h.vy * lineLen) / 10);
          ctx.stroke();
        } else {
          ctx.shadowColor = h.color;
          ctx.shadowBlur = h.r * 2;
          ctx.beginPath();
          ctx.arc(h.x, h.y, h.r * (0.5 + 0.5 * alpha2), 0, Math.PI * 2);
          ctx.fillStyle = h.color;
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  // ---- Projectiles ----

  spawnProjectile(owner: Fighter, move: { damage: number; color?: string }): void {
    const dir = owner.facingRight ? 1 : -1;
    const projX = owner.position.x + (owner.facingRight ? owner.width + 10 : -40);
    const projY = owner.position.y + owner.height * 0.3;
    const projDamage = move.damage * (owner._atkMultiplier || 1) * owner.buffMultiplier;

    this.projectiles.push(
      new Projectile({
        x: projX,
        y: projY,
        vx: dir * 8,
        vy: 0,
        damage: Math.round(projDamage),
        color: move.color || '#ffcc00',
        owner,
        width: 30,
        height: 15,
        life: 90,
      }),
    );
  }

  updateProjectiles(ctx: CanvasRenderingContext2D, player1: Fighter, player2: Fighter): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(ctx);

      if (!proj.active) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const target = proj.owner === player1 ? player2 : player1;
      if (target && !target.dead) {
        if (rectanglesOverlap(proj, target)) {
          const knockDir = proj.vx > 0 ? 1 : -1;
          let adjustedDamage = Math.round(proj.damage * (target._defMultiplier || 1));
          if (adjustedDamage < 1) adjustedDamage = 1;
          target.takeHit(adjustedDamage, knockDir * 8, 'special');
          this.spawnHitEffect(
            target.position.x + target.width / 2,
            target.position.y + target.height * 0.3,
            true,
          );

          const attacker = proj.owner as Fighter;
          attacker.energy += ENERGY_GAIN_HIT;
          if (attacker.energy > attacker.maxEnergy) attacker.energy = attacker.maxEnergy;

          proj.active = false;
        }
      }
    }
  }

  // ---- Collision detection (attack) ----

  checkAttackCollision(attacker: Fighter, defender: Fighter): void {
    if (!attacker.isAttacking || attacker.hasHitThisSwing || defender.dead) return;

    // Projectile-type special moves — spawn projectile instead of melee
    if (
      attacker.isUsingSpecial &&
      attacker.currentSpecialMove &&
      attacker.currentSpecialMove.type === MOVE_TYPE.PROJECTILE &&
      attacker.attackFrame === 5
    ) {
      this.spawnProjectile(attacker, attacker.currentSpecialMove);
      attacker.hasHitThisSwing = true;
      return;
    }

    if (rectanglesOverlap(attacker.attackBox, defender)) {
      attacker.hasHitThisSwing = true;

      let baseDamage: number;
      let knockForce: number;
      let attackType: string;
      if (attacker.isUsingSpecial && attacker.currentSpecialMove) {
        const move = attacker.currentSpecialMove;
        const moveHits = ('hits' in move ? move.hits : undefined) ?? 1;
        baseDamage = move.damage / moveHits;
        knockForce = attacker.isUsingUltimate ? 15 : 8;
        attackType = 'special';
      } else {
        baseDamage = attacker.attackType === 1 ? LIGHT_ATTACK_DAMAGE : HEAVY_ATTACK_DAMAGE;
        knockForce = attacker.attackType === 1 ? LIGHT_ATTACK_KNOCKBACK : HEAVY_ATTACK_KNOCKBACK;
        attackType = attacker.attackType === 1 ? 'light' : 'heavy';
      }

      let damage =
        baseDamage *
        (attacker._atkMultiplier || 1) *
        (defender._defMultiplier || 1) *
        attacker.buffMultiplier;
      damage = Math.round(damage);
      if (damage < 1) damage = 1;

      const knockDir = attacker.facingRight ? 1 : -1;
      defender.takeHit(damage, knockDir * knockForce, attackType);

      attacker.energy += ENERGY_GAIN_HIT;
      if (attacker.energy > attacker.maxEnergy) attacker.energy = attacker.maxEnergy;

      this.spawnHitEffect(
        defender.position.x + defender.width / 2,
        defender.position.y + defender.height * 0.3,
        attacker.isUsingSpecial,
      );

      if (attacker.isUsingUltimate) {
        const ultColor =
          (attacker.currentSpecialMove && 'color' in attacker.currentSpecialMove
            ? attacker.currentSpecialMove.color
            : undefined) || '#ffd700';
        this.triggerScreenFlash(ultColor, 0.4, 10);
        this.triggerScreenShake(10, 12);
        this.triggerSlowMotion(8);
      }

      this.hitEffects.push({
        x: defender.position.x + defender.width / 2,
        y: defender.position.y - 10,
        vx: 0,
        vy: -2,
        life: 40,
        maxLife: 40,
        r: 0,
        color: '#fff',
        isDamageNumber: true,
        damageText: String(damage),
      });
    }
  }
}

// ---- Utilities ----

interface HasPositionAndSize {
  position: { x: number; y: number };
  width: number;
  height: number;
}

function rectanglesOverlap(a: HasPositionAndSize, b: HasPositionAndSize): boolean {
  return (
    a.position.x < b.position.x + b.width &&
    a.position.x + a.width > b.position.x &&
    a.position.y < b.position.y + b.height &&
    a.position.y + a.height > b.position.y
  );
}
