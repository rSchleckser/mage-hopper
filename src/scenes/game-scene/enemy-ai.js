import { gameState } from '../../game-state.js';
import { applyFacingHitbox } from '../../utils/hitbox.js';
import { ENEMY_BASE_SPEED, ENEMY_JUMP_VELOCITY, ENEMY_JUMP_DELAY_MS } from '../../constants.js';

export function enemyFollows(enemy, scene) {
  // Skip defeated / inactive knights — otherwise setVelocity re-enables them
  if (!enemy || !enemy.active || enemy.getData('defeated') || !enemy.body || !enemy.body.enable) {
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
