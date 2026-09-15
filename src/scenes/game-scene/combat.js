import { gameState } from '../../game-state.js';
import { setMobileControlsVisible } from '../../input.js';
import { applyFacingHitbox } from '../../utils/hitbox.js';
import { INVULNERABILITY_MS, ENEMY_HP, ENEMY_CONTACT_DAMAGE, ENEMY_HIT_FLASH_MS } from '../../constants.js';
import { playEnemyDefeat, playHurt, playKeyCollect } from '../../audio.js';

// Death frames render on a canvas twice the size of every other Knight
// animation (256px vs 128px), with the character's actual drawn content
// varying somewhat in size/position frame to frame as it topples. A single
// fixed scale + origin (averaged from the real frames, not measured per
// frame) keeps the pose stable for the whole animation — no per-frame
// lookup table to drift out of sync or make the sprite visibly resize/shift
// as it plays.
const DEATH_CONTENT_H = 68; // average opaque content height across death1..10
const DEATH_ORIGIN_X = 0.5;
const DEATH_ORIGIN_Y = 0.63;
const RUN_CONTENT_H = 54; // average opaque content height of the run pose

// Runs the enemy's actual death sequence (animation, sound, disable) once its
// HP has been brought to 0 — see damageEnemy() below for the HP bookkeeping
// that decides when to call this.
function killEnemy(enemyHit) {
  if (!enemyHit || enemyHit.getData('defeated')) {
    return;
  }
  enemyHit.setData('defeated', true);

  // Anchor to the enemy's collision box (stable regardless of which pose —
  // running, idle, jumping — was showing at the moment of death), not to
  // constants tuned for one specific animation frame.
  const scene = enemyHit.scene;
  const frozenFlipX = !!enemyHit.flipX;
  const frozenScale = enemyHit.scaleX || 1.5;
  const body = enemyHit.body;
  const feetX = body ? body.x + body.width / 2 : enemyHit.x;
  const feetY = body ? body.y + body.height : enemyHit.y;
  const depth = typeof enemyHit.depth === 'number' ? enemyHit.depth : 0;
  const scrollFactorX = enemyHit.scrollFactorX;
  const scrollFactorY = enemyHit.scrollFactorY;

  enemyHit.setVelocity(0, 0);
  if (body) {
    body.stop();
  }
  enemyHit.disableBody(true, false);
  enemyHit.anims.stop();
  enemyHit.setActive(false);
  enemyHit.setVisible(false);

  playEnemyDefeat();

  if (!scene || !scene.anims || !scene.anims.exists('enemyDeath')) {
    return;
  }

  const deathScale = (RUN_CONTENT_H * frozenScale) / DEATH_CONTENT_H;

  const death = scene.add.sprite(feetX, feetY, 'enemyDeath1');
  death.setOrigin(DEATH_ORIGIN_X, DEATH_ORIGIN_Y);
  death.setScale(deathScale);
  death.setFlipX(frozenFlipX);
  death.setDepth(depth);
  death.setScrollFactor(scrollFactorX, scrollFactorY);

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

  death.once('animationcomplete-enemyDeath', () => {
    scene.time.delayedCall(400, finish);
  });
  death.anims.play('enemyDeath', true);
  scene.time.delayedCall(2000, finish); // safety net if the anim never completes
}

// Applies `power` points of damage to an enemy, killing it once its HP is
// brought to 0. Enemy HP is stored on the sprite itself (set at spawn time in
// index.js) so multiple partial hits accumulate correctly across separate
// attacks. A hit that doesn't kill gets a brief red tint flash instead of a
// new animation — enemies have no dedicated "hurt" frames to play.
export function damageEnemy(enemyHit, power) {
  if (!enemyHit || !enemyHit.active || enemyHit.getData('defeated')) {
    return;
  }
  const hp = (enemyHit.getData('hp') ?? ENEMY_HP) - power;
  enemyHit.setData('hp', hp);
  if (hp <= 0) {
    killEnemy(enemyHit);
    return;
  }
  enemyHit.setTintFill(0xff4444);
  enemyHit.scene.time.delayedCall(ENEMY_HIT_FLASH_MS, () => {
    if (enemyHit.active) enemyHit.clearTint();
  });
}

