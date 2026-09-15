const PLATFORM_TEXTURE_SIZE = { width: 1000, height: 40 };
const PLATFORM_SCALE = 0.25;

// Every level defines its own platform layout and enemy placement (in
// addition to key/door, which already varied per level) — replacing the old
// fixed-loop platform rows and the single flat enemy-spawn list that were
// identical across all 5 levels. `movingPlatforms` is optional; entries use
// { x, y, axis: 'x'|'y', mode: 'oscillate'|'loop', speed, range } for
// oscillate (back-and-forth within `range` px of the starting point) or
// { x, y, axis, mode: 'loop', speed, from, to } for loop (travels one
// direction, then resets to `from` once past `to` — the conveyor effect).
export const LEVELS = [
  {
    // Level 1 — Intro: low platform count, gentle gaps, one enemy.
    key: { x: 750, y: 484 },
    door: { x: 1500, y: 613 },
    platforms: [
      { x: 300, y: 720 },
      { x: 600, y: 720 },
      { x: 900, y: 720 },
      { x: 1200, y: 720 },
      { x: 1500, y: 720 },
      { x: 750, y: 540 },
    ],
    enemies: [{ x: 1400, y: 590 }],
  },
  {
    // Level 2 — Horizontal spread: wide zig-zag, one gap near the safe cap.
    key: { x: 150, y: 594 },
    door: { x: 1620, y: 543 },
    platforms: [
      { x: 150, y: 650 },
      { x: 480, y: 650 },
      { x: 960, y: 650 },
      { x: 1290, y: 650 },
      { x: 1620, y: 650 },
      { x: 700, y: 470 },
      { x: 1450, y: 470 },
    ],
    enemies: [
      { x: 960, y: 500 },
      { x: 1450, y: 320 },
    ],
  },
  {
    // Level 3 — Vertical climb: stacked rows, timing over distance, plus one
    // oscillating "elevator" platform bridging part of the climb.
    key: { x: 850, y: 64 },
    door: { x: 1050, y: 143 },
    platforms: [
      { x: 850, y: 760 },
      { x: 1050, y: 590 },
      { x: 800, y: 420 },
      { x: 1050, y: 250 },
      { x: 850, y: 120 },
    ],
    movingPlatforms: [{ x: 500, y: 550, axis: 'y', mode: 'oscillate', speed: 60, range: 130 }],
    enemies: [
      { x: 1050, y: 500 },
      { x: 1050, y: 160 },
      { x: 850, y: 30 },
    ],
  },
  {
    // Level 4 — Mixed: a wide horizontal gap (crossed via a conveyor lane)
    // combined with a vertical rise, first level that isn't one-axis-only.
    key: { x: 200, y: 644 },
    door: { x: 1500, y: 443 },
    platforms: [
      { x: 200, y: 700 },
      { x: 650, y: 700 },
      { x: 1100, y: 550 },
      { x: 1100, y: 350 },
      { x: 700, y: 350 },
      { x: 1500, y: 550 },
    ],
    movingPlatforms: [
      { x: 775, y: 700, axis: 'x', mode: 'loop', speed: 90, from: 650, to: 1100 },
      { x: 975, y: 700, axis: 'x', mode: 'loop', speed: 90, from: 650, to: 1100 },
    ],
    enemies: [
      { x: 1100, y: 470 },
      { x: 700, y: 270 },
      { x: 1500, y: 470 },
    ],
  },
  {
    // Level 5 — Finale: the tallest and widest layout, most enemies, key and
    // door at opposite extremes, plus a fast horizontal shuttle.
    key: { x: 150, y: 704 },
    door: { x: 950, y: 25 },
    platforms: [
      { x: 150, y: 760 },
      { x: 550, y: 760 },
      { x: 950, y: 760 },
      { x: 350, y: 580 },
      { x: 750, y: 580 },
      { x: 1150, y: 580 },
      { x: 1550, y: 580 },
      { x: 550, y: 400 },
      { x: 950, y: 400 },
      { x: 1350, y: 400 },
      { x: 750, y: 220 },
      { x: 1150, y: 220 },
      { x: 950, y: 120 },
    ],
    movingPlatforms: [{ x: 1750, y: 580, axis: 'x', mode: 'oscillate', speed: 110, range: 200 }],
    enemies: [
      { x: 950, y: 690 },
      { x: 1150, y: 510 },
      { x: 1350, y: 330 },
      { x: 950, y: 30 },
    ],
  },
];

