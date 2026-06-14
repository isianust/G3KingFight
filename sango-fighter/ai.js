var AIController = class AIController {
  constructor(fighter, opponent, difficulty) {
    if (typeof fighter === 'string' && opponent === undefined) {
      difficulty = fighter;
      fighter = null;
      opponent = null;
    }
    this.fighter = fighter || null;
    this.opponent = opponent || null;
    this.gameDifficulty = difficulty || 'easy';
  }

  setFighters(fighter, opponent) {
    this.fighter = fighter || null;
    this.opponent = opponent || null;
  }

  setDifficulty(difficulty) {
    this.gameDifficulty = difficulty || 'easy';
  }

  update(fighter, opponent) {
    if (fighter) this.fighter = fighter;
    if (opponent) this.opponent = opponent;

    var cpu = this.fighter;
    var target = this.opponent;
    if (!cpu || !target || cpu.dead || cpu.hitstun > 0) return;

    var dx = target.position.x - cpu.position.x;
    var dist = Math.abs(dx);
    var diff = DIFFICULTY_SETTINGS[this.gameDifficulty] || DIFFICULTY_SETTINGS.easy;
    var attackRange = cpu.attackBox.width + cpu.width * 0.5;

    cpu.keys.left = false;
    cpu.keys.right = false;
    cpu.keys.jump = false;
    cpu.keys.charge = false;
    cpu.keys.block = false;

    if (target.isAttacking && dist < attackRange + 60 && Math.random() < diff.aiBlockRate) {
      if (dx > 0) cpu.keys.left = true;
      else cpu.keys.right = true;
      cpu.keys.block = true;
      return;
    }

    if (dist > 300 && cpu.energy < cpu.maxEnergy * 0.8 && Math.random() < 0.15) {
      cpu.keys.charge = true;
      return;
    }

    if (dist > attackRange + 30) {
      if (dx > 0) cpu.keys.right = true;
      else cpu.keys.left = true;
      if (Math.random() < 0.02 && cpu.onGround) cpu.keys.jump = true;
    } else if (dist < 40 && Math.random() < 0.3) {
      if (dx > 0) cpu.keys.left = true;
      else cpu.keys.right = true;
    }

    if (!cpu.isSoldier && cpu.charData && cpu.charData.moves && dist < attackRange + 50) {
      if (cpu.energy >= MAX_ENERGY && cpu.charData.ultimate && Math.random() < diff.aiUltRate) {
        cpu.keys.attack1 = true;
        cpu.keys.attack2 = true;
        cpu.inputBuffer = ['D', 'DF', 'F', 'D', 'DF', 'F'];
        cpu.inputBufferTimer = 10;
        return;
      }

      if (Math.random() < diff.aiSpecialRate) {
        var moves = cpu.charData.moves;
        var availableMoves = moves.filter(function(move) {
          return cpu.energy >= move.energyCost;
        });
        if (availableMoves.length > 0) {
          var move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
          cpu.inputBuffer = move.command.slice();
          cpu.inputBufferTimer = 10;
          cpu.keys.attack1 = true;
          return;
        }
      }
    }

    if (dist < attackRange + 20 && cpu.attackCooldown <= 0 && !cpu.isAttacking) {
      if (Math.random() < diff.aiAttackRate) {
        cpu.keys.attack1 = true;
      } else if (Math.random() < diff.aiAttackRate * 0.35) {
        cpu.keys.attack2 = true;
      }
    }

    if (target.isAttacking && dist < attackRange + 50 && cpu.onGround && Math.random() < 0.2) {
      cpu.keys.jump = true;
    }
  }
};
