import { isTouchDevice } from '../input.js';
import { MENU_COLORS } from './theme.js';

export function getMenuLayout(scene) {
  // Fixed mock-proportion sizes in WORLD space. Phaser Scale.FIT already maps
  // the 1890×890 world into the letterbox — do NOT inflate from CSS (that caused
  // the zoom/clip spiral). A uniform group scale later fits the stack if needed.
  const cx = 1000;
  const cy = 445;
  const canvas = scene.game?.canvas;
  const cssW = (canvas && canvas.clientWidth) || scene.scale.displaySize?.width || 1890;
  const cssH = (canvas && canvas.clientHeight) || scene.scale.displaySize?.height || 890;
  const ds = Math.min(cssW / 1890, cssH / 890) || 1;
  return {
    cx,
    cy,
    ds,
    compact: ds < 0.55,
    // Approved mobile mock hierarchy (TITLE ≫ Start > Instructions), desktop-comfortable.
    titleSize: 92,
    ribbonFont: 18,
    ribbonPadX: 24,
    ribbonPadY: 8,
    startW: 280,
    startH: 54,
    instrW: 210,
    instrH: 44,
    gap: 16,
    strokeTitle: 7,
  };
}

export function drawPill(g, w, h, opts) {
  const {
    fillTop = MENU_COLORS.tealLite,
    fillBottom = MENU_COLORS.tealDeep,
    stroke = 0xffffff,
    strokeAlpha = 0.35,
    strokeWidth = 3,
    shadow = 0x1f6e6e,
    shadowAlpha = 1,
    shadowY = 4,
    highlight = true,
    pressed = false,
  } = opts || {};
  g.clear();
  const r = h / 2;
  const yOff = pressed ? 3 : 0;
  const shY = pressed ? 1 : shadowY;
  // Drop shadow / depth plate
  g.fillStyle(shadow, shadowAlpha);
  g.fillRoundedRect(-w / 2, -h / 2 + shY + yOff, w, h, r);
  // Body
  g.fillGradientStyle(fillTop, fillTop, fillBottom, fillBottom, 1);
  g.fillRoundedRect(-w / 2, -h / 2 + yOff, w, h, r);
  // Flat fill override when solidFill provided
  if (opts && opts.solidFill != null) {
    g.fillStyle(opts.solidFill, opts.solidAlpha != null ? opts.solidAlpha : 1);
    g.fillRoundedRect(-w / 2, -h / 2 + yOff, w, h, r);
  }
  if (strokeWidth > 0) {
    g.lineStyle(strokeWidth, stroke, strokeAlpha);
    g.strokeRoundedRect(-w / 2, -h / 2 + yOff, w, h, r);
  }
  if (highlight && !pressed && !(opts && opts.solidFill != null)) {
    g.lineStyle(2, 0xffffff, 0.28);
    g.beginPath();
    g.moveTo(-w / 2 + r, -h / 2 + 4 + yOff);
    g.lineTo(w / 2 - r, -h / 2 + 4 + yOff);
    g.strokePath();
  }
}

