// ============================================================
// classes.js — Sprite & Fighter classes for Sango Fighter
// ============================================================

/* ---------- Constants ---------- */
const GRAVITY = 0.7;
const GROUND_Y = 576 - 96; // ground line (floor height 96px from bottom)
const CANVAS_W = 1024;
const CANVAS_H = 576;

/* ==========================
   Sprite (base class)
   ========================== */
class Sprite {
  /**
   * @param {object} opts
   * opts.position  {x, y}
   * opts.imageSrc  string (optional)
   * opts.scale     number (optional, default 1)
   * opts.framesMax number (optional, default 1)
   * opts.offset    {x, y} (optional)
   * opts.color     string (optional, placeholder colour)
   * opts.width     number (optional)
   * opts.height    number (optional)
   */
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
    this.framesHold = 8; // ticks per frame
    this.offset = offset;

    // Image loading (optional)
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
      const fw = this.image.width / this.framesMax;
      const fh = this.image.height;
      ctx.drawImage(
        this.image,
        fw * this.framesCurrent, 0, fw, fh,
        this.position.x - this.offset.x,
        this.position.y - this.offset.y,
        fw * this.scale,
        fh * this.scale
      );
    } else {
      // Placeholder rectangle
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
   Fighter (extends Sprite)
   ========================== */

// Animation state names
const ANIM = {
  IDLE: 'idle',
  RUN: 'run',
  JUMP: 'jump',
  FALL: 'fall',
  ATTACK1: 'attack1',
  ATTACK2: 'attack2',
  TAKE_HIT: 'takeHit',
  DEATH: 'death'
};

class Fighter extends Sprite {
  /**
   * @param {object} opts  (all Sprite opts plus fighter-specific ones)
   * opts.velocity   {x, y}
   * opts.attackBox  {offset: {x, y}, width, height}
   * opts.facingRight boolean
   * opts.charData   { id, name, faction, color, stats }
   * opts.sprites    object mapping ANIM keys → { imageSrc, framesMax }  (optional)
   */
  constructor({
    position,
    velocity = { x: 0, y: 0 },
    color = 'red',
    width = 50,
    height = 150,
    attackBox = { offset: { x: 0, y: 0 }, width: 100, height: 50 },
    facingRight = true,
    charData = null,
    sprites = {},
    imageSrc,
    scale,
    framesMax,
    offset
  }) {
    super({ position, imageSrc, scale, framesMax, offset, color, width, height });

    this.velocity = velocity;
    this.health = 100;
    this.maxHealth = 100;

    // Attack
    this.attackBox = {
      position: { x: this.position.x, y: this.position.y },
      offset: attackBox.offset,
      width: attackBox.width,
      height: attackBox.height
    };
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.attackDuration = 0;   // frames the hitbox is active
    this.attackFrame = 0;
    this.attackType = 1;       // 1 = light, 2 = heavy
    this.hasHitThisSwing = false;

    // Movement
    this.facingRight = facingRight;
    this.speed = 5;
    this.jumpForce = -15;
    this.onGround = false;

    // State
    this.currentAnim = ANIM.IDLE;
    this.hitstun = 0;          // remaining hitstun frames
    this.knockbackVel = 0;
    this.dead = false;
    this.deathAnimDone = false;

    // Character data
    this.charData = charData;

    // Loaded sprite sheets per animation (placeholder: unused until real images)
    this.spriteSheets = {};
    for (const [key, value] of Object.entries(sprites)) {
      this.spriteSheets[key] = {
        image: null,
        loaded: false,
        framesMax: value.framesMax || 1
      };
      if (value.imageSrc) {
        const img = new Image();
        const entry = this.spriteSheets[key];
        img.onload = () => { entry.loaded = true; };
        img.src = value.imageSrc;
        entry.image = img;
      }
    }

    // Input state (set externally)
    this.keys = { left: false, right: false, jump: false, attack1: false, attack2: false };

    // Block
    this.isBlocking = false;
    this.blockStun = 0;

    // Combo / special
    this.comboCount = 0;
    this.lastAttackTime = 0;
  }

  /* ---- attack ---- */
  startAttack(type) {
    if (this.isAttacking || this.dead || this.hitstun > 0 || this.attackCooldown > 0) return;
    this.isAttacking = true;
    this.attackType = type;
    this.attackDuration = type === 1 ? 8 : 14;
    this.attackFrame = 0;
    this.hasHitThisSwing = false;
    this.attackCooldown = type === 1 ? 18 : 30;
    this.currentAnim = type === 1 ? ANIM.ATTACK1 : ANIM.ATTACK2;
  }

  /* ---- take damage ---- */
  takeHit(damage, knockback) {
    if (this.dead) return;
    this.health -= damage;
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
      this.currentAnim = ANIM.DEATH;
      this.framesCurrent = 0;
      this.framesElapsed = 0;
      return;
    }
    this.hitstun = 12;
    this.knockbackVel = knockback;
    this.currentAnim = ANIM.TAKE_HIT;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
    // Cancel any ongoing attack
    this.isAttacking = false;
    this.attackDuration = 0;
  }

  /* ---- physics & state update ---- */
  updateFighter(ctx, opponent) {
    if (this.dead) {
      this._drawPlaceholder(ctx);
      // simple death fall
      if (!this.deathAnimDone) {
        this.height = Math.max(30, this.height - 3);
        if (this.height <= 30) this.deathAnimDone = true;
      }
      return;
    }

    // --- Hitstun ---
    if (this.hitstun > 0) {
      this.hitstun--;
      this.position.x += this.knockbackVel;
      this.knockbackVel *= 0.85;
      if (this.hitstun === 0) {
        this.currentAnim = ANIM.IDLE;
      }
    } else {
      // --- Horizontal movement ---
      let moveX = 0;
      if (this.keys.left) moveX -= this.speed;
      if (this.keys.right) moveX += this.speed;
      this.position.x += moveX;

      // Face opponent
      if (opponent && !this.isAttacking) {
        this.facingRight = this.position.x < opponent.position.x;
      }

      // --- Jump ---
      if (this.keys.jump && this.onGround) {
        this.velocity.y = this.jumpForce;
        this.onGround = false;
      }

      // --- Attack input ---
      if (this.keys.attack1) {
        this.startAttack(1);
        this.keys.attack1 = false; // consume
      }
      if (this.keys.attack2) {
        this.startAttack(2);
        this.keys.attack2 = false;
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
    const atkOffX = this.facingRight
      ? this.attackBox.offset.x
      : -(this.attackBox.offset.x + this.attackBox.width);
    this.attackBox.position.x = this.position.x + (this.facingRight ? this.width : 0) + atkOffX;
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y;

    // --- Attack duration ---
    if (this.isAttacking) {
      this.attackFrame++;
      if (this.attackFrame >= this.attackDuration) {
        this.isAttacking = false;
        this.currentAnim = ANIM.IDLE;
      }
    }

    // --- Cooldown ---
    if (this.attackCooldown > 0) this.attackCooldown--;

    // --- Determine animation ---
    if (this.hitstun <= 0 && !this.isAttacking) {
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

  /* ---- placeholder rendering ---- */
  _drawPlaceholder(ctx) {
    ctx.save();

    const bodyColor = this.charData ? this.charData.color : this.color;

    // Body
    ctx.fillStyle = bodyColor;
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);

    // Head (circle)
    const headR = this.width * 0.35;
    const headX = this.position.x + this.width / 2;
    const headY = this.position.y - headR + 4;
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fillStyle = bodyColor;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyes
    const eyeDir = this.facingRight ? 1 : -1;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(headX + eyeDir * 4, headY - 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(headX + eyeDir * 5, headY - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Name label
    if (this.charData) {
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.charData.name, this.position.x + this.width / 2, this.position.y - headR * 2 - 2);
    }

    // Attack effect
    if (this.isAttacking) {
      // Attack box (debug green)
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
      const weaponStartX = this.facingRight
        ? this.position.x + this.width
        : this.position.x;
      const weaponEndX = this.facingRight
        ? this.attackBox.position.x + this.attackBox.width
        : this.attackBox.position.x;
      const weaponY = this.position.y + this.height * 0.3;
      ctx.beginPath();
      ctx.moveTo(weaponStartX, weaponY);
      ctx.lineTo(weaponEndX, weaponY - 10);
      ctx.stroke();
    }

    // Hitstun flash
    if (this.hitstun > 0 && this.hitstun % 4 < 2) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    ctx.restore();
  }
}

/* ==========================
   Character Roster
   ========================== */
const CHARACTER_ROSTER = [
  { id: 'guanyu',    name: '關羽',   nameEn: 'Guan Yu',    faction: '蜀漢', color: '#22aa44', stats: { atk: 8, def: 7, spd: 5 } },
  { id: 'zhangfei',  name: '張飛',   nameEn: 'Zhang Fei',  faction: '蜀漢', color: '#228833', stats: { atk: 9, def: 5, spd: 6 } },
  { id: 'zhaoyun',   name: '趙雲',   nameEn: 'Zhao Yun',   faction: '蜀漢', color: '#3399ee', stats: { atk: 7, def: 6, spd: 9 } },
  { id: 'machao',    name: '馬超',   nameEn: 'Ma Chao',    faction: '蜀漢', color: '#55bb55', stats: { atk: 8, def: 6, spd: 8 } },
  { id: 'huangzhong',name: '黃忠',   nameEn: 'Huang Zhong',faction: '蜀漢', color: '#aa8833', stats: { atk: 9, def: 4, spd: 4 } },
  { id: 'xiahoudun', name: '夏侯惇', nameEn: 'Xiahou Dun', faction: '曹魏', color: '#4444cc', stats: { atk: 7, def: 8, spd: 6 } },
  { id: 'xiahouyuan',name: '夏侯淵', nameEn: 'Xiahou Yuan',faction: '曹魏', color: '#5555dd', stats: { atk: 7, def: 5, spd: 8 } },
  { id: 'xuhuang',   name: '徐晃',   nameEn: 'Xu Huang',   faction: '曹魏', color: '#6666bb', stats: { atk: 8, def: 7, spd: 5 } },
  { id: 'xuchu',     name: '許褚',   nameEn: 'Xu Chu',     faction: '曹魏', color: '#7777aa', stats: { atk: 9, def: 9, spd: 3 } },
  { id: 'dianwei',   name: '典韋',   nameEn: 'Dian Wei',   faction: '曹魏', color: '#888899', stats: { atk: 10, def: 6, spd: 5 } },
  { id: 'caocao',    name: '曹操',   nameEn: 'Cao Cao',    faction: '曹魏', color: '#9944bb', stats: { atk: 7, def: 7, spd: 7 } },
  { id: 'lvbu',      name: '呂布',   nameEn: 'Lv Bu',      faction: '其他', color: '#cc2222', stats: { atk: 10, def: 8, spd: 7 } }
];
