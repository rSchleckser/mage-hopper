import { gameState } from '../game-state.js';
import { setMobileControlsVisible } from '../input.js';
import { makePillButton } from '../ui/menu-widgets.js';
import { MENU_COLORS } from '../ui/theme.js';
import { shouldUseDomOverlay } from '../ui/dom-overlays.js';
import { openPauseDomOverlay, hidePauseDomUi } from '../ui/pause-overlay.js';

export const pauseScene = {
  key: 'Pause',
  create: function () {
    hidePauseDomUi();
    setMobileControlsVisible(false);

    const cx = 1000;
    const cy = 445;
    const level = gameState.level;

    const resumeGame = () => {
      this.scene.stop();
      const game = this.scene.get('Game');
      if (game && game.input) game.input.enabled = true;
      this.scene.resume('Game');
      setMobileControlsVisible(true);
    };
    const restartLevel = () => {
      this.scene.stop();
      this.scene.stop('Game');
      this.scene.start('Game');
    };
    const quitToMenu = () => {
      gameState.lives = 3;
      gameState.level = 1;
      gameState.collectedKey = false;
      this.scene.stop('Game');
      this.scene.start('Menu');
    };

    // Resuming from the keyboard should behave exactly like tapping Resume.
    this.input.keyboard.once('keydown-ESC', resumeGame);
    this.input.keyboard.once('keydown-P', resumeGame);

    this.events.once('shutdown', () => hidePauseDomUi());

    // Portrait / touch: the letterboxed canvas is tiny here, use a full-viewport card instead.
    if (shouldUseDomOverlay()) {
      openPauseDomOverlay(this, {
        level,
        onResume: resumeGame,
        onRestart: restartLevel,
        onQuit: quitToMenu,
      });
      return;
    }

    // Dim the frozen Game scene behind this card (same language as the other overlays)
    this.add.rectangle(cx, 400, 1890, 890, 0x0a1010, 0.55).setInteractive();

    const panelW = 480;
    const panelH = 400;
    const panelY = cy;

    const panelBg = this.add.graphics();
    panelBg.fillGradientStyle(0xfff8e7, 0xfff8e7, 0xf3e6c8, 0xf3e6c8, 1);
    panelBg.fillRoundedRect(cx - panelW / 2, panelY - panelH / 2, panelW, panelH, 20);
    panelBg.lineStyle(3, MENU_COLORS.ink, 0.45);
    panelBg.strokeRoundedRect(cx - panelW / 2, panelY - panelH / 2, panelW, panelH, 20);

    const titleY = panelY - panelH / 2 + 66;
    this.add
      .text(cx, titleY, 'PAUSED', {
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
      .text(0, 0, `LEVEL ${level}`, {
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

    const buttonW = 280;
    const buttonH = 56;
    const button1Y = ribbonY + 60;
    const button2Y = button1Y + 62;
    const button3Y = button2Y + 62;

    const resumeBtn = makePillButton(this, cx, button1Y, 'Resume', {
      width: buttonW,
      height: buttonH,
      variant: 'primary',
      fontSize: 22,
      depth: 20,
    });
    resumeBtn.setOnActivate(resumeGame);

    const restartBtn = makePillButton(this, cx, button2Y, 'Restart Level', {
      width: buttonW,
      height: buttonH,
      variant: 'secondary',
      fontSize: 20,
      depth: 20,
    });
    restartBtn.setOnActivate(restartLevel);

    const quitBtn = makePillButton(this, cx, button3Y, 'Quit to Menu', {
      width: buttonW,
      height: buttonH,
      variant: 'secondary',
      fontSize: 20,
      depth: 20,
    });
    quitBtn.setOnActivate(quitToMenu);
  },
};
