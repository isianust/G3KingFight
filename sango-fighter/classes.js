var Sprite = class Sprite {
  constructor(config) {
    config = config || {};
    this.position = config.position || { x: 0, y: 0 };
    this.width = config.width || 50;
    this.height = config.height || 150;
    this.color = config.color || '#888';
    this.scale = config.scale || 1;
    this.framesMax = config.framesMax || 1;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
    this.framesHold = 8;
    this.offset = config.offset || { x: 0, y: 0 };
    this.image = null;
    this.loaded = false;

    if (config.imageSrc) {
      this.image = new Image();
      this.image.onload = () => {
        this.loaded = true;
      };
      this.image.src = config.imageSrc;
    }
  }

  draw(ctx) {
    if (this.loaded && this.image) {
      var fw = this.image.width / this.framesMax;
      var fh = this.image.height;
      ctx.drawImage(
        this.image,
        fw * this.framesCurrent,
        0,
        fw,
        fh,
        this.position.x - this.offset.x,
        this.position.y - this.offset.y,
        fw * this.scale,
        fh * this.scale,
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
};

var Projectile = class Projectile {
  constructor(config) {
    config = config || {};
    this.position = { x: config.x || 0, y: config.y || 0 };
    this.vx = config.vx || 0;
    this.vy = config.vy || 0;
    this.damage = config.damage || 0;
    this.color = config.color || '#ffcc00';
    this.owner = config.owner || null;
    this.width = config.width || 30;
    this.height = config.height || 15;
    this.life = config.life || 90;
    this.active = true;
    this.trail = [];
  }

  update(ctx) {
    if (!this.active) return;

    this.trail.unshift({
      x: this.position.x + this.width / 2,
      y: this.position.y + this.height / 2,
      life: 6,
      r: this.height * 0.3,
    });
    if (this.trail.length > 6) this.trail.pop();

    this.position.x += this.vx;
    this.position.y += this.vy;
    this.life--;

    for (var i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life--;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }

    if (this.life <= 0 || this.position.x < -50 || this.position.x > CANVAS_W + 50) {
      this.active = false;
      return;
    }

    if (ctx) this.draw(ctx);
  }

  draw(ctx) {
    if (!this.active) return;

    ctx.save();
    var alpha = Math.min(1, this.life / 20);

    for (var i = this.trail.length - 1; i >= 0; i--) {
      var t = this.trail[i];
      ctx.globalAlpha = alpha * (t.life / 6) * 0.5;
      ctx.fillStyle = i < 2 ? '#ffffff' : this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(t.x, t.y, Math.max(1, t.r * (t.life / 6)), 0, Math.PI * 2);
      ctx.fill();
    }

    var cx = this.position.x + this.width / 2;
    var cy = this.position.y + this.height / 2;
    ctx.globalAlpha = alpha * 0.35;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width / 2 + 4, this.height / 2 + 4, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.width / 4, this.height / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};

var Fighter = class Fighter extends Sprite {
  constructor(config) {
    config = config || {};
    super(config);

    this.velocity = config.velocity || { x: 0, y: 0 };
    this.isSoldier = !!config.isSoldier;
    this.soldierType = config.soldierType || null;

    if (this.isSoldier && this.soldierType) {
      this.maxHealth = HERO_MAX_HEALTH * this.soldierType.healthMultiplier;
      this.health = this.maxHealth;
    } else {
      this.maxHealth = HERO_MAX_HEALTH;
      this.health = HERO_MAX_HEALTH;
    }

    this.knockdownThreshold = 100;
    this.isKnockedDown = false;
    this.knockdownTimer = 0;
    this.knockdownDuration = 60;
    this.isGettingUp = false;
    this.getupTimer = 0;
    this.getupDuration = 30;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.invincibleDuration = 45;
    this.knockdownBar = this.knockdownThreshold;
    this.knockdownBarMax = this.knockdownThreshold;
    this.knockdownBarRecovery = 2;

    this.energy = 0;
    this.maxEnergy = MAX_ENERGY;
    this.isCharging = false;

    var attackBox = config.attackBox || { offset: { x: 0, y: 0 }, width: 100, height: 50 };
    this.attackBox = {
      position: { x: this.position.x, y: this.position.y },
      offset: attackBox.offset,
      width: attackBox.width,
      height: attackBox.height,
    };
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.attackDuration = 0;
    this.attackFrame = 0;
    this.attackType = 1;
    this.hasHitThisSwing = false;

    this.isUsingSpecial = false;
    this.currentSpecialMove = null;
    this.specialTimer = 0;
    this.specialPhase = 0;
    this.specialHitsRemaining = 0;
    this.isUsingUltimate = false;
    this.ultimateFlash = 0;
    this._motionTrail = [];

    this.buffTimer = 0;
    this.buffMultiplier = 1;

    this.isBlocking = false;
    this.blockStun = 0;
    this.isCrouching = false;

    this.facingRight = config.facingRight !== undefined ? config.facingRight : true;
    this.speed = DEFAULT_SPEED;
    this.jumpForce = DEFAULT_JUMP_FORCE;
    this.onGround = false;

    this.currentAnim = ANIM.IDLE;
    this.hitstun = 0;
    this.knockbackVel = 0;
    this.dead = false;
    this.deathAnimDone = false;

    this.charData = config.charData || null;
    this.inputBuffer = [];
    this.inputBufferTimer = 0;

    this.spriteSheets = {};
    var sprites = config.sprites || {};
    for (var key in sprites) {
      if (!Object.prototype.hasOwnProperty.call(sprites, key)) continue;
      var value = sprites[key];
      this.spriteSheets[key] = {
        image: null,
        loaded: false,
        framesMax: value.framesMax || 1,
      };
      if (value.imageSrc) {
        var img = new Image();
        var currentEntry = this.spriteSheets[key];
        img.onload = (function(entryRef) {
          return function() {
            entryRef.loaded = true;
          };
        })(currentEntry);
        img.src = value.imageSrc;
        currentEntry.image = img;
      }
    }

    this._actionSprites = null;
    this._spriteFrameIdx = 0;
    this._spriteFrameElapsed = 0;
    this._spriteFrameHold = 8;
    this._prevAnim = null;

    this.keys = {
      left: false,
      right: false,
      jump: false,
      attack1: false,
      attack2: false,
      block: false,
      charge: false,
    };

    this._atkMultiplier = 1;
    this._defMultiplier = 1;
  }

  _getRelativeDirection() {
    var dir = [];
    if (this.keys.left) dir.push(this.facingRight ? 'B' : 'F');
    if (this.keys.right) dir.push(this.facingRight ? 'F' : 'B');
    if (this.keys.jump) dir.push('U');
    return dir;
  }

  recordInput(rawDir) {
    if (this.inputBufferTimer > 0 && this.inputBuffer.length > 0) {
      var last = this.inputBuffer[this.inputBuffer.length - 1];
      if (last !== rawDir) this.inputBuffer.push(rawDir);
    } else {
      this.inputBuffer = [rawDir];
    }
    this.inputBufferTimer = INPUT_BUFFER_MAX_TIME;
  }

  matchCommand(command) {
    if (!command || this.inputBuffer.length < command.length) return false;
    var start = this.inputBuffer.length - command.length;
    for (var i = 0; i < command.length; i++) {
      if (this.inputBuffer[start + i] !== command[i]) return false;
    }
    return true;
  }

  checkCommandInput(command) {
    return this.matchCommand(command);
  }

  trySpecialMove() {
    if (this.isSoldier || !this.charData || !this.charData.moves) return false;
    if (this.isUsingSpecial || this.isUsingUltimate || this.dead || this.hitstun > 0) return false;

    if (this.charData.ultimate && this.energy >= this.charData.ultimate.energyCost) {
      var ult = this.charData.ultimate;
      if (this.matchCommand(['D', 'DF', 'F', 'D', 'DF', 'F']) || (this.keys.attack1 && this.keys.attack2 && this.energy >= MAX_ENERGY)) {
        this.executeSpecialMove(ult, true);
        return true;
      }
    }

    var moves = this.charData.moves.slice().sort(function(a, b) {
      return b.energyCost - a.energyCost;
    });
    for (var i = 0; i < moves.length; i++) {
      var move = moves[i];
      if (this.energy >= move.energyCost && this.matchCommand(move.command)) {
        this.executeSpecialMove(move, false);
        return true;
      }
    }
    return false;
  }

  executeSpecialMove(move, isUltimate) {
    this.isUsingSpecial = true;
    this.isUsingUltimate = !!isUltimate;
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

    if (isUltimate) this.ultimateFlash = 30;

    if (move.selfDamage) {
      var selfDmg = (this.maxHealth * move.selfDamage) / 100;
      this.health -= selfDmg;
      if (this.health < 1) this.health = 1;
    }

    if (move.type === MOVE_TYPE.BUFF && move.buffDuration) {
      this.buffTimer = move.buffDuration;
      this.buffMultiplier = move.buffMultiplier || 1.5;
    }
  }

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

  startBlock() {
    if (this.dead || this.isAttacking || this.isUsingSpecial || this.hitstun > 0) return;
    this.isBlocking = true;
    this.currentAnim = ANIM.BLOCK;
  }

  stopBlock() {
    this.isBlocking = false;
    if (this.blockStun <= 0) this.currentAnim = ANIM.IDLE;
  }

  startCharge() {
    if (this.dead || this.isAttacking || this.isUsingSpecial || this.hitstun > 0 || this.energy >= this.maxEnergy) return;
    this.isCharging = true;
    this.currentAnim = ANIM.CHARGE;
  }

  stopCharge() {
    this.isCharging = false;
    if (this.hitstun <= 0 && !this.isAttacking) this.currentAnim = ANIM.IDLE;
  }

  spawnProjectile(move, effectsRenderer) {
    if (!move || move.type !== MOVE_TYPE.PROJECTILE) return null;
    if (effectsRenderer && typeof effectsRenderer.addProjectile === 'function') {
      return effectsRenderer.addProjectile(this, move);
    }

    var dir = this.facingRight ? 1 : -1;
    return new Projectile({
      x: this.position.x + (this.facingRight ? this.width + 10 : -40),
      y: this.position.y + this.height * 0.3,
      vx: dir * 8,
      vy: 0,
      damage: Math.round(move.damage * (this._atkMultiplier || 1) * this.buffMultiplier),
      color: move.color || '#ffcc00',
      owner: this,
      width: 30,
      height: 15,
      life: 90,
    });
  }

  takeHit(damage, knockback, attackType) {
    if (this.dead) return;
    if (this.isInvincible || this.isKnockedDown || this.isGettingUp) return;

    if (this.isBlocking) {
      this.blockStun = 8;
      this.energy += 3;
      if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;
      return;
    }

    this.isCharging = false;
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

    var barDamage = KNOCKDOWN_BAR_LIGHT;
    if (attackType === 'heavy') barDamage = KNOCKDOWN_BAR_HEAVY;
    else if (attackType === 'special') barDamage = KNOCKDOWN_BAR_SPECIAL;

    this.knockdownBar -= barDamage;

    if (this.knockdownBar <= 0) {
      this.knockdownBar = 0;
      this._startKnockdown(knockback);
      this.isAttacking = false;
      this.isUsingSpecial = false;
      this.attackDuration = 0;
    } else {
      this.hitstun = attackType === 'heavy' ? HITSTUN_HEAVY : HITSTUN_LIGHT;
      this.knockbackVel = knockback * 0.5;
      this.currentAnim = ANIM.TAKE_HIT;
      this.isAttacking = false;
      this.isUsingSpecial = false;
      this.attackDuration = 0;
    }
  }

  _startKnockdown(knockback) {
    this.isKnockedDown = true;
    this.knockdownTimer = this.knockdownDuration;
    this.currentAnim = ANIM.KNOCKDOWN;
    this.knockbackVel = knockback * 1.5;
    this.velocity.y = -8;
    this.onGround = false;
    this.isAttacking = false;
    this.isUsingSpecial = false;
    this.isBlocking = false;
    this.isCharging = false;
    this.isCrouching = false;
    this.hitstun = 0;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
    this.knockdownBar = this.knockdownBarMax;
  }

  _startGetup() {
    this.isKnockedDown = false;
    this.isGettingUp = true;
    this.getupTimer = this.getupDuration;
    this.currentAnim = ANIM.GETUP;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
  }

  _startInvincibility() {
    this.isGettingUp = false;
    this.isInvincible = true;
    this.invincibleTimer = this.invincibleDuration;
    this.currentAnim = ANIM.IDLE;
  }

  updateFighter(ctx, opponent) {
    if (this.dead) {
      this._drawPlaceholder(ctx);
      if (!this.deathAnimDone) {
        this.height = Math.max(30, this.height - 3);
        if (this.height <= 30) this.deathAnimDone = true;
      }
      return;
    }

    if (this.isKnockedDown) {
      this.position.x += this.knockbackVel;
      this.knockbackVel *= 0.9;
      this.velocity.y += GRAVITY;
      this.position.y += this.velocity.y;

      if (this.position.y + this.height >= GROUND_Y) {
        this.position.y = GROUND_Y - this.height;
        this.velocity.y = 0;
        this.onGround = true;
        this.knockdownTimer--;
        if (this.knockdownTimer <= 0) this._startGetup();
      }

      if (this.position.x < 0) this.position.x = 0;
      if (this.position.x + this.width > CANVAS_W) this.position.x = CANVAS_W - this.width;

      this._drawPlaceholder(ctx);
      return;
    }

    if (this.isGettingUp) {
      this.getupTimer--;
      if (this.getupTimer <= 0) this._startInvincibility();
      this._drawPlaceholder(ctx);
      return;
    }

    if (this.isInvincible) {
      this.invincibleTimer--;
      if (this.invincibleTimer <= 0) this.isInvincible = false;
    }

    if (this.hitstun <= 0 && this.knockdownBar < this.knockdownBarMax) {
      this.knockdownBar = Math.min(this.knockdownBarMax, this.knockdownBar + this.knockdownBarRecovery);
    }

    if (this.inputBufferTimer > 0) {
      this.inputBufferTimer--;
      if (this.inputBufferTimer <= 0) this.inputBuffer = [];
    }

    if (this.buffTimer > 0) {
      this.buffTimer--;
      if (this.buffTimer <= 0) this.buffMultiplier = 1;
    }

    if (this.blockStun > 0) this.blockStun--;
    if (this.ultimateFlash > 0) this.ultimateFlash--;

    if (this.isCharging && !this.isAttacking && this.hitstun <= 0) {
      this.energy += ENERGY_GAIN_CHARGE;
      if (this.energy >= this.maxEnergy) {
        this.energy = this.maxEnergy;
        this.isCharging = false;
      }
    }

    var backKey = this.facingRight ? this.keys.left : this.keys.right;
    var downForBlock = this.keys.block;
    this.isCrouching = !!(downForBlock && !backKey && this.onGround && !this.isAttacking && !this.isUsingSpecial && this.hitstun <= 0 && !this.isCharging);

    if (backKey && downForBlock && !this.isAttacking && !this.isUsingSpecial && this.hitstun <= 0) {
      this.startBlock();
    } else if (this.isBlocking && !(backKey && downForBlock)) {
      this.stopBlock();
    }

    if (this.hitstun > 0) {
      this.hitstun--;
      this.position.x += this.knockbackVel;
      this.knockbackVel *= 0.85;
      if (this.hitstun === 0) this.currentAnim = ANIM.IDLE;
    } else if (!this.isBlocking) {
      var moveX = 0;
      if (!this.isCharging && !this.isUsingSpecial) {
        if (this.keys.left) moveX -= this.speed;
        if (this.keys.right) moveX += this.speed;
      }

      if (this.isUsingSpecial && this.currentSpecialMove) {
        var moveType = this.currentSpecialMove.type;
        if (moveType === MOVE_TYPE.RUSH) {
          moveX = (this.facingRight ? 1 : -1) * (this.speed * 2.5);
        } else if (moveType === MOVE_TYPE.SPIN) {
          moveX = (this.facingRight ? 1 : -1) * (this.speed * 1.5);
        }
      }

      this.position.x += moveX;

      if (opponent && !this.isAttacking && !this.isUsingSpecial) {
        this.facingRight = this.position.x < opponent.position.x;
      }

      if (this.keys.jump && this.onGround && !this.isCharging && !this.isUsingSpecial) {
        this.velocity.y = this.jumpForce;
        this.onGround = false;
      }

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

      if (relDir) this.recordInput(relDir);

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

      if (this.keys.charge && !this.isCharging && !this.isAttacking && !this.isUsingSpecial) {
        this.startCharge();
      } else if (!this.keys.charge && this.isCharging) {
        this.stopCharge();
      }
    }

    this.velocity.y += GRAVITY;
    this.position.y += this.velocity.y;

    if (this.position.y + this.height >= GROUND_Y) {
      this.position.y = GROUND_Y - this.height;
      this.velocity.y = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    if (this.position.x < 0) this.position.x = 0;
    if (this.position.x + this.width > CANVAS_W) this.position.x = CANVAS_W - this.width;

    var specialRange = 1;
    if (this.isUsingSpecial && this.currentSpecialMove) {
      if (this.currentSpecialMove.type === MOVE_TYPE.AREA) specialRange = 2;
      else if (this.currentSpecialMove.type === MOVE_TYPE.SPIN) specialRange = 1.5;
      else if (this.currentSpecialMove.type === MOVE_TYPE.SLAM) specialRange = 1.3;
    }

    var atkW = this.attackBox.width * specialRange;
    var atkOffX = this.facingRight ? this.attackBox.offset.x : -(this.attackBox.offset.x + atkW);
    this.attackBox.position.x = this.position.x + (this.facingRight ? this.width : 0) + atkOffX;
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y + (this.isCrouching ? 14 : 0);

    if (this.isAttacking || this.isUsingSpecial) {
      this.attackFrame++;
      if (this.isUsingSpecial && this.currentSpecialMove && this.specialHitsRemaining > 0) {
        var hitInterval = Math.floor(this.attackDuration / (this.currentSpecialMove.hits || 1));
        if (hitInterval < 4) hitInterval = 4;
        if (this.attackFrame % hitInterval === 0) {
          this.hasHitThisSwing = false;
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

    if (this.attackCooldown > 0) this.attackCooldown--;

    if (this.hitstun <= 0 && !this.isAttacking && !this.isUsingSpecial && !this.isBlocking && !this.isCharging && !this.isKnockedDown && !this.isGettingUp) {
      if (this.isCrouching) {
        this.currentAnim = ANIM.BLOCK;
      } else if (!this.onGround && this.velocity.y < 0) {
        this.currentAnim = ANIM.JUMP;
      } else if (!this.onGround && this.velocity.y >= 0) {
        this.currentAnim = ANIM.FALL;
      } else if (this.keys.left || this.keys.right) {
        this.currentAnim = ANIM.RUN;
      } else {
        this.currentAnim = ANIM.IDLE;
      }
    }

    this._drawPlaceholder(ctx);
  }

  _drawPlaceholder(ctx) {
    ctx.save();
    var bodyColor = this.charData ? this.charData.color : this.color;

    if (!this._actionSprites && typeof generateCharacterSprites === 'function') {
      var spriteCharacter = this.charData || { color: this.color, weapon: '' };
      if (this.isSoldier) spriteCharacter.isSoldier = true;
      this._actionSprites = generateCharacterSprites(spriteCharacter);
    }

    if (this.ultimateFlash > 0) {
      var flashProgress = this.ultimateFlash / 30;
      var moveColor = (this.currentSpecialMove && this.currentSpecialMove.color) || '#ffd700';
      var burstX = this.position.x + this.width / 2;
      var burstY = this.position.y + this.height / 2;
      var burstR = (1 - flashProgress) * 300 + 50;
      var burstGrad = ctx.createRadialGradient(burstX, burstY, 0, burstX, burstY, burstR);
      burstGrad.addColorStop(0, 'rgba(255,255,255,' + flashProgress * 0.7 + ')');
      burstGrad.addColorStop(0.4, this._colorToRgba(moveColor, flashProgress * 0.4));
      burstGrad.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = 'rgba(255,255,200,' + flashProgress * 0.5 + ')';
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

    if (this.isUsingSpecial || this.isUsingUltimate) {
      this._motionTrail.push({ x: this.position.x, y: this.position.y, w: this.width, h: this.height, color: bodyColor, life: 6 });
      if (this._motionTrail.length > 5) this._motionTrail.shift();
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

    if (this.buffTimer > 0) {
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 15 + Math.sin(this.buffTimer * 0.1) * 5;
    }

    if (this.isInvincible) {
      ctx.globalAlpha = 0.3 + Math.abs(Math.sin(this.invincibleTimer * 0.3)) * 0.7;
    }

    var animAction = this.currentAnim;
    if (this.isKnockedDown) animAction = ANIM.KNOCKDOWN;
    else if (this.isGettingUp) animAction = ANIM.GETUP;
    else if (this.dead) animAction = ANIM.DEATH;

    var spriteDrawn = this._drawActionSprite(ctx, animAction);
    if (!spriteDrawn) {
      ctx.fillStyle = bodyColor;
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    if (this.isKnockedDown) {
      var starCount = 3;
      var kcx = this.position.x + this.width / 2;
      var kcy = this.position.y + this.height * 0.2;
      for (var si = 0; si < starCount; si++) {
        var starAngle = Date.now() * 0.005 + (si * Math.PI * 2) / starCount;
        var starX = kcx + Math.cos(starAngle) * 20;
        var starY = kcy + Math.sin(starAngle) * 10;
        ctx.fillStyle = '#ffff00';
        ctx.font = '12px sans-serif';
        ctx.fillText('★', starX - 6, starY);
      }
    }

    if (this.charData) {
      ctx.font = this.isSoldier ? 'bold 10px sans-serif' : 'bold 13px sans-serif';
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

    if (this.isCharging) {
      var chargeAlpha = 0.3 + Math.sin(Date.now() * 0.02) * 0.2;
      ctx.fillStyle = 'rgba(0,200,255,' + chargeAlpha + ')';
      ctx.beginPath();
      ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, this.width * 0.8 + Math.sin(Date.now() * 0.015) * 5, 0, Math.PI * 2);
      ctx.fill();
      for (var cp = 0; cp < 3; cp++) {
        var particleX = this.position.x + Math.random() * this.width;
        var particleY = this.position.y + this.height - Math.random() * this.height * 1.5;
        ctx.fillStyle = 'rgba(100,220,255,' + (Math.random() * 0.5 + 0.3) + ')';
        ctx.beginPath();
        ctx.arc(particleX, particleY, Math.random() * 3 + 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

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
          ctx.fillRect(this.position.x + this.width / 2 - 10, this.position.y - 30 - this.attackFrame * 2, 20, this.height + this.attackFrame * 2);
        } else if (moveType === MOVE_TYPE.SLAM) {
          ctx.beginPath();
          ctx.ellipse(this.position.x + this.width / 2, this.position.y + this.height, this.attackFrame * 3 + 10, 10, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (moveType === MOVE_TYPE.RUSH) {
          var trailDir = this.facingRight ? -1 : 1;
          for (var j = 0; j < 4; j++) {
            ctx.globalAlpha = 0.3 - j * 0.07;
            ctx.fillRect(this.position.x + trailDir * j * 15, this.position.y, this.width, this.height);
          }
        } else if (moveType === MOVE_TYPE.COUNTER) {
          ctx.strokeStyle = moveColor2;
          ctx.lineWidth = 4;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, this.width + 10, 0, Math.PI * 2);
          ctx.stroke();
        } else if (moveType === MOVE_TYPE.BUFF) {
          ctx.fillStyle = moveColor2;
          ctx.globalAlpha = 0.3 + Math.sin(this.attackFrame * 0.2) * 0.15;
          ctx.beginPath();
          ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, this.width + 15, 0, Math.PI * 2);
          ctx.fill();
        } else if (moveType === MOVE_TYPE.GRAB) {
          ctx.fillRect(this.position.x + (this.facingRight ? this.width : -40), this.position.y + 20, 40, 30);
        } else {
          ctx.fillRect(this.attackBox.position.x, this.attackBox.position.y, this.attackBox.width, this.attackBox.height);
        }

        ctx.globalAlpha = 1;
        ctx.fillStyle = moveColor2;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.currentSpecialMove.name, this.position.x + this.width / 2, this.position.y - 30);
      } else {
        ctx.fillStyle = 'rgba(0,255,0,0.35)';
        ctx.fillRect(this.attackBox.position.x, this.attackBox.position.y, this.attackBox.width, this.attackBox.height);
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        var weaponStartX = this.facingRight ? this.position.x + this.width : this.position.x;
        var weaponEndX = this.facingRight ? this.attackBox.position.x + this.attackBox.width : this.attackBox.position.x;
        var weaponY = this.position.y + this.height * 0.3;
        ctx.beginPath();
        ctx.moveTo(weaponStartX, weaponY);
        ctx.lineTo(weaponEndX, weaponY - 10);
        ctx.stroke();
      }
    }

    if (this.hitstun > 0 && this.hitstun % 4 < 2) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    if (this.isInvincible) {
      ctx.strokeStyle = 'rgba(100,200,255,0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, this.width * 0.8 + Math.sin(this.invincibleTimer * 0.2) * 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.buffTimer > 0) {
      ctx.fillStyle = 'rgba(255,170,0,0.4)';
      ctx.beginPath();
      ctx.arc(this.position.x + this.width / 2, this.position.y + this.height / 2, this.width * 0.6 + Math.sin(Date.now() * 0.008) * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  _drawActionSprite(ctx, animAction) {
    if (!this._actionSprites) return false;
    var frames = this._actionSprites[animAction] || this._actionSprites[ANIM.IDLE];
    if (!frames || !frames.length) return false;

    if (this._prevAnim !== animAction) {
      this._spriteFrameIdx = 0;
      this._spriteFrameElapsed = 0;
      this._prevAnim = animAction;
    }

    this._spriteFrameElapsed++;
    if (this._spriteFrameElapsed >= this._spriteFrameHold) {
      this._spriteFrameElapsed = 0;
      this._spriteFrameIdx = (this._spriteFrameIdx + 1) % frames.length;
    }

    var frame = frames[this._spriteFrameIdx] || frames[0];
    var scale = Math.max(0.7, this.height / 140);
    var drawW = frame.width * scale;
    var drawH = frame.height * scale;
    var destX = this.position.x + this.width / 2 - drawW / 2;
    var destY = this.position.y + this.height - drawH + (this.isCrouching ? 10 : 0);
    if (animAction === ANIM.KNOCKDOWN || animAction === ANIM.GETUP || animAction === ANIM.DEATH) {
      destY = this.position.y + this.height - drawH * 0.85;
    }

    ctx.save();
    if (!this.facingRight) {
      ctx.translate(this.position.x + this.width / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(this.position.x + this.width / 2), 0);
    }
    ctx.drawImage(frame.canvas, destX, destY, drawW, drawH);
    ctx.restore();
    return true;
  }

  getFactionColor() {
    if (this.charData && typeof FACTION_DATA !== 'undefined' && FACTION_DATA[this.charData.faction]) {
      return FACTION_DATA[this.charData.faction].color;
    }
    return this.charData ? this.charData.color : this.color;
  }

  getHealthBarColors(healthPercent) {
    var base = this.getFactionColor();
    if (healthPercent > 50) {
      return { start: this._darkenColor(base, 0.85), end: this._lightenColor(base, 1.3) };
    }
    if (healthPercent > 25) {
      return { start: '#c68a22', end: '#ffd24a' };
    }
    return { start: '#bb2222', end: '#ff5555' };
  }

  getHealthBarStyle(healthPercent) {
    var colors = this.getHealthBarColors(healthPercent);
    return 'linear-gradient(90deg,' + colors.start + ',' + colors.end + ')';
  }

  _darkenColor(hex, factor) {
    if (!hex || hex.charAt(0) !== '#') return hex || '#888';
    var r = Math.floor(parseInt(hex.slice(1, 3), 16) * factor);
    var g = Math.floor(parseInt(hex.slice(3, 5), 16) * factor);
    var b = Math.floor(parseInt(hex.slice(5, 7), 16) * factor);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  _lightenColor(hex, factor) {
    if (!hex || hex.charAt(0) !== '#') return hex || '#aaa';
    var r = Math.min(255, Math.floor(parseInt(hex.slice(1, 3), 16) * factor));
    var g = Math.min(255, Math.floor(parseInt(hex.slice(3, 5), 16) * factor));
    var b = Math.min(255, Math.floor(parseInt(hex.slice(5, 7), 16) * factor));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  _colorToRgba(color, alpha) {
    if (color && color.charAt(0) === '#') {
      var r = parseInt(color.slice(1, 3), 16);
      var g = parseInt(color.slice(3, 5), 16);
      var b = parseInt(color.slice(5, 7), 16);
      if (isNaN(r)) r = 255;
      if (isNaN(g)) g = 200;
      if (isNaN(b)) b = 100;
      return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }
    var match = color && color.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/);
    if (match) return 'rgba(' + match[1] + ',' + match[2] + ',' + match[3] + ',' + alpha + ')';
    var matchA = color && color.match(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\s*\)/);
    if (matchA) return 'rgba(' + matchA[1] + ',' + matchA[2] + ',' + matchA[3] + ',' + alpha + ')';
    return 'rgba(255,200,100,' + alpha + ')';
  }
};
