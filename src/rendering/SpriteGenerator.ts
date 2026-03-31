// ============================================================
// SpriteGenerator.ts — Pre-render character sprites for all actions
// Generates off-screen canvas sprite sheets so every action
// (including knockdown 倒地) uses image-based rendering.
// ============================================================

import { ANIM, type AnimState } from '../constants/enums';
import type { SpriteSheets, CharacterData, SoldierType } from '../types/index';

/* ---------- Per-frame pose parameters ---------- */
interface CharacterFrameOpts {
  breathe: number;
  legSwing: number;
  armSwing: number;
  attackAngle: number;
  blocking: boolean;
  eyeDir: number;
  hasWeapon: boolean;
  weaponLen: number;
  weaponGlow: boolean;
  mouthOpen: boolean;
}

/* ---------- Frame counts per action ---------- */
export const SPRITE_FRAMES: Record<AnimState, number> = {
  [ANIM.IDLE]: 4,
  [ANIM.RUN]: 6,
  [ANIM.JUMP]: 2,
  [ANIM.FALL]: 2,
  [ANIM.ATTACK1]: 4,
  [ANIM.ATTACK2]: 4,
  [ANIM.SPECIAL]: 6,
  [ANIM.ULTIMATE]: 6,
  [ANIM.BLOCK]: 2,
  [ANIM.CHARGE]: 4,
  [ANIM.TAKE_HIT]: 2,
  [ANIM.KNOCKDOWN]: 3,
  [ANIM.GETUP]: 3,
  [ANIM.DEATH]: 4,
};

/* ---------- Soldier frame counts (fewer frames) ---------- */
export const SOLDIER_SPRITE_FRAMES: Record<AnimState, number> = {
  [ANIM.IDLE]: 4,
  [ANIM.RUN]: 4,
  [ANIM.JUMP]: 2,
  [ANIM.FALL]: 2,
  [ANIM.ATTACK1]: 3,
  [ANIM.ATTACK2]: 3,
  [ANIM.SPECIAL]: 3,
  [ANIM.ULTIMATE]: 3,
  [ANIM.BLOCK]: 1,
  [ANIM.CHARGE]: 2,
  [ANIM.TAKE_HIT]: 2,
  [ANIM.KNOCKDOWN]: 2,
  [ANIM.GETUP]: 2,
  [ANIM.DEATH]: 3,
};

/* ==========================================================
   Color utilities (standalone, used only during generation)
   ========================================================== */