// Registered via `physics.add.overlap(this.fireballs, enemy, ...)` — a Group
// vs. single-Sprite pair. Phaser's collideSpriteVsGroup always normalizes
// this to invoke the callback as (singleSprite, groupMember), i.e.
// (enemy, projectile) — NOT the (group, sprite) order the overlap() call
// was written in. Getting this backwards meant `defeatEnemy` ran on the
// fireball instead of the enemy (silently: the enemy still went inactive
// via the projectile.* calls below, just without ever being marked
// defeated, and the death animation spawned at the bolt's position instead
// of the enemy's).
// Fireballs fly straight; no platform bounce/stop — cleaned up when off-screen
export function hitEnemyWithFire(enemyHit, projectile) {
  if (!enemyHit || !enemyHit.active || enemyHit.getData('defeated')) {
    return;
  }
  projectile.setActive(false);
  projectile.setVisible(false);
  if (projectile.body) {
    projectile.body.stop();
    projectile.body.enable = false;
  }
  damageEnemy(enemyHit, projectile.power);
}

// Same Group-vs-Sprite parameter order caveat as hitEnemyWithFire above —
// Phaser invokes this as (enemy, wave), not (wave, enemy).
// Wave entered enemy hitbox: defeat foe, stop wave, play remaining Fire_Extra
export function hitEnemyWithSlamWave(enemyHit, wave) {
  if (!enemyHit || !enemyHit.active || enemyHit.getData('defeated')) {
    return;
  }
  if (wave.getData('impacting')) {
    return;
  }
  damageEnemy(enemyHit, wave.power);
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

// Melee sweep: damages any active enemy inside a rectangle extending
// `reach` px in front of the player (per facing) and within `verticalTolerance`
// px of the player's height. Used by Rogue/Knight's melee attacks in place of
// a spawned projectile. Can hit multiple enemies in one sweep.
export function meleeHitEnemiesInFront(scene, reach, verticalTolerance, power) {
  const player = scene.player;
  const facingLeft = player.flipX;
  const minX = facingLeft ? player.x - reach : player.x;
  const maxX = facingLeft ? player.x : player.x + reach;
  scene.enemies.forEach((enemyHit) => {
    if (!enemyHit.active || enemyHit.getData('defeated')) return;
    if (enemyHit.x < minX || enemyHit.x > maxX) return;
    if (Math.abs(enemyHit.y - player.y) > verticalTolerance) return;
    damageEnemy(enemyHit, power);
  });
}

// The overlap's process-callback gets the same (enemy, wave) parameter
// order as the collide-callback above (see hitEnemyWithFire's note).
export function slamWaveCanHit(enemyHit, wave) {
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

// Player takes contact damage, respawning if it survives or dying if it's
// out of both HP and lives. Registered as a Phaser collider callback with
// the scene passed as its context, so `this` below refers to the scene.
export function damagePlayer(player, enemyHit) {
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

  // HP absorbs hits within a life; a life is only spent once HP runs out,
  // at which point HP resets for the next life (unless that was the last one).
  gameState.hp -= ENEMY_CONTACT_DAMAGE;
  const losingLife = gameState.hp <= 0;
  const dying = losingLife && gameState.lives <= 1;

  if (losingLife) {
    gameState.lives -= 1;
    this.lifeIndicator.setText(`Lives: ${gameState.lives}`);
    if (!dying) {
      gameState.hp = this.character.maxHp;
    }
  }
  this.hpIndicator.setText(`HP: ${Math.max(gameState.hp, 0)}/${this.character.maxHp}`);

  if (!dying) {
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
