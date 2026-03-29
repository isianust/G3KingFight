// ============================================================
// game.js — Main game loop, input, AI, screens, story mode
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
  var btnStory = document.getElementById('btnStory');
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
  var p1EnergyBar = document.getElementById('p1EnergyBar');
  var p2EnergyBar = document.getElementById('p2EnergyBar');
  var p1HudName = document.getElementById('p1HudName');
  var p2HudName = document.getElementById('p2HudName');
  var p1HudPortrait = document.getElementById('p1HudPortrait');
  var p2HudPortrait = document.getElementById('p2HudPortrait');
  var timerDisplay = document.getElementById('timerDisplay');

  var roundResult = document.getElementById('roundResult');
  var resultText = document.getElementById('resultText');
  var btnRestart = document.getElementById('btnRestart');
  var btnBackToMenu = document.getElementById('btnBackToMenu');

  // Story mode elements
  var storySelectScreen = document.getElementById('storySelectScreen');
  var dialogOverlay = document.getElementById('dialogOverlay');
  var dialogPortrait = document.getElementById('dialogPortrait');
  var dialogSpeaker = document.getElementById('dialogSpeaker');
  var dialogText = document.getElementById('dialogText');
  var btnDialogNext = document.getElementById('btnDialogNext');

  // Move list overlay
  var moveListOverlay = document.getElementById('moveListOverlay');
  var moveListContent = document.getElementById('moveListContent');
  var btnMoveList = document.getElementById('btnMoveList');
  var btnCloseMoveList = document.getElementById('btnCloseMoveList');

  // In-battle move list
  var battleMoveList = document.getElementById('battleMoveList');
  var battleMoveListContent = document.getElementById('battleMoveListContent');
  var btnToggleBattleMoves = document.getElementById('btnToggleBattleMoves');

  /* ---------- State ---------- */
  var gameMode = ''; // 'pvp', 'pvcpu', 'story'
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
  var projectiles = [];

  /* ---------- Combat constants ---------- */
  var LIGHT_ATTACK_DAMAGE = 8;
  var HEAVY_ATTACK_DAMAGE = 15;
  var LIGHT_ATTACK_KNOCKBACK = 5;
  var HEAVY_ATTACK_KNOCKBACK = 10;

  /* ---------- Story mode state ---------- */
  var storyFaction = '';
  var storyChapterIndex = 0;
  var storyBattleIndex = 0;
  var storyDialogQueue = [];
  var storyDialogIndex = 0;
  var storyPhase = ''; // 'select', 'dialog_before', 'battle', 'dialog_after', 'chapter_end', 'victory'
  var storyHeroChar = null;

  /* ========================================
     Character Select
     ======================================== */

  function buildCharGrid(filterFaction) {
    charGrid.innerHTML = '';
    var roster = CHARACTER_ROSTER;
    if (filterFaction) {
      roster = roster.filter(function (c) { return c.faction === filterFaction; });
    }

    // Group by faction
    var factions = {};
    roster.forEach(function (c) {
      if (!factions[c.faction]) factions[c.faction] = [];
      factions[c.faction].push(c);
    });

    Object.keys(factions).forEach(function (faction) {
      var factionLabel = document.createElement('div');
      factionLabel.className = 'faction-label';
      factionLabel.textContent = faction;
      factionLabel.style.color = FACTIONS[faction] ? FACTIONS[faction].color : '#fff';
      charGrid.appendChild(factionLabel);

      factions[faction].forEach(function (c) {
        var cell = document.createElement('div');
        cell.className = 'char-cell';
        cell.dataset.charId = c.id;
        cell.innerHTML =
          '<div class="char-cell-portrait" style="background:' + c.color + ';"></div>' +
          '<span>' + c.name + '</span>' +
          '<span class="faction">' + c.faction + '</span>';
        cell.addEventListener('click', function () { onCharSelect(c, cell); });
        charGrid.appendChild(cell);
      });
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

      // Show char info
      showCharInfo(charData, 'p1');

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

      showCharInfo(charData, 'p2');
      btnFight.classList.remove('hidden');
    }
  }

  function showCharInfo(charData, player) {
    var infoEl = document.getElementById(player + 'CharInfo');
    if (!infoEl) return;
    var html = '<strong>' + charData.name + '</strong> (' + charData.nameEn + ')<br>';
    html += '武器：' + (charData.weapon || '—') + '<br>';
    html += '攻:' + charData.stats.atk + ' 防:' + charData.stats.def + ' 速:' + charData.stats.spd + '<br>';
    if (charData.moves) {
      html += '<div class="char-moves">';
      charData.moves.forEach(function (m) {
        html += '<span class="move-tag" style="border-color:' + (m.color || '#aaa') + ';">' + m.name + ' (' + m.energyCost + '氣)</span>';
      });
      if (charData.ultimate) {
        html += '<span class="move-tag ultimate-tag">★ ' + charData.ultimate.name + ' (滿氣)</span>';
      }
      html += '</div>';
    }
    infoEl.innerHTML = html;
  }

  /* ---------- Mode buttons ---------- */
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

  btnStory.addEventListener('click', function () {
    gameMode = 'story';
    charSelectScreen.classList.add('hidden');
    storySelectScreen.classList.remove('hidden');
  });

  btnFight.addEventListener('click', function () {
    if (p1Char && p2Char) {
      startGame();
    }
  });

  btnRestart.addEventListener('click', function () {
    roundResult.classList.add('hidden');
    if (gameMode === 'story') {
      // In story mode, continue to next battle or chapter
      storyNextStep();
    } else {
      startGame();
    }
  });

  btnBackToMenu.addEventListener('click', function () {
    stopGame();
    roundResult.classList.add('hidden');
    gameScreen.classList.add('hidden');
    charSelectScreen.classList.remove('hidden');
    modeSelect.classList.remove('hidden');
    charSelectPanel.classList.add('hidden');
    btnFight.classList.add('hidden');
    storySelectScreen.classList.add('hidden');
    p1Char = null;
    p2Char = null;
    selectingFor = 1;
    p1Portrait.textContent = 'P1';
    p2Portrait.textContent = 'P2';
    p1Portrait.style.background = '';
    p2Portrait.style.background = '';
    p1NameEl.textContent = '---';
    p2NameEl.textContent = '---';
    var p1Info = document.getElementById('p1CharInfo');
    var p2Info = document.getElementById('p2CharInfo');
    if (p1Info) p1Info.innerHTML = '';
    if (p2Info) p2Info.innerHTML = '';
  });

  /* ========================================
     Story Mode
     ======================================== */

  function initStorySelect() {
    var container = document.getElementById('storyCampaigns');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(STORY_CAMPAIGNS).forEach(function (faction) {
      var campaign = STORY_CAMPAIGNS[faction];
      var fData = FACTIONS[faction];
      var card = document.createElement('div');
      card.className = 'story-card';
      card.style.borderColor = fData ? fData.color : '#fff';
      card.innerHTML =
        '<h3 style="color:' + (fData ? fData.color : '#fff') + '">' + campaign.title + '</h3>' +
        '<p>' + campaign.description + '</p>' +
        '<button class="mode-btn story-start-btn" data-faction="' + faction + '">開始</button>';
      container.appendChild(card);
    });

    container.querySelectorAll('.story-start-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        storyFaction = btn.dataset.faction;
        startStoryCampaign(storyFaction);
      });
    });
  }

  function startStoryCampaign(faction) {
    var campaign = STORY_CAMPAIGNS[faction];
    if (!campaign) return;

    storySelectScreen.classList.add('hidden');

    // Select hero
    storyHeroChar = CHARACTER_ROSTER.find(function (c) { return c.id === campaign.protagonist; });
    p1Char = storyHeroChar;

    storyChapterIndex = 0;
    storyBattleIndex = 0;
    storyPhase = 'dialog_before';

    startStoryChapter();
  }

  function startStoryChapter() {
    var campaign = STORY_CAMPAIGNS[storyFaction];
    if (storyChapterIndex >= campaign.chapters.length) {
      // Campaign complete!
      storyPhase = 'victory';
      showStoryVictory();
      return;
    }

    var chapter = campaign.chapters[storyChapterIndex];
    storyBattleIndex = 0;

    // Show chapter title
    showChapterTitle(chapter, function () {
      // Show chapter dialogsBefore
      if (chapter.dialogsBefore && chapter.dialogsBefore.length > 0) {
        storyPhase = 'dialog_before';
        showStoryDialogs(chapter.dialogsBefore, function () {
          startStoryBattle();
        });
      } else {
        startStoryBattle();
      }
    });
  }

  function showChapterTitle(chapter, callback) {
    gameScreen.classList.remove('hidden');
    charSelectScreen.classList.add('hidden');
    storySelectScreen.classList.add('hidden');

    // Draw chapter title on canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(chapter.title, CANVAS_W / 2, CANVAS_H / 2 - 20);

    ctx.fillStyle = '#c9a84c';
    ctx.font = '18px sans-serif';
    ctx.fillText(chapter.titleEn, CANVAS_W / 2, CANVAS_H / 2 + 20);

    setTimeout(callback, 2000);
  }

  function showStoryDialogs(dialogs, callback) {
    storyDialogQueue = dialogs;
    storyDialogIndex = 0;
    dialogOverlay.classList.remove('hidden');
    showNextDialog(callback);
  }

  function showNextDialog(callback) {
    if (storyDialogIndex >= storyDialogQueue.length) {
      dialogOverlay.classList.add('hidden');
      if (callback) callback();
      return;
    }

    var dialog = storyDialogQueue[storyDialogIndex];
    dialogSpeaker.textContent = dialog.speaker;
    dialogText.textContent = dialog.text;

    // Find character data for portrait color
    var charMatch = CHARACTER_ROSTER.find(function (c) { return c.name === dialog.speaker; });
    if (charMatch) {
      dialogPortrait.style.background = charMatch.color;
      dialogPortrait.textContent = charMatch.name.charAt(0);
    } else {
      dialogPortrait.style.background = '#555';
      dialogPortrait.textContent = dialog.speaker.charAt(0);
    }

    // Wait for click to advance
    var nextHandler = function () {
      btnDialogNext.removeEventListener('click', nextHandler);
      storyDialogIndex++;
      showNextDialog(callback);
    };
    btnDialogNext.addEventListener('click', nextHandler);
  }

  function startStoryBattle() {
    var campaign = STORY_CAMPAIGNS[storyFaction];
    var chapter = campaign.chapters[storyChapterIndex];

    if (storyBattleIndex >= chapter.battles.length) {
      // All battles in chapter done
      if (chapter.dialogsAfter && chapter.dialogsAfter.length > 0) {
        showStoryDialogs(chapter.dialogsAfter, function () {
          storyChapterIndex++;
          startStoryChapter();
        });
      } else {
        storyChapterIndex++;
        startStoryChapter();
      }
      return;
    }

    var battle = chapter.battles[storyBattleIndex];

    // Show battle dialog if any
    var startFight = function () {
      if (battle.opponentType === 'soldier') {
        var soldierType = SOLDIER_TYPES.find(function (s) { return s.id === battle.opponent; });
        if (soldierType) {
          p2Char = {
            id: soldierType.id,
            name: soldierType.name,
            nameEn: soldierType.nameEn,
            faction: '小兵',
            color: soldierType.color,
            stats: soldierType.stats,
            isSoldier: true,
            soldierType: soldierType
          };
        }
      } else {
        p2Char = CHARACTER_ROSTER.find(function (c) { return c.id === battle.opponent; });
      }

      storyPhase = 'battle';
      startGame();
    };

    if (battle.dialogBefore && battle.dialogBefore.length > 0) {
      showStoryDialogs(battle.dialogBefore, startFight);
    } else {
      startFight();
    }
  }

  function storyNextStep() {
    var campaign = STORY_CAMPAIGNS[storyFaction];
    var chapter = campaign.chapters[storyChapterIndex];
    var battle = chapter.battles[storyBattleIndex];

    // Check if there's post-battle dialog
    if (battle && battle.dialogAfter && battle.dialogAfter.length > 0) {
      showStoryDialogs(battle.dialogAfter, function () {
        storyBattleIndex++;
        startStoryBattle();
      });
    } else {
      storyBattleIndex++;
      startStoryBattle();
    }
  }

  function showStoryVictory() {
    gameScreen.classList.remove('hidden');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    var campaign = STORY_CAMPAIGNS[storyFaction];
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('通關！', CANVAS_W / 2, CANVAS_H / 2 - 40);
    ctx.font = '28px sans-serif';
    ctx.fillText(campaign.title + ' 完結', CANVAS_W / 2, CANVAS_H / 2 + 20);

    ctx.fillStyle = '#c9a84c';
    ctx.font = '18px sans-serif';
    ctx.fillText('恭喜通關！按任意鍵返回主選單', CANVAS_W / 2, CANVAS_H / 2 + 60);

    var returnHandler = function () {
      window.removeEventListener('keydown', returnHandler);
      btnBackToMenu.click();
    };
    window.addEventListener('keydown', returnHandler);
  }

  /* ========================================
     Move List
     ======================================== */

  if (btnMoveList) {
    btnMoveList.addEventListener('click', function () {
      showMoveList();
    });
  }

  if (btnCloseMoveList) {
    btnCloseMoveList.addEventListener('click', function () {
      moveListOverlay.classList.add('hidden');
    });
  }

  function showMoveList() {
    if (!moveListContent || !moveListOverlay) return;
    moveListContent.innerHTML = '';

    CHARACTER_ROSTER.forEach(function (c) {
      var section = document.createElement('div');
      section.className = 'movelist-character';

      var header = '<h3 style="color:' + c.color + '">' + c.name + ' (' + c.nameEn + ') — ' + (c.weapon || '') + '</h3>';
      header += '<div class="movelist-stats">攻:' + c.stats.atk + ' 防:' + c.stats.def + ' 速:' + c.stats.spd + '</div>';

      var movesHtml = '<table class="movelist-table"><tr><th>招式</th><th>指令</th><th>傷害</th><th>氣消耗</th><th>說明</th></tr>';

      if (c.moves) {
        c.moves.forEach(function (m) {
          var cmdStr = commandToString(m.command);
          movesHtml += '<tr><td style="color:' + (m.color || '#fff') + '">' + m.name + '</td>';
          movesHtml += '<td>' + cmdStr + ' + 攻擊</td>';
          movesHtml += '<td>' + m.damage + '</td>';
          movesHtml += '<td>' + m.energyCost + '</td>';
          movesHtml += '<td>' + m.description + '</td></tr>';
        });
      }

      if (c.ultimate) {
        movesHtml += '<tr class="ultimate-row"><td style="color:' + (c.ultimate.color || '#ffd700') + '">★ ' + c.ultimate.name + '</td>';
        movesHtml += '<td>滿氣 + 輕重攻擊同按</td>';
        movesHtml += '<td>' + c.ultimate.damage + '</td>';
        movesHtml += '<td>' + c.ultimate.energyCost + '</td>';
        movesHtml += '<td>' + c.ultimate.description + '</td></tr>';
      }

      movesHtml += '</table>';
      section.innerHTML = header + movesHtml;
      moveListContent.appendChild(section);
    });

    moveListOverlay.classList.remove('hidden');
  }

  function commandToString(cmd) {
    var map = {
      'D': '↓', 'DF': '↘', 'F': '→', 'DB': '↙', 'B': '←', 'U': '↑',
      'D_HOLD': '↓(蓄)', 'U_HOLD': '↑(蓄)', 'B_HOLD': '←(蓄)', 'F_HOLD': '→(蓄)'
    };
    return cmd.map(function (c) { return map[c] || c; }).join(' ');
  }

  /* ---------- In-battle move list toggle ---------- */
  if (btnToggleBattleMoves) {
    btnToggleBattleMoves.addEventListener('click', function () {
      if (battleMoveList) {
        battleMoveList.classList.toggle('collapsed');
        btnToggleBattleMoves.textContent = battleMoveList.classList.contains('collapsed')
          ? '招式表 ▶'
          : '◀ 收起';
      }
    });
  }

  function populateBattleMoveList() {
    if (!battleMoveListContent) return;
    battleMoveListContent.innerHTML = '';
    var chars = [];
    if (p1Char) chars.push({ label: 'P1', data: p1Char });
    if (p2Char && !p2Char.isSoldier) chars.push({ label: 'P2', data: p2Char });

    chars.forEach(function (entry) {
      var c = entry.data;
      var sec = document.createElement('div');
      sec.className = 'battle-movelist-section';
      var html = '<h4 style="color:' + c.color + '">' + entry.label + ' ' + c.name + '</h4>';

      if (c.moves) {
        c.moves.forEach(function (m) {
          var cmdStr = commandToString(m.command);
          html += '<div class="bml-move"><span class="bml-move-name" style="color:' +
            (m.color || '#fff') + '">' + m.name + '</span><span class="bml-move-cmd">' +
            cmdStr + '+攻 (' + m.energyCost + '氣)</span></div>';
        });
      }
      if (c.ultimate) {
        var ultCmd = entry.label === 'P1' ? '滿氣+U+I' : '滿氣+Enter+/';
        html += '<div class="bml-move bml-ultimate"><span class="bml-move-name" style="color:' +
          (c.ultimate.color || '#ffd700') + '">★ ' + c.ultimate.name +
          '</span><span class="bml-move-cmd">' + ultCmd + '</span></div>';
      }
      sec.innerHTML = html;
      battleMoveListContent.appendChild(sec);
    });
  }

  /* ========================================
     Game Start / Stop
     ======================================== */

  function startGame() {
    stopGame();

    charSelectScreen.classList.add('hidden');
    storySelectScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    roundResult.classList.add('hidden');
    dialogOverlay.classList.add('hidden');

    hitEffects.length = 0;
    projectiles.length = 0;

    var fHeight = 140;
    var isSoldierP2 = p2Char && p2Char.isSoldier;
    var soldierP2Height = isSoldierP2 ? 100 : fHeight;

    player1 = new Fighter({
      position: { x: 200, y: GROUND_Y - fHeight },
      color: p1Char.color,
      width: 55,
      height: fHeight,
      facingRight: true,
      charData: p1Char,
      isSoldier: false,
      attackBox: { offset: { x: 10, y: 20 }, width: 90, height: 40 }
    });

    player2 = new Fighter({
      position: { x: 700, y: GROUND_Y - soldierP2Height },
      color: p2Char.color,
      width: isSoldierP2 ? 40 : 55,
      height: soldierP2Height,
      facingRight: false,
      charData: p2Char,
      isSoldier: isSoldierP2,
      soldierType: isSoldierP2 ? p2Char.soldierType : null,
      attackBox: {
        offset: { x: 10, y: 20 },
        width: isSoldierP2 && p2Char.soldierType ? (p2Char.soldierType.attackRange || 60) : 90,
        height: isSoldierP2 ? 30 : 40
      }
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
    if (p1EnergyBar) p1EnergyBar.style.width = '0%';
    if (p2EnergyBar) p2EnergyBar.style.width = '0%';

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
    currentStage = Math.floor(Math.random() * STAGE_COUNT);

    // Populate and reset in-battle move list
    populateBattleMoveList();
    if (battleMoveList) {
      battleMoveList.classList.add('collapsed');
      if (btnToggleBattleMoves) btnToggleBattleMoves.textContent = '招式表 ▶';
    }

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

    if (gameMode === 'pvcpu' || gameMode === 'story') {
      cpuAI(player2, player1);
    }

    player1.updateFighter(ctx, player2);
    player2.updateFighter(ctx, player1);

    checkAttackCollision(player1, player2);
    checkAttackCollision(player2, player1);

    // Update projectiles
    updateProjectiles();

    drawHitEffects();

    // Update HUD
    p1HealthBar.style.width = (player1.health / player1.maxHealth * 100) + '%';
    p2HealthBar.style.width = (player2.health / player2.maxHealth * 100) + '%';
    updateHealthBarColor(p1HealthBar, player1.health / player1.maxHealth * 100);
    updateHealthBarColor(p2HealthBar, player2.health / player2.maxHealth * 100);

    // Update energy bars
    if (p1EnergyBar) p1EnergyBar.style.width = (player1.energy / player1.maxEnergy * 100) + '%';
    if (p2EnergyBar) p2EnergyBar.style.width = (player2.energy / player2.maxEnergy * 100) + '%';

    // Energy bar color - glow when full
    if (p1EnergyBar) {
      if (player1.energy >= MAX_ENERGY) {
        p1EnergyBar.style.background = 'linear-gradient(90deg, #ffdd00, #ffaa00)';
        p1EnergyBar.classList.add('energy-full');
      } else {
        p1EnergyBar.style.background = 'linear-gradient(90deg, #0088ff, #00ccff)';
        p1EnergyBar.classList.remove('energy-full');
      }
    }
    if (p2EnergyBar) {
      if (player2.energy >= MAX_ENERGY) {
        p2EnergyBar.style.background = 'linear-gradient(270deg, #ffdd00, #ffaa00)';
        p2EnergyBar.classList.add('energy-full');
      } else {
        p2EnergyBar.style.background = 'linear-gradient(270deg, #0088ff, #00ccff)';
        p2EnergyBar.classList.remove('energy-full');
      }
    }

    if (player1.dead || player2.dead) {
      endRound();
    }
  }

  /* ========================================
     Background — Multiple Stages
     ======================================== */

  var currentStage = 0;
  var STAGE_COUNT = 5;

  function drawBackground() {
    // Cycle stages based on characters or randomly
    var stage = currentStage % STAGE_COUNT;

    switch (stage) {
      case 0: drawStage_BattlefieldDusk(); break;
      case 1: drawStage_ImperialPalace(); break;
      case 2: drawStage_RedCliff(); break;
      case 3: drawStage_BambooForest(); break;
      case 4: drawStage_AncientBridge(); break;
      default: drawStage_BattlefieldDusk(); break;
    }
  }

  // Stage 0: Battlefield at Dusk — 黃昏戰場
  function drawStage_BattlefieldDusk() {
    // Sky gradient — dramatic dusk
    var grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#1a0a2e');
    grad.addColorStop(0.15, '#2d1b4e');
    grad.addColorStop(0.35, '#6b2d3e');
    grad.addColorStop(0.55, '#c44e2d');
    grad.addColorStop(0.75, '#e8913a');
    grad.addColorStop(1, '#f4c462');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    // Sun near horizon
    var sunX = CANVAS_W * 0.5;
    var sunY = GROUND_Y - 40;
    var sunGrad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 120);
    sunGrad.addColorStop(0, 'rgba(255,240,180,0.9)');
    sunGrad.addColorStop(0.3, 'rgba(255,180,60,0.5)');
    sunGrad.addColorStop(1, 'rgba(255,100,30,0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, GROUND_Y - 160, CANVAS_W, 160);

    // Clouds
    drawCloud(100, 60, 120, 35, 'rgba(180,100,60,0.3)');
    drawCloud(400, 40, 180, 40, 'rgba(200,120,80,0.25)');
    drawCloud(700, 80, 140, 30, 'rgba(160,80,50,0.3)');
    drawCloud(850, 30, 100, 25, 'rgba(180,90,60,0.2)');

    // Distant mountains — layered silhouettes
    ctx.fillStyle = '#3a1828';
    drawMountainRange(0, GROUND_Y, [100, 250, 180, 320, 200, 400, 150, 500, 280, 650, 200, 800, 250, 950], 160);
    ctx.fillStyle = '#4a2030';
    drawMountainRange(30, GROUND_Y, [80, 180, 150, 350, 170, 500, 130, 700, 190, 880], 120);
    ctx.fillStyle = '#5a2838';
    drawMountainRange(60, GROUND_Y, [60, 150, 120, 400, 100, 600, 140, 850], 80);

    // War banners
    drawWarBanner(120, GROUND_Y - 140, '#cc2222', '蜀');
    drawWarBanner(880, GROUND_Y - 130, '#4444cc', '魏');

    // Scattered weapons on ground
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    for (var i = 0; i < 6; i++) {
      var wx = 50 + i * 170;
      ctx.beginPath();
      ctx.moveTo(wx, GROUND_Y - 2);
      ctx.lineTo(wx + 15, GROUND_Y - 20 - Math.random() * 10);
      ctx.stroke();
    }

    updateBgParticles();

    // Ground — dusty battlefield
    var groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
    groundGrad.addColorStop(0, '#8a7a5a');
    groundGrad.addColorStop(0.3, '#6a5a3e');
    groundGrad.addColorStop(1, '#3e2e18');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    // Ground line
    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.stroke();

    // Ground detail — cracks and texture
    ctx.strokeStyle = 'rgba(140, 120, 80, 0.4)';
    ctx.lineWidth = 1;
    for (var i2 = 0; i2 < 12; i2++) {
      var y2 = GROUND_Y + 8 + i2 * 7;
      ctx.beginPath();
      ctx.moveTo(0, y2);
      ctx.lineTo(CANVAS_W, y2 + Math.sin(i2) * 2);
      ctx.stroke();
    }
  }

  // Stage 1: Imperial Palace — 皇宮
  function drawStage_ImperialPalace() {
    // Night sky
    var grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(0.4, '#1a1a4a');
    grad.addColorStop(0.7, '#2a2040');
    grad.addColorStop(1, '#3a2a30');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    // Moon
    ctx.save();
    ctx.fillStyle = '#ffffdd';
    ctx.beginPath();
    ctx.arc(CANVAS_W * 0.82, 70, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#ffffaa';
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.restore();

    // Moon glow
    var moonGrad = ctx.createRadialGradient(CANVAS_W * 0.82, 70, 30, CANVAS_W * 0.82, 70, 150);
    moonGrad.addColorStop(0, 'rgba(255,255,200,0.15)');
    moonGrad.addColorStop(1, 'rgba(255,255,200,0)');
    ctx.fillStyle = moonGrad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    // Stars
    ctx.fillStyle = '#fff';
    var starSeed = [120,30, 200,80, 350,20, 450,60, 550,40, 680,15, 750,70, 850,50, 950,25, 160,100, 400,90, 600,75];
    for (var i = 0; i < starSeed.length; i += 2) {
      ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.003 + i) * 0.3;
      ctx.beginPath();
      ctx.arc(starSeed[i], starSeed[i+1], 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Palace building background
    drawPalaceBuilding(CANVAS_W * 0.5, GROUND_Y, 500, 200);

    // Palace pillars
    ctx.fillStyle = '#882222';
    ctx.fillRect(80, GROUND_Y - 200, 25, 200);
    ctx.fillRect(920, GROUND_Y - 200, 25, 200);
    ctx.fillRect(200, GROUND_Y - 180, 20, 180);
    ctx.fillRect(805, GROUND_Y - 180, 20, 180);

    // Lanterns
    drawLantern(92, GROUND_Y - 210, '#ff4444');
    drawLantern(932, GROUND_Y - 210, '#ff4444');
    drawLantern(CANVAS_W * 0.35, GROUND_Y - 160, '#ffaa00');
    drawLantern(CANVAS_W * 0.65, GROUND_Y - 160, '#ffaa00');

    updateBgParticles();

    // Palace floor — polished stone
    var floorGrad = ctx.createLinearGradient(0, GROUND_Y, 0, CANVAS_H);
    floorGrad.addColorStop(0, '#5a4a3a');
    floorGrad.addColorStop(0.5, '#4a3a2a');
    floorGrad.addColorStop(1, '#3a2a1a');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);

    // Floor tiles
    ctx.strokeStyle = 'rgba(201, 168, 76, 0.3)';
    ctx.lineWidth = 1;
    for (var t = 0; t < CANVAS_W; t += 64) {
      ctx.beginPath();
      ctx.moveTo(t, GROUND_Y);
      ctx.lineTo(t, CANVAS_H);
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

  // Stage 2: Red Cliff — 赤壁
  function drawStage_RedCliff() {
    // Fiery sky
    var grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#1a0a0a');
    grad.addColorStop(0.2, '#3a1010');
    grad.addColorStop(0.5, '#6a2010');
    grad.addColorStop(0.7, '#8a3020');
    grad.addColorStop(1, '#c04020');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    // Fire glow from below
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

    // Cliff silhouettes
    ctx.fillStyle = '#2a0808';
    drawCliff(0, GROUND_Y, 200, 300);
    drawCliff(830, GROUND_Y, 200, 260);

    // Burning ships in background
    drawBurningShip(300, GROUND_Y - 50, 80, '#aa3300');
    drawBurningShip(550, GROUND_Y - 40, 60, '#993300');
    drawBurningShip(700, GROUND_Y - 55, 70, '#884422');

    // Fire particles (ember style)
    for (var fi = 0; fi < 15; fi++) {
      var fx = (Date.now() * 0.03 + fi * 80) % CANVAS_W;
      var fy = GROUND_Y - 20 - Math.sin(Date.now() * 0.002 + fi) * 80 - fi * 15;
      ctx.globalAlpha = 0.4 + Math.random() * 0.3;
      ctx.fillStyle = fi % 3 === 0 ? '#ff4400' : (fi % 3 === 1 ? '#ffaa00' : '#ff6600');
      ctx.beginPath();
      ctx.arc(fx, fy, 2 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    updateBgParticles();

    // Cliff ground
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

    ctx.strokeStyle = 'rgba(140, 80, 40, 0.4)';
    ctx.lineWidth = 1;
    for (var i3 = 0; i3 < 10; i3++) {
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y + 10 + i3 * 8);
      ctx.lineTo(CANVAS_W, GROUND_Y + 10 + i3 * 8);
      ctx.stroke();
    }
  }

  // Stage 3: Bamboo Forest — 竹林
  function drawStage_BambooForest() {
    // Misty green sky
    var grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#0a1a10');
    grad.addColorStop(0.3, '#1a3a20');
    grad.addColorStop(0.6, '#2a4a30');
    grad.addColorStop(1, '#3a5a38');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    // Misty fog layers
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#aaccaa';
    ctx.fillRect(0, GROUND_Y - 100, CANVAS_W, 80);
    ctx.globalAlpha = 0.1;
    ctx.fillRect(0, GROUND_Y - 180, CANVAS_W, 60);
    ctx.globalAlpha = 1;

    // Bamboo stalks
    for (var bi = 0; bi < 20; bi++) {
      var bx = bi * 55 + 10;
      var bh = 250 + Math.sin(bi * 1.5) * 80;
      var sway = Math.sin(Date.now() * 0.001 + bi * 0.5) * 3;

      // Stalk
      ctx.strokeStyle = bi % 3 === 0 ? '#2a6a30' : (bi % 3 === 1 ? '#3a7a40' : '#4a8a50');
      ctx.lineWidth = 8 - (bi % 3);
      ctx.beginPath();
      ctx.moveTo(bx, GROUND_Y);
      ctx.quadraticCurveTo(bx + sway, GROUND_Y - bh / 2, bx + sway * 2, GROUND_Y - bh);
      ctx.stroke();

      // Bamboo nodes
      ctx.strokeStyle = '#5a9a5a';
      ctx.lineWidth = 2;
      for (var node = 1; node < 5; node++) {
        var ny = GROUND_Y - (bh / 5) * node;
        ctx.beginPath();
        ctx.moveTo(bx - 5 + sway * (node / 5), ny);
        ctx.lineTo(bx + 5 + sway * (node / 5), ny);
        ctx.stroke();
      }

      // Leaves (only some bamboo)
      if (bi % 2 === 0) {
        ctx.fillStyle = 'rgba(80,160,80,0.6)';
        var leafY = GROUND_Y - bh + 20;
        var leafX = bx + sway * 2;
        for (var lf = 0; lf < 3; lf++) {
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

    // Sunlight rays through bamboo
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

    updateBgParticles();

    // Forest floor
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

  // Stage 4: Ancient Bridge — 古橋
  function drawStage_AncientBridge() {
    // Dawn sky
    var grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, '#1a2a4a');
    grad.addColorStop(0.3, '#3a4a6a');
    grad.addColorStop(0.6, '#6a7a9a');
    grad.addColorStop(0.85, '#c4a878');
    grad.addColorStop(1, '#e8c888');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);

    // Clouds
    drawCloud(150, 50, 200, 40, 'rgba(200,180,160,0.35)');
    drawCloud(500, 30, 250, 50, 'rgba(220,200,180,0.3)');
    drawCloud(800, 70, 160, 35, 'rgba(190,170,150,0.3)');

    // Distant mountains
    ctx.fillStyle = '#5a6a7a';
    drawMountainRange(0, GROUND_Y, [150, 200, 120, 400, 180, 600, 140, 800, 160, 950], 120);
    ctx.fillStyle = '#6a7a8a';
    drawMountainRange(50, GROUND_Y, [100, 300, 130, 550, 100, 750], 80);

    // Water below bridge
    ctx.fillStyle = 'rgba(40,80,120,0.5)';
    ctx.fillRect(0, GROUND_Y + 10, CANVAS_W, CANVAS_H - GROUND_Y - 10);

    // Water reflection
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#88aacc';
    for (var wr = 0; wr < 8; wr++) {
      var wrY = GROUND_Y + 15 + wr * 10;
      var wrW = 60 + Math.sin(Date.now() * 0.001 + wr) * 20;
      ctx.fillRect(100 + wr * 120, wrY, wrW, 3);
    }
    ctx.globalAlpha = 1;

    // Bridge structure
    ctx.fillStyle = '#6a5a4a';
    ctx.fillRect(0, GROUND_Y - 5, CANVAS_W, 20); // Bridge deck

    // Bridge railings
    ctx.fillStyle = '#5a4a3a';
    for (var br = 0; br < CANVAS_W; br += 80) {
      ctx.fillRect(br + 10, GROUND_Y - 40, 8, 40); // Posts
    }
    ctx.fillRect(0, GROUND_Y - 42, CANVAS_W, 6); // Top rail

    // Bridge arch underneath
    ctx.strokeStyle = '#4a3a2a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(CANVAS_W * 0.3, GROUND_Y + 60, 120, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(CANVAS_W * 0.7, GROUND_Y + 60, 120, Math.PI, 0);
    ctx.stroke();

    updateBgParticles();

    // Bridge surface
    ctx.strokeStyle = '#8a7a5a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_W, GROUND_Y);
    ctx.stroke();

    // Wood planks
    ctx.strokeStyle = 'rgba(100,80,60,0.3)';
    ctx.lineWidth = 1;
    for (var pl = 0; pl < CANVAS_W; pl += 16) {
      ctx.beginPath();
      ctx.moveTo(pl, GROUND_Y);
      ctx.lineTo(pl, GROUND_Y + 15);
      ctx.stroke();
    }
  }

  // Helper: Draw cloud
  function drawCloud(x, y, w, h, color) {
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

  // Helper: Draw mountain range
  function drawMountainRange(baseX, baseY, peaks, maxH) {
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

  // Helper: Draw war banner
  function drawWarBanner(x, y, color, text) {
    // Pole
    ctx.fillStyle = '#8a7a5a';
    ctx.fillRect(x - 3, y, 6, 150);

    // Banner flag
    var sway = Math.sin(Date.now() * 0.003) * 5;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + 3, y);
    ctx.lineTo(x + 45 + sway, y + 10);
    ctx.lineTo(x + 40 + sway, y + 70);
    ctx.lineTo(x + 3, y + 60);
    ctx.closePath();
    ctx.fill();

    // Text on banner
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + 22 + sway / 2, y + 42);
  }

  // Helper: Draw palace building
  function drawPalaceBuilding(centerX, baseY, width, height) {
    var x = centerX - width / 2;
    var y = baseY - height;

    // Main building body
    ctx.fillStyle = '#4a2a1a';
    ctx.fillRect(x + 30, y + 40, width - 60, height - 40);

    // Roof layers
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

      // Roof edge highlight
      ctx.strokeStyle = '#c9a84c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(roofX - 20, roofY + 35);
      ctx.quadraticCurveTo(centerX, roofY - 10, roofX + roofW + 20, roofY + 35);
      ctx.stroke();
    }

    // Windows / doors
    ctx.fillStyle = '#ffd700';
    ctx.globalAlpha = 0.4;
    ctx.fillRect(centerX - 20, baseY - 60, 40, 55);
    ctx.fillRect(centerX - 100, baseY - 50, 25, 30);
    ctx.fillRect(centerX + 75, baseY - 50, 25, 30);
    ctx.globalAlpha = 1;
  }

  // Helper: Draw lantern
  function drawLantern(x, y, color) {
    // String
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Lantern body
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.005) * 0.15;
    ctx.beginPath();
    ctx.ellipse(x, y + 12, 8, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner glow
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 4, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Helper: Draw cliff
  function drawCliff(x, baseY, w, h) {
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

  // Helper: Draw burning ship
  function drawBurningShip(x, y, size, color) {
    // Hull
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - size * 0.4, y + size * 0.3);
    ctx.lineTo(x + size, y + size * 0.3);
    ctx.lineTo(x + size * 1.2, y);
    ctx.closePath();
    ctx.fill();

    // Mast
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.4, y);
    ctx.lineTo(x + size * 0.4, y - size * 0.6);
    ctx.stroke();

    // Fire on ship
    var fireTime = Date.now() * 0.01;
    ctx.globalAlpha = 0.6;
    for (var f = 0; f < 3; f++) {
      ctx.fillStyle = f === 0 ? '#ff4400' : (f === 1 ? '#ffaa00' : '#ff6600');
      ctx.beginPath();
      var fh = size * 0.3 + Math.sin(fireTime + f * 2) * size * 0.15;
      ctx.ellipse(x + size * (0.2 + f * 0.3), y - fh * 0.5, size * 0.15, fh, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
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

  function spawnHitEffect(x, y, isSpecial) {
    var count = isSpecial ? 15 : 8;
    var colors = isSpecial ? ['#ffcc00', '#ff6600', '#ff0000', '#ffff00'] : ['#ffcc00', '#ff6600'];
    for (var i = 0; i < count; i++) {
      hitEffects.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * (isSpecial ? 12 : 8),
        vy: (Math.random() - 0.5) * (isSpecial ? 12 : 8),
        life: 15 + Math.floor(Math.random() * 10),
        maxLife: 25,
        r: Math.random() * (isSpecial ? 6 : 4) + 2,
        color: colors[Math.floor(Math.random() * colors.length)]
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
     Projectiles
     ======================================== */

  function spawnProjectile(owner, move) {
    var dir = owner.facingRight ? 1 : -1;
    var projX = owner.position.x + (owner.facingRight ? owner.width + 10 : -40);
    var projY = owner.position.y + owner.height * 0.3;
    var projDamage = move.damage * (owner._atkMultiplier || 1) * owner.buffMultiplier;
    // Note: defender's _defMultiplier is applied at hit time in updateProjectiles

    projectiles.push(new Projectile({
      x: projX,
      y: projY,
      vx: dir * 8,
      vy: 0,
      damage: Math.round(projDamage),
      color: move.color || '#ffcc00',
      owner: owner,
      width: 30,
      height: 15,
      life: 90
    }));
  }

  function updateProjectiles() {
    for (var i = projectiles.length - 1; i >= 0; i--) {
      var proj = projectiles[i];
      proj.update(ctx);

      if (!proj.active) {
        projectiles.splice(i, 1);
        continue;
      }

      // Check collision with fighters
      var target = proj.owner === player1 ? player2 : player1;
      if (target && !target.dead) {
        var projRect = {
          position: proj.position,
          width: proj.width,
          height: proj.height
        };
        var targetRect = {
          position: target.position,
          width: target.width,
          height: target.height
        };
        if (rectanglesOverlap(projRect, targetRect)) {
          var knockDir = proj.vx > 0 ? 1 : -1;
          var adjustedDamage = Math.round(proj.damage * (target._defMultiplier || 1));
          if (adjustedDamage < 1) adjustedDamage = 1;
          target.takeHit(adjustedDamage, knockDir * 8);
          spawnHitEffect(target.position.x + target.width / 2, target.position.y + target.height * 0.3, true);

          // Attacker gains energy
          proj.owner.energy += ENERGY_GAIN_HIT;
          if (proj.owner.energy > proj.owner.maxEnergy) proj.owner.energy = proj.owner.maxEnergy;

          proj.active = false;
        }
      }
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

    // Handle projectile-type special moves — spawn projectile instead of melee
    if (attacker.isUsingSpecial && attacker.currentSpecialMove &&
        attacker.currentSpecialMove.type === MOVE_TYPE.PROJECTILE &&
        attacker.attackFrame === 5) { // spawn on frame 5
      spawnProjectile(attacker, attacker.currentSpecialMove);
      attacker.hasHitThisSwing = true;
      return;
    }

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

      var baseDamage, knockForce;
      if (attacker.isUsingSpecial && attacker.currentSpecialMove) {
        var move = attacker.currentSpecialMove;
        var moveHits = move.hits || 1;
        baseDamage = move.damage / moveHits;
        knockForce = attacker.isUsingUltimate ? 15 : 8;
      } else {
        baseDamage = attacker.attackType === 1 ? LIGHT_ATTACK_DAMAGE : HEAVY_ATTACK_DAMAGE;
        knockForce = attacker.attackType === 1 ? LIGHT_ATTACK_KNOCKBACK : HEAVY_ATTACK_KNOCKBACK;
      }

      var damage = baseDamage * (attacker._atkMultiplier || 1) * (defender._defMultiplier || 1) * attacker.buffMultiplier;
      damage = Math.round(damage);
      if (damage < 1) damage = 1;

      var knockDir = attacker.facingRight ? 1 : -1;
      defender.takeHit(damage, knockDir * knockForce);

      // Attacker gains energy
      attacker.energy += ENERGY_GAIN_HIT;
      if (attacker.energy > attacker.maxEnergy) attacker.energy = attacker.maxEnergy;

      spawnHitEffect(
        defender.position.x + defender.width / 2,
        defender.position.y + defender.height * 0.3,
        attacker.isUsingSpecial
      );

      // Floating damage number
      hitEffects.push({
        x: defender.position.x + defender.width / 2,
        y: defender.position.y - 10,
        vx: 0,
        vy: -2,
        life: 40,
        maxLife: 40,
        r: 0,
        color: '#fff',
        isDamageNumber: true,
        damageText: String(damage)
      });
    }
  }

  // Override drawHitEffects to handle damage numbers
  var _origDrawHitEffects = drawHitEffects;
  drawHitEffects = function () {
    for (var i = hitEffects.length - 1; i >= 0; i--) {
      var h = hitEffects[i];
      if (h.isDamageNumber) {
        h.x += h.vx;
        h.y += h.vy;
        h.life--;
        if (h.life <= 0) {
          hitEffects.splice(i, 1);
          continue;
        }
        var alpha = Math.min(1, h.life / h.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('-' + h.damageText, h.x, h.y);
        ctx.restore();
      } else {
        h.x += h.vx;
        h.y += h.vy;
        h.vy += 0.3;
        h.life--;
        if (h.life <= 0) {
          hitEffects.splice(i, 1);
          continue;
        }
        var alpha2 = Math.min(1, h.life / h.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha2;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2);
        ctx.fillStyle = h.color;
        ctx.fill();
        ctx.restore();
      }
    }
  };

  /* ========================================
     End Round
     ======================================== */

  function endRound() {
    if (!gameRunning) return;
    stopGame();

    var result = '';
    var p1Won = false;
    if (player1.dead && player2.dead) {
      result = '平手！ TIE!';
    } else if (player1.dead) {
      result = p2Char.name + ' 獲勝！';
    } else if (player2.dead) {
      result = p1Char.name + ' 獲勝！';
      p1Won = true;
    } else {
      if (player1.health > player2.health) {
        result = p1Char.name + ' 獲勝！';
        p1Won = true;
      } else if (player2.health > player1.health) {
        result = p2Char.name + ' 獲勝！';
      } else {
        result = '平手！ TIE!';
      }
    }

    resultText.textContent = result;

    // In story mode, update button text
    if (gameMode === 'story') {
      if (p1Won) {
        btnRestart.textContent = '繼續 →';
      } else {
        btnRestart.textContent = '再試一次';
        // Keep storyBattleIndex unchanged so the player retries the same battle
      }
    } else {
      btnRestart.textContent = '再來一局';
    }

    roundResult.classList.remove('hidden');
  }

  /* ========================================
     CPU AI (Enhanced)
     ======================================== */

  function cpuAI(cpu, target) {
    if (cpu.dead || cpu.hitstun > 0) return;

    var dx = target.position.x - cpu.position.x;
    var dist = Math.abs(dx);

    cpu.keys.left = false;
    cpu.keys.right = false;
    cpu.keys.jump = false;
    cpu.keys.charge = false;
    cpu.keys.block = false;

    var attackRange = cpu.attackBox.width + cpu.width * 0.5;

    // CPU blocking logic
    if (target.isAttacking && dist < attackRange + 60) {
      if (Math.random() < 0.4) {
        // Block: hold back + down
        if (dx > 0) cpu.keys.left = true;
        else cpu.keys.right = true;
        cpu.keys.block = true;
        return;
      }
    }

    // CPU charging logic - charge when far away
    if (dist > 300 && cpu.energy < cpu.maxEnergy * 0.8 && Math.random() < 0.15) {
      cpu.keys.charge = true;
      return;
    }

    // Movement
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

    // CPU special move logic
    if (!cpu.isSoldier && cpu.charData && cpu.charData.moves && dist < attackRange + 50) {
      // Try ultimate if energy is full
      if (cpu.energy >= MAX_ENERGY && cpu.charData.ultimate && Math.random() < 0.05) {
        cpu.keys.attack1 = true;
        cpu.keys.attack2 = true;
        // Simulate command input
        cpu.inputBuffer = ['D', 'DF', 'F', 'D', 'DF', 'F'];
        cpu.inputBufferTimer = 10;
        return;
      }

      // Try special moves
      if (Math.random() < 0.06) {
        var availableMoves = cpu.charData.moves.filter(function (m) { return cpu.energy >= m.energyCost; });
        if (availableMoves.length > 0) {
          var move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
          cpu.inputBuffer = move.command.slice();
          cpu.inputBufferTimer = 10;
          cpu.keys.attack1 = true;
          return;
        }
      }
    }

    // Basic attacks
    if (dist < attackRange + 20 && cpu.attackCooldown <= 0 && !cpu.isAttacking) {
      if (Math.random() < 0.12) {
        cpu.keys.attack1 = true;
      } else if (Math.random() < 0.04) {
        cpu.keys.attack2 = true;
      }
    }

    // Dodge
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
      case 'u':
        e.preventDefault();
        player1.keys.attack1 = true;
        break;
      case 'i':
        e.preventDefault();
        player1.keys.attack2 = true;
        break;
      case 's':
        player1.keys.block = true;
        break;
      case 'e':
        player1.keys.charge = true;
        break;
    }

    if (gameMode === 'pvp') {
      switch (e.key) {
        case 'ArrowLeft': player2.keys.left = true; e.preventDefault(); break;
        case 'ArrowRight': player2.keys.right = true; e.preventDefault(); break;
        case 'ArrowUp': player2.keys.jump = true; e.preventDefault(); break;
        case 'Enter': player2.keys.attack1 = true; e.preventDefault(); break;
        case '/': player2.keys.attack2 = true; e.preventDefault(); break;
        case 'ArrowDown': player2.keys.block = true; e.preventDefault(); break;
        case '.': player2.keys.charge = true; e.preventDefault(); break;
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
      case 's': player1.keys.block = false; break;
      case 'e': player1.keys.charge = false; break;
      case 'u': player1.keys.attack1 = false; break;
      case 'i': player1.keys.attack2 = false; break;
    }

    if (gameMode === 'pvp') {
      switch (e.key) {
        case 'ArrowLeft': player2.keys.left = false; break;
        case 'ArrowRight': player2.keys.right = false; break;
        case 'ArrowUp': player2.keys.jump = false; break;
        case 'ArrowDown': player2.keys.block = false; break;
        case '.': player2.keys.charge = false; break;
      }
    }
  });

  /* ========================================
     Init
     ======================================== */
  initStorySelect();

})();
