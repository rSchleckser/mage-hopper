import { gameState } from '../../game-state.js';
import { applyFacingHitbox } from '../../utils/hitbox.js';
import {
  ENEMY_BASE_SPEED,
  ENEMY_JUMP_VELOCITY,
  ENEMY_JUMP_DELAY_MS,
  ENEMY_ATTACK_RANGE,
  ENEMY_ATTACK_COOLDOWN_MS,
  ENEMY_HP,
  MELEE_HEIGHT_TOLERANCE,
} from '../../constants.js';
import { damagePlayer } from './combat.js';

const HP_BAR_WIDTH = 40;
const HP_BAR_HEIGHT = 6;

// One-time setup at spawn: a small dark-background/green-fill Graphics bar,
// redrawn every frame by drawEnemyHealthBar (below) to track the enemy's
// position and current HP. Destroyed alongside the enemy in combat.js's
// killEnemy.
export function createEnemyHealthBar(scene, enemy) {
  enemy.hpBar = scene.add.graphics();
  drawEnemyHealthBar(enemy);
}

export function drawEnemyHealthBar(enemy) {
  const bar = enemy.hpBar;
  if (!bar) return;
  const hp = Math.max(enemy.getData('hp') ?? ENEMY_HP, 0);
  const x = enemy.x - HP_BAR_WIDTH / 2;
  const y = enemy.y - enemy.displayHeight / 2 - 16;
  bar.clear();
  bar.fillStyle(0x000000, 0.55);
  bar.fillRect(x - 1, y - 1, HP_BAR_WIDTH + 2, HP_BAR_HEIGHT + 2);
  bar.fillStyle(0x2ecc71, 1);
  bar.fillRect(x, y, HP_BAR_WIDTH * (hp / ENEMY_HP), HP_BAR_HEIGHT);
}

// Enemy attack swing — mirrors the frame-fraction release timing the player's
// own attacks use in player-controller.js. Damage only lands from this
// release, not from mere contact (see index.js's plain player/enemy collider).
function beginEnemyAttack(enemy, scene) {
  enemy.setData('aiState', 'attacking');
  enemy.setVelocityX(0);
  enemy.anims.play('enemyAttack', true);

  let released = false;
  const releaseAt = 2; // middle-ish of the 5-frame swing (indices 0-4)

  const doRelease = () => {
    released = true;
    const dx = Math.abs(scene.player.x - enemy.x);
    const dy = Math.abs(scene.player.y - enemy.y);
    if (dx <= ENEMY_ATTACK_RANGE && dy <= MELEE_HEIGHT_TOLERANCE) {
      damagePlayer.call(scene, scene.player, enemy);
    }
  };

  const onUpdate = (anim, frame) => {
    if (!anim || anim.key !== 'enemyAttack' || released) return;
    if (frame.index < releaseAt) return;
    doRelease();
  };

  enemy.on('animationupdate-enemyAttack', onUpdate);
  enemy.once('animationcomplete-enemyAttack', () => {
    enemy.off('animationupdate-enemyAttack', onUpdate);
    if (!released) {
      doRelease();
    }
    if (enemy.active) {
      enemy.setData('aiState', 'chase');
      enemy.setData('nextAttackAt', scene.time.now + ENEMY_ATTACK_COOLDOWN_MS);
    }
  });
}

export function enemyFollows(enemy, scene) {
  // Skip defeated / inactive knights — otherwise setVelocity re-enables them
  if (!enemy || !enemy.active || enemy.getData('defeated') || !enemy.body || !enemy.body.enable) {
    return;
  }
  drawEnemyHealthBar(enemy);

  // Let an in-progress hurt reaction or attack swing play out undisturbed —
  // otherwise the chase movement below would overwrite the animation on the
  // very next frame.
  const aiState = enemy.getData('aiState') || 'chase';
  if (aiState === 'hurt' || aiState === 'attacking') {
    return;
  }

  const player = scene.player;

  // Enemy has a delay jumping after the player jumps
  if (player.body.y < enemy.body.y && enemy.body.touching.down) {
    scene.time.delayedCall(
      ENEMY_JUMP_DELAY_MS,
      function () {
        if (!enemy.active || enemy.getData('defeated') || !enemy.body || !enemy.body.enable) {
          return;
        }
        enemy.setVelocityY(ENEMY_JUMP_VELOCITY);
      },
      [],
      scene
    );
  }

  // Enemy jump/fall animation
  if (!enemy.body.touching.down && !(enemy.body.velocity.y > 0)) {
    enemy.anims.play('enemyJump', true);
  }
  if (!enemy.body.touching.down && enemy.body.velocity.y > 0) {
    enemy.anims.play('enemyFall', true);
  }

  // Close enough (and off cooldown) to swing instead of continuing to chase.
  const nextAttackAt = enemy.getData('nextAttackAt') || 0;
  const inAttackRange =
    Math.abs(player.body.x - enemy.body.x) <= ENEMY_ATTACK_RANGE &&
    Math.abs(player.body.y - enemy.body.y) <= MELEE_HEIGHT_TOLERANCE;
  if (inAttackRange && enemy.body.touching.down && scene.time.now >= nextAttackAt) {
    enemy.setFlipX(player.body.x < enemy.body.x);
    applyFacingHitbox(enemy, player.body.x < enemy.body.x);
    beginEnemyAttack(enemy, scene);
    return;
  }

  // Knights disguise themselves with the mage's own run animation from level 3 on.
  const runLeftAnim = gameState.level < 3 ? 'enemyRunLeft' : 'left';
  const runRightAnim = gameState.level < 3 ? 'enemyRunRight' : 'right';
  const speed = ENEMY_BASE_SPEED * (1 + gameState.level / 8.3);

  if (player.body.x < enemy.body.x && player.body.x + enemy.body.x > 50 && enemy.body.touching.down) {
    enemy.setVelocityX(-speed);
    enemy.anims.play(runLeftAnim, true);
    enemy.setFlipX(true);
    applyFacingHitbox(enemy, true);
  } else if (player.body.x > enemy.body.x && enemy.body.x - player.body.x < -50 && enemy.body.touching.down) {
    enemy.setVelocityX(speed);
    enemy.anims.play(runRightAnim, true);
    enemy.setFlipX(false);
    applyFacingHitbox(enemy, false);
  }
}
