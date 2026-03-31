// ============================================================
// Projectile — 飛行道具 (ranged attack projectile with glow & trail)
// ============================================================

import { CANVAS_W } from '../constants';
import type { ProjectileConfig, Vector2D } from '../types';

export class Projectile {
  public position: Vector2D;
  public vx: number;
  public vy: number;
  public damage: number;
  public color: string;
  public owner: unknown;
  public width: number;
  public height: number;
  public life: number;
  public active: boolean;

  constructor({ x, y, vx, vy, damage, color, owner, width, height, life }: ProjectileConfig) {
    this.position = { x, y };
    this.vx = vx;
    this.vy = vy ?? 0;
    this.damage = damage;
    this.color = color ?? '#ffcc00';
    this.owner = owner;
    this.width = width ?? 30;
    this.height = height ?? 15;
    this.life = life ?? 90;
    this.active = true;
  }

  update(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    this.position.x += this.vx;
    this.position.y += this.vy;
    this.life--;

    if (this.life <= 0 || this.position.x < -50 || this.position.x > CANVAS_W + 50) {
      this.active = false;
      return;
    }

    // Draw projectile
    ctx.save();
    const alpha = Math.min(1, this.life / 20);
    ctx.globalAlpha = alpha;

    // Glow effect — enhanced multi-layer
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;

    // Outer glow ring
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const cx = this.position.x + this.width / 2;
    const cy = this.position.y + this.height / 2;
    ctx.ellipse(cx, cy, this.width / 2 + 4, this.height / 2 + 4, 0, 0, Math.PI * 2);
    ctx.globalAlpha = alpha * 0.3;
    ctx.stroke();

    // Main body
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width / 4, this.height / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Trail particles — enhanced with glow
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    for (let i = 0; i < 5; i++) {
      const tx = this.position.x - this.vx * (i + 1) * 0.6 + (Math.random() - 0.5) * 8;
      const ty = this.position.y + this.height / 2 + (Math.random() - 0.5) * 10;
      const tr = Math.random() * 4 + 1;
      ctx.globalAlpha = alpha * (0.6 - i * 0.1);
      ctx.fillStyle = i < 2 ? '#fff' : this.color;
      ctx.beginPath();
      ctx.arc(tx, ty, tr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}
