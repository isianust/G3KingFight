// ============================================================
// Fighter — main combatant class (extends Sprite)
// ============================================================

import {
  GRAVITY,
  GROUND_Y,
  CANVAS_W,
  CANVAS_H,
  MAX_ENERGY,
  ENERGY_GAIN_HURT,
  ENERGY_GAIN_CHARGE,
  KNOCKDOWN_BAR_LIGHT,
  KNOCKDOWN_BAR_HEAVY,
  KNOCKDOWN_BAR_SPECIAL,
  HITSTUN_LIGHT,
  HITSTUN_HEAVY,
  HERO_MAX_HEALTH,
  DEFAULT_SPEED,
  DEFAULT_JUMP_FORCE,
  INPUT_BUFFER_MAX_TIME,
} from '../constants';
import { ANIM, MOVE_TYPE } from '../constants/enums';
import type { AnimState } from '../constants/enums';
import type {
  Vector2D,
  SpriteSheets,
  SpriteSheet,
  CharacterData,
  SoldierType,
  SpecialMove,
  UltimateMove,
  FighterConfig,
  FighterAttackBox,
  MotionTrailEntry,
  FighterKeys,
  LoadedSpriteEntry,
  SpriteInputConfig,
} from '../types';
import { Sprite } from './Sprite';

/* Global function provided by spriteGenerator.js — may not be loaded */
declare global {
  var generateCharacterSprites:
    | ((
        charData: CharacterData | SoldierType | { color: string },
        width: number,
        height: number,
        isSoldier: boolean,
      ) => SpriteSheets)
    | undefined;
}

export class Fighter extends Sprite {
  public velocity: Vector2D;
  public isSoldier: boolean;
  public soldierType: SoldierType | null;

  // Health
  public maxHealth: number;
  public health: number;

  // Knockdown / get-up system (KOF/SF style)
  public isKnockedDown: boolean;
  public knockdownTimer: number;
  public knockdownDuration: number;
  public isGettingUp: boolean;
  public getupTimer: number;
  public getupDuration: number;
  public isInvincible: boolean;
  public invincibleTimer: number;
  public invincibleDuration: number;

  // Knockdown bar (倒地條)
  public knockdownBar: number;
  public knockdownBarMax: number;
  public knockdownBarRecovery: number;

  // Energy / Chi system (氣)
  public energy: number;
  public maxEnergy: number;
  public isCharging: boolean;

  // Attack
  public attackBox: FighterAttackBox;
  public isAttacking: boolean;
  public attackCooldown: number;
  public attackDuration: number;
  public attackFrame: number;
  public attackType: number;
  public hasHitThisSwing: boolean;

  // Special move state
  public isUsingSpecial: boolean;
  public currentSpecialMove: SpecialMove | UltimateMove | null;
  public specialTimer: number;
  public specialPhase: number;
  public specialHitsRemaining: number;
  public isUsingUltimate: boolean;
  public ultimateFlash: number;

  // Motion trail for special moves
  private _motionTrail: MotionTrailEntry[];

  // Buff state
  public buffTimer: number;
  public buffMultiplier: number;

  // Blocking (防禦)
  public isBlocking: boolean;
  public blockStun: number;

  // Movement
  public facingRight: boolean;
  public speed: number;
  public jumpForce: number;
  public onGround: boolean;

  // State
  public currentAnim: AnimState;
  public hitstun: number;
  public knockbackVel: number;
  public dead: boolean;
  public deathAnimDone: boolean;

  // Character data
  public charData: CharacterData | SoldierType | null;

  // Command input buffer
  public inputBuffer: string[];
  public inputBufferTimer: number;

  // Loaded sprite sheets (from external files)
  public spriteSheets: Record<string, LoadedSpriteEntry>;

  // Pre-rendered action sprite sheets (canvas-based)
  public _actionSprites: SpriteSheets | null;
  private _spriteFrameIdx: number;
  private _spriteFrameElapsed: number;
  private _spriteFrameHold: number;
  private _prevAnim: AnimState | null;