export function makePillButton(scene, x, y, label, style) {
  const {
    width,
    height,
    variant = 'primary', // primary | secondary | danger | nav | navPrimary
    fontSize,
    depth = 20,
  } = style;
  const container = scene.add.container(x, y);
  const g = scene.add.graphics();
  const textColor =
    variant === 'secondary' || variant === 'nav'
      ? '#1a2424'
      : variant === 'danger'
        ? '#912a2a'
        : '#ffffff';
  const txt = scene.add
    .text(0, 0, label, {
      fontFamily: 'Nunito, system-ui, sans-serif',
      fontSize: `${fontSize || Math.round(height * 0.42)}px`,
      fontStyle: '800',
      color: textColor,
    })
    .setOrigin(0.5);
  container.add([g, txt]);
  container.setDepth(depth);
  container.setSize(width, height);

  // World-space Zone (NOT nested in container) — Container hit areas are unreliable on Android Chrome + FIT scale.
  const pad = Math.max(16, Math.round(height * 0.25));
  const zone = scene.add
    .zone(x, y, width + pad * 2, height + pad * 2)
    .setOrigin(0.5)
    .setDepth(depth + 1);
  zone.setInteractive({ useHandCursor: true });

  const palette = () => {
    if (variant === 'primary' || variant === 'navPrimary') {
      return {
        fillTop: MENU_COLORS.tealLite,
        fillBottom: MENU_COLORS.tealDeep,
        stroke: 0xffffff,
        strokeAlpha: 0.35,
        shadow: MENU_COLORS.tealDeep,
        highlight: true,
      };
    }
    if (variant === 'danger') {
      return {
        solidFill: 0xf5d0d0,
        solidAlpha: 0.95,
        stroke: MENU_COLORS.fire,
        strokeAlpha: 0.55,
        strokeWidth: 2,
        shadow: 0x6e1f1f,
        shadowAlpha: 0.25,
        shadowY: 2,
        highlight: false,
      };
    }
    return {
      solidFill: MENU_COLORS.cream,
      solidAlpha: variant === 'nav' ? 1 : 0.95,
      stroke: MENU_COLORS.ink,
      strokeAlpha: 0.35,
      strokeWidth: 2,
      shadow: MENU_COLORS.ink,
      shadowAlpha: 0.2,
      shadowY: 2,
      highlight: false,
    };
  };

  let state = 'up';
  let armed = false;
  const paint = () => {
    const base = palette();
    if (state === 'hover' && (variant === 'primary' || variant === 'navPrimary')) {
      base.fillTop = 0x4bb8bc;
      base.fillBottom = 0x2a9191;
    } else if (state === 'hover' && variant !== 'danger') {
      base.solidAlpha = 1;
    } else if (state === 'hover' && variant === 'danger') {
      base.solidFill = 0xf8c0c0;
    }
    if (state === 'down') {
      if (variant === 'primary' || variant === 'navPrimary') {
        base.fillTop = MENU_COLORS.tealDeep;
        base.fillBottom = 0x185858;
      } else if (variant === 'danger') {
        base.solidFill = 0xe8a0a0;
      } else {
        base.solidFill = 0xf0e6d0;
      }
      base.pressed = true;
    }
    drawPill(g, width, height, base);
    txt.setY(state === 'down' ? 3 : 0);
  };
  paint();

  const activate = () => {
    if (typeof container._onActivate === 'function') container._onActivate();
  };
  const press = () => {
    armed = true;
    state = 'down';
    paint();
  };
  const release = (shouldFire) => {
    const wasArmed = armed;
    armed = false;
    state = 'up';
    paint();
    if (shouldFire && wasArmed) activate();
  };

  zone.on('pointerover', () => {
    if (!armed) {
      state = 'hover';
      paint();
    }
  });
  zone.on('pointerout', () => {
    if (!isTouchDevice()) {
      armed = false;
      state = 'up';
      paint();
    }
  });
  zone.on('pointerdown', (pointer) => {
    if (pointer && pointer.event && pointer.event.preventDefault) pointer.event.preventDefault();
    press();
    // Touch: fire on press so a 1px finger slip can't cancel Start/Instructions.
    if (isTouchDevice()) release(true);
  });
  zone.on('pointerup', () => {
    if (!isTouchDevice()) release(true);
  });
  zone.on('pointerupoutside', () => {
    armed = false;
    state = 'up';
    paint();
  });

  container.setLabel = (s) => txt.setText(s);
  container.getText = () => txt;
  container.repaint = paint;
  container.setOnActivate = (fn) => {
    container._onActivate = fn;
  };
  container._hitZone = zone;
  // Destroy zone with the visual container
  const prevDestroy = container.destroy.bind(container);
  container.destroy = (...args) => {
    if (zone && zone.destroy) zone.destroy();
    return prevDestroy(...args);
  };
  // Bridge legacy .on('pointerup') used by Instructions overlay nav buttons
  const origOn = container.on.bind(container);
  container.on = (event, fn, context) => {
    if (event === 'pointerup' || event === 'pointerdown') {
      const prev = container._onActivate;
      container._onActivate = () => {
        if (typeof prev === 'function') prev();
        fn.call(context || container);
      };
      return container;
    }
    return origOn(event, fn, context);
  };
  return container;
}

export function buildKeyChip(scene, x, y, label, kind) {
  const w = label.length > 2 ? 96 : 44;
  const h = 44;
  const g = scene.add.graphics();
  let fill = 0x2a3232;
  let stroke = 0xffffff;
  let strokeA = 0.45;
  if (kind === 'fire') {
    fill = 0x5c2222;
    stroke = 0xdc5050;
    strokeA = 0.85;
  } else if (kind === 'slam') {
    fill = 0x5c4018;
    stroke = 0xdca03c;
    strokeA = 0.85;
  }
  g.fillStyle(fill, 1);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
  g.lineStyle(2, stroke, strokeA);
  g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
  const t = scene.add
    .text(x, y, label, {
      fontFamily: 'Nunito, system-ui, sans-serif',
      fontSize: '18px',
      fontStyle: '800',
      color: '#ffffff',
    })
    .setOrigin(0.5);
  return [g, t];
}

export function buildActionRow(scene, x, y, tag, tagColor, desc) {
  const items = [];
  const g = scene.add.graphics();
  const tagW = Math.max(64, tag.length * 11 + 20);
  const tagH = 26;
  g.fillStyle(tagColor, 1);
  g.fillRoundedRect(x, y - tagH / 2, tagW, tagH, tagH / 2);
  items.push(g);
  items.push(
    scene.add
      .text(x + tagW / 2, y, tag, {
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: '800',
        color: '#ffffff',
      })
      .setOrigin(0.5)
  );
  items.push(
    scene.add
      .text(x + tagW + 12, y, desc, {
        fontFamily: 'Nunito, system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: '700',
        color: '#1a2424',
      })
      .setOrigin(0, 0.5)
  );
  return items;
}

export function enlargeTextHitArea(textObj, padX = 24, padY = 16) {
  if (!textObj || !textObj.setInteractive) return textObj;
  try {
    const b = textObj.getBounds();
    textObj.setInteractive(
      new Phaser.Geom.Rectangle(-padX, -padY, b.width + padX * 2, b.height + padY * 2),
      Phaser.Geom.Rectangle.Contains
    );
  } catch (e) {
    textObj.setInteractive();
  }
  return textObj;
}
