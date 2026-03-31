// ============================================================
// InputManager.ts — Keyboard and touch input handling
// ============================================================

import type { Fighter } from '../entities/Fighter';
import { JOYSTICK_DEAD_ZONE, JOYSTICK_MAX_DIST } from '../constants';

export class InputManager {
  /* ---- Keyboard state ---- */
  private keysDown: Record<string, boolean> = {};

  /* ---- Mobile detection ---- */
  public readonly isMobile: boolean;

  /* ---- Joystick state ---- */
  private joystickActive = false;
  private joystickTouchId: number | null = null;
  private joystickCenter = { x: 0, y: 0 };
  private joystickInput = { x: 0, y: 0 };

  /* ---- Mobile button state ---- */
  private mobileButtonStates: Record<string, boolean> = {};

  /* ---- DOM refs ---- */
  private mobileControls: HTMLElement | null = null;
  private joystickArea: HTMLElement | null = null;
  private joystickBase: HTMLElement | null = null;
  private joystickThumb: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;

  /* ---- Game references (set when game starts) ---- */
  private _gameRunning = false;
  private _player1: Fighter | null = null;
  private _player2: Fighter | null = null;
  private _gameMode = '';

  constructor() {
    this.isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0;

    if (this.isMobile) {
      document.body.classList.add('is-mobile');
    }
  }

  /** Bind DOM elements and attach event listeners. Call once after DOM ready. */
  init(): void {
    this.mobileControls = document.getElementById('mobileControls');
    this.joystickArea = document.getElementById('joystickArea');
    this.joystickBase = document.getElementById('joystickBase');
    this.joystickThumb = document.getElementById('joystickThumb');
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement | null;

    this.bindKeyboard();
    this.bindJoystick();
    this.bindMobileButtons();

    if (this.isMobile) {
      window.addEventListener('resize', () => this.scaleCanvasForMobile());
      window.addEventListener('orientationchange', () => {
        setTimeout(() => this.scaleCanvasForMobile(), 200);
      });
      this.scaleCanvasForMobile();
    }
  }

  /** Called each frame the game loop starts so the manager knows who to route input to. */
  setGameState(running: boolean, mode: string, p1: Fighter | null, p2: Fighter | null): void {
    this._gameRunning = running;
    this._gameMode = mode;
    this._player1 = p1;
    this._player2 = p2;
  }

  // ---- Keyboard ----

  private bindKeyboard(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.keysDown[e.key]) return;
      this.keysDown[e.key] = true;

      if (!this._gameRunning || !this._player1 || !this._player2) return;

      switch (e.key.toLowerCase()) {
        case 'a':
          this._player1.keys.left = true;
          break;
        case 'd':
          this._player1.keys.right = true;
          break;
        case 'w':
          this._player1.keys.jump = true;
          break;
        case 'u':
          e.preventDefault();
          this._player1.keys.attack1 = true;
          break;
        case 'i':
          e.preventDefault();
          this._player1.keys.attack2 = true;
          break;
        case 's':
          this._player1.keys.block = true;
          break;
        case 'e':
          this._player1.keys.charge = true;
          break;
      }

