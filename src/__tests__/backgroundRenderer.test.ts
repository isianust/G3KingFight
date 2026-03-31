import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BackgroundRenderer } from '../rendering/BackgroundRenderer';
import { CANVAS_W, CANVAS_H, STAGE_COUNT } from '../constants';

// --------------- helpers ---------------

function createMockCtx(): CanvasRenderingContext2D {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    globalAlpha: 1,
    shadowColor: '',
    shadowBlur: 0,
    font: '',
    textAlign: '',
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    setTransform: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  } as unknown as CanvasRenderingContext2D;
}

// --------------- tests ---------------

describe('BackgroundRenderer', () => {
  let renderer: BackgroundRenderer;

  beforeEach(() => {
    renderer = new BackgroundRenderer();
  });

  // ---- initParticles ----

  describe('initParticles', () => {
    it('creates exactly 30 particles', () => {
      renderer.initParticles();
      // Access private field for verification
      const particles = (renderer as unknown as { bgParticles: unknown[] }).bgParticles;
      expect(particles).toHaveLength(30);
    });

    it('clears existing particles before creating new ones', () => {
      renderer.initParticles();
      renderer.initParticles();
      const particles = (renderer as unknown as { bgParticles: unknown[] }).bgParticles;
      expect(particles).toHaveLength(30);
    });

    it('each particle has valid x within [0, CANVAS_W)', () => {
      renderer.initParticles();
      const particles = (renderer as unknown as { bgParticles: { x: number }[] }).bgParticles;
      for (const p of particles) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThan(CANVAS_W);
      }
    });

    it('each particle has valid y within [0, CANVAS_H)', () => {
      renderer.initParticles();
      const particles = (renderer as unknown as { bgParticles: { y: number }[] }).bgParticles;
      for (const p of particles) {
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThan(CANVAS_H);
      }
    });

    it('each particle has radius r in [0.5, 2.5)', () => {
      renderer.initParticles();
      const particles = (renderer as unknown as { bgParticles: { r: number }[] }).bgParticles;
      for (const p of particles) {
        expect(p.r).toBeGreaterThanOrEqual(0.5);
        expect(p.r).toBeLessThan(2.5);
      }
    });

    it('each particle has vx in [-0.25, 0.25)', () => {
      renderer.initParticles();
      const particles = (renderer as unknown as { bgParticles: { vx: number }[] }).bgParticles;
      for (const p of particles) {
        expect(p.vx).toBeGreaterThanOrEqual(-0.25);
        expect(p.vx).toBeLessThan(0.25);
      }
    });

    it('each particle has vy in [-0.7, -0.2)', () => {
      renderer.initParticles();
      const particles = (renderer as unknown as { bgParticles: { vy: number }[] }).bgParticles;
      for (const p of particles) {
        expect(p.vy).toBeGreaterThanOrEqual(-0.7);
        expect(p.vy).toBeLessThan(-0.2);
      }
    });

    it('each particle has alpha in [0.1, 0.4)', () => {
      renderer.initParticles();
      const particles = (renderer as unknown as { bgParticles: { alpha: number }[] }).bgParticles;
      for (const p of particles) {
        expect(p.alpha).toBeGreaterThanOrEqual(0.1);
        expect(p.alpha).toBeLessThan(0.4);
      }
    });
  });

  // ---- drawBackground ----

  describe('drawBackground', () => {
    it.each([0, 1, 2, 3, 4, 5])('renders stage %i without throwing', (stage) => {
      const ctx = createMockCtx();
      expect(() => renderer.drawBackground(ctx, stage)).not.toThrow();
    });

    it.each([0, 1, 2, 3, 4, 5])('stage %i calls ctx.fillRect at least once', (stage) => {
      const ctx = createMockCtx();
      renderer.drawBackground(ctx, stage);
      expect(ctx.fillRect).toHaveBeenCalled();
    });

    it('wraps stage numbers >= STAGE_COUNT using modulo', () => {
      const ctx1 = createMockCtx();
      const ctx2 = createMockCtx();

      renderer.drawBackground(ctx1, 0);
      const fillRectCalls0 = (ctx1.fillRect as ReturnType<typeof vi.fn>).mock.calls.length;

      renderer.drawBackground(ctx2, STAGE_COUNT);
      const fillRectCallsWrapped = (ctx2.fillRect as ReturnType<typeof vi.fn>).mock.calls.length;

      // stage 0 and stage STAGE_COUNT should produce the same number of fillRect calls
      expect(fillRectCallsWrapped).toBe(fillRectCalls0);
    });

    it('does not crash for large stage numbers', () => {
      const ctx = createMockCtx();
      expect(() => renderer.drawBackground(ctx, 9999)).not.toThrow();
      expect(ctx.fillRect).toHaveBeenCalled();
    });

    it('stage 0 (BattlefieldDusk) uses createLinearGradient for the sky', () => {
      const ctx = createMockCtx();
      renderer.drawBackground(ctx, 0);
      expect(ctx.createLinearGradient).toHaveBeenCalled();
    });

    it('stage 0 (BattlefieldDusk) uses createRadialGradient for the sun', () => {
      const ctx = createMockCtx();
      renderer.drawBackground(ctx, 0);
      expect(ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('stage 0 (BattlefieldDusk) draws war banners with fillText', () => {
      const ctx = createMockCtx();
      renderer.drawBackground(ctx, 0);
      expect(ctx.fillText).toHaveBeenCalled();
    });

    it('stage 0 (BattlefieldDusk) draws mountain ranges with lineTo', () => {
      const ctx = createMockCtx();
      renderer.drawBackground(ctx, 0);
      expect(ctx.lineTo).toHaveBeenCalled();
    });

    it('stage 0 (BattlefieldDusk) draws clouds with ellipse', () => {
      const ctx = createMockCtx();
      renderer.drawBackground(ctx, 0);
      expect(ctx.ellipse).toHaveBeenCalled();
    });
  });

  // ---- particle updates during drawBackground ----

  describe('particle updates during drawBackground', () => {
    it('particles move after drawBackground calls', () => {
      renderer.initParticles();
      const particles = (renderer as unknown as { bgParticles: { x: number; y: number }[] })
        .bgParticles;

      const initialPositions = particles.map((p) => ({ x: p.x, y: p.y }));

      const ctx = createMockCtx();
      renderer.drawBackground(ctx, 0);

      let anyMoved = false;
      for (let i = 0; i < particles.length; i++) {
        if (particles[i].x !== initialPositions[i].x || particles[i].y !== initialPositions[i].y) {
          anyMoved = true;
          break;
        }
      }
      expect(anyMoved).toBe(true);
    });

    it('calling drawBackground multiple times continues to update particles', () => {
      renderer.initParticles();
      const particles = (renderer as unknown as { bgParticles: { x: number; y: number }[] })
        .bgParticles;

      const ctx = createMockCtx();
      renderer.drawBackground(ctx, 0);
      const afterFirst = particles.map((p) => ({ x: p.x, y: p.y }));

      renderer.drawBackground(ctx, 0);

      let anyMoved = false;
      for (let i = 0; i < particles.length; i++) {
        if (particles[i].x !== afterFirst[i].x || particles[i].y !== afterFirst[i].y) {
          anyMoved = true;
          break;
        }
      }
      expect(anyMoved).toBe(true);
    });

    it('particles that go off-screen are wrapped back', () => {
      renderer.initParticles();
      const particles = (
        renderer as unknown as {
          bgParticles: { x: number; y: number; vx: number; vy: number }[];
        }
      ).bgParticles;

      // Force a particle to go above the screen
      particles[0].y = -10;
      particles[0].vy = -1;

      const ctx = createMockCtx();
      renderer.drawBackground(ctx, 0);

      // After update, wrapped particle should be near the bottom
      expect(particles[0].y).toBeGreaterThan(CANVAS_H - 10);
    });
  });

  // ---- STAGE_COUNT sanity ----

  describe('stage count', () => {
    it('STAGE_COUNT equals 6', () => {
      expect(STAGE_COUNT).toBe(6);
    });
  });
});
