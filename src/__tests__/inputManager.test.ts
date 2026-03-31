import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InputManager } from '../core/InputManager';
import { Fighter } from '../entities/Fighter';
import { JOYSTICK_DEAD_ZONE } from '../constants/gameConfig';

function createFighter(overrides: Record<string, unknown> = {}): Fighter {
  return new Fighter({
    position: { x: 200, y: 300 },
    color: '#ff0000',
    ...overrides,
  });
}

function fireKeydown(key: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function fireKeyup(key: string): void {
  window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
}

describe('InputManager', () => {
  let im: InputManager;
  let p1: Fighter;
  let p2: Fighter;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="mobileControls" class="hidden"></div>
      <div id="joystickArea"></div>
      <div id="joystickBase"></div>
      <div id="joystickThumb"></div>
      <canvas id="gameCanvas"></canvas>
      <div id="gameScreen"></div>
      <div id="hud"></div>
      <div id="roundResult"></div>
    `;
    document.body.classList.remove('is-mobile');

    im = new InputManager();
    im.init();

    p1 = createFighter();
    p2 = createFighter({ facingRight: false });
  });

  // ---- Constructor ----

  describe('constructor', () => {
    it('isMobile is a boolean', () => {
      expect(typeof im.isMobile).toBe('boolean');
    });

    it('adds is-mobile class when detected as mobile', () => {
      // jsdom exposes ontouchstart/maxTouchPoints, so isMobile is true
      if (im.isMobile) {
        expect(document.body.classList.contains('is-mobile')).toBe(true);
      }
    });

    it('detects mobile when user agent matches', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Android Mobile',
        configurable: true,
      });
      const mobile = new InputManager();
      expect(mobile.isMobile).toBe(true);
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0',
        configurable: true,
      });
    });
  });

  // ---- setGameState ----

  describe('setGameState', () => {
    it('updates internal state so keyboard events are processed', () => {
      im.setGameState(true, 'pvp', p1, p2);
      fireKeydown('a');
      expect(p1.keys.left).toBe(true);
    });

    it('clears game state so input is ignored', () => {
      im.setGameState(true, 'pvp', p1, p2);
      fireKeydown('a');
      expect(p1.keys.left).toBe(true);

      fireKeyup('a');
      im.setGameState(false, '', null, null);
      fireKeydown('a');
      // keys not changed because game not running
      expect(p1.keys.left).toBe(false);
    });
  });

  // ---- P1 Keyboard keydown ----

  describe('P1 keyboard keydown', () => {
    beforeEach(() => {
      im.setGameState(true, 'pvp', p1, p2);
    });

    it.each([
      ['a', 'left'],
      ['d', 'right'],
      ['w', 'jump'],
      ['u', 'attack1'],
      ['i', 'attack2'],
      ['s', 'block'],
      ['e', 'charge'],
    ] as const)('key "%s" sets P1 keys.%s to true', (key, prop) => {
      fireKeydown(key);
      expect(p1.keys[prop]).toBe(true);
    });
  });

  // ---- P1 Keyboard keyup ----

  describe('P1 keyboard keyup', () => {
    beforeEach(() => {
      im.setGameState(true, 'pvp', p1, p2);
    });

    it.each([
      ['a', 'left'],
      ['d', 'right'],
      ['w', 'jump'],
      ['u', 'attack1'],
      ['i', 'attack2'],
      ['s', 'block'],
      ['e', 'charge'],
    ] as const)('key "%s" releases P1 keys.%s', (key, prop) => {
      fireKeydown(key);
      expect(p1.keys[prop]).toBe(true);
      fireKeyup(key);
      expect(p1.keys[prop]).toBe(false);
    });
  });

  // ---- P2 Keyboard (pvp mode) ----

  describe('P2 keyboard in pvp mode', () => {
    beforeEach(() => {
      im.setGameState(true, 'pvp', p1, p2);
    });

    it.each([
      ['ArrowLeft', 'left'],
      ['ArrowRight', 'right'],
      ['ArrowUp', 'jump'],
      ['Enter', 'attack1'],
      ['/', 'attack2'],
      ['ArrowDown', 'block'],
      ['.', 'charge'],
    ] as const)('key "%s" sets P2 keys.%s to true', (key, prop) => {
      fireKeydown(key);
      expect(p2.keys[prop]).toBe(true);
    });

    it.each([
      ['ArrowLeft', 'left'],
      ['ArrowRight', 'right'],
      ['ArrowUp', 'jump'],
      ['ArrowDown', 'block'],
      ['.', 'charge'],
    ] as const)('key "%s" releases P2 keys.%s on keyup', (key, prop) => {
      fireKeydown(key);
      expect(p2.keys[prop]).toBe(true);
      fireKeyup(key);
      expect(p2.keys[prop]).toBe(false);
    });
  });

  // ---- Keyboard ignored when game not running ----

  describe('keyboard ignored when game not running', () => {
    it('does not set any keys when game is not running', () => {
      im.setGameState(false, 'pvp', p1, p2);
      fireKeydown('a');
      fireKeydown('ArrowLeft');
      expect(p1.keys.left).toBe(false);
      expect(p2.keys.left).toBe(false);
    });

    it('does not set any keys when players are null', () => {
      im.setGameState(true, 'pvp', null, null);
      fireKeydown('a');
      // Should not throw and keys remain default
      expect(p1.keys.left).toBe(false);
    });
  });

  // ---- P2 ignored when mode != 'pvp' ----

  describe('P2 keyboard ignored when mode is not pvp', () => {
    it('does not set P2 keys in story mode', () => {
      im.setGameState(true, 'story', p1, p2);
      fireKeydown('ArrowLeft');
      expect(p2.keys.left).toBe(false);
    });

    it('still sets P1 keys in non-pvp mode', () => {
      im.setGameState(true, 'story', p1, p2);
      fireKeydown('a');
      expect(p1.keys.left).toBe(true);
    });
  });

  // ---- Duplicate keydown suppression ----

  describe('duplicate keydown suppression', () => {
    beforeEach(() => {
      im.setGameState(true, 'pvp', p1, p2);
    });

    it('suppresses repeated keydown without intervening keyup', () => {
      fireKeydown('a');
      expect(p1.keys.left).toBe(true);

      // Manually reset to detect if second keydown re-triggers
      p1.keys.left = false;
      fireKeydown('a');
      // Duplicate suppressed — key stays false because handler returned early
      expect(p1.keys.left).toBe(false);

      // After keyup, keydown works again
      fireKeyup('a');
      expect(p1.keys.left).toBe(false);
      fireKeydown('a');
      expect(p1.keys.left).toBe(true);
    });
  });

  // ---- showMobileControls / hideMobileControls ----

  describe('showMobileControls / hideMobileControls', () => {
    it('hideMobileControls adds hidden class', () => {
      const el = document.getElementById('mobileControls')!;
      el.classList.remove('hidden');
      im.hideMobileControls();
      expect(el.classList.contains('hidden')).toBe(true);
    });

    it('showMobileControls removes hidden when mobile', () => {
      const el = document.getElementById('mobileControls')!;
      // isMobile is true in jsdom, so showMobileControls should remove hidden
      if (im.isMobile) {
        im.showMobileControls();
        expect(el.classList.contains('hidden')).toBe(false);
      }
    });

    it('showMobileControls keeps hidden when not mobile', () => {
      // Create a non-mobile InputManager
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0',
        configurable: true,
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true,
      });
      Object.defineProperty(window, 'ontouchstart', {
        value: undefined,
        configurable: true,
      });
      delete (window as any).ontouchstart;

      const desktopIm = new InputManager();
      desktopIm.init();

      const el = document.getElementById('mobileControls')!;
      el.classList.add('hidden');
      desktopIm.showMobileControls();
      expect(el.classList.contains('hidden')).toBe(true);
    });
  });

  // ---- applyMobileInput ----

  describe('applyMobileInput', () => {
    it('is a no-op when game not running', () => {
      im.setGameState(false, 'pvp', p1, p2);
      im.applyMobileInput();
      expect(p1.keys.left).toBe(false);
    });

    it('is a no-op when player1 is null', () => {
      im.setGameState(true, 'pvp', null, p2);
      // Should not throw
      im.applyMobileInput();
    });
  });

  // ---- applyMobileInput with mocked isMobile ----

  describe('applyMobileInput (mobile simulation)', () => {
    let mobileIm: InputManager;
    let mp1: Fighter;

    beforeEach(() => {
      // Simulate mobile UA
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Android Mobile',
        configurable: true,
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 5,
        configurable: true,
      });

      mobileIm = new InputManager();
      mobileIm.init();
      mp1 = createFighter();
      mobileIm.setGameState(true, 'pvp', mp1, createFighter());

      // Restore UA for other tests
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0',
        configurable: true,
      });
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true,
      });
    });

    it('detects mobile from user agent', () => {
      expect(mobileIm.isMobile).toBe(true);
    });

    it('joystick left sets left key', () => {
      // Access private joystickInput via any cast
      (mobileIm as any).joystickInput = { x: -(JOYSTICK_DEAD_ZONE + 0.1), y: 0 };
      mobileIm.applyMobileInput();
      expect(mp1.keys.left).toBe(true);
      expect(mp1.keys.right).toBe(false);
    });

    it('joystick right sets right key', () => {
      (mobileIm as any).joystickInput = { x: JOYSTICK_DEAD_ZONE + 0.1, y: 0 };
      mobileIm.applyMobileInput();
      expect(mp1.keys.right).toBe(true);
      expect(mp1.keys.left).toBe(false);
    });

    it('joystick in dead zone clears both left and right', () => {
      mp1.keys.left = true;
      (mobileIm as any).joystickInput = { x: 0.1, y: 0 };
      mobileIm.applyMobileInput();
      expect(mp1.keys.left).toBe(false);
      expect(mp1.keys.right).toBe(false);
    });

    it('joystick up triggers jump', () => {
      (mobileIm as any).joystickInput = { x: 0, y: -0.6 };
      mobileIm.applyMobileInput();
      expect(mp1.keys.jump).toBe(true);
    });

    it('joystick not far enough up does not trigger jump', () => {
      (mobileIm as any).joystickInput = { x: 0, y: -0.3 };
      mobileIm.applyMobileInput();
      expect(mp1.keys.jump).toBe(false);
    });

    // ---- Mobile button one-shot vs hold ----

    it('attack1 button is one-shot (consumed after apply)', () => {
      (mobileIm as any).mobileButtonStates['attack1'] = true;
      mobileIm.applyMobileInput();
      expect(mp1.keys.attack1).toBe(true);
      // State consumed
      expect((mobileIm as any).mobileButtonStates['attack1']).toBe(false);
    });

    it('attack2 button is one-shot', () => {
      (mobileIm as any).mobileButtonStates['attack2'] = true;
      mobileIm.applyMobileInput();
      expect(mp1.keys.attack2).toBe(true);
      expect((mobileIm as any).mobileButtonStates['attack2']).toBe(false);
    });

    it('jump button is one-shot', () => {
      (mobileIm as any).mobileButtonStates['jump'] = true;
      mobileIm.applyMobileInput();
      expect(mp1.keys.jump).toBe(true);
      expect((mobileIm as any).mobileButtonStates['jump']).toBe(false);
    });

    it('block button is hold (not consumed)', () => {
      (mobileIm as any).mobileButtonStates['block'] = true;
      mobileIm.applyMobileInput();
      expect(mp1.keys.block).toBe(true);
      // Still true – hold behavior
      expect((mobileIm as any).mobileButtonStates['block']).toBe(true);
    });

    it('charge button is hold (not consumed)', () => {
      (mobileIm as any).mobileButtonStates['charge'] = true;
      mobileIm.applyMobileInput();
      expect(mp1.keys.charge).toBe(true);
      expect((mobileIm as any).mobileButtonStates['charge']).toBe(true);
    });

    it('block false when button not held', () => {
      (mobileIm as any).mobileButtonStates['block'] = false;
      mobileIm.applyMobileInput();
      expect(mp1.keys.block).toBe(false);
    });

    // ---- Directional input recording ----

    describe('directional input recording for special moves', () => {
      beforeEach(() => {
        mp1.facingRight = true;
        vi.spyOn(mp1, 'recordInput');
      });

      it('records forward when joystick right and facingRight', () => {
        (mobileIm as any).joystickActive = true;
        (mobileIm as any).joystickInput = { x: JOYSTICK_DEAD_ZONE + 0.1, y: 0 };
        mobileIm.applyMobileInput();
        expect(mp1.recordInput).toHaveBeenCalledWith('F');
      });

      it('records back when joystick left and facingRight', () => {
        (mobileIm as any).joystickActive = true;
        (mobileIm as any).joystickInput = { x: -(JOYSTICK_DEAD_ZONE + 0.1), y: 0 };
        mobileIm.applyMobileInput();
        expect(mp1.recordInput).toHaveBeenCalledWith('B');
      });

      it('records forward when joystick left and facing left', () => {
        mp1.facingRight = false;
        (mobileIm as any).joystickActive = true;
        (mobileIm as any).joystickInput = { x: -(JOYSTICK_DEAD_ZONE + 0.1), y: 0 };
        mobileIm.applyMobileInput();
        expect(mp1.recordInput).toHaveBeenCalledWith('F');
      });

      it('records down when joystick down', () => {
        (mobileIm as any).joystickActive = true;
        (mobileIm as any).joystickInput = { x: 0, y: 0.5 };
        mobileIm.applyMobileInput();
        expect(mp1.recordInput).toHaveBeenCalledWith('D');
      });

      it('records DF when joystick down-forward', () => {
        (mobileIm as any).joystickActive = true;
        (mobileIm as any).joystickInput = { x: JOYSTICK_DEAD_ZONE + 0.1, y: 0.5 };
        mobileIm.applyMobileInput();
        expect(mp1.recordInput).toHaveBeenCalledWith('DF');
      });

      it('records DB when joystick down-back', () => {
        (mobileIm as any).joystickActive = true;
        (mobileIm as any).joystickInput = { x: -(JOYSTICK_DEAD_ZONE + 0.1), y: 0.5 };
        mobileIm.applyMobileInput();
        expect(mp1.recordInput).toHaveBeenCalledWith('DB');
      });

      it('records U when joystick up', () => {
        (mobileIm as any).joystickActive = true;
        (mobileIm as any).joystickInput = { x: 0, y: -0.5 };
        mobileIm.applyMobileInput();
        expect(mp1.recordInput).toHaveBeenCalledWith('U');
      });

      it('does not record when joystick inactive', () => {
        (mobileIm as any).joystickActive = false;
        (mobileIm as any).joystickInput = { x: 0.5, y: 0 };
        mobileIm.applyMobileInput();
        expect(mp1.recordInput).not.toHaveBeenCalled();
      });

      it('does not record when joystick in dead zone', () => {
        (mobileIm as any).joystickActive = true;
        (mobileIm as any).joystickInput = { x: 0.05, y: 0.05 };
        mobileIm.applyMobileInput();
        expect(mp1.recordInput).not.toHaveBeenCalled();
      });
    });
  });
});
