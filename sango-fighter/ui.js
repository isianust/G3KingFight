(function () {
  function $(id) { return document.getElementById(id); }
  function showElement(el) { if (el) el.classList.remove('hidden'); }
  function hideElement(el) { if (el) el.classList.add('hidden'); }
  function clearElement(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }
  function createEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function factionColor(faction) {
    return (window.FACTION_DATA && window.FACTION_DATA[faction] && window.FACTION_DATA[faction].color) || '#c9a84c';
  }
  function commandToString(command) {
    var map = { D: '↓', DF: '↘', F: '→', DB: '↙', B: '←', U: '↑', D_HOLD: '↓(蓄)', U_HOLD: '↑(蓄)', B_HOLD: '←(蓄)', F_HOLD: '→(蓄)' };
    return (command || []).map(function (part) { return map[part] || part; }).join(' ');
  }
  function createStatBar(label, value, color) {
    var wrap = createEl('div');
    wrap.style.display = 'flex';
    wrap.style.alignItems = 'center';
    wrap.style.gap = '4px';
    wrap.style.width = '100%';
    var text = createEl('span', null, label);
    text.style.fontSize = '10px';
    text.style.minWidth = '28px';
    var barBg = createEl('div');
    barBg.style.flex = '1';
    barBg.style.height = '8px';
    barBg.style.background = '#222';
    barBg.style.border = '1px solid rgba(255,255,255,0.15)';
    barBg.style.borderRadius = '999px';
    var fill = createEl('div');
    fill.style.width = Math.max(10, Math.min(100, value * 10)) + '%';
    fill.style.height = '100%';
    fill.style.borderRadius = '999px';
    fill.style.background = color;
    barBg.appendChild(fill);
    wrap.appendChild(text);
    wrap.appendChild(barBg);
    return wrap;
  }
  function createPortrait(charData, size) {
    size = size || 64;
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    var ctx = canvas.getContext('2d');
    var color = (charData && charData.color) || '#666';
    var grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, color);
    grad.addColorStop(1, '#111');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(size * 0.12, size * 0.1, size * 0.76, size * 0.28);
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.34, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(size * 0.3, size * 0.5, size * 0.4, size * 0.28);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + Math.round(size * 0.15) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((charData && charData.name ? charData.name.charAt(0) : '?'), size / 2, size * 0.86);
    return canvas;
  }

  function CharacterSelect(containerElement, onSelect, mode) {
    this.container = containerElement;
    this.onSelect = onSelect || function () {};
    this.mode = mode || 'pvp';
    this.availableHeroes = null;
    this.gridItems = [];
    this.cursorIndex = 0;
    this.selectingFor = 1;
    this.p1Char = null;
    this.p2Char = null;
    this.lastFocusedChar = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.visible = false;
  }

  CharacterSelect.prototype.show = function (options) {
    options = options || {};
    this.mode = options.mode || this.mode || 'pvp';
    this.availableHeroes = options.availableHeroes || null;
    this.onSelect = options.onSelect || this.onSelect;
    this.selectingFor = 1;
    this.p1Char = null;
    this.p2Char = null;
    this.cursorIndex = 0;
    this.render();
    showElement(this.container);
    this.visible = true;
    window.addEventListener('keydown', this.handleKeyDown);
    this.focusCard(0);
  };

  CharacterSelect.prototype.hide = function () {
    hideElement(this.container);
    this.visible = false;
    window.removeEventListener('keydown', this.handleKeyDown);
  };

  CharacterSelect.prototype.getRoster = function () {
    var roster = (window.CHARACTER_ROSTER || []).slice();
    if (this.mode === 'story' && this.availableHeroes && this.availableHeroes.length) {
      roster = roster.filter(function (charData) { return this.availableHeroes.indexOf(charData.id) >= 0; }.bind(this));
    }
    return roster;
  };

  CharacterSelect.prototype.render = function () {
    clearElement(this.container);
    var root = createEl('div');
    root.id = 'charSelectScreen';
    root.className = 'screen';
    this.container.appendChild(root);

    root.appendChild(createEl('h1', 'title', this.mode === 'story' ? '故事模式選角' : '角色選擇'));
    root.appendChild(createEl('h2', 'subtitle', this.mode === 'story' ? '選擇出征武將' : 'Arrow Keys / Click / Enter'));

    var panel = createEl('div');
    panel.id = 'charSelectPanel';
    root.appendChild(panel);

    this.selectLabel = createEl('div');
    this.selectLabel.id = 'selectLabel';
    this.selectLabel.textContent = this.mode === 'story' ? '選擇故事主角' : 'P1 選擇角色';
    panel.appendChild(this.selectLabel);

    var selectedDisplay = createEl('div');
    selectedDisplay.id = 'selectedDisplay';
    panel.appendChild(selectedDisplay);

    this.p1Box = this.createSelectedBox('P1');
    this.p2Box = this.createSelectedBox(this.mode === 'story' ? '故事' : 'P2');
    selectedDisplay.appendChild(this.p1Box.wrap);
    if (this.mode !== 'story') selectedDisplay.appendChild(createEl('span', 'vs-text', 'VS'));
    selectedDisplay.appendChild(this.p2Box.wrap);

    this.infoPanel = createEl('div', 'movelist-character');
    this.infoPanel.style.width = 'min(900px, 95%)';
    this.infoPanel.style.marginBottom = '8px';
    panel.appendChild(this.infoPanel);

    this.charGrid = createEl('div', 'char-grid');
    this.charGrid.id = 'charGrid';
    panel.appendChild(this.charGrid);

    var controls = createEl('div', 'controls-info');
    controls.appendChild(this.makeControlsColumn('選角操作', [
      '← ↑ ↓ → / WASD：移動游標',
      'Enter：確認角色',
      '點擊角色卡：直接選擇',
      this.mode === 'story' ? '只顯示戰役可用武將' : 'P1 / P2 依序選角'
    ]));
    panel.appendChild(controls);

    this.confirmButton = createEl('button', 'fight-btn hidden', this.mode === 'story' ? '開始戰役' : '進入場景選擇');
    this.confirmButton.addEventListener('click', this.confirmSelection.bind(this));
    panel.appendChild(this.confirmButton);

    this.renderGrid();
  };

  CharacterSelect.prototype.createSelectedBox = function (label) {
    var wrap = createEl('div', 'selected-char');
    var portrait = createEl('div', 'portrait-placeholder', label);
    var name = createEl('span', null, '---');
    var info = createEl('div', 'char-info');
    wrap.appendChild(portrait);
    wrap.appendChild(name);
    wrap.appendChild(info);
    return { wrap: wrap, portrait: portrait, name: name, info: info };
  };

  CharacterSelect.prototype.makeControlsColumn = function (title, lines) {
    var col = createEl('div', 'controls-column');
    col.appendChild(createEl('h4', null, title));
    lines.forEach(function (line) { col.appendChild(createEl('div', null, line)); });
    return col;
  };

  CharacterSelect.prototype.renderGrid = function () {
    clearElement(this.charGrid);
    this.gridItems = [];
    var roster = this.getRoster();
    var factions = ['蜀漢', '曹魏', '孫吳', '群雄'];
    var grouped = {};
    roster.forEach(function (charData) {
      if (!grouped[charData.faction]) grouped[charData.faction] = [];
      grouped[charData.faction].push(charData);
    });

    var self = this;
    factions.forEach(function (faction) {
      if (!grouped[faction] || !grouped[faction].length) return;
      var label = createEl('div', 'faction-label', faction);
      label.style.color = factionColor(faction);
      self.charGrid.appendChild(label);
      grouped[faction].forEach(function (charData) {
        var card = createEl('div', 'char-cell');
        card.style.width = '150px';
        card.style.height = 'auto';
        card.style.padding = '8px';
        card.style.alignItems = 'stretch';
        card.dataset.index = String(self.gridItems.length);
        card.appendChild(createPortrait(charData, 56));
        var name = createEl('strong', null, charData.name);
        name.style.fontSize = '14px';
        name.style.textAlign = 'center';
        card.appendChild(name);
        card.appendChild(createEl('span', 'faction', charData.nameEn));
        card.appendChild(createStatBar('ATK', charData.stats.atk, '#ff6666'));
        card.appendChild(createStatBar('DEF', charData.stats.def, '#66ccff'));
        card.appendChild(createStatBar('SPD', charData.stats.spd, '#66ff99'));
        card.addEventListener('mouseenter', function () { self.focusCard(Number(card.dataset.index)); });
        card.addEventListener('click', function () { self.cursorIndex = Number(card.dataset.index); self.focusCard(self.cursorIndex); self.selectCurrent(); });
        self.charGrid.appendChild(card);
        self.gridItems.push({ charData: charData, element: card });
      });
    });

    if (this.gridItems.length) this.previewCharacter(this.gridItems[0].charData, 0);
  };

  CharacterSelect.prototype.previewCharacter = function (charData) {
    this.lastFocusedChar = charData;
    clearElement(this.infoPanel);
    var title = createEl('h3', null, charData.name + ' (' + charData.nameEn + ')');
    title.style.color = charData.color;
    this.infoPanel.appendChild(title);
    this.infoPanel.appendChild(createEl('div', 'movelist-stats', '勢力：' + charData.faction + '　武器：' + (charData.weapon || '—')));
    var movesWrap = createEl('div', 'char-moves');
    (charData.moves || []).forEach(function (move) {
      movesWrap.appendChild(createEl('span', 'move-tag', move.name + ' ' + commandToString(move.command) + '+攻'));
    });
    if (charData.ultimate) movesWrap.appendChild(createEl('span', 'move-tag ultimate-tag', '★ ' + charData.ultimate.name + ' 滿氣'));
    this.infoPanel.appendChild(movesWrap);
  };

  CharacterSelect.prototype.focusCard = function (index) {
    if (!this.gridItems.length) return;
    if (index < 0) index = this.gridItems.length - 1;
    if (index >= this.gridItems.length) index = 0;
    this.cursorIndex = index;
    this.gridItems.forEach(function (item, i) {
      item.element.style.outline = i === index ? '2px solid #ffd700' : 'none';
      item.element.style.transform = i === index ? 'scale(1.03)' : '';
    });
    this.previewCharacter(this.gridItems[index].charData, index);
  };

  CharacterSelect.prototype.handleKeyDown = function (event) {
    if (!this.visible) return;
    var key = event.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's', 'A', 'D', 'W', 'S', 'Enter'].indexOf(key) >= 0) {
      event.preventDefault();
    }
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') this.focusCard(this.cursorIndex - 1);
    if (key === 'ArrowRight' || key === 'd' || key === 'D') this.focusCard(this.cursorIndex + 1);
    if (key === 'ArrowUp' || key === 'w' || key === 'W') this.focusCard(this.cursorIndex - 4);
    if (key === 'ArrowDown' || key === 's' || key === 'S') this.focusCard(this.cursorIndex + 4);
    if (key === 'Enter') this.selectCurrent();
  };

  CharacterSelect.prototype.selectCurrent = function () {
    if (!this.gridItems.length) return;
    var charData = this.gridItems[this.cursorIndex].charData;
    var selectedClass = this.selectingFor === 1 ? 'selected-p1' : 'selected-p2';
    this.gridItems.forEach(function (item) { item.element.classList.remove('selected-p1', 'selected-p2'); });
    this.gridItems[this.cursorIndex].element.classList.add(selectedClass);

    if (this.selectingFor === 1) {
      this.p1Char = charData;
      this.fillSelectedBox(this.p1Box, charData);
      if (this.mode === 'pvcpu') {
        var pool = this.getRoster().filter(function (item) { return item.id !== charData.id; });
        this.p2Char = pool[Math.floor(Math.random() * pool.length)] || this.getRoster()[0];
        this.fillSelectedBox(this.p2Box, this.p2Char);
        showElement(this.confirmButton);
      } else if (this.mode === 'story') {
        this.fillSelectedBox(this.p2Box, charData, true);
        showElement(this.confirmButton);
      } else {
        this.selectingFor = 2;
        this.selectLabel.textContent = 'P2 選擇角色';
      }
    } else {
      this.p2Char = charData;
      this.fillSelectedBox(this.p2Box, charData);
      showElement(this.confirmButton);
    }
  };

  CharacterSelect.prototype.fillSelectedBox = function (box, charData, mirror) {
    clearElement(box.portrait);
    box.portrait.style.background = 'transparent';
    box.portrait.appendChild(createPortrait(charData, 64));
    if (mirror) box.name.textContent = charData.name + ' / Hero';
    else box.name.textContent = charData.name;
    box.info.innerHTML = '<strong>' + charData.weapon + '</strong><br>' + charData.faction + '<br>ATK ' + charData.stats.atk + ' / DEF ' + charData.stats.def + ' / SPD ' + charData.stats.spd;
  };

  CharacterSelect.prototype.confirmSelection = function () {
    if (!this.p1Char) return;
    if (this.mode !== 'story' && !this.p2Char) return;
    this.hide();
    this.onSelect({ mode: this.mode, p1Char: this.p1Char, p2Char: this.p2Char });
  };

  function BattleUI() {
    this.showMiniMoves = false;
    this.announcement = null;
  }

  BattleUI.prototype.showRoundResult = function (result) {
    this.announcement = { text: result, subtext: '', timer: 120 };
  };

  BattleUI.prototype.showMatchResult = function (winner) {
    this.announcement = { text: winner, subtext: 'Press Enter / 攻擊 繼續', timer: 999999 };
  };

  BattleUI.prototype.toggleMiniMoveList = function () {
    this.showMiniMoves = !this.showMiniMoves;
  };

  BattleUI.prototype.drawBar = function (ctx, x, y, w, h, ratio, gradStops, alignRight) {
    ctx.save();
    ctx.fillStyle = 'rgba(20,20,30,0.85)';
    ctx.strokeStyle = '#c9a84c';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    var innerW = Math.max(0, Math.min(w - 4, (w - 4) * ratio));
    var start = alignRight ? x + w - 2 - innerW : x + 2;
    var grad = ctx.createLinearGradient(start, y, start + innerW, y);
    gradStops.forEach(function (stop) { grad.addColorStop(stop[0], stop[1]); });
    ctx.fillStyle = grad;
    ctx.fillRect(start, y + 2, innerW, h - 4);
    ctx.restore();
  };

  BattleUI.prototype.drawHUD = function (ctx, p1, p2, timer, roundInfo) {
    if (!p1 || !p2) return;
    var p1Ratio = p1.health / p1.maxHealth;
    var p2Ratio = p2.health / p2.maxHealth;
    var p1Faction = factionColor(p1.charData && p1.charData.faction);
    var p2Faction = factionColor(p2.charData && p2.charData.faction);

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, 1024, 84);

    var p1HealthStops = [[0, p1Ratio > 0.5 ? p1Faction : p1Ratio > 0.25 ? '#ffaa33' : '#ff4444'], [1, '#ffffff']];
    var p2HealthStops = [[0, '#ffffff'], [1, p2Ratio > 0.5 ? p2Faction : p2Ratio > 0.25 ? '#ffaa33' : '#ff4444']];
    this.drawBar(ctx, 72, 16, 360, 24, p1Ratio, p1HealthStops, false);
    this.drawBar(ctx, 592, 16, 360, 24, p2Ratio, p2HealthStops, true);
    this.drawBar(ctx, 72, 46, 360, 10, p1.energy / p1.maxEnergy, [[0, '#0088ff'], [p1.energy >= p1.maxEnergy ? 0.7 : 1, p1.energy >= p1.maxEnergy ? '#ffdd00' : '#00ccff']], false);
    this.drawBar(ctx, 592, 46, 360, 10, p2.energy / p2.maxEnergy, [[0, p2.energy >= p2.maxEnergy ? '#ffdd00' : '#00ccff'], [1, '#0088ff']], true);
    this.drawBar(ctx, 72, 62, 360, 8, p1.knockdownBar / p1.knockdownBarMax, [[0, '#ff8800'], [1, '#ffdd55']], false);
    this.drawBar(ctx, 592, 62, 360, 8, p2.knockdownBar / p2.knockdownBarMax, [[0, '#ffdd55'], [1, '#ff8800']], true);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText((p1.charData && p1.charData.name) || 'P1', 72, 14);
    ctx.textAlign = 'right';
    ctx.fillText((p2.charData && p2.charData.name) || 'P2', 952, 14);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(String(timer), 512, 38);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Round ' + roundInfo.current + '/' + roundInfo.total, 512, 62);

    if (this.announcement) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 180, 1024, 150);
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 56px sans-serif';
      ctx.fillText(this.announcement.text, 512, 245);
      if (this.announcement.subtext) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px sans-serif';
        ctx.fillText(this.announcement.subtext, 512, 285);
      }
      if (this.announcement.timer < 999999) {
        this.announcement.timer -= 1;
        if (this.announcement.timer <= 0) this.announcement = null;
      }
    }

    if (this.showMiniMoves) this.drawMiniMoveList(ctx, p1);
    ctx.restore();
  };

  BattleUI.prototype.drawMiniMoveList = function (ctx, fighter) {
    if (!fighter || !fighter.charData) return;
    var x = 720, y = 94, w = 290;
    ctx.save();
    ctx.fillStyle = 'rgba(10,8,20,0.78)';
    ctx.fillRect(x, y, w, 150);
    ctx.strokeStyle = '#c9a84c';
    ctx.strokeRect(x, y, w, 150);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('招式表 - ' + fighter.charData.name, x + w / 2, y + 18);
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    var lineY = y + 40;
    (fighter.charData.moves || []).forEach(function (move) {
      ctx.fillStyle = move.color || '#fff';
      ctx.fillText(move.name, x + 10, lineY);
      ctx.fillStyle = '#ccc';
      ctx.fillText(commandToString(move.command) + ' + L', x + 120, lineY);
      lineY += 20;
    });
    if (fighter.charData.ultimate) {
      ctx.fillStyle = fighter.charData.ultimate.color || '#ffd700';
      ctx.fillText('★ ' + fighter.charData.ultimate.name, x + 10, lineY);
      ctx.fillStyle = '#ccc';
      ctx.fillText('滿氣 + U', x + 120, lineY);
    }
    ctx.restore();
  };

  function StoryMode(containerElement, onStartBattle, onComplete) {
    this.container = containerElement;
    this.onStartBattle = onStartBattle || function () {};
    this.onComplete = onComplete || function () {};
    this.onCampaignSelected = null;
    this.storyFaction = '';
    this.storyChapterIndex = 0;
    this.storyBattleIndex = 0;
    this.storyHeroChar = null;
    this.currentCampaign = null;
    this.currentBattle = null;
  }

  StoryMode.prototype.show = function () {
    this.renderCampaignSelect();
    showElement(this.container);
  };

  StoryMode.prototype.hide = function () {
    hideElement(this.container);
  };

  StoryMode.prototype.setCampaignSelectedCallback = function (callback) {
    this.onCampaignSelected = callback;
  };

  StoryMode.prototype.renderCampaignSelect = function () {
    clearElement(this.container);
    var root = createEl('div');
    root.id = 'storySelectScreen';
    root.className = 'screen';
    this.container.appendChild(root);
    root.appendChild(createEl('h1', 'title', '故事模式'));
    root.appendChild(createEl('h2', 'subtitle', '選擇勢力開始征途'));
    var campaigns = createEl('div', 'story-campaigns');
    root.appendChild(campaigns);
    var self = this;
    ['蜀漢', '曹魏', '孫吳'].forEach(function (factionKey) {
      var campaign = window.STORY_CAMPAIGNS && window.STORY_CAMPAIGNS[factionKey];
      if (!campaign) return;
      var card = createEl('div', 'story-card');
      card.style.borderColor = factionColor(factionKey);
      card.appendChild(createEl('h3', null, campaign.title));
      card.lastChild.style.color = factionColor(factionKey);
      card.appendChild(createEl('p', null, campaign.description));
      var button = createEl('button', 'mode-btn story-start-btn', '開始');
      button.addEventListener('click', function () { self.selectCampaign(factionKey); });
      card.appendChild(button);
      campaigns.appendChild(card);
    });
  };

  StoryMode.prototype.selectCampaign = function (factionKey) {
    this.storyFaction = factionKey;
    this.currentCampaign = window.STORY_CAMPAIGNS && window.STORY_CAMPAIGNS[factionKey];
    if (this.onCampaignSelected) this.onCampaignSelected(factionKey, this.currentCampaign);
  };

  StoryMode.prototype.setHero = function (hero) {
    this.storyHeroChar = hero;
  };

  StoryMode.prototype.showChapterMap = function () {
    if (!this.currentCampaign) return;
    clearElement(this.container);
    var overlay = createEl('div');
    overlay.id = 'storyMapOverlay';
    overlay.className = 'screen';
    this.container.appendChild(overlay);
    var inner = createEl('div', 'story-map-container');
    overlay.appendChild(inner);
    inner.appendChild(createEl('h2', 'story-map-title', this.currentCampaign.title + ' — ' + this.currentCampaign.titleEn));
    var content = createEl('div', 'story-map-content');
    inner.appendChild(content);
    for (var i = 0; i < this.currentCampaign.chapters.length; i++) {
      if (i > 0) {
        var connector = createEl('div', 'story-map-connector' + (i <= this.storyChapterIndex ? ' completed' : ''));
        content.appendChild(connector);
      }
      var state = i < this.storyChapterIndex ? 'completed' : i === this.storyChapterIndex ? 'current' : 'locked';
      var node = createEl('div', 'story-map-node ' + state);
      var circle = createEl('div', 'story-map-node-circle', i < this.storyChapterIndex ? '✓' : i === this.storyChapterIndex ? String(i + 1) : '🔒');
      var label = createEl('div', 'story-map-node-label', this.currentCampaign.chapters[i].title);
      node.appendChild(circle);
      node.appendChild(label);
      content.appendChild(node);
    }
    var button = createEl('button', 'mode-btn story-map-continue', '繼續 →');
    button.addEventListener('click', this.startChapter.bind(this, this.storyChapterIndex));
    inner.appendChild(button);
  };

  StoryMode.prototype.showDialog = function (dialogLines, onComplete) {
    var wrapper = $('dialog-box');
    clearElement(wrapper);
    var overlay = createEl('div', 'dialog-overlay');
    var box = createEl('div', 'dialog-box');
    var portrait = createEl('div', 'dialog-portrait');
    var content = createEl('div', 'dialog-content');
    var speaker = createEl('div', 'dialog-speaker');
    var text = createEl('div', 'dialog-text');
    var next = createEl('button', 'dialog-next-btn', '▶ 下一句');
    content.appendChild(speaker);
    content.appendChild(text);
    box.appendChild(portrait);
    box.appendChild(content);
    box.appendChild(next);
    overlay.appendChild(box);
    wrapper.appendChild(overlay);
    showElement(wrapper);

    var index = 0;
    var self = this;
    function renderLine() {
      if (index >= dialogLines.length) {
        hideElement(wrapper);
        clearElement(wrapper);
        if (onComplete) onComplete.call(self);
        return;
      }
      var line = dialogLines[index];
      speaker.textContent = line.speaker;
      text.textContent = line.text;
      var match = (window.CHARACTER_ROSTER || []).find(function (charData) { return charData.name === line.speaker; });
      clearElement(portrait);
      portrait.appendChild(createPortrait(match || { name: line.speaker, color: match ? match.color : '#555' }, 64));
    }
    function nextLine() { index += 1; renderLine(); }
    next.addEventListener('click', nextLine);
    overlay.addEventListener('click', function (event) { if (event.target === overlay) nextLine(); });
    renderLine();
  };

  StoryMode.prototype.startChapter = function (chapterIndex) {
    this.storyChapterIndex = chapterIndex;
    this.storyBattleIndex = 0;
    var chapter = this.currentCampaign.chapters[chapterIndex];
    var self = this;
    if (chapter.dialogsBefore && chapter.dialogsBefore.length) {
      this.showDialog(chapter.dialogsBefore, function () { self.advanceBattle(); });
    } else {
      this.advanceBattle();
    }
  };

  StoryMode.prototype.makeOpponent = function (battle) {
    if (battle.opponentType === 'soldier') {
      var soldier = (window.SOLDIER_TYPES || []).find(function (item) { return item.id === battle.opponent; });
      if (!soldier) return null;
      return {
        id: soldier.id,
        name: soldier.name,
        nameEn: soldier.nameEn,
        faction: '小兵',
        color: soldier.color,
        weapon: soldier.weapon,
        stats: soldier.stats,
        moves: soldier.specialMoves || [],
        ultimate: soldier.ultimate || null,
        isSoldier: true,
        soldierType: soldier
      };
    }
    return (window.CHARACTER_ROSTER || []).find(function (charData) { return charData.id === battle.opponent; }) || null;
  };

  StoryMode.prototype.advanceBattle = function () {
    var chapter = this.currentCampaign.chapters[this.storyChapterIndex];
    if (this.storyBattleIndex >= chapter.battles.length) {
      var self = this;
      if (chapter.dialogsAfter && chapter.dialogsAfter.length) {
        this.showDialog(chapter.dialogsAfter, function () {
          if (self.storyChapterIndex + 1 >= self.currentCampaign.chapters.length) self.onComplete(self.currentCampaign);
          else {
            self.storyChapterIndex += 1;
            self.showChapterMap();
          }
        });
      } else if (this.storyChapterIndex + 1 >= this.currentCampaign.chapters.length) {
        this.onComplete(this.currentCampaign);
      } else {
        this.storyChapterIndex += 1;
        this.showChapterMap();
      }
      return;
    }

    var battle = chapter.battles[this.storyBattleIndex];
    this.currentBattle = battle;
    var self = this;
    var startFight = function () {
      hideElement(self.container);
      self.onStartBattle({
        p1Char: self.storyHeroChar,
        p2Char: self.makeOpponent(battle),
        chapterIndex: self.storyChapterIndex,
        battleIndex: self.storyBattleIndex,
        battle: battle
      });
    };
    if (battle.dialogBefore && battle.dialogBefore.length) this.showDialog(battle.dialogBefore, startFight);
    else startFight();
  };

  StoryMode.prototype.handleVictory = function () {
    var self = this;
    var battle = this.currentBattle;
    if (battle && battle.dialogAfter && battle.dialogAfter.length) {
      this.showDialog(battle.dialogAfter, function () {
        self.storyBattleIndex += 1;
        self.showElementAndAdvance();
      });
    } else {
      this.storyBattleIndex += 1;
      this.showElementAndAdvance();
    }
  };

  StoryMode.prototype.showElementAndAdvance = function () {
    showElement(this.container);
    this.advanceBattle();
  };

  StoryMode.prototype.handleDefeat = function (retryCallback) {
    var self = this;
    this.showDialog([{ speaker: '旁白', text: '戰敗了……整軍再戰！' }], function () {
      if (retryCallback) retryCallback.call(self);
    });
  };

  function MoveListOverlay(containerElement) {
    this.container = containerElement;
    this.type = 'moveList';
  }

  MoveListOverlay.prototype.show = function (type) {
    this.type = type || 'moveList';
    clearElement(this.container);
    var overlay = createEl('div', 'movelist-overlay');
    var header = createEl('div', 'movelist-header');
    var titleMap = { moveList: '招式表 — Move List', stageList: '關卡列表 — Stage List', imageList: '角色圖鑑 — Sprite Gallery' };
    header.appendChild(createEl('h2', null, titleMap[this.type] || titleMap.moveList));
    var close = createEl('button', 'mode-btn', '✕ 關閉');
    close.addEventListener('click', this.hide.bind(this));
    header.appendChild(close);
    overlay.appendChild(header);
    this.content = createEl('div', this.type === 'moveList' ? 'movelist-content' : this.type === 'stageList' ? 'stagelist-content' : 'imagelist-content');
    overlay.appendChild(this.content);
    this.container.appendChild(overlay);
    if (this.type === 'moveList') this.renderMoveList();
    if (this.type === 'stageList') this.renderStageList();
    if (this.type === 'imageList') this.renderImageList();
    showElement(this.container);
  };

  MoveListOverlay.prototype.hide = function () {
    hideElement(this.container);
    clearElement(this.container);
  };

  MoveListOverlay.prototype.renderMoveList = function () {
    var self = this;
    (window.CHARACTER_ROSTER || []).forEach(function (charData) {
      var section = createEl('div', 'movelist-character');
      var title = createEl('h3', null, charData.name + ' (' + charData.nameEn + ') — ' + (charData.weapon || ''));
      title.style.color = charData.color;
      section.appendChild(title);
      section.appendChild(createEl('div', 'movelist-stats', '攻:' + charData.stats.atk + '　防:' + charData.stats.def + '　速:' + charData.stats.spd));
      var table = createEl('table', 'movelist-table');
      var thead = document.createElement('thead');
      var tr = document.createElement('tr');
      ['招式', '指令', '傷害', '氣消耗', '說明'].forEach(function (label) { tr.appendChild(createEl('th', null, label)); });
      thead.appendChild(tr);
      table.appendChild(thead);
      var tbody = document.createElement('tbody');
      (charData.moves || []).forEach(function (move) {
        var row = document.createElement('tr');
        var td1 = createEl('td', null, move.name); td1.style.color = move.color || '#fff'; row.appendChild(td1);
        row.appendChild(createEl('td', null, commandToString(move.command) + ' + L'));
        row.appendChild(createEl('td', null, String(move.damage)));
        row.appendChild(createEl('td', null, String(move.energyCost)));
        row.appendChild(createEl('td', null, move.description || ''));
        tbody.appendChild(row);
      });
      if (charData.ultimate) {
        var ultRow = document.createElement('tr');
        ultRow.className = 'ultimate-row';
        var u1 = createEl('td', null, '★ ' + charData.ultimate.name); u1.style.color = charData.ultimate.color || '#ffd700'; ultRow.appendChild(u1);
        ultRow.appendChild(createEl('td', null, '滿氣 + U'));
        ultRow.appendChild(createEl('td', null, String(charData.ultimate.damage)));
        ultRow.appendChild(createEl('td', null, String(charData.ultimate.energyCost)));
        ultRow.appendChild(createEl('td', null, charData.ultimate.description || ''));
        tbody.appendChild(ultRow);
      }
      table.appendChild(tbody);
      section.appendChild(table);
      self.content.appendChild(section);
    });
  };

  MoveListOverlay.prototype.renderStageList = function () {
    var section = createEl('div', 'stagelist-section');
    section.appendChild(createEl('h3', 'stagelist-section-title', '🗺️ 對戰場景'));
    (window.STAGE_NAMES || []).forEach(function (stage, index) {
      var card = createEl('div', 'stage-card');
      var preview = createEl('div', 'stage-preview', String(index + 1));
      preview.style.background = 'linear-gradient(135deg, ' + ['#c44e2d,#f4c462','#0a0a2e,#1a1a3e','#8b0000,#ff4500','#2a5a2a,#6ab06a','#3a4a6a,#e8c888','#1e90ff,#33aa33'][index] + ')';
      card.appendChild(preview);
      card.appendChild(createEl('div', 'stage-name', stage.name));
      card.appendChild(createEl('div', 'stage-name-en', stage.nameEn));
      card.appendChild(createEl('div', 'stage-desc', stage.desc || ''));
      section.appendChild(card);
    });
    this.content.appendChild(section);
  };

  MoveListOverlay.prototype.renderImageList = function () {
    var section = createEl('div', 'imagelist-section');
    section.appendChild(createEl('h3', 'imagelist-section-title', '角色精靈圖展示'));
    var grid = createEl('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
    grid.style.gap = '12px';
    (window.CHARACTER_ROSTER || []).forEach(function (charData) {
      var card = createEl('div', 'story-card');
      card.style.width = 'auto';
      card.style.padding = '12px';
      card.appendChild(createPortrait(charData, 96));
      card.appendChild(createEl('h3', null, charData.name));
      card.lastChild.style.color = charData.color;
      card.appendChild(createEl('p', null, charData.nameEn + ' / ' + charData.weapon));
      grid.appendChild(card);
    });
    section.appendChild(grid);
    this.content.appendChild(section);
  };

  window.commandToString = commandToString;
  window.CharacterSelect = CharacterSelect;
  window.BattleUI = BattleUI;
  window.StoryMode = StoryMode;
  window.MoveListOverlay = MoveListOverlay;
})();
