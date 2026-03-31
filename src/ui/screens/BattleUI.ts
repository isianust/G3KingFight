// ============================================================
// BattleUI.ts — In-battle HUD, overlays, and results
// ============================================================

import { MAX_ENERGY } from '../../constants';
import type { Fighter } from '../../entities/Fighter';
import type { CharacterData } from '../../types';
import type { SelectableCharData } from './CharacterSelect';

export class BattleUI {
  /* ---- DOM refs ---- */
  private p1HealthBar!: HTMLElement;
  private p2HealthBar!: HTMLElement;
  private p1EnergyBar!: HTMLElement | null;
  private p2EnergyBar!: HTMLElement | null;
  private p1KnockdownBar!: HTMLElement | null;
  private p2KnockdownBar!: HTMLElement | null;
  private p1HudName!: HTMLElement;
  private p2HudName!: HTMLElement;
  private p1HudPortrait!: HTMLElement;
  private p2HudPortrait!: HTMLElement;
  private timerDisplay!: HTMLElement;
  private roundResult!: HTMLElement;
  private resultText!: HTMLElement;
  private btnRestart!: HTMLElement;
  private btnBackToMenu!: HTMLElement;
  private battleMoveList!: HTMLElement | null;
  private battleMoveListContent!: HTMLElement | null;
  private btnToggleBattleMoves!: HTMLElement | null;

  /* ---- Callbacks ---- */
  private _onRestart: (() => void) | null = null;
  private _onBackToMenu: (() => void) | null = null;

  init(): void {
    this.p1HealthBar = document.getElementById('p1HealthBar')!;
    this.p2HealthBar = document.getElementById('p2HealthBar')!;
    this.p1EnergyBar = document.getElementById('p1EnergyBar');
    this.p2EnergyBar = document.getElementById('p2EnergyBar');
    this.p1KnockdownBar = document.getElementById('p1KnockdownBar');
    this.p2KnockdownBar = document.getElementById('p2KnockdownBar');
    this.p1HudName = document.getElementById('p1HudName')!;
    this.p2HudName = document.getElementById('p2HudName')!;
    this.p1HudPortrait = document.getElementById('p1HudPortrait')!;
    this.p2HudPortrait = document.getElementById('p2HudPortrait')!;
    this.timerDisplay = document.getElementById('timerDisplay')!;
    this.roundResult = document.getElementById('roundResult')!;
    this.resultText = document.getElementById('resultText')!;
    this.btnRestart = document.getElementById('btnRestart')!;
    this.btnBackToMenu = document.getElementById('btnBackToMenu')!;
    this.battleMoveList = document.getElementById('battleMoveList');
    this.battleMoveListContent = document.getElementById('battleMoveListContent');
    this.btnToggleBattleMoves = document.getElementById('btnToggleBattleMoves');

    this.bindButtons();
    this.bindBattleMoveListToggle();
  }

  onRestart(cb: () => void): void {
    this._onRestart = cb;
  }
  onBackToMenu(cb: () => void): void {
    this._onBackToMenu = cb;
  }

  private bindButtons(): void {
    this.btnRestart.addEventListener('click', () => {
      if (this._onRestart) this._onRestart();
    });
    this.btnBackToMenu.addEventListener('click', () => {
      if (this._onBackToMenu) this._onBackToMenu();
    });
  }

  private bindBattleMoveListToggle(): void {
    if (this.btnToggleBattleMoves) {
      this.btnToggleBattleMoves.addEventListener('click', () => {
        if (this.battleMoveList) {
          this.battleMoveList.classList.toggle('collapsed');
          if (this.btnToggleBattleMoves) {
            this.btnToggleBattleMoves.textContent = this.battleMoveList.classList.contains(
              'collapsed',
            )
              ? '招式表 ▶'
              : '◀ 收起';
          }
        }
      });
    }
  }

  /** Set up HUD for a new match */
  setupHud(p1Char: SelectableCharData, p2Char: SelectableCharData): void {
    this.p1HudName.textContent = p1Char.name;
    this.p2HudName.textContent = p2Char.name;
    this.p1HudPortrait.textContent = p1Char.name.charAt(0);
    this.p2HudPortrait.textContent = p2Char.name.charAt(0);
    this.p1HudPortrait.style.background = p1Char.color;
    this.p2HudPortrait.style.background = p2Char.color;
    this.p1HealthBar.style.width = '100%';
    this.p2HealthBar.style.width = '100%';
    if (this.p1EnergyBar) this.p1EnergyBar.style.width = '0%';
    if (this.p2EnergyBar) this.p2EnergyBar.style.width = '0%';

    this.timerDisplay.textContent = '99';
    this.roundResult.classList.add('hidden');
  }

  updateTimer(value: number): void {
    this.timerDisplay.textContent = String(value);
  }

