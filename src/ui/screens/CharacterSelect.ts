// ============================================================
// CharacterSelect.ts — Character selection screen logic
// ============================================================

import { CHARACTER_ROSTER } from '../../data/characters';
import { FACTION_DATA } from '../../constants';
import type { CharacterData, SoldierType } from '../../types';

/** Character data with optional soldier flag (used when story mode picks a soldier). */
export interface SelectableCharData extends CharacterData {
  isSoldier?: boolean;
  soldierType?: SoldierType;
}

export class CharacterSelect {
  /* ---- DOM refs ---- */
  private charSelectScreen!: HTMLElement;
  private modeSelect!: HTMLElement;
  private charSelectPanel!: HTMLElement;
  private selectLabel!: HTMLElement;
  private charGrid!: HTMLElement;
  private btnFight!: HTMLElement;
  private p1Portrait!: HTMLElement;
  private p2Portrait!: HTMLElement;
  private p1NameEl!: HTMLElement;
  private p2NameEl!: HTMLElement;

  /* ---- State ---- */
  public selectingFor = 1;
  public p1Char: SelectableCharData | null = null;
  public p2Char: SelectableCharData | null = null;
  public gameMode = '';

  /* ---- Callbacks ---- */
  private _onFight: (() => void) | null = null;
  private _onStory: (() => void) | null = null;
  private _isMobile = false;

  init(isMobile: boolean): void {
    this._isMobile = isMobile;
    this.charSelectScreen = document.getElementById('charSelectScreen')!;
    this.modeSelect = document.getElementById('modeSelect')!;
    this.charSelectPanel = document.getElementById('charSelectPanel')!;
    this.selectLabel = document.getElementById('selectLabel')!;
    this.charGrid = document.getElementById('charGrid')!;
    this.btnFight = document.getElementById('btnFight')!;
    this.p1Portrait = document.getElementById('p1Portrait')!;
    this.p2Portrait = document.getElementById('p2Portrait')!;
    this.p1NameEl = document.getElementById('p1Name')!;
    this.p2NameEl = document.getElementById('p2Name')!;

    this.bindModeButtons();
    this.bindDifficulty();
  }

  /** Register callback when fight is confirmed */
  onFight(cb: () => void): void {
    this._onFight = cb;
  }
  /** Register callback when story mode is selected */
  onStory(cb: () => void): void {
    this._onStory = cb;
  }

  private bindModeButtons(): void {
    const btnPvP = document.getElementById('btnPvP')!;
    const btnPvCPU = document.getElementById('btnPvCPU')!;
    const btnStory = document.getElementById('btnStory')!;

    btnPvP.addEventListener('click', () => {
      if (this._isMobile) return;
      this.gameMode = 'pvp';
      this.modeSelect.classList.add('hidden');
      this.charSelectPanel.classList.remove('hidden');
      this.selectingFor = 1;
      this.selectLabel.textContent = 'P1 選擇角色';
      this.buildCharGrid();
    });

    btnPvCPU.addEventListener('click', () => {
      this.gameMode = 'pvcpu';
      this.modeSelect.classList.add('hidden');
      this.charSelectPanel.classList.remove('hidden');
      this.selectingFor = 1;
      this.selectLabel.textContent = '選擇你的武將';
      this.buildCharGrid();
    });

    btnStory.addEventListener('click', () => {
      this.gameMode = 'story';
      this.charSelectScreen.classList.add('hidden');
      if (this._onStory) this._onStory();
    });

    this.btnFight.addEventListener('click', () => {
      if (this.p1Char && this.p2Char && this._onFight) {
        this._onFight();
      }
    });
  }

