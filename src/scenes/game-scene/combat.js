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
  // Disable physics/colliders but keep the sprite visible for the death anim.
  // (hideGameObject=false). AI and player-hurt process already skip `defeated`.
  if (enemyHit.body) {
    enemyHit.body.stop();
  }
  enemyHit.disableBody(true, false);
  enemyHit.setActive(true);
  enemyHit.setVisible(true);

  playEnemyDefeat();

  // Freeze pose before swapping to Death frames (256px vs Run 128px) so the
  // sprite doesn't flip, pop larger, or jump its feet.
  const frozenFlipX = !!enemyHit.flipX;
  const targetDisplayH = enemyHit.displayHeight;
  const feetY = enemyHit.y + enemyHit.displayHeight * (1 - enemyHit.originY);
  const centerX = enemyHit.x + enemyHit.displayWidth * (0.5 - enemyHit.originX);

  let finished = false;
  const finish = () => {
    if (finished || !enemyHit) return;
    finished = true;
    if (enemyHit.off) {
      enemyHit.off('animationupdate-enemyDeath', stabilizeDeathPose);
    }
    enemyHit.setActive(false);
    enemyHit.setVisible(false);
    if (enemyHit.body) {
      enemyHit.body.enable = false;
    }
  };

  const stabilizeDeathPose = () => {
    if (!enemyHit || !enemyHit.active) return;
    enemyHit.setFlipX(frozenFlipX);
    enemyHit.setOrigin(0.5, 1);
    const nativeH =
      (enemyHit.frame && (enemyHit.frame.realHeight || enemyHit.frame.height)) || enemyHit.height || 256;
    if (nativeH > 0 && targetDisplayH > 0) {
      enemyHit.setScale(targetDisplayH / nativeH);
    }
    enemyHit.setPosition(centerX, feetY);
  };

  const scene = enemyHit.scene;
  if (scene && scene.anims && scene.anims.exists('enemyDeath')) {
    enemyHit.anims.stop();
    enemyHit.once('animationcomplete-enemyDeath', finish);
    enemyHit.on('animationupdate-enemyDeath', stabilizeDeathPose);
    enemyHit.anims.play('enemyDeath', true);
    stabilizeDeathPose();
    // Safety if animationcomplete is missed (interrupted scene, missing frames).
    if (scene.time) {
      scene.time.delayedCall(1200, finish);
    }
  } else {
    finish();
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
