import { gameState } from '../game-state.js';
import { setMobileControlsVisible } from '../input.js';
import { makePillButton } from '../ui/menu-widgets.js';
import { MENU_COLORS } from '../ui/theme.js';
import { shouldUseDomOverlay } from '../ui/dom-overlays.js';
import { openLevelCompleteDomOverlay, hideLevelCompleteDomUi } from '../ui/level-complete-overlay.js';
import { playLevelComplete } from '../audio.js';

const TOTAL_LEVELS = 5;

export const levelWinScene = {
  key: 'NextLevel',
  preload: function () {
    this.load.image('Background', './img/nature_background.jpg');
  },
  create: function () {
    setMobileControlsVisible(false);
    hideLevelCompleteDomUi();
    playLevelComplete();

    const cx = 1000;
    const cy = 445;
    const clearedLevel = gameState.level - 1;
    const nextLevel = gameState.level;

    this.add.image(cx, 400, 'Background');

    const goToNextLevel = () => {
      gameState.lives = 3;
      this.scene.start('Game');
    };

    this.events.once('shutdown', () => hideLevelCompleteDomUi());

    // Portrait / touch: the letterboxed canvas is tiny here, use a full-viewport card instead.
    if (shouldUseDomOverlay()) {
      openLevelCompleteDomOverlay(this, {
        clearedLevel,
        nextLevel,
        totalLevels: TOTAL_LEVELS,
        onContinue: goToNextLevel,
      });
      return;
    }

    // Dim the backdrop so the card pops, same language as the Instructions overlay
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
      .text(cx, titleY, 'LEVEL COMPLETE!', {
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
      .text(0, 0, `STAGE ${clearedLevel} CLEARED`, {
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
      .text(cx, ribbonY + 56, `Ready for Level ${nextLevel}?`, {
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: '28px',
        fontStyle: '800',
        color: '#1f6e6e',
      })
      .setOrigin(0.5);

    // Progress dots: one per level, filled teal up through the stage just cleared
    const dotsY = ribbonY + 110;
    const dotSpacing = 30;
    const dotsStartX = cx - ((TOTAL_LEVELS - 1) * dotSpacing) / 2;
    for (let i = 0; i < TOTAL_LEVELS; i++) {
      const dotX = dotsStartX + i * dotSpacing;
      const d = this.add.graphics();
      if (i < clearedLevel) {
        d.fillStyle(MENU_COLORS.teal, 1);
        d.fillCircle(dotX, dotsY, 7);
        d.lineStyle(3, MENU_COLORS.teal, 0.35);
        d.strokeCircle(dotX, dotsY, 10);
      } else {
        d.fillStyle(MENU_COLORS.ink, 0.2);
        d.fillCircle(dotX, dotsY, 6);
      }
    }

    const continueBtn = makePillButton(this, cx, panelY + panelH / 2 - 56, 'Continue', {
      width: 260,
      height: 56,
      variant: 'primary',
      fontSize: 22,
      depth: 20,
    });
    continueBtn.setOnActivate(goToNextLevel);
  },
};
