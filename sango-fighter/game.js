// ============================================================
// game.js — Main game loop, input, AI, screens for Sango Fighter
// ============================================================

(function () {
  'use strict';

  /* ---------- DOM refs ---------- */
  var charSelectScreen = document.getElementById('charSelectScreen');
  var gameScreen = document.getElementById('gameScreen');
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');

  var btnPvP = document.getElementById('btnPvP');
  var btnPvCPU = document.getElementById('btnPvCPU');
  var charSelectPanel = document.getElementById('charSelectPanel');
  var modeSelect = document.getElementById('modeSelect');
  var selectLabel = document.getElementById('selectLabel');
  var charGrid = document.getElementById('charGrid');
  var btnFight = document.getElementById('btnFight');

  var p1Portrait = document.getElementById('p1Portrait');
  var p2Portrait = document.getElementById('p2Portrait');
  var p1NameEl = document.getElementById('p1Name');
  var p2NameEl = document.getElementById('p2Name');

  var p1HealthBar = document.getElementById('p1HealthBar');
  var p2HealthBar = document.getElementById('p2HealthBar');
  var p1HudName = document.getElementById('p1HudName');
  var p2HudName = document.getElementById('p2HudName');
  var p1HudPortrait = document.getElementById('p1HudPortrait');
  var p2HudPortrait = document.getElementById('p2HudPortrait');
  var timerDisplay = document.getElementById('timerDisplay');

  var roundResult = document.getElementById('roundResult');
  var resultText = document.getElementById('resultText');
  var btnRestart = document.getElementById('btnRestart');
  var btnBackToMenu = document.getElementById('btnBackToMenu');

  /* ---------- State ---------- */
  var gameMode = '';
  var selectingFor = 1;
  var p1Char = null;
  var p2Char = null;

  var player1 = null;
  var player2 = null;
  var animFrameId = null;
  var gameRunning = false;
  var timer = 99;
  var timerInterval = null;

  var bgParticles = [];
  var hitEffects = [];

  /* ========================================
     Character Select
     ======================================== */

  function buildCharGrid() {
    charGrid.innerHTML = '';
    CHARACTER_ROSTER.forEach(function (c) {
      var cell = document.createElement('div');
      cell.className = 'char-cell';
      cell.dataset.charId = c.id;
      cell.innerHTML =
        '<div style="width:40px;height:40px;background:' + c.color + ';border-radius:4px;"></div>' +
        '<span>' + c.name + '</span>' +
        '<span class="faction">' + c.faction + '</span>';
      cell.addEventListener('click', function () { onCharSelect(c, cell); });
      charGrid.appendChild(cell);
    });
  }

  function onCharSelect(charData, cellEl) {
    if (selectingFor === 1) {
      p1Char = charData;
      charGrid.querySelectorAll('.selected-p1').forEach(function (el) { el.classList.remove('selected-p1'); });
      cellEl.classList.add('selected-p1');
      p1Portrait.textContent = charData.name;
      p1Portrait.style.background = charData.color;
      p1Portrait.style.color = '#fff';
      p1NameEl.textContent = charData.name;

      if (gameMode === 'pvcpu') {
        var available = CHARACTER_ROSTER.filter(function (c) { return c.id !== charData.id; });
        p2Char = available[Math.floor(Math.random() * available.length)];
        p2Portrait.textContent = p2Char.name;
        p2Portrait.style.background = p2Char.color;
        p2Portrait.style.color = '#fff';
        p2NameEl.textContent = p2Char.name;
        btnFight.classList.remove('hidden');
      } else {
        selectingFor = 2;
        selectLabel.textContent = 'P2 選擇角色';
      }
    } else {
      p2Char = charData;
      charGrid.querySelectorAll('.selected-p2').forEach(function (el) { el.classList.remove('selected-p2'); });
      cellEl.classList.add('selected-p2');
      p2Portrait.textContent = charData.name;
      p2Portrait.style.background = charData.color;
      p2Portrait.style.color = '#fff';
      p2NameEl.textContent = charData.name;
      btnFight.classList.remove('hidden');
    }
  }

  btnPvP.addEventListener('click', function () {
    gameMode = 'pvp';
    modeSelect.classList.add('hidden');
    charSelectPanel.classList.remove('hidden');
    selectingFor = 1;
    selectLabel.textContent = 'P1 選擇角色';
    buildCharGrid();
  });

  btnPvCPU.addEventListener('click', function () {
    gameMode = 'pvcpu';
    modeSelect.classList.add('hidden');
    charSelectPanel.classList.remove('hidden');
    selectingFor = 1;
    selectLabel.textContent = '選擇你的武將';
    buildCharGrid();
  });

  btnFight.addEventListener('click', function () {
    if (p1Char && p2Char) {
      startGame();
    }
  });

  btnRestart.addEventListener('click', function () {
    roundResult.classList.add('hidden');
    startGame();
  });

  btnBackToMenu.addEventListener('click', function () {
    stopGame();
    roundResult.classList.add('hidden');
    gameScreen.classList.add('hidden');
    charSelectScreen.classList.remove('hidden');
    modeSelect.classList.remove('hidden');
    charSelectPanel.classList.add('hidden');
    btnFight.classList.add('hidden');
    p1Char = null;
    p2Char = null;
    selectingFor = 1;
    p1Portrait.textContent = 'P1';
    p2Portrait.textContent = 'P2';
    p1Portrait.style.background = '';
    p2Portrait.style.background = '';
    p1NameEl.textContent = '---';
    p2NameEl.textContent = '---';
  });

  /* ========================================
     Game Start / Stop
     ======================================== */

  function startGame() {
    stopGame();

    charSelectScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    roundResult.classList.add('hidden');

    hitEffects.length = 0;

    var fHeight = 140;
    player1 = new Fighter({
      position: { x: 200, y: GROUND_Y - fHeight },
      color: p1Char.color,
      width: 55,
      height: fHeight,
      facingRight: true,
      charData: p1Char,
      attackBox: { offset: { x: 10, y: 20 }, width: 90, height: 40 }
    });

    player2 = new Fighter({
      position: { x: 700, y: GROUND_Y - fHeight },
      color: p2Char.color,
      width: 55,
      height: fHeight,
      facingRight: false,
      charData: p2Char,
      attackBox: { offset: { x: 10, y: 20 }, width: 90, height: 40 }
    });

    applyStats(player1, p1Char.stats);
    applyStats(player2, p2Char.stats);

    p1HudName.textContent = p1Char.name;
    p2HudName.textContent = p2Char.name;
    p1HudPortrait.textContent = p1Char.name.charAt(0);
    p2HudPortrait.textContent = p2Char.name.charAt(0);
    p1HudPortrait.style.background = p1Char.color;
    p2HudPortrait.style.background = p2Char.color;
    p1HealthBar.style.width = '100%';
    p2HealthBar.style.width = '100%';

    timer = 99;
    timerDisplay.textContent = String(timer);
    timerInterval = setInterval(function () {
      if (!gameRunning) return;
      timer--;
      timerDisplay.textContent = String(timer);
      if (timer <= 0) {
        endRound();
      }
    }, 1000);

    initBgParticles();

    gameRunning = true;
    animFrameId = requestAnimationFrame(gameLoop);
  }

  function applyStats(fighter, stats) {
    fighter._atkMultiplier = 0.7 + stats.atk * 0.06;
    fighter._defMultiplier = 1 - stats.def * 0.04;
    fighter.speed = 3.5 + stats.spd * 0.35;
  }

  function stopGame() {
    gameRunning = false;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  /* ========================================
     Background Particles
     ======================================== */

  function initBgParticles() {
    bgParticles.length = 0;
    for (var i = 0; i < 30; i++) {
      bgParticles.push({
        x: Math.random() * CANVAS_W,
        y: Math.random() * CANVAS_H,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.5 - 0.2,
        alpha: Math.random() * 0.3 + 0.1
      });
    }
  }

  function updateBgParticles() {
    for (var i = 0; i < bgParticles.length; i++) {
      var p = bgParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -5) { p.y = CANVAS_H + 5; p.x = Math.random() * CANVAS_W; }
      if (p.x < -5) p.x = CANVAS_W + 5;
      if (p.x > CANVAS_W + 5) p.x = -5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,220,150,' + p.alpha + ')';
      ctx.fill();
    }
  }

  /* ========================================
     Game Loop
     ======================================== */

  function gameLoop() {
    if (!gameRunning) return;
    animFrameId = requestAnimationFrame(gameLoop);

    drawBackground();

    if (gameMode === 'pvcpu') {
      cpuAI(player2, player1);
    }

    player1.updateFighter(ctx, player2);
    player2.updateFighter(ctx, player1);

    checkAttackCollision(player1, player2);
    checkAttackCollision(player2, player1);

    drawHitEffects();

    p1HealthBar.style.width = player1.health + '%';
    p2HealthBar.style.width = player2.health + '%';
    updateHealthBarColor(p1HealthBar, player1.health);
    updateHealthBarColor(p2HealthBar, player2.health);

    if (player1.dead || player2.dead) {
      endRound();
    }
  }

  function drawBackground() {
    var grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, '#1a0a2e');
    grad.addColorStop(0.5, '#2d1b69');
    grad.addColorStop(1, '#11270b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    updateBgParticles();

    ctx.fillStyle = '#1a1a3a';
    drawMountain(100, GROUND_Y, 300, 120);
    drawMountain(400, GROUND_Y, 250, 80);
    drawMountain(700, GROUND_Y, 350, 100);

    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);
    ctx.strokeStyle = '#6a5a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.stroke();
  }

  function drawMountain(x, baseY, w, h) {
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x + w / 2, baseY - h);
    ctx.lineTo(x + w, baseY);
    ctx.closePath();
    ctx.fill();
  }

  function updateHealthBarColor(barEl, health) {
    if (health > 50) {
      barEl.style.background = 'linear-gradient(90deg, #22cc44, #44ff66)';
    } else if (health > 25) {
      barEl.style.background = 'linear-gradient(90deg, #ccaa22, #ffcc44)';
    } else {
      barEl.style.background = 'linear-gradient(90deg, #cc2222, #ff4444)';
    }
  }

  /* ========================================
     Hit Effects
     ======================================== */

  function spawnHitEffect(x, y) {
    for (var i = 0; i < 8; i++) {
      hitEffects.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 15 + Math.floor(Math.random() * 10),
        maxLife: 25,
        r: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? '#ffcc00' : '#ff6600'
      });
    }
  }

  function drawHitEffects() {
    for (var i = hitEffects.length - 1; i >= 0; i--) {
      var h = hitEffects[i];
      h.x += h.vx;
      h.y += h.vy;
      h.vy += 0.3;
      h.life--;
      if (h.life <= 0) {
        hitEffects.splice(i, 1);
        continue;
      }
      var alpha = Math.min(1, h.life / h.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
      ctx.fillStyle = h.color;
      ctx.fill();
      ctx.restore();
    }
  }

  /* ========================================
     Collision Detection
     ======================================== */

  function rectanglesOverlap(a, b) {
    return (
      a.position.x < b.position.x + b.width &&
      a.position.x + a.width > b.position.x &&
      a.position.y < b.position.y + b.height &&
      a.position.y + a.height > b.position.y
    );
  }

  function checkAttackCollision(attacker, defender) {
    if (!attacker.isAttacking || attacker.hasHitThisSwing || defender.dead) return;

    var atkRect = {
      position: attacker.attackBox.position,
      width: attacker.attackBox.width,
      height: attacker.attackBox.height
    };
    var defRect = {
      position: defender.position,
      width: defender.width,
      height: defender.height
    };

    if (rectanglesOverlap(atkRect, defRect)) {
      attacker.hasHitThisSwing = true;

      var baseDamage = attacker.attackType === 1 ? 8 : 15;
      var damage = baseDamage * (attacker._atkMultiplier || 1) * (defender._defMultiplier || 1);
      damage = Math.round(damage);
      if (damage < 1) damage = 1;

      var knockDir = attacker.facingRight ? 1 : -1;
      var knockForce = attacker.attackType === 1 ? 5 : 10;
      defender.takeHit(damage, knockDir * knockForce);

      spawnHitEffect(
        defender.position.x + defender.width / 2,
        defender.position.y + defender.height * 0.3
      );
    }
  }

  /* ========================================
     End Round
     ======================================== */

  function endRound() {
    if (!gameRunning) return;
    stopGame();

    var result = '';
    if (player1.dead && player2.dead) {
      result = '平手！ TIE!';
    } else if (player1.dead) {
      result = p2Char.name + ' 獲勝！';
    } else if (player2.dead) {
      result = p1Char.name + ' 獲勝！';
    } else {
      if (player1.health > player2.health) {
        result = p1Char.name + ' 獲勝！';
      } else if (player2.health > player1.health) {
        result = p2Char.name + ' 獲勝！';
      } else {
        result = '平手！ TIE!';
      }
    }

    resultText.textContent = result;
    roundResult.classList.remove('hidden');
  }

  /* ========================================
     CPU AI
     ======================================== */

  function cpuAI(cpu, target) {
    if (cpu.dead || cpu.hitstun > 0) return;

    var dx = target.position.x - cpu.position.x;
    var dist = Math.abs(dx);

    cpu.keys.left = false;
    cpu.keys.right = false;
    cpu.keys.jump = false;

    var attackRange = cpu.attackBox.width + cpu.width * 0.5;
    if (dist > attackRange + 30) {
      if (dx > 0) cpu.keys.right = true;
      else cpu.keys.left = true;
      if (Math.random() < 0.02 && cpu.onGround) {
        cpu.keys.jump = true;
      }
    } else if (dist < 40) {
      if (Math.random() < 0.3) {
        if (dx > 0) cpu.keys.left = true;
        else cpu.keys.right = true;
      }
    }

    if (dist < attackRange + 20 && cpu.attackCooldown <= 0 && !cpu.isAttacking) {
      if (Math.random() < 0.12) {
        cpu.keys.attack1 = true;
      } else if (Math.random() < 0.04) {
        cpu.keys.attack2 = true;
      }
    }

    if (target.isAttacking && dist < attackRange + 50 && cpu.onGround && Math.random() < 0.2) {
      cpu.keys.jump = true;
    }
  }

  /* ========================================
     Input Handling
     ======================================== */

  var keysDown = {};

  window.addEventListener('keydown', function (e) {
    if (keysDown[e.key]) return;
    keysDown[e.key] = true;

    if (!gameRunning || !player1 || !player2) return;

    switch (e.key.toLowerCase()) {
      case 'a': player1.keys.left = true; break;
      case 'd': player1.keys.right = true; break;
      case 'w': player1.keys.jump = true; break;
      case ' ':
        e.preventDefault();
        player1.keys.attack1 = true;
        break;
      case 's':
        player1.keys.attack2 = true;
        break;
    }

    if (gameMode === 'pvp') {
      switch (e.key) {
        case 'ArrowLeft': player2.keys.left = true; e.preventDefault(); break;
        case 'ArrowRight': player2.keys.right = true; e.preventDefault(); break;
        case 'ArrowUp': player2.keys.jump = true; e.preventDefault(); break;
        case 'Enter': player2.keys.attack1 = true; e.preventDefault(); break;
        case 'ArrowDown': player2.keys.attack2 = true; e.preventDefault(); break;
      }
    }
  });

  window.addEventListener('keyup', function (e) {
    keysDown[e.key] = false;

    if (!gameRunning || !player1 || !player2) return;

    switch (e.key.toLowerCase()) {
      case 'a': player1.keys.left = false; break;
      case 'd': player1.keys.right = false; break;
      case 'w': player1.keys.jump = false; break;
    }

    if (gameMode === 'pvp') {
      switch (e.key) {
        case 'ArrowLeft': player2.keys.left = false; break;
        case 'ArrowRight': player2.keys.right = false; break;
        case 'ArrowUp': player2.keys.jump = false; break;
      }
    }
  });

})();
