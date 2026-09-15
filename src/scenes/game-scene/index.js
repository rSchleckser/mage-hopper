import { setMobileControlsVisible } from '../../input.js';
import { hideMenuDomUi, bindDomTap } from '../../ui/dom-overlays.js';
import { hideInstructionsDomUi } from '../../ui/instructions-overlay.js';
import { makePillButton } from '../../ui/menu-widgets.js';
import { gameState } from '../../game-state.js';
import { applyFacingHitbox } from '../../utils/hitbox.js';
import { ENEMY_BASE_SPEED, ENEMY_HP } from '../../constants.js';
import { getCharacter, frameFileIndices } from '../../characters.js';
import { getSelectedCharacterId } from '../../character-select.js';
import { ProjectileGroup } from '../../entities/projectile.js';
import { SlamWaveGroup } from '../../entities/slam-wave.js';
import { getLevelConfig, buildPlatforms, ENEMY_SPAWNS } from '../../levels.js';
import { createAnimations } from './animations.js';
import { enemyFollows, createEnemyHealthBar } from './enemy-ai.js';
import { hitEnemyWithFire, hitEnemyWithSlamWave, slamWaveCanHit, collectKey, enterDoor } from './combat.js';
import { updatePlayer } from './player-controller.js';

function recycleOffscreen(bolt) {
  if (!bolt.active || !bolt.body) return;
  bolt.body.allowGravity = false;
  bolt.setVelocityY(0);
  // Fireballs / slam waves fly straight; recycle once they leave the screen
  if (bolt.x < -80 || bolt.x > 1970 || bolt.y < -80 || bolt.y > 980) {
    bolt.anims.stop();
    bolt.setActive(false);
    bolt.setVisible(false);
    bolt.body.stop();
    bolt.body.enable = false;
  }
}

function recycleAllProjectiles(scene) {
  if (scene.fireballs) scene.fireballs.children.each(recycleOffscreen);
  if (scene.slamWaves) scene.slamWaves.children.each(recycleOffscreen);
}

// Texture keys are fixed strings ('player', 'run1', ...) reused across
// character selections, but Phaser's texture cache skips a load.image() call
// if the key already exists — so a re-selected character's frames must be
// explicitly removed first or the previous character's art sticks around.
function reloadImage(scene, key, url) {
  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }
  scene.load.image(key, url);
}

// Frame keys are always internally 1-indexed (key + i for i = 1..count),
// regardless of the on-disk numbering/casing convention for that character.
function loadCharacterAnim(scene, folder, keyPrefix, def) {
  frameFileIndices(def).forEach((fileIndex, i) => {
    reloadImage(scene, keyPrefix + (i + 1), `./${folder}/${def.dir}/${def.prefix}${fileIndex}.png`);
  });
}

function loadCharacterFrames(scene, character) {
  reloadImage(scene, 'player', `./${character.folder}/${character.baseFile}`);
  loadCharacterAnim(scene, character.folder, 'run', character.anims.run);
  loadCharacterAnim(scene, character.folder, 'jump', character.anims.jump);
  loadCharacterAnim(scene, character.folder, 'attack', character.anims.attack);
  loadCharacterAnim(scene, character.folder, 'death', character.anims.death);
  loadCharacterAnim(scene, character.folder, 'hurt', character.anims.hurt);
  loadCharacterAnim(scene, character.folder, 'attackExtra', character.anims.attackExtra);
}

