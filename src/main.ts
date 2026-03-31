// ============================================================
// main.ts — Entry point that initializes everything
// ============================================================

import { GameEngine } from './core/GameEngine';

function bootstrap(): void {
  const engine = new GameEngine();
  engine.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
