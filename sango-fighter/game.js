(function () {
  function $(id) { return document.getElementById(id); }
  function show(el) { if (el) el.classList.remove('hidden'); }
  function hide(el) { if (el) el.classList.add('hidden'); }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function overlap(a, b) {
    return a.position.x < b.position.x + b.width && a.position.x + a.width > b.position.x && a.position.y < b.position.y + b.height && a.position.y + a.height > b.position.y;
  }
  function copyInputState() {
    return { left: false, right: false, up: false, down: false, attack: false, heavy: false, special: false, ultimate: false };
  }
  function getRelativeDirection(fighter, input) {
    var forward = (fighter.facingRight && input.right) || (!fighter.facingRight && input.left);
    var back = (fighter.facingRight && input.left) || (!fighter.facingRight && input.right);
    if (input.down && forward) return 'DF';
    if (input.down && back) return 'DB';
    if (input.down) return 'D';
    if (forward) return 'F';
    if (back) return 'B';
    if (input.up) return 'U';
    return '';
  }
  function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

  if (typeof window.BackgroundRenderer === 'undefined') {
    window.BackgroundRenderer = function () {
      this.particles = [];
    };
    window.BackgroundRenderer.prototype.initParticles = function () {
      this.particles = [];
      for (var i = 0; i < 24; i++) this.particles.push({ x: Math.random() * CANVAS_W, y: Math.random() * CANVAS_H, r: Math.random() * 2 + 1, vx: (Math.random() - 0.5) * 0.4, vy: -Math.random() * 0.4 - 0.1, a: Math.random() * 0.25 + 0.08 });
    };
    window.BackgroundRenderer.prototype.drawBackground = function (ctx, stage) {
      var palettes = [
        ['#1a0a2e', '#6b2d3e', '#f4c462'],
        ['#0a0a2e', '#1a1a3e', '#4a2a1a'],
        ['#250000', '#7a1400', '#ff6a00'],
        ['#122512', '#245024', '#7ac37a'],
        ['#2d3348', '#6074a0', '#f0d6a2'],
        ['#1e90ff', '#7ec8ff', '#bde7ff']
      ];
      var set = palettes[stage % palettes.length];
      var sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      sky.addColorStop(0, set[0]);
      sky.addColorStop(0.55, set[1]);
      sky.addColorStop(1, set[2]);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, CANVAS_W, GROUND_Y);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (var m = 0; m < 5; m++) {
        ctx.beginPath();
        ctx.moveTo(m * 220, GROUND_Y);
        ctx.lineTo(m * 220 + 90, GROUND_Y - 130 - (m % 2) * 40);
        ctx.lineTo(m * 220 + 200, GROUND_Y);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = stage === 2 ? '#3b2210' : stage === 3 ? '#294329' : '#6a5437';
      ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);
      ctx.fillStyle = 'rgba(255,215,0,0.14)';
      ctx.beginPath();
      ctx.arc(CANVAS_W * 0.78, 86, 42, 0, Math.PI * 2);
      ctx.fill();
      for (var i = 0; i < this.particles.length; i++) {
        var p = this.particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.y < -5) { p.y = CANVAS_H + 5; p.x = Math.random() * CANVAS_W; }
        if (p.x < -10) p.x = CANVAS_W + 10;
        if (p.x > CANVAS_W + 10) p.x = -10;
        ctx.fillStyle = 'rgba(255,220,150,' + p.a + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      for (var b = 0; b < 7; b++) ctx.fillRect(60 + b * 140, GROUND_Y - 36, 10, 36);
    };
  }

  if (typeof window.AIController === 'undefined') {
    window.AIController = function (difficulty) {
      this.difficulty = difficulty || 'easy';
    };
    window.AIController.prototype.setDifficulty = function (difficulty) { this.difficulty = difficulty || 'easy'; };
    window.AIController.prototype.update = function (cpu, target) {
      if (!cpu || !target || cpu.dead || cpu.hitstun > 0 || cpu.knockdownTimer > 0) return;
      var dx = target.position.x - cpu.position.x;
      var dist = Math.abs(dx);
      var diff = DIFFICULTY_SETTINGS[this.difficulty] || DIFFICULTY_SETTINGS.easy;
      cpu.input = copyInputState();
      var attackRange = cpu.attackBox.width + cpu.width * 0.8;
      if (target.isAttacking && dist < attackRange + 30 && Math.random() < diff.aiBlockRate) {
        cpu.input.down = true;
        if (dx > 0) cpu.input.left = true; else cpu.input.right = true;
        return;
      }
      if (dist > attackRange + 35) {
        if (dx > 0) cpu.input.right = true; else cpu.input.left = true;
        if (Math.random() < 0.012) cpu.input.up = true;
      } else if (dist < 50 && Math.random() < 0.2) {
        if (dx > 0) cpu.input.left = true; else cpu.input.right = true;
      }
      if (dist > 260 && cpu.energy < cpu.maxEnergy * 0.75 && Math.random() < 0.03) cpu.input.down = true;
      if (cpu.energy >= MAX_ENERGY && Math.random() < diff.aiUltRate) cpu.input.ultimate = true;
      else if (dist < attackRange + 55 && Math.random() < diff.aiSpecialRate) cpu.input.special = true;
      else if (dist < attackRange + 20 && Math.random() < diff.aiAttackRate) cpu.input.attack = true;
      else if (dist < attackRange + 10 && Math.random() < diff.aiAttackRate * 0.5) cpu.input.heavy = true;
    };
  }

  if (typeof window.EffectsRenderer === 'undefined') {
    window.EffectsRenderer = function () {
      this.hitEffects = [];
      this.projectiles = [];
      this.screenShake = { timer: 0, duration: 0, intensity: 0 };
    };
    window.EffectsRenderer.prototype.reset = function () {
      this.hitEffects = [];
      this.projectiles = [];
      this.screenShake = { timer: 0, duration: 0, intensity: 0 };
    };
    window.EffectsRenderer.prototype.triggerScreenShake = function (intensity, duration) {
      this.screenShake = { intensity: intensity, duration: duration, timer: duration };
    };
    window.EffectsRenderer.prototype.applyScreenShake = function (ctx) {
      if (this.screenShake.timer <= 0) return false;
      this.screenShake.timer -= 1;
      var factor = this.screenShake.timer / this.screenShake.duration;
      ctx.save();
      ctx.translate((Math.random() - 0.5) * this.screenShake.intensity * factor * 2, (Math.random() - 0.5) * this.screenShake.intensity * factor * 2);
      return true;
    };
    window.EffectsRenderer.prototype.spawnHitEffect = function (x, y, color, strong) {
      for (var i = 0; i < (strong ? 12 : 7); i++) {
        var angle = Math.PI * 2 * (i / (strong ? 12 : 7));
        this.hitEffects.push({ x: x, y: y, vx: Math.cos(angle) * (strong ? 5 : 3) * (0.6 + Math.random()), vy: Math.sin(angle) * (strong ? 5 : 3) * (0.6 + Math.random()), life: strong ? 20 : 12, maxLife: strong ? 20 : 12, color: color || '#ffcc00', size: strong ? 4 : 3 });
      }
      this.triggerScreenShake(strong ? 7 : 3, strong ? 9 : 5);
    };
    window.EffectsRenderer.prototype.drawHitEffects = function (ctx) {
      for (var i = this.hitEffects.length - 1; i >= 0; i--) {
        var fx = this.hitEffects[i];
        fx.x += fx.vx; fx.y += fx.vy; fx.vy += 0.2; fx.life -= 1;
        if (fx.life <= 0) { this.hitEffects.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = fx.life / fx.maxLife;
        ctx.fillStyle = fx.color;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, fx.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };
    window.EffectsRenderer.prototype.spawnProjectile = function (owner, move) {
      var dir = owner.facingRight ? 1 : -1;
      this.projectiles.push({ owner: owner, position: { x: owner.position.x + (dir > 0 ? owner.width + 8 : -24), y: owner.position.y + owner.height * 0.35 }, vx: dir * 8, width: 24, height: 12, damage: Math.round(move.damage * owner.attackMultiplier), color: move.color || '#ffcc00', active: true, life: 80 });
    };
    window.EffectsRenderer.prototype.updateProjectiles = function (ctx, p1, p2) {
      for (var i = this.projectiles.length - 1; i >= 0; i--) {
        var proj = this.projectiles[i];
        proj.position.x += proj.vx; proj.life -= 1;
        if (proj.life <= 0 || proj.position.x < -60 || proj.position.x > CANVAS_W + 60) { this.projectiles.splice(i, 1); continue; }
        ctx.save();
        ctx.fillStyle = proj.color;
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(proj.position.x + proj.width / 2, proj.position.y + proj.height / 2, proj.width / 2, proj.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        var target = proj.owner === p1 ? p2 : p1;
        if (target && !target.dead && overlap(proj, target)) {
          target.takeHit(Math.max(1, proj.damage), proj.vx > 0 ? 8 : -8, 'special');
          proj.owner.energy = clamp(proj.owner.energy + ENERGY_GAIN_HIT, 0, proj.owner.maxEnergy);
          this.spawnHitEffect(target.position.x + target.width / 2, target.position.y + 30, proj.color, true);
          this.projectiles.splice(i, 1);
        }
      }
    };
    window.EffectsRenderer.prototype.checkAttackCollision = function (attacker, defender) {
      if (!attacker || !defender || attacker.dead || defender.dead || !attacker.isAttacking || attacker.hasHitThisSwing) return;
      if (attacker.pendingProjectile && attacker.attackFrame === attacker.hitFrame) {
        this.spawnProjectile(attacker, attacker.currentMove);
        attacker.pendingProjectile = false;
        attacker.hasHitThisSwing = true;
        return;
      }
      if (!attacker.attackActive || attacker.attackFrame < attacker.hitFrame || attacker.attackFrame > attacker.hitFrame + attacker.hitWindow) return;
      if (!overlap(attacker.attackBox, defender)) return;
      attacker.hasHitThisSwing = true;
      var damage = attacker.damage;
      var knockback = attacker.knockback;
      defender.takeHit(damage, attacker.facingRight ? knockback : -knockback, attacker.attackKind);
      attacker.energy = clamp(attacker.energy + ENERGY_GAIN_HIT, 0, attacker.maxEnergy);
      this.spawnHitEffect(defender.position.x + defender.width / 2, defender.position.y + defender.height * 0.3, attacker.effectColor, attacker.attackKind !== 'light');
    };
  }

  if (typeof window.Fighter === 'undefined') {
    window.Fighter = function (config) {
      this.position = { x: config.position.x, y: config.position.y };
      this.velocity = { x: 0, y: 0 };
      this.width = config.width || 56;
      this.height = config.height || 140;
      this.baseHeight = this.height;
      this.color = config.color || '#999';
      this.charData = config.charData || null;
      this.isSoldier = !!config.isSoldier;
      this.soldierType = config.soldierType || null;
      this.facingRight = config.facingRight !== false;
      this.attackBox = { position: { x: this.position.x, y: this.position.y }, width: (config.attackBox && config.attackBox.width) || 90, height: (config.attackBox && config.attackBox.height) || 42, offset: (config.attackBox && config.attackBox.offset) || { x: 8, y: 20 } };
      this.maxHealth = this.isSoldier ? 60 : HERO_MAX_HEALTH;
      if (this.soldierType && this.soldierType.healthMultiplier) this.maxHealth = Math.max(40, Math.round(HERO_MAX_HEALTH * this.soldierType.healthMultiplier));
      this.health = this.maxHealth;
      this.maxEnergy = MAX_ENERGY;
      this.energy = 0;
      this.knockdownBarMax = 100;
      this.knockdownBar = 0;
      this.attackMultiplier = 1;
      this.defenseMultiplier = 1;
      this.speed = DEFAULT_SPEED;
      this.jumpForce = DEFAULT_JUMP_FORCE;
      this.onGround = false;
      this.dead = false;
      this.deathAnimDone = false;
      this.hitstun = 0;
      this.blockTimer = 0;
      this.knockdownTimer = 0;
      this.invincibleTimer = 0;
      this.attackTimer = 0;
      this.attackFrame = 0;
      this.attackActive = false;
      this.isAttacking = false;
      this.hasHitThisSwing = false;
      this.damage = 0;
      this.knockback = 0;
      this.attackKind = 'light';
      this.hitFrame = 0;
      this.hitWindow = 0;
      this.effectColor = this.color;
      this.pendingProjectile = false;
      this.currentMove = null;
      this.currentAnim = 'idle';
      this.commandBuffer = [];
      this.lastDir = '';
      this._previousButtons = copyInputState();
      this.input = copyInputState();
    };

    window.Fighter.prototype.setStats = function (stats, multiplierBonus) {
      this.attackMultiplier = 0.7 + stats.atk * 0.06;
      this.defenseMultiplier = 1 - stats.def * 0.04;
      this.speed = 3.5 + stats.spd * 0.35;
      if (multiplierBonus) this.attackMultiplier *= multiplierBonus;
    };

    window.Fighter.prototype.setInput = function (state) {
      this.input = deepClone(state);
    };

    window.Fighter.prototype.bufferDirection = function () {
      var dir = getRelativeDirection(this, this.input);
      if (dir && dir !== this.lastDir) {
        this.commandBuffer.push({ dir: dir, ttl: 20 });
        if (this.commandBuffer.length > 10) this.commandBuffer.shift();
      }
      this.lastDir = dir;
      for (var i = this.commandBuffer.length - 1; i >= 0; i--) {
        this.commandBuffer[i].ttl -= 1;
        if (this.commandBuffer[i].ttl <= 0) this.commandBuffer.splice(i, 1);
      }
    };

    window.Fighter.prototype.matchCommand = function (command) {
      if (!command || !command.length) return false;
      var dirs = this.commandBuffer.map(function (entry) { return entry.dir; });
      if (dirs.length < command.length) return false;
      for (var start = dirs.length - command.length; start >= 0; start--) {
        var ok = true;
        for (var i = 0; i < command.length; i++) if (dirs[start + i] !== command[i]) ok = false;
        if (ok) return true;
      }
      return false;
    };

    window.Fighter.prototype.clearCommandBuffer = function () { this.commandBuffer = []; this.lastDir = ''; };

    window.Fighter.prototype.tryStartMove = function (move, isUltimate) {
      if (!move) return false;
      if (this.energy < move.energyCost || this.isAttacking || this.hitstun > 0 || this.knockdownTimer > 0) return false;
      this.isAttacking = true;
      this.attackActive = true;
      this.attackTimer = isUltimate ? 44 : 28;
      this.attackFrame = 0;
      this.hitFrame = isUltimate ? 12 : 8;
      this.hitWindow = isUltimate ? 10 : 7;
      this.hasHitThisSwing = false;
      this.currentMove = move;
      this.attackKind = isUltimate ? 'ultimate' : 'special';
      var hits = move.hits || 1;
      this.damage = Math.max(1, Math.round((move.damage / hits) * this.attackMultiplier));
      this.knockback = isUltimate ? 14 : 8;
      this.effectColor = move.color || this.color;
      this.pendingProjectile = move.type === MOVE_TYPE.PROJECTILE;
      this.energy = clamp(this.energy - move.energyCost, 0, this.maxEnergy);
      this.clearCommandBuffer();
      return true;
    };

    window.Fighter.prototype.handlePressedButtons = function (pressed) {
      if (this.dead || this.hitstun > 0 || this.knockdownTimer > 0) return;
      if (pressed.ultimate && this.charData && this.charData.ultimate) this.tryStartMove(this.charData.ultimate, true);
      if (!this.isAttacking && pressed.special && this.charData && this.charData.moves && this.charData.moves.length) {
        var specials = this.charData.moves.filter(function (move) { return this.energy >= move.energyCost; }.bind(this));
        if (specials.length) this.tryStartMove(specials[0], false);
      }
      if (!this.isAttacking && this.charData && this.charData.moves && this.charData.moves.length && (pressed.attack || pressed.heavy)) {
        for (var i = this.charData.moves.length - 1; i >= 0; i--) {
          var move = this.charData.moves[i];
          if (this.energy >= move.energyCost && this.matchCommand(move.command)) {
            this.tryStartMove(move, false);
            break;
          }
        }
      }
      if (this.isAttacking) return;
      if (pressed.attack) {
        this.isAttacking = true; this.attackActive = true; this.attackTimer = 14; this.attackFrame = 0; this.hitFrame = 6; this.hitWindow = 4; this.hasHitThisSwing = false; this.attackKind = 'light'; this.damage = Math.max(1, Math.round(LIGHT_ATTACK_DAMAGE * this.attackMultiplier)); this.knockback = LIGHT_ATTACK_KNOCKBACK; this.effectColor = '#ffffff';
      } else if (pressed.heavy) {
        this.isAttacking = true; this.attackActive = true; this.attackTimer = 20; this.attackFrame = 0; this.hitFrame = 10; this.hitWindow = 4; this.hasHitThisSwing = false; this.attackKind = 'heavy'; this.damage = Math.max(1, Math.round(HEAVY_ATTACK_DAMAGE * this.attackMultiplier)); this.knockback = HEAVY_ATTACK_KNOCKBACK; this.effectColor = '#ffcc66';
      }
    };

    window.Fighter.prototype.takeHit = function (damage, knockback, kind) {
      if (this.dead || this.invincibleTimer > 0) return;
      if (this.isBlocking()) {
        damage = Math.max(1, Math.round(damage * (1 - BLOCK_DAMAGE_REDUCTION)));
        knockback *= BLOCK_KNOCKBACK_REDUCTION;
        this.blockTimer = 10;
      }
      this.health = Math.max(0, this.health - Math.max(1, Math.round(damage * this.defenseMultiplier)));
      this.energy = clamp(this.energy + ENERGY_GAIN_HURT, 0, this.maxEnergy);
      var barGain = kind === 'heavy' ? 45 : kind === 'special' || kind === 'ultimate' ? 60 : 20;
      this.knockdownBar = clamp(this.knockdownBar + barGain, 0, this.knockdownBarMax);
      this.velocity.x = knockback;
      this.hitstun = kind === 'heavy' ? HITSTUN_HEAVY : HITSTUN_LIGHT;
      if (this.knockdownBar >= this.knockdownBarMax) {
        this.knockdownTimer = 50;
        this.knockdownBar = 0;
        this.velocity.y = -8;
      }
      if (this.health <= 0) {
        this.dead = true;
        this.attackActive = false;
        this.isAttacking = false;
      }
    };

    window.Fighter.prototype.isBlocking = function () {
      var back = this.facingRight ? this.input.left : this.input.right;
      return !this.isAttacking && this.input.down && back;
    };

    window.Fighter.prototype.update = function (opponent, pressed) {
      if (this.dead) {
        this.height = Math.max(30, this.height - 2);
        if (this.height <= 30) this.deathAnimDone = true;
        return;
      }
      if (opponent) this.facingRight = this.position.x < opponent.position.x;
      this.bufferDirection();
      this.handlePressedButtons(pressed || copyInputState());
      if (this.knockdownBar > 0 && this.hitstun <= 0 && this.knockdownTimer <= 0) this.knockdownBar = Math.max(0, this.knockdownBar - 0.35);
      if (this.blockTimer > 0) this.blockTimer -= 1;
      if (this.hitstun > 0) this.hitstun -= 1;
      if (this.invincibleTimer > 0) this.invincibleTimer -= 1;
      if (this.knockdownTimer > 0) this.knockdownTimer -= 1;
      if (this.knockdownTimer === 1) this.invincibleTimer = 30;

      if (this.input.down && !this.isBlocking() && this.energy < this.maxEnergy && !this.isAttacking && Math.abs(this.velocity.x) < 0.1 && this.onGround) {
        this.energy = clamp(this.energy + ENERGY_GAIN_CHARGE, 0, this.maxEnergy);
      }
      if (this.attackTimer > 0) {
        this.attackTimer -= 1;
        this.attackFrame += 1;
        if (this.attackTimer <= 0) {
          this.isAttacking = false;
          this.attackActive = false;
          this.currentMove = null;
          this.pendingProjectile = false;
        }
      }
      if (this.hitstun <= 0 && this.knockdownTimer <= 0 && !this.isAttacking) {
        this.velocity.x = 0;
        if (this.input.left) this.velocity.x -= this.speed;
        if (this.input.right) this.velocity.x += this.speed;
        if (this.input.up && this.onGround) { this.velocity.y = this.jumpForce; this.onGround = false; }
      } else {
        this.velocity.x *= 0.9;
      }
      this.velocity.y += GRAVITY;
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;
      if (this.position.y + this.height >= GROUND_Y) { this.position.y = GROUND_Y - this.height; this.velocity.y = 0; this.onGround = true; } else this.onGround = false;
      this.position.x = clamp(this.position.x, 0, CANVAS_W - this.width);
      var rangeBoost = this.currentMove && (this.currentMove.type === MOVE_TYPE.AREA ? 1.8 : this.currentMove.type === MOVE_TYPE.SPIN ? 1.5 : this.currentMove.type === MOVE_TYPE.RUSH ? 1.4 : 1);
      rangeBoost = rangeBoost || 1;
      this.attackBox.width = ((this.currentMove && this.currentMove.type === MOVE_TYPE.PROJECTILE) ? 0 : ((this.soldierType && this.soldierType.attackRange) || 84)) * rangeBoost;
      this.attackBox.height = 42;
      this.attackBox.position.x = this.facingRight ? this.position.x + this.width - 4 : this.position.x - this.attackBox.width + 4;
      this.attackBox.position.y = this.position.y + 24;
    };

    window.Fighter.prototype.draw = function (ctx) {
      ctx.save();
      if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 3) % 2 === 0) ctx.globalAlpha = 0.45;
      var body = this.charData ? this.charData.color : this.color;
      ctx.fillStyle = body;
      ctx.fillRect(this.position.x + 10, this.position.y + 34, this.width - 20, this.height - 34);
      ctx.fillStyle = '#d4a574';
      ctx.beginPath();
      ctx.arc(this.position.x + this.width / 2, this.position.y + 18, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.position.x + (this.facingRight ? this.width / 2 + 2 : this.width / 2 - 8), this.position.y + 14, 6, 3);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(this.position.x + this.width / 2, this.position.y + 36);
      ctx.lineTo(this.position.x + (this.facingRight ? this.width + 12 : -12), this.position.y + 54);
      if (this.isAttacking) ctx.stroke();
      if (this.knockdownTimer > 0) {
        ctx.strokeStyle = 'rgba(255,200,0,0.5)';
        ctx.strokeRect(this.position.x - 4, this.position.y - 4, this.width + 8, this.height + 8);
      }
      ctx.restore();
    };
  }

  function InputManager() {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    this.states = [copyInputState(), copyInputState()];
    this.pressed = [copyInputState(), copyInputState()];
    this.mobileControls = $('mobile-controls');
    this.joystick = { active: false, startX: 0, startY: 0, x: 0, y: 0 };
  }

  InputManager.prototype.init = function () {
    var self = this;
    window.addEventListener('keydown', function (event) { self.handleKey(event, true); });
    window.addEventListener('keyup', function (event) { self.handleKey(event, false); });
    this.createMobileControls();
  };

  InputManager.prototype.handleKey = function (event, down) {
    var key = event.code;
    var handled = true;
    if (key === 'KeyA') this.setButton(0, 'left', down);
    else if (key === 'KeyD') this.setButton(0, 'right', down);
    else if (key === 'KeyW') this.setButton(0, 'up', down);
    else if (key === 'KeyS') this.setButton(0, 'down', down);
    else if (key === 'KeyJ') this.setButton(0, 'attack', down);
    else if (key === 'KeyK') this.setButton(0, 'heavy', down);
    else if (key === 'KeyL') this.setButton(0, 'special', down);
    else if (key === 'KeyU') this.setButton(0, 'ultimate', down);
    else if (key === 'ArrowLeft') this.setButton(1, 'left', down);
    else if (key === 'ArrowRight') this.setButton(1, 'right', down);
    else if (key === 'ArrowUp') this.setButton(1, 'up', down);
    else if (key === 'ArrowDown') this.setButton(1, 'down', down);
    else if (key === 'Numpad1') this.setButton(1, 'attack', down);
    else if (key === 'Numpad2') this.setButton(1, 'heavy', down);
    else if (key === 'Numpad3') this.setButton(1, 'special', down);
    else if (key === 'Numpad0') this.setButton(1, 'ultimate', down);
    else handled = false;
    if (handled) event.preventDefault();
  };

  InputManager.prototype.setButton = function (playerIndex, name, down) {
    if (down && !this.states[playerIndex][name]) this.pressed[playerIndex][name] = true;
    this.states[playerIndex][name] = down;
  };

  InputManager.prototype.getState = function (playerIndex) { return deepClone(this.states[playerIndex]); };
  InputManager.prototype.consumePressed = function (playerIndex) {
    var copy = deepClone(this.pressed[playerIndex]);
    this.pressed[playerIndex] = copyInputState();
    return copy;
  };

  InputManager.prototype.resetStates = function () {
    this.states = [copyInputState(), copyInputState()];
    this.pressed = [copyInputState(), copyInputState()];
  };

  InputManager.prototype.createMobileControls = function () {
    if (!this.mobileControls) return;
    this.mobileControls.innerHTML = '';
    this.mobileControls.className = 'mobile-controls hidden';
    var joystickArea = document.createElement('div');
    joystickArea.className = 'joystick-area';
    var base = document.createElement('div');
    base.className = 'joystick-base';
    var thumb = document.createElement('div');
    thumb.className = 'joystick-thumb';
    base.appendChild(thumb);
    joystickArea.appendChild(base);

    var leftButtons = document.createElement('div');
    leftButtons.className = 'mobile-buttons-left';
    var rightButtons = document.createElement('div');
    rightButtons.className = 'mobile-buttons-right';
    var buttons = [
      { parent: leftButtons, label: '防', action: 'down', className: 'mobile-btn mobile-btn-block' },
      { parent: rightButtons, label: 'J', action: 'attack', className: 'mobile-btn mobile-btn-light' },
      { parent: rightButtons, label: 'K', action: 'heavy', className: 'mobile-btn mobile-btn-heavy' },
      { parent: rightButtons, label: 'L', action: 'special', className: 'mobile-btn mobile-btn-jump' },
      { parent: rightButtons, label: 'U', action: 'ultimate', className: 'mobile-btn mobile-btn-charge' }
    ];
    buttons.forEach(function (cfg) {
      var btn = document.createElement('button');
      btn.className = cfg.className;
      btn.textContent = cfg.label;
      cfg.parent.appendChild(btn);
      ['touchstart', 'mousedown'].forEach(function (type) {
        btn.addEventListener(type, function (event) {
          event.preventDefault();
          this.setButton(0, cfg.action, true);
        }.bind(this), { passive: false });
      }.bind(this));
      ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach(function (type) {
        btn.addEventListener(type, function (event) {
          event.preventDefault();
          this.setButton(0, cfg.action, false);
        }.bind(this), { passive: false });
      }.bind(this));
    }.bind(this));

    var self = this;
    function moveStick(clientX, clientY) {
      var rect = base.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = clamp(clientX - cx, -JOYSTICK_MAX_DIST, JOYSTICK_MAX_DIST);
      var dy = clamp(clientY - cy, -JOYSTICK_MAX_DIST, JOYSTICK_MAX_DIST);
      thumb.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      self.states[0].left = dx < -JOYSTICK_DEAD_ZONE * JOYSTICK_MAX_DIST;
      self.states[0].right = dx > JOYSTICK_DEAD_ZONE * JOYSTICK_MAX_DIST;
      self.states[0].up = dy < -JOYSTICK_DEAD_ZONE * JOYSTICK_MAX_DIST;
    }
    function releaseStick() {
      thumb.style.transform = 'translate(0px,0px)';
      self.states[0].left = false; self.states[0].right = false; self.states[0].up = false;
    }
    joystickArea.addEventListener('touchstart', function (event) { event.preventDefault(); var t = event.changedTouches[0]; moveStick(t.clientX, t.clientY); }, { passive: false });
    joystickArea.addEventListener('touchmove', function (event) { event.preventDefault(); var t = event.changedTouches[0]; moveStick(t.clientX, t.clientY); }, { passive: false });
    joystickArea.addEventListener('touchend', function (event) { event.preventDefault(); releaseStick(); }, { passive: false });
    joystickArea.addEventListener('mousedown', function (event) {
      event.preventDefault(); moveStick(event.clientX, event.clientY);
      function onMove(e) { moveStick(e.clientX, e.clientY); }
      function onUp() { releaseStick(); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); }
      window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
    });

    this.mobileControls.appendChild(joystickArea);
    this.mobileControls.appendChild(leftButtons);
    this.mobileControls.appendChild(rightButtons);
  };

  InputManager.prototype.showMobileControls = function () { if (this.isMobile && this.mobileControls) show(this.mobileControls); };
  InputManager.prototype.hideMobileControls = function () { if (this.mobileControls) hide(this.mobileControls); };

  function GameEngine() {
    this.canvas = $('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.state = 'TITLE';
    this.gameMode = 'pvcpu';
    this.input = new InputManager();
    this.bg = new BackgroundRenderer();
    this.effects = new EffectsRenderer();
    this.ai = new AIController('easy');
    this.battleUI = new BattleUI();
    this.characterSelect = new CharacterSelect($('character-select'), this.onCharacterSelected.bind(this), 'pvcpu');
    this.storyMode = new StoryMode($('story-mode'), this.onStoryBattleRequested.bind(this), this.onStoryComplete.bind(this));
    this.storyMode.setCampaignSelectedCallback(this.onStoryCampaignSelected.bind(this));
    this.moveListOverlay = new MoveListOverlay($('move-list-overlay'));
    this.player1 = null;
    this.player2 = null;
    this.p1Char = null;
    this.p2Char = null;
    this.storySelection = null;
    this.stageIndex = 0;
    this.roundWins = { p1: 0, p2: 0 };
    this.roundNumber = 1;
    this.totalRounds = 3;
    this.timer = DEFAULT_ROUND_TIME;
    this.lastTime = 0;
    this.timerAccumulator = 0;
    this.paused = false;
    this.awaitingContinue = false;
    this.resultSummary = '';
    this.countdownFrames = 90;
    this.currentStoryBattle = null;
    this.stageCards = [];
  }

  GameEngine.prototype.init = function () {
    this.input.init();
    this.bg.initParticles();
    this.bindUI();
    this.showTitle();
    requestAnimationFrame(this.loop.bind(this));
  };

  GameEngine.prototype.bindUI = function () {
    var self = this;
    $('btn-vs-mode').addEventListener('click', function () { self.startVsCharacterSelect(); });
    $('btn-story-mode').addEventListener('click', function () { self.startStorySelect(); });
    $('btn-title-move-list').addEventListener('click', function () { self.moveListOverlay.show('moveList'); });
    $('btn-title-stage-list').addEventListener('click', function () { self.moveListOverlay.show('stageList'); });
    window.addEventListener('keydown', function (event) {
      if (event.key === 'm' || event.key === 'M') {
        if (self.state === 'FIGHTING') self.battleUI.toggleMiniMoveList();
      }
      if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') {
        if (self.state === 'FIGHTING' || self.paused) self.togglePause();
      }
      if (self.awaitingContinue && (event.key === 'Enter' || event.key === ' ' || event.code === 'KeyJ' || event.code === 'Numpad1')) self.advanceResultState();
    });
    this.canvas.addEventListener('click', function () { if (self.awaitingContinue) self.advanceResultState(); });
    document.querySelectorAll('.diff-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.diff-btn').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');
      });
    });
  };

  GameEngine.prototype.getDifficulty = function () {
    var selected = document.querySelector('.diff-btn.selected');
    return selected ? selected.getAttribute('data-diff') : 'easy';
  };

  GameEngine.prototype.showTitle = function () {
    this.state = 'TITLE';
    this.paused = false;
    this.awaitingContinue = false;
    show($('title-screen')); hide($('character-select')); hide($('stage-select')); hide($('story-mode')); hide($('dialog-box')); hide($('pause-menu')); hide($('loading-screen')); this.input.hideMobileControls();
    this.moveListOverlay.hide();
    this.roundWins = { p1: 0, p2: 0 };
    this.roundNumber = 1;
    this.ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  };

  GameEngine.prototype.startVsCharacterSelect = function () {
    this.gameMode = this.input.isMobile ? 'pvcpu' : 'pvp';
    this.state = 'CHARACTER_SELECT';
    hide($('title-screen')); hide($('story-mode')); hide($('stage-select'));
    this.characterSelect.show({ mode: this.gameMode, onSelect: this.onCharacterSelected.bind(this) });
  };

  GameEngine.prototype.startStorySelect = function () {
    this.state = 'STORY_SELECT';
    hide($('title-screen')); hide($('character-select')); hide($('stage-select'));
    this.storyMode.show();
  };

  GameEngine.prototype.onStoryCampaignSelected = function (factionKey, campaign) {
    this.storySelection = { factionKey: factionKey, campaign: campaign };
    this.storyMode.hide();
    this.state = 'CHARACTER_SELECT';
    this.characterSelect.show({ mode: 'story', availableHeroes: campaign.availableHeroes, onSelect: this.onStoryHeroSelected.bind(this) });
  };

  GameEngine.prototype.onStoryHeroSelected = function (selection) {
    this.p1Char = selection.p1Char;
    this.storyMode.setHero(selection.p1Char);
    this.state = 'STORY_MAP';
    show($('story-mode'));
    this.storyMode.showChapterMap();
  };

  GameEngine.prototype.onCharacterSelected = function (selection) {
    this.p1Char = selection.p1Char;
    this.p2Char = selection.p2Char;
    this.state = 'STAGE_SELECT';
    this.renderStageSelect();
  };

  GameEngine.prototype.renderStagePreview = function (canvas, stageIndex) {
    var ctx = canvas.getContext('2d');
    var oldW = CANVAS_W, oldH = CANVAS_H;
    ctx.save();
    ctx.scale(canvas.width / oldW, canvas.height / oldH);
    this.bg.drawBackground(ctx, stageIndex);
    ctx.restore();
  };

  GameEngine.prototype.renderStageSelect = function () {
    var container = $('stage-select');
    container.innerHTML = '';
    var overlay = document.createElement('div');
    overlay.className = 'movelist-overlay';
    var header = document.createElement('div');
    header.className = 'movelist-header';
    header.appendChild(Object.assign(document.createElement('h2'), { textContent: '選擇關卡 — Stage Select' }));
    var back = document.createElement('button');
    back.className = 'mode-btn';
    back.textContent = '返回';
    back.addEventListener('click', this.showTitle.bind(this));
    header.appendChild(back);
    overlay.appendChild(header);
    var content = document.createElement('div');
    content.className = 'stagelist-content';
    overlay.appendChild(content);
    this.stageCards = [];
    for (var i = 0; i < STAGE_NAMES.length; i++) {
      var stage = STAGE_NAMES[i];
      var card = document.createElement('div');
      card.className = 'stage-card' + (i === this.stageIndex ? ' selected-stage' : '');
      var preview = document.createElement('canvas');
      preview.className = 'stage-preview';
      preview.width = 256; preview.height = 144;
      this.renderStagePreview(preview, i);
      card.appendChild(preview);
      card.appendChild(Object.assign(document.createElement('div'), { className: 'stage-name', textContent: stage.name }));
      card.appendChild(Object.assign(document.createElement('div'), { className: 'stage-name-en', textContent: stage.nameEn }));
      card.appendChild(Object.assign(document.createElement('div'), { className: 'stage-desc', textContent: stage.desc || '' }));
      card.addEventListener('click', function (index) { return function () { this.stageIndex = index; this.renderStageSelect(); }; }.call(this, i));
      content.appendChild(card);
      this.stageCards.push(card);
    }
    var controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.justifyContent = 'center';
    controls.style.gap = '12px';
    controls.style.marginTop = '16px';
    var randomBtn = document.createElement('button');
    randomBtn.className = 'mode-btn';
    randomBtn.textContent = '隨機關卡';
    randomBtn.addEventListener('click', function () { this.stageIndex = Math.floor(Math.random() * STAGE_NAMES.length); this.startMatch(); }.bind(this));
    var confirmBtn = document.createElement('button');
    confirmBtn.className = 'fight-btn';
    confirmBtn.style.animation = 'none';
    confirmBtn.textContent = '開始對戰';
    confirmBtn.addEventListener('click', this.startMatch.bind(this));
    controls.appendChild(randomBtn); controls.appendChild(confirmBtn); content.appendChild(controls);
    container.appendChild(overlay);
    show(container);
    hide($('title-screen')); hide($('character-select')); hide($('story-mode'));
  };

  GameEngine.prototype.onStoryBattleRequested = function (payload) {
    this.gameMode = 'story';
    this.p1Char = payload.p1Char;
    this.p2Char = payload.p2Char;
    this.currentStoryBattle = payload;
    this.roundWins = { p1: 0, p2: 0 };
    this.roundNumber = 1;
    this.stageIndex = payload.chapterIndex % STAGE_NAMES.length;
    this.startMatch();
  };

  GameEngine.prototype.applyStats = function (fighter, stats, cpuBoost) {
    var applied = { atk: stats.atk, def: stats.def, spd: stats.spd };
    if (cpuBoost && cpuBoost.statBonus) {
      applied = {
        atk: Math.min(10, stats.atk + cpuBoost.statBonus),
        def: Math.min(10, stats.def + cpuBoost.statBonus),
        spd: Math.min(10, stats.spd + cpuBoost.statBonus)
      };
    }
    fighter._atkMultiplier = 0.7 + applied.atk * 0.06;
    fighter._defMultiplier = 1 - applied.def * 0.04;
    fighter.speed = 3.5 + applied.spd * 0.35;
    if (cpuBoost && cpuBoost.dmgMultiplier) fighter._atkMultiplier *= cpuBoost.dmgMultiplier;
  };

  GameEngine.prototype.applyInputToFighter = function (fighter, state, pressed) {
    fighter.keys.left = !!state.left;
    fighter.keys.right = !!state.right;
    fighter.keys.jump = !!state.up;
    fighter.keys.block = !!state.down;
    fighter.keys.charge = false;
    fighter.keys.attack1 = !!pressed.attack;
    fighter.keys.attack2 = !!pressed.heavy;

    if (pressed.special && fighter.charData && fighter.charData.moves && fighter.charData.moves.length) {
      var move = fighter.charData.moves.find(function (entry) { return fighter.energy >= entry.energyCost; }) || null;
      if (move) {
        fighter.inputBuffer = move.command.slice();
        fighter.inputBufferTimer = 10;
        fighter.keys.attack1 = true;
      }
    }

    if (pressed.ultimate && fighter.charData && fighter.charData.ultimate && fighter.energy >= MAX_ENERGY) {
      fighter.inputBuffer = ['D', 'DF', 'F', 'D', 'DF', 'F'];
      fighter.inputBufferTimer = 10;
      fighter.keys.attack1 = true;
      fighter.keys.attack2 = true;
    }
  };

  GameEngine.prototype.createFighters = function () {
    var p1Height = 140;
    var p2Height = this.p2Char && this.p2Char.isSoldier ? 110 : 140;
    this.player1 = new Fighter({ position: { x: 180, y: GROUND_Y - p1Height }, color: this.p1Char.color, width: 58, height: p1Height, facingRight: true, charData: this.p1Char, attackBox: { offset: { x: 8, y: 20 }, width: 88, height: 42 } });
    this.player2 = new Fighter({ position: { x: 780, y: GROUND_Y - p2Height }, color: this.p2Char.color, width: this.p2Char && this.p2Char.isSoldier ? 48 : 58, height: p2Height, facingRight: false, charData: this.p2Char, isSoldier: !!(this.p2Char && this.p2Char.isSoldier), soldierType: this.p2Char && this.p2Char.soldierType, attackBox: { offset: { x: 8, y: 20 }, width: this.p2Char && this.p2Char.soldierType ? this.p2Char.soldierType.attackRange || 70 : 88, height: 42 } });
    this.applyStats(this.player1, this.p1Char.stats);
    if (this.gameMode === 'pvp') this.applyStats(this.player2, this.p2Char.stats);
    else {
      var diff = DIFFICULTY_SETTINGS[this.getDifficulty()] || DIFFICULTY_SETTINGS.easy;
      this.applyStats(this.player2, this.p2Char.stats, diff);
      this.ai.setDifficulty(this.getDifficulty());
    }
  };

  GameEngine.prototype.startMatch = function () {
    hide($('stage-select')); hide($('character-select')); hide($('story-mode')); hide($('dialog-box')); hide($('pause-menu')); hide($('title-screen'));
    this.effects.reset();
    this.bg.initParticles();
    this.createFighters();
    this.timer = DEFAULT_ROUND_TIME;
    this.timerAccumulator = 0;
    this.countdownFrames = 90;
    this.awaitingContinue = false;
    this.resultSummary = '';
    this.state = 'FIGHTING';
    this.battleUI.showRoundResult('ROUND ' + this.roundNumber);
    if (this.input.isMobile) this.input.showMobileControls(); else this.input.hideMobileControls();
  };

  GameEngine.prototype.togglePause = function () {
    if (this.state !== 'FIGHTING' && !this.paused) return;
    this.paused = !this.paused;
    var menu = $('pause-menu');
    menu.innerHTML = '';
    if (!this.paused) { hide(menu); return; }
    var overlay = document.createElement('div');
    overlay.className = 'movelist-overlay';
    overlay.style.justifyContent = 'center';
    var box = document.createElement('div');
    box.className = 'story-card';
    box.style.width = '320px';
    box.appendChild(Object.assign(document.createElement('h3'), { textContent: '暫停 Pause' }));
    var resume = document.createElement('button'); resume.className = 'mode-btn'; resume.textContent = '繼續'; resume.addEventListener('click', this.togglePause.bind(this));
    var title = document.createElement('button'); title.className = 'mode-btn'; title.textContent = '回主選單'; title.addEventListener('click', this.showTitle.bind(this));
    var moves = document.createElement('button'); moves.className = 'mode-btn movelist-btn'; moves.textContent = '招式表'; moves.addEventListener('click', function () { this.moveListOverlay.show('moveList'); }.bind(this));
    box.appendChild(resume); box.appendChild(moves); box.appendChild(title); overlay.appendChild(box); menu.appendChild(overlay); show(menu);
  };

  GameEngine.prototype.updateFight = function (delta) {
    if (this.paused) return;
    if (this.countdownFrames > 0) { this.countdownFrames -= 1; return; }
    this.timerAccumulator += delta;
    if (this.timerAccumulator >= 1000) {
      this.timerAccumulator -= 1000;
      this.timer = Math.max(0, this.timer - 1);
      if (this.timer <= 0) { this.finishRound('TIME UP'); return; }
    }

    var p1State = this.input.getState(0);
    var p1Pressed = this.input.consumePressed(0);
    this.applyInputToFighter(this.player1, p1State, p1Pressed);

    if (this.gameMode === 'pvp') {
      var p2State = this.input.getState(1);
      var p2Pressed = this.input.consumePressed(1);
      this.applyInputToFighter(this.player2, p2State, p2Pressed);
    } else {
      this.ai.update(this.player2, this.player1);
    }
  };

  GameEngine.prototype.finishRound = function (resultType) {
    if (this.state !== 'FIGHTING') return;
    var p1Won = false;
    if (this.player1.health === this.player2.health) p1Won = false;
    else p1Won = this.player1.health > this.player2.health;
    if (this.player2.health <= 0 && this.player1.health > 0) p1Won = true;
    if (this.player1.health <= 0 && this.player2.health > 0) p1Won = false;
    if (p1Won) this.roundWins.p1 += 1; else this.roundWins.p2 += 1;
    var perfect = p1Won ? this.player1.health === this.player1.maxHealth : this.player2.health === this.player2.maxHealth;
    var message = resultType;
    if (perfect && resultType === 'K.O.') message += ' • PERFECT';
    this.battleUI.showRoundResult(message);
    this.awaitingContinue = true;
    this.state = (this.roundWins.p1 >= 2 || this.roundWins.p2 >= 2 || this.roundNumber >= this.totalRounds) ? 'MATCH_RESULT' : 'ROUND_RESULT';
    if (this.state === 'MATCH_RESULT') {
      var winner = this.roundWins.p1 > this.roundWins.p2 ? this.p1Char.name + ' WIN' : this.p2Char.name + ' WIN';
      this.resultSummary = winner;
      this.battleUI.showMatchResult(winner + (perfect ? ' • PERFECT' : ''));
    }
  };

  GameEngine.prototype.advanceResultState = function () {
    if (!this.awaitingContinue) return;
    this.awaitingContinue = false;
    if (this.state === 'ROUND_RESULT') {
      this.roundNumber += 1;
      this.startMatch();
      return;
    }
    if (this.state === 'MATCH_RESULT') {
      if (this.gameMode === 'story') {
        if (this.roundWins.p1 > this.roundWins.p2) {
          show($('story-mode'));
          this.storyMode.handleVictory();
        } else {
          var self = this;
          show($('story-mode'));
          this.storyMode.handleDefeat(function () { self.onStoryBattleRequested(self.currentStoryBattle); });
        }
      } else {
        this.showTitle();
      }
    }
  };

  GameEngine.prototype.onStoryComplete = function (campaign) {
    show($('story-mode'));
    this.storyMode.showDialog([{ speaker: '旁白', text: campaign.title + ' 完結！恭喜通關！' }], this.showTitle.bind(this));
  };

  GameEngine.prototype.draw = function () {
    this.ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    if (this.state === 'TITLE') return;
    var shake = this.effects.applyScreenShake(this.ctx);
    this.bg.drawBackground(this.ctx, this.stageIndex);
    if (this.player1 && this.player2) {
      if (this.state === 'FIGHTING' && !this.paused) {
        this.player1.updateFighter(this.ctx, this.player2);
        this.player2.updateFighter(this.ctx, this.player1);
        this.effects.checkAttackCollision(this.player1, this.player2);
        this.effects.checkAttackCollision(this.player2, this.player1);
        if ((this.player1.dead || this.player2.dead) && (!this.player1.dead || this.player1.deathAnimDone) && (!this.player2.dead || this.player2.deathAnimDone)) {
          this.finishRound('K.O.');
        }
      } else {
        this.player1._drawPlaceholder(this.ctx);
        this.player2._drawPlaceholder(this.ctx);
      }
      if (typeof this.effects.updateProjectiles === 'function') this.effects.updateProjectiles(this.ctx, this.player1, this.player2);
      if (typeof this.effects.drawHitEffects === 'function') this.effects.drawHitEffects(this.ctx);
      if (typeof this.effects.drawScreenFlash === 'function') this.effects.drawScreenFlash(this.ctx);
    }
    if (shake) this.ctx.restore();
    if (this.player1 && this.player2) this.battleUI.drawHUD(this.ctx, this.player1, this.player2, this.timer, { current: this.roundNumber, total: this.totalRounds });
  };

  GameEngine.prototype.loop = function (timestamp) {
    var delta = this.lastTime ? timestamp - this.lastTime : 16;
    this.lastTime = timestamp;
    if (this.state === 'FIGHTING') this.updateFight(delta);
    this.draw();
    requestAnimationFrame(this.loop.bind(this));
  };

  window.InputManager = InputManager;
  window.GameEngine = GameEngine;
  window.addEventListener('DOMContentLoaded', function () {
    var engine = new GameEngine();
    window.__g3Game = engine;
    engine.init();
  });
})();
