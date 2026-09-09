import { gameState } from '../game-state.js';
import { setMobileControlsVisible } from '../input.js';
import { enlargeTextHitArea } from '../ui/menu-widgets.js';

export const gameWinScene = {
  key: 'GameWin',
  preload: function () {
    this.load.image('background', './img/nature_background.jpg');
  },
  create: function () {
    setMobileControlsVisible(false);
    this.add.image(1000, 400, 'background');
    this.add.text(700, 200, 'Congratulations!!', {
      fontSize: '72px',
      fontFamily: 'Augustine',
      fill: 'rgba(90, 145, 145)',
    });
    this.add.text(675, 300, 'You Won the Game!', {
      fontSize: '72px',
      fontFamily: 'Augustine',
      fill: 'rgb(90, 145, 145)',
    });

    const playAgain = this.add.text(700, 450, 'Play Again?', {
      fontSize: '48px',
      fill: '#000',
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
      playAgain.setColor('rgb(0,0,0)');
    });

    const quit = this.add.text(1000, 450, 'Main Menu', {
      fontSize: '48px',
      fill: '#000',
      fontFamily: 'Roboto',
    });
    enlargeTextHitArea(quit, 28, 20);

    quit.on('pointerdown', () => {
      this.scene.start('Menu'); // Transition to game scene
    });

    quit.setInteractive().on('pointerover', () => {
      quit.setShadow(2, 2, 'rgba(42, 145, 113,0.5)', 2);
      quit.setColor('rgba(42, 145, 145,0.9)');
    });
    quit.setInteractive().on('pointerout', () => {
      quit.setShadow(0, 0, 'rgba(0,0,0,0.5)', 1);
      quit.setColor('rgb(0,0,0)');
    });
  },
};
