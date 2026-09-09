import { setMobileControlsVisible } from '../input.js';
import { dismissRotateHint } from '../rotate-hint.js';
import { getMenuLayout, makePillButton } from '../ui/menu-widgets.js';
import { hideMenuDomUi, syncMenuDomUi } from '../ui/dom-overlays.js';
import { openInstructionsOverlay } from '../ui/instructions-overlay.js';
import { MENU_COLORS } from '../ui/theme.js';

export const menuScene = {
  key: 'Menu',

  preload: function () {
    this.load.image('background', './img/nature_background.jpg');
  },

  create: function () {
    setMobileControlsVisible(false);
    dismissRotateHint();

    const destroyMenu = () => {
      if (this._menuNodes) {
        this._menuNodes.forEach((n) => {
          if (n && n.destroy) n.destroy(true);
        });
      }
      this._menuNodes = [];
      hideMenuDomUi();
    };

    const build = () => {
      destroyMenu();
      const nodes = [];
      this._menuNodes = nodes;

      // Background stays full-bleed (not part of scaled menu group).
      nodes.push(this.add.image(1000, 400, 'background'));

      const layout = getMenuLayout(this);
      const {
        cx,
        cy,
        titleSize,
        strokeTitle,
        ribbonFont,
        ribbonPadX,
        ribbonPadY,
        startW,
        startH,
        instrW,
        instrH,
        gap,
      } = layout;

      // Build menu stack in LOCAL coords inside a group, then ONE uniform scale to fit.
      const group = this.add.container(0, 0);
      group.setDepth(10);
      nodes.push(group);

      const title = this.add
        .text(0, 0, 'MAGE HOPPER', {
          fontFamily: 'Cinzel, serif',
          fontSize: `${titleSize}px`,
          fontStyle: '900',
          color: '#fff8e7',
          stroke: '#1a2424',
          strokeThickness: strokeTitle,
          shadow: {
            offsetX: 0,
            offsetY: Math.max(3, Math.round(strokeTitle * 0.55)),
            color: '#1f6e6e',
            blur: 0,
            fill: true,
            stroke: true,
          },
        })
        .setOrigin(0.5, 0);

      const ribbonText = this.add
        .text(0, 0, 'A PLATFORM ADVENTURE', {
          fontFamily: 'Nunito, system-ui, sans-serif',
          fontSize: `${ribbonFont}px`,
          fontStyle: '800',
          color: 'rgba(26,36,36,0.72)',
        })
        .setOrigin(0.5);
      const rw = ribbonText.width + ribbonPadX * 2;
      const rh = ribbonText.height + ribbonPadY;
      const ribbonG = this.add.graphics();
      ribbonG.fillStyle(MENU_COLORS.cream, 0.55);
      ribbonG.fillRoundedRect(-rw / 2, -rh / 2, rw, rh, 3);

      const startBtn = makePillButton(this, 0, 0, 'Start Game', {
        width: startW,
        height: startH,
        variant: 'primary',
        fontSize: Math.round(startH * 0.38),
        depth: 20,
      });
      const instrBtn = makePillButton(this, 0, 0, 'Instructions', {
        width: instrW,
        height: instrH,
        variant: 'secondary',
        fontSize: Math.round(instrH * 0.38),
        depth: 20,
      });
      // Menu taps use DOM overlays — drop Phaser zones (misaligned once group scales).
      [startBtn, instrBtn].forEach((btn) => {
        if (btn._hitZone) {
          btn._hitZone.destroy();
          btn._hitZone = null;
        }
      });

      // Stack locally from y=0 downward (origin top-center of title).
      let y = 0;
      title.setPosition(0, y);
      y += title.height + Math.round(gap * 0.45);
      ribbonG.setPosition(0, y + rh / 2);
      ribbonText.setPosition(0, y + rh / 2);
      y += rh + gap;
      startBtn.setPosition(0, y + startH / 2);
      // keep hit-zone destroy already done; position container child
      y += startH + Math.round(gap * 0.85);
      instrBtn.setPosition(0, y + instrH / 2);
      y += instrH;

      group.add([title, ribbonG, ribbonText, startBtn, instrBtn]);

      // Measure unscaled stack; one uniform scale to fit — NEVER scale up (stops inflate spiral).
      const localH = y;
      const localW = Math.max(title.width, rw, startW, instrW);
      const maxW = 1890 * 0.9;
      const maxH = 890 * 0.85;
      const scale = Math.min(1, maxW / Math.max(localW, 1), maxH / Math.max(localH, 1));
      group.setScale(scale);
      // Top of stack at cy - half scaled height (centered in letterbox world).
      group.setPosition(cx, cy - (localH * scale) / 2);

      const onStart = () => {
        hideMenuDomUi();
        this.scene.start('Game');
      };
      const onInstr = () => {
        hideMenuDomUi();
        openInstructionsOverlay(this);
      };
      startBtn.setOnActivate(onStart);
      instrBtn.setOnActivate(onInstr);

      if (!this._instrCloseBound) {
        this._instrCloseBound = true;
        this.events.on('instructions-closed', () => {
          if (this.sys.settings.active) build();
        });
        this.events.once('shutdown', () => {
          this.events.off('instructions-closed');
          this._instrCloseBound = false;
        });
      }

      // DOM hits from scaled world positions (fat min target kept inside syncMenuDomUi).
      const pad = 12;
      const startWorldX = group.x + startBtn.x * scale;
      const startWorldY = group.y + startBtn.y * scale;
      const instrWorldX = group.x + instrBtn.x * scale;
      const instrWorldY = group.y + instrBtn.y * scale;
      syncMenuDomUi(
        this,
        { x: startWorldX, y: startWorldY, w: (startW + pad * 2) * scale, h: (startH + pad * 2) * scale },
        { x: instrWorldX, y: instrWorldY, w: (instrW + pad * 2) * scale, h: (instrH + pad * 2) * scale },
        { onStart, onInstr }
      );
    };

    build();

    this.time.delayedCall(100, () => {
      if (this.sys.settings.active) build();
    });
    this.time.delayedCall(350, () => {
      if (this.sys.settings.active) build();
    });

    const onResize = () => {
      if (!this.sys.settings.active) return;
      if (this._menuResizeTimer) this._menuResizeTimer.remove(false);
      this._menuResizeTimer = this.time.delayedCall(80, () => {
        if (this.sys.settings.active) build();
      });
    };
    this.scale.on('resize', onResize);
    window.addEventListener('scroll', onResize, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize);
      window.visualViewport.addEventListener('scroll', onResize);
    }
    this.events.once('shutdown', () => {
      this.scale.off('resize', onResize);
      window.removeEventListener('scroll', onResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onResize);
        window.visualViewport.removeEventListener('scroll', onResize);
      }
      if (this._menuResizeTimer) this._menuResizeTimer.remove(false);
      destroyMenu();
    });
  },
};
