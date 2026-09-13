import { applyFacingHitbox } from '../../utils/hitbox.js';
import { PLAYER_JUMP_VELOCITY, MELEE_REACH, MELEE_EXTRA_REACH, MELEE_HEIGHT_TOLERANCE } from '../../constants.js';
import { touchInput } from '../../input.js';
import { playJump, playFire, playSlam } from '../../audio.js';
import { meleeHitEnemiesInFront } from './combat.js';

// The bolt/wave release point is timed as a fraction of the swing animation's
// total frame count, so it scales correctly whether a character's attack
// animation has 7 frames (Mage) or 11 (Rogue's Attack_Extra).
function releaseFrameIndex(frameCount, fraction) {
  return Math.round((frameCount - 1) * fraction);
}

function readInput(scene) {
  return {
    left: scene.cursors.left.isDown || scene.aKey.isDown || touchInput.left,
    right: scene.cursors.right.isDown || scene.dKey.isDown || touchInput.right,
    up: scene.cursors.up.isDown || scene.wKey.isDown || touchInput.up,
    attack: scene.fKey.isDown || touchInput.attack,
    extra: scene.eKey.isDown || touchInput.extra,
  };
}

function handleIdleState(scene, input) {
  const { player } = scene;
  player.setVelocityX(0);
  player.anims.play('turn', true);

  if (input.left || input.right) {
    scene.playerState = 'running';
  }
  if (input.up && player.body.touching.down) {
    scene.playerState = 'jumping';
  }
  if (input.attack) {
    scene.playerState = 'attacking';
  }
  if (input.extra) {
    scene.playerState = 'attackExtra';
  }
}

function handleRunningState(scene, input) {
  const { player, character } = scene;
  const moveSpeed = character.moveSpeed;
  if (input.left) {
    player.setVelocityX(-moveSpeed);
    if (player.body.touching.down) {
      player.anims.play('left', true);
    }
    player.setFlipX(true);
    applyFacingHitbox(player, true);
  } else if (input.right) {
    player.setVelocityX(moveSpeed);
    if (player.body.touching.down) {
      player.anims.play('right', true);
    }
    player.setFlipX(false);
    applyFacingHitbox(player, false);
  }

  if (!input.left && !input.right) {
    scene.playerState = 'idle';
  }
  if (input.up && player.body.touching.down) {
    scene.playerState = 'jumping';
  }
  if (input.attack) {
    scene.playerState = 'attacking';
  }
  if (input.extra) {
    scene.playerState = 'attackExtra';
  }
}

function handleJumpingState(scene, input) {
  const { player, character } = scene;
  if (input.up && player.body.touching.down) {
    player.setVelocityY(PLAYER_JUMP_VELOCITY);
    player.anims.play('jump', true);
    playJump();
  }

  if (input.left) {
    player.setVelocityX(-character.moveSpeed);
    player.setFlipX(true);
    applyFacingHitbox(player, true);
  } else if (input.right) {
    player.setVelocityX(character.moveSpeed);
    player.setFlipX(false);
    applyFacingHitbox(player, false);
  }

  // Rising vs. falling condition at the peak of the jump
  if (!player.body.touching.down && player.body.velocity.y === 0) {
    player.anims.play('peak', true);
  }
}

function handleFallingState(scene, input) {
  const { player } = scene;
  if (!player.body.touching.down && player.body.velocity.y > 0) {
    player.anims.play('fall', true);
    if (!player.body.touching.down) {
      player.anims.play('lastFallFrame', true);
    }
  }

  if (player.body.touching.down && (input.left || input.right)) {
    scene.playerState = 'running';
  } else if (player.body.touching.down) {
    scene.playerState = 'idle';
  }
}

