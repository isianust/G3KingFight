// ============================================================
// classes.js — Sprite, Fighter, Soldier, Projectile classes
// ============================================================

/* ---------- Constants ---------- */
const GRAVITY = 0.7;
const GROUND_Y = 576 - 96;
const CANVAS_W = 1024;
const CANVAS_H = 576;
const MAX_ENERGY = 100;
const ENERGY_GAIN_HIT = 8;       // energy gained when hitting opponent
const ENERGY_GAIN_HURT = 5;      // energy gained when taking damage
const ENERGY_GAIN_CHARGE = 1.2;  // energy per frame while charging
const BLOCK_DAMAGE_REDUCTION = 0.7; // 70% damage reduced when blocking
const BLOCK_KNOCKBACK_REDUCTION = 0.5;

/* ---------- Animation States ---------- */
const ANIM = {
  IDLE: 'idle',
  RUN: 'run',
  JUMP: 'jump',
  FALL: 'fall',
  ATTACK1: 'attack1',
  ATTACK2: 'attack2',
  SPECIAL: 'special',
  ULTIMATE: 'ultimate',
  BLOCK: 'block',
  CHARGE: 'charge',
  TAKE_HIT: 'takeHit',
  KNOCKDOWN: 'knockdown',
  GETUP: 'getup',
  DEATH: 'death'
};

/* ==========================
   Sprite (base class)
   ========================== */
class Sprite {
  constructor({
    position,
    imageSrc,
    scale = 1,
    framesMax = 1,
    offset = { x: 0, y: 0 },
    color = '#888',
    width = 50,
    height = 150
  }) {
    this.position = position;
    this.width = width;
    this.height = height;
    this.color = color;
    this.scale = scale;
    this.framesMax = framesMax;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
    this.framesHold = 8;
    this.offset = offset;

    this.image = null;
    this.loaded = false;
    if (imageSrc) {
      this.image = new Image();
      this.image.onload = () => { this.loaded = true; };
      this.image.src = imageSrc;
    }
  }

  draw(ctx) {
    if (this.loaded && this.image) {
      var fw = this.image.width / this.framesMax;
      var fh = this.image.height;
      ctx.drawImage(
        this.image,
        fw * this.framesCurrent, 0, fw, fh,
        this.position.x - this.offset.x,
        this.position.y - this.offset.y,
        fw * this.scale,
        fh * this.scale
      );
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
  }

  animateFrames() {
    this.framesElapsed++;
    if (this.framesElapsed % this.framesHold === 0) {
      this.framesCurrent = (this.framesCurrent + 1) % this.framesMax;
    }
  }

  update(ctx) {
    this.draw(ctx);
    this.animateFrames();
  }
}

/* ==========================
   Projectile — 飛行道具
   ========================== */
class Projectile {
  constructor({ x, y, vx, vy, damage, color, owner, width, height, life }) {
    this.position = { x: x, y: y };
    this.vx = vx;
    this.vy = vy || 0;
    this.damage = damage;
    this.color = color || '#ffcc00';
    this.owner = owner;
    this.width = width || 30;
    this.height = height || 15;
    this.life = life || 90;
    this.active = true;
  }

