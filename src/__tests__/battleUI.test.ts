import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BattleUI, commandToString } from '../ui/screens/BattleUI';
import { Fighter } from '../entities/Fighter';
import { MAX_ENERGY, HERO_MAX_HEALTH } from '../constants/gameConfig';
import type { CharacterData } from '../types';
import type { SelectableCharData } from '../ui/screens/CharacterSelect';

// ---- Helpers ----

function createMockCharData(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    id: 'test_char',
    name: '趙雲',
    nameEn: 'Zhao Yun',
    faction: '蜀漢',
    color: '#22aa44',
    weapon: 'Spear',
    stats: { atk: 7, def: 6, spd: 5 },
    moves: [
      {
        name: '龍膽槍',
        nameEn: 'Dragon Spear',
        type: 'melee' as const,
        command: ['D', 'DF', 'F'],
        damage: 25,
        energyCost: 20,
        description: 'A powerful thrust',
        color: '#00ff00',
      },
    ],
    ultimate: {
      name: '七進七出',
      nameEn: 'Seven In Seven Out',
      type: 'area' as const,
      damage: 60,
      energyCost: 100,
      description: 'Ultimate attack',
      color: '#ffd700',
    },
    ...overrides,
  };
}

function createSelectableCharData(overrides: Partial<SelectableCharData> = {}): SelectableCharData {
  return {
    ...createMockCharData(),
    ...overrides,
  } as SelectableCharData;
}

function createFighter(overrides: Partial<Record<string, unknown>> = {}): Fighter {
  const f = new Fighter({
    position: { x: 200, y: 300 },
    color: '#ff0000',
  });
  Object.assign(f, overrides);
  return f;
}

function setupDOM(): void {
  document.body.innerHTML = `
    <div id="p1HealthBar"></div><div id="p2HealthBar"></div>
    <div id="p1EnergyBar"></div><div id="p2EnergyBar"></div>
    <div id="p1KnockdownBar"></div><div id="p2KnockdownBar"></div>
    <div id="p1HudName"></div><div id="p2HudName"></div>
    <div id="p1HudPortrait"></div><div id="p2HudPortrait"></div>
    <div id="timerDisplay"></div>
    <div id="roundResult" class="hidden"></div>
    <div id="resultText"></div>
    <button id="btnRestart"></button>
    <button id="btnBackToMenu"></button>
    <div id="battleMoveList"></div>
    <div id="battleMoveListContent"></div>
    <button id="btnToggleBattleMoves"></button>
  `;
}

// ============ commandToString Tests ============

describe('commandToString', () => {
  it('converts directional commands to arrow symbols', () => {
    expect(commandToString(['D', 'DF', 'F'])).toBe('↓ ↘ →');
    expect(commandToString(['D', 'DB', 'B'])).toBe('↓ ↙ ←');
    expect(commandToString(['U'])).toBe('↑');
  });

  it('converts hold commands to hold symbols', () => {
    expect(commandToString(['D_HOLD'])).toBe('↓(蓄)');
    expect(commandToString(['U_HOLD'])).toBe('↑(蓄)');
    expect(commandToString(['B_HOLD'])).toBe('←(蓄)');
    expect(commandToString(['F_HOLD'])).toBe('→(蓄)');
  });

  it('passes through unknown commands unchanged', () => {
    expect(commandToString(['PUNCH'])).toBe('PUNCH');
    expect(commandToString(['D', 'UNKNOWN', 'F'])).toBe('↓ UNKNOWN →');
  });

  it('handles empty array', () => {
    expect(commandToString([])).toBe('');
  });

  it('handles all known direction keys', () => {
    const all = ['D', 'DF', 'F', 'DB', 'B', 'U'];
    expect(commandToString(all)).toBe('↓ ↘ → ↙ ← ↑');
  });
});

// ============ BattleUI Tests ============

