// ============================================================
// GameEngine.ts — Main game loop, canvas management, state management
// ============================================================

import { GROUND_Y, STAGE_COUNT, DIFFICULTY_SETTINGS } from '../constants';
import { Fighter } from '../entities/Fighter';
import { BackgroundRenderer } from '../rendering/BackgroundRenderer';
import { EffectsRenderer } from '../rendering/EffectsRenderer';
import { AIController } from '../ai/AIController';
import { InputManager } from './InputManager';
import { BattleUI } from '../ui/screens/BattleUI';
import { CharacterSelect } from '../ui/screens/CharacterSelect';
import type { SelectableCharData } from '../ui/screens/CharacterSelect';
import { StoryMode } from '../ui/screens/StoryMode';
import { MoveListOverlay } from '../ui/screens/MoveListOverlay';

export class GameEngine {
  /* ---- Canvas ---- */
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;

  /* ---- Sub-systems ---- */
  private bg = new BackgroundRenderer();
  private effects = new EffectsRenderer();
  private ai = new AIController();
  private input = new InputManager();
  private battleUI = new BattleUI();
  private charSelect = new CharacterSelect();
  private storyMode = new StoryMode();
  private moveList = new MoveListOverlay();

  /* ---- Game state ---- */
  private gameMode = '';
  private gameRunning = false;
  private animFrameId: number | null = null;
  private timer = 99;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private currentStage = 0;
  private gameDifficulty = 'easy';

  /* ---- Fighter refs ---- */
  private player1: Fighter | null = null;
  private player2: Fighter | null = null;
  private p1Char: SelectableCharData | null = null;
  private p2Char: SelectableCharData | null = null;

  /* ---- DOM refs ---- */
  private gameScreen!: HTMLElement;
  private charSelectScreen!: HTMLElement;
  private storySelectScreen!: HTMLElement;
  private dialogOverlay!: HTMLElement;

  // ---- Public init ----

  init(): void {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.gameScreen = document.getElementById('gameScreen')!;
    this.charSelectScreen = document.getElementById('charSelectScreen')!;
    this.storySelectScreen = document.getElementById('storySelectScreen')!;
    this.dialogOverlay = document.getElementById('dialogOverlay')!;

    // Init sub-systems
    this.input.init();
    this.charSelect.init(this.input.isMobile);
    this.battleUI.init();
    this.storyMode.init(this.input.isMobile, this.ctx);
    this.moveList.init();

    // Wire callbacks
    this.charSelect.onFight(() => this.onFightRequested());
    this.charSelect.onStory(() => this.storyMode.showScreen());

    this.storyMode.onStartGame(() => this.onStoryBattleStart());
    this.storyMode.onBackToMenu(() => this.backToMenu());

    this.battleUI.onRestart(() => this.onRestartClicked());
    this.battleUI.onBackToMenu(() => this.backToMenu());
  }

  // ---- Fight flow ----

  private onFightRequested(): void {
    this.gameMode = this.charSelect.gameMode;
    this.gameDifficulty = this.charSelect.getDifficulty();
    this.p1Char = this.charSelect.p1Char;
    this.p2Char = this.charSelect.p2Char;
    this.startGame();
  }

  private onStoryBattleStart(): void {
    this.gameMode = 'story';
    this.gameDifficulty = this.charSelect.getDifficulty();
    this.p1Char = this.storyMode.p1Char;
    this.p2Char = this.storyMode.p2Char;
    this.startGame();
  }

  private onRestartClicked(): void {
    this.battleUI.hideResult();
    if (this.gameMode === 'story') {
      if (this.storyMode.storyP1Won) {
        this.storyMode.storyNextStep();
      } else {
        this.startGame();
      }
    } else {
      this.startGame();
    }
  }

  private backToMenu(): void {
    this.stopGame();
    this.battleUI.hideResult();
    this.gameScreen.classList.add('hidden');
    this.storyMode.hideAllOverlays();
    this.charSelect.resetToMenu();
    this.charSelectScreen.classList.remove('hidden');
    this.storySelectScreen.classList.add('hidden');
    this.p1Char = null;
    this.p2Char = null;
    if (this.input.isMobile) {
      document.body.style.overflow = '';
    }
  }

  // ---- Start / Stop ----

