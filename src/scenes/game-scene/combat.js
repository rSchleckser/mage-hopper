import { gameState } from '../../game-state.js';
import { setMobileControlsVisible } from '../../input.js';
import { applyFacingHitbox } from '../../utils/hitbox.js';
import { INVULNERABILITY_MS, ENEMY_HP, ENEMY_CONTACT_DAMAGE } from '../../constants.js';
import { playEnemyDefeat, playHurt, playKeyCollect } from '../../audio.js';
import { drawHealthBar, updateLivesBadge } from './hud.js';

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
  if (enemyHit.hpBar) {
    enemyHit.hpBar.destroy();
    enemyHit.hpBar = null;
  }

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
// attacks. A hit that doesn't kill plays the enemy's `enemyHurt` animation in
// place; `enemyFollows` (enemy-ai.js) checks the `aiState` flag set here and
// skips normal movement/AI until the reaction finishes, so the run anim
// doesn't instantly overwrite it on the next frame.
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
  enemyHit.setData('aiState', 'hurt');
  enemyHit.setVelocity(0, 0);
  enemyHit.anims.play('enemyHurt', true);
  enemyHit.once('animationcomplete-enemyHurt', () => {
    if (enemyHit.active) enemyHit.setData('aiState', 'chase');
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

// Player takes damage from a landed enemy attack (see enemy-ai.js's
// beginEnemyAttack), respawning in place if it survives or dying if it's out
// of both HP and lives. Called directly with the scene as `this` context
// (not a Phaser collider callback — contact alone no longer deals damage).
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
    updateLivesBadge(this);
    if (!dying) {
      gameState.hp = this.character.maxHp;
    }
  }
  drawHealthBar(this);

  if (!dying) {
    this.playerState = 'hurt';
    player.anims.play('hurt', true);

    if (losingLife) {
      // Lost a life (but have more left): restore the original respawn —
      // a random position across the level, fading back in from half
      // transparent — as the clear "you lost a life" beat. A hit that
      // merely chips HP (no life lost) stays in place instead, below.
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
      player.once('animationcomplete-hurt', () => {
        // Re-enable in place — no teleport. The hurt animation itself is the
        // damage indicator (paired with the HP HUD ticking down), not a
        // random respawn across the level.
        player.enableBody(true, player.x, player.y, true, true);
        player.setBounce(0.1);
        player.setCollideWorldBounds(true);
        applyFacingHitbox(player, player.flipX);
        this.playerState = 'idle';
      });
      // Brief flicker for the remaining invulnerability window — a lighter,
      // untethered replacement for the old teleport-then-fade cue. The final
      // reset fires one full flicker interval after the last possible toggle
      // so it always wins the tie instead of racing it.
      const FLICKER_INTERVAL_MS = 120;
      const flickerEvent = this.time.addEvent({
        delay: FLICKER_INTERVAL_MS,
        repeat: Math.max(Math.floor(INVULNERABILITY_MS / FLICKER_INTERVAL_MS) - 1, 0),
        callback: () => {
          if (player && player.active) {
            player.setAlpha(player.alpha === 1 ? 0.4 : 1);
          }
        },
      });
      this.time.delayedCall(INVULNERABILITY_MS + FLICKER_INTERVAL_MS, () => {
        flickerEvent.remove();
        if (player && player.active) {
          player.setAlpha(1);
        }
      });
    }
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