describe('BattleUI', () => {
  let ui: BattleUI;

  beforeEach(() => {
    setupDOM();
    ui = new BattleUI();
    ui.init();
  });

  // ---- init ----

  describe('init', () => {
    it('binds DOM elements without throwing', () => {
      // If init() didn't bind properly, subsequent calls would throw
      expect(() => ui.updateTimer(50)).not.toThrow();
    });

    it('binds all required elements from DOM', () => {
      const freshUI = new BattleUI();
      setupDOM();
      expect(() => freshUI.init()).not.toThrow();
      // Verify by calling methods that touch each DOM element
      const p1 = createSelectableCharData({ name: 'A', color: '#f00' });
      const p2 = createSelectableCharData({ name: 'B', color: '#00f' });
      expect(() => freshUI.setupHud(p1, p2)).not.toThrow();
    });
  });

  // ---- onRestart / onBackToMenu ----

  describe('onRestart', () => {
    it('registers a callback that fires on button click', () => {
      const cb = vi.fn();
      ui.onRestart(cb);
      document.getElementById('btnRestart')!.click();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('does not throw when no callback registered and button clicked', () => {
      expect(() => document.getElementById('btnRestart')!.click()).not.toThrow();
    });
  });

  describe('onBackToMenu', () => {
    it('registers a callback that fires on button click', () => {
      const cb = vi.fn();
      ui.onBackToMenu(cb);
      document.getElementById('btnBackToMenu')!.click();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('does not throw when no callback registered and button clicked', () => {
      expect(() => document.getElementById('btnBackToMenu')!.click()).not.toThrow();
    });
  });

  // ---- setupHud ----

  describe('setupHud', () => {
    it('sets player names', () => {
      const p1 = createSelectableCharData({ name: '趙雲', color: '#22aa44' });
      const p2 = createSelectableCharData({ name: '曹操', color: '#4444cc' });
      ui.setupHud(p1, p2);
      expect(document.getElementById('p1HudName')!.textContent).toBe('趙雲');
      expect(document.getElementById('p2HudName')!.textContent).toBe('曹操');
    });

    it('sets portraits to first character of name', () => {
      const p1 = createSelectableCharData({ name: '趙雲', color: '#22aa44' });
      const p2 = createSelectableCharData({ name: '曹操', color: '#4444cc' });
      ui.setupHud(p1, p2);
      expect(document.getElementById('p1HudPortrait')!.textContent).toBe('趙');
      expect(document.getElementById('p2HudPortrait')!.textContent).toBe('曹');
    });

    it('sets portrait background colors', () => {
      const p1 = createSelectableCharData({ name: 'A', color: '#ff0000' });
      const p2 = createSelectableCharData({ name: 'B', color: '#0000ff' });
      ui.setupHud(p1, p2);
      expect(document.getElementById('p1HudPortrait')!.style.background).toBe('rgb(255, 0, 0)');
      expect(document.getElementById('p2HudPortrait')!.style.background).toBe('rgb(0, 0, 255)');
    });

    it('resets health bars to 100%', () => {
      const p1 = createSelectableCharData();
      const p2 = createSelectableCharData();
      ui.setupHud(p1, p2);
      expect(document.getElementById('p1HealthBar')!.style.width).toBe('100%');
      expect(document.getElementById('p2HealthBar')!.style.width).toBe('100%');
    });

    it('resets energy bars to 0%', () => {
      const p1 = createSelectableCharData();
      const p2 = createSelectableCharData();
      ui.setupHud(p1, p2);
      expect(document.getElementById('p1EnergyBar')!.style.width).toBe('0%');
      expect(document.getElementById('p2EnergyBar')!.style.width).toBe('0%');
    });

    it('sets timer to 99', () => {
      const p1 = createSelectableCharData();
      const p2 = createSelectableCharData();
      ui.setupHud(p1, p2);
      expect(document.getElementById('timerDisplay')!.textContent).toBe('99');
    });

    it('hides round result', () => {
      const roundResult = document.getElementById('roundResult')!;
      roundResult.classList.remove('hidden');
      const p1 = createSelectableCharData();
      const p2 = createSelectableCharData();
      ui.setupHud(p1, p2);
      expect(roundResult.classList.contains('hidden')).toBe(true);
    });
  });

  // ---- updateTimer ----

  describe('updateTimer', () => {
    it('sets timer display text content', () => {
      ui.updateTimer(42);
      expect(document.getElementById('timerDisplay')!.textContent).toBe('42');
    });

    it('sets timer to 0', () => {
      ui.updateTimer(0);
      expect(document.getElementById('timerDisplay')!.textContent).toBe('0');
    });
  });

  // ---- updateHud ----

  describe('updateHud', () => {
    it('updates health bar widths as percentage', () => {
      const p1 = createFighter({ health: 100, maxHealth: HERO_MAX_HEALTH });
      const p2 = createFighter({ health: 50, maxHealth: HERO_MAX_HEALTH });
      ui.updateHud(p1, p2);
      expect(document.getElementById('p1HealthBar')!.style.width).toBe('50%');
      expect(document.getElementById('p2HealthBar')!.style.width).toBe('25%');
    });

    it('updates health bar at full health to 100%', () => {
      const p1 = createFighter({ health: HERO_MAX_HEALTH, maxHealth: HERO_MAX_HEALTH });
      const p2 = createFighter({ health: HERO_MAX_HEALTH, maxHealth: HERO_MAX_HEALTH });
      ui.updateHud(p1, p2);
      expect(document.getElementById('p1HealthBar')!.style.width).toBe('100%');
      expect(document.getElementById('p2HealthBar')!.style.width).toBe('100%');
    });

    describe('health bar colors', () => {
      it('sets green when health > 50%', () => {
        const p1 = createFighter({ health: 120, maxHealth: HERO_MAX_HEALTH }); // 60%
        const p2 = createFighter({ health: HERO_MAX_HEALTH, maxHealth: HERO_MAX_HEALTH });
        ui.updateHud(p1, p2);
        expect(document.getElementById('p1HealthBar')!.style.background).toContain(
          'rgb(34, 204, 68)',
        );
      });

      it('sets yellow when health is between 25% and 50%', () => {
        const p1 = createFighter({ health: 80, maxHealth: HERO_MAX_HEALTH }); // 40%
        const p2 = createFighter({ health: HERO_MAX_HEALTH, maxHealth: HERO_MAX_HEALTH });
        ui.updateHud(p1, p2);
        expect(document.getElementById('p1HealthBar')!.style.background).toContain(
          'rgb(204, 170, 34)',
        );
      });

      it('sets red when health <= 25%', () => {
        const p1 = createFighter({ health: 40, maxHealth: HERO_MAX_HEALTH }); // 20%
        const p2 = createFighter({ health: HERO_MAX_HEALTH, maxHealth: HERO_MAX_HEALTH });
        ui.updateHud(p1, p2);
        expect(document.getElementById('p1HealthBar')!.style.background).toContain(
          'rgb(204, 34, 34)',
        );
      });

      it('sets green at exactly 51%', () => {
        const health = HERO_MAX_HEALTH * 0.51;
        const p1 = createFighter({ health, maxHealth: HERO_MAX_HEALTH });
        const p2 = createFighter({ health: HERO_MAX_HEALTH, maxHealth: HERO_MAX_HEALTH });
        ui.updateHud(p1, p2);
        expect(document.getElementById('p1HealthBar')!.style.background).toContain(
          'rgb(34, 204, 68)',
        );
      });

      it('sets yellow at exactly 50%', () => {
        const health = HERO_MAX_HEALTH * 0.5;
        const p1 = createFighter({ health, maxHealth: HERO_MAX_HEALTH });
        const p2 = createFighter({ health: HERO_MAX_HEALTH, maxHealth: HERO_MAX_HEALTH });
        ui.updateHud(p1, p2);
        expect(document.getElementById('p1HealthBar')!.style.background).toContain(
          'rgb(204, 170, 34)',
        );
      });

      it('sets red at exactly 25%', () => {
        const health = HERO_MAX_HEALTH * 0.25;
        const p1 = createFighter({ health, maxHealth: HERO_MAX_HEALTH });
        const p2 = createFighter({ health: HERO_MAX_HEALTH, maxHealth: HERO_MAX_HEALTH });
        ui.updateHud(p1, p2);
        expect(document.getElementById('p1HealthBar')!.style.background).toContain(
          'rgb(204, 34, 34)',
        );
      });
    });

    describe('energy bar', () => {
      it('adds energy-full class and golden gradient at max energy', () => {
        const p1 = createFighter({ energy: MAX_ENERGY, maxEnergy: MAX_ENERGY });
        const p2 = createFighter({ energy: MAX_ENERGY, maxEnergy: MAX_ENERGY });
        ui.updateHud(p1, p2);
        const p1Bar = document.getElementById('p1EnergyBar')!;
        const p2Bar = document.getElementById('p2EnergyBar')!;
        expect(p1Bar.classList.contains('energy-full')).toBe(true);
        expect(p2Bar.classList.contains('energy-full')).toBe(true);
        expect(p1Bar.style.background).toContain('rgb(255, 221, 0)');
        expect(p2Bar.style.background).toContain('rgb(255, 221, 0)');
      });

      it('removes energy-full class and uses blue gradient below max', () => {
        const p1 = createFighter({ energy: 50, maxEnergy: MAX_ENERGY });
        const p2 = createFighter({ energy: 50, maxEnergy: MAX_ENERGY });
        ui.updateHud(p1, p2);
        const p1Bar = document.getElementById('p1EnergyBar')!;
        const p2Bar = document.getElementById('p2EnergyBar')!;
        expect(p1Bar.classList.contains('energy-full')).toBe(false);
        expect(p2Bar.classList.contains('energy-full')).toBe(false);
        expect(p1Bar.style.background).toContain('rgb(0, 136, 255)');
        expect(p2Bar.style.background).toContain('rgb(0, 136, 255)');
      });

      it('updates energy bar width as percentage', () => {
        const p1 = createFighter({ energy: 75, maxEnergy: MAX_ENERGY });
        const p2 = createFighter({ energy: 25, maxEnergy: MAX_ENERGY });
        ui.updateHud(p1, p2);
        expect(document.getElementById('p1EnergyBar')!.style.width).toBe('75%');
        expect(document.getElementById('p2EnergyBar')!.style.width).toBe('25%');
      });

      it('transitions from full to non-full removes energy-full class', () => {
        const p1 = createFighter({ energy: MAX_ENERGY, maxEnergy: MAX_ENERGY });
        const p2 = createFighter({ energy: MAX_ENERGY, maxEnergy: MAX_ENERGY });
        ui.updateHud(p1, p2);
        expect(document.getElementById('p1EnergyBar')!.classList.contains('energy-full')).toBe(
          true,
        );
        // Reduce energy
        p1.energy = 50;
        ui.updateHud(p1, p2);
        expect(document.getElementById('p1EnergyBar')!.classList.contains('energy-full')).toBe(
          false,
        );
      });
    });

    describe('knockdown bar', () => {
      it('updates knockdown bar widths as percentage', () => {
        const p1 = createFighter({ knockdownBar: 50, knockdownBarMax: 100 });
        const p2 = createFighter({ knockdownBar: 75, knockdownBarMax: 100 });
        ui.updateHud(p1, p2);
        expect(document.getElementById('p1KnockdownBar')!.style.width).toBe('50%');
        expect(document.getElementById('p2KnockdownBar')!.style.width).toBe('75%');
      });
    });
  });

  // ---- showResult ----

  describe('showResult', () => {
    const p1Char = createSelectableCharData({ name: '趙雲' });
    const p2Char = createSelectableCharData({ name: '曹操' });

    it('returns TIE when both players are dead', () => {
      const p1 = createFighter({ dead: true, health: 0 });
      const p2 = createFighter({ dead: true, health: 0 });
      const { result, p1Won } = ui.showResult(p1, p2, p1Char, p2Char, 'versus', false);
      expect(result).toBe('平手！ TIE!');
      expect(p1Won).toBe(false);
      expect(document.getElementById('resultText')!.textContent).toBe('平手！ TIE!');
    });

    it('returns P2 wins when P1 is dead', () => {
      const p1 = createFighter({ dead: true, health: 0 });
      const p2 = createFighter({ dead: false, health: 100 });
      const { result, p1Won } = ui.showResult(p1, p2, p1Char, p2Char, 'versus', false);
      expect(result).toBe('曹操 獲勝！');
      expect(p1Won).toBe(false);
    });

    it('returns P1 wins when P2 is dead with p1Won=true', () => {
      const p1 = createFighter({ dead: false, health: 100 });
      const p2 = createFighter({ dead: true, health: 0 });
      const { result, p1Won } = ui.showResult(p1, p2, p1Char, p2Char, 'versus', false);
      expect(result).toBe('趙雲 獲勝！');
      expect(p1Won).toBe(true);
    });

    it('higher health wins on timeout (P1 higher)', () => {
      const p1 = createFighter({ dead: false, health: 150 });
      const p2 = createFighter({ dead: false, health: 80 });
      const { result, p1Won } = ui.showResult(p1, p2, p1Char, p2Char, 'versus', false);
      expect(result).toBe('趙雲 獲勝！');
      expect(p1Won).toBe(true);
    });

    it('higher health wins on timeout (P2 higher)', () => {
      const p1 = createFighter({ dead: false, health: 50 });
      const p2 = createFighter({ dead: false, health: 120 });
      const { result, p1Won } = ui.showResult(p1, p2, p1Char, p2Char, 'versus', false);
      expect(result).toBe('曹操 獲勝！');
      expect(p1Won).toBe(false);
    });

    it('returns TIE when timeout and equal health', () => {
      const p1 = createFighter({ dead: false, health: 100 });
      const p2 = createFighter({ dead: false, health: 100 });
      const { result, p1Won } = ui.showResult(p1, p2, p1Char, p2Char, 'versus', false);
      expect(result).toBe('平手！ TIE!');
      expect(p1Won).toBe(false);
    });

    it('removes hidden class from roundResult', () => {
      const p1 = createFighter({ dead: true, health: 0 });
      const p2 = createFighter({ dead: false, health: 100 });
      ui.showResult(p1, p2, p1Char, p2Char, 'versus', false);
      expect(document.getElementById('roundResult')!.classList.contains('hidden')).toBe(false);
    });

    describe('story mode button text', () => {
      it('shows "繼續 →" when P1 wins in story mode', () => {
        const p1 = createFighter({ dead: false, health: 100 });
        const p2 = createFighter({ dead: true, health: 0 });
        ui.showResult(p1, p2, p1Char, p2Char, 'story', false);
        expect(document.getElementById('btnRestart')!.textContent).toBe('繼續 →');
      });

      it('shows "再試一次" when P1 loses in story mode', () => {
        const p1 = createFighter({ dead: true, health: 0 });
        const p2 = createFighter({ dead: false, health: 100 });
        ui.showResult(p1, p2, p1Char, p2Char, 'story', false);
        expect(document.getElementById('btnRestart')!.textContent).toBe('再試一次');
      });

      it('shows "再試一次" on TIE in story mode', () => {
        const p1 = createFighter({ dead: true, health: 0 });
        const p2 = createFighter({ dead: true, health: 0 });
        ui.showResult(p1, p2, p1Char, p2Char, 'story', false);
        expect(document.getElementById('btnRestart')!.textContent).toBe('再試一次');
      });
    });

    describe('non-story mode button text', () => {
      it('shows "再來一局" regardless of outcome', () => {
        const p1 = createFighter({ dead: false, health: 100 });
        const p2 = createFighter({ dead: true, health: 0 });
        ui.showResult(p1, p2, p1Char, p2Char, 'versus', false);
        expect(document.getElementById('btnRestart')!.textContent).toBe('再來一局');
      });
    });
  });

  // ---- hideResult ----

  describe('hideResult', () => {
    it('adds hidden class to roundResult', () => {
      const roundResult = document.getElementById('roundResult')!;
      roundResult.classList.remove('hidden');
      ui.hideResult();
      expect(roundResult.classList.contains('hidden')).toBe(true);
    });

    it('keeps hidden class if already hidden', () => {
      const roundResult = document.getElementById('roundResult')!;
      roundResult.classList.add('hidden');
      ui.hideResult();
      expect(roundResult.classList.contains('hidden')).toBe(true);
    });
  });

  // ---- populateBattleMoveList ----

  describe('populateBattleMoveList', () => {
    it('creates sections with move data for both players', () => {
      const p1 = createSelectableCharData({ name: '趙雲', color: '#22aa44' });
      const p2 = createSelectableCharData({ name: '曹操', color: '#4444cc' });
      ui.populateBattleMoveList(p1, p2);

      const content = document.getElementById('battleMoveListContent')!;
      const sections = content.querySelectorAll('.battle-movelist-section');
      expect(sections.length).toBe(2);
    });

    it('shows command strings and energy costs in move list', () => {
      const p1 = createSelectableCharData();
      ui.populateBattleMoveList(p1, null);

      const content = document.getElementById('battleMoveListContent')!;
      const moveCmd = content.querySelector('.bml-move-cmd');
      expect(moveCmd).not.toBeNull();
      // Command D, DF, F maps to ↓ ↘ →
      expect(moveCmd!.textContent).toContain('↓ ↘ →');
      expect(moveCmd!.textContent).toContain('20');
    });

    it('shows ultimate move info', () => {
      const p1 = createSelectableCharData();
      ui.populateBattleMoveList(p1, null);

      const content = document.getElementById('battleMoveListContent')!;
      const ultimate = content.querySelector('.bml-ultimate');
      expect(ultimate).not.toBeNull();
      expect(ultimate!.textContent).toContain('七進七出');
      expect(ultimate!.textContent).toContain('滿氣+U+I');
    });

    it('shows P2 ultimate with correct key bindings', () => {
      const p1 = createSelectableCharData({ name: 'A' });
      const p2 = createSelectableCharData({ name: 'B' });
      ui.populateBattleMoveList(p1, p2);

      const content = document.getElementById('battleMoveListContent')!;
      const sections = content.querySelectorAll('.battle-movelist-section');
      const p2Section = sections[1];
      const ultimate = p2Section.querySelector('.bml-ultimate .bml-move-cmd');
      expect(ultimate!.textContent).toContain('滿氣+Enter+/');
    });

    it('skips soldier P2 character', () => {
      const p1 = createSelectableCharData({ name: '趙雲' });
      const p2 = createSelectableCharData({ name: '士兵', isSoldier: true });
      ui.populateBattleMoveList(p1, p2);

      const content = document.getElementById('battleMoveListContent')!;
      const sections = content.querySelectorAll('.battle-movelist-section');
      expect(sections.length).toBe(1);
      expect(content.textContent).toContain('P1');
      expect(content.textContent).not.toContain('P2');
    });

    it('handles null p1 and p2', () => {
      ui.populateBattleMoveList(null, null);
      const content = document.getElementById('battleMoveListContent')!;
      expect(content.children.length).toBe(0);
    });

    it('sets move name color from move data', () => {
      const p1 = createSelectableCharData();
      ui.populateBattleMoveList(p1, null);

      const content = document.getElementById('battleMoveListContent')!;
      const moveName = content.querySelector('.bml-move-name') as HTMLElement;
      expect(moveName.style.color).toBe('rgb(0, 255, 0)');
    });

    it('displays character name in section header with color', () => {
      const p1 = createSelectableCharData({ name: '趙雲', color: '#22aa44' });
      ui.populateBattleMoveList(p1, null);

      const content = document.getElementById('battleMoveListContent')!;
      const heading = content.querySelector('h4') as HTMLElement;
      expect(heading.textContent).toContain('P1');
      expect(heading.textContent).toContain('趙雲');
      expect(heading.style.color).toBe('rgb(34, 170, 68)');
    });
  });

  // ---- resetBattleMoveList ----

  describe('resetBattleMoveList', () => {
    it('adds collapsed class to battleMoveList', () => {
      const moveList = document.getElementById('battleMoveList')!;
      moveList.classList.remove('collapsed');
      ui.resetBattleMoveList();
      expect(moveList.classList.contains('collapsed')).toBe(true);
    });

    it('resets toggle button text to "招式表 ▶"', () => {
      const btn = document.getElementById('btnToggleBattleMoves')!;
      btn.textContent = '◀ 收起';
      ui.resetBattleMoveList();
      expect(btn.textContent).toBe('招式表 ▶');
    });
  });

  // ---- Battle move list toggle ----

  describe('battle move list toggle', () => {
    it('toggles collapsed class on click', () => {
      const moveList = document.getElementById('battleMoveList')!;
      const btn = document.getElementById('btnToggleBattleMoves')!;

      moveList.classList.add('collapsed');
      btn.click();
      expect(moveList.classList.contains('collapsed')).toBe(false);
      expect(btn.textContent).toBe('◀ 收起');

      btn.click();
      expect(moveList.classList.contains('collapsed')).toBe(true);
      expect(btn.textContent).toBe('招式表 ▶');
    });
  });
});