  private startGame(): void {
    this.stopGame();

    this.charSelectScreen.classList.add('hidden');
    this.storySelectScreen.classList.add('hidden');
    this.gameScreen.classList.remove('hidden');
    this.battleUI.hideResult();
    this.dialogOverlay.classList.add('hidden');

    if (this.input.isMobile) {
      document.body.style.overflow = 'hidden';
    }

    this.effects.reset();

    const p1 = this.p1Char!;
    const p2 = this.p2Char!;

    const fHeight = 140;
    const isSoldierP2 = !!(p2 as SelectableCharData).isSoldier;
    const soldierP2Height = isSoldierP2 ? 100 : fHeight;

    this.player1 = new Fighter({
      position: { x: 200, y: GROUND_Y - fHeight },
      color: p1.color,
      width: 55,
      height: fHeight,
      facingRight: true,
      charData: p1,
      isSoldier: false,
      attackBox: { offset: { x: 10, y: 20 }, width: 90, height: 40 },
    });

    this.player2 = new Fighter({
      position: { x: 700, y: GROUND_Y - soldierP2Height },
      color: p2.color,
      width: isSoldierP2 ? 40 : 55,
      height: soldierP2Height,
      facingRight: false,
      charData: p2,
      isSoldier: isSoldierP2,
      soldierType: isSoldierP2 ? ((p2 as SelectableCharData).soldierType ?? null) : null,
      attackBox: {
        offset: { x: 10, y: 20 },
        width:
          isSoldierP2 && (p2 as SelectableCharData).soldierType
            ? (p2 as SelectableCharData).soldierType!.attackRange || 60
            : 90,
        height: isSoldierP2 ? 30 : 40,
      },
    });

    this.applyStats(this.player1, p1.stats);
    this.applyStats(this.player2, p2.stats);

    // Apply difficulty multipliers to CPU (player2)
    if (this.gameMode === 'pvcpu' || this.gameMode === 'story') {
      const diff = DIFFICULTY_SETTINGS[this.gameDifficulty] || DIFFICULTY_SETTINGS.easy;
      const boostedStats = {
        atk: Math.min(10, p2.stats.atk + diff.statBonus),
        def: Math.min(10, p2.stats.def + diff.statBonus),
        spd: Math.min(10, p2.stats.spd + diff.statBonus),
      };
      this.applyStats(this.player2, boostedStats);
      this.player2._atkMultiplier *= diff.dmgMultiplier;
    }

    this.battleUI.setupHud(p1, p2);

    this.timer = 99;
    this.battleUI.updateTimer(this.timer);
    this.timerInterval = setInterval(() => {
      if (!this.gameRunning) return;
      this.timer--;
      this.battleUI.updateTimer(this.timer);
      if (this.timer <= 0) {
        this.endRound();
      }
    }, 1000);

    this.bg.initParticles();
    if (this.moveList.selectedStage >= 0) {
      this.currentStage = this.moveList.selectedStage;
    } else {
      this.currentStage = Math.floor(Math.random() * STAGE_COUNT);
    }

    this.battleUI.populateBattleMoveList(this.p1Char, this.p2Char);
    this.battleUI.resetBattleMoveList();

    this.ai.setDifficulty(this.gameDifficulty);
    this.input.setGameState(true, this.gameMode, this.player1, this.player2);

    this.gameRunning = true;
    this.animFrameId = requestAnimationFrame(() => this.gameLoop());

    if (this.input.isMobile) {
      this.input.showMobileControls();
      this.input.scaleCanvasForMobile();
    }
  }

  private applyStats(fighter: Fighter, stats: { atk: number; def: number; spd: number }): void {
    fighter._atkMultiplier = 0.7 + stats.atk * 0.06;
    fighter._defMultiplier = 1 - stats.def * 0.04;
    fighter.speed = 3.5 + stats.spd * 0.35;
  }

  private stopGame(): void {
    this.gameRunning = false;
    this.input.setGameState(false, this.gameMode, null, null);
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.input.hideMobileControls();
  }

  // ---- Game Loop ----

  private gameLoop(): void {
    if (!this.gameRunning) return;

    this.effects.updateSlowMotion();
    this.animFrameId = requestAnimationFrame(() => this.gameLoop());

    const shakeApplied = this.effects.applyScreenShake(this.ctx);

    this.bg.drawBackground(this.ctx, this.currentStage);

    if (this.input.isMobile) {
      this.input.applyMobileInput();
    }

    const p1 = this.player1!;
    const p2 = this.player2!;

    if (this.gameMode === 'pvcpu' || this.gameMode === 'story') {
      this.ai.update(p2, p1);
    }

    p1.updateFighter(this.ctx, p2);
    p2.updateFighter(this.ctx, p1);

    this.effects.checkAttackCollision(p1, p2);
    this.effects.checkAttackCollision(p2, p1);

    this.effects.updateProjectiles(this.ctx, p1, p2);
    this.effects.drawHitEffects(this.ctx);
    this.effects.drawScreenFlash(this.ctx);

    if (shakeApplied) {
      this.ctx.restore();
    }

    this.battleUI.updateHud(p1, p2);

    // Wait for death animation to complete before ending round
    if (p1.dead || p2.dead) {
      let allDone = true;
      if (p1.dead && !p1.deathAnimDone) allDone = false;
      if (p2.dead && !p2.deathAnimDone) allDone = false;
      if (allDone) {
        this.endRound();
      }
    }
  }

  // ---- End Round ----

  private endRound(): void {
    if (!this.gameRunning) return;
    this.stopGame();

    const p1 = this.player1!;
    const p2 = this.player2!;
    const { p1Won } = this.battleUI.showResult(
      p1,
      p2,
      this.p1Char!,
      this.p2Char!,
      this.gameMode,
      this.storyMode.storyP1Won,
    );

    if (this.gameMode === 'story') {
      this.storyMode.storyP1Won = p1Won;
    }
  }
}
