import { gameState } from '../../game-state.js';
import { setMobileControlsVisible } from '../../input.js';
import { applyFacingHitbox } from '../../utils/hitbox.js';
import { INVULNERABILITY_MS } from '../../constants.js';
import { playEnemyDefeat, playHurt, playKeyCollect } from '../../audio.js';

export function defeatEnemy(enemyHit) {
  if (!enemyHit || enemyHit.getData('defeated')) {
    return;
  }
  enemyHit.setData('defeated', true);
  enemyHit.setVelocity(0, 0);
  // Disable physics/colliders. AI and player-hurt already skip `defeated`.
  if (enemyHit.body) {
    enemyHit.body.stop();
  }
  enemyHit.disableBody(true, false);
  enemyHit.anims.stop();
  enemyHit.setActive(false);
  enemyHit.setVisible(false);

  playEnemyDefeat();

  const scene = enemyHit.scene;
  if (!scene || !scene.anims || !scene.anims.exists('enemyDeath')) {
    return;
  }

  // Death sheets are 256 canvases with ~100px empty below the knight; Run is 128
  // with feet near the bottom. Matching canvas size / origin (0.5,1) still jumps
  // and shrinks the body. Align opaque CONTENT size + feet on a dedicated FX sprite.
  const frozenFlipX = !!enemyHit.flipX;
  const runTexW = enemyHit.width || 128;
  const runTexH = enemyHit.height || 128;
  const sx = enemyHit.scaleX || 1.5;
  const sy = enemyHit.scaleY || sx;
  const ox = enemyHit.originX;
  const oy = enemyHit.originY;

  // Opaque-content averages from Knight/Run (art faces right, body left of center).
  const RUN_CONTENT_H = 54;
  const RUN_FEET_FRAC_Y = 0.84;
  const RUN_CX_FRAC = 0.36;
  const runCxFrac = frozenFlipX ? 1 - RUN_CX_FRAC : RUN_CX_FRAC;
  const worldCx = enemyHit.x + (runCxFrac - ox) * runTexW * sx;
  const worldFeetY = enemyHit.y + (RUN_FEET_FRAC_Y - oy) * runTexH * sy;
  const targetContentH = RUN_CONTENT_H * sy;

  // Per-frame opaque metrics for Knight/Death/death1..10.png (256 canvases).
  const DEATH_CONTENT = [
    null,
    { ch: 58, feetFracY: 0.6074, cxFrac: 0.5059 },
    { ch: 65, feetFracY: 0.6074, cxFrac: 0.5 },
    { ch: 61, feetFracY: 0.6074, cxFrac: 0.5 },
    { ch: 69, feetFracY: 0.6113, cxFrac: 0.543 },
    { ch: 73, feetFracY: 0.6387, cxFrac: 0.5254 },
    { ch: 75, feetFracY: 0.6387, cxFrac: 0.5215 },
    { ch: 60, feetFracY: 0.6191, cxFrac: 0.498 },
    { ch: 62, feetFracY: 0.6387, cxFrac: 0.4844 },
    { ch: 74, feetFracY: 0.6621, cxFrac: 0.4941 },
    { ch: 81, feetFracY: 0.6738, cxFrac: 0.4434 },
  ];

  const death = scene.add.sprite(worldCx, worldFeetY, 'enemyDeath1');
  death.setDepth(typeof enemyHit.depth === 'number' ? enemyHit.depth : 0);

  const applyDeathFrame = (frameNum) => {
    const m = DEATH_CONTENT[frameNum] || DEATH_CONTENT[1];
    death.setOrigin(m.cxFrac, m.feetFracY);
    death.setScale(targetContentH / m.ch);
    death.setFlipX(frozenFlipX);
    death.setPosition(worldCx, worldFeetY);
  };

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    if (death && death.destroy) {
      death.destroy();
    }
    if (enemyHit) {
      enemyHit.setActive(false);
      enemyHit.setVisible(false);
      if (enemyHit.body) {
        enemyHit.body.enable = false;
      }
    }
  };

  const onUpdate = (_anim, frame) => {
    const key = (frame && (frame.textureKey || (frame.texture && frame.texture.key))) || '';
    const num = parseInt(String(key).replace(/\D/g, ''), 10) || 1;
    applyDeathFrame(num);
  };

  death.once('animationcomplete-enemyDeath', finish);
  death.on('animationupdate-enemyDeath', onUpdate);
  death.anims.play('enemyDeath', true);
  applyDeathFrame(1);
  if (scene.time) {
    scene.time.delayedCall(1200, finish);
  }
}

// Fireballs fly straight; no platform bounce/stop — cleaned up when off-screen
export function hitEnemyWithFire(projectile, enemyHit) {
  if (!enemyHit || !enemyHit.active || enemyHit.getData('defeated')) {
    return;
  }
  projectile.setActive(false);
  projectile.setVisible(false);
  if (projectile.body) {
    projectile.body.stop();
    projectile.body.enable = false;
  }
  defeatEnemy(enemyHit);
}

