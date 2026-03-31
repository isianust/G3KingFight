import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameEngine } from '../core/GameEngine';
import { Fighter } from '../entities/Fighter';
import { DIFFICULTY_SETTINGS } from '../constants/gameConfig';
import type { SelectableCharData } from '../ui/screens/CharacterSelect';

// ---- Helpers ----

function createMockCharData(overrides: Partial<SelectableCharData> = {}): SelectableCharData {
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
  } as SelectableCharData;
}

function setupDOM(): void {
  document.body.innerHTML = `
    <canvas id="gameCanvas" width="1024" height="576"></canvas>
    <div id="gameScreen" class="hidden"></div>
    <div id="charSelectScreen"></div>
    <div id="storySelectScreen" class="hidden"></div>
    <div id="dialogOverlay" class="hidden"></div>
    <div id="modeSelect"></div>
    <div id="charSelectPanel" class="hidden"></div>
    <div id="selectLabel"></div>
    <div id="charGrid"></div>
    <button id="btnFight" class="hidden"></button>
    <div id="p1Portrait">P1</div>
    <div id="p2Portrait">P2</div>
    <div id="p1Name">---</div>
    <div id="p2Name">---</div>
    <button id="btnPvP"></button>
    <button id="btnPvCPU"></button>
    <button id="btnStory"></button>
    <div id="p1CharInfo"></div>
    <div id="p2CharInfo"></div>
    <div id="p1HealthBar"></div>
    <div id="p2HealthBar"></div>
    <div id="p1EnergyBar"></div>
    <div id="p2EnergyBar"></div>
    <div id="p1KnockdownBar"></div>
    <div id="p2KnockdownBar"></div>
    <div id="p1HudName"></div>
    <div id="p2HudName"></div>
    <div id="p1HudPortrait"></div>
    <div id="p2HudPortrait"></div>
    <div id="timerDisplay"></div>
    <div id="roundResult" class="hidden"></div>
    <div id="resultText"></div>
    <button id="btnRestart"></button>
    <button id="btnBackToMenu"></button>
    <div id="battleMoveList"></div>
    <div id="battleMoveListContent"></div>
    <button id="btnToggleBattleMoves"></button>
    <div id="mobileControls" class="hidden"></div>
    <div id="joystickArea"></div>
    <div id="joystickBase"></div>
    <div id="joystickThumb"></div>
    <div id="hud"></div>
    <div id="moveListOverlay" class="hidden"></div>
    <div id="moveListContent"></div>
    <div id="stageListOverlay" class="hidden"></div>
    <div id="stageListContent"></div>
    <div id="imageListOverlay" class="hidden"></div>
    <div id="imageListContent"></div>
    <button id="btnMoveList"></button>
    <button id="btnCloseMoveList"></button>
    <button id="btnStageList"></button>
    <button id="btnCloseStageList"></button>
    <button id="btnImageList"></button>
    <button id="btnCloseImageList"></button>
    <button class="diff-btn selected" data-diff="easy"></button>
    <button class="diff-btn" data-diff="normal"></button>
    <button class="diff-btn" data-diff="hard"></button>
    <div id="storyCampaigns"></div>
    <div id="storyMapOverlay" class="hidden"></div>
    <div id="storyMapTitle"></div>
    <div id="storyMapContent"></div>
    <button id="btnStoryMapContinue"></button>
    <div id="dialogPortrait"></div>
    <div id="dialogSpeaker"></div>
    <div id="dialogText"></div>
    <button id="btnDialogNext"></button>
  `;
}

/**
 * Accesses a private property on GameEngine for test assertions.
 */
function getPrivate<T>(engine: GameEngine, key: string): T {
  return (engine as unknown as Record<string, unknown>)[key] as T;
}

