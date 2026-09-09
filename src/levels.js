const PLATFORM_TEXTURE_SIZE = { width: 1000, height: 40 };
const PLATFORM_SCALE = 0.25;

export const LEVELS = [
  { key: { x: 170, y: 265 }, door: { x: 1650, y: 253 }, extraPlatformStage: false },
  { key: { x: 1370, y: 465 }, door: { x: 150, y: 253 }, extraPlatformStage: false },
  { key: { x: 1670, y: 750 }, door: { x: 850, y: 453 }, extraPlatformStage: false },
  { key: { x: 170, y: 265 }, door: { x: 1650, y: 778 }, extraPlatformStage: false },
  { key: { x: 1020, y: 65 }, door: { x: 150, y: 778 }, extraPlatformStage: true },
];

export const ENEMY_SPAWNS = [
  { x: 850, y: 450 },
  { x: 1150, y: 272 },
  { x: 1650, y: 272 },
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

  // Stage 1
  for (let i = 1; i < 3; i++) createPlatformAt(platforms, 100 + 500 * i, 720);
  // Stage 2
  for (let i = 0; i < 3; i++) createPlatformAt(platforms, 350 + 500 * i, 550);
  // Stage 3
  for (let i = 0; i < 4; i++) createPlatformAt(platforms, 150 + 500 * i, 350);
  // Stage 4 — level 5 only
  if (levelConfig.extraPlatformStage) {
    for (let i = 1; i < 3; i++) createPlatformAt(platforms, 500 * i, 150);
  }

  return platforms;
}
