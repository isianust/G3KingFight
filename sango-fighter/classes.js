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

/* ---------- Knockdown Bar Constants ---------- */
const KNOCKDOWN_BAR_LIGHT = 20;    // knockdown bar damage from light attack
const KNOCKDOWN_BAR_HEAVY = 50;    // knockdown bar damage from heavy attack
const KNOCKDOWN_BAR_SPECIAL = 100; // knockdown bar damage from special move (instant knockdown)
const HITSTUN_LIGHT = 8;           // hitstun frames from light attack
const HITSTUN_HEAVY = 12;          // hitstun frames from heavy attack

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

    // Loaded sprite sheets (from external files, if any)
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

    // Pre-rendered action sprite sheets (canvas-based)
    // Generated by spriteGenerator.js — every action uses images
    this._actionSprites = null; // populated lazily on first draw
    this._spriteFrameIdx = 0;
    this._spriteFrameElapsed = 0;
    this._spriteFrameHold = 8; // frames between sprite advances
    this._prevAnim = null;

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
    var barDamage = KNOCKDOWN_BAR_LIGHT;
    if (attackType === 'heavy') barDamage = KNOCKDOWN_BAR_HEAVY;
    else if (attackType === 'special') barDamage = KNOCKDOWN_BAR_SPECIAL;

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
      this.hitstun = attackType === 'heavy' ? HITSTUN_HEAVY : HITSTUN_LIGHT;
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

  /* ---- Sprite-based rendering (all actions use images) ---- */
  _drawPlaceholder(ctx) {
    ctx.save();

    var bodyColor = this.charData ? this.charData.color : this.color;
    var isSoldierUnit = this.isSoldier;

    // Lazily generate action sprite sheets on first draw
    if (!this._actionSprites && typeof generateCharacterSprites === 'function') {
      this._actionSprites = generateCharacterSprites(
        this.charData || { color: this.color },
        this.width,
        this.height,
        isSoldierUnit
      );
    }

    // Ultimate flash effect — dramatic multi-layer flash
    if (this.ultimateFlash > 0) {
      var flashProgress = this.ultimateFlash / 30;
      var moveColor = (this.currentSpecialMove && this.currentSpecialMove.color) || '#ffd700';
      var burstX = this.position.x + this.width / 2;
      var burstY = this.position.y + this.height / 2;
      var burstR = (1 - flashProgress) * 300 + 50;
      var burstGrad = ctx.createRadialGradient(burstX, burstY, 0, burstX, burstY, burstR);
      burstGrad.addColorStop(0, 'rgba(255, 255, 255, ' + (flashProgress * 0.7) + ')');
      var burstRgba = this._colorToRgba(moveColor, flashProgress * 0.4);
      burstGrad.addColorStop(0.4, burstRgba);
      burstGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
      ctx.fillStyle = 'rgba(255, 255, 200, ' + (flashProgress * 0.5) + ')';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = burstGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
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

    // --- Determine which animation to render ---
    var animAction = this.currentAnim;
    if (this.isKnockedDown) animAction = ANIM.KNOCKDOWN;
    else if (this.isGettingUp) animAction = ANIM.GETUP;
    else if (this.dead) animAction = ANIM.DEATH;

    // --- Draw character sprite from pre-rendered sheet ---
    var spriteDrawn = this._drawActionSprite(ctx, animAction);

    // Fallback: if sprite not available, draw a coloured rectangle
    if (!spriteDrawn) {
      ctx.fillStyle = bodyColor;
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    // --- Name label ---
    if (this.charData) {
      ctx.font = isSoldierUnit ? 'bold 10px sans-serif' : 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      if (this.isKnockedDown) {
        ctx.fillStyle = '#ff4444';
        ctx.fillText('DOWN!', this.position.x + this.width / 2, this.position.y - 10);
      } else if (this.isGettingUp) {
        ctx.fillStyle = '#44aaff';
        ctx.fillText('RISE!', this.position.x + this.width / 2, this.position.y - 10);
      } else {
        ctx.fillStyle = '#000';
        ctx.fillText(this.charData.name, this.position.x + this.width / 2 + 1, this.position.y - 9);
        ctx.fillStyle = '#fff';
        ctx.fillText(this.charData.name, this.position.x + this.width / 2, this.position.y - 10);
      }
    }

    ctx.shadowBlur = 0;

    // --- Overlay effects (drawn on top of the sprite) ---

    // Charging effect
    if (this.isCharging) {
      var chargeAlpha = 0.3 + Math.sin(Date.now() * 0.02) * 0.2;
      ctx.fillStyle = 'rgba(0, 200, 255, ' + chargeAlpha + ')';
      ctx.beginPath();
      ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2,
              this.width * 0.8 + Math.sin(Date.now() * 0.015) * 5, 0, Math.PI * 2);
      ctx.fill();

      for (var i = 0; i < 3; i++) {
        var cpx = this.position.x + Math.random() * this.width;
        var cpy = this.position.y + this.height - Math.random() * this.height * 1.5;
        ctx.fillStyle = 'rgba(100, 220, 255, ' + (Math.random() * 0.5 + 0.3) + ')';
        ctx.beginPath();
        ctx.arc(cpx, cpy, Math.random() * 3 + 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Attack effects
    if (this.isAttacking || this.isUsingSpecial) {
      if (this.isUsingSpecial && this.currentSpecialMove) {
        var moveColor2 = this.currentSpecialMove.color || '#ffcc00';
        var moveType = this.currentSpecialMove.type;

        ctx.fillStyle = moveColor2;
        ctx.globalAlpha = 0.5;

        if (moveType === MOVE_TYPE.AREA || moveType === MOVE_TYPE.SPIN) {
          ctx.beginPath();
          var areaR = this.width * 1.5 + Math.sin(this.attackFrame * 0.3) * 10;
          ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, areaR, 0, Math.PI * 2);
          ctx.fill();
        } else if (moveType === MOVE_TYPE.UPPERCUT) {
          ctx.fillRect(
            this.position.x + this.width / 2 - 10,
            this.position.y - 30 - this.attackFrame * 2,
            20,
            this.height + this.attackFrame * 2
          );
        } else if (moveType === MOVE_TYPE.SLAM) {
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
          ctx.strokeStyle = moveColor2;
          ctx.lineWidth = 4;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2,
                  this.width + 10, 0, Math.PI * 2);
          ctx.stroke();
        } else if (moveType === MOVE_TYPE.BUFF) {
          ctx.fillStyle = moveColor2;
          ctx.globalAlpha = 0.3 + Math.sin(this.attackFrame * 0.2) * 0.15;
          ctx.beginPath();
          ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2,
                  this.width + 15, 0, Math.PI * 2);
          ctx.fill();
        } else if (moveType === MOVE_TYPE.GRAB) {
          ctx.fillRect(
            this.position.x + (this.facingRight ? this.width : -40),
            this.position.y + 20,
            40, 30
          );
        } else {
          ctx.fillRect(
            this.attackBox.position.x,
            this.attackBox.position.y,
            this.attackBox.width,
            this.attackBox.height
          );
        }

        ctx.globalAlpha = 1;

        ctx.fillStyle = moveColor2;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.currentSpecialMove.name, this.position.x + this.width / 2, this.position.y - 30);
      } else {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.35)';
        ctx.fillRect(
          this.attackBox.position.x,
          this.attackBox.position.y,
          this.attackBox.width,
          this.attackBox.height
        );

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

    // Invincibility aura
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

  /* ---- Draw one frame from the action sprite sheet ---- */
  _drawActionSprite(ctx, animAction) {
    if (!this._actionSprites) return false;

    var sheet = this._actionSprites[animAction];
    if (!sheet) {
      // Fallback to idle if the requested action has no sheet
      sheet = this._actionSprites[ANIM.IDLE];
      if (!sheet) return false;
    }

    // Advance sprite frame
    if (this._prevAnim !== animAction) {
      // Reset frame index on action change
      this._spriteFrameIdx = 0;
      this._spriteFrameElapsed = 0;
      this._prevAnim = animAction;
    }

    this._spriteFrameElapsed++;
    if (this._spriteFrameElapsed >= this._spriteFrameHold) {
      this._spriteFrameElapsed = 0;
      this._spriteFrameIdx = (this._spriteFrameIdx + 1) % sheet.frameCount;
    }

    var srcX = this._spriteFrameIdx * sheet.frameW;
    var srcY = 0;

    // Destination: position adjusted for padding
    var destX = this.position.x - sheet.padX;
    var destY = this.position.y - sheet.padY;

    ctx.save();

    // Flip horizontally if facing left
    if (!this.facingRight) {
      ctx.translate(this.position.x + this.width / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(this.position.x + this.width / 2), 0);
    }

    ctx.drawImage(
      sheet.canvas,
      srcX, srcY, sheet.frameW, sheet.frameH,
      destX, destY, sheet.frameW, sheet.frameH
    );

    ctx.restore();

    return true;
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