export const gameScene = {
  key: 'Game',

  preload: function () {
    this.load.image('background', './img/nature_background.jpg');
    this.load.image('platform', './img/grass_platform.png');
    this.load.image('key', './img/key.png');
    this.load.image('door', './img/door.png');

    // Load enemy image
    this.load.image('enemy', './Knight/knight.png');

    // Load enemy running frames
    for (let i = 1; i <= 8; i++) this.load.image('enemyRun' + i, './Knight/Run/run' + i + '.png');
    // Load enemy jumping frames
    for (let i = 1; i <= 7; i++) this.load.image('enemyJump' + i, './Knight/Jump/jump' + i + '.png');
    // Load enemy death frames
    for (let i = 1; i <= 10; i++) this.load.image('enemyDeath' + i, './Knight/Death/death' + i + '.png');
    // Load enemy attack frames (0-indexed on disk, same convention as the
    // playable Knight's own Attack folder in characters.js)
    for (let i = 0; i <= 4; i++) this.load.image('enemyAttack' + (i + 1), './Knight/Attack/attack' + i + '.png');
    // Load enemy hurt frames
    for (let i = 1; i <= 4; i++) this.load.image('enemyHurt' + i, './Knight/Hurt/hurt' + i + '.png');

    // Selected playable character's body + animation frames (Mage or Rogue)
    this.character = getCharacter(getSelectedCharacterId());
    loadCharacterFrames(this, this.character);

    // Fire / Fire_Extra VFX are shared projectile textures, not part of the
    // player's own body sprite, so they always load regardless of character.
    for (let i = 1; i <= 9; i++) this.load.image('fire' + i, './Mage/Fire/fire' + i + '.png');
    for (let i = 1; i <= 9; i++) this.load.image('fireExtra' + i, './Mage/Fire_Extra/fire_extra' + i + '.png');
  },

  create: function () {
    hideMenuDomUi();
    hideInstructionsDomUi();
    setMobileControlsVisible(true);
    this.add.image(1000, 400, 'background');

    const levelConfig = getLevelConfig(gameState.level);

    // Every fresh Game scene start begins at full HP — this covers the very
    // first play session (before any reset site has run) and also means
    // Pause's "Restart Level" (the one entry point that starts Game directly,
    // without going through a scene that resets gameState.hp) correctly
    // grants a clean attempt, same as lives being untouched but enemies being
    // fully respawned on restart.
    gameState.hp = this.character.maxHp;

    // HUD
    this.levelIndicator = this.add.text(16, 16, `Level: ${gameState.level}`, { fontSize: '32px', fill: '#000' });
    this.lifeIndicator = this.add.text(1700, 16, `Lives: ${gameState.lives}`, { fontSize: '32px', fill: 'blue' });
    this.hpIndicator = this.add.text(1700, 50, `HP: ${gameState.hp}/${this.character.maxHp}`, {
      fontSize: '28px',
      fill: 'blue',
    });
    this.playerSpeedIndicator = this.add.text(500, 16, `Player Speed: ${this.character.moveSpeed}`, {
      fontSize: '32px',
      fill: 'green',
    });
    this.enemySpeedIndicator = this.add.text(
      900,
      16,
      `Enemy Speed: ${parseInt(ENEMY_BASE_SPEED * (1 + gameState.level / 8.3))}`,
      { fontSize: '32px', fill: 'red' }
    );

    // Key
    this.key = this.physics.add.sprite(levelConfig.key.x, levelConfig.key.y, 'key').setScale(0.2);
    this.key.setBounce(1.0);
    this.key.body.setSize(this.key.width * 0.7, this.key.height * 1);
    this.key.body.setOffset(this.key.width * 0.15, this.key.height * 0.2);

    // Door
    this.door = this.physics.add.sprite(levelConfig.door.x, levelConfig.door.y, 'door').setScale(0.1);
    this.door.body.setSize(this.door.width * 0.5, this.door.height * 0.9);

    this.platforms = buildPlatforms(this, levelConfig);

    // Player
    this.player = this.physics.add.sprite(150, 800, 'player').setScale(1.5);
    this.player.setBounce(0.1);
    this.player.setCollideWorldBounds(true);
    applyFacingHitbox(this.player, false);

    // Enemies
    this.enemies = ENEMY_SPAWNS.map((spawn) => {
      const enemy = this.physics.add.sprite(spawn.x, spawn.y, 'enemy').setScale(1.5);
      enemy.setCollideWorldBounds(true);
      applyFacingHitbox(enemy, false);
      enemy.setData('hp', ENEMY_HP);
      enemy.setData('aiState', 'chase');
      enemy.setData('nextAttackAt', 0);
      createEnemyHealthBar(this, enemy);
      return enemy;
    });

    // Fireball pool and Extra Attack wave pool
    this.fireballs = new ProjectileGroup(this);
    this.slamWaves = new SlamWaveGroup(this);

    this.enemies.forEach((enemy) => {
      this.physics.add.collider(enemy, this.platforms);
      this.physics.add.overlap(this.fireballs, enemy, hitEnemyWithFire, null, this);
      this.physics.add.overlap(this.slamWaves, enemy, hitEnemyWithSlamWave, slamWaveCanHit, this);
      // Physical blocking only — damage now comes solely from a landed enemy
      // attack swing (enemy-ai.js's beginEnemyAttack), not mere contact.
      this.physics.add.collider(this.player, enemy);
    });

    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.key, this.platforms);
    this.physics.add.collider(this.door, this.platforms);

    // Player collects the key, then enters the door with it
    this.physics.add.overlap(this.player, this.key, collectKey, null, this);
    this.physics.add.overlap(this.player, this.door, enterDoor, null, this);

    // Reset level-exit / i-frame flags for a fresh scene start
    this.isExitingLevel = false;
    this.invulnerableUntil = 0;
    this.playerState = 'idle';
    this.airAttackUsed = false;

    createAnimations(this, this.character);

    // Key commands
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Pause: keyboard, HUD button (desktop), and the persistent mobile pause button
    const openPauseMenu = () => {
      if (this.playerState === 'dying' || this.isExitingLevel) return;
      this.input.enabled = false;
      this.scene.pause();
      this.scene.launch('Pause');
    };
    this.input.keyboard.on('keydown-ESC', openPauseMenu);
    this.input.keyboard.on('keydown-P', openPauseMenu);

    const pauseHudBtn = makePillButton(this, 1400, 34, 'Pause', {
      width: 110,
      height: 40,
      variant: 'secondary',
      fontSize: 16,
      depth: 25,
    });
    pauseHudBtn.setOnActivate(openPauseMenu);

    bindDomTap(document.getElementById('btn-pause'), openPauseMenu);

    this.events.on('resume', () => setMobileControlsVisible(true));
  },

  update: function () {
    // Let hurt/death anims play without movement stealing control
    if (this.playerState === 'dying' || this.playerState === 'hurt') {
      recycleAllProjectiles(this);
      this.enemies.forEach((enemy) => enemyFollows(enemy, this));
      return;
    }

    updatePlayer(this);
    this.enemies.forEach((enemy) => enemyFollows(enemy, this));
    recycleAllProjectiles(this);
  },
};
