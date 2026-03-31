// ============================================================
// MoveListOverlay.ts — Move list, stage list, and image list overlay logic
// ============================================================

import { CHARACTER_ROSTER, SOLDIER_TYPES } from '../../data/characters';
import { STORY_CAMPAIGNS } from '../../data/stories';
import { STAGE_NAMES } from '../../constants';
import type { CharacterData } from '../../types';
import { commandToString } from './BattleUI';

export class MoveListOverlay {
  /* ---- DOM refs ---- */
  private moveListOverlay!: HTMLElement | null;
  private moveListContent!: HTMLElement | null;
  private stageListOverlay!: HTMLElement | null;
  private stageListContent!: HTMLElement | null;
  private imageListOverlay!: HTMLElement | null;
  private imageListContent!: HTMLElement | null;

  /* ---- Stage selection state (shared with game engine) ---- */
  public selectedStage = -1; // -1 = random

  init(): void {
    this.moveListOverlay = document.getElementById('moveListOverlay');
    this.moveListContent = document.getElementById('moveListContent');
    this.stageListOverlay = document.getElementById('stageListOverlay');
    this.stageListContent = document.getElementById('stageListContent');
    this.imageListOverlay = document.getElementById('imageListOverlay');
    this.imageListContent = document.getElementById('imageListContent');

    this.bindButtons();
  }

  private bindButtons(): void {
    const btnMoveList = document.getElementById('btnMoveList');
    const btnCloseMoveList = document.getElementById('btnCloseMoveList');
    const btnStageList = document.getElementById('btnStageList');
    const btnCloseStageList = document.getElementById('btnCloseStageList');
    const btnImageList = document.getElementById('btnImageList');
    const btnCloseImageList = document.getElementById('btnCloseImageList');

    if (btnMoveList) btnMoveList.addEventListener('click', () => this.showMoveList());
    if (btnCloseMoveList)
      btnCloseMoveList.addEventListener('click', () => {
        if (this.moveListOverlay) this.moveListOverlay.classList.add('hidden');
      });
    if (btnStageList) btnStageList.addEventListener('click', () => this.showStageList());
    if (btnCloseStageList)
      btnCloseStageList.addEventListener('click', () => {
        if (this.stageListOverlay) this.stageListOverlay.classList.add('hidden');
      });
    if (btnImageList) btnImageList.addEventListener('click', () => this.showImageList());
    if (btnCloseImageList)
      btnCloseImageList.addEventListener('click', () => {
        if (this.imageListOverlay) this.imageListOverlay.classList.add('hidden');
      });
  }

  // ==== Move List ====

  private showMoveList(): void {
    if (!this.moveListContent || !this.moveListOverlay) return;
    this.moveListContent.innerHTML = '';

    CHARACTER_ROSTER.forEach((c: CharacterData) => {
      const section = document.createElement('div');
      section.className = 'movelist-character';

      let header =
        '<h3 style="color:' +
        c.color +
        '">' +
        c.name +
        ' (' +
        c.nameEn +
        ') — ' +
        (c.weapon || '') +
        '</h3>';
      header +=
        '<div class="movelist-stats">攻:' +
        c.stats.atk +
        ' 防:' +
        c.stats.def +
        ' 速:' +
        c.stats.spd +
        '</div>';

      let movesHtml =
        '<table class="movelist-table"><tr><th>招式</th><th>指令</th><th>傷害</th><th>氣消耗</th><th>說明</th></tr>';

      if (c.moves) {
        c.moves.forEach((m) => {
          const cmdStr = commandToString(m.command);
          movesHtml += '<tr><td style="color:' + (m.color || '#fff') + '">' + m.name + '</td>';
          movesHtml += '<td>' + cmdStr + ' + 攻擊</td>';
          movesHtml += '<td>' + m.damage + '</td>';
          movesHtml += '<td>' + m.energyCost + '</td>';
          movesHtml += '<td>' + m.description + '</td></tr>';
        });
      }

      if (c.ultimate) {
        movesHtml +=
          '<tr class="ultimate-row"><td style="color:' +
          (c.ultimate.color || '#ffd700') +
          '">★ ' +
          c.ultimate.name +
          '</td>';
        movesHtml += '<td>滿氣 + 輕重攻擊同按</td>';
        movesHtml += '<td>' + c.ultimate.damage + '</td>';
        movesHtml += '<td>' + c.ultimate.energyCost + '</td>';
        movesHtml += '<td>' + c.ultimate.description + '</td></tr>';
      }

      movesHtml += '</table>';
      section.innerHTML = header + movesHtml;
      this.moveListContent!.appendChild(section);
    });

    this.moveListOverlay.classList.remove('hidden');
  }