function _spDarken(hex: string, factor: number): string {
  if (hex.charAt(0) !== '#') return hex;
  const r = Math.floor(parseInt(hex.slice(1, 3), 16) * factor);
  const g = Math.floor(parseInt(hex.slice(3, 5), 16) * factor);
  const b = Math.floor(parseInt(hex.slice(5, 7), 16) * factor);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function _spLighten(hex: string, factor: number): string {
  if (hex.charAt(0) !== '#') return hex;
  const r = Math.min(255, Math.floor(parseInt(hex.slice(1, 3), 16) * factor));
  const g = Math.min(255, Math.floor(parseInt(hex.slice(3, 5), 16) * factor));
  const b = Math.min(255, Math.floor(parseInt(hex.slice(5, 7), 16) * factor));
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

/* ==========================================================
   Draw one character frame onto a canvas context
   ========================================================== */
function _drawCharacterFrame(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  w: number,
  h: number,
  bodyColor: string,
  isSoldier: boolean,
  opts: CharacterFrameOpts,
): void {
  const breathe = opts.breathe;
  const legSwing = opts.legSwing;
  const armSwing = opts.armSwing;
  const attackAngle = opts.attackAngle;
  const blocking = opts.blocking;
  const eyeDir = opts.eyeDir;
  const hasWeapon = opts.hasWeapon;
  const weaponLen = opts.weaponLen;
  const weaponGlow = opts.weaponGlow;
  const mouthOpen = opts.mouthOpen;

  const px: number = ox;
  let py: number = oy;

  if (blocking) {
    py += 12;
    h -= 12;
  }

  // --- Legs ---
  const legW: number = w * 0.22;
  const legH: number = h * 0.38;
  const legY: number = py + h - legH;

  // Left leg
  ctx.save();
  ctx.translate(px + w * 0.28, legY);
  ctx.rotate(legSwing);
  ctx.fillStyle = _spDarken(bodyColor, 0.6);
  ctx.fillRect(-legW / 2, 0, legW, legH);
  ctx.fillStyle = '#333';
  ctx.fillRect(-legW / 2 - 2, legH - 8, legW + 4, 8);
  ctx.restore();

  // Right leg
  ctx.save();
  ctx.translate(px + w * 0.72, legY);
  ctx.rotate(-legSwing);
  ctx.fillStyle = _spDarken(bodyColor, 0.6);
  ctx.fillRect(-legW / 2, 0, legW, legH);
  ctx.fillStyle = '#333';
  ctx.fillRect(-legW / 2 - 2, legH - 8, legW + 4, 8);
  ctx.restore();

  // --- Torso ---
  const torsoH: number = h * 0.42;
  const torsoY: number = py + h * 0.2 + breathe;
  const torsoW: number = w * 0.75;
  const torsoX: number = px + (w - torsoW) / 2;

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(torsoX, torsoY + torsoH);
  ctx.lineTo(torsoX, torsoY + 8);
  ctx.quadraticCurveTo(torsoX + torsoW / 2, torsoY - 2, torsoX + torsoW, torsoY + 8);
  ctx.lineTo(torsoX + torsoW, torsoY + torsoH);
  ctx.closePath();
  ctx.fill();

  // Armor detail
  ctx.strokeStyle = _spLighten(bodyColor, 1.3);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(torsoX + torsoW * 0.3, torsoY + 6);
  ctx.lineTo(torsoX + torsoW * 0.5, torsoY + torsoH * 0.6);
  ctx.lineTo(torsoX + torsoW * 0.7, torsoY + 6);
  ctx.stroke();

  // Belt
  ctx.fillStyle = '#c9a84c';
  ctx.fillRect(torsoX - 2, torsoY + torsoH - 6, torsoW + 4, 6);

  if (isSoldier) {
    ctx.fillStyle = 'rgba(200,200,200,0.2)';
    ctx.fillRect(torsoX + 3, torsoY + 10, torsoW - 6, torsoH * 0.4);
  }

  // --- Arms ---
  const armW: number = w * 0.16;
  const armH: number = h * 0.35;
  const shoulderY: number = torsoY + 8;

  // Back arm
  ctx.save();
  ctx.translate(px + (eyeDir === 1 ? w * 0.15 : w * 0.85), shoulderY);
  ctx.rotate(-armSwing * 0.7);
  ctx.fillStyle = _spDarken(bodyColor, 0.7);
  ctx.fillRect(-armW / 2, 0, armW, armH);
  ctx.fillStyle = '#d4a574';
  ctx.beginPath();
  ctx.arc(0, armH, armW * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Front arm
  ctx.save();
  const frontArmX: number = px + (eyeDir === 1 ? w * 0.85 : w * 0.15);
  ctx.translate(frontArmX, shoulderY);
  ctx.rotate(armSwing * 0.7 + attackAngle);
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-armW / 2, 0, armW, armH);
  ctx.fillStyle = '#d4a574';
  ctx.beginPath();
  ctx.arc(0, armH, armW * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Weapon
  if (hasWeapon) {
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, armH);
    ctx.lineTo(eyeDir * weaponLen * 0.3, armH + weaponLen * 0.6);
    ctx.stroke();
    if (weaponGlow) {
      ctx.shadowColor = 'rgba(255,255,100,0.7)';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = 'rgba(255,255,100,0.6)';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
  ctx.restore();

  // --- Head ---
  const headR: number = w * (isSoldier ? 0.28 : 0.35);
  const headX: number = px + w / 2;
  const headY: number = torsoY - headR + 4 + breathe;

  // Neck
  ctx.fillStyle = '#d4a574';
  ctx.fillRect(headX - 4, headY + headR - 2, 8, 8);

  // Head circle
  ctx.beginPath();
  ctx.arc(headX, headY, headR, 0, Math.PI * 2);
  ctx.fillStyle = '#d4a574';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Hair/helmet
  ctx.beginPath();
  ctx.arc(headX, headY - 2, headR, Math.PI, 0);
  ctx.fillStyle = _spDarken(bodyColor, 0.5);
  ctx.fill();

  // Helmet ornament (heroes only)
  if (!isSoldier) {
    ctx.fillStyle = '#c9a84c';
    ctx.beginPath();
    ctx.moveTo(headX, headY - headR - 6);
    ctx.lineTo(headX - 5, headY - headR + 2);
    ctx.lineTo(headX + 5, headY - headR + 2);
    ctx.closePath();
    ctx.fill();
  }

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(headX + eyeDir * 4, headY - 1, isSoldier ? 3 : 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(headX + eyeDir * 5, headY - 1, isSoldier ? 1.5 : 2, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrow (angry when attacking)
  if (mouthOpen) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(headX + eyeDir * 1, headY - 5);
    ctx.lineTo(headX + eyeDir * 8, headY - 3);
    ctx.stroke();
  }

  // Mouth
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (mouthOpen) {
    ctx.arc(headX + eyeDir * 2, headY + 5, 3, 0, Math.PI);
  } else {
    ctx.moveTo(headX - 3, headY + 5);
    ctx.lineTo(headX + 3, headY + 5);
  }
  ctx.stroke();

  // Shield effect for blocking
  if (blocking) {
    ctx.strokeStyle = 'rgba(68,170,255,0.6)';
    ctx.lineWidth = 3;
    const shieldX: number = eyeDir === 1 ? px - 5 : px + w - 15;
    ctx.beginPath();
    ctx.arc(shieldX + 10, oy + h * 0.4, 20, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();
  }
}

/* ==========================================================
   Draw a knockdown frame (character lying on ground)
   ========================================================== */
function _drawKnockdownFrame(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  w: number,
  h: number,
  bodyColor: string,
  isSoldier: boolean,
  _frameIdx: number,
  _totalFrames: number,
): void {
  ctx.save();

  const cx: number = ox + w / 2;
  const cy: number = oy + h;

  ctx.translate(cx, cy);
  ctx.rotate(Math.PI / 2);

  // Draw a simplified lying body
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-h / 2, -w / 2, h, w);

  // Body outline
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(-h / 2, -w / 2, h, w);

  // Head at one end
  const headR: number = w * (isSoldier ? 0.25 : 0.3);
  ctx.beginPath();
  ctx.arc(-h / 2 + headR + 2, 0, headR, 0, Math.PI * 2);
  ctx.fillStyle = '#d4a574';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Closed eyes (X eyes for dazed)
  const exOff: number = -h / 2 + headR + 2;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(exOff - 3, -3);
  ctx.lineTo(exOff + 1, 1);
  ctx.moveTo(exOff + 1, -3);
  ctx.lineTo(exOff - 3, 1);
  ctx.stroke();

  ctx.restore();
}

/* ==========================================================
   Draw a getup frame (character rising from ground)
   ========================================================== */
function _drawGetupFrame(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  w: number,
  h: number,
  bodyColor: string,
  isSoldier: boolean,
  frameIdx: number,
  totalFrames: number,
): void {
  ctx.save();

  const progress: number = (frameIdx + 1) / totalFrames;
  const cx: number = ox + w / 2;
  const cy: number = oy + h;
  const angle: number = (Math.PI / 2) * (1 - progress);

  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Draw simplified body rising
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-w / 2, -h, w, h);
  ctx.strokeStyle = '#44aaff';
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h, w, h);

  // Head
  const headR: number = w * (isSoldier ? 0.25 : 0.3);
  ctx.beginPath();
  ctx.arc(0, -h - headR + 4, headR, 0, Math.PI * 2);
  ctx.fillStyle = '#d4a574';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

/* ==========================================================
   Draw a death frame (character collapsing)
   ========================================================== */
function _drawDeathFrame(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  w: number,
  h: number,
  bodyColor: string,
  isSoldier: boolean,
  frameIdx: number,
  totalFrames: number,
): void {
  ctx.save();

  const progress: number = (frameIdx + 1) / totalFrames;
  const cx: number = ox + w / 2;
  const cy: number = oy + h;
  const angle: number = (Math.PI / 2) * progress;

  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Fade out as death progresses
  ctx.globalAlpha = 1 - progress * 0.4;

  ctx.fillStyle = bodyColor;
  ctx.fillRect(-w / 2, -h, w, h);
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h, w, h);

  // Head
  const headR: number = w * (isSoldier ? 0.25 : 0.3);
  ctx.beginPath();
  ctx.arc(0, -h - headR + 4, headR, 0, Math.PI * 2);
  ctx.fillStyle = '#d4a574';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();

  // X eyes
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-3, -h - headR + 1);
  ctx.lineTo(1, -h - headR + 5);
  ctx.moveTo(1, -h - headR + 1);
  ctx.lineTo(-3, -h - headR + 5);
  ctx.stroke();

  ctx.restore();
}

/* ==========================================================
   Generate all sprite sheets for one character.
   Returns: { [ANIM.IDLE]: { canvas, frameCount, frameW, frameH }, ... }
   ========================================================== */
export function generateCharacterSprites(
  charData: CharacterData | SoldierType | null | undefined,
  charWidth: number,
  charHeight: number,
  isSoldier?: boolean,
): SpriteSheets {
  const bodyColor: string = charData ? charData.color : '#888';
  const soldier: boolean = !!isSoldier;
  const frameCounts: Record<AnimState, number> = soldier ? SOLDIER_SPRITE_FRAMES : SPRITE_FRAMES;

  // Padding around each frame for effects (glow, stars, etc.)
  const padX = 30;
  const padY = 30;
  const frameW: number = charWidth + padX * 2;
  const frameH: number = charHeight + padY * 2;

  const sheets: SpriteSheets = {};

  const actions = Object.keys(frameCounts) as AnimState[];
  for (const action of actions) {
    const numFrames: number = frameCounts[action];
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = frameW * numFrames;
    canvas.height = frameH;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) continue;

    for (let f = 0; f < numFrames; f++) {
      const ox: number = f * frameW + padX;
      const oy: number = padY;

      // Phase for cyclic animations (0 → 2π)
      const phase: number = (f / numFrames) * Math.PI * 2;

      if (action === ANIM.KNOCKDOWN) {
        _drawKnockdownFrame(ctx, ox, oy, charWidth, charHeight, bodyColor, soldier, f, numFrames);
      } else if (action === ANIM.GETUP) {
        _drawGetupFrame(ctx, ox, oy, charWidth, charHeight, bodyColor, soldier, f, numFrames);
      } else if (action === ANIM.DEATH) {
        _drawDeathFrame(ctx, ox, oy, charWidth, charHeight, bodyColor, soldier, f, numFrames);
      } else {
        // Build pose opts based on action
        const opts: CharacterFrameOpts = {
          breathe: 0,
          legSwing: 0,
          armSwing: 0,
          attackAngle: 0,
          blocking: false,
          eyeDir: 1,
          hasWeapon: !soldier,
          weaponLen: 40,
          weaponGlow: false,
          mouthOpen: false,
        };

        switch (action) {
          case ANIM.IDLE:
            opts.breathe = Math.sin(phase) * 1.5;
            break;

          case ANIM.RUN:
            opts.breathe = Math.sin(phase) * 2;
            opts.legSwing = Math.sin(phase) * 0.5;
            opts.armSwing = Math.sin(phase) * 0.4;
            break;

          case ANIM.JUMP:
            opts.breathe = -3;
            opts.armSwing = f === 0 ? 0.3 : 0.5;
            opts.legSwing = f === 0 ? 0.2 : 0.4;
            break;

          case ANIM.FALL:
            opts.breathe = 2;
            opts.armSwing = f === 0 ? -0.2 : -0.4;
            opts.legSwing = f === 0 ? -0.1 : -0.3;
            break;

          case ANIM.ATTACK1:
            opts.mouthOpen = true;
            opts.attackAngle = -0.6 * ((f + 1) / numFrames);
            opts.weaponGlow = f >= 1;
            opts.weaponLen = 40 * (f >= 1 ? 1.2 : 1);
            break;

          case ANIM.ATTACK2:
            opts.mouthOpen = true;
            opts.attackAngle = -0.9 * ((f + 1) / numFrames);
            opts.weaponGlow = f >= 1;
            opts.weaponLen = 40 * (f >= 1 ? 1.3 : 1);
            break;

          case ANIM.SPECIAL:
            opts.mouthOpen = true;
            opts.attackAngle = -0.7 * Math.sin(phase);
            opts.armSwing = Math.sin(phase) * 0.3;
            opts.weaponGlow = true;
            opts.weaponLen = 50;
            break;

          case ANIM.ULTIMATE:
            opts.mouthOpen = true;
            opts.attackAngle = -1.0 * Math.sin(phase);
            opts.armSwing = Math.sin(phase) * 0.5;
            opts.weaponGlow = true;
            opts.weaponLen = 55;
            break;

          case ANIM.BLOCK:
            opts.blocking = true;
            break;

          case ANIM.CHARGE:
            opts.breathe = Math.sin(phase) * 2;
            opts.armSwing = Math.sin(phase * 2) * 0.2;
            break;

          case ANIM.TAKE_HIT:
            opts.breathe = f === 0 ? 3 : 1;
            opts.armSwing = f === 0 ? -0.3 : -0.1;
            break;
        }

        _drawCharacterFrame(ctx, ox, oy, charWidth, charHeight, bodyColor, soldier, opts);
      }
    }

    sheets[action] = {
      canvas,
      frameCount: numFrames,
      frameW,
      frameH,
      padX,
      padY,
    };
  }

  return sheets;
}
