// ============================================================
// game.js — Phaser 3 Fighting Game: 武將爭霸 Sango Fighter
// ============================================================
//
// ===================== ASSET MANIFEST =======================
// All images are loaded from ./img/ folder.
// To replace visuals, drop same-named files into ./img/.
// If an image fails to load, a coloured rectangle fallback is
// generated at runtime so the game always runs.
//
// Required files:
//   bg_stage1.png       — 1024×576  Stage background
//   player_idle.png     — 64×64    Player idle sprite
//   player_attack.png   — 64×64    Player attack sprite
//   enemy_idle.png      — 64×64    Enemy idle sprite
//   enemy_attack.png    — 64×64    Enemy attack sprite
//   floor.png           — 1024×32  Floor / ground tile
// ============================================================

(function () {
  'use strict';

  /* --------------------------------------------------------
     Constants
  -------------------------------------------------------- */
  var CANVAS_W = 1024;
  var CANVAS_H = 576;
  var GRAVITY_Y = 800;
  var FLOOR_Y = CANVAS_H - 32; // top-edge of floor
  var PLAYER_SPEED = 220;
  var JUMP_VELOCITY = -420;
  var ATTACK_DAMAGE = 10;
  var KNOCKBACK_VX = 250;
  var KNOCKBACK_VY = -120;
  var MAX_HP = 100;

  /* --------------------------------------------------------
     Asset list — loaded from ./img/
  -------------------------------------------------------- */
  var ASSETS = [
    { key: 'bg_stage1',      file: 'bg_stage1.png' },
    { key: 'player_idle',    file: 'player_idle.png' },
    { key: 'player_attack',  file: 'player_attack.png' },
    { key: 'enemy_idle',     file: 'enemy_idle.png' },
    { key: 'enemy_attack',   file: 'enemy_attack.png' },
    { key: 'floor',          file: 'floor.png' }
  ];

  /* --------------------------------------------------------
     Fallback texture generator
     Creates a solid-colour rectangle when an image is missing
  -------------------------------------------------------- */
  var FALLBACK_COLORS = {
    bg_stage1:     0x2a2a4a,
    player_idle:   0x3399ff,
    player_attack: 0x66bbff,
    enemy_idle:    0xff4444,
    enemy_attack:  0xff7777,
    floor:         0x555555
  };

  var FALLBACK_SIZES = {
    bg_stage1:     { w: CANVAS_W, h: CANVAS_H },
    player_idle:   { w: 64, h: 64 },
    player_attack: { w: 64, h: 64 },
    enemy_idle:    { w: 64, h: 64 },
    enemy_attack:  { w: 64, h: 64 },
    floor:         { w: CANVAS_W, h: 32 }
  };

  function generateFallback(scene, key) {
    var size = FALLBACK_SIZES[key] || { w: 64, h: 64 };
    var color = FALLBACK_COLORS[key] || 0x888888;
    var gfx = scene.make.graphics({ add: false });
    gfx.fillStyle(color, 1);
    gfx.fillRect(0, 0, size.w, size.h);
    gfx.generateTexture(key, size.w, size.h);
    gfx.destroy();
  }

  /* ========================================================
     MainScene — the single Phaser Scene for the fight
  ======================================================== */
  var MainScene = new Phaser.Class({
    Extends: Phaser.Scene,

    initialize: function MainScene() {
      Phaser.Scene.call(this, { key: 'MainScene' });

      // runtime references
      this.player = null;
      this.enemy = null;
      this.floor = null;
      this.cursors = null;
      this.keys = {};

      // health
      this.playerHP = MAX_HP;
      this.enemyHP = MAX_HP;

      // HUD graphics
      this.hpBarGfx = null;

      // attack state
      this.playerAttacking = false;
      this._enemyAttacking = false;
      this.hitbox = null;
    },

    /* ---- preload ---- */
    preload: function () {
      // Load every asset from ./img/
      for (var i = 0; i < ASSETS.length; i++) {
        this.load.image(ASSETS[i].key, './img/' + ASSETS[i].file);
      }
    },

    /* ---- create ---- */
    create: function () {
      var self = this;

      // --- Generate fallback textures for any assets that failed ---
      for (var i = 0; i < ASSETS.length; i++) {
        var key = ASSETS[i].key;
        if (!this.textures.exists(key)) {
          generateFallback(this, key);
          console.warn('[Asset Override] 圖片缺失，使用 Fallback：' + key);
        }
      }

      // --- Background ---
      this.add.image(CANVAS_W / 2, CANVAS_H / 2, 'bg_stage1')
        .setDisplaySize(CANVAS_W, CANVAS_H);

      // --- Floor (static physics body) ---
      this.floor = this.physics.add.staticGroup();
      var floorSprite = this.floor.create(CANVAS_W / 2, FLOOR_Y + 16, 'floor');
      floorSprite.setDisplaySize(CANVAS_W, 32).refreshBody();

      // --- Player ---
      this.player = this.physics.add.sprite(200, FLOOR_Y - 40, 'player_idle');
      this.player.setDisplaySize(64, 64);
      this.player.setBounce(0);
      this.player.setCollideWorldBounds(true);
      this.player.setData('facingRight', true);
      this.physics.add.collider(this.player, this.floor);

      // --- Enemy ---
      this.enemy = this.physics.add.sprite(CANVAS_W - 200, FLOOR_Y - 40, 'enemy_idle');
      this.enemy.setDisplaySize(64, 64);
      this.enemy.setBounce(0);
      this.enemy.setCollideWorldBounds(true);
      this.enemy.setFlipX(true);
      this.physics.add.collider(this.enemy, this.floor);

      // --- Input keys ---
      this.keys = this.input.keyboard.addKeys({
        left:   Phaser.Input.Keyboard.KeyCodes.A,
        right:  Phaser.Input.Keyboard.KeyCodes.D,
        jump:   Phaser.Input.Keyboard.KeyCodes.W,
        attack: Phaser.Input.Keyboard.KeyCodes.J
      });

      // Attack key — single press
      this.input.keyboard.on('keydown-J', function () {
        self.performAttack();
      });

      // --- Health-bar graphics (drawn every frame) ---
      this.hpBarGfx = this.add.graphics();

      // --- Name labels ---
      this.add.text(20, 10, 'P1 玩家', {
        fontSize: '14px', color: '#ffffff',
        fontFamily: 'Microsoft JhengHei, sans-serif'
      });
      this.add.text(CANVAS_W - 120, 10, 'P2 敵將', {
        fontSize: '14px', color: '#ffffff',
        fontFamily: 'Microsoft JhengHei, sans-serif'
      });
    },

    /* ---- update (every frame) ---- */
    update: function () {
      if (!this.player || !this.enemy) return;

      // --- Player movement ---
      var body = this.player.body;
      body.setVelocityX(0);

      if (this.keys.left.isDown) {
        body.setVelocityX(-PLAYER_SPEED);
        this.player.setData('facingRight', false);
        this.player.setFlipX(true);
      } else if (this.keys.right.isDown) {
        body.setVelocityX(PLAYER_SPEED);
        this.player.setData('facingRight', true);
        this.player.setFlipX(false);
      }

      // Jump (only when on floor)
      if (this.keys.jump.isDown && body.touching.down) {
        body.setVelocityY(JUMP_VELOCITY);
      }

      // Set idle/attack texture
      if (!this.playerAttacking) {
        this.player.setTexture('player_idle');
      }

      // --- Simple AI for enemy ---
      this.updateEnemyAI();

      // --- Draw HUD ---
      this.drawHealthBars();
    },

    /* ---- Attack logic ---- */
    performAttack: function () {
      if (this.playerAttacking) return;
      var self = this;
      this.playerAttacking = true;
      this.player.setTexture('player_attack');

      // Determine hitbox position (in front of player)
      var facingRight = this.player.getData('facingRight');
      var hbX = facingRight
        ? this.player.x + 40
        : this.player.x - 40;
      var hbY = this.player.y;

      // Create invisible hitbox
      this.hitbox = this.physics.add.sprite(hbX, hbY, null);
      this.hitbox.setDisplaySize(40, 48);
      this.hitbox.setVisible(false);
      this.hitbox.body.setAllowGravity(false);

      // Overlap check with enemy (hurtbox = enemy body)
      this.physics.add.overlap(this.hitbox, this.enemy, function () {
        self.onHitEnemy();
      }, null, this);

      // Destroy hitbox after short duration (100 ms)
      this.time.delayedCall(100, function () {
        if (self.hitbox) {
          self.hitbox.destroy();
          self.hitbox = null;
        }
        self.playerAttacking = false;
        self.player.setTexture('player_idle');
      });
    },

    /* ---- Hit resolution ---- */
    onHitEnemy: function () {
      if (!this.hitbox) return; // already resolved
      // Destroy hitbox immediately to prevent multi-hit
      this.hitbox.destroy();
      this.hitbox = null;

      // Damage
      this.enemyHP = Math.max(0, this.enemyHP - ATTACK_DAMAGE);
      console.log('命中！ Enemy HP: ' + this.enemyHP);

      // Knockback
      var dir = this.enemy.x > this.player.x ? 1 : -1;
      this.enemy.body.setVelocity(dir * KNOCKBACK_VX, KNOCKBACK_VY);

      // Flash enemy
      this.tweens.add({
        targets: this.enemy,
        alpha: 0.3,
        duration: 80,
        yoyo: true,
        repeat: 1
      });

      // Check KO
      if (this.enemyHP <= 0) {
        this.showResult('P1 勝利！');
      }
    },

    /* ---- Enemy AI (simple) ---- */
    updateEnemyAI: function () {
      var eb = this.enemy.body;
      var dist = this.player.x - this.enemy.x;
      var absDist = Math.abs(dist);

      // Walk toward player
      if (absDist > 80) {
        eb.setVelocityX(dist > 0 ? 120 : -120);
        this.enemy.setFlipX(dist < 0);
      } else {
        eb.setVelocityX(0);
        // Random attack
        if (Phaser.Math.Between(0, 100) < 2) {
          this.enemyAttack();
        }
      }

      if (!this._enemyAttacking) {
        this.enemy.setTexture('enemy_idle');
      }
    },

    enemyAttack: function () {
      if (this._enemyAttacking) return;
      var self = this;
      this._enemyAttacking = true;
      this.enemy.setTexture('enemy_attack');

      var facingRight = this.enemy.x < this.player.x;
      var hbX = facingRight
        ? this.enemy.x + 40
        : this.enemy.x - 40;
      var hbY = this.enemy.y;

      var ehb = this.physics.add.sprite(hbX, hbY, null);
      ehb.setDisplaySize(40, 48);
      ehb.setVisible(false);
      ehb.body.setAllowGravity(false);

      this.physics.add.overlap(ehb, this.player, function () {
        self.onHitPlayer(ehb);
      }, null, this);

      this.time.delayedCall(100, function () {
        if (ehb && ehb.active) {
          ehb.destroy();
        }
        self._enemyAttacking = false;
        self.enemy.setTexture('enemy_idle');
      });
    },

    onHitPlayer: function (ehb) {
      if (!ehb || !ehb.active) return;
      ehb.destroy();

      this.playerHP = Math.max(0, this.playerHP - ATTACK_DAMAGE);
      console.log('玩家被擊中！ Player HP: ' + this.playerHP);

      var dir = this.player.x > this.enemy.x ? 1 : -1;
      this.player.body.setVelocity(dir * KNOCKBACK_VX, KNOCKBACK_VY);

      this.tweens.add({
        targets: this.player,
        alpha: 0.3,
        duration: 80,
        yoyo: true,
        repeat: 1
      });

      if (this.playerHP <= 0) {
        this.showResult('P2 (AI) 勝利！');
      }
    },

    /* ---- Health Bar UI ---- */
    drawHealthBars: function () {
      var gfx = this.hpBarGfx;
      gfx.clear();

      var barW = 300;
      var barH = 18;

      // P1 bar (top-left)
      var p1x = 20, p1y = 28;
      gfx.fillStyle(0x333333, 1);
      gfx.fillRect(p1x, p1y, barW, barH);
      gfx.fillStyle(0x00cc44, 1);
      gfx.fillRect(p1x, p1y, barW * (this.playerHP / MAX_HP), barH);
      gfx.lineStyle(2, 0xffffff, 1);
      gfx.strokeRect(p1x, p1y, barW, barH);

      // P2 bar (top-right, grows from right)
      var p2x = CANVAS_W - 20 - barW, p2y = 28;
      gfx.fillStyle(0x333333, 1);
      gfx.fillRect(p2x, p2y, barW, barH);
      var p2Fill = barW * (this.enemyHP / MAX_HP);
      gfx.fillStyle(0xcc0000, 1);
      gfx.fillRect(p2x + barW - p2Fill, p2y, p2Fill, barH);
      gfx.lineStyle(2, 0xffffff, 1);
      gfx.strokeRect(p2x, p2y, barW, barH);
    },

    /* ---- Round result ---- */
    showResult: function (message) {
      this.physics.pause();

      var overlay = this.add.rectangle(
        CANVAS_W / 2, CANVAS_H / 2,
        CANVAS_W, CANVAS_H,
        0x000000, 0.6
      );
      overlay.setDepth(10);

      var txt = this.add.text(CANVAS_W / 2, CANVAS_H / 2 - 30, message, {
        fontSize: '48px',
        color: '#ffd700',
        fontFamily: 'Microsoft JhengHei, sans-serif',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(11);

      var restartTxt = this.add.text(CANVAS_W / 2, CANVAS_H / 2 + 40,
        '按 R 重新開始', {
          fontSize: '20px',
          color: '#ffffff',
          fontFamily: 'Microsoft JhengHei, sans-serif'
        }).setOrigin(0.5).setDepth(11);

      var self = this;
      this.input.keyboard.once('keydown-R', function () {
        self.playerHP = MAX_HP;
        self.enemyHP = MAX_HP;
        self.playerAttacking = false;
        self._enemyAttacking = false;
        self.scene.restart();
      });
    }
  });

  /* ========================================================
     Boot — wire the HTML start button to Phaser
  ======================================================== */
  function startGame() {
    var startScreen = document.getElementById('start-screen');
    var container = document.getElementById('game-container');

    // Hide HTML UI, show game container
    startScreen.style.display = 'none';
    container.style.display = 'block';

    // Create Phaser Game instance
    new Phaser.Game({
      type: Phaser.AUTO,
      width: CANVAS_W,
      height: CANVAS_H,
      parent: 'game-container',
      backgroundColor: '#0a0a1a',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: GRAVITY_Y },
          debug: false
        }
      },
      scene: [MainScene]
    });
  }

  // Bind the start button
  var btn = document.getElementById('start-btn');
  if (btn) {
    btn.addEventListener('click', function () {
      startGame();
    });
  }
})();
