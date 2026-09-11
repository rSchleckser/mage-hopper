import { menuScene } from './scenes/menu-scene.js';
import { gameScene } from './scenes/game-scene/index.js';
import { pauseScene } from './scenes/pause-scene.js';
import { gameOverScene } from './scenes/game-over-scene.js';
import { levelWinScene } from './scenes/level-win-scene.js';
import { gameWinScene } from './scenes/game-win-scene.js';
import { setupMobileControls } from './input.js';
import { updateRotateHint, dismissRotateHint, refreshGameScale } from './rotate-hint.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#000000',
  input: {
    activePointers: 3,
    windowEvents: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1890,
    height: 890,
    expandParent: true,
    autoRound: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 }, // Set gravity
      debug: false, // Set to true to see physics bodies
    },
  },
  scene: [menuScene, gameScene, pauseScene, gameOverScene, levelWinScene, gameWinScene],
};

const game = new Phaser.Game(config);

setupMobileControls();

const dismissBtn = document.getElementById('rotate-dismiss');
if (dismissBtn) {
  ['pointerdown', 'touchstart', 'click'].forEach((evt) => {
    dismissBtn.addEventListener(evt, dismissRotateHint, { passive: false });
  });
}

updateRotateHint();
refreshGameScale(game);

['resize', 'orientationchange'].forEach((evt) => {
  window.addEventListener(evt, () => {
    refreshGameScale(game);
    setTimeout(() => refreshGameScale(game), 100);
    setTimeout(() => refreshGameScale(game), 300);
    setTimeout(() => refreshGameScale(game), 600);
  });
});

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    refreshGameScale(game);
  });
}