  // Input state
  public keys: FighterKeys;

  // Stat multipliers
  public _atkMultiplier: number;
  public _defMultiplier: number;

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
    offset,
  }: FighterConfig) {
    super({ position, imageSrc, scale, framesMax, offset, color, width, height });

    this.velocity = velocity;
    this.isSoldier = isSoldier;
    this.soldierType = soldierType ?? null;

    // Health (heroes=200, soldiers scale via healthMultiplier)
    if (isSoldier && soldierType) {
      this.maxHealth = HERO_MAX_HEALTH * soldierType.healthMultiplier;
      this.health = this.maxHealth;
    } else {
      this.maxHealth = HERO_MAX_HEALTH;
      this.health = HERO_MAX_HEALTH;
    }

    // Knockdown / get-up system
    this.isKnockedDown = false;
    this.knockdownTimer = 0;
    this.knockdownDuration = 60;
    this.isGettingUp = false;
    this.getupTimer = 0;
    this.getupDuration = 30;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.invincibleDuration = 45;

    // Knockdown bar
    this.knockdownBar = 100;
    this.knockdownBarMax = 100;
    this.knockdownBarRecovery = 2;

    // Energy / Chi system
    this.energy = 0;
    this.maxEnergy = MAX_ENERGY;
    this.isCharging = false;

    // Attack
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

    // Special move state
    this.isUsingSpecial = false;
    this.currentSpecialMove = null;
    this.specialTimer = 0;
    this.specialPhase = 0;
    this.specialHitsRemaining = 0;
    this.isUsingUltimate = false;
    this.ultimateFlash = 0;

    // Motion trail
    this._motionTrail = [];

    // Buff state
    this.buffTimer = 0;
    this.buffMultiplier = 1;

    // Blocking
    this.isBlocking = false;
    this.blockStun = 0;

    // Movement
    this.facingRight = facingRight;
    this.speed = DEFAULT_SPEED;
    this.jumpForce = DEFAULT_JUMP_FORCE;
    this.onGround = false;

    // State
    this.currentAnim = ANIM.IDLE;
    this.hitstun = 0;
    this.knockbackVel = 0;
    this.dead = false;
    this.deathAnimDone = false;

    // Character data
    this.charData = charData ?? null;

    // Command input buffer
    this.inputBuffer = [];
    this.inputBufferTimer = 0;

    // Loaded sprite sheets
    this.spriteSheets = {};
    for (const key of Object.keys(sprites)) {
      const value = (sprites as Record<string, SpriteInputConfig>)[key];
      this.spriteSheets[key] = {
        image: null,
        loaded: false,
        framesMax: value.framesMax ?? 1,
      };
      if (value.imageSrc) {
        const img = new Image();
        const entry = this.spriteSheets[key];
        img.onload = () => {
          entry.loaded = true;
        };
        img.src = value.imageSrc;
        entry.image = img;
      }
    }

    // Pre-rendered action sprite sheets
    this._actionSprites = null;
    this._spriteFrameIdx = 0;
    this._spriteFrameElapsed = 0;
    this._spriteFrameHold = 8;
    this._prevAnim = null;

    // Input state
    this.keys = {
      left: false,
      right: false,
      jump: false,
      attack1: false,
      attack2: false,
      block: false,
      charge: false,
    };

    // Stat multipliers
    this._atkMultiplier = 1;
    this._defMultiplier = 1;
  }

  /* ---- Get direction relative to facing ---- */
  _getRelativeDirection(): string[] {
    const dir: string[] = [];
    if (this.keys.left) dir.push(this.facingRight ? 'B' : 'F');
    if (this.keys.right) dir.push(this.facingRight ? 'F' : 'B');
    if (this.keys.jump) dir.push('U');
    // down handled via block key
    return dir;
  }

  /* ---- Record directional input for command detection ---- */
  recordInput(rawDir: string): void {
    if (this.inputBufferTimer > 0 && this.inputBuffer.length > 0) {
      const last = this.inputBuffer[this.inputBuffer.length - 1];
      if (last !== rawDir) {
        this.inputBuffer.push(rawDir);
      }
    } else {
      this.inputBuffer = [rawDir];
    }
    this.inputBufferTimer = INPUT_BUFFER_MAX_TIME;
  }

  /* ---- Check if input buffer matches a command ---- */
  matchCommand(command: string[]): boolean {
    if (this.inputBuffer.length < command.length) return false;
    const start = this.inputBuffer.length - command.length;
    for (let i = 0; i < command.length; i++) {
      if (this.inputBuffer[start + i] !== command[i]) return false;
    }
    return true;
  }

  /* ---- Try to execute a special move ---- */
  trySpecialMove(): boolean {
    if (this.isSoldier || !this.charData) return false;
    const charData = this.charData as CharacterData;
    if (!charData.moves) return false;
    if (this.isUsingSpecial || this.isUsingUltimate || this.dead || this.hitstun > 0) return false;

    // Check ultimate first (needs full energy)
    if (charData.ultimate && this.energy >= charData.ultimate.energyCost) {
      const ult = charData.ultimate;
      if (
        this.matchCommand(['D', 'DF', 'F', 'D', 'DF', 'F']) ||
        (this.keys.attack1 && this.keys.attack2 && this.energy >= MAX_ENERGY)
      ) {
        this.executeSpecialMove(ult, true);
        return true;
      }
    }

    // Check special moves (highest energy cost first for priority)
    const moves = charData.moves.slice().sort((a, b) => b.energyCost - a.energyCost);
    for (let i = 0; i < moves.length; i++) {
      const move = moves[i];
      if (this.energy >= move.energyCost && this.matchCommand(move.command)) {
        this.executeSpecialMove(move, false);
        return true;
      }
    }
    return false;
  }

  /* ---- Execute special move ---- */
  executeSpecialMove(move: SpecialMove | UltimateMove, isUltimate: boolean): void {
    this.isUsingSpecial = true;
    this.isUsingUltimate = isUltimate;
    this.currentSpecialMove = move;
    this.specialTimer = 0;
    this.specialPhase = 0;
    this.specialHitsRemaining = move.hits ?? 1;
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
      const selfDmg = (this.maxHealth * move.selfDamage) / 100;
      this.health -= selfDmg;
      if (this.health < 1) this.health = 1;
    }

    // Handle buff moves
    const sm = move as SpecialMove;
    if (move.type === MOVE_TYPE.BUFF && sm.buffDuration) {
      this.buffTimer = sm.buffDuration;
      this.buffMultiplier = sm.buffMultiplier ?? 1.5;
    }
  }

  /* ---- Start basic attack ---- */
  startAttack(type: number): void {
    if (
      this.isAttacking ||
      this.dead ||
      this.hitstun > 0 ||
      this.attackCooldown > 0 ||
      this.isBlocking ||
      this.isCharging
    )
      return;
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
  startBlock(): void {
    if (this.dead || this.isAttacking || this.isUsingSpecial || this.hitstun > 0) return;
    this.isBlocking = true;
    this.currentAnim = ANIM.BLOCK;
  }

  stopBlock(): void {
    this.isBlocking = false;
    if (this.blockStun <= 0) {
      this.currentAnim = ANIM.IDLE;
    }
  }

  /* ---- Start charging energy ---- */
  startCharge(): void {
    if (
      this.dead ||
      this.isAttacking ||
      this.isUsingSpecial ||
      this.hitstun > 0 ||
      this.energy >= this.maxEnergy
    )
      return;
    this.isCharging = true;
    this.currentAnim = ANIM.CHARGE;
  }

  stopCharge(): void {
    this.isCharging = false;
    if (this.hitstun <= 0 && !this.isAttacking) {
      this.currentAnim = ANIM.IDLE;
    }
  }

  /* ---- Take damage (with blocking and knockdown bar) ---- */
  takeHit(damage: number, knockback: number, attackType: string): void {
    if (this.dead) return;

    // Invincible after get-up — no damage
    if (this.isInvincible) return;

    // Cannot be hit while knocked down or getting up
    if (this.isKnockedDown || this.isGettingUp) return;

    // Blocking reduces damage
    if (this.isBlocking) {
      this.blockStun = 8;
      this.energy += 3;
      if (this.energy > this.maxEnergy) this.energy = this.maxEnergy;
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
    let barDamage = KNOCKDOWN_BAR_LIGHT;
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

  /* ---- Start knockdown (KOF/SF style) ---- */
  _startKnockdown(knockback: number): void {
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
    this.hitstun = 0;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
    this.knockdownBar = this.knockdownBarMax;
  }

  /* ---- Start get-up from knockdown ---- */
  _startGetup(): void {
    this.isKnockedDown = false;
    this.isGettingUp = true;
    this.getupTimer = this.getupDuration;
    this.currentAnim = ANIM.GETUP;
    this.framesCurrent = 0;
    this.framesElapsed = 0;
  }

  /* ---- Start invincibility after get-up ---- */
  _startInvincibility(): void {
    this.isGettingUp = false;
    this.isInvincible = true;
    this.invincibleTimer = this.invincibleDuration;
    this.currentAnim = ANIM.IDLE;
  }

  /* ---- Physics & state update ---- */
  updateFighter(ctx: CanvasRenderingContext2D, opponent: { position: Vector2D } | null): void {
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
      this.position.x += this.knockbackVel;
      this.knockbackVel *= 0.9;
      this.velocity.y += GRAVITY;
      this.position.y += this.velocity.y;

      if (this.position.y + this.height >= GROUND_Y) {
        this.position.y = GROUND_Y - this.height;
        this.velocity.y = 0;
        this.onGround = true;
        this.knockdownTimer--;
        if (this.knockdownTimer <= 0) {
          this._startGetup();
        }
      }

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
      this.knockdownBar = Math.min(
        this.knockdownBarMax,
        this.knockdownBar + this.knockdownBarRecovery,
      );
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
    const backKey = this.facingRight ? this.keys.left : this.keys.right;
    const downForBlock = this.keys.block;
    if (backKey && downForBlock && !this.isAttacking && !this.isUsingSpecial && this.hitstun <= 0) {
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
      let moveX = 0;
      if (!this.isCharging && !this.isUsingSpecial) {
        if (this.keys.left) moveX -= this.speed;
        if (this.keys.right) moveX += this.speed;
      }

      // Special move movement
      if (this.isUsingSpecial && this.currentSpecialMove) {
        const moveType = this.currentSpecialMove.type;
        if (moveType === MOVE_TYPE.RUSH) {
          const rushDir = this.facingRight ? 1 : -1;
          moveX = rushDir * (this.speed * 2.5);
        } else if (moveType === MOVE_TYPE.SPIN) {
          const spinDir = this.facingRight ? 1 : -1;
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
      let relDir = '';
      const goingBack =
        (this.facingRight && this.keys.left) || (!this.facingRight && this.keys.right);
      const goingForward =
        (this.facingRight && this.keys.right) || (!this.facingRight && this.keys.left);
      const goingDown = this.keys.block;
      const goingUp = this.keys.jump;

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
        const didSpecial = this.trySpecialMove();
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
    let specialRange = 1;
    if (this.isUsingSpecial && this.currentSpecialMove) {
      if (this.currentSpecialMove.type === MOVE_TYPE.AREA) specialRange = 2;
      else if (this.currentSpecialMove.type === MOVE_TYPE.SPIN) specialRange = 1.5;
      else if (this.currentSpecialMove.type === MOVE_TYPE.SLAM) specialRange = 1.3;
    }

    const atkW = this.attackBox.width * specialRange;
    const _atkH = this.attackBox.height * specialRange;
    const atkOffX = this.facingRight ? this.attackBox.offset.x : -(this.attackBox.offset.x + atkW);
    this.attackBox.position.x = this.position.x + (this.facingRight ? this.width : 0) + atkOffX;
    this.attackBox.position.y = this.position.y + this.attackBox.offset.y;

    // --- Attack / Special duration ---
    if (this.isAttacking || this.isUsingSpecial) {
      this.attackFrame++;

      // Multi-hit special moves
      if (this.isUsingSpecial && this.currentSpecialMove && this.specialHitsRemaining > 0) {
        let hitInterval = Math.floor(this.attackDuration / (this.currentSpecialMove.hits ?? 1));
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

    // --- Cooldown ---
    if (this.attackCooldown > 0) this.attackCooldown--;

    // --- Determine animation ---
    if (
      this.hitstun <= 0 &&
      !this.isAttacking &&
      !this.isUsingSpecial &&
      !this.isBlocking &&
      !this.isCharging &&
      !this.isKnockedDown &&
      !this.isGettingUp
    ) {
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
  _drawPlaceholder(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    const bodyColor = this.charData ? this.charData.color : this.color;
    const isSoldierUnit = this.isSoldier;

    // Lazily generate action sprite sheets on first draw
    if (!this._actionSprites && typeof generateCharacterSprites === 'function') {
      this._actionSprites = generateCharacterSprites(
        this.charData ?? { color: this.color },
        this.width,
        this.height,
        isSoldierUnit,
      );
    }

    // Ultimate flash effect — dramatic multi-layer flash
    if (this.ultimateFlash > 0) {
      const flashProgress = this.ultimateFlash / 30;
      const moveColor = (this.currentSpecialMove && this.currentSpecialMove.color) || '#ffd700';
      const burstX = this.position.x + this.width / 2;
      const burstY = this.position.y + this.height / 2;
      const burstR = (1 - flashProgress) * 300 + 50;
      const burstGrad = ctx.createRadialGradient(burstX, burstY, 0, burstX, burstY, burstR);
      burstGrad.addColorStop(0, 'rgba(255, 255, 255, ' + flashProgress * 0.7 + ')');
      const burstRgba = this._colorToRgba(moveColor, flashProgress * 0.4);
      burstGrad.addColorStop(0.4, burstRgba);
      burstGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
      ctx.fillStyle = 'rgba(255, 255, 200, ' + flashProgress * 0.5 + ')';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = burstGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      if (this.ultimateFlash > 15) {
        ctx.save();
        ctx.globalAlpha = flashProgress * 0.6;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        for (let sl = 0; sl < 16; sl++) {
          const lineAngle = ((Math.PI * 2) / 16) * sl;
          const innerR = 60 + Math.random() * 20;
          const outerR = 150 + Math.random() * 100;
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
        life: 6,
      });
      if (this._motionTrail.length > 5) {
        this._motionTrail.shift();
      }
    } else {
      this._motionTrail.length = 0;
    }

    for (let ti = 0; ti < this._motionTrail.length; ti++) {
      const trail = this._motionTrail[ti];
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
    let animAction: AnimState = this.currentAnim;
    if (this.isKnockedDown) animAction = ANIM.KNOCKDOWN;
    else if (this.isGettingUp) animAction = ANIM.GETUP;
    else if (this.dead) animAction = ANIM.DEATH;

    // --- Draw character sprite from pre-rendered sheet ---
    const spriteDrawn = this._drawActionSprite(ctx, animAction);

    // Fallback: if sprite not available, draw a coloured rectangle
    if (!spriteDrawn) {
      ctx.fillStyle = bodyColor;
      ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    }

    // Animated spinning stars overlay for knockdown
    if (this.isKnockedDown) {
      const starCount = 3;
      const kcx = this.position.x + this.width / 2;
      const kcy = this.position.y + this.height * 0.2;
      for (let si = 0; si < starCount; si++) {
        const starAngle = Date.now() * 0.005 + (si * Math.PI * 2) / starCount;
        const starX = kcx + Math.cos(starAngle) * 20;
        const starY = kcy + Math.sin(starAngle) * 10;
        ctx.fillStyle = '#ffff00';
        ctx.font = '12px sans-serif';
        ctx.fillText('★', starX - 6, starY);
      }
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
      const chargeAlpha = 0.3 + Math.sin(Date.now() * 0.02) * 0.2;
      ctx.fillStyle = 'rgba(0, 200, 255, ' + chargeAlpha + ')';
      ctx.beginPath();
      ctx.arc(
        this.position.x + this.width / 2,
        this.position.y + this.height / 2,
        this.width * 0.8 + Math.sin(Date.now() * 0.015) * 5,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      for (let i = 0; i < 3; i++) {
        const particleX = this.position.x + Math.random() * this.width;
        const particleY = this.position.y + this.height - Math.random() * this.height * 1.5;
        ctx.fillStyle = 'rgba(100, 220, 255, ' + (Math.random() * 0.5 + 0.3) + ')';
        ctx.beginPath();
        ctx.arc(particleX, particleY, Math.random() * 3 + 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Attack effects
    if (this.isAttacking || this.isUsingSpecial) {
      if (this.isUsingSpecial && this.currentSpecialMove) {
        const moveColor2 = this.currentSpecialMove.color ?? '#ffcc00';
        const moveType = this.currentSpecialMove.type;

        ctx.fillStyle = moveColor2;
        ctx.globalAlpha = 0.5;

        if (moveType === MOVE_TYPE.AREA || moveType === MOVE_TYPE.SPIN) {
          ctx.beginPath();
          const areaR = this.width * 1.5 + Math.sin(this.attackFrame * 0.3) * 10;
          ctx.arc(
            this.position.x + this.width / 2,
            this.position.y + this.height / 2,
            areaR,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        } else if (moveType === MOVE_TYPE.UPPERCUT) {
          ctx.fillRect(
            this.position.x + this.width / 2 - 10,
            this.position.y - 30 - this.attackFrame * 2,
            20,
            this.height + this.attackFrame * 2,
          );
        } else if (moveType === MOVE_TYPE.SLAM) {
          ctx.beginPath();
          ctx.ellipse(
            this.position.x + this.width / 2,
            this.position.y + this.height,
            this.attackFrame * 3 + 10,
            10,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        } else if (moveType === MOVE_TYPE.RUSH) {
          const trailDir = this.facingRight ? -1 : 1;
          for (let j = 0; j < 4; j++) {
            ctx.globalAlpha = 0.3 - j * 0.07;
            ctx.fillRect(
              this.position.x + trailDir * j * 15,
              this.position.y,
              this.width,
              this.height,
            );
          }
        } else if (moveType === MOVE_TYPE.COUNTER) {
          ctx.strokeStyle = moveColor2;
          ctx.lineWidth = 4;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(
            this.position.x + this.width / 2,
            this.position.y + this.height / 2,
            this.width + 10,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        } else if (moveType === MOVE_TYPE.BUFF) {
          ctx.fillStyle = moveColor2;
          ctx.globalAlpha = 0.3 + Math.sin(this.attackFrame * 0.2) * 0.15;
          ctx.beginPath();
          ctx.arc(
            this.position.x + this.width / 2,
            this.position.y + this.height / 2,
            this.width + 15,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        } else if (moveType === MOVE_TYPE.GRAB) {
          ctx.fillRect(
            this.position.x + (this.facingRight ? this.width : -40),
            this.position.y + 20,
            40,
            30,
          );
        } else {
          ctx.fillRect(
            this.attackBox.position.x,
            this.attackBox.position.y,
            this.attackBox.width,
            this.attackBox.height,
          );
        }

        ctx.globalAlpha = 1;

        ctx.fillStyle = moveColor2;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          this.currentSpecialMove.name,
          this.position.x + this.width / 2,
          this.position.y - 30,
        );
      } else {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.35)';
        ctx.fillRect(
          this.attackBox.position.x,
          this.attackBox.position.y,
          this.attackBox.width,
          this.attackBox.height,
        );

        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        const weaponStartX = this.facingRight ? this.position.x + this.width : this.position.x;
        const weaponEndX = this.facingRight
          ? this.attackBox.position.x + this.attackBox.width
          : this.attackBox.position.x;
        const weaponY = this.position.y + this.height * 0.3;
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
      ctx.arc(
        this.position.x + this.width / 2,
        this.position.y + this.height / 2,
        this.width * 0.8 + Math.sin(this.invincibleTimer * 0.2) * 5,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }

    // Buff indicator
    if (this.buffTimer > 0) {
      ctx.fillStyle = 'rgba(255, 170, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(
        this.position.x + this.width / 2,
        this.position.y + this.height / 2,
        this.width * 0.6 + Math.sin(Date.now() * 0.008) * 3,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    ctx.restore();
  }

  /* ---- Draw one frame from the action sprite sheet ---- */
  _drawActionSprite(ctx: CanvasRenderingContext2D, animAction: AnimState): boolean {
    if (!this._actionSprites) return false;

    let sheet: SpriteSheet | undefined = this._actionSprites[animAction];
    if (!sheet) {
      sheet = this._actionSprites[ANIM.IDLE];
      if (!sheet) return false;
    }

    // Advance sprite frame
    if (this._prevAnim !== animAction) {
      this._spriteFrameIdx = 0;
      this._spriteFrameElapsed = 0;
      this._prevAnim = animAction;
    }

    this._spriteFrameElapsed++;
    if (this._spriteFrameElapsed >= this._spriteFrameHold) {
      this._spriteFrameElapsed = 0;
      this._spriteFrameIdx = (this._spriteFrameIdx + 1) % sheet.frameCount;
    }

    const srcX = this._spriteFrameIdx * sheet.frameW;
    const srcY = 0;

    const destX = this.position.x - sheet.padX;
    const destY = this.position.y - sheet.padY;

    ctx.save();

    // Flip horizontally if facing left
    if (!this.facingRight) {
      ctx.translate(this.position.x + this.width / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(this.position.x + this.width / 2), 0);
    }

    ctx.drawImage(
      sheet.canvas,
      srcX,
      srcY,
      sheet.frameW,
      sheet.frameH,
      destX,
      destY,
      sheet.frameW,
      sheet.frameH,
    );

    ctx.restore();

    return true;
  }

  /* ---- Color utility methods ---- */
  _darkenColor(hex: string, factor: number): string {
    const r = Math.floor(parseInt(hex.slice(1, 3), 16) * factor);
    const g = Math.floor(parseInt(hex.slice(3, 5), 16) * factor);
    const b = Math.floor(parseInt(hex.slice(5, 7), 16) * factor);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  _lightenColor(hex: string, factor: number): string {
    const r = Math.min(255, Math.floor(parseInt(hex.slice(1, 3), 16) * factor));
    const g = Math.min(255, Math.floor(parseInt(hex.slice(3, 5), 16) * factor));
    const b = Math.min(255, Math.floor(parseInt(hex.slice(5, 7), 16) * factor));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  _colorToRgba(color: string, alpha: number): string {
    if (color.charAt(0) === '#') {
      let r = parseInt(color.slice(1, 3), 16);
      let g = parseInt(color.slice(3, 5), 16);
      let b = parseInt(color.slice(5, 7), 16);
      if (isNaN(r)) r = 255;
      if (isNaN(g)) g = 200;
      if (isNaN(b)) b = 100;
      return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }
    const match = color.match(/rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)/);
    if (match) {
      return 'rgba(' + match[1] + ',' + match[2] + ',' + match[3] + ',' + alpha + ')';
    }
    const matchA = color.match(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\s*\)/);
    if (matchA) {
      return 'rgba(' + matchA[1] + ',' + matchA[2] + ',' + matchA[3] + ',' + alpha + ')';
    }
    return 'rgba(255, 200, 100, ' + alpha + ')';
  }
}
