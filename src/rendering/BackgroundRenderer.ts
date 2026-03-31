// ============================================================
// BackgroundRenderer.ts — Background and stage rendering
// ============================================================

import { CANVAS_W, CANVAS_H, GROUND_Y, STAGE_COUNT } from '../constants';

/** Particle used for atmospheric background effects */
interface BgParticle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
}

export class BackgroundRenderer {
  private bgParticles: BgParticle[] = [];

  initParticles(): void {
    this.bgParticles.length = 0;
    for (let i = 0; i < 30; i++) {
      this.bgParticles.push({
        x: Math.random() * CANVAS_W,
        y: Math.random() * CANVAS_H,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.5 - 0.2,
        alpha: Math.random() * 0.3 + 0.1,
      });
    }
  }

  drawBackground(ctx: CanvasRenderingContext2D, stage: number): void {
    const s = stage % STAGE_COUNT;
    switch (s) {
      case 0:
        this.drawStage_BattlefieldDusk(ctx);
        break;
      case 1:
        this.drawStage_ImperialPalace(ctx);
        break;
      case 2:
        this.drawStage_RedCliff(ctx);
        break;
      case 3:
        this.drawStage_BambooForest(ctx);
        break;
      case 4:
        this.drawStage_AncientBridge(ctx);
        break;
      case 5:
        this.drawStage_BlueSkyBliss(ctx);
        break;
      default:
        this.drawStage_BlueSkyBliss(ctx);
        break;
    }
  }

  // ---- particles ----