  update(ctx) {
    if (!this.active) return;
    this.position.x += this.vx;
    this.position.y += this.vy;
    this.life--;

    if (this.life <= 0 || this.position.x < -50 || this.position.x > CANVAS_W + 50) {
      this.active = false;
      return;
    }

    // Draw projectile
    ctx.save();
    var alpha = Math.min(1, this.life / 20);
    ctx.globalAlpha = alpha;

    // Glow effect — enhanced multi-layer
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;

    // Outer glow ring
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    var cx = this.position.x + this.width / 2;
    var cy = this.position.y + this.height / 2;
    ctx.ellipse(cx, cy, this.width / 2 + 4, this.height / 2 + 4, 0, 0, Math.PI * 2);
    ctx.globalAlpha = alpha * 0.3;
    ctx.stroke();

    // Main body
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width / 4, this.height / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Trail particles — enhanced with glow
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    for (var i = 0; i < 5; i++) {
      var tx = this.position.x - this.vx * (i + 1) * 0.6 + (Math.random() - 0.5) * 8;
      var ty = this.position.y + this.height / 2 + (Math.random() - 0.5) * 10;
      var tr = Math.random() * 4 + 1;
      ctx.globalAlpha = alpha * (0.6 - i * 0.1);
      ctx.fillStyle = i < 2 ? '#fff' : this.color;
      ctx.beginPath();
      ctx.arc(tx, ty, tr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}

/* ==========================
   Fighter (extends Sprite)
   ========================== */
class Fighter extends Sprite {
  constructor({
    position,
    velocity = { x: 0, y: 0 },
    color = 'red',
    width = 50,
    height = 150,
    attackBox = { offset: { x: 0, y: 0 }, width: 100, height: 50 },
    facingRight = true,
    charData = null,
    isSoldier = false,
    soldierType = null,
    sprites = {},
    imageSrc,
    scale,
    framesMax,
    offset
  }) {
    super({ position, imageSrc, scale, framesMax, offset, color, width, height });

    this.velocity = velocity;
    this.isSoldier = isSoldier;
    this.soldierType = soldierType;

    // Health (doubled: heroes=200, soldiers=40)
    if (isSoldier && soldierType) {
      this.maxHealth = 200 * soldierType.healthMultiplier; // 0.2 = 40HP (1/5 of hero)
      this.health = this.maxHealth;
    } else {
      this.maxHealth = 200;
      this.health = 200;
    }

    // Knockdown / get-up system (KOF/SF style)
    this.isKnockedDown = false;
    this.knockdownTimer = 0;
    this.knockdownDuration = 60;  // frames lying on ground
    this.isGettingUp = false;
    this.getupTimer = 0;
    this.getupDuration = 30;      // frames for get-up animation
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.invincibleDuration = 45; // frames of invincibility after getting up

    // Knockdown Bar (倒地條): depletes on hit, recovers over time
    // When bar reaches 0, character is knocked down
    this.knockdownBar = 100;      // current bar value
    this.knockdownBarMax = 100;   // max bar value
    this.knockdownBarRecovery = 2; // recovery per frame when not in hitstun

    // Energy / Chi system (氣)
    this.energy = 0;
    this.maxEnergy = MAX_ENERGY;
    this.isCharging = false; // charging energy (蓄氣)

    // Attack
    this.attackBox = {
      position: { x: this.position.x, y: this.position.y },
      offset: attackBox.offset,
      width: attackBox.width,
      height: attackBox.height
    };
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.attackDuration = 0;
    this.attackFrame = 0;
    this.attackType = 1;
    this.hasHitThisSwing = false;

    // Special move state
    this.isUsingSpecial = false;
    this.currentSpecialMove = null;
    this.specialTimer = 0;
    this.specialPhase = 0; // for multi-hit moves
    this.specialHitsRemaining = 0;
    this.isUsingUltimate = false;
    this.ultimateFlash = 0;

    // Motion trail for special moves
    this._motionTrail = [];

    // Buff state
    this.buffTimer = 0;
    this.buffMultiplier = 1;

    // Blocking (防禦)
    this.isBlocking = false;
    this.blockStun = 0;

    // Movement
    this.facingRight = facingRight;
    this.speed = 5;
    this.jumpForce = -15;
    this.onGround = false;

    // State
    this.currentAnim = ANIM.IDLE;
    this.hitstun = 0;
    this.knockbackVel = 0;
    this.dead = false;
    this.deathAnimDone = false;

    // Character data
    this.charData = charData;

    // Command input buffer (for special moves)
    this.inputBuffer = [];
    this.inputBufferTimer = 0;
    this.INPUT_BUFFER_MAX_TIME = 30; // frames to complete a command

    // Loaded sprite sheets
    this.spriteSheets = {};
    for (var key in sprites) {
      if (Object.prototype.hasOwnProperty.call(sprites, key)) {
        var value = sprites[key];
        this.spriteSheets[key] = {
          image: null,
          loaded: false,
          framesMax: value.framesMax || 1
        };
        if (value.imageSrc) {
          var img = new Image();
          var entry = this.spriteSheets[key];
          img.onload = function () { entry.loaded = true; };
          img.src = value.imageSrc;
          entry.image = img;
        }
      }
    }

    // Input state
    this.keys = {
      left: false, right: false, jump: false,
      attack1: false, attack2: false,
      block: false, charge: false
    };

    // Stat multipliers (applied via applyStats)
    this._atkMultiplier = 1;
    this._defMultiplier = 1;
  }

  /* ---- Get direction relative to facing ---- */
  _getRelativeDirection() {
    var dir = [];
    if (this.keys.left) dir.push(this.facingRight ? 'B' : 'F');
    if (this.keys.right) dir.push(this.facingRight ? 'F' : 'B');
    if (this.keys.jump) dir.push('U');
    if (this.keys.block || (this.keys.left && !this.facingRight) || (this.keys.right && this.facingRight)) {
      // down is block key
    }
    return dir;
  }

  /* ---- Record directional input for command detection ---- */
  recordInput(rawDir) {
    if (this.inputBufferTimer > 0 && this.inputBuffer.length > 0) {
      var last = this.inputBuffer[this.inputBuffer.length - 1];
      if (last !== rawDir) {
        this.inputBuffer.push(rawDir);
      }
    } else {
      this.inputBuffer = [rawDir];
    }
    this.inputBufferTimer = this.INPUT_BUFFER_MAX_TIME;
  }

  /* ---- Check if input buffer matches a command ---- */
  matchCommand(command) {
    if (this.inputBuffer.length < command.length) return false;
    // Check the last N inputs
    var start = this.inputBuffer.length - command.length;
    for (var i = 0; i < command.length; i++) {
      if (this.inputBuffer[start + i] !== command[i]) return false;
    }
    return true;
  }

  /* ---- Try to execute a special move ---- */
  trySpecialMove() {
    if (this.isSoldier || !this.charData || !this.charData.moves) return false;
    if (this.isUsingSpecial || this.isUsingUltimate || this.dead || this.hitstun > 0) return false;

    // Check ultimate first (needs full energy)
    if (this.charData.ultimate && this.energy >= this.charData.ultimate.energyCost) {
      var ult = this.charData.ultimate;
      // Ultimate requires specific input: QCF + QCF (double quarter circle)
      if (this.matchCommand(['D', 'DF', 'F', 'D', 'DF', 'F']) || 
          (this.keys.attack1 && this.keys.attack2 && this.energy >= MAX_ENERGY)) {
        this.executeSpecialMove(ult, true);
        return true;
      }
    }

    // Check special moves (highest energy cost first for priority)
    var moves = this.charData.moves.slice().sort(function (a, b) { return b.energyCost - a.energyCost; });
    for (var i = 0; i < moves.length; i++) {
      var move = moves[i];
      if (this.energy >= move.energyCost && this.matchCommand(move.command)) {
        this.executeSpecialMove(move, false);
        return true;
      }
    }
    return false;
  }

  /* ---- Execute special move ---- */
  executeSpecialMove(move, isUltimate) {
    this.isUsingSpecial = true;
    this.isUsingUltimate = isUltimate;
    this.currentSpecialMove = move;
    this.specialTimer = 0;
    this.specialPhase = 0;
    this.specialHitsRemaining = move.hits || 1;
    this.hasHitThisSwing = false;
    this.energy -= move.energyCost;
    if (this.energy < 0) this.energy = 0;
    this.currentAnim = isUltimate ? ANIM.ULTIMATE : ANIM.SPECIAL;
    this.inputBuffer = [];
    this.inputBufferTimer = 0;
    this.isAttacking = true;
    this.attackDuration = isUltimate ? 60 : 30;
    this.attackFrame = 0;

    if (isUltimate) {
      this.ultimateFlash = 30;
    }

    // Handle self-damage moves
    if (move.selfDamage) {
      var selfDmg = this.maxHealth * move.selfDamage / 100;
      this.health -= selfDmg;
      if (this.health < 1) this.health = 1;
    }

    // Handle buff moves
    if (move.type === MOVE_TYPE.BUFF && move.buffDuration) {
      this.buffTimer = move.buffDuration;
      this.buffMultiplier = move.buffMultiplier || 1.5;
    }
  }

  /* ---- Start basic attack ---- */
  startAttack(type) {
    if (this.isAttacking || this.dead || this.hitstun > 0 || this.attackCooldown > 0 || this.isBlocking || this.isCharging) return;
    this.isAttacking = true;
    this.isUsingSpecial = false;
    this.isUsingUltimate = false;
    this.currentSpecialMove = null;
    this.attackType = type;
    this.attackDuration = type === 1 ? 8 : 14;
    this.attackFrame = 0;
    this.hasHitThisSwing = false;
    this.attackCooldown = type === 1 ? 18 : 30;
    this.currentAnim = type === 1 ? ANIM.ATTACK1 : ANIM.ATTACK2;
  }

  /* ---- Start blocking ---- */
  startBlock() {
    if (this.dead || this.isAttacking || this.isUsingSpecial || this.hitstun > 0) return;
    this.isBlocking = true;
    this.currentAnim = ANIM.BLOCK;
  }

  stopBlock() {
    this.isBlocking = false;
    if (this.blockStun <= 0) {
      this.currentAnim = ANIM.IDLE;
    }
  }

  /* ---- Start charging energy ---- */
  startCharge() {
    if (this.dead || this.isAttacking || this.isUsingSpecial || this.hitstun > 0 || this.energy >= this.maxEnergy) return;
    this.isCharging = true;
    this.currentAnim = ANIM.CHARGE;
  }

  stopCharge() {
    this.isCharging = false;
    if (this.hitstun <= 0 && !this.isAttacking) {
      this.currentAnim = ANIM.IDLE;
    }
  }

  /* ---- Take damage (with blocking and knockdown bar) ---- */
  // attackType: 'light', 'heavy', or 'special'
  takeHit(damage, knockback, attackType) {
    if (this.dead) return;

    // Invincible after get-up — no damage
    if (this.isInvincible) return;

    // Cannot be hit while knocked down or getting up
    if (this.isKnockedDown || this.isGettingUp) return;

    // Blocking reduces damage
    if (this.isBlocking) {
      damage = Math.round(damage * (1 - BLOCK_DAMAGE_REDUCTION));
      knockback *= BLOCK_KNOCKBACK_REDUCTION;
      this.blockStun = 8;
      this.energy += 3; // gain some energy when blocking
      if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;
      if (damage < 1) damage = 1;
      // Don't break blocking, just show block stun
      return;
    }

    // Stop charging if hit
    this.isCharging = false;

    // Gain energy when hurt
    this.energy += ENERGY_GAIN_HURT;
    if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;

    this.health -= damage;
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
      this.currentAnim = ANIM.DEATH;
      this.framesCurrent = 0;
      this.framesElapsed = 0;
      return;
    }

    // Knockdown bar system: deplete based on attack type
    var barDamage = 20; // default: light attack
    if (attackType === 'heavy') barDamage = 50;
    else if (attackType === 'special') barDamage = 100;

    this.knockdownBar -= barDamage;

    if (this.knockdownBar <= 0) {
      // Bar depleted — knockdown!
      this.knockdownBar = 0;
      this._startKnockdown(knockback);
      this.isAttacking = false;
      this.isUsingSpecial = false;
      this.attackDuration = 0;
    } else {
      // Bar not depleted — hitstun only (no knockdown)
      this.hitstun = attackType === 'heavy' ? 12 : 8;
      this.knockbackVel = knockback * 0.5;
      this.currentAnim = ANIM.TAKE_HIT;
      this.isAttacking = false;
      this.isUsingSpecial = false;
      this.attackDuration = 0;
    }
  }

  /* ---- Start knockdown (KOF/SF style) ---- */
  _startKnockdown(knockback) {
    this.isKnockedDown = true;
    this.knockdownTimer = this.knockdownDuration;
    this.currentAnim = ANIM.KNOCKDOWN;
    this.knockbackVel = knockback * 1.5;
    this.velocity.y = -8; // pop up into the air before falling
    this.onGround = false;
    this.isAttacking = false;
    this.isUsingSpecial = false;
    this.isBlocking = false;
    this.isCharging = false;
    this.hitstun = 0;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
    this.knockdownBar = this.knockdownBarMax; // reset bar on knockdown
  }

  /* ---- Start get-up from knockdown ---- */
  _startGetup() {
    this.isKnockedDown = false;
    this.isGettingUp = true;
    this.getupTimer = this.getupDuration;
    this.currentAnim = ANIM.GETUP;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
  }

  /* ---- Start invincibility after get-up ---- */
  _startInvincibility() {
    this.isGettingUp = false;
    this.isInvincible = true;
    this.invincibleTimer = this.invincibleDuration;
    this.currentAnim = ANIM.IDLE;
  }

  /* ---- Physics & state update ---- */
  updateFighter(ctx, opponent) {
    if (this.dead) {
      this._drawPlaceholder(ctx);
      if (!this.deathAnimDone) {
        this.height = Math.max(30, this.height - 3);
        if (this.height <= 30) this.deathAnimDone = true;
      }
      return;
    }

    // --- Knockdown state ---
    if (this.isKnockedDown) {
      // Apply knockback and gravity while knocked down
      this.position.x += this.knockbackVel;
      this.knockbackVel *= 0.9;
      this.velocity.y += GRAVITY;
      this.position.y += this.velocity.y;

      // Ground collision while knocked down
      if (this.position.y + this.height >= GROUND_Y) {
        this.position.y = GROUND_Y - this.height;
        this.velocity.y = 0;
        this.onGround = true;
        // Count down knockdown timer only when on ground
        this.knockdownTimer--;
        if (this.knockdownTimer <= 0) {
          this._startGetup();
        }
      }

      // Clamp to canvas
      if (this.position.x < 0) this.position.x = 0;
      if (this.position.x + this.width > CANVAS_W) this.position.x = CANVAS_W - this.width;

      this._drawPlaceholder(ctx);
      return;
    }

    // --- Get-up state ---
    if (this.isGettingUp) {
      this.getupTimer--;
      if (this.getupTimer <= 0) {
        this._startInvincibility();
      }
      this._drawPlaceholder(ctx);
      return;
    }

    // --- Invincibility timer ---
    if (this.isInvincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
      }
    }

    // --- Knockdown bar recovery ---
    if (this.hitstun <= 0 && this.knockdownBar < this.knockdownBarMax) {
      this.knockdownBar = Math.min(this.knockdownBarMax, this.knockdownBar + this.knockdownBarRecovery);
    }

    // --- Input buffer timer ---
    if (this.inputBufferTimer > 0) {
      this.inputBufferTimer--;
      if (this.inputBufferTimer <= 0) {
        this.inputBuffer = [];
      }
    }

    // --- Buff timer ---
    if (this.buffTimer > 0) {
      this.buffTimer--;
      if (this.buffTimer <= 0) {
        this.buffMultiplier = 1;
      }
    }

    // --- Block stun ---
    if (this.blockStun > 0) {
      this.blockStun--;
    }

    // --- Ultimate flash ---
    if (this.ultimateFlash > 0) {
      this.ultimateFlash--;
    }

    // --- Charging energy ---
    if (this.isCharging && !this.isAttacking && this.hitstun <= 0) {
      this.energy += ENERGY_GAIN_CHARGE;
      if (this.energy >= this.maxEnergy) {
        this.energy = this.maxEnergy;
        this.isCharging = false;
      }
    }

    // --- Blocking ---
    var backKey = this.facingRight ? this.keys.left : this.keys.right;
    var downForBlock = this.keys.block;
    if ((backKey && downForBlock) && !this.isAttacking && !this.isUsingSpecial && this.hitstun <= 0) {
      this.startBlock();
    } else if (this.isBlocking && !(backKey && downForBlock)) {
      this.stopBlock();
    }

    // --- Hitstun ---
    if (this.hitstun > 0) {
      this.hitstun--;
      this.position.x += this.knockbackVel;
      this.knockbackVel *= 0.85;
      if (this.hitstun === 0) {
        this.currentAnim = ANIM.IDLE;
      }
    } else if (!this.isBlocking) {
      // --- Horizontal movement ---
      var moveX = 0;
      if (!this.isCharging && !this.isUsingSpecial) {
        if (this.keys.left) moveX -= this.speed;
        if (this.keys.right) moveX += this.speed;
      }

      // Special move movement
      if (this.isUsingSpecial && this.currentSpecialMove) {
        var moveType = this.currentSpecialMove.type;
        if (moveType === MOVE_TYPE.RUSH) {
          var rushDir = this.facingRight ? 1 : -1;
          moveX = rushDir * (this.speed * 2.5);
        } else if (moveType === MOVE_TYPE.SPIN) {
          var spinDir = this.facingRight ? 1 : -1;
          moveX = spinDir * (this.speed * 1.5);
        }
      }

      this.position.x += moveX;

      // Face opponent
      if (opponent && !this.isAttacking && !this.isUsingSpecial) {
        this.facingRight = this.position.x < opponent.position.x;
      }

      // --- Jump ---
      if (this.keys.jump && this.onGround && !this.isCharging && !this.isUsingSpecial) {
        this.velocity.y = this.jumpForce;
        this.onGround = false;
      }

      // --- Record directional inputs for command detection ---
      var relDir = '';
      var goingBack = (this.facingRight && this.keys.left) || (!this.facingRight && this.keys.right);
      var goingForward = (this.facingRight && this.keys.right) || (!this.facingRight && this.keys.left);
      var goingDown = this.keys.block;
      var goingUp = this.keys.jump;

      if (goingDown && goingForward) relDir = 'DF';
      else if (goingDown && goingBack) relDir = 'DB';
      else if (goingDown) relDir = 'D';
      else if (goingForward) relDir = 'F';
      else if (goingBack) relDir = 'B';
      else if (goingUp) relDir = 'U';

      if (relDir) {
        this.recordInput(relDir);
      }

      // --- Try special move on attack input ---
      if ((this.keys.attack1 || this.keys.attack2) && !this.isAttacking && !this.isUsingSpecial) {
        var didSpecial = this.trySpecialMove();
        if (!didSpecial) {
          if (this.keys.attack1) {
            this.startAttack(1);
            this.keys.attack1 = false;
          }
          if (this.keys.attack2) {
            this.startAttack(2);
            this.keys.attack2 = false;
          }
        } else {
          this.keys.attack1 = false;
          this.keys.attack2 = false;
        }
      }

      // --- Charge input ---
      if (this.keys.charge && !this.isCharging && !this.isAttacking && !this.isUsingSpecial) {
        this.startCharge();
      } else if (!this.keys.charge && this.isCharging) {
        this.stopCharge();
      }
    }

    // --- Gravity ---
    this.velocity.y += GRAVITY;
    this.position.y += this.velocity.y;

    // --- Ground collision ---
    if (this.position.y + this.height >= GROUND_Y) {
      this.position.y = GROUND_Y - this.height;
      this.velocity.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // --- Clamp to canvas ---
    if (this.position.x < 0) this.position.x = 0;
    if (this.position.x + this.width > CANVAS_W) this.position.x = CANVAS_W - this.width;

    // --- Attack box update ---
    var specialRange = 1;
    if (this.isUsingSpecial && this.currentSpecialMove) {
      if (this.currentSpecialMove.type === MOVE_TYPE.AREA) specialRange = 2;
      else if (this.currentSpecialMove.type === MOVE_TYPE.SPIN) specialRange = 1.5;
      else if (this.currentSpecialMove.type === MOVE_TYPE.SLAM) specialRange = 1.3;
    }

    var atkW = this.attackBox.width * specialRange;
    var atkH = this.attackBox.height * specialRange;
    var atkOffX = this.facingRight
      ? this.attackBox.offset.x
      : -(this.attackBox.offset.x + atkW);
    this.attackBox.position.x = this.position.x + (this.facingRight ? this.width : 0) + atkOffX;
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y;

    // --- Attack / Special duration ---
    if (this.isAttacking || this.isUsingSpecial) {
      this.attackFrame++;

      // Multi-hit special moves
      if (this.isUsingSpecial && this.currentSpecialMove && this.specialHitsRemaining > 0) {
        var hitInterval = Math.floor(this.attackDuration / (this.currentSpecialMove.hits || 1));
        if (hitInterval < 4) hitInterval = 4;
        if (this.attackFrame % hitInterval === 0) {
          this.hasHitThisSwing = false; // allow another hit
          this.specialHitsRemaining--;
        }
      }

      if (this.attackFrame >= this.attackDuration) {
        this.isAttacking = false;
        this.isUsingSpecial = false;
        this.isUsingUltimate = false;
        this.currentSpecialMove = null;
        this.currentAnim = ANIM.IDLE;
      }
    }

    // --- Cooldown ---
    if (this.attackCooldown > 0) this.attackCooldown--;

    // --- Determine animation ---
    if (this.hitstun <= 0 && !this.isAttacking && !this.isUsingSpecial && !this.isBlocking && !this.isCharging && !this.isKnockedDown && !this.isGettingUp) {
      if (!this.onGround && this.velocity.y < 0) {
        this.currentAnim = ANIM.JUMP;
      } else if (!this.onGround && this.velocity.y >= 0) {
        this.currentAnim = ANIM.FALL;
      } else if (this.keys.left || this.keys.right) {
        this.currentAnim = ANIM.RUN;
      } else {
        this.currentAnim = ANIM.IDLE;
      }
    }

    // --- Draw ---
    this._drawPlaceholder(ctx);
  }

  /* ---- Placeholder rendering ---- */
  _drawPlaceholder(ctx) {
    ctx.save();

    var bodyColor = this.charData ? this.charData.color : this.color;
    var isSoldierUnit = this.isSoldier;

    // Ultimate flash effect — dramatic multi-layer flash
    if (this.ultimateFlash > 0) {
      var flashProgress = this.ultimateFlash / 30;
      // Outer radial burst from character
      var moveColor = (this.currentSpecialMove && this.currentSpecialMove.color) || '#ffd700';
      var burstX = this.position.x + this.width / 2;
      var burstY = this.position.y + this.height / 2;
      var burstR = (1 - flashProgress) * 300 + 50;
      var burstGrad = ctx.createRadialGradient(burstX, burstY, 0, burstX, burstY, burstR);
      burstGrad.addColorStop(0, 'rgba(255, 255, 255, ' + (flashProgress * 0.7) + ')');

      // Convert move color to rgba safely
      var burstRgba = this._colorToRgba(moveColor, flashProgress * 0.4);
      burstGrad.addColorStop(0.4, burstRgba);
      burstGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');

      // Base flash layer
      ctx.fillStyle = 'rgba(255, 255, 200, ' + (flashProgress * 0.5) + ')';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.fillStyle = burstGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Speed lines radiating from character
      if (this.ultimateFlash > 15) {
        ctx.save();
        ctx.globalAlpha = flashProgress * 0.6;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        for (var sl = 0; sl < 16; sl++) {
          var lineAngle = (Math.PI * 2 / 16) * sl;
          var innerR = 60 + Math.random() * 20;
          var outerR = 150 + Math.random() * 100;
          ctx.beginPath();
          ctx.moveTo(burstX + Math.cos(lineAngle) * innerR, burstY + Math.sin(lineAngle) * innerR);
          ctx.lineTo(burstX + Math.cos(lineAngle) * outerR, burstY + Math.sin(lineAngle) * outerR);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // Draw motion trail for special moves
    if (this.isUsingSpecial || this.isUsingUltimate) {
      this._motionTrail.push({
        x: this.position.x,
        y: this.position.y,
        w: this.width,
        h: this.height,
        color: bodyColor,
        alpha: 0.4,
        life: 6
      });
      if (this._motionTrail.length > 5) {
        this._motionTrail.shift();
      }
    } else {
      this._motionTrail.length = 0;
    }

    // Render motion trail
    for (var ti = 0; ti < this._motionTrail.length; ti++) {
      var trail = this._motionTrail[ti];
      trail.life--;
      if (trail.life <= 0) {
        this._motionTrail.splice(ti, 1);
        ti--;
        continue;
      }
      ctx.save();
      ctx.globalAlpha = (trail.life / 6) * 0.25;
      ctx.fillStyle = trail.color;
      ctx.fillRect(trail.x, trail.y, trail.w, trail.h);
      ctx.restore();
    }

    // Buff glow
    if (this.buffTimer > 0) {
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 15 + Math.sin(this.buffTimer * 0.1) * 5;
    }

    // Invincibility flashing effect
    if (this.isInvincible) {
      ctx.globalAlpha = 0.3 + Math.abs(Math.sin(this.invincibleTimer * 0.3)) * 0.7;
    }

    // Knockdown: draw character lying on ground (rotated 90 degrees)
    if (this.isKnockedDown) {
      ctx.save();
      var cx = this.position.x + this.width / 2;
      var cy = this.position.y + this.height;
      ctx.translate(cx, cy);
      ctx.rotate(this.facingRight ? Math.PI / 2 : -Math.PI / 2);
      ctx.fillStyle = bodyColor;
      ctx.fillRect(-this.height / 2, -this.width / 2, this.height, this.width);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-this.height / 2, -this.width / 2, this.height, this.width);
      // Stars spinning above head (KOF style dazed effect)
      var starCount = 3;
      for (var si = 0; si < starCount; si++) {
        var starAngle = (Date.now() * 0.005) + (si * Math.PI * 2 / starCount);
        var starX = Math.cos(starAngle) * 20;
        var starY = Math.sin(starAngle) * 10 - this.width;
        ctx.fillStyle = '#ffff00';
        ctx.font = '12px sans-serif';
        ctx.fillText('★', starX - 6, starY);
      }
      ctx.restore(); // restore inner rotation transform
      // Name label
      if (this.charData) {
        ctx.font = isSoldierUnit ? 'bold 10px sans-serif' : 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff4444';
        ctx.fillText('DOWN!', this.position.x + this.width / 2, this.position.y - 10);
      }
      ctx.restore(); // restore outer _drawPlaceholder save
      return;
    }

    // Get-up animation: character rising from ground
    if (this.isGettingUp) {
      ctx.save();
      var getupProgress = 1 - (this.getupTimer / this.getupDuration);
      var cx2 = this.position.x + this.width / 2;
      var cy2 = this.position.y + this.height;
      var angle = (this.facingRight ? Math.PI / 2 : -Math.PI / 2) * (1 - getupProgress);
      ctx.translate(cx2, cy2);
      ctx.rotate(angle);
      ctx.fillStyle = bodyColor;
      ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
      ctx.strokeStyle = '#44aaff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-this.width / 2, -this.height, this.width, this.height);
      ctx.restore(); // restore inner rotation transform
      // Rising text
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#44aaff';
      ctx.fillText('RISE!', this.position.x + this.width / 2, this.position.y - 10);
      ctx.restore(); // restore outer _drawPlaceholder save
      return;
    }

    // Body with detailed character rendering
    var px = this.position.x;
    var py = this.position.y;
    var w = this.width;
    var h = this.height;
    var dir = this.facingRight ? 1 : -1;

    // Animation offsets
    var breathe = Math.sin(Date.now() * 0.004) * 1.5;
    var runBob = (this.currentAnim === ANIM.RUN) ? Math.sin(Date.now() * 0.015) * 3 : 0;
    var armSwing = (this.currentAnim === ANIM.RUN) ? Math.sin(Date.now() * 0.015) * 0.4 : 0;
    var legSwing = (this.currentAnim === ANIM.RUN) ? Math.sin(Date.now() * 0.015) * 0.5 : 0;

    ctx.fillStyle = bodyColor;

    if (this.isBlocking) {
      py += 12;
      h -= 12;
    }

    // --- Legs ---
    var legW = w * 0.22;
    var legH = h * 0.38;
    var legY = py + h - legH;
    // Left leg
    ctx.save();
    ctx.translate(px + w * 0.28, legY);
    ctx.rotate(legSwing);
    ctx.fillStyle = this._darkenColor(bodyColor, 0.6);
    ctx.fillRect(-legW / 2, 0, legW, legH);
    // Boot
    ctx.fillStyle = '#333';
    ctx.fillRect(-legW / 2 - 2, legH - 8, legW + 4, 8);
    ctx.restore();
    // Right leg
    ctx.save();
    ctx.translate(px + w * 0.72, legY);
    ctx.rotate(-legSwing);
    ctx.fillStyle = this._darkenColor(bodyColor, 0.6);
    ctx.fillRect(-legW / 2, 0, legW, legH);
    ctx.fillStyle = '#333';
    ctx.fillRect(-legW / 2 - 2, legH - 8, legW + 4, 8);
    ctx.restore();

    // --- Torso ---
    var torsoH = h * 0.42;
    var torsoY = py + h * 0.2 + breathe + runBob;
    var torsoW = w * 0.75;
    var torsoX = px + (w - torsoW) / 2;

    // Torso body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(torsoX, torsoY + torsoH);
    ctx.lineTo(torsoX, torsoY + 8);
    ctx.quadraticCurveTo(torsoX + torsoW / 2, torsoY - 2, torsoX + torsoW, torsoY + 8);
    ctx.lineTo(torsoX + torsoW, torsoY + torsoH);
    ctx.closePath();
    ctx.fill();

    // Armor/clothing detail
    ctx.strokeStyle = this._lightenColor(bodyColor, 1.3);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(torsoX + torsoW * 0.3, torsoY + 6);
    ctx.lineTo(torsoX + torsoW * 0.5, torsoY + torsoH * 0.6);
    ctx.lineTo(torsoX + torsoW * 0.7, torsoY + 6);
    ctx.stroke();

    // Belt / sash
    ctx.fillStyle = '#c9a84c';
    ctx.fillRect(torsoX - 2, torsoY + torsoH - 6, torsoW + 4, 6);

    if (isSoldierUnit) {
      // Soldier armor plate
      ctx.fillStyle = 'rgba(200,200,200,0.2)';
      ctx.fillRect(torsoX + 3, torsoY + 10, torsoW - 6, torsoH * 0.4);
    }

    // --- Arms ---
    var armW = w * 0.16;
    var armH = h * 0.35;
    var shoulderY = torsoY + 8;

    // Back arm
    ctx.save();
    ctx.translate(px + (this.facingRight ? w * 0.15 : w * 0.85), shoulderY);
    ctx.rotate(-armSwing * 0.7);
    ctx.fillStyle = this._darkenColor(bodyColor, 0.7);
    ctx.fillRect(-armW / 2, 0, armW, armH);
    // Hand
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.arc(0, armH, armW * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Front arm (with weapon during attack)
    ctx.save();
    var frontArmX = px + (this.facingRight ? w * 0.85 : w * 0.15);
    ctx.translate(frontArmX, shoulderY);
    var attackAngle = 0;
    if (this.isAttacking && !this.isUsingSpecial) {
      attackAngle = dir * (this.attackType === 1 ? -0.6 : -0.9);
    }
    ctx.rotate(armSwing * 0.7 + attackAngle);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-armW / 2, 0, armW, armH);
    // Hand
    ctx.fillStyle = '#d4a574';
    ctx.beginPath();
    ctx.arc(0, armH, armW * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Weapon in hand (for heroes)
    if (!isSoldierUnit && this.charData && this.charData.weapon) {
      ctx.strokeStyle = '#ddd';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, armH);
      var weapLen = this.attackBox.width * 0.7;
      if (this.isAttacking) weapLen *= 1.2;
      ctx.lineTo(dir * weapLen * 0.3, armH + weapLen * 0.6);
      ctx.stroke();
      // Weapon glow during attack — enhanced with colour and blur
      if (this.isAttacking) {
        var glowColor = this.isUsingSpecial && this.currentSpecialMove
          ? (this.currentSpecialMove.color || 'rgba(255,255,100,0.7)')
          : 'rgba(255,255,100,0.6)';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = this.isUsingUltimate ? 25 : (this.isUsingSpecial ? 18 : 10);
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = this.isUsingUltimate ? 8 : (this.isUsingSpecial ? 6 : 5);
        ctx.stroke();
        // Second glow layer for specials
        if (this.isUsingSpecial) {
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
    }
    ctx.restore();

    // Weapon for soldiers
    if (isSoldierUnit && this.soldierType) {
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 2;
      var weapX = this.facingRight ? px + w : px;
      var weapY = shoulderY + armH * 0.5;
      ctx.beginPath();
      ctx.moveTo(weapX, weapY);
      ctx.lineTo(weapX + dir * (this.soldierType.attackRange || 30) * 0.5, weapY - 10);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;

    // --- Head ---
    var headR = w * (isSoldierUnit ? 0.28 : 0.35);
    var headX = px + w / 2;
    var headY = torsoY - headR + 4 + breathe;

    // Neck
    ctx.fillStyle = '#d4a574';
    ctx.fillRect(headX - 4, headY + headR - 2, 8, 8);

    // Head circle
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fillStyle = '#d4a574'; // Skin tone
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Hair/helmet (colored like faction)
    ctx.beginPath();
    ctx.arc(headX, headY - 2, headR, Math.PI, 0);
    ctx.fillStyle = this._darkenColor(bodyColor, 0.5);
    ctx.fill();

    // Hero helmet ornament
    if (!isSoldierUnit) {
      ctx.fillStyle = '#c9a84c';
      ctx.beginPath();
      ctx.moveTo(headX, headY - headR - 6);
      ctx.lineTo(headX - 5, headY - headR + 2);
      ctx.lineTo(headX + 5, headY - headR + 2);
      ctx.closePath();
      ctx.fill();
    }

    // Eyes
    var eyeDir = this.facingRight ? 1 : -1;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(headX + eyeDir * 4, headY - 1, isSoldierUnit ? 3 : 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(headX + eyeDir * 5, headY - 1, isSoldierUnit ? 1.5 : 2, 0, Math.PI * 2);
    ctx.fill();

    // Eyebrow (angry during attack)
    if (this.isAttacking || this.isUsingSpecial) {
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(headX + eyeDir * 1, headY - 5);
      ctx.lineTo(headX + eyeDir * 8, headY - 3);
      ctx.stroke();
    }

    // Mouth
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (this.isAttacking || this.isUsingSpecial) {
      // Open mouth when attacking
      ctx.arc(headX + eyeDir * 2, headY + 5, 3, 0, Math.PI);
    } else {
      ctx.moveTo(headX - 3, headY + 5);
      ctx.lineTo(headX + 3, headY + 5);
    }
    ctx.stroke();

    // Name label with shadow for readability
    if (this.charData) {
      ctx.font = isSoldierUnit ? 'bold 10px sans-serif' : 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText(this.charData.name, px + w / 2 + 1, headY - headR - 9);
      ctx.fillStyle = '#fff';
      ctx.fillText(this.charData.name, px + w / 2, headY - headR - 10);
    }

    // Blocking shield effect
    if (this.isBlocking) {
      ctx.strokeStyle = '#44aaff';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.01) * 0.2;
      var shieldX = this.facingRight ? this.position.x - 5 : this.position.x + this.width - 15;
      ctx.beginPath();
      ctx.arc(shieldX + 10, this.position.y + this.height * 0.4, 20, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Charging effect
    if (this.isCharging) {
      var chargeAlpha = 0.3 + Math.sin(Date.now() * 0.02) * 0.2;
      ctx.fillStyle = 'rgba(0, 200, 255, ' + chargeAlpha + ')';
      ctx.beginPath();
      ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, 
              this.width * 0.8 + Math.sin(Date.now() * 0.015) * 5, 0, Math.PI * 2);
      ctx.fill();

      // Energy particles rising
      for (var i = 0; i < 3; i++) {
        var px = this.position.x + Math.random() * this.width;
        var py = this.position.y + this.height - Math.random() * this.height * 1.5;
        ctx.fillStyle = 'rgba(100, 220, 255, ' + (Math.random() * 0.5 + 0.3) + ')';
        ctx.beginPath();
        ctx.arc(px, py, Math.random() * 3 + 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Attack effect
    if (this.isAttacking || this.isUsingSpecial) {
      if (this.isUsingSpecial && this.currentSpecialMove) {
        // Special move visual effect
        var moveColor = this.currentSpecialMove.color || '#ffcc00';
        var moveType = this.currentSpecialMove.type;

        ctx.fillStyle = moveColor;
        ctx.globalAlpha = 0.5;

        if (moveType === MOVE_TYPE.AREA || moveType === MOVE_TYPE.SPIN) {
          // Area/Spin: circle around character
          ctx.beginPath();
          var areaR = this.width * 1.5 + Math.sin(this.attackFrame * 0.3) * 10;
          ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, areaR, 0, Math.PI * 2);
          ctx.fill();
        } else if (moveType === MOVE_TYPE.UPPERCUT) {
          // Uppercut: vertical slash
          ctx.fillRect(
            this.position.x + this.width / 2 - 10,
            this.position.y - 30 - this.attackFrame * 2,
            20,
            this.height + this.attackFrame * 2
          );
        } else if (moveType === MOVE_TYPE.SLAM) {
          // Slam: ground impact
          ctx.beginPath();
          ctx.ellipse(
            this.position.x + this.width / 2,
            this.position.y + this.height,
            this.attackFrame * 3 + 10,
            10,
            0, 0, Math.PI * 2
          );
          ctx.fill();
        } else if (moveType === MOVE_TYPE.RUSH) {
          // Rush: trail effect
          var trailDir = this.facingRight ? -1 : 1;
          for (var j = 0; j < 4; j++) {
            ctx.globalAlpha = 0.3 - j * 0.07;
            ctx.fillRect(
              this.position.x + trailDir * j * 15,
              this.position.y,
              this.width,
              this.height
            );
          }
        } else if (moveType === MOVE_TYPE.COUNTER) {
          // Counter: shield flash
          ctx.strokeStyle = moveColor;
          ctx.lineWidth = 4;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2,
                  this.width + 10, 0, Math.PI * 2);
          ctx.stroke();
        } else if (moveType === MOVE_TYPE.BUFF) {
          // Buff: aura glow
          ctx.fillStyle = moveColor;
          ctx.globalAlpha = 0.3 + Math.sin(this.attackFrame * 0.2) * 0.15;
          ctx.beginPath();
          ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2,
                  this.width + 15, 0, Math.PI * 2);
          ctx.fill();
        } else if (moveType === MOVE_TYPE.GRAB) {
          // Grab: hand/claw reaching out
          var grabDir = this.facingRight ? 1 : -1;
          ctx.fillRect(
            this.position.x + (this.facingRight ? this.width : -40),
            this.position.y + 20,
            40, 30
          );
        } else {
          // Default: attack box
          ctx.fillRect(
            this.attackBox.position.x,
            this.attackBox.position.y,
            this.attackBox.width,
            this.attackBox.height
          );
        }

        ctx.globalAlpha = 1;

        // Move name display
        ctx.fillStyle = moveColor;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.currentSpecialMove.name, this.position.x + this.width / 2, this.position.y - 30);
      } else {
        // Basic attack visual
        ctx.fillStyle = 'rgba(0, 255, 0, 0.35)';
        ctx.fillRect(
          this.attackBox.position.x,
          this.attackBox.position.y,
          this.attackBox.width,
          this.attackBox.height
        );

        // Weapon line
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        var weaponStartX = this.facingRight
          ? this.position.x + this.width
          : this.position.x;
        var weaponEndX = this.facingRight
          ? this.attackBox.position.x + this.attackBox.width
          : this.attackBox.position.x;
        var weaponY = this.position.y + this.height * 0.3;
        ctx.beginPath();
        ctx.moveTo(weaponStartX, weaponY);
        ctx.lineTo(weaponEndX, weaponY - 10);
        ctx.stroke();
      }
    }

    // Hitstun flash
    if (this.hitstun > 0 && this.hitstun % 4 < 2) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    // Invincibility aura (blue/white flash after getting up)
    if (this.isInvincible) {
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2,
              this.width * 0.8 + Math.sin(this.invincibleTimer * 0.2) * 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Buff indicator
    if (this.buffTimer > 0) {
      ctx.fillStyle = 'rgba(255, 170, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2,
              this.width * 0.6 + Math.sin(Date.now() * 0.008) * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /* ---- Color utility methods ---- */
  _darkenColor(hex, factor) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    r = Math.floor(r * factor);
    g = Math.floor(g * factor);
    b = Math.floor(b * factor);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  _lightenColor(hex, factor) {
    var r = Math.min(255, Math.floor(parseInt(hex.slice(1, 3), 16) * factor));
    var g = Math.min(255, Math.floor(parseInt(hex.slice(3, 5), 16) * factor));
    var b = Math.min(255, Math.floor(parseInt(hex.slice(5, 7), 16) * factor));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  _colorToRgba(color, alpha) {
    // Handle hex colors (#rrggbb)
    if (color.charAt(0) === '#') {
      var r = parseInt(color.slice(1, 3), 16);
      var g = parseInt(color.slice(3, 5), 16);
      var b = parseInt(color.slice(5, 7), 16);
      if (isNaN(r)) r = 255;
      if (isNaN(g)) g = 200;
      if (isNaN(b)) b = 100;
      return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }
    // Handle rgb() colors
    var match = color.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/);
    if (match) {
      return 'rgba(' + match[1] + ',' + match[2] + ',' + match[3] + ',' + alpha + ')';
    }
    // Handle rgba() colors — replace existing alpha
    var matchA = color.match(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\s*\)/);
    if (matchA) {
      return 'rgba(' + matchA[1] + ',' + matchA[2] + ',' + matchA[3] + ',' + alpha + ')';
    }
    // Fallback
    return 'rgba(255, 200, 100, ' + alpha + ')';
  }
}
