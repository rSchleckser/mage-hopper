import { MENU_COLORS } from '../../ui/theme.js';
import { ENEMY_BASE_SPEED } from '../../constants.js';
import { gameState } from '../../game-state.js';

const HUD_DEPTH = 20;
const BADGE_HEIGHT = 40;
const BADGE_PAD_X = 20;
const RIGHT_EDGE = 1874;

const HEALTH_PIP_WIDTH = 46;
const HEALTH_PIP_HEIGHT = 30;
const HEALTH_PIP_GAP = 8;
const HEALTH_BAR_Y = 64;

function drawBadgeBg(scene, x, y, width, height) {
  const g = scene.add.graphics().setDepth(HUD_DEPTH);
  g.fillStyle(MENU_COLORS.teal, 1);
  g.fillRoundedRect(x, y, width, height, height / 2);
  g.lineStyle(2, 0xffffff, 0.35);
  g.strokeRoundedRect(x, y, width, height, height / 2);
  return g;
}

function drawBadgeText(scene, x, y, initialText) {
  return scene.add
    .text(x, y, initialText, {
      fontFamily: 'Nunito, system-ui, sans-serif',
      fontSize: '20px',
      fontStyle: '800',
      color: '#ffffff',
    })
    .setOrigin(0, 0.5)
    .setDepth(HUD_DEPTH);
}

// Right-aligned so the bar's position doesn't shift between characters with
// different maxHp (Knight has 3 pips, Mage/Rogue have 2).
export function drawHealthBar(scene) {
  const bar = scene.healthBar;
  if (!bar) return;
  bar.clear();

  const maxHp = scene.healthBarMaxHp;
  const hp = Math.max(gameState.hp, 0);
  const totalWidth = maxHp * HEALTH_PIP_WIDTH + (maxHp - 1) * HEALTH_PIP_GAP;
  const leftX = RIGHT_EDGE - totalWidth;

  for (let i = 0; i < maxHp; i++) {
    const pipX = leftX + i * (HEALTH_PIP_WIDTH + HEALTH_PIP_GAP);
    const filled = i < hp;
    bar.fillStyle(MENU_COLORS.ink, 0.85);
    bar.fillRoundedRect(pipX, HEALTH_BAR_Y, HEALTH_PIP_WIDTH, HEALTH_PIP_HEIGHT, 6);
    bar.fillStyle(filled ? 0x2ecc71 : 0x3a3a3a, 1);
    bar.fillRoundedRect(pipX + 3, HEALTH_BAR_Y + 3, HEALTH_PIP_WIDTH - 6, HEALTH_PIP_HEIGHT - 6, 4);
    bar.lineStyle(2, 0xffffff, 0.35);
    bar.strokeRoundedRect(pipX, HEALTH_BAR_Y, HEALTH_PIP_WIDTH, HEALTH_PIP_HEIGHT, 6);
  }
}

export function updateLivesBadge(scene) {
  scene.lifeIndicator.setText(`LIVES ${gameState.lives}`);
}

// Player/enemy speed readouts and Arcade's physics hitbox overlay are useful
// while debugging but shouldn't clutter normal gameplay — both start hidden
// and are toggled together with the backtick key.
export function toggleDebugOverlay(scene) {
  scene.debugOverlayVisible = !scene.debugOverlayVisible;
  scene.playerSpeedIndicator.setVisible(scene.debugOverlayVisible);
  scene.enemySpeedIndicator.setVisible(scene.debugOverlayVisible);

  const world = scene.physics.world;
  if (scene.debugOverlayVisible) {
    if (!world.debugGraphic) world.createDebugGraphic();
    else world.drawDebug = true;
  } else {
    world.drawDebug = false;
    if (world.debugGraphic) world.debugGraphic.clear();
  }
}

export function createHud(scene) {
  // Level badge — top-left.
  const levelBadgeW = 150;
  drawBadgeBg(scene, 16, 16, levelBadgeW, BADGE_HEIGHT);
  scene.levelIndicator = drawBadgeText(scene, 16 + BADGE_PAD_X, 16 + BADGE_HEIGHT / 2, `LEVEL ${gameState.level}`);

  // Lives badge — top-right.
  const livesBadgeW = 150;
  const livesBadgeX = RIGHT_EDGE - livesBadgeW;
  drawBadgeBg(scene, livesBadgeX, 16, livesBadgeW, BADGE_HEIGHT);
  scene.lifeIndicator = drawBadgeText(scene, livesBadgeX + BADGE_PAD_X, 16 + BADGE_HEIGHT / 2, `LIVES ${gameState.lives}`);

  // Health bar — pip-style, right-aligned beneath the lives badge.
  scene.healthBarMaxHp = scene.character.maxHp;
  scene.healthBar = scene.add.graphics().setDepth(HUD_DEPTH);
  drawHealthBar(scene);

  // Debug overlay: player/enemy speed readouts, off by default.
  scene.debugOverlayVisible = false;
  scene.playerSpeedIndicator = scene.add
    .text(500, 16, `Player Speed: ${scene.character.moveSpeed}`, { fontSize: '28px', color: '#00ff00' })
    .setDepth(HUD_DEPTH)
    .setVisible(false);
  scene.enemySpeedIndicator = scene.add
    .text(900, 16, `Enemy Speed: ${parseInt(ENEMY_BASE_SPEED * (1 + gameState.level / 8.3))}`, {
      fontSize: '28px',
      color: '#ff5050',
    })
    .setDepth(HUD_DEPTH)
    .setVisible(false);

  scene.input.keyboard.on('keydown-BACKTICK', () => toggleDebugOverlay(scene));
}
