import { gameState } from '../game-state.js';
import { setMobileControlsVisible } from '../input.js';
import { makePillButton } from '../ui/menu-widgets.js';
import { MENU_COLORS } from '../ui/theme.js';
import { shouldUseDomOverlay } from '../ui/dom-overlays.js';
import { openGameOverDomOverlay, hideGameOverDomUi } from '../ui/game-over-overlay.js';

export const gameOverScene = {
  key: 'GameOver',
  preload: function () {
    this.load.image('background', './img/nature_background.jpg');
  },
  create: function () {
    setMobileControlsVisible(false);
    hideGameOverDomUi();

    const cx = 1000;
    const cy = 445;
    const reachedLevel = gameState.level;

    this.add.image(cx, 400, 'background');

    const playAgain = () => {
      gameState.lives = 3;
      gameState.level = 1;
      this.scene.start('Game');
    };
    const quitToMenu = () => {
      gameState.lives = 3;
      gameState.level = 1;
      gameState.collectedKey = false;
      this.scene.start('Menu');
    };

    this.events.once('shutdown', () => hideGameOverDomUi());

    // Portrait / touch: the letterboxed canvas is tiny here, use a full-viewport card instead.
    if (shouldUseDomOverlay()) {
      openGameOverDomOverlay(this, {
        level: reachedLevel,
        onPlayAgain: playAgain,
        onQuit: quitToMenu,
      });
      return;
    }

    // Dim the backdrop with a somber red-black tint, same language as the Level Complete card
    this.add.rectangle(cx, 400, 1890, 890, 0x1a0606, 0.55);

    const panelW = 640;
    const panelH = 400;
    const panelY = cy;

    const panelBg = this.add.graphics();
    panelBg.fillGradientStyle(0xfff8e7, 0xfff8e7, 0xf3e6c8, 0xf3e6c8, 1);
    panelBg.fillRoundedRect(cx - panelW / 2, panelY - panelH / 2, panelW, panelH, 20);
    panelBg.lineStyle(3, MENU_COLORS.ink, 0.45);
    panelBg.strokeRoundedRect(cx - panelW / 2, panelY - panelH / 2, panelW, panelH, 20);

    const titleY = panelY - panelH / 2 + 70;
    this.add
      .text(cx, titleY, 'GAME OVER', {
        fontFamily: 'Cinzel, serif',
        fontSize: '52px',
        fontStyle: '900',
        color: '#fff8e7',
        stroke: '#1a2424',
        strokeThickness: 6,
        shadow: {
          offsetX: 0,
          offsetY: 4,
          color: '#912a2a',
          blur: 0,
          fill: true,
          stroke: true,
        },
      })
      .setOrigin(0.5);

    const ribbonText = this.add
      .text(0, 0, `REACHED LEVEL ${reachedLevel}`, {
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: '800',
        color: 'rgba(26,36,36,0.72)',
      })
      .setOrigin(0.5);
    const ribbonY = titleY + 56;
    const rw = ribbonText.width + 48;
    const rh = ribbonText.height + 16;
    const ribbonG = this.add.graphics();
    ribbonG.fillStyle(MENU_COLORS.cream, 0.55);
    ribbonG.fillRoundedRect(cx - rw / 2, ribbonY - rh / 2, rw, rh, 3);
    ribbonText.setPosition(cx, ribbonY);

    this.add
      .text(cx, ribbonY + 56, 'Your mage has fallen...', {
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: '26px',
        fontStyle: '800',
        color: '#912a2a',
      })
      .setOrigin(0.5);

    const buttonsY = panelY + panelH / 2 - 56;
    const buttonGap = 24;
    const buttonW = 240;

    const playAgainBtn = makePillButton(this, cx - (buttonW + buttonGap) / 2, buttonsY, 'Play Again', {
      width: buttonW,
      height: 56,
      variant: 'primary',
      fontSize: 20,
      depth: 20,
    });
    playAgainBtn.setOnActivate(playAgain);

    const quitBtn = makePillButton(this, cx + (buttonW + buttonGap) / 2, buttonsY, 'Quit', {
      width: buttonW,
      height: 56,
      variant: 'secondary',
      fontSize: 20,
      depth: 20,
    });
    quitBtn.setOnActivate(quitToMenu);
  },
};