  private updateBgParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.bgParticles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -5) {
        p.y = CANVAS_H + 5;
        p.x = Math.random() * CANVAS_W;
      }
      if (p.x < -5) p.x = CANVAS_W + 5;
      if (p.x > CANVAS_W + 5) p.x = -5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,220,150,' + p.alpha + ')';
      ctx.fill();
    }
  }

  // ---- helpers ----

  private drawCloud(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x + w * 0.3, y, w * 0.3, h * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y - h * 0.2, w * 0.35, h * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + w * 0.7, y, w * 0.25, h * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMountainRange(
    ctx: CanvasRenderingContext2D,
    baseX: number,
    baseY: number,
    peaks: number[],
    maxH: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let i = 0; i < peaks.length; i += 2) {
      const peakH = (peaks[i] / 300) * maxH;
      const peakX = peaks[i + 1] || (i / 2) * 100;
      ctx.lineTo(peakX + baseX, baseY - peakH);
    }
    ctx.lineTo(CANVAS_W, baseY);
    ctx.closePath();
    ctx.fill();
  }

  private drawWarBanner(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    text: string,
  ): void {
    ctx.fillStyle = '#8a7a5a';
    ctx.fillRect(x - 3, y, 6, 150);
    const sway = Math.sin(Date.now() * 0.003) * 5;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + 3, y);
    ctx.lineTo(x + 45 + sway, y + 10);
    ctx.lineTo(x + 40 + sway, y + 70);
    ctx.lineTo(x + 3, y + 60);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + 22 + sway / 2, y + 42);
  }

  private drawPalaceBuilding(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    baseY: number,
    width: number,
    height: number,
  ): void {
    const x = centerX - width / 2;
    const y = baseY - height;
    ctx.fillStyle = '#4a2a1a';
    ctx.fillRect(x + 30, y + 40, width - 60, height - 40);
    for (let r = 0; r < 3; r++) {
      const roofW = width - r * 80 + 40;
      const roofX = centerX - roofW / 2;
      const roofY = y + r * 35;
      ctx.fillStyle = r === 0 ? '#2a1a0a' : '#3a2a1a';
      ctx.beginPath();
      ctx.moveTo(roofX - 20, roofY + 35);
      ctx.quadraticCurveTo(centerX, roofY - 10, roofX + roofW + 20, roofY + 35);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c9a84c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(roofX - 20, roofY + 35);
      ctx.quadraticCurveTo(centerX, roofY - 10, roofX + roofW + 20, roofY + 35);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd700';
    ctx.globalAlpha = 0.4;
    ctx.fillRect(centerX - 20, baseY - 60, 40, 55);
    ctx.fillRect(centerX - 100, baseY - 50, 25, 30);
    ctx.fillRect(centerX + 75, baseY - 50, 25, 30);
    ctx.globalAlpha = 1;
  }

  private drawLantern(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.005) * 0.15;
    ctx.beginPath();
    ctx.ellipse(x, y + 12, 8, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  private drawCliff(
    ctx: CanvasRenderingContext2D,
    x: number,
    baseY: number,
    w: number,
    h: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x + w * 0.1, baseY - h * 0.5);
    ctx.lineTo(x + w * 0.25, baseY - h * 0.8);
    ctx.lineTo(x + w * 0.5, baseY - h);
    ctx.lineTo(x + w * 0.75, baseY - h * 0.7);
    ctx.lineTo(x + w * 0.9, baseY - h * 0.3);
    ctx.lineTo(x + w, baseY);
    ctx.closePath();
    ctx.fill();
  }

  private drawBurningShip(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string,
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size * 0.4, y + size * 0.3);
    ctx.lineTo(x + size, y + size * 0.3);
    ctx.lineTo(x + size * 1.2, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.4, y);
    ctx.lineTo(x + size * 0.4, y - size * 0.6);
    ctx.stroke();
    const fireTime = Date.now() * 0.01;
    ctx.globalAlpha = 0.6;
    for (let f = 0; f < 3; f++) {
      ctx.fillStyle = f === 0 ? '#ff4400' : f === 1 ? '#ffaa00' : '#ff6600';
      ctx.beginPath();
      const fh = size * 0.3 + Math.sin(fireTime + f * 2) * size * 0.15;
      ctx.ellipse(x + size * (0.2 + f * 0.3), y - fh * 0.5, size * 0.15, fh, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---- Stage 0: Battlefield at Dusk ----

  private drawStage_BattlefieldDusk(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#1a0a2e');
    grad.addColorStop(0.15, '#2d1b4e');
    grad.addColorStop(0.35, '#6b2d3e');
    grad.addColorStop(0.55, '#c44e2d');
    grad.addColorStop(0.75, '#e8913a');
    grad.addColorStop(1, '#f4c462');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    const sunX = CANVAS_W * 0.5;
    const sunY = GROUND_Y - 40;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 120);
    sunGrad.addColorStop(0, 'rgba(255,240,180,0.9)');
    sunGrad.addColorStop(0.3, 'rgba(255,180,60,0.5)');
    sunGrad.addColorStop(1, 'rgba(255,100,30,0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, GROUND_Y - 160, CANVAS_W, 160);

    this.drawCloud(ctx, 100, 60, 120, 35, 'rgba(180,100,60,0.3)');
    this.drawCloud(ctx, 400, 40, 180, 40, 'rgba(200,120,80,0.25)');
    this.drawCloud(ctx, 700, 80, 140, 30, 'rgba(160,80,50,0.3)');
    this.drawCloud(ctx, 850, 30, 100, 25, 'rgba(180,90,60,0.2)');

    ctx.fillStyle = '#3a1828';
    this.drawMountainRange(
      ctx,
      0,
      GROUND_Y,
      [100, 250, 180, 320, 200, 400, 150, 500, 280, 650, 200, 800, 250, 950],
      160,
    );
    ctx.fillStyle = '#4a2030';
    this.drawMountainRange(
      ctx,
      30,
      GROUND_Y,
      [80, 180, 150, 350, 170, 500, 130, 700, 190, 880],
      120,
    );
    ctx.fillStyle = '#5a2838';
    this.drawMountainRange(ctx, 60, GROUND_Y, [60, 150, 120, 400, 100, 600, 140, 850], 80);

    this.drawWarBanner(ctx, 120, GROUND_Y - 140, '#cc2222', '蜀');
    this.drawWarBanner(ctx, 880, GROUND_Y - 130, '#4444cc', '魏');

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const wx = 50 + i * 170;
      ctx.beginPath();
      ctx.moveTo(wx, GROUND_Y - 2);
      ctx.lineTo(wx + 15, GROUND_Y - 20 - Math.random() * 10);
      ctx.stroke();
    }

    this.updateBgParticles(ctx);

    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
    groundGrad.addColorStop(0, '#8a7a5a');
    groundGrad.addColorStop(0.3, '#6a5a3e');
    groundGrad.addColorStop(1, '#3e2e18');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(140, 120, 80, 0.4)';
    ctx.lineWidth = 1;
    for (let i2 = 0; i2 < 12; i2++) {
      const y2 = GROUND_Y + 8 + i2 * 7;
      ctx.beginPath();
      ctx.moveTo(0, y2);
      ctx.lineTo(CANVAS_W, y2 + Math.sin(i2) * 2);
      ctx.stroke();
    }
  }

  // ---- Stage 1: Imperial Palace ----

  private drawStage_ImperialPalace(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(0.4, '#1a1a4a');
    grad.addColorStop(0.7, '#2a2040');
    grad.addColorStop(1, '#3a2a30');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    ctx.save();
    ctx.fillStyle = '#ffffdd';
    ctx.beginPath();
    ctx.arc(CANVAS_W * 0.82, 70, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#ffffaa';
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.restore();

    const moonGrad = ctx.createRadialGradient(CANVAS_W * 0.82, 70, 30, CANVAS_W * 0.82, 70, 150);
    moonGrad.addColorStop(0, 'rgba(255,255,200,0.15)');
    moonGrad.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = moonGrad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    ctx.fillStyle = '#fff';
    const starSeed = [
      120, 30, 200, 80, 350, 20, 450, 60, 550, 40, 680, 15, 750, 70, 850, 50, 950, 25, 160, 100,
      400, 90, 600, 75,
    ];
    for (let i = 0; i < starSeed.length; i += 2) {
      ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.003 + i) * 0.3;
      ctx.beginPath();
      ctx.arc(starSeed[i], starSeed[i + 1], 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    this.drawPalaceBuilding(ctx, CANVAS_W * 0.5, GROUND_Y, 500, 200);

    ctx.fillStyle = '#882222';
    ctx.fillRect(80, GROUND_Y - 200, 25, 200);
    ctx.fillRect(920, GROUND_Y - 200, 25, 200);
    ctx.fillRect(200, GROUND_Y - 180, 20, 180);
    ctx.fillRect(805, GROUND_Y - 180, 20, 180);

    this.drawLantern(ctx, 92, GROUND_Y - 210, '#ff4444');
    this.drawLantern(ctx, 932, GROUND_Y - 210, '#ff4444');
    this.drawLantern(ctx, CANVAS_W * 0.35, GROUND_Y - 160, '#ffaa00');
    this.drawLantern(ctx, CANVAS_W * 0.65, GROUND_Y - 160, '#ffaa00');

    this.updateBgParticles(ctx);

    const floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
    floorGrad.addColorStop(0, '#5a4a3a');
    floorGrad.addColorStop(0.5, '#4a3a2a');
    floorGrad.addColorStop(1, '#3a2a1a');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    ctx.strokeStyle = 'rgba(201, 168, 76, 0.3)';
    ctx.lineWidth = 1;
    for (let t = 0; t < CANVAS_W; t += 64) {
      ctx.beginPath();
      ctx.moveTo(t, GROUND_Y);
      ctx.lineTo(t, CANVAS_H);
      ctx.stroke();
    }
    for (let ty = GROUND_Y; ty < CANVAS_H; ty += 24) {
      ctx.beginPath();
      ctx.moveTo(0, ty);
      ctx.lineTo(CANVAS_W, ty);
      ctx.stroke();
    }

    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.stroke();
  }

  // ---- Stage 2: Red Cliff ----

  private drawStage_RedCliff(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#1a0a0a');
    grad.addColorStop(0.2, '#3a1010');
    grad.addColorStop(0.5, '#6a2010');
    grad.addColorStop(0.7, '#8a3020');
    grad.addColorStop(1, '#c04020');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    const fireGlow = ctx.createRadialGradient(
      CANVAS_W * 0.3,
      GROUND_Y,
      20,
      CANVAS_W * 0.3,
      GROUND_Y,
      300,
    );
    fireGlow.addColorStop(0, 'rgba(255,100,0,0.3)');
    fireGlow.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.fillStyle = fireGlow;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    const fireGlow2 = ctx.createRadialGradient(
      CANVAS_W * 0.7,
      GROUND_Y,
      20,
      CANVAS_W * 0.7,
      GROUND_Y,
      250,
    );
    fireGlow2.addColorStop(0, 'rgba(255,80,0,0.25)');
    fireGlow2.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.fillStyle = fireGlow2;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    ctx.fillStyle = '#2a0808';
    this.drawCliff(ctx, 0, GROUND_Y, 200, 300);
    this.drawCliff(ctx, 830, GROUND_Y, 200, 260);

    this.drawBurningShip(ctx, 300, GROUND_Y - 50, 80, '#aa3300');
    this.drawBurningShip(ctx, 550, GROUND_Y - 40, 60, '#993300');
    this.drawBurningShip(ctx, 700, GROUND_Y - 55, 70, '#884422');

    for (let fi = 0; fi < 15; fi++) {
      const fx = (Date.now() * 0.03 + fi * 80) % CANVAS_W;
      const fy = GROUND_Y - 20 - Math.sin(Date.now() * 0.002 + fi) * 80 - fi * 15;
      ctx.globalAlpha = 0.4 + Math.random() * 0.3;
      ctx.fillStyle = fi % 3 === 0 ? '#ff4400' : fi % 3 === 1 ? '#ffaa00' : '#ff6600';
      ctx.beginPath();
      ctx.arc(fx, fy, 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    this.updateBgParticles(ctx);

    const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
    groundGrad.addColorStop(0, '#5a3020');
    groundGrad.addColorStop(0.5, '#4a2818');
    groundGrad.addColorStop(1, '#2a1808');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    ctx.strokeStyle = '#884422';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(140, 80, 40, 0.4)';
    ctx.lineWidth = 1;
    for (let i3 = 0; i3 < 10; i3++) {
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y + 10 + i3 * 8);
      ctx.lineTo(CANVAS_W, GROUND_Y + 10 + i3 * 8);
      ctx.stroke();
    }
  }

  // ---- Stage 3: Bamboo Forest ----

  private drawStage_BambooForest(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#0a1a10');
    grad.addColorStop(0.3, '#1a3a20');
    grad.addColorStop(0.6, '#2a4a30');
    grad.addColorStop(1, '#3a5a38');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#aaccaa';
    ctx.fillRect(0, GROUND_Y - 100, CANVAS_W, 80);
    ctx.globalAlpha = 0.1;
    ctx.fillRect(0, GROUND_Y - 180, CANVAS_W, 60);
    ctx.globalAlpha = 1;

    for (let bi = 0; bi < 20; bi++) {
      const bx = bi * 55 + 10;
      const bh = 250 + Math.sin(bi * 1.5) * 80;
      const sway = Math.sin(Date.now() * 0.001 + bi * 0.5) * 3;

      ctx.strokeStyle = bi % 3 === 0 ? '#2a6a30' : bi % 3 === 1 ? '#3a7a40' : '#4a8a50';
      ctx.lineWidth = 8 - (bi % 3);
      ctx.beginPath();
      ctx.moveTo(bx, GROUND_Y);
      ctx.quadraticCurveTo(bx + sway, GROUND_Y - bh / 2, bx + sway * 2, GROUND_Y - bh);
      ctx.stroke();

      ctx.strokeStyle = '#5a9a5a';
      ctx.lineWidth = 2;
      for (let node = 1; node < 5; node++) {
        const ny = GROUND_Y - (bh / 5) * node;
        ctx.beginPath();
        ctx.moveTo(bx - 5 + sway * (node / 5), ny);
        ctx.lineTo(bx + 5 + sway * (node / 5), ny);
        ctx.stroke();
      }

      if (bi % 2 === 0) {
        ctx.fillStyle = 'rgba(80,160,80,0.6)';
        const leafY = GROUND_Y - bh + 20;
        const leafX = bx + sway * 2;
        for (let lf = 0; lf < 3; lf++) {
          ctx.save();
          ctx.translate(leafX, leafY + lf * 15);
          ctx.rotate(0.3 + lf * 0.4 + Math.sin(Date.now() * 0.002 + bi) * 0.1);
          ctx.beginPath();
          ctx.ellipse(10, 0, 15, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    ctx.save();
    ctx.globalAlpha = 0.08;
    for (let ray = 0; ray < 5; ray++) {
      const rayX = 100 + ray * 220;
      ctx.fillStyle = '#ffffcc';
      ctx.beginPath();
      ctx.moveTo(rayX, 0);
      ctx.lineTo(rayX + 80, GROUND_Y);
      ctx.lineTo(rayX + 40, GROUND_Y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    this.updateBgParticles(ctx);

    const floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
    floorGrad.addColorStop(0, '#4a5a3a');
    floorGrad.addColorStop(0.5, '#3a4a2a');
    floorGrad.addColorStop(1, '#2a3a1a');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    ctx.strokeStyle = '#6a7a5a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.stroke();
  }

  // ---- Stage 4: Ancient Bridge ----

  private drawStage_AncientBridge(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#1a2a4a');
    grad.addColorStop(0.3, '#3a4a6a');
    grad.addColorStop(0.6, '#6a7a9a');
    grad.addColorStop(0.85, '#c4a878');
    grad.addColorStop(1, '#e8c888');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    this.drawCloud(ctx, 150, 50, 200, 40, 'rgba(200,180,160,0.35)');
    this.drawCloud(ctx, 500, 30, 250, 50, 'rgba(220,200,180,0.3)');
    this.drawCloud(ctx, 800, 70, 160, 35, 'rgba(190,170,150,0.3)');

    ctx.fillStyle = '#5a6a7a';
    this.drawMountainRange(
      ctx,
      0,
      GROUND_Y,
      [150, 200, 120, 400, 180, 600, 140, 800, 160, 950],
      120,
    );
    ctx.fillStyle = '#6a7a8a';
    this.drawMountainRange(ctx, 50, GROUND_Y, [100, 300, 130, 550, 100, 750], 80);

    ctx.fillStyle = 'rgba(40,80,120,0.5)';
    ctx.fillRect(0, GROUND_Y + 10, CANVAS_W, CANVAS_H - GROUND_Y - 10);

    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#88aacc';
    for (let wr = 0; wr < 8; wr++) {
      const wrY = GROUND_Y + 15 + wr * 10;
      const wrW = 60 + Math.sin(Date.now() * 0.001 + wr) * 20;
      ctx.fillRect(100 + wr * 120, wrY, wrW, 3);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#6a5a4a';
    ctx.fillRect(0, GROUND_Y - 5, CANVAS_W, 20);

    ctx.fillStyle = '#5a4a3a';
    for (let br = 0; br < CANVAS_W; br += 80) {
      ctx.fillRect(br + 10, GROUND_Y - 40, 8, 40);
    }
    ctx.fillRect(0, GROUND_Y - 42, CANVAS_W, 6);

    ctx.strokeStyle = '#4a3a2a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(CANVAS_W * 0.3, GROUND_Y + 60, 120, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(CANVAS_W * 0.7, GROUND_Y + 60, 120, Math.PI, 0);
    ctx.stroke();

    this.updateBgParticles(ctx);

    ctx.strokeStyle = '#8a7a5a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(100,80,60,0.3)';
    ctx.lineWidth = 1;
    for (let pl = 0; pl < CANVAS_W; pl += 16) {
      ctx.beginPath();
      ctx.moveTo(pl, GROUND_Y);
      ctx.lineTo(pl, GROUND_Y + 15);
      ctx.stroke();
    }
  }

  // ---- Stage 5: Blue Sky Bliss ----

  private drawStage_BlueSkyBliss(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#1e90ff');
    grad.addColorStop(0.3, '#3aa5ff');
    grad.addColorStop(0.6, '#66bbff');
    grad.addColorStop(0.85, '#99ddff');
    grad.addColorStop(1, '#cceeff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    this.drawCloud(ctx, 80, 60, 220, 50, 'rgba(255,255,255,0.9)');
    this.drawCloud(ctx, 350, 40, 280, 60, 'rgba(255,255,255,0.85)');
    this.drawCloud(ctx, 700, 80, 200, 45, 'rgba(255,255,255,0.88)');
    this.drawCloud(ctx, 900, 30, 180, 40, 'rgba(255,255,255,0.82)');
    this.drawCloud(ctx, 200, 120, 150, 35, 'rgba(255,255,255,0.7)');
    this.drawCloud(ctx, 550, 100, 170, 38, 'rgba(255,255,255,0.75)');

    ctx.fillStyle = '#44bb44';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.quadraticCurveTo(200, GROUND_Y - 60, 400, GROUND_Y - 20);
    ctx.quadraticCurveTo(600, GROUND_Y - 50, 800, GROUND_Y - 10);
    ctx.quadraticCurveTo(900, GROUND_Y - 40, CANVAS_W, GROUND_Y - 15);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#66cc66';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y - 10);
    ctx.quadraticCurveTo(150, GROUND_Y - 35, 300, GROUND_Y - 5);
    ctx.quadraticCurveTo(500, GROUND_Y - 30, 700, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.lineTo(0, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    this.updateBgParticles(ctx);

    const floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
    floorGrad.addColorStop(0, '#33aa33');
    floorGrad.addColorStop(0.3, '#2d9a2d');
    floorGrad.addColorStop(1, '#228822');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    ctx.strokeStyle = '#55cc55';
    ctx.lineWidth = 2;
    for (let gt = 0; gt < CANVAS_W; gt += 30) {
      const gx = gt + Math.sin(gt) * 5;
      ctx.beginPath();
      ctx.moveTo(gx, GROUND_Y);
      ctx.lineTo(gx - 3, GROUND_Y - 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx + 5, GROUND_Y);
      ctx.lineTo(gx + 8, GROUND_Y - 6);
      ctx.stroke();
    }

    ctx.strokeStyle = '#44aa44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.stroke();
  }
}
