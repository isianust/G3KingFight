// ============================================================
// main.ts — Entry point that initializes everything
// ============================================================

import './style.css';
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