  // ==== Stage List ====

  private showStageList(): void {
    if (!this.stageListContent || !this.stageListOverlay) return;
    this.stageListContent.innerHTML = '';

    // --- Battle Stages ---
    const stageSection = document.createElement('div');
    stageSection.className = 'stagelist-section';
    stageSection.innerHTML = '<h3 class="stagelist-section-title">🗺️ 對戰場景 — Battle Stages</h3>';

    const stageColors = [
      ['#c44e2d', '#f4c462'],
      ['#0a0a2e', '#1a1a3e'],
      ['#8b0000', '#ff4500'],
      ['#2a5a2a', '#6ab06a'],
      ['#3a4a6a', '#e8c888'],
      ['#1e90ff', '#33aa33'],
    ];

    const randomCard = document.createElement('div');
    randomCard.className = 'stage-card' + (this.selectedStage === -1 ? ' selected-stage' : '');
    randomCard.innerHTML =
      '<div class="stage-preview" style="background:linear-gradient(135deg, #666, #999);">🎲</div>' +
      '<div class="stage-name">隨機</div>' +
      '<div class="stage-name-en">Random</div>';
    randomCard.addEventListener('click', () => {
      this.selectedStage = -1;
      this.showStageList();
    });
    stageSection.appendChild(randomCard);

    for (let i = 0; i < STAGE_NAMES.length; i++) {
      const stage = STAGE_NAMES[i];
      const colors = stageColors[i] || ['#666', '#999'];
      const card = document.createElement('div');
      card.className = 'stage-card' + (this.selectedStage === i ? ' selected-stage' : '');
      card.innerHTML =
        '<div class="stage-preview" style="background:linear-gradient(135deg, ' +
        colors[0] +
        ', ' +
        colors[1] +
        ');"></div>' +
        '<div class="stage-name">' +
        stage.name +
        '</div>' +
        '<div class="stage-name-en">' +
        stage.nameEn +
        '</div>' +
        '<div class="stage-desc">' +
        (stage.desc || '') +
        '</div>';
      const idx = i;
      card.addEventListener('click', () => {
        this.selectedStage = idx;
        this.showStageList();
      });
      stageSection.appendChild(card);
    }
    this.stageListContent.appendChild(stageSection);

    // --- Story Mode Campaigns & Chapters ---
    const storySection = document.createElement('div');
    storySection.className = 'stagelist-section';
    storySection.innerHTML =
      '<h3 class="stagelist-section-title">📖 故事模式關卡 — Story Campaign Stages</h3>';

    const factions = Object.keys(STORY_CAMPAIGNS);
    for (const factionName of factions) {
      const campaign = STORY_CAMPAIGNS[factionName];
      const campaignDiv = document.createElement('div');
      campaignDiv.className = 'stagelist-campaign';

      const campaignHeader = document.createElement('div');
      campaignHeader.className = 'stagelist-campaign-header';
      const protagonistChar = CHARACTER_ROSTER.find((c) => c.id === campaign.protagonist);
      campaignHeader.innerHTML =
        '<span class="stagelist-campaign-name">' +
        campaign.title +
        '</span>' +
        '<span class="stagelist-campaign-en">' +
        campaign.titleEn +
        '</span>' +
        '<span class="stagelist-campaign-desc">' +
        campaign.description +
        '</span>' +
        '<span class="stagelist-campaign-meta">主角: ' +
        (protagonistChar?.name ?? '—') +
        ' | 共 ' +
        campaign.chapters.length +
        ' 章</span>';
      campaignDiv.appendChild(campaignHeader);

      for (const chapter of campaign.chapters) {
        const chapterDiv = document.createElement('div');
        chapterDiv.className = 'stagelist-chapter';

        const chapterTitle = document.createElement('div');
        chapterTitle.className = 'stagelist-chapter-title';
        chapterTitle.textContent = chapter.title + ' — ' + chapter.titleEn;
        chapterDiv.appendChild(chapterTitle);

        const battleList = document.createElement('div');
        battleList.className = 'stagelist-battle-list';

        for (let bi = 0; bi < chapter.battles.length; bi++) {
          const battle = chapter.battles[bi];
          const battleDiv = document.createElement('div');
          battleDiv.className = 'stagelist-battle';

          let opponentName = '';
          let opponentColor = '#888';
          if (battle.opponentType === 'soldier') {
            const soldierType = SOLDIER_TYPES.find((s) => s.id === battle.opponent);
            if (soldierType) {
              opponentName = soldierType.name + ' (' + soldierType.weapon + ')';
              opponentColor = soldierType.color;
            }
          } else {
            const charData = CHARACTER_ROSTER.find((c) => c.id === battle.opponent);
            if (charData) {
              opponentName = charData.name + ' ' + charData.nameEn;
              opponentColor = charData.color;
            }
          }

          const typeLabel = battle.opponentType === 'soldier' ? '小兵' : '武將';
          battleDiv.innerHTML =
            '<span class="stagelist-battle-num">戰 ' +
            (bi + 1) +
            '</span>' +
            '<span class="stagelist-battle-type" style="color:' +
            (battle.opponentType === 'soldier' ? '#888' : '#ffd700') +
            '">[' +
            typeLabel +
            ']</span>' +
            '<span class="stagelist-battle-name" style="color:' +
            opponentColor +
            '">' +
            opponentName +
            '</span>';

          battleList.appendChild(battleDiv);
        }
        chapterDiv.appendChild(battleList);

        if (chapter.dialogsBefore && chapter.dialogsBefore.length > 0) {
          const dialogPreview = document.createElement('div');
          dialogPreview.className = 'stagelist-dialog-preview';
          dialogPreview.textContent =
            '💬 ' +
            chapter.dialogsBefore[0].speaker +
            ': 「' +
            chapter.dialogsBefore[0].text +
            '」';
          chapterDiv.appendChild(dialogPreview);
        }

        campaignDiv.appendChild(chapterDiv);
      }

      storySection.appendChild(campaignDiv);
    }
    this.stageListContent.appendChild(storySection);

    this.stageListOverlay.classList.remove('hidden');
  }