// ============ Tests ============

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    // Stub requestAnimationFrame / cancelAnimationFrame so the game loop
    // doesn't actually run in the background during unit tests.
    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    setupDOM();
    engine = new GameEngine();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ---- Construction ----

  describe('constructor', () => {
    it('creates an instance without throwing', () => {
      expect(engine).toBeInstanceOf(GameEngine);
    });

    it('initialises game state defaults', () => {
      expect(getPrivate<boolean>(engine, 'gameRunning')).toBe(false);
      expect(getPrivate<string>(engine, 'gameMode')).toBe('');
      expect(getPrivate<number>(engine, 'timer')).toBe(99);
      expect(getPrivate<string>(engine, 'gameDifficulty')).toBe('easy');
      expect(getPrivate<number>(engine, 'currentStage')).toBe(0);
    });

    it('starts with null fighter refs', () => {
      expect(getPrivate<Fighter | null>(engine, 'player1')).toBeNull();
      expect(getPrivate<Fighter | null>(engine, 'player2')).toBeNull();
      expect(getPrivate<SelectableCharData | null>(engine, 'p1Char')).toBeNull();
      expect(getPrivate<SelectableCharData | null>(engine, 'p2Char')).toBeNull();
    });
  });

  // ---- init ----

  describe('init()', () => {
    it('runs without throwing', () => {
      expect(() => engine.init()).not.toThrow();
    });

    it('binds the canvas element', () => {
      engine.init();
      const canvas = getPrivate<HTMLCanvasElement>(engine, 'canvas');
      expect(canvas).toBeDefined();
      expect(canvas.tagName).toBe('CANVAS');
      expect(canvas.id).toBe('gameCanvas');
    });

    it('obtains a 2d rendering context', () => {
      engine.init();
      const ctx = getPrivate<CanvasRenderingContext2D>(engine, 'ctx');
      expect(ctx).toBeDefined();
    });

    it('binds DOM screen refs', () => {
      engine.init();
      expect(getPrivate<HTMLElement>(engine, 'gameScreen')).toBeDefined();
      expect(getPrivate<HTMLElement>(engine, 'charSelectScreen')).toBeDefined();
      expect(getPrivate<HTMLElement>(engine, 'storySelectScreen')).toBeDefined();
      expect(getPrivate<HTMLElement>(engine, 'dialogOverlay')).toBeDefined();
    });

    it('initialises sub-systems without errors', () => {
      // Calling init() exercises InputManager.init(), CharacterSelect.init(),
      // BattleUI.init(), StoryMode.init(), MoveListOverlay.init() internally.
      engine.init();
      // If any sub-system init fails it would throw; reaching here is success.
      expect(getPrivate(engine, 'input')).toBeDefined();
      expect(getPrivate(engine, 'charSelect')).toBeDefined();
      expect(getPrivate(engine, 'battleUI')).toBeDefined();
      expect(getPrivate(engine, 'storyMode')).toBeDefined();
      expect(getPrivate(engine, 'moveList')).toBeDefined();
    });

    it('wires CharacterSelect onFight callback', () => {
      engine.init();
      const charSelect = getPrivate<{ _onFight: (() => void) | null }>(engine, 'charSelect');
      expect(charSelect._onFight).toBeInstanceOf(Function);
    });

    it('wires CharacterSelect onStory callback', () => {
      engine.init();
      const charSelect = getPrivate<{ _onStory: (() => void) | null }>(engine, 'charSelect');
      expect(charSelect._onStory).toBeInstanceOf(Function);
    });

    it('wires BattleUI onRestart callback', () => {
      engine.init();
      const battleUI = getPrivate<{ _onRestart: (() => void) | null }>(engine, 'battleUI');
      expect(battleUI._onRestart).toBeInstanceOf(Function);
    });

    it('wires BattleUI onBackToMenu callback', () => {
      engine.init();
      const battleUI = getPrivate<{ _onBackToMenu: (() => void) | null }>(engine, 'battleUI');
      expect(battleUI._onBackToMenu).toBeInstanceOf(Function);
    });

    it('wires StoryMode onStartGame callback', () => {
      engine.init();
      const storyMode = getPrivate<{ _onStartGame: (() => void) | null }>(engine, 'storyMode');
      expect(storyMode._onStartGame).toBeInstanceOf(Function);
    });

    it('wires StoryMode onBackToMenu callback', () => {
      engine.init();
      const storyMode = getPrivate<{ _onBackToMenu: (() => void) | null }>(engine, 'storyMode');
      expect(storyMode._onBackToMenu).toBeInstanceOf(Function);
    });
  });

  // ---- applyStats formula ----

  describe('applyStats (formula correctness)', () => {
    // applyStats is private, so we test it indirectly by triggering startGame
    // and inspecting the resulting Fighter multipliers.

    function startGameWithStats(
      eng: GameEngine,
      p1Stats: { atk: number; def: number; spd: number },
      p2Stats: { atk: number; def: number; spd: number },
    ): { player1: Fighter; player2: Fighter } {
      eng.init();
      const charSelect = getPrivate<{
        gameMode: string;
        p1Char: SelectableCharData | null;
        p2Char: SelectableCharData | null;
        getDifficulty: () => string;
      }>(eng, 'charSelect');

      charSelect.gameMode = 'pvp';
      charSelect.p1Char = createMockCharData({ stats: p1Stats });
      charSelect.p2Char = createMockCharData({ stats: p2Stats, id: 'test_char2', name: '張飛' });

      // Trigger the fight flow
      (getPrivate<{ _onFight: (() => void) | null }>(eng, 'charSelect') as { _onFight: () => void })
        ._onFight!();

      return {
        player1: getPrivate<Fighter>(eng, 'player1'),
        player2: getPrivate<Fighter>(eng, 'player2'),
      };
    }

    it('computes _atkMultiplier = 0.7 + atk * 0.06', () => {
      const stats = { atk: 7, def: 0, spd: 0 };
      const { player1 } = startGameWithStats(engine, stats, stats);
      const expected = 0.7 + 7 * 0.06; // 1.12
      expect(player1._atkMultiplier).toBeCloseTo(expected, 5);
    });

    it('computes _defMultiplier = 1 - def * 0.04', () => {
      const stats = { atk: 0, def: 6, spd: 0 };
      const { player1 } = startGameWithStats(engine, stats, stats);
      const expected = 1 - 6 * 0.04; // 0.76
      expect(player1._defMultiplier).toBeCloseTo(expected, 5);
    });

    it('computes speed = 3.5 + spd * 0.35', () => {
      const stats = { atk: 0, def: 0, spd: 5 };
      const { player1 } = startGameWithStats(engine, stats, stats);
      const expected = 3.5 + 5 * 0.35; // 5.25
      expect(player1.speed).toBeCloseTo(expected, 5);
    });

    it('handles max stat values (10/10/10)', () => {
      const stats = { atk: 10, def: 10, spd: 10 };
      const { player1 } = startGameWithStats(engine, stats, stats);
      expect(player1._atkMultiplier).toBeCloseTo(0.7 + 10 * 0.06, 5); // 1.3
      expect(player1._defMultiplier).toBeCloseTo(1 - 10 * 0.04, 5); // 0.6
      expect(player1.speed).toBeCloseTo(3.5 + 10 * 0.35, 5); // 7.0
    });

    it('handles zero stat values (0/0/0)', () => {
      const stats = { atk: 0, def: 0, spd: 0 };
      const { player1 } = startGameWithStats(engine, stats, stats);
      expect(player1._atkMultiplier).toBeCloseTo(0.7, 5);
      expect(player1._defMultiplier).toBeCloseTo(1.0, 5);
      expect(player1.speed).toBeCloseTo(3.5, 5);
    });

    it('applies stats independently to both fighters', () => {
      const p1Stats = { atk: 3, def: 8, spd: 2 };
      const p2Stats = { atk: 9, def: 1, spd: 7 };
      const { player1, player2 } = startGameWithStats(engine, p1Stats, p2Stats);

      expect(player1._atkMultiplier).toBeCloseTo(0.7 + 3 * 0.06, 5);
      expect(player1._defMultiplier).toBeCloseTo(1 - 8 * 0.04, 5);
      expect(player1.speed).toBeCloseTo(3.5 + 2 * 0.35, 5);

      expect(player2._atkMultiplier).toBeCloseTo(0.7 + 9 * 0.06, 5);
      expect(player2._defMultiplier).toBeCloseTo(1 - 1 * 0.04, 5);
      expect(player2.speed).toBeCloseTo(3.5 + 7 * 0.35, 5);
    });
  });

  // ---- PvCPU difficulty boost ----

  describe('difficulty boost in PvCPU mode', () => {
    function startPvCPU(
      eng: GameEngine,
      difficulty: string,
      p2Stats: { atk: number; def: number; spd: number } = { atk: 5, def: 5, spd: 5 },
    ): Fighter {
      eng.init();
      const charSelect = getPrivate<{
        gameMode: string;
        p1Char: SelectableCharData | null;
        p2Char: SelectableCharData | null;
        getDifficulty: () => string;
      }>(eng, 'charSelect');

      charSelect.gameMode = 'pvcpu';
      charSelect.p1Char = createMockCharData();
      charSelect.p2Char = createMockCharData({ id: 'cpu_char', stats: p2Stats });

      // Override getDifficulty to return the desired difficulty
      const diffBtns = document.querySelectorAll('.diff-btn');
      diffBtns.forEach((btn) => btn.classList.remove('selected'));
      const target = document.querySelector(`.diff-btn[data-diff="${difficulty}"]`);
      if (target) target.classList.add('selected');

      // Trigger fight
      (getPrivate<{ _onFight: (() => void) | null }>(eng, 'charSelect') as { _onFight: () => void })
        ._onFight!();

      return getPrivate<Fighter>(eng, 'player2');
    }

    it('easy difficulty applies no stat bonus to CPU', () => {
      const p2Stats = { atk: 5, def: 5, spd: 5 };
      const cpu = startPvCPU(engine, 'easy', p2Stats);
      const diff = DIFFICULTY_SETTINGS.easy;

      const boostedAtk = Math.min(10, p2Stats.atk + diff.statBonus); // 5
      const expectedAtk = (0.7 + boostedAtk * 0.06) * diff.dmgMultiplier;
      expect(cpu._atkMultiplier).toBeCloseTo(expectedAtk, 5);
    });

    it('normal difficulty boosts CPU stats by 1', () => {
      const p2Stats = { atk: 5, def: 5, spd: 5 };
      const cpu = startPvCPU(engine, 'normal', p2Stats);
      const diff = DIFFICULTY_SETTINGS.normal;

      // Speed should reflect boosted spd (5+1=6)
      expect(cpu.speed).toBeCloseTo(3.5 + 6 * 0.35, 5);
      // atkMultiplier includes dmgMultiplier
      const boostedAtk = 0.7 + 6 * 0.06;
      expect(cpu._atkMultiplier).toBeCloseTo(boostedAtk * diff.dmgMultiplier, 5);
    });

    it('hard difficulty boosts CPU stats by 2', () => {
      const p2Stats = { atk: 5, def: 5, spd: 5 };
      const cpu = startPvCPU(engine, 'hard', p2Stats);

      expect(cpu.speed).toBeCloseTo(3.5 + 7 * 0.35, 5);
      expect(cpu._defMultiplier).toBeCloseTo(1 - 7 * 0.04, 5);
    });

    it('stat bonuses are clamped to 10', () => {
      const p2Stats = { atk: 9, def: 10, spd: 9 };
      const cpu = startPvCPU(engine, 'hard', p2Stats);

      // atk: min(10, 9+2) = 10, def: min(10, 10+2) = 10, spd: min(10, 9+2) = 10
      expect(cpu._defMultiplier).toBeCloseTo(1 - 10 * 0.04, 5);
      expect(cpu.speed).toBeCloseTo(3.5 + 10 * 0.35, 5);
    });
  });

  // ---- startGame mechanics ----

  describe('startGame (triggered via onFightRequested)', () => {
    function triggerFight(eng: GameEngine, mode = 'pvp'): void {
      eng.init();
      const charSelect = getPrivate<{
        gameMode: string;
        p1Char: SelectableCharData | null;
        p2Char: SelectableCharData | null;
      }>(eng, 'charSelect');

      charSelect.gameMode = mode;
      charSelect.p1Char = createMockCharData();
      charSelect.p2Char = createMockCharData({ id: 'char2', name: '張飛', color: '#228833' });

      (getPrivate<{ _onFight: (() => void) | null }>(eng, 'charSelect') as { _onFight: () => void })
        ._onFight!();
    }

    it('sets gameRunning to true', () => {
      triggerFight(engine);
      expect(getPrivate<boolean>(engine, 'gameRunning')).toBe(true);
    });

    it('creates player1 and player2 Fighter instances', () => {
      triggerFight(engine);
      const p1 = getPrivate<Fighter>(engine, 'player1');
      const p2 = getPrivate<Fighter>(engine, 'player2');
      expect(p1).toBeInstanceOf(Fighter);
      expect(p2).toBeInstanceOf(Fighter);
    });

    it('sets timer to 99', () => {
      triggerFight(engine);
      expect(getPrivate<number>(engine, 'timer')).toBe(99);
    });

    it('calls requestAnimationFrame to start the game loop', () => {
      triggerFight(engine);
      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    it('hides charSelectScreen and shows gameScreen', () => {
      triggerFight(engine);
      expect(document.getElementById('charSelectScreen')!.classList.contains('hidden')).toBe(true);
      expect(document.getElementById('gameScreen')!.classList.contains('hidden')).toBe(false);
    });

    it('stores the selected game mode', () => {
      triggerFight(engine, 'pvcpu');
      expect(getPrivate<string>(engine, 'gameMode')).toBe('pvcpu');
    });

    it('starts the timer interval', () => {
      triggerFight(engine);
      expect(getPrivate(engine, 'timerInterval')).not.toBeNull();
    });

    it('decrements timer each second while running', () => {
      triggerFight(engine);
      vi.advanceTimersByTime(3000);
      expect(getPrivate<number>(engine, 'timer')).toBe(96);
    });
  });

  // ---- stopGame / backToMenu ----

  describe('stopGame and backToMenu', () => {
    function startAndGetEngine(eng: GameEngine): void {
      eng.init();
      const charSelect = getPrivate<{
        gameMode: string;
        p1Char: SelectableCharData | null;
        p2Char: SelectableCharData | null;
      }>(eng, 'charSelect');

      charSelect.gameMode = 'pvp';
      charSelect.p1Char = createMockCharData();
      charSelect.p2Char = createMockCharData({ id: 'char2' });

      (getPrivate<{ _onFight: (() => void) | null }>(eng, 'charSelect') as { _onFight: () => void })
        ._onFight!();
    }

    it('backToMenu resets to char select screen', () => {
      startAndGetEngine(engine);
      // Trigger backToMenu via BattleUI callback
      const battleUI = getPrivate<{ _onBackToMenu: (() => void) | null }>(engine, 'battleUI');
      battleUI._onBackToMenu!();

      expect(getPrivate<boolean>(engine, 'gameRunning')).toBe(false);
      expect(document.getElementById('charSelectScreen')!.classList.contains('hidden')).toBe(false);
      expect(document.getElementById('gameScreen')!.classList.contains('hidden')).toBe(true);
    });

    it('backToMenu clears character refs', () => {
      startAndGetEngine(engine);
      const battleUI = getPrivate<{ _onBackToMenu: (() => void) | null }>(engine, 'battleUI');
      battleUI._onBackToMenu!();

      expect(getPrivate<SelectableCharData | null>(engine, 'p1Char')).toBeNull();
      expect(getPrivate<SelectableCharData | null>(engine, 'p2Char')).toBeNull();
    });

    it('backToMenu calls cancelAnimationFrame', () => {
      startAndGetEngine(engine);
      const battleUI = getPrivate<{ _onBackToMenu: (() => void) | null }>(engine, 'battleUI');
      battleUI._onBackToMenu!();

      expect(cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  // ---- Restart ----

  describe('onRestartClicked', () => {
    function startGame(eng: GameEngine, mode = 'pvp'): void {
      eng.init();
      const charSelect = getPrivate<{
        gameMode: string;
        p1Char: SelectableCharData | null;
        p2Char: SelectableCharData | null;
      }>(eng, 'charSelect');

      charSelect.gameMode = mode;
      charSelect.p1Char = createMockCharData();
      charSelect.p2Char = createMockCharData({ id: 'char2' });

      (getPrivate<{ _onFight: (() => void) | null }>(eng, 'charSelect') as { _onFight: () => void })
        ._onFight!();
    }

    it('restarts the game in pvp mode', () => {
      startGame(engine, 'pvp');
      // Simulate end of round then restart
      const battleUI = getPrivate<{ _onRestart: (() => void) | null }>(engine, 'battleUI');
      battleUI._onRestart!();

      // After restart, game should be running again
      expect(getPrivate<boolean>(engine, 'gameRunning')).toBe(true);
      expect(getPrivate<number>(engine, 'timer')).toBe(99);
    });
  });

  // ---- Character selection flow ----

  describe('character selection flow (PvCPU)', () => {
    it('clicking PvCPU button sets game mode to pvcpu', () => {
      engine.init();
      document.getElementById('btnPvCPU')!.click();

      const charSelect = getPrivate<{ gameMode: string }>(engine, 'charSelect');
      expect(charSelect.gameMode).toBe('pvcpu');
    });

    it('clicking PvP button is disabled on mobile (jsdom detects as mobile)', () => {
      engine.init();
      document.getElementById('btnPvP')!.click();

      // jsdom exposes ontouchstart/maxTouchPoints, so isMobile is true.
      // PvP mode early-returns on mobile, so gameMode stays empty.
      const charSelect = getPrivate<{ gameMode: string }>(engine, 'charSelect');
      expect(charSelect.gameMode).toBe('');
    });

    it('char select panel is shown after mode selection', () => {
      engine.init();
      document.getElementById('btnPvCPU')!.click();

      const panel = document.getElementById('charSelectPanel')!;
      expect(panel.classList.contains('hidden')).toBe(false);
    });

    it('character grid is populated with roster characters', () => {
      engine.init();
      document.getElementById('btnPvCPU')!.click();

      const grid = document.getElementById('charGrid')!;
      expect(grid.children.length).toBeGreaterThan(0);
    });
  });

  // ---- Player positioning ----

  describe('fighter positioning on game start', () => {
    it('player1 starts at x=200 facing right', () => {
      engine.init();
      const charSelect = getPrivate<{
        gameMode: string;
        p1Char: SelectableCharData | null;
        p2Char: SelectableCharData | null;
      }>(engine, 'charSelect');

      charSelect.gameMode = 'pvp';
      charSelect.p1Char = createMockCharData();
      charSelect.p2Char = createMockCharData({ id: 'char2' });

      (
        getPrivate<{ _onFight: (() => void) | null }>(engine, 'charSelect') as {
          _onFight: () => void;
        }
      )._onFight!();

      const p1 = getPrivate<Fighter>(engine, 'player1');
      expect(p1.position.x).toBe(200);
      expect(p1.facingRight).toBe(true);
    });

    it('player2 starts at x=700 facing left', () => {
      engine.init();
      const charSelect = getPrivate<{
        gameMode: string;
        p1Char: SelectableCharData | null;
        p2Char: SelectableCharData | null;
      }>(engine, 'charSelect');

      charSelect.gameMode = 'pvp';
      charSelect.p1Char = createMockCharData();
      charSelect.p2Char = createMockCharData({ id: 'char2' });

      (
        getPrivate<{ _onFight: (() => void) | null }>(engine, 'charSelect') as {
          _onFight: () => void;
        }
      )._onFight!();

      const p2 = getPrivate<Fighter>(engine, 'player2');
      expect(p2.position.x).toBe(700);
      expect(p2.facingRight).toBe(false);
    });
  });

  // ---- Timer logic ----

  describe('timer behaviour', () => {
    function startFight(eng: GameEngine): void {
      eng.init();
      const cs = getPrivate<{
        gameMode: string;
        p1Char: SelectableCharData | null;
        p2Char: SelectableCharData | null;
      }>(eng, 'charSelect');

      cs.gameMode = 'pvp';
      cs.p1Char = createMockCharData();
      cs.p2Char = createMockCharData({ id: 'char2' });

      (getPrivate<{ _onFight: (() => void) | null }>(eng, 'charSelect') as { _onFight: () => void })
        ._onFight!();
    }

    it('timer starts at 99', () => {
      startFight(engine);
      expect(getPrivate<number>(engine, 'timer')).toBe(99);
    });

    it('timer decrements by 1 each second', () => {
      startFight(engine);
      vi.advanceTimersByTime(1000);
      expect(getPrivate<number>(engine, 'timer')).toBe(98);
    });

    it('timer decrements correctly over 5 seconds', () => {
      startFight(engine);
      vi.advanceTimersByTime(5000);
      expect(getPrivate<number>(engine, 'timer')).toBe(94);
    });

    it('timer does not decrement when game is not running', () => {
      startFight(engine);
      // Stop the game via backToMenu
      const battleUI = getPrivate<{ _onBackToMenu: (() => void) | null }>(engine, 'battleUI');
      battleUI._onBackToMenu!();

      const timerBefore = getPrivate<number>(engine, 'timer');
      vi.advanceTimersByTime(5000);
      // Timer interval is cleared, so timer should not change
      expect(getPrivate<number>(engine, 'timer')).toBe(timerBefore);
    });
  });

  // ---- Multiple instantiations ----

  describe('multiple engines', () => {
    it('can create multiple GameEngine instances independently', () => {
      const engine2 = new GameEngine();
      expect(engine).not.toBe(engine2);
      expect(engine).toBeInstanceOf(GameEngine);
      expect(engine2).toBeInstanceOf(GameEngine);
    });
  });
});
