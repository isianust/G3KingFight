// ============================================================
// Sprite — base visual element with optional image & frame animation
// ============================================================

import type { Vector2D, SpriteConfig } from '../types';

export class Sprite {
  public position: Vector2D;
  public width: number;
  public height: number;
  public color: string;
  public scale: number;
  public framesMax: number;
  public framesCurrent: number;
  public framesElapsed: number;
  public framesHold: number;
  public offset: Vector2D;
  public image: HTMLImageElement | null;
  public loaded: boolean;

  constructor({
    position,
    imageSrc,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 },
    color = '#888',
    width = 50,
    height = 150,
  }: SpriteConfig) {
    this.position = position;
    this.width = width;
    this.height = height;
    this.color = color;
    this.scale = scale;
    this.framesMax = framesMax;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
    this.framesHold = 8;
    this.offset = offset;

    this.image = null;
    this.loaded = false;
    if (imageSrc) {
      this.image = new Image();
      this.image.onload = () => {
        this.loaded = true;
      };
      this.image.src = imageSrc;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.loaded && this.image) {
      const fw = this.image.width / this.framesMax;
      const fh = this.image.height;
      ctx.drawImage(
        this.image,
        fw * this.framesCurrent,
        0,
        fw,
        fh,
        this.position.x - this.offset.x,
        this.position.y - this.offset.y,
        fw * this.scale,
        fh * this.scale,
      );
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
  }

  animateFrames(): void {
    this.framesElapsed++;
    if (this.framesElapsed % this.framesHold === 0) {
      this.framesCurrent = (this.framesCurrent + 1) % this.framesMax;
    }
  }

  update(ctx: CanvasRenderingContext2D): void {
    this.draw(ctx);
    this.animateFrames();
  }
}
