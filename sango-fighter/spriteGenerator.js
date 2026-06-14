var SPRITE_FRAME_COUNTS = {};
SPRITE_FRAME_COUNTS[ANIM.IDLE] = 4;
SPRITE_FRAME_COUNTS[ANIM.RUN] = 6;
SPRITE_FRAME_COUNTS[ANIM.JUMP] = 2;
SPRITE_FRAME_COUNTS[ANIM.FALL] = 2;
SPRITE_FRAME_COUNTS[ANIM.ATTACK1] = 4;
SPRITE_FRAME_COUNTS[ANIM.ATTACK2] = 4;
SPRITE_FRAME_COUNTS[ANIM.SPECIAL] = 4;
SPRITE_FRAME_COUNTS[ANIM.ULTIMATE] = 4;
SPRITE_FRAME_COUNTS[ANIM.BLOCK] = 2;
SPRITE_FRAME_COUNTS[ANIM.CHARGE] = 4;
SPRITE_FRAME_COUNTS[ANIM.TAKE_HIT] = 2;
SPRITE_FRAME_COUNTS[ANIM.KNOCKDOWN] = 2;
SPRITE_FRAME_COUNTS[ANIM.GETUP] = 3;
SPRITE_FRAME_COUNTS[ANIM.DEATH] = 3;

function _sgClamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function _sgDarken(hex, factor) {
  if (!hex || hex.charAt(0) !== '#') return hex || '#888888';
  var r = Math.floor(parseInt(hex.slice(1, 3), 16) * factor);
  var g = Math.floor(parseInt(hex.slice(3, 5), 16) * factor);
  var b = Math.floor(parseInt(hex.slice(5, 7), 16) * factor);
  return 'rgb(' + _sgClamp(r, 0, 255) + ',' + _sgClamp(g, 0, 255) + ',' + _sgClamp(b, 0, 255) + ')';
}

function _sgLighten(hex, factor) {
  if (!hex || hex.charAt(0) !== '#') return hex || '#aaaaaa';
  var r = Math.floor(parseInt(hex.slice(1, 3), 16) * factor);
  var g = Math.floor(parseInt(hex.slice(3, 5), 16) * factor);
  var b = Math.floor(parseInt(hex.slice(5, 7), 16) * factor);
  return 'rgb(' + _sgClamp(r, 0, 255) + ',' + _sgClamp(g, 0, 255) + ',' + _sgClamp(b, 0, 255) + ')';
}

function _sgColorToRgba(color, alpha) {
  if (color && color.charAt(0) === '#') {
    return 'rgba(' +
      parseInt(color.slice(1, 3), 16) + ',' +
      parseInt(color.slice(3, 5), 16) + ',' +
      parseInt(color.slice(5, 7), 16) + ',' + alpha + ')';
  }
  return color || 'rgba(255,255,255,' + alpha + ')';
}

function _sgWeaponProfile(character) {
  var name = ((character && character.weapon) || '').toLowerCase();
  var profile = {
    type: 'blade',
    length: 40,
    shaft: '#7d5a36',
    blade: '#d8dde5',
    accent: '#c9a84c'
  };

  if (name.indexOf('弓') !== -1 || name.indexOf('bow') !== -1) {
    profile.type = 'bow';
    profile.length = 34;
    profile.blade = '#f0e0a0';
  } else if (name.indexOf('槍') !== -1 || name.indexOf('矛') !== -1 || name.indexOf('spear') !== -1) {
    profile.type = 'spear';
    profile.length = 50;
  } else if (name.indexOf('扇') !== -1 || name.indexOf('fan') !== -1) {
    profile.type = 'fan';
    profile.length = 28;
    profile.blade = '#f2f2e8';
  } else if (name.indexOf('戟') !== -1 || name.indexOf('halberd') !== -1) {
    profile.type = 'halberd';
    profile.length = 52;
  } else if (name.indexOf('刀') !== -1 || name.indexOf('劍') !== -1 || name.indexOf('sword') !== -1) {
    profile.type = 'blade';
    profile.length = 40;
  }

  return profile;
}

