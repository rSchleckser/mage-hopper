import { gameState } from '../game-state.js';
import { setMobileControlsVisible } from '../input.js';
import { makePillButton } from '../ui/menu-widgets.js';
import { MENU_COLORS } from '../ui/theme.js';
import { shouldUseDomOverlay } from '../ui/dom-overlays.js';
import { openGameWinDomOverlay, hideGameWinDomUi } from '../ui/game-win-overlay.js';
import { playVictory } from '../audio.js';

const TOTAL_LEVELS = 5;

export const gameWinScene = {
  key: 'GameWin',
  preload: function () {
    this.load.image('background', './img/nature_background.jpg');
  },
  create: function () {
    setMobileControlsVisible(false);
    hideGameWinDomUi();
    playVictory();

    const cx = 1000;
    const cy = 445;

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

    this.events.once('shutdown', () => hideGameWinDomUi());

    // Portrait / touch: the letterboxed canvas is tiny here, use a full-viewport card instead.
    if (shouldUseDomOverlay()) {
      openGameWinDomOverlay(this, {
        totalLevels: TOTAL_LEVELS,
        onPlayAgain: playAgain,
        onQuit: quitToMenu,
      });
      return;
    }

    // Dim the backdrop so the card pops, same language as the other end-game cards
    this.add.rectangle(cx, 400, 1890, 890, 0x0a1010, 0.35);

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
      .text(cx, titleY, 'VICTORY!', {
        fontFamily: 'Cinzel, serif',
        fontSize: '52px',
        fontStyle: '900',
        color: '#fff8e7',
        stroke: '#1a2424',
        strokeThickness: 6,
        shadow: {
          offsetX: 0,
          offsetY: 4,
          color: '#1f6e6e',
          blur: 0,
          fill: true,
          stroke: true,
        },
      })
      .setOrigin(0.5);

    const ribbonText = this.add
      .text(0, 0, `ALL ${TOTAL_LEVELS} STAGES CLEARED`, {
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
      .text(cx, ribbonY + 56, 'You saved the realm!', {
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: '800',
        color: '#1f6e6e',
      })
      .setOrigin(0.5);

    // Progress dots: every stage cleared, all lit up
    const dotsY = ribbonY + 110;
    const dotSpacing = 30;
    const dotsStartX = cx - ((TOTAL_LEVELS - 1) * dotSpacing) / 2;
    for (let i = 0; i < TOTAL_LEVELS; i++) {
      const dotX = dotsStartX + i * dotSpacing;
      const d = this.add.graphics();
      d.fillStyle(MENU_COLORS.teal, 1);
      d.fillCircle(dotX, dotsY, 7);
      d.lineStyle(3, MENU_COLORS.teal, 0.35);
      d.strokeCircle(dotX, dotsY, 10);
    }

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

    const quitBtn = makePillButton(this, cx + (buttonW + buttonGap) / 2, buttonsY, 'Main Menu', {
      width: buttonW,
      height: 56,
      variant: 'secondary',
      fontSize: 20,
      depth: 20,
    });
    quitBtn.setOnActivate(quitToMenu);
  },
};
