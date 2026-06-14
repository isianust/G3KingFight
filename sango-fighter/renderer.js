var rectanglesOverlap = function(a, b) {
  var ax = a.position ? a.position.x : a.x;
  var ay = a.position ? a.position.y : a.y;
  var bx = b.position ? b.position.x : b.x;
  var by = b.position ? b.position.y : b.y;
  return ax < bx + b.width && ax + a.width > bx && ay < by + b.height && ay + a.height > by;
};

var BackgroundRenderer = class BackgroundRenderer {
  constructor() {
    this.bgParticles = [];
    this._frameCounter = 0;
    this._time = 0;
  }

  initParticles() {
    this.bgParticles.length = 0;
    for (var i = 0; i < 30; i++) {
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

  drawBackground(ctx, stageIndex, frameCount) {
    if (typeof frameCount === 'number') this._frameCounter = frameCount;
    else this._frameCounter++;
    this._time = this._frameCounter;

    var stage = ((stageIndex || 0) % STAGE_COUNT + STAGE_COUNT) % STAGE_COUNT;
    switch (stage) {
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
      default:
        this.drawStage_BlueSkyBliss(ctx);
        break;
    }
  }

  updateBgParticles(ctx, color) {
    color = color || 'rgba(255,220,150,';
    for (var i = 0; i < this.bgParticles.length; i++) {
      var p = this.bgParticles[i];
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
      ctx.fillStyle = color + p.alpha + ')';
      ctx.fill();
    }
  }

  drawCloud(ctx, x, y, w, h, color) {
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

  drawMountainRange(ctx, baseX, baseY, peaks, maxH) {
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (var i = 0; i < peaks.length; i += 2) {
      var peakH = (peaks[i] / 300) * maxH;
      var peakX = peaks[i + 1] || (i / 2) * 100;
      ctx.lineTo(peakX + baseX, baseY - peakH);
    }
    ctx.lineTo(CANVAS_W, baseY);
    ctx.closePath();
    ctx.fill();
  }

  drawWarBanner(ctx, x, y, color, text) {
    var sway = Math.sin(this._time * 0.08 + x) * 5;
    ctx.fillStyle = '#8a7a5a';
    ctx.fillRect(x - 3, y, 6, 150);
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

  drawBird(ctx, x, y, scale, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10 * scale, y);
    ctx.quadraticCurveTo(x - 4 * scale, y - 6 * scale, x, y);
    ctx.quadraticCurveTo(x + 4 * scale, y - 6 * scale, x + 10 * scale, y);
    ctx.stroke();
  }

  drawGrassTuft(ctx, x, y, h, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    for (var i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (i - 1) * 3, y - h - i * 2);
      ctx.stroke();
    }
  }

  drawPalaceBuilding(ctx, centerX, baseY, width, height) {
    var x = centerX - width / 2;
    var y = baseY - height;
    ctx.fillStyle = '#4a2a1a';
    ctx.fillRect(x + 30, y + 40, width - 60, height - 40);
    for (var r = 0; r < 3; r++) {
      var roofW = width - r * 80 + 40;
      var roofX = centerX - roofW / 2;
      var roofY = y + r * 35;
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

  drawLantern(ctx, x, y, color) {
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7 + Math.sin(this._time * 0.12 + x) * 0.15;
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

  drawCliff(ctx, x, baseY, w, h) {
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

  drawBurningShip(ctx, x, y, size, color) {
    var fireTime = this._time * 0.16;
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
    ctx.globalAlpha = 0.6;
    for (var f = 0; f < 3; f++) {
      ctx.fillStyle = f === 0 ? '#ff4400' : f === 1 ? '#ffaa00' : '#ff6600';
      ctx.beginPath();
      var fh = size * 0.3 + Math.sin(fireTime + f * 2) * size * 0.15;
      ctx.ellipse(x + size * (0.2 + f * 0.3), y - fh * 0.5, size * 0.15, fh, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawButterfly(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x - 4, y, 5, 3, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 4, y, 5, 3, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - 3);
    ctx.lineTo(x, y + 4);
    ctx.stroke();
  }

  drawStage_BattlefieldDusk(ctx) {
    var grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#1a0a2e');
    grad.addColorStop(0.15, '#2d1b4e');
    grad.addColorStop(0.35, '#6b2d3e');
    grad.addColorStop(0.55, '#c44e2d');
    grad.addColorStop(0.75, '#e8913a');
    grad.addColorStop(1, '#f4c462');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    var sunX = CANVAS_W * 0.5;
    var sunY = GROUND_Y - 40;
    var sunGrad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 120);
    sunGrad.addColorStop(0, 'rgba(255,240,180,0.9)');
    sunGrad.addColorStop(0.3, 'rgba(255,180,60,0.5)');
    sunGrad.addColorStop(1, 'rgba(255,100,30,0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, GROUND_Y - 160, CANVAS_W, 160);

    this.drawCloud(ctx, 100, 60, 120, 35, 'rgba(180,100,60,0.3)');
    this.drawCloud(ctx, 400, 40, 180, 40, 'rgba(200,120,80,0.25)');
    this.drawCloud(ctx, 700, 80, 140, 30, 'rgba(160,80,50,0.3)');
    this.drawCloud(ctx, 850, 30, 100, 25, 'rgba(180,90,60,0.2)');

    for (var b = 0; b < 4; b++) {
      var birdX = 160 + ((this._time * 2 + b * 170) % 700);
      var birdY = 70 + Math.sin(this._time * 0.05 + b) * 14 + b * 10;
      this.drawBird(ctx, birdX, birdY, 0.8 + b * 0.1, 'rgba(50,20,20,0.55)');
    }

    ctx.fillStyle = '#3a1828';
    this.drawMountainRange(ctx, 0, GROUND_Y, [100, 250, 180, 320, 200, 400, 150, 500, 280, 650, 200, 800, 250, 950], 160);
    ctx.fillStyle = '#4a2030';
    this.drawMountainRange(ctx, 30, GROUND_Y, [80, 180, 150, 350, 170, 500, 130, 700, 190, 880], 120);
    ctx.fillStyle = '#5a2838';
    this.drawMountainRange(ctx, 60, GROUND_Y, [60, 150, 120, 400, 100, 600, 140, 850], 80);

    this.drawWarBanner(ctx, 120, GROUND_Y - 140, '#cc2222', '蜀');
    this.drawWarBanner(ctx, 880, GROUND_Y - 130, '#4444cc', '魏');

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    for (var i = 0; i < 6; i++) {
      var wx = 50 + i * 170;
      ctx.beginPath();
      ctx.moveTo(wx, GROUND_Y - 2);
      ctx.lineTo(wx + 15, GROUND_Y - 20 - ((i % 2) * 6 + 4));
      ctx.stroke();
    }

    this.updateBgParticles(ctx);

    var groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
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

    ctx.strokeStyle = 'rgba(140,120,80,0.4)';
    ctx.lineWidth = 1;
    for (var i2 = 0; i2 < 12; i2++) {
      var y2 = GROUND_Y + 8 + i2 * 7;
      ctx.beginPath();
      ctx.moveTo(0, y2);
      ctx.lineTo(CANVAS_W, y2 + Math.sin(i2) * 2);
      ctx.stroke();
    }

    for (var g = 0; g < CANVAS_W; g += 36) {
      this.drawGrassTuft(ctx, g + 8, GROUND_Y + 2, 8 + (g % 12), '#6b8b35');
    }
  }

  drawStage_ImperialPalace(ctx) {
    var grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
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

    var moonGrad = ctx.createRadialGradient(CANVAS_W * 0.82, 70, 30, CANVAS_W * 0.82, 70, 150);
    moonGrad.addColorStop(0, 'rgba(255,255,200,0.15)');
    moonGrad.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = moonGrad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    ctx.fillStyle = '#fff';
    var stars = [120, 30, 200, 80, 350, 20, 450, 60, 550, 40, 680, 15, 750, 70, 850, 50, 950, 25, 160, 100, 400, 90, 600, 75];
    for (var i = 0; i < stars.length; i += 2) {
      ctx.globalAlpha = 0.4 + Math.sin(this._time * 0.06 + i) * 0.3;
      ctx.beginPath();
      ctx.arc(stars[i], stars[i + 1], 1.2, 0, Math.PI * 2);
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

    var floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
    floorGrad.addColorStop(0, '#5a4a3a');
    floorGrad.addColorStop(0.5, '#4a3a2a');
    floorGrad.addColorStop(1, '#3a2a1a');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    ctx.strokeStyle = 'rgba(201,168,76,0.3)';
    ctx.lineWidth = 1;
    for (var tx = 0; tx < CANVAS_W; tx += 64) {
      ctx.beginPath();
      ctx.moveTo(tx, GROUND_Y);
      ctx.lineTo(tx, CANVAS_H);
      ctx.stroke();
    }
    for (var ty = GROUND_Y; ty < CANVAS_H; ty += 24) {
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

  drawStage_RedCliff(ctx) {
    var grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#1a0a0a');
    grad.addColorStop(0.2, '#3a1010');
    grad.addColorStop(0.5, '#6a2010');
    grad.addColorStop(0.7, '#8a3020');
    grad.addColorStop(1, '#c04020');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    var fireGlow = ctx.createRadialGradient(CANVAS_W * 0.3, GROUND_Y, 20, CANVAS_W * 0.3, GROUND_Y, 300);
    fireGlow.addColorStop(0, 'rgba(255,100,0,0.3)');
    fireGlow.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.fillStyle = fireGlow;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    var fireGlow2 = ctx.createRadialGradient(CANVAS_W * 0.7, GROUND_Y, 20, CANVAS_W * 0.7, GROUND_Y, 250);
    fireGlow2.addColorStop(0, 'rgba(255,80,0,0.25)');
    fireGlow2.addColorStop(1, 'rgba(255,50,0,0)');
    ctx.fillStyle = fireGlow2;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    ctx.fillStyle = '#2a0808';
    this.drawCliff(ctx, 0, GROUND_Y, 200, 300);
    this.drawCliff(ctx, 830, GROUND_Y, 200, 260);

    ctx.fillStyle = 'rgba(20,20,20,0.55)';
    ctx.fillRect(0, GROUND_Y - 10, CANVAS_W, 90);
    ctx.globalAlpha = 0.18;
    for (var wr = 0; wr < 8; wr++) {
      var waveY = GROUND_Y + 20 + wr * 9;
      ctx.fillStyle = wr % 2 ? '#ff5511' : '#ffaa33';
      ctx.fillRect(80 + wr * 110, waveY, 90 + Math.sin(this._time * 0.08 + wr) * 18, 3);
    }
    ctx.globalAlpha = 1;

    this.drawBurningShip(ctx, 300, GROUND_Y - 50, 80, '#aa3300');
    this.drawBurningShip(ctx, 550, GROUND_Y - 40, 60, '#993300');
    this.drawBurningShip(ctx, 700, GROUND_Y - 55, 70, '#884422');

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.moveTo(250, GROUND_Y - 20);
    ctx.lineTo(280, GROUND_Y - 55);
    ctx.lineTo(335, GROUND_Y - 20);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(620, GROUND_Y - 18);
    ctx.lineTo(650, GROUND_Y - 48);
    ctx.lineTo(700, GROUND_Y - 18);
    ctx.closePath();
    ctx.fill();

    for (var fi = 0; fi < 15; fi++) {
      var fx = (this._time * 2 + fi * 80) % CANVAS_W;
      var fy = GROUND_Y - 20 - Math.sin(this._time * 0.05 + fi) * 80 - fi * 15;
      ctx.globalAlpha = 0.4 + Math.random() * 0.3;
      ctx.fillStyle = fi % 3 === 0 ? '#ff4400' : fi % 3 === 1 ? '#ffaa00' : '#ff6600';
      ctx.beginPath();
      ctx.arc(fx, fy, 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    this.updateBgParticles(ctx, 'rgba(255,120,60,');

    var groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
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

    ctx.strokeStyle = 'rgba(140,80,40,0.4)';
    ctx.lineWidth = 1;
    for (var i3 = 0; i3 < 10; i3++) {
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y + 10 + i3 * 8);
      ctx.lineTo(CANVAS_W, GROUND_Y + 10 + i3 * 8);
      ctx.stroke();
    }
  }

  drawStage_BambooForest(ctx) {
    var grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
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

    for (var bi = 0; bi < 20; bi++) {
      var bx = bi * 55 + 10;
      var bh = 250 + Math.sin(bi * 1.5) * 80;
      var sway = Math.sin(this._time * 0.03 + bi * 0.5) * 3;
      ctx.strokeStyle = bi % 3 === 0 ? '#2a6a30' : bi % 3 === 1 ? '#3a7a40' : '#4a8a50';
      ctx.lineWidth = 8 - (bi % 3);
      ctx.beginPath();
      ctx.moveTo(bx, GROUND_Y);
      ctx.quadraticCurveTo(bx + sway, GROUND_Y - bh / 2, bx + sway * 2, GROUND_Y - bh);
      ctx.stroke();
      ctx.strokeStyle = '#5a9a5a';
      ctx.lineWidth = 2;
      for (var node = 1; node < 5; node++) {
        var ny = GROUND_Y - (bh / 5) * node;
        ctx.beginPath();
        ctx.moveTo(bx - 5 + sway * (node / 5), ny);
        ctx.lineTo(bx + 5 + sway * (node / 5), ny);
        ctx.stroke();
      }
      if (bi % 2 === 0) {
        ctx.fillStyle = 'rgba(80,160,80,0.6)';
        var leafY = GROUND_Y - bh + 20;
        var leafX = bx + sway * 2;
        for (var lf = 0; lf < 3; lf++) {
          ctx.save();
          ctx.translate(leafX, leafY + lf * 15);
          ctx.rotate(0.3 + lf * 0.4 + Math.sin(this._time * 0.04 + bi) * 0.1);
          ctx.beginPath();
          ctx.ellipse(10, 0, 15, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    ctx.save();
    ctx.globalAlpha = 0.08;
    for (var ray = 0; ray < 5; ray++) {
      var rayX = 100 + ray * 220;
      ctx.fillStyle = '#ffffcc';
      ctx.beginPath();
      ctx.moveTo(rayX, 0);
      ctx.lineTo(rayX + 80, GROUND_Y);
      ctx.lineTo(rayX + 40, GROUND_Y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = '#6d5a35';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.quadraticCurveTo(200, GROUND_Y - 15, 420, GROUND_Y - 8);
    ctx.quadraticCurveTo(700, GROUND_Y + 4, CANVAS_W, GROUND_Y - 6);
    ctx.lineTo(CANVAS_W, CANVAS_H);
    ctx.lineTo(0, CANVAS_H);
    ctx.closePath();
    ctx.fill();

    this.updateBgParticles(ctx, 'rgba(180,255,180,');

    for (var ff = 0; ff < 8; ff++) {
      var fireflyX = 80 + ((this._time * 1.5 + ff * 120) % 900);
      var fireflyY = GROUND_Y - 60 - Math.sin(this._time * 0.08 + ff) * 60;
      var alpha = 0.35 + Math.sin(this._time * 0.12 + ff) * 0.25;
      ctx.fillStyle = 'rgba(240,255,120,' + alpha + ')';
      ctx.beginPath();
      ctx.arc(fireflyX, fireflyY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    var floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
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

  drawStage_AncientBridge(ctx) {
    var grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#1a2a4a');
    grad.addColorStop(0.3, '#3a4a6a');
    grad.addColorStop(0.6, '#6a7a9a');
    grad.addColorStop(0.85, '#c4a878');
    grad.addColorStop(1, '#e8c888');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    var sunrise = ctx.createRadialGradient(CANVAS_W * 0.78, GROUND_Y - 12, 10, CANVAS_W * 0.78, GROUND_Y - 12, 170);
    sunrise.addColorStop(0, 'rgba(255,220,160,0.55)');
    sunrise.addColorStop(1, 'rgba(255,220,160,0)');
    ctx.fillStyle = sunrise;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    this.drawCloud(ctx, 150, 50, 200, 40, 'rgba(200,180,160,0.35)');
    this.drawCloud(ctx, 500, 30, 250, 50, 'rgba(220,200,180,0.3)');
    this.drawCloud(ctx, 800, 70, 160, 35, 'rgba(190,170,150,0.3)');

    ctx.fillStyle = '#5a6a7a';
    this.drawMountainRange(ctx, 0, GROUND_Y, [150, 200, 120, 400, 180, 600, 140, 800, 160, 950], 120);
    ctx.fillStyle = '#6a7a8a';
    this.drawMountainRange(ctx, 50, GROUND_Y, [100, 300, 130, 550, 100, 750], 80);

    ctx.fillStyle = 'rgba(40,80,120,0.5)';
    ctx.fillRect(0, GROUND_Y + 10, CANVAS_W, CANVAS_H - GROUND_Y - 10);
    ctx.globalAlpha = 0.18;
    for (var ref = 0; ref < 6; ref++) {
      ctx.fillStyle = '#cfd9e6';
      ctx.fillRect(90 + ref * 150, GROUND_Y + 18 + ref * 6, 70 + Math.sin(this._time * 0.06 + ref) * 18, 2);
    }
    ctx.globalAlpha = 1;

    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#eef7ff';
    ctx.fillRect(0, GROUND_Y - 16, CANVAS_W, 45);
    ctx.globalAlpha = 0.08;
    ctx.fillRect(0, GROUND_Y + 24, CANVAS_W, 25);
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#6a5a4a';
    ctx.fillRect(0, GROUND_Y - 5, CANVAS_W, 20);
    ctx.fillStyle = '#5a4a3a';
    for (var br = 0; br < CANVAS_W; br += 80) {
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
    for (var pl = 0; pl < CANVAS_W; pl += 16) {
      ctx.beginPath();
      ctx.moveTo(pl, GROUND_Y);
      ctx.lineTo(pl, GROUND_Y + 15);
      ctx.stroke();
    }
  }

  drawStage_BlueSkyBliss(ctx) {
    var grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#1e90ff');
    grad.addColorStop(0.3, '#3aa5ff');
    grad.addColorStop(0.6, '#66bbff');
    grad.addColorStop(0.85, '#99ddff');
    grad.addColorStop(1, '#cceeff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    ctx.fillStyle = '#fff6aa';
    ctx.beginPath();
    ctx.arc(110, 80, 34, 0, Math.PI * 2);
    ctx.fill();
    var sunGlow = ctx.createRadialGradient(110, 80, 20, 110, 80, 100);
    sunGlow.addColorStop(0, 'rgba(255,240,180,0.4)');
    sunGlow.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, 220, 180);

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

    this.updateBgParticles(ctx, 'rgba(255,255,255,');

    var floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
    floorGrad.addColorStop(0, '#33aa33');
    floorGrad.addColorStop(0.3, '#2d9a2d');
    floorGrad.addColorStop(1, '#228822');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    ctx.strokeStyle = '#55cc55';
    ctx.lineWidth = 2;
    for (var gt = 0; gt < CANVAS_W; gt += 30) {
      var gx = gt + Math.sin(gt) * 5;
      ctx.beginPath();
      ctx.moveTo(gx, GROUND_Y);
      ctx.lineTo(gx - 3, GROUND_Y - 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx + 5, GROUND_Y);
      ctx.lineTo(gx + 8, GROUND_Y - 6);
      ctx.stroke();
    }

    for (var fl = 0; fl < CANVAS_W; fl += 70) {
      var flowerX = fl + 24;
      ctx.fillStyle = '#ff66aa';
      for (var pet = 0; pet < 5; pet++) {
        var ang = (Math.PI * 2 / 5) * pet;
        ctx.beginPath();
        ctx.arc(flowerX + Math.cos(ang) * 4, GROUND_Y + 28 + Math.sin(ang) * 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.arc(flowerX, GROUND_Y + 28, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    for (var bf = 0; bf < 5; bf++) {
      var bx = 180 + ((this._time * 2 + bf * 130) % 700);
      var by = GROUND_Y - 60 - Math.sin(this._time * 0.08 + bf) * 30;
      this.drawButterfly(ctx, bx, by, bf % 2 ? '#ff88aa' : '#ffee55');
    }

    ctx.strokeStyle = '#44aa44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.stroke();
  }
};

var EffectsRenderer = class EffectsRenderer {
  constructor() {
    this.particles = [];
    this.hitEffects = this.particles;
    this.projectiles = [];
    this.screenShake = { intensity: 0, duration: 0, timer: 0 };
    this.screenFlash = { color: '', alpha: 0, duration: 0, timer: 0 };
    this.slowMotion = { active: false, timer: 0, duration: 0 };
  }

  reset() {
    this.particles.length = 0;
    this.projectiles.length = 0;
    this.screenShake = { intensity: 0, duration: 0, timer: 0 };
    this.screenFlash = { color: '', alpha: 0, duration: 0, timer: 0 };
    this.slowMotion = { active: false, timer: 0, duration: 0 };
  }

  addScreenShake(intensity, duration) {
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
    this.screenShake.timer = duration;
  }

  triggerScreenShake(intensity, duration) {
    this.addScreenShake(intensity, duration);
  }

  applyScreenShake(ctx) {
    if (this.screenShake.timer > 0) {
      this.screenShake.timer--;
      var progress = this.screenShake.timer / Math.max(1, this.screenShake.duration);
      var shakeX = (Math.random() - 0.5) * 2 * this.screenShake.intensity * progress;
      var shakeY = (Math.random() - 0.5) * 2 * this.screenShake.intensity * progress;
      ctx.save();
      ctx.translate(shakeX, shakeY);
      return true;
    }
    return false;
  }

  addScreenFlash(color, alpha, duration) {
    this.screenFlash.color = color;
    this.screenFlash.alpha = alpha;
    this.screenFlash.duration = duration;
    this.screenFlash.timer = duration;
  }

  triggerScreenFlash(color, alpha, duration) {
    this.addScreenFlash(color, alpha, duration);
  }

  drawScreenFlash(ctx) {
    if (this.screenFlash.timer > 0) {
      this.screenFlash.timer--;
      var progress = this.screenFlash.timer / Math.max(1, this.screenFlash.duration);
      ctx.save();
      ctx.globalAlpha = this.screenFlash.alpha * progress;
      ctx.fillStyle = this.screenFlash.color;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.restore();
    }
  }

  addSlowMotion(duration) {
    this.slowMotion.active = true;
    this.slowMotion.timer = duration;
    this.slowMotion.duration = duration;
  }

  triggerSlowMotion(duration) {
    this.addSlowMotion(duration);
  }

  updateSlowMotion() {
    if (this.slowMotion.active) {
      this.slowMotion.timer--;
      if (this.slowMotion.timer <= 0) this.slowMotion.active = false;
    }
  }

  addHitParticles(x, y, isSpecial) {
    var count = isSpecial ? 20 : 10;
    var colors = isSpecial ? ['#ffcc00', '#ff6600', '#ff0000', '#ffff00', '#ff3300', '#ffffff'] : ['#ffcc00', '#ff6600', '#ffffff'];
    for (var i = 0; i < count; i++) {
      var angle = ((Math.PI * 2) / count) * i + (Math.random() - 0.5) * 0.5;
      var speed = (isSpecial ? 6 : 4) + Math.random() * (isSpecial ? 8 : 5);
      this.particles.push({
        x: x,
        y: y,
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
      for (var j = 0; j < 8; j++) {
        var sparkAngle = ((Math.PI * 2) / 8) * j;
        this.particles.push({
          x: x,
          y: y,
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
      this.addScreenShake(6, 8);
    } else {
      this.addScreenShake(3, 4);
    }
  }

  spawnHitEffect(x, y, isSpecial) {
    this.addHitParticles(x, y, isSpecial);
  }

  updateEffects(player1, player2) {
    this.updateSlowMotion();
    this._updateParticles();
    if (player1 && player2) this.checkProjectileCollisions(player1, player2);
  }

  _updateParticles() {
    for (var i = this.particles.length - 1; i >= 0; i--) {
      var h = this.particles[i];
      h.x += h.vx;
      h.y += h.vy;
      if (!h.isDamageNumber) {
        h.vy += 0.25;
        h.vx *= 0.97;
      }
      h.life--;
      if (h.life <= 0) this.particles.splice(i, 1);
    }
  }

  drawEffects(ctx) {
    this.drawProjectiles(ctx);
    this.drawHitEffects(ctx);
    this.drawScreenFlash(ctx);
  }

  drawHitEffects(ctx) {
    for (var i = 0; i < this.particles.length; i++) {
      var h = this.particles[i];
      if (h.isDamageNumber) {
        var alpha = Math.min(1, h.life / h.maxLife);
        var scale = 1 + (1 - alpha) * 0.3;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold ' + Math.round(20 * scale) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText('-' + (h.damageText || ''), h.x, h.y);
        ctx.restore();
      } else {
        var alpha2 = Math.min(1, h.life / h.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha2;
        if (h.type === 'line') {
          var lineLen = (h.length || 10) * (h.life / h.maxLife);
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

  addProjectile(owner, move) {
    var dir = owner.facingRight ? 1 : -1;
    var projX = owner.position.x + (owner.facingRight ? owner.width + 10 : -40);
    var projY = owner.position.y + owner.height * 0.3;
    var projDamage = move.damage * (owner._atkMultiplier || 1) * owner.buffMultiplier;
    var projectile = new Projectile({
      x: projX,
      y: projY,
      vx: dir * 8,
      vy: 0,
      damage: Math.round(projDamage),
      color: move.color || '#ffcc00',
      owner: owner,
      width: 30,
      height: 15,
      life: 90,
    });
    this.projectiles.push(projectile);
    return projectile;
  }

  spawnProjectile(owner, move) {
    return this.addProjectile(owner, move);
  }

  updateProjectiles(ctxOrPlayer1, player1OrPlayer2, maybePlayer2) {
    var ctx = null;
    var player1 = null;
    var player2 = null;

    if (ctxOrPlayer1 && typeof ctxOrPlayer1.fillRect === 'function') {
      ctx = ctxOrPlayer1;
      player1 = player1OrPlayer2;
      player2 = maybePlayer2;
    } else {
      player1 = ctxOrPlayer1;
      player2 = player1OrPlayer2;
    }

    for (var i = this.projectiles.length - 1; i >= 0; i--) {
      var proj = this.projectiles[i];
      proj.update();
      if (!proj.active) {
        this.projectiles.splice(i, 1);
        continue;
      }
      if (ctx) proj.draw(ctx);
    }

    if (player1 && player2) this.checkProjectileCollisions(player1, player2);
  }

  drawProjectiles(ctx) {
    for (var i = 0; i < this.projectiles.length; i++) {
      this.projectiles[i].draw(ctx);
    }
  }

  checkProjectileCollisions(player1, player2) {
    for (var i = this.projectiles.length - 1; i >= 0; i--) {
      var proj = this.projectiles[i];
      if (!proj.active) continue;
      var target = proj.owner === player1 ? player2 : player1;
      if (target && !target.dead && rectanglesOverlap(proj, target)) {
        var knockDir = proj.vx > 0 ? 1 : -1;
        var adjustedDamage = Math.round(proj.damage * (target._defMultiplier || 1));
        if (adjustedDamage < 1) adjustedDamage = 1;
        target.takeHit(adjustedDamage, knockDir * 8, 'special');
        this.addHitParticles(target.position.x + target.width / 2, target.position.y + target.height * 0.3, true);
        var attacker = proj.owner;
        attacker.energy += ENERGY_GAIN_HIT;
        if (attacker.energy > attacker.maxEnergy) attacker.energy = attacker.maxEnergy;
        proj.active = false;
        this.projectiles.splice(i, 1);
      }
    }
  }

  checkAttackCollision(attacker, defender) {
    if (!attacker.isAttacking || attacker.hasHitThisSwing || defender.dead) return;

    if (attacker.isUsingSpecial && attacker.currentSpecialMove && attacker.currentSpecialMove.type === MOVE_TYPE.PROJECTILE && attacker.attackFrame === 5) {
      this.addProjectile(attacker, attacker.currentSpecialMove);
      attacker.hasHitThisSwing = true;
      return;
    }

    if (rectanglesOverlap(attacker.attackBox, defender)) {
      attacker.hasHitThisSwing = true;
      var baseDamage;
      var knockForce;
      var attackType;
      if (attacker.isUsingSpecial && attacker.currentSpecialMove) {
        var move = attacker.currentSpecialMove;
        var moveHits = move.hits || 1;
        baseDamage = move.damage / moveHits;
        knockForce = attacker.isUsingUltimate ? 15 : 8;
        attackType = 'special';
      } else {
        baseDamage = attacker.attackType === 1 ? LIGHT_ATTACK_DAMAGE : HEAVY_ATTACK_DAMAGE;
        knockForce = attacker.attackType === 1 ? LIGHT_ATTACK_KNOCKBACK : HEAVY_ATTACK_KNOCKBACK;
        attackType = attacker.attackType === 1 ? 'light' : 'heavy';
      }

      var damage = Math.round(baseDamage * (attacker._atkMultiplier || 1) * (defender._defMultiplier || 1) * attacker.buffMultiplier);
      if (damage < 1) damage = 1;
      var knockDir = attacker.facingRight ? 1 : -1;
      defender.takeHit(damage, knockDir * knockForce, attackType);
      attacker.energy += ENERGY_GAIN_HIT;
      if (attacker.energy > attacker.maxEnergy) attacker.energy = attacker.maxEnergy;

      this.addHitParticles(defender.position.x + defender.width / 2, defender.position.y + defender.height * 0.3, attacker.isUsingSpecial);

      if (attacker.isUsingUltimate) {
        var ultColor = (attacker.currentSpecialMove && attacker.currentSpecialMove.color) || '#ffd700';
        this.addScreenFlash(ultColor, 0.4, 10);
        this.addScreenShake(10, 12);
        this.addSlowMotion(8);
      }

      this.particles.push({
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
};
