// ============================================================
// AIController.ts — CPU AI logic
// ============================================================

import { MAX_ENERGY, DIFFICULTY_SETTINGS } from '../constants';
import type { Fighter } from '../entities/Fighter';
import type { SpecialMove } from '../types';

export class AIController {
  private gameDifficulty: string;

  constructor(difficulty: string = 'easy') {
    this.gameDifficulty = difficulty;
  }

  setDifficulty(difficulty: string): void {
    this.gameDifficulty = difficulty;
  }

  /**
   * Run one frame of CPU AI logic.
   * The cpu fighter acts against target based on difficulty settings.
   */
  update(cpu: Fighter, target: Fighter): void {
    if (cpu.dead || cpu.hitstun > 0) return;

    const dx = target.position.x - cpu.position.x;
    const dist = Math.abs(dx);

    cpu.keys.left = false;
    cpu.keys.right = false;
    cpu.keys.jump = false;
    cpu.keys.charge = false;
    cpu.keys.block = false;

    const attackRange = cpu.attackBox.width + cpu.width * 0.5;
    const diff = DIFFICULTY_SETTINGS[this.gameDifficulty] || DIFFICULTY_SETTINGS.easy;

    // CPU blocking logic
    if (target.isAttacking && dist < attackRange + 60) {
      if (Math.random() < diff.aiBlockRate) {
        if (dx > 0) cpu.keys.left = true;
        else cpu.keys.right = true;
        cpu.keys.block = true;
        return;
      }
    }

    // CPU charging logic — charge when far away
    if (dist > 300 && cpu.energy < cpu.maxEnergy * 0.8 && Math.random() < 0.15) {
      cpu.keys.charge = true;
      return;
    }

    // Movement
    if (dist > attackRange + 30) {
      if (dx > 0) cpu.keys.right = true;
      else cpu.keys.left = true;
      if (Math.random() < 0.02 && cpu.onGround) {
        cpu.keys.jump = true;
      }
    } else if (dist < 40) {
      if (Math.random() < 0.3) {
        if (dx > 0) cpu.keys.left = true;
        else cpu.keys.right = true;
      }
    }

    // CPU special move logic
    if (
      !cpu.isSoldier &&
      cpu.charData &&
      'moves' in cpu.charData &&
      cpu.charData.moves &&
      dist < attackRange + 50
    ) {
      // Try ultimate if energy is full
      if (
        cpu.energy >= MAX_ENERGY &&
        'ultimate' in cpu.charData &&
        cpu.charData.ultimate &&
        Math.random() < diff.aiUltRate
      ) {
        cpu.keys.attack1 = true;
        cpu.keys.attack2 = true;
        cpu.inputBuffer = ['D', 'DF', 'F', 'D', 'DF', 'F'];
        cpu.inputBufferTimer = 10;
        return;
      }

      // Try special moves
      if (Math.random() < diff.aiSpecialRate) {
        const moves = cpu.charData.moves as SpecialMove[];
        const availableMoves = moves.filter((m: SpecialMove) => cpu.energy >= m.energyCost);
        if (availableMoves.length > 0) {
          const move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
          cpu.inputBuffer = move.command.slice();
          cpu.inputBufferTimer = 10;
          cpu.keys.attack1 = true;
          return;
        }
      }
    }

    // Basic attacks
    if (dist < attackRange + 20 && cpu.attackCooldown <= 0 && !cpu.isAttacking) {
      if (Math.random() < diff.aiAttackRate) {
        cpu.keys.attack1 = true;
      } else if (Math.random() < diff.aiAttackRate * 0.35) {
        cpu.keys.attack2 = true;
      }
    }

    // Dodge
    if (target.isAttacking && dist < attackRange + 50 && cpu.onGround && Math.random() < 0.2) {
      cpu.keys.jump = true;
    }
  }
}
