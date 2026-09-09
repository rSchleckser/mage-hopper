import { applyFacingHitbox } from '../../utils/hitbox.js';
import { PLAYER_MOVE_SPEED, PLAYER_JUMP_VELOCITY } from '../../constants.js';
import { touchInput } from '../../input.js';

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
  const { player } = scene;
  if (input.left) {
    player.setVelocityX(-PLAYER_MOVE_SPEED);
    if (player.body.touching.down) {
      player.anims.play('left', true);
    }
    player.setFlipX(true);
    applyFacingHitbox(player, true);
  } else if (input.right) {
    player.setVelocityX(PLAYER_MOVE_SPEED);
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
  const { player } = scene;
  if (input.up && player.body.touching.down) {
    player.setVelocityY(PLAYER_JUMP_VELOCITY);
    player.anims.play('jump', true);
  }

  if (input.left) {
    player.setVelocityX(-PLAYER_MOVE_SPEED);
    player.setFlipX(true);
    applyFacingHitbox(player, true);
  } else if (input.right) {
    player.setVelocityX(PLAYER_MOVE_SPEED);
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
  const { player } = scene;
  // Play attack first; release the bolt near the end of the staff extension
  if (!player.anims.isPlaying || player.anims.currentAnim.key !== 'attack') {
    player.anims.play('attack', true);
    player.setVelocityX(0);
    let boltReleased = false;

    const releaseBoltFromStaff = (anim, frame) => {
      if (!anim || anim.key !== 'attack' || boltReleased) return;
      // attack has 7 frames (0..6); release a bit earlier as the staff extends (~frame 3)
      if (frame.index < 3) return;
      boltReleased = true;
      const facingLeft = player.flipX;
      // Closer to the glowing staff tip
      const spawnX = player.x + (facingLeft ? -58 : 58);
      const spawnY = player.y - 22;
      const bolt = scene.fireballs.getFirstDead(false);
      if (bolt) {
        bolt.fire(spawnX, spawnY, facingLeft ? -1 : 1);
      }
    };

    player.on('animationupdate-attack', releaseBoltFromStaff);
    player.once('animationcomplete-attack', () => {
      player.off('animationupdate-attack', releaseBoltFromStaff);
      // Fallback if update events were sparse
      if (!boltReleased) {
        releaseBoltFromStaff(player.anims.currentAnim, { index: 6 });
      }
      scene.playerState = 'idle';
    });
  }
}

function handleAttackExtraState(scene) {
  const { player } = scene;
  // Extra Attack: play staff swing on the mage, then launch Fire_Extra as a traveling wave
  if (!player.anims.isPlaying || player.anims.currentAnim.key !== 'attackExtra') {
    player.anims.play('attackExtra', true);
    player.setVelocityX(0);
    let waveReleased = false;

    const releaseWaveFromStaff = (anim, frame) => {
      if (!anim || anim.key !== 'attackExtra' || waveReleased) return;
      // 7 frames (0..6); release near the end of the swing so anim plays first
      if (frame.index < 5) return;
      waveReleased = true;
      const facingLeft = player.flipX;
      const dir = facingLeft ? -1 : 1;
      const spawnX = player.x + (facingLeft ? -62 : 62);
      const spawnY = player.y - 18;
      const wave = scene.slamWaves.getFirstDead(false);
      if (wave) {
        wave.launch(spawnX, spawnY, dir);
      }
    };

    player.on('animationupdate-attackExtra', releaseWaveFromStaff);
    player.once('animationcomplete-attackExtra', () => {
      player.off('animationupdate-attackExtra', releaseWaveFromStaff);
      if (!waveReleased) {
        const facingLeft = player.flipX;
        const dir = facingLeft ? -1 : 1;
        const wave = scene.slamWaves.getFirstDead(false);
        if (wave) {
          wave.launch(player.x + (facingLeft ? -62 : 62), player.y - 18, dir);
        }
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
