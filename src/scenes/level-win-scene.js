import { gameState } from '../game-state.js';
import { setMobileControlsVisible } from '../input.js';
import { enlargeTextHitArea } from '../ui/menu-widgets.js';

export const levelWinScene = {
  key: 'NextLevel',
  preload: function () {
    this.load.image('Background', './img/nature_background.jpg');
  },
  create: function () {
    setMobileControlsVisible(false);
    this.add.image(1000, 400, 'Background');
    this.add.text(730, 250, `Congratulations!!`, {
      fontFamily: 'Augustine',
      fontSize: '64px',
      fill: '#000',
    });

    this.add
      .text(750, 380, `Ready to move on to`, {
        fontFamily: 'Roboto',
        fontSize: '48px',
        fill: '#000',
      })
      .setInteractive();

    const nextLevel = this.add.text(870, 500, `Level: ${gameState.level}`, {
      fontFamily: 'Roboto',
      fontSize: '48px',
      fill: '#000',
    });
    enlargeTextHitArea(nextLevel, 28, 20);

    nextLevel.on('pointerdown', () => {
      this.scene.start('Game'); // Transition to game scene
      gameState.lives = 3;
    });

    nextLevel.setInteractive().on('pointerover', () => {
      nextLevel.setShadow(2, 2, 'rgba(42, 145, 113,0.5)', 2);
      nextLevel.setColor('rgba(42, 145, 145,0.9)');
    });
    nextLevel.setInteractive().on('pointerout', () => {
      nextLevel.setShadow(0, 0, 'rgba(0,0,0,0.5)', 1);
      nextLevel.setColor('rgb(0,0,0)');
    });
  },
};