  // ==== Image Checklist ====

  private showImageList(): void {
    if (!this.imageListContent || !this.imageListOverlay) return;
    this.imageListContent.innerHTML = '';

    interface ImageItem {
      name: string;
      size: string;
      format: string;
      desc: string;
      current: string;
      color: string | null;
    }
    interface ImageSection {
      title: string;
      items: ImageItem[];
    }

    const imageNeeds: ImageSection[] = [];

    // 1. Character portraits & sprites
    const charSection: ImageSection = { title: '🧑‍🎨 角色圖 — Character Art', items: [] };
    CHARACTER_ROSTER.forEach((c) => {
      charSection.items.push({
        name: c.name + ' (' + c.nameEn + ') — 戰鬥精靈圖',
        size: '512 × 512 px (每幀)',
        format: 'PNG (透明背景)',
        desc: '精靈圖表: idle(4幀), run(6幀), attack1(4幀), attack2(4幀), special(6幀), knockdown(3幀), getup(3幀), death(4幀), jump(2幀), block(1幀)',
        current: '🟢 Canvas 精靈圖 (自動生成)',
        color: c.color,
      });
      charSection.items.push({
        name: c.name + ' — 選角頭像',
        size: '128 × 128 px',
        format: 'PNG/JPEG',
        desc: '角色選擇畫面的大頭照, 半身像, 背景透明或單色',
        current: '🟡 CSS 色塊 + 文字',
        color: c.color,
      });
      charSection.items.push({
        name: c.name + ' — 對話立繪',
        size: '256 × 512 px',
        format: 'PNG (透明背景)',
        desc: '故事模式對話時顯示的立繪, 半身或全身',
        current: '🟡 CSS 圓形色塊 + 首字',
        color: c.color,
      });
    });
    imageNeeds.push(charSection);

    // 2. Soldier sprites
    const soldierSection: ImageSection = { title: '⚔️ 小兵圖 — Soldier Art', items: [] };
    SOLDIER_TYPES.forEach((s) => {
      soldierSection.items.push({
        name: s.name + ' (' + s.weapon + ') — 戰鬥精靈圖',
        size: '256 × 256 px (每幀)',
        format: 'PNG (透明背景)',
        desc: '精靈圖表: idle(4幀), run(4幀), attack(3幀), knockdown(2幀), death(3幀)',
        current: '🟢 Canvas 精靈圖 (自動生成)',
        color: s.color,
      });
    });
    imageNeeds.push(soldierSection);

    // 3. Backgrounds
    const bgSection: ImageSection = { title: '🌄 背景圖 — Stage Backgrounds', items: [] };
    STAGE_NAMES.forEach((stage) => {
      bgSection.items.push({
        name: stage.name + ' (' + stage.nameEn + ')',
        size: '1024 × 576 px',
        format: 'PNG/JPEG',
        desc: '全畫面戰鬥背景, 三國風格場景',
        current: '🟡 Canvas 漸層 + 幾何圖形',
        color: null,
      });
    });
    imageNeeds.push(bgSection);

    // 4. UI elements
    const uiSection: ImageSection = { title: '🎮 介面圖 — UI Assets', items: [] };
    uiSection.items.push({
      name: '主選單背景',
      size: '1024 × 576 px',
      format: 'PNG/JPEG',
      desc: '主畫面背景, 三國主題, 大氣磅礴',
      current: '🟡 CSS 漸層背景',
      color: null,
    });
    uiSection.items.push({
      name: '遊戲 Logo',
      size: '512 × 200 px',
      format: 'PNG (透明背景)',
      desc: '「武將爭霸」遊戲標題 Logo',
      current: '🟡 HTML 文字 + CSS 陰影',
      color: null,
    });
    uiSection.items.push({
      name: '故事模式地圖背景',
      size: '900 × 400 px',
      format: 'PNG/JPEG',
      desc: '故事關卡地圖底圖, 古地圖風格, 含路線',
      current: '🟡 CSS 漸層 + HTML 節點',
      color: null,
    });
    uiSection.items.push({
      name: 'HUD 血條框',
      size: '400 × 30 px',
      format: 'PNG (透明背景)',
      desc: '血條外框裝飾, 古風邊框',
      current: '🟡 CSS border + 漸層',
      color: null,
    });
    uiSection.items.push({
      name: '勝利畫面',
      size: '1024 × 576 px',
      format: 'PNG/JPEG',
      desc: '通關勝利畫面背景',
      current: '🟡 Canvas 黑底 + 文字',
      color: null,
    });
    uiSection.items.push({
      name: '對話框背景',
      size: '800 × 150 px',
      format: 'PNG (透明背景)',
      desc: '故事模式對話框底圖, 古卷風格',
      current: '🟡 CSS 半透明 + border',
      color: null,
    });
    imageNeeds.push(uiSection);

    // 5. Effects
    const fxSection: ImageSection = { title: '✨ 特效圖 — Effect Assets', items: [] };
    fxSection.items.push({
      name: '打擊特效',
      size: '128 × 128 px (每幀)',
      format: 'PNG (透明背景)',
      desc: '攻擊命中的爆裂特效精靈圖, 4-6幀',
      current: '🟡 Canvas 圓形粒子',
      color: null,
    });
    fxSection.items.push({
      name: '氣彈投射物',
      size: '64 × 64 px (每幀)',
      format: 'PNG (透明背景)',
      desc: '遠程攻擊的能量球精靈圖, 4幀循環',
      current: '🟡 Canvas 發光圓',
      color: null,
    });
    fxSection.items.push({
      name: '大招演出背景',
      size: '1024 × 576 px',
      format: 'PNG (透明背景)',
      desc: '奧義發動時的全屏演出特效',
      current: '🟡 Canvas 閃光 + 震動',
      color: null,
    });
    imageNeeds.push(fxSection);

    // Render all sections
    imageNeeds.forEach((section) => {
      const secDiv = document.createElement('div');
      secDiv.className = 'imagelist-section';

      const secTitle = document.createElement('h3');
      secTitle.className = 'imagelist-section-title';
      secTitle.textContent = section.title;
      secDiv.appendChild(secTitle);

      const table = document.createElement('table');
      table.className = 'imagelist-table';
      table.innerHTML =
        '<thead><tr>' +
        '<th>名稱</th><th>尺寸</th><th>格式</th><th>說明</th><th>現狀</th>' +
        '</tr></thead>';
      const tbody = document.createElement('tbody');

      section.items.forEach((item) => {
        const tr = document.createElement('tr');
        const colorSwatch = item.color
          ? '<span class="imagelist-swatch" style="background:' + item.color + '"></span> '
          : '';
        tr.innerHTML =
          '<td>' +
          colorSwatch +
          item.name +
          '</td>' +
          '<td class="imagelist-size">' +
          item.size +
          '</td>' +
          '<td class="imagelist-format">' +
          item.format +
          '</td>' +
          '<td>' +
          item.desc +
          '</td>' +
          '<td class="imagelist-status">' +
          item.current +
          '</td>';
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      secDiv.appendChild(table);
      this.imageListContent!.appendChild(secDiv);
    });

    // Summary stats
    let totalImages = 0;
    imageNeeds.forEach((s) => {
      totalImages += s.items.length;
    });
    const summary = document.createElement('div');
    summary.className = 'imagelist-summary';
    summary.textContent =
      '總計需要 ' +
      totalImages +
      ' 張圖片素材。所有標示 🟡 的項目目前使用 HTML/CSS/Canvas 繪製, 需要替換為正式美術素材。';
    this.imageListContent.appendChild(summary);

    this.imageListOverlay.classList.remove('hidden');
  }
}