      if (this._gameMode === 'pvp') {
        switch (e.key) {
          case 'ArrowLeft':
            this._player2.keys.left = true;
            e.preventDefault();
            break;
          case 'ArrowRight':
            this._player2.keys.right = true;
            e.preventDefault();
            break;
          case 'ArrowUp':
            this._player2.keys.jump = true;
            e.preventDefault();
            break;
          case 'Enter':
            this._player2.keys.attack1 = true;
            e.preventDefault();
            break;
          case '/':
            this._player2.keys.attack2 = true;
            e.preventDefault();
            break;
          case 'ArrowDown':
            this._player2.keys.block = true;
            e.preventDefault();
            break;
          case '.':
            this._player2.keys.charge = true;
            e.preventDefault();
            break;
        }
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keysDown[e.key] = false;

      if (!this._gameRunning || !this._player1 || !this._player2) return;

      switch (e.key.toLowerCase()) {
        case 'a':
          this._player1.keys.left = false;
          break;
        case 'd':
          this._player1.keys.right = false;
          break;
        case 'w':
          this._player1.keys.jump = false;
          break;
        case 's':
          this._player1.keys.block = false;
          break;
        case 'e':
          this._player1.keys.charge = false;
          break;
        case 'u':
          this._player1.keys.attack1 = false;
          break;
        case 'i':
          this._player1.keys.attack2 = false;
          break;
      }

      if (this._gameMode === 'pvp') {
        switch (e.key) {
          case 'ArrowLeft':
            this._player2.keys.left = false;
            break;
          case 'ArrowRight':
            this._player2.keys.right = false;
            break;
          case 'ArrowUp':
            this._player2.keys.jump = false;
            break;
          case 'ArrowDown':
            this._player2.keys.block = false;
            break;
          case '.':
            this._player2.keys.charge = false;
            break;
        }
      }
    });
  }

  // ---- Mobile controls ----

  showMobileControls(): void {
    if (this.isMobile && this.mobileControls) {
      this.mobileControls.classList.remove('hidden');
    }
  }

  hideMobileControls(): void {
    if (this.mobileControls) {
      this.mobileControls.classList.add('hidden');
    }
  }

  scaleCanvasForMobile(): void {
    if (!this.isMobile || !this.canvas) return;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const scaleX = screenW / 1024;
    const scaleY = screenH / 576;
    const scale = Math.min(scaleX, scaleY);

    const scaledW = Math.floor(1024 * scale);
    const scaledH = Math.floor(576 * scale);

    this.canvas.style.width = scaledW + 'px';
    this.canvas.style.height = scaledH + 'px';

    const gs = document.getElementById('gameScreen');
    if (gs) {
      gs.style.width = scaledW + 'px';
      gs.style.height = scaledH + 'px';
      gs.style.position = 'relative';
      gs.style.overflow = 'hidden';
    }

    const hudEl = document.getElementById('hud');
    if (hudEl) {
      hudEl.style.width = scaledW + 'px';
    }

    const rr = document.getElementById('roundResult');
    if (rr) {
      rr.style.width = scaledW + 'px';
      rr.style.height = scaledH + 'px';
    }
  }

  // ---- Joystick ----

  private bindJoystick(): void {
    if (!this.joystickArea) return;
    const area = this.joystickArea;

    area.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        this.joystickActive = true;
        this.joystickTouchId = touch.identifier;
        if (this.joystickBase) {
          const rect = this.joystickBase.getBoundingClientRect();
          this.joystickCenter.x = rect.left + rect.width / 2;
          this.joystickCenter.y = rect.top + rect.height / 2;
        }
        this.updateJoystickPosition(touch);
      },
      { passive: false },
    );

    area.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.joystickTouchId) {
            this.updateJoystickPosition(e.changedTouches[i]);
            break;
          }
        }
      },
      { passive: false },
    );

    area.addEventListener('touchend', (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.joystickTouchId) {
          this.joystickActive = false;
          this.joystickTouchId = null;
          this.joystickInput.x = 0;
          this.joystickInput.y = 0;
          if (this.joystickThumb) {
            this.joystickThumb.style.transform = 'translate(0px, 0px)';
          }
          break;
        }
      }
    });

    area.addEventListener('touchcancel', () => {
      this.joystickActive = false;
      this.joystickTouchId = null;
      this.joystickInput.x = 0;
      this.joystickInput.y = 0;
      if (this.joystickThumb) {
        this.joystickThumb.style.transform = 'translate(0px, 0px)';
      }
    });
  }

  private updateJoystickPosition(touch: Touch): void {
    let dx = touch.clientX - this.joystickCenter.x;
    let dy = touch.clientY - this.joystickCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > JOYSTICK_MAX_DIST) {
      dx = (dx / dist) * JOYSTICK_MAX_DIST;
      dy = (dy / dist) * JOYSTICK_MAX_DIST;
    }

    this.joystickInput.x = dx / JOYSTICK_MAX_DIST;
    this.joystickInput.y = dy / JOYSTICK_MAX_DIST;

    if (this.joystickThumb) {
      this.joystickThumb.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    }
  }

  // ---- Mobile buttons ----

  private bindMobileButtons(): void {
    const mobileBtns = document.querySelectorAll<HTMLElement>('.mobile-btn');
    mobileBtns.forEach((btn) => {
      const action = btn.getAttribute('data-action');
      if (!action) return;

      btn.addEventListener(
        'touchstart',
        (e: TouchEvent) => {
          e.preventDefault();
          this.mobileButtonStates[action] = true;
          btn.classList.add('active');
        },
        { passive: false },
      );

      btn.addEventListener(
        'touchend',
        (e: TouchEvent) => {
          e.preventDefault();
          this.mobileButtonStates[action] = false;
          btn.classList.remove('active');
        },
        { passive: false },
      );

      btn.addEventListener('touchcancel', () => {
        this.mobileButtonStates[action] = false;
        btn.classList.remove('active');
      });
    });
  }

  /** Apply mobile touch input to player1 — called each frame from game loop. */
  applyMobileInput(): void {
    if (!this.isMobile || !this._gameRunning || !this._player1) return;

    // Joystick → movement
    if (this.joystickInput.x < -JOYSTICK_DEAD_ZONE) {
      this._player1.keys.left = true;
      this._player1.keys.right = false;
    } else if (this.joystickInput.x > JOYSTICK_DEAD_ZONE) {
      this._player1.keys.right = true;
      this._player1.keys.left = false;
    } else {
      this._player1.keys.left = false;
      this._player1.keys.right = false;
    }

    // Joystick up → jump
    if (this.joystickInput.y < -0.5) {
      this._player1.keys.jump = true;
    } else {
      this._player1.keys.jump = false;
    }

    // Mobile buttons
    if (this.mobileButtonStates['attack1']) {
      this._player1.keys.attack1 = true;
      this.mobileButtonStates['attack1'] = false;
    }
    if (this.mobileButtonStates['attack2']) {
      this._player1.keys.attack2 = true;
      this.mobileButtonStates['attack2'] = false;
    }
    if (this.mobileButtonStates['jump']) {
      this._player1.keys.jump = true;
      this.mobileButtonStates['jump'] = false;
    }
    this._player1.keys.block = !!this.mobileButtonStates['block'];
    this._player1.keys.charge = !!this.mobileButtonStates['charge'];

    // Record directional input for special moves from joystick
    if (this.joystickActive) {
      let relDir = '';
      const goingForward =
        (this._player1.facingRight && this.joystickInput.x > JOYSTICK_DEAD_ZONE) ||
        (!this._player1.facingRight && this.joystickInput.x < -JOYSTICK_DEAD_ZONE);
      const goingBack =
        (this._player1.facingRight && this.joystickInput.x < -JOYSTICK_DEAD_ZONE) ||
        (!this._player1.facingRight && this.joystickInput.x > JOYSTICK_DEAD_ZONE);
      const goingDown = this.joystickInput.y > 0.4;
      const goingUp = this.joystickInput.y < -0.4;

      if (goingDown && goingForward) relDir = 'DF';
      else if (goingDown && goingBack) relDir = 'DB';
      else if (goingDown) relDir = 'D';
      else if (goingForward) relDir = 'F';
      else if (goingBack) relDir = 'B';
      else if (goingUp) relDir = 'U';

      if (relDir) {
        this._player1.recordInput(relDir);
      }
    }
  }
}