  private bindDifficulty(): void {
    const diffBtns = document.querySelectorAll<HTMLElement>('.diff-btn');
    diffBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        diffBtns.forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        // Difficulty is stored on GameEngine via data-diff attribute
      });
    });
  }

  getDifficulty(): string {
    const selected = document.querySelector<HTMLElement>('.diff-btn.selected');
    return selected?.dataset['diff'] ?? 'easy';
  }

  buildCharGrid(filterFaction?: string): void {
    this.charGrid.innerHTML = '';
    let roster: CharacterData[] = CHARACTER_ROSTER;
    if (filterFaction) {
      roster = roster.filter((c) => c.faction === filterFaction);
    }

    const factions: Record<string, CharacterData[]> = {};
    roster.forEach((c) => {
      if (!factions[c.faction]) factions[c.faction] = [];
      factions[c.faction].push(c);
    });

    Object.keys(factions).forEach((faction) => {
      const factionLabel = document.createElement('div');
      factionLabel.className = 'faction-label';
      factionLabel.textContent = faction;
      const fData = FACTION_DATA[faction];
      factionLabel.style.color = fData ? fData.color : '#fff';
      this.charGrid.appendChild(factionLabel);

      factions[faction].forEach((c) => {
        const cell = document.createElement('div');
        cell.className = 'char-cell';
        cell.dataset['charId'] = c.id;
        cell.innerHTML =
          '<div class="char-cell-portrait" style="background:' +
          c.color +
          ';"></div>' +
          '<span>' +
          c.name +
          '</span>' +
          '<span class="faction">' +
          c.faction +
          '</span>';
        cell.addEventListener('click', () => {
          this.onCharSelect(c, cell);
        });
        this.charGrid.appendChild(cell);
      });
    });
  }

  private onCharSelect(charData: CharacterData, cellEl: HTMLElement): void {
    if (this.selectingFor === 1) {
      this.p1Char = charData as SelectableCharData;
      this.charGrid
        .querySelectorAll('.selected-p1')
        .forEach((el) => el.classList.remove('selected-p1'));
      cellEl.classList.add('selected-p1');
      this.p1Portrait.textContent = charData.name;
      this.p1Portrait.style.background = charData.color;
      this.p1Portrait.style.color = '#fff';
      this.p1NameEl.textContent = charData.name;

      this.showCharInfo(charData, 'p1');

      if (this.gameMode === 'pvcpu') {
        const available = CHARACTER_ROSTER.filter((c) => c.id !== charData.id);
        const picked = available[Math.floor(Math.random() * available.length)];
        this.p2Char = picked as SelectableCharData;
        this.p2Portrait.textContent = picked.name;
        this.p2Portrait.style.background = picked.color;
        this.p2Portrait.style.color = '#fff';
        this.p2NameEl.textContent = picked.name;
        this.btnFight.classList.remove('hidden');
      } else {
        this.selectingFor = 2;
        this.selectLabel.textContent = 'P2 選擇角色';
      }
    } else {
      this.p2Char = charData as SelectableCharData;
      this.charGrid
        .querySelectorAll('.selected-p2')
        .forEach((el) => el.classList.remove('selected-p2'));
      cellEl.classList.add('selected-p2');
      this.p2Portrait.textContent = charData.name;
      this.p2Portrait.style.background = charData.color;
      this.p2Portrait.style.color = '#fff';
      this.p2NameEl.textContent = charData.name;

      this.showCharInfo(charData, 'p2');
      this.btnFight.classList.remove('hidden');
    }
  }

  private showCharInfo(charData: CharacterData, player: string): void {
    const infoEl = document.getElementById(player + 'CharInfo');
    if (!infoEl) return;
    let html = '<strong>' + charData.name + '</strong> (' + charData.nameEn + ')<br>';
    html += '武器：' + (charData.weapon || '—') + '<br>';
    html +=
      '攻:' +
      charData.stats.atk +
      ' 防:' +
      charData.stats.def +
      ' 速:' +
      charData.stats.spd +
      '<br>';
    if (charData.moves) {
      html += '<div class="char-moves">';
      charData.moves.forEach((m) => {
        html +=
          '<span class="move-tag" style="border-color:' +
          (m.color || '#aaa') +
          ';">' +
          m.name +
          ' (' +
          m.energyCost +
          '氣)</span>';
      });
      if (charData.ultimate) {
        html +=
          '<span class="move-tag ultimate-tag">★ ' + charData.ultimate.name + ' (滿氣)</span>';
      }
      html += '</div>';
    }
    infoEl.innerHTML = html;
  }

  /** Reset the select screen to initial state */
  resetToMenu(): void {
    this.charSelectScreen.classList.remove('hidden');
    this.modeSelect.classList.remove('hidden');
    this.charSelectPanel.classList.add('hidden');
    this.btnFight.classList.add('hidden');
    this.p1Char = null;
    this.p2Char = null;
    this.selectingFor = 1;
    this.p1Portrait.textContent = 'P1';
    this.p2Portrait.textContent = 'P2';
    this.p1Portrait.style.background = '';
    this.p2Portrait.style.background = '';
    this.p1NameEl.textContent = '---';
    this.p2NameEl.textContent = '---';
    const p1Info = document.getElementById('p1CharInfo');
    const p2Info = document.getElementById('p2CharInfo');
    if (p1Info) p1Info.innerHTML = '';
    if (p2Info) p2Info.innerHTML = '';
  }

  hideCharSelect(): void {
    this.charSelectScreen.classList.add('hidden');
  }
}