function _sgDrawWeapon(ctx, profile, pose) {
  var dir = pose.eyeDir || 1;
  var glow = pose.weaponGlow;
  var weaponLen = (pose.weaponLen || profile.length) * (profile.length / Math.max(1, profile.length));

  if (glow) {
    ctx.shadowColor = pose.moveColor || '#ffff88';
    ctx.shadowBlur = pose.action === ANIM.ULTIMATE ? 14 : 8;
  }

  if (profile.type === 'bow') {
    ctx.strokeStyle = profile.blade;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 18, 12, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    ctx.strokeStyle = '#fff7cc';
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(0, 30);
    ctx.stroke();
    ctx.strokeStyle = profile.blade;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.lineTo(dir * weaponLen * 0.8, 12);
    ctx.stroke();
    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(dir * weaponLen * 0.8, 12);
    ctx.lineTo(dir * weaponLen * 0.8 - dir * 6, 9);
    ctx.lineTo(dir * weaponLen * 0.8 - dir * 6, 15);
    ctx.closePath();
    ctx.fill();
  } else if (profile.type === 'fan') {
    ctx.fillStyle = profile.blade;
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.arc(0, 18, 16, -0.2, Math.PI + 0.2, true);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = profile.accent;
    ctx.lineWidth = 1;
    for (var i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(Math.cos(Math.PI * 0.15 * i + Math.PI * 0.15) * 14, 18 - Math.sin(Math.PI * 0.15 * i + Math.PI * 0.15) * 14);
      ctx.stroke();
    }
  } else {
    ctx.strokeStyle = profile.shaft;
    ctx.lineWidth = profile.type === 'blade' ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.lineTo(dir * weaponLen * 0.7, 18 + weaponLen * 0.15);
    ctx.stroke();

    ctx.fillStyle = profile.blade;
    ctx.strokeStyle = profile.blade;
    ctx.lineWidth = 2;
    if (profile.type === 'spear') {
      ctx.beginPath();
      ctx.moveTo(dir * weaponLen * 0.7, 18 + weaponLen * 0.15);
      ctx.lineTo(dir * weaponLen * 0.95, 18 + weaponLen * 0.15 - 5);
      ctx.lineTo(dir * weaponLen * 0.8, 18 + weaponLen * 0.15 + 7);
      ctx.closePath();
      ctx.fill();
    } else if (profile.type === 'halberd') {
      ctx.beginPath();
      ctx.moveTo(dir * weaponLen * 0.7, 18 + weaponLen * 0.15);
      ctx.quadraticCurveTo(dir * weaponLen * 0.95, 18 - 8, dir * weaponLen, 18 + 3);
      ctx.quadraticCurveTo(dir * weaponLen * 0.86, 18 + 8, dir * weaponLen * 0.7, 18 + weaponLen * 0.15);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(dir * weaponLen * 0.72, 18 + weaponLen * 0.15 - 1);
      ctx.lineTo(dir * weaponLen * 0.84, 18 + weaponLen * 0.15 + 12);
      ctx.lineTo(dir * weaponLen * 0.65, 18 + weaponLen * 0.15 + 6);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(dir * weaponLen * 0.55, 18 + weaponLen * 0.1);
      ctx.quadraticCurveTo(dir * weaponLen * 0.92, 10, dir * weaponLen * 0.98, 18 + weaponLen * 0.02);
      ctx.quadraticCurveTo(dir * weaponLen * 0.86, 28, dir * weaponLen * 0.62, 24 + weaponLen * 0.08);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = profile.accent;
    ctx.fillRect(dir * 6 - 2, 15, 4, 8);
  }

  if (glow) {
    ctx.shadowBlur = 0;
  }
}

function _sgDrawCharacterFrame(ctx, character, pose) {
  var color = (character && character.color) || '#888888';
  var isSoldier = !!(character && character.isSoldier);
  var weapon = _sgWeaponProfile(character);
  var baseW = isSoldier ? 44 : 50;
  var baseH = isSoldier ? 90 : 98;
  var x = 64;
  var groundY = 108 + (pose.groundShift || 0);
  var y = groundY - baseH + (pose.bodyOffsetY || 0);
  var eyeDir = pose.eyeDir || 1;
  var torsoW = baseW * 0.62;
  var torsoH = baseH * 0.36;
  var torsoX = x - torsoW / 2;
  var torsoY = y + baseH * 0.26 + (pose.breathe || 0);
  var legW = baseW * 0.18;
  var legH = baseH * 0.32;
  var armW = baseW * 0.15;
  var armH = baseH * 0.3;
  var headR = baseW * (isSoldier ? 0.22 : 0.27);
  var headY = torsoY - headR + 2 + (pose.breathe || 0);
  var headX = x;
  var shieldAlpha = pose.blocking ? 0.55 : 0;

  if (pose.auraColor) {
    var aura = ctx.createRadialGradient(x, y + baseH * 0.55, 0, x, y + baseH * 0.55, 42 + (pose.auraPulse || 0));
    aura.addColorStop(0, _sgColorToRgba(pose.auraColor, pose.auraAlpha || 0.28));
    aura.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x, y + baseH * 0.55, 46 + (pose.auraPulse || 0), 0, Math.PI * 2);
    ctx.fill();
  }

  if (pose.backTrail) {
    ctx.save();
    ctx.globalAlpha = pose.backTrail.alpha;
    ctx.fillStyle = pose.backTrail.color;
    ctx.fillRect(x - 20 - pose.backTrail.offsetX, y + 6, 40, baseH - 12);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(x - baseW * 0.18, groundY - legH);
  ctx.rotate(pose.legSwing || 0);
  ctx.fillStyle = _sgDarken(color, 0.6);
  ctx.fillRect(-legW / 2, 0, legW, legH);
  ctx.fillStyle = '#2f2f2f';
  ctx.fillRect(-legW / 2 - 2, legH - 6, legW + 4, 6);
  ctx.restore();

  ctx.save();
  ctx.translate(x + baseW * 0.18, groundY - legH);
  ctx.rotate(-(pose.legSwing || 0));
  ctx.fillStyle = _sgDarken(color, 0.66);
  ctx.fillRect(-legW / 2, 0, legW, legH);
  ctx.fillStyle = '#2f2f2f';
  ctx.fillRect(-legW / 2 - 2, legH - 6, legW + 4, 6);
  ctx.restore();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(torsoX, torsoY + torsoH);
  ctx.lineTo(torsoX, torsoY + 10);
  ctx.quadraticCurveTo(x, torsoY - 4, torsoX + torsoW, torsoY + 10);
  ctx.lineTo(torsoX + torsoW, torsoY + torsoH);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = _sgLighten(color, 1.25);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - torsoW * 0.18, torsoY + 6);
  ctx.lineTo(x, torsoY + torsoH * 0.62);
  ctx.lineTo(x + torsoW * 0.18, torsoY + 6);
  ctx.stroke();
  ctx.fillStyle = '#c9a84c';
  ctx.fillRect(torsoX - 1, torsoY + torsoH - 6, torsoW + 2, 6);

  if (isSoldier) {
    ctx.fillStyle = 'rgba(210,210,220,0.2)';
    ctx.fillRect(torsoX + 3, torsoY + 10, torsoW - 6, torsoH * 0.42);
  }

  var shoulderY = torsoY + 10;
  ctx.save();
  ctx.translate(x + (eyeDir === 1 ? -baseW * 0.26 : baseW * 0.26), shoulderY);
  ctx.rotate(-(pose.armSwing || 0) * 0.7);
  ctx.fillStyle = _sgDarken(color, 0.72);
  ctx.fillRect(-armW / 2, 0, armW, armH);
  ctx.fillStyle = '#d4a574';
  ctx.beginPath();
  ctx.arc(0, armH, armW * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(x + (eyeDir === 1 ? baseW * 0.26 : -baseW * 0.26), shoulderY);
  ctx.rotate((pose.armSwing || 0) * 0.6 + (pose.attackAngle || 0));
  ctx.fillStyle = color;
  ctx.fillRect(-armW / 2, 0, armW, armH);
  ctx.fillStyle = '#d4a574';
  ctx.beginPath();
  ctx.arc(0, armH, armW * 0.42, 0, Math.PI * 2);
  ctx.fill();
  if (!isSoldier) {
    _sgDrawWeapon(ctx, weapon, {
      eyeDir: eyeDir,
      weaponGlow: pose.weaponGlow,
      weaponLen: pose.weaponLen || weapon.length,
      moveColor: pose.auraColor || pose.moveColor,
      action: pose.action
    });
  }
  ctx.restore();

  ctx.fillStyle = '#d4a574';
  ctx.fillRect(headX - 3, headY + headR - 2, 6, 7);
  ctx.beginPath();
  ctx.arc(headX, headY, headR, 0, Math.PI * 2);
  ctx.fillStyle = '#d4a574';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(headX, headY - 2, headR, Math.PI, 0);
  ctx.fillStyle = _sgDarken(color, 0.48);
  ctx.fill();
  if (!isSoldier) {
    ctx.fillStyle = '#c9a84c';
    ctx.beginPath();
    ctx.moveTo(headX, headY - headR - 7);
    ctx.lineTo(headX - 5, headY - headR + 2);
    ctx.lineTo(headX + 5, headY - headR + 2);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(headX + eyeDir * 4, headY - 1, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(headX + eyeDir * 5, headY - 1, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  if (pose.mouthOpen) {
    ctx.arc(headX + eyeDir * 1, headY + 5, 3, 0, Math.PI);
  } else {
    ctx.moveTo(headX - 3, headY + 5);
    ctx.lineTo(headX + 3, headY + 5);
  }
  ctx.stroke();

  if (pose.mouthOpen) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(headX + eyeDir * 1, headY - 5);
    ctx.lineTo(headX + eyeDir * 7, headY - 3);
    ctx.stroke();
  }

  if (shieldAlpha > 0) {
    ctx.strokeStyle = 'rgba(90,180,255,' + shieldAlpha + ')';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + eyeDir * 6, y + baseH * 0.46, 20, -Math.PI * 0.35, Math.PI * 0.35);
    ctx.stroke();
  }

  if (pose.swingArc) {
    ctx.strokeStyle = _sgColorToRgba(pose.swingArc.color || '#ffff88', pose.swingArc.alpha || 0.5);
    ctx.lineWidth = pose.swingArc.width || 5;
    ctx.beginPath();
    ctx.arc(x + eyeDir * 8, y + baseH * 0.34, pose.swingArc.radius || 26, pose.swingArc.start, pose.swingArc.end);
    ctx.stroke();
  }

  if (pose.chargeSparks) {
    for (var s = 0; s < 4; s++) {
      var ang = pose.chargeSparks.phase + s * Math.PI * 0.5;
      ctx.fillStyle = 'rgba(90,220,255,' + (0.25 + s * 0.08) + ')';
      ctx.beginPath();
      ctx.arc(x + Math.cos(ang) * 24, y + baseH * 0.56 + Math.sin(ang) * 18, 2 + (s % 2), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function _sgDrawKnockdownFrame(ctx, character, frameIdx, frameCount, isDeath) {
  var color = (character && character.color) || '#888888';
  var progress = frameCount <= 1 ? 1 : frameIdx / (frameCount - 1);
  var angle = Math.PI * 0.44 + progress * Math.PI * 0.12;
  var alpha = isDeath ? 1 - progress * 0.35 : 1;

  ctx.save();
  ctx.translate(64, 102);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(-44, -16, 78, 28);
  ctx.strokeStyle = isDeath ? '#ff4444' : '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(-44, -16, 78, 28);
  ctx.beginPath();
  ctx.arc(-42, -1, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#d4a574';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-47, -4);
  ctx.lineTo(-41, 2);
  ctx.moveTo(-41, -4);
  ctx.lineTo(-47, 2);
  ctx.stroke();
  ctx.restore();
}

function _sgDrawGetupFrame(ctx, character, frameIdx, frameCount) {
  var color = (character && character.color) || '#888888';
  var progress = (frameIdx + 1) / frameCount;
  var angle = (Math.PI * 0.5) * (1 - progress);

  ctx.save();
  ctx.translate(64, 108);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.fillRect(-20, -76, 40, 76);
  ctx.strokeStyle = '#44aaff';
  ctx.lineWidth = 2;
  ctx.strokeRect(-20, -76, 40, 76);
  ctx.beginPath();
  ctx.arc(0, -88, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#d4a574';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function _sgPoseForAction(action, frameIdx, frameCount, character) {
  var phase = (frameIdx / Math.max(1, frameCount)) * Math.PI * 2;
  var pose = {
    action: action,
    eyeDir: 1,
    breathe: 0,
    legSwing: 0,
    armSwing: 0,
    attackAngle: 0,
    blocking: false,
    weaponLen: 42,
    weaponGlow: false,
    mouthOpen: false,
    bodyOffsetY: 0,
    groundShift: 0,
    auraColor: null,
    auraAlpha: 0.28,
    auraPulse: 0,
    chargeSparks: null,
    swingArc: null,
    moveColor: (character && character.color) || '#ffcc66'
  };

  switch (action) {
    case ANIM.IDLE:
      pose.breathe = Math.sin(phase) * 1.5;
      break;
    case ANIM.RUN:
      pose.breathe = Math.sin(phase) * 2;
      pose.legSwing = Math.sin(phase) * 0.6;
      pose.armSwing = Math.sin(phase) * 0.45;
      pose.groundShift = Math.sin(phase * 2) * 1.5;
      break;
    case ANIM.JUMP:
      pose.bodyOffsetY = -8 - frameIdx * 3;
      pose.armSwing = frameIdx === 0 ? 0.25 : 0.45;
      pose.legSwing = frameIdx === 0 ? 0.18 : 0.35;
      break;
    case ANIM.FALL:
      pose.bodyOffsetY = -6 + frameIdx * 4;
      pose.armSwing = frameIdx === 0 ? -0.15 : -0.32;
      pose.legSwing = frameIdx === 0 ? -0.1 : -0.25;
      break;
    case ANIM.ATTACK1:
      pose.mouthOpen = true;
      pose.weaponGlow = frameIdx >= 1;
      pose.weaponLen = 44 + frameIdx * 2;
      pose.attackAngle = -0.18 - frameIdx * 0.18;
      pose.swingArc = { color: '#fff6a0', alpha: 0.35 + frameIdx * 0.08, width: 4, radius: 24 + frameIdx * 3, start: -0.9, end: 0.5 };
      break;
    case ANIM.ATTACK2:
      pose.mouthOpen = true;
      pose.weaponGlow = true;
      pose.weaponLen = 48 + frameIdx * 2;
      pose.attackAngle = -0.28 - frameIdx * 0.2;
      pose.swingArc = { color: '#ffd060', alpha: 0.4 + frameIdx * 0.08, width: 5, radius: 26 + frameIdx * 4, start: -1.15, end: 0.45 };
      break;
    case ANIM.SPECIAL:
      pose.mouthOpen = true;
      pose.weaponGlow = true;
      pose.weaponLen = 52;
      pose.attackAngle = -0.75 * Math.sin(phase + Math.PI * 0.25);
      pose.armSwing = Math.sin(phase) * 0.35;
      pose.auraColor = character && character.color ? character.color : '#44ccff';
      pose.auraAlpha = 0.3;
      pose.auraPulse = Math.sin(phase) * 6 + 8;
      pose.swingArc = { color: character && character.color ? character.color : '#44ccff', alpha: 0.5, width: 6, radius: 30 + Math.sin(phase) * 6, start: -0.9, end: 1.1 };
      break;
    case ANIM.ULTIMATE:
      pose.mouthOpen = true;
      pose.weaponGlow = true;
      pose.weaponLen = 58;
      pose.attackAngle = -1.05 * Math.sin(phase + Math.PI * 0.25);
      pose.armSwing = Math.sin(phase) * 0.5;
      pose.auraColor = '#ffd700';
      pose.auraAlpha = 0.4;
      pose.auraPulse = 12 + Math.sin(phase * 1.5) * 8;
      pose.backTrail = { color: _sgColorToRgba(character && character.color ? character.color : '#ffd700', 1), alpha: 0.2 + frameIdx * 0.04, offsetX: frameIdx * 4 };
      pose.swingArc = { color: '#fff4a0', alpha: 0.65, width: 7, radius: 34 + frameIdx * 4, start: -1.15, end: 1.35 };
      break;
    case ANIM.BLOCK:
      pose.blocking = true;
      pose.bodyOffsetY = 6;
      break;
    case ANIM.CHARGE:
      pose.breathe = Math.sin(phase) * 2;
      pose.auraColor = '#33ccff';
      pose.auraAlpha = 0.32;
      pose.auraPulse = 8 + Math.sin(phase * 2) * 5;
      pose.chargeSparks = { phase: phase * 1.5 };
      break;
    case ANIM.TAKE_HIT:
      pose.bodyOffsetY = frameIdx === 0 ? 5 : 2;
      pose.armSwing = frameIdx === 0 ? -0.35 : -0.12;
      pose.legSwing = frameIdx === 0 ? -0.16 : -0.06;
      pose.eyeDir = frameIdx === 0 ? -1 : 1;
      break;
  }

  return pose;
}

var generateCharacterSprites = function(character) {
  character = character || { color: '#888888', weapon: '' };
  var sprites = {};
  var states = Object.keys(SPRITE_FRAME_COUNTS);

  for (var s = 0; s < states.length; s++) {
    var action = states[s];
    var frameCount = SPRITE_FRAME_COUNTS[action];
    var frames = [];

    for (var i = 0; i < frameCount; i++) {
      var canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      var ctx = canvas.getContext('2d');
      if (!ctx) continue;

      if (action === ANIM.KNOCKDOWN) {
        _sgDrawKnockdownFrame(ctx, character, i, frameCount, false);
      } else if (action === ANIM.GETUP) {
        _sgDrawGetupFrame(ctx, character, i, frameCount);
      } else if (action === ANIM.DEATH) {
        _sgDrawKnockdownFrame(ctx, character, i, frameCount, true);
      } else {
        _sgDrawCharacterFrame(ctx, character, _sgPoseForAction(action, i, frameCount, character));
      }

      frames.push({ canvas: canvas, width: 128, height: 128 });
    }

    sprites[action] = frames;
  }

  return sprites;
};

generateCharacterSprites.frameCounts = SPRITE_FRAME_COUNTS;