// Wave entered enemy hitbox: defeat foe, stop wave, play remaining Fire_Extra
export function hitEnemyWithSlamWave(wave, enemyHit) {
  if (!enemyHit || !enemyHit.active || enemyHit.getData('defeated')) {
    return;
  }
  if (wave.getData('impacting')) {
    return;
  }
  defeatEnemy(enemyHit);
  if (typeof wave.beginImpact === 'function') {
    wave.beginImpact();
  } else {
    wave.setActive(false);
    wave.setVisible(false);
    if (wave.body) {
      wave.body.stop();
      wave.body.enable = false;
    }
  }
}

// Melee sweep: defeats any active enemy inside a rectangle extending
// `reach` px in front of the player (per facing) and within `verticalTolerance`
// px of the player's height. Used by Rogue's melee attacks in place of a
// spawned projectile.
export function meleeHitEnemiesInFront(scene, reach, verticalTolerance) {
  const player = scene.player;
  const facingLeft = player.flipX;
  const minX = facingLeft ? player.x - reach : player.x;
  const maxX = facingLeft ? player.x : player.x + reach;
  scene.enemies.forEach((enemyHit) => {
    if (!enemyHit.active || enemyHit.getData('defeated')) return;
    if (enemyHit.x < minX || enemyHit.x > maxX) return;
    if (Math.abs(enemyHit.y - player.y) > verticalTolerance) return;
    defeatEnemy(enemyHit);
  });
}

export function slamWaveCanHit(wave, enemyHit) {
  return (
    !!wave &&
    wave.active &&
    !wave.getData('impacting') &&
    !!wave.body &&
    wave.body.enable &&
    !!enemyHit &&
    enemyHit.active &&
    !enemyHit.getData('defeated')
  );
}

export function createEnemyCanHurtPlayer(scene) {
  return (playerObj, enemyObj) => {
    if (!enemyObj || !enemyObj.active || !enemyObj.body || !enemyObj.body.enable || enemyObj.getData('defeated')) {
      return false;
    }
    // While swinging FIRE / SLAM, knights cannot interrupt the attack
    if (scene.playerState === 'attacking' || scene.playerState === 'attackExtra') {
      return false;
    }
    return true;
  };
}

// Player dies and respawns. Registered as a Phaser collider callback with the
// scene passed as its context, so `this` below refers to the scene.
export function playerDies(player, enemyHit) {
  if (!enemyHit || !enemyHit.active || enemyHit.getData('defeated')) {
    return;
  }
  // Brief invulnerability after a hit so colliders cannot chain-kill
  if (this.invulnerableUntil && this.time.now < this.invulnerableUntil) {
    return;
  }
  if (this.playerState === 'dying' || this.playerState === 'hurt') {
    return;
  }
  this.invulnerableUntil = this.time.now + INVULNERABILITY_MS;
  playHurt();

  player.setVelocity(0, 0);
  if (player.body) {
    player.body.enable = false;
  }

  if (gameState.lives > 1) {
    gameState.lives -= 1;
    this.lifeIndicator.setText(`Lives: ${gameState.lives}`);
    this.playerState = 'hurt';
    player.anims.play('hurt', true);
    player.once('animationcomplete-hurt', () => {
      player.enableBody(true, Math.floor(Math.random() * 1700), 800, true, true);
      player.setBounce(0.1);
      player.setCollideWorldBounds(true);
      player.setAlpha(0.5);
      applyFacingHitbox(player, false);
      this.playerState = 'idle';
      this.time.delayedCall(1500, () => {
        if (player && player.active) {
          player.setAlpha(1);
        }
      });
    });
  } else {
    gameState.lives -= 1;
    this.lifeIndicator.setText(`Lives: ${gameState.lives}`);
    this.playerState = 'dying';
    setMobileControlsVisible(false);
    player.anims.play('death', true);
    player.once('animationcomplete-death', () => {
      this.scene.start('GameOver');
    });
  }
}

export function collectKey(player, keySprite) {
  gameState.collectedKey = true;
  keySprite.destroy();
  playKeyCollect();
}

// Registered as a Phaser overlap callback with the scene as context.
export function enterDoor(player, doorSprite) {
  if (gameState.collectedKey !== true || this.isExitingLevel) {
    return;
  }
  this.isExitingLevel = true;
  // Create a fade-out effect
  this.cameras.main.fadeOut(500);
  // Wait for the fade-out to complete before advancing
  this.time.delayedCall(
    1000,
    function () {
      doorSprite.destroy();
      gameState.collectedKey = false;
      gameState.level += 1;
      if (gameState.level <= 5) {
        this.scene.start('NextLevel');
      } else {
        this.scene.start('GameWin');
      }
    },
    [],
    this
  );
}