  /** Called every frame to sync bars with fighter state */
  updateHud(player1: Fighter, player2: Fighter): void {
    this.p1HealthBar.style.width = (player1.health / player1.maxHealth) * 100 + '%';
    this.p2HealthBar.style.width = (player2.health / player2.maxHealth) * 100 + '%';
    this.updateHealthBarColor(this.p1HealthBar, (player1.health / player1.maxHealth) * 100);
    this.updateHealthBarColor(this.p2HealthBar, (player2.health / player2.maxHealth) * 100);

    if (this.p1EnergyBar)
      this.p1EnergyBar.style.width = (player1.energy / player1.maxEnergy) * 100 + '%';
    if (this.p2EnergyBar)
      this.p2EnergyBar.style.width = (player2.energy / player2.maxEnergy) * 100 + '%';

    if (this.p1EnergyBar) {
      if (player1.energy >= MAX_ENERGY) {
        this.p1EnergyBar.style.background = 'linear-gradient(90deg, #ffdd00, #ffaa00)';
        this.p1EnergyBar.classList.add('energy-full');
      } else {
        this.p1EnergyBar.style.background = 'linear-gradient(90deg, #0088ff, #00ccff)';
        this.p1EnergyBar.classList.remove('energy-full');
      }
    }
    if (this.p2EnergyBar) {
      if (player2.energy >= MAX_ENERGY) {
        this.p2EnergyBar.style.background = 'linear-gradient(270deg, #ffdd00, #ffaa00)';
        this.p2EnergyBar.classList.add('energy-full');
      } else {
        this.p2EnergyBar.style.background = 'linear-gradient(270deg, #0088ff, #00ccff)';
        this.p2EnergyBar.classList.remove('energy-full');
      }
    }

    if (this.p1KnockdownBar)
      this.p1KnockdownBar.style.width =
        (player1.knockdownBar / player1.knockdownBarMax) * 100 + '%';
    if (this.p2KnockdownBar)
      this.p2KnockdownBar.style.width =
        (player2.knockdownBar / player2.knockdownBarMax) * 100 + '%';
  }

  private updateHealthBarColor(barEl: HTMLElement, health: number): void {
    if (health > 50) {
      barEl.style.background = 'linear-gradient(90deg, #22cc44, #44ff66)';
    } else if (health > 25) {
      barEl.style.background = 'linear-gradient(90deg, #ccaa22, #ffcc44)';
    } else {
      barEl.style.background = 'linear-gradient(90deg, #cc2222, #ff4444)';
    }
  }

  /** Show the round result overlay */
  showResult(
    player1: Fighter,
    player2: Fighter,
    p1Char: SelectableCharData,
    p2Char: SelectableCharData,
    gameMode: string,
    _storyP1Won: boolean,
  ): { result: string; p1Won: boolean } {
    let result: string;
    let p1Won = false;
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

    this.resultText.textContent = result;

    if (gameMode === 'story') {
      if (p1Won) {
        this.btnRestart.textContent = '繼續 →';
      } else {
        this.btnRestart.textContent = '再試一次';
      }
    } else {
      this.btnRestart.textContent = '再來一局';
    }

    this.roundResult.classList.remove('hidden');
    return { result, p1Won };
  }

  hideResult(): void {
    this.roundResult.classList.add('hidden');
  }

  /** Populate the in-battle move list panel */
  populateBattleMoveList(
    p1Char: SelectableCharData | null,
    p2Char: SelectableCharData | null,
  ): void {
    if (!this.battleMoveListContent) return;
    this.battleMoveListContent.innerHTML = '';
    const chars: { label: string; data: CharacterData }[] = [];
    if (p1Char) chars.push({ label: 'P1', data: p1Char });
    if (p2Char && !(p2Char as SelectableCharData).isSoldier)
      chars.push({ label: 'P2', data: p2Char });

    chars.forEach((entry) => {
      const c = entry.data;
      const sec = document.createElement('div');
      sec.className = 'battle-movelist-section';
      let html = '<h4 style="color:' + c.color + '">' + entry.label + ' ' + c.name + '</h4>';

      if (c.moves) {
        c.moves.forEach((m) => {
          const cmdStr = commandToString(m.command);
          html +=
            '<div class="bml-move"><span class="bml-move-name" style="color:' +
            (m.color || '#fff') +
            '">' +
            m.name +
            '</span><span class="bml-move-cmd">' +
            cmdStr +
            '+攻 (' +
            m.energyCost +
            '氣)</span></div>';
        });
      }
      if (c.ultimate) {
        const ultCmd = entry.label === 'P1' ? '滿氣+U+I' : '滿氣+Enter+/';
        html +=
          '<div class="bml-move bml-ultimate"><span class="bml-move-name" style="color:' +
          (c.ultimate.color || '#ffd700') +
          '">★ ' +
          c.ultimate.name +
          '</span><span class="bml-move-cmd">' +
          ultCmd +
          '</span></div>';
      }
      sec.innerHTML = html;
      this.battleMoveListContent!.appendChild(sec);
    });
  }

  resetBattleMoveList(): void {
    if (this.battleMoveList) {
      this.battleMoveList.classList.add('collapsed');
      if (this.btnToggleBattleMoves) this.btnToggleBattleMoves.textContent = '招式表 ▶';
    }
  }
}

// ---- Shared utility ----

function commandToString(cmd: string[]): string {
  const map: Record<string, string> = {
    D: '↓',
    DF: '↘',
    F: '→',
    DB: '↙',
    B: '←',
    U: '↑',
    D_HOLD: '↓(蓄)',
    U_HOLD: '↑(蓄)',
    B_HOLD: '←(蓄)',
    F_HOLD: '→(蓄)',
  };
  return cmd.map((c) => map[c] || c).join(' ');
}

export { commandToString };
