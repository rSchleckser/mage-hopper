// Phaser's AnimationManager (scene.anims) is global and persists across
// scene restarts, so creating an animation under a key that already exists
// from a previous character selection is a silent no-op. Every
// character-dependent anim must be explicitly removed before recreating.
function defineAnim(scene, config) {
  if (scene.anims.exists(config.key)) {
    scene.anims.remove(config.key);
  }
  scene.anims.create(config);
}

function framesFor(prefix, count) {
  const frames = [];
  for (let i = 1; i <= count; i++) frames.push({ key: prefix + i });
  return frames;
}

export function createAnimations(scene, character) {
  const player = scene.player;

  const runFrames = framesFor('run', character.anims.run.count);
  const jumpAllFrames = framesFor('jump', character.anims.jump.count);
  const attackFrames = framesFor('attack', character.anims.attack.count);
  const deathFrames = framesFor('death', character.anims.death.count);
  const hurtFrames = framesFor('hurt', character.anims.hurt.count);
  const attackExtraFrames = framesFor('attackExtra', character.anims.attackExtra.count);

  const enemyRunFrames = [];
  for (let i = 1; i <= 8; i++) enemyRunFrames.push({ key: 'enemyRun' + i });

  const fireExtraFrames = [];
  for (let i = 1; i <= 9; i++) fireExtraFrames.push({ key: 'fireExtra' + i });

  const fireFrames = [];
  for (let i = 1; i <= 9; i++) fireFrames.push({ key: 'fire' + i });

  const enemyJumpFrames = [];
  for (let i = 1; i <= 7; i++) enemyJumpFrames.push({ key: 'enemyJump' + i });

  // Jump/fall are carved from the character's jump spritesheet (7 frames:
  // rise, apex, fall, land) — same layout convention for every character.
  const jumpFrames = jumpAllFrames.slice(0, 3);
  const peakFrame = [jumpAllFrames[3]];
  const fallFrames = jumpAllFrames.slice(4, 7);
  const lastFallFrame = [jumpAllFrames[5]];
  const landing = [jumpAllFrames[6]];

  // Base animation
  defineAnim(scene, { key: 'turn', frames: [{ key: 'player' }], frameRate: 10 });

  // Left/right running
  defineAnim(scene, {
    key: 'left',
    frames: runFrames,
    frameRate: 10,
    repeat: -1,
    onStart: function () {
      player.setFlipX(true);
    },
    onComplete: function () {
      player.setFlipX(false);
    },
  });
  defineAnim(scene, { key: 'right', frames: runFrames, frameRate: 10, repeat: -1 });

  // Jump / fall
  defineAnim(scene, { key: 'jump', frames: jumpFrames, frameRate: 10, repeat: 0 });
  defineAnim(scene, { key: 'peak', frames: peakFrame, frameRate: 1, repeat: 0 });
  defineAnim(scene, { key: 'fall', frames: fallFrames, frameRate: 10, repeat: 0 });
  defineAnim(scene, { key: 'lastFallFrame', frames: lastFallFrame, frameRate: 1, repeat: 0 });
  defineAnim(scene, { key: 'landing', frames: landing, frameRate: 1, repeat: 0 });

  // Combat
  defineAnim(scene, { key: 'attack', frames: attackFrames, frameRate: 10, repeat: 0 });
  defineAnim(scene, { key: 'death', frames: deathFrames, frameRate: 10, repeat: 0 });
  defineAnim(scene, { key: 'hurt', frames: hurtFrames, frameRate: 10, repeat: 0 });
  defineAnim(scene, { key: 'attackExtra', frames: attackExtraFrames, frameRate: 10, repeat: 0 });

  // Fire_Extra wave VFX (spawned as a traveling sprite, not on the player).
  // Travel holds on fire_extra3; impact plays fire_extra4..9 on enemy hit.
  defineAnim(scene, { key: 'fireExtraTravel', frames: fireExtraFrames.slice(0, 3), frameRate: 14, repeat: 0 });
  defineAnim(scene, { key: 'fireExtraImpact', frames: fireExtraFrames.slice(3), frameRate: 12, repeat: 0 });

  // Fire bolt — full flame loop while the bolt travels
  defineAnim(scene, { key: 'fire', frames: fireFrames, frameRate: 14, repeat: -1 });

  // Enemy animations
  defineAnim(scene, { key: 'enemyTurn', frames: [{ key: 'enemy' }], frameRate: 10 });
  defineAnim(scene, { key: 'enemyRunRight', frames: enemyRunFrames, frameRate: 10, repeat: -1 });
  // Facing is set per-enemy in enemyFollows (do not hardcode enemy flip here)
  defineAnim(scene, { key: 'enemyRunLeft', frames: enemyRunFrames, frameRate: 10, repeat: -1 });
  defineAnim(scene, { key: 'enemyJump', frames: [enemyJumpFrames[1]], frameRate: 10, repeat: -1 });
  defineAnim(scene, { key: 'enemyFall', frames: [enemyJumpFrames[5]], frameRate: 4, repeat: -1 });
}