export function getLevelConfig(levelNumber) {
  return LEVELS[levelNumber - 1];
}

function createPlatformAt(platforms, x, y) {
  return platforms
    .create(x, y, 'platform')
    .setScale(PLATFORM_SCALE)
    .refreshBody()
    .setSize(PLATFORM_TEXTURE_SIZE.width * PLATFORM_SCALE, PLATFORM_TEXTURE_SIZE.height * PLATFORM_SCALE);
}

export function buildPlatforms(scene, levelConfig) {
  const platforms = scene.physics.add.staticGroup();

  // Ground
  const ground = platforms.create(950, 990).refreshBody();
  ground.body.setSize(1900, 240);

  levelConfig.platforms.forEach(({ x, y }) => createPlatformAt(platforms, x, y));

  return platforms;
}

// Moving platforms are dynamic bodies (static bodies can't move) that don't
// fall (gravity off) and don't get pushed by whatever collides with them
// (setImmovable) — everything else about their sizing/texture matches the
// static platforms they share art with.
export function createMovingPlatforms(scene, levelConfig) {
  const group = scene.physics.add.group();
  (levelConfig.movingPlatforms || []).forEach((cfg) => {
    const platform = group.create(cfg.x, cfg.y, 'platform').setScale(PLATFORM_SCALE).setImmovable(true);
    // Body.setSize() takes UNSCALED source dimensions and multiplies by the
    // game object's current scale internally (body.width = sourceWidth *
    // scaleX) — passing the already-scaled size here double-applies the
    // scale factor (250x10 became 62.5x2.5), shrinking the collision box
    // well below the visible platform. Pass the raw texture size instead.
    platform.body.setSize(PLATFORM_TEXTURE_SIZE.width, PLATFORM_TEXTURE_SIZE.height);
    platform.body.allowGravity = false;
    platform.setData('cfg', cfg);
    platform.setData('dir', 1);
    if (cfg.axis === 'x') platform.setVelocityX(cfg.speed);
    else platform.setVelocityY(cfg.speed);
  });
  return group;
}

// Drives oscillate (reverse at each endpoint) and loop (reset to the start
// once past the end, for the "exits one side, re-enters the other" effect)
// motion every frame. Riders are carried separately — see index.js's
// collider between the player/enemies and this group.
export function updateMovingPlatforms(group) {
  if (!group) return;
  group.getChildren().forEach((platform) => {
    const cfg = platform.getData('cfg');
    const pos = cfg.axis === 'x' ? platform.x : platform.y;

    if (cfg.mode === 'oscillate') {
      let dir = platform.getData('dir');
      if (pos >= cfg[cfg.axis] + cfg.range) dir = -1;
      else if (pos <= cfg[cfg.axis] - cfg.range) dir = 1;
      platform.setData('dir', dir);
      const velocity = dir * cfg.speed;
      if (cfg.axis === 'x') platform.setVelocityX(velocity);
      else platform.setVelocityY(velocity);
    } else if (cfg.mode === 'loop') {
      if (pos > cfg.to) {
        // Body.reset() also stops the body (zeroing velocity), so it must be
        // re-applied here or the platform freezes in place after its first lap.
        if (cfg.axis === 'x') {
          platform.body.reset(cfg.from, cfg.y);
          platform.setVelocityX(cfg.speed);
        } else {
          platform.body.reset(cfg.x, cfg.from);
          platform.setVelocityY(cfg.speed);
        }
      }
    }
  });
}
