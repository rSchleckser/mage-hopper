export function createAnimations(scene) {
  const player = scene.player;

  const runFrames = [];
  for (let i = 1; i <= 8; i++) runFrames.push({ key: 'run' + i });

  const enemyRunFrames = [];
  for (let i = 1; i <= 8; i++) enemyRunFrames.push({ key: 'enemyRun' + i });

  const jumpFrames = [];
  for (let i = 1; i <= 3; i++) jumpFrames.push({ key: 'jump' + i });

  const peakFrame = [{ key: 'jump4' }];

  const fallFrames = [];
  for (let i = 5; i <= 7; i++) fallFrames.push({ key: 'jump' + i });

  const lastFallFrame = [{ key: 'jump6' }];
  const landing = [{ key: 'jump7' }];

  const attackFrames = [];
  for (let i = 1; i <= 7; i++) attackFrames.push({ key: 'attack' + i });

  const deathFrames = [];
  for (let i = 1; i <= 10; i++) deathFrames.push({ key: 'death' + i });

  const hurtFrames = [];
  for (let i = 1; i <= 4; i++) hurtFrames.push({ key: 'hurt' + i });

  const attackExtraFrames = [];
  for (let i = 0; i <= 6; i++) attackExtraFrames.push({ key: 'attackExtra' + i });

  const fireExtraFrames = [];
  for (let i = 1; i <= 9; i++) fireExtraFrames.push({ key: 'fireExtra' + i });

  const fireFrames = [];
  for (let i = 1; i <= 9; i++) fireFrames.push({ key: 'fire' + i });

  const enemyJumpFrames = [];
  for (let i = 1; i <= 7; i++) enemyJumpFrames.push({ key: 'enemyJump' + i });

  // Base animation
  scene.anims.create({ key: 'turn', frames: [{ key: 'player' }], frameRate: 10 });

  // Left/right running
  scene.anims.create({
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
  scene.anims.create({ key: 'right', frames: runFrames, frameRate: 10, repeat: -1 });

  // Jump / fall
  scene.anims.create({ key: 'jump', frames: jumpFrames, frameRate: 10, repeat: 0 });
  scene.anims.create({ key: 'peak', frames: peakFrame, frameRate: 1, repeat: 0 });
  scene.anims.create({ key: 'fall', frames: fallFrames, frameRate: 10, repeat: 0 });
  scene.anims.create({ key: 'lastFallFrame', frames: lastFallFrame, frameRate: 1, repeat: 0 });
  scene.anims.create({ key: 'landing', frames: landing, frameRate: 1, repeat: 0 });

  // Combat
  scene.anims.create({ key: 'attack', frames: attackFrames, frameRate: 10, repeat: 0 });
  scene.anims.create({ key: 'death', frames: deathFrames, frameRate: 10, repeat: 0 });
  scene.anims.create({ key: 'hurt', frames: hurtFrames, frameRate: 10, repeat: 0 });
  scene.anims.create({ key: 'attackExtra', frames: attackExtraFrames, frameRate: 10, repeat: 0 });

  // Fire_Extra wave VFX (spawned as a traveling sprite, not on the player).
  // Travel holds on fire_extra3; impact plays fire_extra4..9 on enemy hit.
  scene.anims.create({ key: 'fireExtraTravel', frames: fireExtraFrames.slice(0, 3), frameRate: 14, repeat: 0 });
  scene.anims.create({ key: 'fireExtraImpact', frames: fireExtraFrames.slice(3), frameRate: 12, repeat: 0 });

  // Fire bolt — full flame loop while the bolt travels
  scene.anims.create({ key: 'fire', frames: fireFrames, frameRate: 14, repeat: -1 });

  // Enemy animations
  scene.anims.create({ key: 'enemyTurn', frames: [{ key: 'enemy' }], frameRate: 10 });
  scene.anims.create({ key: 'enemyRunRight', frames: enemyRunFrames, frameRate: 10, repeat: -1 });
  // Facing is set per-enemy in enemyFollows (do not hardcode enemy flip here)
  scene.anims.create({ key: 'enemyRunLeft', frames: enemyRunFrames, frameRate: 10, repeat: -1 });
  scene.anims.create({ key: 'enemyJump', frames: [enemyJumpFrames[1]], frameRate: 10, repeat: -1 });
  scene.anims.create({ key: 'enemyFall', frames: [enemyJumpFrames[5]], frameRate: 4, repeat: -1 });
}