function handleAttackingState(scene) {
  const { player, character } = scene;
  const isMelee = character.combat === 'melee';
  const frameCount = character.anims.attack.count;
  const releaseAt = releaseFrameIndex(frameCount, 0.5);

  // Play attack first; release the hit near the middle of the swing
  if (!player.anims.isPlaying || player.anims.currentAnim.key !== 'attack') {
    player.anims.play('attack', true);
    player.setVelocityX(0);
    let released = false;

    const doRelease = () => {
      released = true;
      if (isMelee) {
        meleeHitEnemiesInFront(scene, MELEE_REACH, MELEE_HEIGHT_TOLERANCE);
        playFire();
        return;
      }
      const facingLeft = player.flipX;
      // Closer to the glowing staff tip
      const spawnX = player.x + (facingLeft ? -58 : 58);
      const spawnY = player.y - 22;
      const bolt = scene.fireballs.getFirstDead(false);
      if (bolt) {
        bolt.fire(spawnX, spawnY, facingLeft ? -1 : 1);
        playFire();
      }
    };

    const onAttackUpdate = (anim, frame) => {
      if (!anim || anim.key !== 'attack' || released) return;
      if (frame.index < releaseAt) return;
      doRelease();
    };

    player.on('animationupdate-attack', onAttackUpdate);
    player.once('animationcomplete-attack', () => {
      player.off('animationupdate-attack', onAttackUpdate);
      // Fallback if update events were sparse
      if (!released) {
        doRelease();
      }
      scene.playerState = 'idle';
    });
  }
}

function handleAttackExtraState(scene) {
  const { player, character } = scene;
  const isMelee = character.combat === 'melee';
  const frameCount = character.anims.attackExtra.count;
  // Release later in the swing than the light attack, so the wind-up reads
  // (matches the original ~5-of-7 timing for Mage's 7-frame swing).
  const releaseAt = releaseFrameIndex(frameCount, 0.83);

  // Extra Attack: play the bigger swing, then release its effect
  if (!player.anims.isPlaying || player.anims.currentAnim.key !== 'attackExtra') {
    player.anims.play('attackExtra', true);
    player.setVelocityX(0);
    let released = false;

    const doRelease = () => {
      released = true;
      const facingLeft = player.flipX;
      if (isMelee) {
        meleeHitEnemiesInFront(scene, MELEE_EXTRA_REACH, MELEE_HEIGHT_TOLERANCE);
        playSlam();
        return;
      }
      const dir = facingLeft ? -1 : 1;
      const spawnX = player.x + (facingLeft ? -62 : 62);
      const spawnY = player.y - 18;
      const wave = scene.slamWaves.getFirstDead(false);
      if (wave) {
        wave.launch(spawnX, spawnY, dir);
        playSlam();
      }
    };

    const onAttackExtraUpdate = (anim, frame) => {
      if (!anim || anim.key !== 'attackExtra' || released) return;
      if (frame.index < releaseAt) return;
      doRelease();
    };

    player.on('animationupdate-attackExtra', onAttackExtraUpdate);
    player.once('animationcomplete-attackExtra', () => {
      player.off('animationupdate-attackExtra', onAttackExtraUpdate);
      if (!released) {
        doRelease();
      }
      scene.playerState = 'idle';
    });
  }
}

function handleStateTransitions(scene) {
  const { player } = scene;
  // Transition from jumping to falling
  if (scene.playerState === 'jumping' && player.body.velocity.y > 0) {
    scene.playerState = 'falling';
  }
  // Transition from falling to idle (when landing)
  if (scene.playerState === 'falling' && player.body.touching.down) {
    scene.playerState = 'idle';
  }
}

export function updatePlayer(scene) {
  const input = readInput(scene);

  switch (scene.playerState) {
    case 'idle':
      handleIdleState(scene, input);
      break;
    case 'running':
      handleRunningState(scene, input);
      break;
    case 'jumping':
      handleJumpingState(scene, input);
      break;
    case 'falling':
      handleFallingState(scene, input);
      break;
    case 'attacking':
      handleAttackingState(scene);
      break;
    case 'attackExtra':
      handleAttackExtraState(scene);
      break;
  }

  handleStateTransitions(scene);
}
