import { gameState } from '../game-state.js';
import { setMobileControlsVisible } from '../input.js';
import { enlargeTextHitArea } from '../ui/menu-widgets.js';

export const gameOverScene = {
  key: 'GameOver',
  preload: function () {},
  create: function () {
    setMobileControlsVisible(false);
    this.add.text(750, 300, 'Game Over!!', { fontSize: '72px', fill: '#fff' });

    const playAgain = this.add.text(780, 450, 'Play Again?', {
      fontSize: '48px',
      fill: '#fff',
      fontFamily: 'Roboto',
    });
    enlargeTextHitArea(playAgain, 28, 20);

    playAgain.on('pointerdown', () => {
      this.scene.start('Game'); // Transition to game scene
      gameState.lives = 3;
      gameState.level = 1;
    });

    playAgain.setInteractive().on('pointerover', () => {
      playAgain.setShadow(2, 2, 'rgba(42, 145, 113,0.5)', 2);
      playAgain.setColor('rgba(42, 145, 145,0.9)');
    });
    playAgain.setInteractive().on('pointerout', () => {
      playAgain.setShadow(0, 0, 'rgba(0,0,0,0.5)', 1);
      playAgain.setColor('rgb(255,255,255)');
    });

    const quit = this.add.text(1050, 450, 'Quit', {
      fontSize: '48px',
      fill: '#fff',
      fontFamily: 'Roboto',
    });
    enlargeTextHitArea(quit, 28, 20);

    quit.on('pointerdown', () => {
      gameState.lives = 3;
      gameState.level = 1;
      gameState.collectedKey = false;
      this.scene.start('Menu'); // Transition to menu
    });
    quit.setInteractive().on('pointerover', () => {
      quit.setShadow(2, 2, 'rgba(42, 145, 113,0.5)', 2);
      quit.setColor('rgba(42, 145, 145,0.9)');
    });
    quit.setInteractive().on('pointerout', () => {
      quit.setShadow(0, 0, 'rgba(0,0,0,0.5)', 1);
      quit.setColor('rgb(255,255,255)');
    });
  },
};
