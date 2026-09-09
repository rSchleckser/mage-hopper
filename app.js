let player;
let fireProjectile;
let lives = 3;
let level = 1;
let enemy;
let enemy2;
let enemy3;
const enemySpeed = 100;
let ground;
let platforms;
let door;
let key;
let collectedKey = false;

// --- Mobile / touch input ---
const touchInput = { left: false, right: false, up: false, attack: false, extra: false };

function isTouchDevice() {
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    "ontouchstart" in window ||
    (navigator.maxTouchPoints || 0) > 0
  );
}

function bindHoldButton(el, key) {
  if (!el) return;
  const set = (down, event) => {
    if (event) event.preventDefault();
    touchInput[key] = down;
    el.classList.toggle("pressed", down);
  };
  el.addEventListener("pointerdown", (e) => {
    el.setPointerCapture?.(e.pointerId);
    set(true, e);
  });
  el.addEventListener("pointerup", (e) => set(false, e));
  el.addEventListener("pointercancel", (e) => set(false, e));
  el.addEventListener("pointerout", (e) => set(false, e));
  el.addEventListener("lostpointercapture", (e) => set(false, e));
}

function setMobileControlsVisible(visible) {
  const controls = document.getElementById("mobile-controls");
  if (!controls) return;
  if (visible && isTouchDevice()) {
    controls.classList.add("visible");
    controls.setAttribute("aria-hidden", "false");
  } else {
    controls.classList.remove("visible");
    controls.setAttribute("aria-hidden", "true");
    touchInput.left = touchInput.right = touchInput.up = touchInput.attack = touchInput.extra = false;
    controls.querySelectorAll("button.pressed").forEach((b) => b.classList.remove("pressed"));
  }
}

function setupMobileControls() {
  bindHoldButton(document.getElementById("btn-left"), "left");
  bindHoldButton(document.getElementById("btn-right"), "right");
  bindHoldButton(document.getElementById("btn-jump"), "up");
  bindHoldButton(document.getElementById("btn-attack"), "attack");
  bindHoldButton(document.getElementById("btn-extra"), "extra");
  document.body.addEventListener(
    "touchmove",
    (e) => {
      if (e.target.closest("#mobile-controls") || e.target.tagName === "CANVAS") {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

function enlargeTextHitArea(textObj, padX = 24, padY = 16) {
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


class Projectile extends Phaser.Physics.Arcade.Sprite{
  constructor(scene, x, y){
    super(scene, x, y, 'fire1');
  }

  fire(x, y, dir = 1){
    this.setActive(true);
    this.setVisible(true);
    if (this.body) {
      this.body.enable = true;
      this.body.reset(x, y);
      this.body.allowGravity = false;
      if (this.body.setAllowGravity) this.body.setAllowGravity(false);
    }
    // Bigger bolt so it reads next to the scaled mage/knights
    this.setScale(2.4);
    this.setVelocityY(0);
    this.setAcceleration(0, 0);
    // Straight horizontal flight across the level
    const speed = 420;
    this.setVelocityX(dir * speed);
    this.setFlipX(dir < 0);
    if (this.anims) {
      this.anims.play('fire', true);
    }
  }
}

class ProjectileGroup extends Phaser.Physics.Arcade.Group{
  constructor(scene){
    super(scene.physics.world, scene);

    this.createMultiple({
      classType: Projectile,
      frameQuantity: 30,
      active: false,
      visible: false,
      key: 'fire1',
    })
  }

  fireProjectile(x,y){
    const projectile = this.getFirstDead(false)
    if(projectile){
      projectile.fire(x,y)
    }
  }

}

// Extra Attack fire wave — separate VFX that travels out from the staff
class SlamWave extends Phaser.Physics.Arcade.Sprite{
  constructor(scene, x, y){
    super(scene, x, y, 'fireExtra1');
  }

  refreshHitbox(){
    if (!this.body) return;
    // Tight leading-edge hitbox (128 source); scale applies on top
    const w = 40;
    const h = 52;
    this.body.setSize(w, h);
    if (this.flipX) {
      this.body.setOffset(10, 38);
    } else {
      this.body.setOffset(128 - w - 10, 38);
    }
  }

  despawn(){
    this.off('animationcomplete-fireExtraTravel');
    this.off('animationcomplete-fireExtraImpact');
    if (this.anims) this.anims.stop();
    this.setActive(false);
    this.setVisible(false);
    this.setData('impacting', false);
    this.setVelocity(0, 0);
    if (this.body) {
      this.body.stop();
      this.body.enable = false;
    }
  }

  launch(x, y, dir = 1){
    this.setActive(true);
    this.setVisible(true);
    this.setAlpha(1);
    this.setDepth(50);
    this.setData('impacting', false);
    this.setTexture('fireExtra1');
    this.setScale(2.6);
    this.setFlipX(dir < 0);

    if (this.body) {
      this.body.enable = true;
      this.body.allowGravity = false;
      if (this.body.setAllowGravity) this.body.setAllowGravity(false);
      this.body.reset(x, y);
    }
    this.refreshHitbox();
    this.setAcceleration(0, 0);
    this.setVelocityY(0);
    this.setVelocityX(dir * 360);

    // Play fire_extra1..3, then hold on fire_extra3 while traveling
    this.off('animationcomplete-fireExtraTravel');
    this.off('animationcomplete-fireExtraImpact');
    this.once('animationcomplete-fireExtraTravel', () => {
      if (!this.active || this.getData('impacting')) return;
      if (this.anims) this.anims.stop();
      this.setTexture('fireExtra3');
      this.setScale(2.6);
      this.setVisible(true);
      this.setAlpha(1);
      if (this.body && !this.getData('impacting')) {
        this.body.enable = true;
        this.refreshHitbox();
        const speed = 360;
        this.setVelocityX(this.flipX ? -speed : speed);
        this.setVelocityY(0);
      }
    });
    if (this.anims) {
      this.anims.play('fireExtraTravel', true);
    } else {
      this.setTexture('fireExtra3');
      this.refreshHitbox();
    }
  }

  // Enemy hitbox entered: stop and play fire_extra4..9
  beginImpact(){
    if (this.getData('impacting')) return;
    this.setData('impacting', true);
    this.setVelocity(0, 0);
    this.setAcceleration(0, 0);
    if (this.body) {
      this.body.stop();
      this.body.enable = false;
    }
    this.off('animationcomplete-fireExtraTravel');
    this.off('animationcomplete-fireExtraImpact');
    this.setVisible(true);
    this.setAlpha(1);
    this.setDepth(50);
    this.setScale(2.6);

    this.once('animationcomplete-fireExtraImpact', () => {
      this.despawn();
    });
    if (this.anims) {
      this.anims.stop();
      this.anims.play('fireExtraImpact', true);
    } else {
      this.despawn();
    }
  }
}

class SlamWaveGroup extends Phaser.Physics.Arcade.Group{
  constructor(scene){
    super(scene.physics.world, scene);
    this.createMultiple({
      classType: SlamWave,
      frameQuantity: 8,
      active: false,
      visible: false,
      key: 'fireExtra1',
    });
    this.children.each((wave) => {
      if (wave.body) wave.body.enable = false;
      wave.setActive(false);
      wave.setVisible(false);
    });
  }
}

const MENU_COLORS = {
  teal: 0x2a9191,
  tealDeep: 0x1f6e6e,
  tealLite: 0x3aabb0,
  cream: 0xfff8e7,
  ink: 0x1a2424,
  fire: 0x912a2a,
  slam: 0x785014,
};

function getMenuLayout(scene) {
  const WORLD_W = 1890;
  const WORLD_H = 890;
  const cx = 1000;
  const cy = 445;
  const canvas = scene.game?.canvas;
  const cssW = (canvas && canvas.clientWidth) || scene.scale.displaySize?.width || WORLD_W;
  const cssH = (canvas && canvas.clientHeight) || scene.scale.displaySize?.height || WORLD_H;
  const ds = Math.min(cssW / WORLD_W, cssH / WORLD_H) || 1;
  const compact = ds < 0.55;

  // Desktop: fixed world sizes matching the approved enlarged wordmark hierarchy.
  if (!compact) {
    return {
      cx,
      cy,
      ds,
      compact: false,
      titleSize: 118,
      ribbonFont: 22,
      ribbonPadX: 28,
      ribbonPadY: 10,
      startW: 300,
      startH: 58,
      instrW: 230,
      instrH: 50,
      gap: 20,
      strokeTitle: 9,
    };
  }

  // Mobile / letterbox: design in CSS px to match approved mobile mock, then → world.
  // Strip CSS height is the visible game band (FIT letterbox).
  const stripCss = Math.max(WORLD_H * ds, 1);
  // Mock: TITLE dominates the band; Start ~48 CSS; Instructions secondary; small margins.
  const usable = stripCss * 0.92;
  let titleCss = usable * 0.36; // wordmark hierarchy — largest element
  let ribbonCss = usable * 0.08;
  let startCss = Math.min(52, Math.max(46, usable * 0.22));
  let instrCss = Math.min(40, Math.max(32, usable * 0.135));
  let gapCss = usable * 0.035;
  // Gaps appear 3x (title→ribbon, ribbon→start, start→instr)
  const sum = () => titleCss + ribbonCss + startCss + instrCss + gapCss * 3;
  let guard = 0;
  while (sum() > usable && guard < 24) {
    guard += 1;
    const s = usable / sum();
    // Protect title hierarchy — shrink CTAs/gaps more than the wordmark.
    titleCss *= Math.pow(s, 0.35);
    ribbonCss *= s;
    startCss *= Math.pow(s, 1.15);
    instrCss *= Math.pow(s, 1.15);
    gapCss *= s;
  }
  // Prefer Start ≥ ~44 CSS px when the strip still has room.
  if (startCss < 44 && usable - sum() > 2) {
    startCss += Math.min(44 - startCss, usable - sum());
  }

  const toWorld = (css) => Math.round(css / ds);
  const titleSize = Math.max(56, toWorld(titleCss));
  const startH = Math.max(40, toWorld(startCss));
  const startW = Math.round(Math.min(WORLD_W * 0.42, startH * 5.2));
  const instrH = Math.max(34, toWorld(instrCss));
  const instrW = Math.round(Math.min(WORLD_W * 0.34, instrH * 4.8));
  const ribbonFont = Math.max(12, toWorld(ribbonCss * 0.55));
  const ribbonPadX = Math.max(12, toWorld(ribbonCss * 0.35));
  const ribbonPadY = Math.max(5, toWorld(ribbonCss * 0.22));
  const gap = Math.max(8, toWorld(gapCss));

  return {
    cx,
    cy,
    ds,
    compact: true,
    titleSize,
    ribbonFont,
    ribbonPadX,
    ribbonPadY,
    startW,
    startH,
    instrW,
    instrH,
    gap,
    strokeTitle: Math.max(5, Math.round(titleSize * 0.08)),
  };
}

function drawPill(g, w, h, opts) {
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

function makePillButton(scene, x, y, label, style) {
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

function buildKeyChip(scene, x, y, label, kind) {
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

function buildActionRow(scene, x, y, tag, tagColor, desc) {
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

function openInstructionsOverlay(scene) {
  if (scene._instructionsOverlay) {
    scene._instructionsOverlay.destroy(true);
    scene._instructionsOverlay = null;
  }

  const overlay = scene.add.container(0, 0);
  overlay.setDepth(200);
  scene._instructionsOverlay = overlay;

  const dim = scene.add.rectangle(1000, 400, 1890, 890, 0x0a1010, 0.55);
  dim.setInteractive(); // block clicks to menu beneath
  overlay.add(dim);

  const panelW = 720;
  const panelH = 420;
  const panelX = 1000;
  const panelY = 400;
  const panelBg = scene.add.graphics();
  panelBg.fillGradientStyle(0xfff8e7, 0xfff8e7, 0xf3e6c8, 0xf3e6c8, 1);
  panelBg.fillRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 16);
  panelBg.lineStyle(3, MENU_COLORS.ink, 0.45);
  panelBg.strokeRoundedRect(panelX - panelW / 2, panelY - panelH / 2, panelW, panelH, 16);
  overlay.add(panelBg);

  const title = scene.add
    .text(panelX - panelW / 2 + 28, panelY - panelH / 2 + 28, 'How to play', {
      fontFamily: 'Cinzel, serif',
      fontSize: '32px',
      fontStyle: '900',
      color: '#1a2424',
    })
    .setOrigin(0, 0.5);
  overlay.add(title);

  const closeBtn = makePillButton(scene, panelX + panelW / 2 - 70, panelY - panelH / 2 + 28, 'Close', {
    width: 110,
    height: 40,
    variant: 'danger',
    fontSize: 16,
    depth: 210,
  });
  overlay.add(closeBtn);

  const pagesRoot = scene.add.container(0, 0);
  overlay.add(pagesRoot);

  const pages = [];
  // Page 1 — controls
  {
    const c = scene.add.container(0, 0);
    const keyPanel = scene.add.graphics();
    const kx = panelX - panelW / 2 + 28;
    const ky = panelY - 70;
    const kw = 320;
    const kh = 200;
    keyPanel.fillStyle(MENU_COLORS.ink, 1);
    keyPanel.fillRoundedRect(kx, ky, kw, kh, 12);
    c.add(keyPanel);
    buildKeyChip(scene, kx + 40, ky + 48, '<', 'move').forEach((o) => c.add(o));
    buildKeyChip(scene, kx + 96, ky + 48, '>', 'move').forEach((o) => c.add(o));
    buildKeyChip(scene, kx + 210, ky + 48, 'SPACE', 'move').forEach((o) => c.add(o));
    buildKeyChip(scene, kx + 56, ky + 110, 'F', 'fire').forEach((o) => c.add(o));
    buildKeyChip(scene, kx + 120, ky + 110, 'E', 'slam').forEach((o) => c.add(o));
    c.add(
      scene.add
        .text(kx + 16, ky + kh - 36, 'Custom diagram — no stock watermark.\nMobile: on-screen JUMP / FIRE / SLAM.', {
          fontFamily: 'Nunito, system-ui, sans-serif',
          fontSize: '13px',
          fontStyle: '600',
          color: 'rgba(255,255,255,0.75)',
          lineSpacing: 4,
        })
        .setOrigin(0, 0)
    );
    const listX = panelX + 40;
    let ly = panelY - 55;
    buildActionRow(scene, listX, ly, 'MOVE', MENU_COLORS.teal, 'Left / Right').forEach((o) => c.add(o));
    ly += 42;
    buildActionRow(scene, listX, ly, 'JUMP', MENU_COLORS.teal, 'Space / Jump button').forEach((o) => c.add(o));
    ly += 42;
    buildActionRow(scene, listX, ly, 'FIRE', MENU_COLORS.fire, 'Shoot a bolt').forEach((o) => c.add(o));
    ly += 42;
    buildActionRow(scene, listX, ly, 'SLAM', MENU_COLORS.slam, 'Staff ground slam').forEach((o) => c.add(o));
    pages.push(c);
  }
  // Page 2 — goal
  {
    const c = scene.add.container(0, 0);
    c.add(
      scene.add
        .text(panelX, panelY - 40, 'Your quest', {
          fontFamily: 'Cinzel, serif',
          fontSize: '26px',
          fontStyle: '900',
          color: '#1a2424',
        })
        .setOrigin(0.5)
    );
    const lines = [
      '• Explore platforms and avoid falling',
      '• Defeat knights with FIRE or SLAM',
      '• Collect the key, then reach the door',
      '• Clear each stage to advance',
    ];
    lines.forEach((line, i) => {
      c.add(
        scene.add
          .text(panelX - 220, panelY + 10 + i * 36, line, {
            fontFamily: 'Nunito, system-ui, sans-serif',
            fontSize: '22px',
            fontStyle: '700',
            color: '#1a2424',
          })
          .setOrigin(0, 0.5)
      );
    });
    pages.push(c);
  }
  // Page 3 — tips
  {
    const c = scene.add.container(0, 0);
    c.add(
      scene.add
        .text(panelX, panelY - 40, 'Tips', {
          fontFamily: 'Cinzel, serif',
          fontSize: '26px',
          fontStyle: '900',
          color: '#1a2424',
        })
        .setOrigin(0.5)
    );
    const lines = [
      '• Hold SLAM extras for a stronger wave',
      '• FIRE travels straight — lead your shots',
      '• On phones, use on-screen controls',
      '• Landscape feels best; portrait still plays',
    ];
    lines.forEach((line, i) => {
      c.add(
        scene.add
          .text(panelX - 240, panelY + 10 + i * 36, line, {
            fontFamily: 'Nunito, system-ui, sans-serif',
            fontSize: '22px',
            fontStyle: '700',
            color: '#1a2424',
          })
          .setOrigin(0, 0.5)
      );
    });
    pages.push(c);
  }

  pages.forEach((p, i) => {
    pagesRoot.add(p);
    p.setVisible(i === 0);
  });

  let pageIndex = 0;
  const dots = [];
  const dotsY = panelY + panelH / 2 - 36;
  const dotsStartX = panelX - panelW / 2 + 40;
  for (let i = 0; i < 3; i++) {
    const d = scene.add.graphics();
    dots.push(d);
    overlay.add(d);
  }

  const paintDots = () => {
    dots.forEach((d, i) => {
      d.clear();
      const x = dotsStartX + i * 22;
      if (i === pageIndex) {
        d.fillStyle(MENU_COLORS.teal, 1);
        d.fillCircle(x, dotsY, 6);
        d.lineStyle(3, MENU_COLORS.teal, 0.35);
        d.strokeCircle(x, dotsY, 9);
      } else {
        d.fillStyle(MENU_COLORS.ink, 0.25);
        d.fillCircle(x, dotsY, 5);
      }
    });
  };
  paintDots();

  const prevBtn = makePillButton(scene, panelX + panelW / 2 - 210, dotsY, 'Previous', {
    width: 120,
    height: 40,
    variant: 'nav',
    fontSize: 15,
    depth: 210,
  });
  const nextBtn = makePillButton(scene, panelX + panelW / 2 - 70, dotsY, 'Next', {
    width: 110,
    height: 40,
    variant: 'navPrimary',
    fontSize: 15,
    depth: 210,
  });
  overlay.add(prevBtn);
  overlay.add(nextBtn);

  const showPage = (idx) => {
    pageIndex = Phaser.Math.Clamp(idx, 0, pages.length - 1);
    pages.forEach((p, i) => p.setVisible(i === pageIndex));
    paintDots();
    prevBtn.setAlpha(pageIndex === 0 ? 0.45 : 1);
    nextBtn.setLabel(pageIndex >= pages.length - 1 ? 'Done' : 'Next');
  };
  showPage(0);

  prevBtn.on('pointerup', () => {
    if (pageIndex > 0) showPage(pageIndex - 1);
  });
  nextBtn.on('pointerup', () => {
    if (pageIndex < pages.length - 1) showPage(pageIndex + 1);
    else {
      overlay.destroy(true);
      scene._instructionsOverlay = null;
    }
  });
    const closeOverlay = () => {
    if (!scene._instructionsOverlay) return;
    overlay.destroy(true);
    scene._instructionsOverlay = null;
    scene.events.emit('instructions-closed');
  };
  closeBtn.setOnActivate(closeOverlay);  return overlay;
}


// --- Menu DOM hit overlays (Android Chrome: Phaser canvas taps are unreliable) ---
function worldToCanvasCss(scene, wx, wy, ww, wh) {
  const canvas = scene.game.canvas;
  const rect = canvas.getBoundingClientRect();
  const sx = rect.width / 1890;
  const sy = rect.height / 890;
  return {
    left: rect.left + (wx - ww / 2) * sx,
    top: rect.top + (wy - wh / 2) * sy,
    width: ww * sx,
    height: wh * sy,
  };
}

function ensureMenuDomUi() {
  let root = document.getElementById('menu-dom-ui');
  if (root) return root;
  root = document.createElement('div');
  root.id = 'menu-dom-ui';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML =
    '<button type="button" id="menu-dom-start" aria-label="Start Game"></button>' +
    '<button type="button" id="menu-dom-instr" aria-label="Instructions"></button>';
  document.body.appendChild(root);
  return root;
}

function hideMenuDomUi() {
  const root = document.getElementById('menu-dom-ui');
  if (!root) return;
  root.classList.remove('show');
  root.setAttribute('aria-hidden', 'true');
  root.style.display = 'none';
}

function syncMenuDomUi(scene, startHit, instrHit, handlers) {
  const root = ensureMenuDomUi();
  const startBtn = document.getElementById('menu-dom-start');
  const instrBtn = document.getElementById('menu-dom-instr');
  if (!startBtn || !instrBtn) return;

  const place = (el, hit) => {
    const box = worldToCanvasCss(scene, hit.x, hit.y, hit.w, hit.h);
    el.style.left = `${box.left}px`;
    el.style.top = `${box.top}px`;
    el.style.width = `${Math.max(box.width, 44)}px`;
    el.style.height = `${Math.max(box.height, 44)}px`;
  };
  place(startBtn, startHit);
  place(instrBtn, instrHit);

  root.style.display = 'block';
  root.classList.add('show');
  root.setAttribute('aria-hidden', 'false');

  // Rebind once per sync (clone to drop old listeners)
  const rebind = (el, fn) => {
    const next = el.cloneNode(true);
    el.parentNode.replaceChild(next, el);
    const fire = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof fn === 'function') fn();
    };
    next.addEventListener('click', fire, { passive: false });
    next.addEventListener('pointerup', fire, { passive: false });
    next.addEventListener('touchend', fire, { passive: false });
    return next;
  };
  rebind(document.getElementById('menu-dom-start'), handlers.onStart);
  rebind(document.getElementById('menu-dom-instr'), handlers.onInstr);
}

const menuScene = {
  key: 'Menu',

  preload: function () {
    this.load.image('background', './img/nature_background.jpg');
  },

  create: function () {
    setMobileControlsVisible(false);
    // Don't let the rotate banner compete with menu taps.
    if (typeof dismissRotateHint === 'function') {
      try { dismissRotateHint(); } catch (e) {}
    }

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

      nodes.push(this.add.image(1000, 400, 'background'));

      const layout = getMenuLayout(this);
      const { cx, cy, titleSize, strokeTitle, ribbonFont, ribbonPadX, ribbonPadY, startW, startH, instrW, instrH, gap } =
        layout;

      // Measure stack, then center vertically inside the letterbox strip.
      const titleProbe = this.add
        .text(0, 0, 'MAGE HOPPER', {
          fontFamily: 'Cinzel, serif',
          fontSize: `${titleSize}px`,
          fontStyle: '900',
        })
        .setVisible(false);
      const ribbonProbe = this.add
        .text(0, 0, 'A PLATFORM ADVENTURE', {
          fontFamily: 'Nunito, system-ui, sans-serif',
          fontSize: `${ribbonFont}px`,
          fontStyle: '800',
        })
        .setVisible(false);
      const titleH = titleProbe.height;
      const rh = ribbonProbe.height + ribbonPadY;
      titleProbe.destroy();
      ribbonProbe.destroy();

      const stackH = titleH + Math.round(gap * 0.45) + rh + gap + startH + Math.round(gap * 0.85) + instrH;
      const topY = cy - stackH / 2;
      const titleY = topY + titleH / 2;

      const title = this.add
        .text(cx, titleY, 'MAGE HOPPER', {
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
        .setOrigin(0.5)
        .setDepth(10);
      nodes.push(title);

      const ribbonText = this.add
        .text(0, 0, 'A PLATFORM ADVENTURE', {
          fontFamily: 'Nunito, system-ui, sans-serif',
          fontSize: `${ribbonFont}px`,
          fontStyle: '800',
          color: 'rgba(26,36,36,0.72)',
        })
        .setOrigin(0.5);
      const rw = ribbonText.width + ribbonPadX * 2;
      const ribbonY = titleY + titleH / 2 + rh / 2 + Math.round(gap * 0.45);
      const ribbonG = this.add.graphics();
      ribbonG.fillStyle(MENU_COLORS.cream, 0.55);
      ribbonG.fillRoundedRect(cx - rw / 2, ribbonY - rh / 2, rw, rh, 3);
      ribbonText.setPosition(cx, ribbonY);
      ribbonG.setDepth(10);
      ribbonText.setDepth(11);
      nodes.push(ribbonG, ribbonText);

      const startY = ribbonY + rh / 2 + gap + startH / 2;
      const startBtn = makePillButton(this, cx, startY, 'Start Game', {
        width: startW,
        height: startH,
        variant: 'primary',
        fontSize: Math.round(startH * 0.38),
        depth: 20,
      });
      const onStart = () => {
        hideMenuDomUi();
        this.scene.start('Game');
      };
      startBtn.setOnActivate(onStart);
      nodes.push(startBtn);

      const instrY = startY + startH / 2 + gap * 0.85 + instrH / 2;
      const instrBtn = makePillButton(this, cx, instrY, 'Instructions', {
        width: instrW,
        height: instrH,
        variant: 'secondary',
        fontSize: Math.round(instrH * 0.38),
        depth: 20,
      });
      const onInstr = () => {
        hideMenuDomUi();
        openInstructionsOverlay(this);
      };
      instrBtn.setOnActivate(onInstr);
      nodes.push(instrBtn);

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

      // Invisible DOM hit targets aligned to visible pills — reliable on Android Chrome.
      const pad = Math.max(10, Math.round(startH * 0.15));
      syncMenuDomUi(
        this,
        { x: cx, y: startY, w: startW + pad * 2, h: startH + pad * 2 },
        { x: cx, y: instrY, w: instrW + pad * 2, h: instrH + pad * 2 },
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

const gameOverScene = {
  key: 'GameOver',
  preload: function () {},
  create: function () {
    setMobileControlsVisible(false);
    this.add.text(750, 300, 'Game Over!!', { fontSize: '72px', fill: '#fff' });

    const playAgain = this.add
      .text(780, 450, 'Play Again?', {
        fontSize: '48px',
        fill: '#fff',
        fontFamily: 'Roboto',
      });
    enlargeTextHitArea(playAgain, 28, 20);

    playAgain.on('pointerdown', () => {
      this.scene.start('Game'); // Transition to game scene
      lives = 3;
      level = 1;
    });

    playAgain.setInteractive().on('pointerover', () => {
      playAgain.setShadow(2, 2, 'rgba(42, 145, 113,0.5)', 2);
      playAgain.setColor('rgba(42, 145, 145,0.9)');
    });
    playAgain.setInteractive().on('pointerout', () => {
      playAgain.setShadow(0, 0, 'rgba(0,0,0,0.5)', 1);
      playAgain.setColor('rgb(255,255,255)');
    });

    const quit = this.add
      .text(1050, 450, 'Quit', {
        fontSize: '48px',
        fill: '#fff',
        fontFamily: 'Roboto',
      });
    enlargeTextHitArea(quit, 28, 20);

    quit.on('pointerdown', () => {
      lives = 3;
      level = 1;
      collectedKey = false;
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

const levelWinScene = {
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

    const nextLevel = this.add
      .text(870, 500, `Level: ${level}`, {
        fontFamily: 'Roboto',
        fontSize: '48px',
        fill: '#000',
      });
    enlargeTextHitArea(nextLevel, 28, 20);

    nextLevel.on('pointerdown', () => {
      this.scene.start('Game'); // Transition to game scene
      lives = 3;
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
const gameWinScene = {
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

    const playAgain = this.add
      .text(700, 450, 'Play Again?', {
        fontSize: '48px',
        fill: '#000',
        fontFamily: 'Roboto',
      });
    enlargeTextHitArea(playAgain, 28, 20);

    playAgain.on('pointerdown', () => {
      this.scene.start('Game'); // Transition to game scene
      lives = 3;
      level = 1;
    });

    playAgain.setInteractive().on('pointerover', () => {
      playAgain.setShadow(2, 2, 'rgba(42, 145, 113,0.5)', 2);
      playAgain.setColor('rgba(42, 145, 145,0.9)');
    });
    playAgain.setInteractive().on('pointerout', () => {
      playAgain.setShadow(0, 0, 'rgba(0,0,0,0.5)', 1);
      playAgain.setColor('rgb(0,0,0)');
    });

    const quit = this.add
      .text(1000, 450, 'Main Menu', {
        fontSize: '48px',
        fill: '#000',
        fontFamily: 'Roboto',
      });
    enlargeTextHitArea(quit, 28, 20);

    quit.on('pointerdown', () => {
      this.scene.start('Menu'); // Transition to game scene
    });
    console.log('Initial size:', quit.displayWidth, quit.displayHeight);
    console.log('Initial offset:', quit.x, quit.y);

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

const gameScene = {
  key: 'Game',

  preload: function () {
    this.load.image('background', './img/nature_background.jpg');
    this.load.image('platform', './img/grass_platform.png');
    this.load.image('key', './img/key.png');
    this.load.image('door', './img/door.png');

    // Load player image
    this.load.image('player', './Mage/mage.png');
    //Load Enemy
    this.load.image('enemy', './Knight/knight.png');

    // Load running animation frames
    for (let i = 1; i <= 8; i++) {
      this.load.image('run' + i, './Mage/Run/run' + i + '.png');
    }
    //load enemy running frames
    for (let i = 1; i <= 8; i++) {
      this.load.image('enemyRun' + i, './Knight/Run/run' + i + '.png');
    }

    // Load jumping animation frames
    for (let i = 1; i <= 7; i++) {
      this.load.image('jump' + i, './Mage/Jump/jump' + i + '.png');
    }
    //load enemy jumping frames
    for (let i = 1; i <= 7; i++) {
      this.load.image('enemyJump' + i, './Knight/Jump/jump' + i + '.png');
    }

    //Load attack animation
    for (let i = 1; i <= 7; i++) {
      this.load.image('attack' + i, './Mage/Attack/attack' + i + '.png');
    }
    // Load Fire animation
    for (let i = 1; i <= 9; i++) {
      this.load.image('fire' + i, './Mage/Fire/fire' + i + '.png');
    }
    // Death + hurt
    for (let i = 1; i <= 10; i++) {
      this.load.image('death' + i, './Mage/Death/death' + i + '.png');
    }
    for (let i = 1; i <= 4; i++) {
      this.load.image('hurt' + i, './Mage/Hurt/hurt' + i + '.png');
    }
    // Extra attack: staff swing then fire burst (Attack_Extra + Fire_Extra)
    for (let i = 0; i <= 6; i++) {
      this.load.image('attackExtra' + i, './Mage/Attack_Extra/attack_extra' + i + '.png');
    }
    for (let i = 1; i <= 9; i++) {
      this.load.image('fireExtra' + i, './Mage/Fire_Extra/fire_extra' + i + '.png');
    }
  },

  create: function () {
    hideMenuDomUi();

    setMobileControlsVisible(true);
    this.add.image(1000, 400, 'background');

    //level indicator
    levelIndicator = this.add.text(16, 16, `Level: ${level}`, {
      fontSize: '32px',
      fill: '#000',
    });

    //Life Indicator
    lifeIndicator = this.add.text(1700, 16, `Lives: ${lives}`, {
      fontSize: '32px',
      fill: 'blue',
    });

    //Player Speed Indicator
    playerSpeedIndicator = this.add.text(500, 16, `Player Speed: 160`, {
      fontSize: '32px',
      fill: 'green',
    });

    //Enemy Speed Indicator
    enemySpeedIndicator = this.add.text(
      900,
      16,
      `Enemy Speed: ${parseInt(enemySpeed * (1 + level / 8.3))}`,
      {
        fontSize: '32px',
        fill: 'red',
      }
    );

    //key spawn points for each level
    this.keyArray = [
      { x: 170, y: 265 },
      { x: 1370, y: 465 },
      { x: 1670, y: 750 },
      { x: 170, y: 265 },
      { x: 1020, y: 65 },
    ];

    //add key
    key = this.physics.add
      .sprite(this.keyArray[level - 1].x, this.keyArray[level - 1].y, 'key')
      .setScale(0.2);
    key.setBounce(1.0);
    key.body.setSize(key.width * 0.7, key.height * 1);
    key.body.setOffset(key.width * 0.15, key.height * 0.2);

    //door spawn points for each level
    this.doorArray = [
      { x: 1650, y: 253 },
      { x: 150, y: 253 },
      { x: 850, y: 453 },
      { x: 1650, y: 778 },
      { x: 150, y: 778 },
    ];

    //add door
    door = this.physics.add
      .sprite(this.doorArray[level - 1].x, this.doorArray[level - 1].y, 'door')
      .setScale(0.1);
    door.body.setSize(door.width * 0.5, door.height * 0.9);

    platforms = this.physics.add.staticGroup();

    //ground level
    ground = platforms.create(950, 990).refreshBody();
    ground.body.setSize(1900, 240);

    // first stage
    for (let i = 1; i < 3; i++) {
      platforms
        .create(100 + 500 * i, 720, 'platform')
        .setScale(0.25)
        .refreshBody()
        .setSize(1000 * 0.25, 40 * 0.25);
    }

    // second stage
    for (let i = 0; i < 3; i++) {
      platforms
        .create(350 + 500 * i, 550, 'platform')
        .setScale(0.25)
        .refreshBody()
        .setSize(1000 * 0.25, 40 * 0.25);
    }

    //third stage
    for (let i = 0; i < 4; i++) {
      platforms
        .create(150 + 500 * i, 350, 'platform')
        .setScale(0.25)
        .refreshBody()
        .setSize(1000 * 0.25, 40 * 0.25);
    }

    //fourth stage spawns at level 5
    if (level === 5) {
      for (let i = 1; i < 3; i++) {
        platforms
          .create(500 * i, 150, 'platform')
          .setScale(0.25)
          .refreshBody()
          .setSize(1000 * 0.25, 40 * 0.25);
      }
    }

    //create player
    player = this.physics.add.sprite(150, 800, 'player').setScale(1.5);
    player.setBounce(0.1);
    player.setCollideWorldBounds(true);


    //fix player collision-box origin and size
    player.body.setSize(player.width * 0.43, player.height * 0.45);
    player.body.setOffset(player.width * 0.15, player.height * 0.43);

    //create enemy
    enemy = this.physics.add.sprite(850, 450, 'enemy').setScale(1.5);
    enemy.setCollideWorldBounds(true);
    //fix enemy collision-box origin and size
    enemy.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
    enemy.body.setOffset(enemy.width * 0.15, enemy.height * 0.43);

    //create enemy2
    enemy2 = this.physics.add.sprite(1150, 272, 'enemy').setScale(1.5);
    enemy2.setCollideWorldBounds(true);
    //fix enemy collision-box origin and size
    enemy2.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
    enemy2.body.setOffset(enemy.width * 0.15, enemy.height * 0.43);

    //create enemy3
    enemy3 = this.physics.add.sprite(1650, 272, 'enemy').setScale(1.5);
    enemy3.setCollideWorldBounds(true);
    //fix enemy collision-box origin and size
    enemy3.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
    enemy3.body.setOffset(enemy.width * 0.15, enemy.height * 0.43);

    // Fireball pool (Projectile / ProjectileGroup)
    this.fireballs = new ProjectileGroup(this);
    // Extra Attack wave pool (travels out; not played on the player)
    this.slamWaves = new SlamWaveGroup(this);
    // Fireballs fly straight; no platform bounce/stop — cleaned up when off-screen
    const defeatEnemyHit = (enemyHit) => {
      enemyHit.setData("defeated", true);
      enemyHit.setVelocity(0, 0);
      enemyHit.disableBody(true, true);
      enemyHit.setActive(false);
      enemyHit.setVisible(false);
    };

    const hitEnemyWithFire = (projectile, enemyHit) => {
      if (!enemyHit || !enemyHit.active || enemyHit.getData("defeated")) {
        return;
      }
      projectile.setActive(false);
      projectile.setVisible(false);
      if (projectile.body) {
        projectile.body.stop();
        projectile.body.enable = false;
      }
      defeatEnemyHit(enemyHit);
    };

    // Wave entered enemy hitbox: defeat foe, stop wave, play remaining Fire_Extra
    const hitEnemyWithSlamWave = (wave, enemyHit) => {
      if (!enemyHit || !enemyHit.active || enemyHit.getData("defeated")) {
        return;
      }
      if (wave.getData("impacting")) {
        return;
      }
      defeatEnemyHit(enemyHit);
      if (typeof wave.beginImpact === "function") {
        wave.beginImpact();
      } else {
        wave.setActive(false);
        wave.setVisible(false);
        if (wave.body) {
          wave.body.stop();
          wave.body.enable = false;
        }
      }
    };

    const slamWaveCanHit = (wave, enemyHit) => {
      return (
        !!wave &&
        wave.active &&
        !wave.getData("impacting") &&
        !!wave.body &&
        wave.body.enable &&
        !!enemyHit &&
        enemyHit.active &&
        !enemyHit.getData("defeated")
      );
    };

    this.physics.add.overlap(this.fireballs, enemy, hitEnemyWithFire, null, this);
    this.physics.add.overlap(this.fireballs, enemy2, hitEnemyWithFire, null, this);
    this.physics.add.overlap(this.fireballs, enemy3, hitEnemyWithFire, null, this);
    this.physics.add.overlap(this.slamWaves, enemy, hitEnemyWithSlamWave, slamWaveCanHit, this);
    this.physics.add.overlap(this.slamWaves, enemy2, hitEnemyWithSlamWave, slamWaveCanHit, this);
    this.physics.add.overlap(this.slamWaves, enemy3, hitEnemyWithSlamWave, slamWaveCanHit, this);

    // Reset level-exit / i-frame flags for a fresh scene start
    this.isExitingLevel = false;
    this.invulnerableUntil = 0;

    // Set up running animation frames
    let runFrames = [];
    for (let i = 1; i <= 8; i++) {
      runFrames.push({ key: 'run' + i });
    }

    //let enemy run animation frame
    let enemyRunFrames = [];
    for (let i = 1; i <= 8; i++) {
      enemyRunFrames.push({ key: 'enemyRun' + i });
    }

    //set up jumping animation frames
    let jumpFrames = [];
    for (let i = 1; i <= 3; i++) {
      jumpFrames.push({ key: 'jump' + i });
    }

    //peak frame for jumping animation
    let peakFrame = [{ key: 'jump4' }];

    // player fall animation
    let fallFrames = [];
    for (let i = 5; i <= 7; i++) {
      fallFrames.push({ key: 'jump' + i });
    }

    let lastFallFrame = [{ key: 'jump6' }];
    let landing = [{ key: 'jump7' }];

    let attackFrames = [];
    for (let i = 1; i <= 7; i++) {
      attackFrames.push({ key: 'attack' + i });
    }

    let deathFrames = [];
    for (let i = 1; i <= 10; i++) {
      deathFrames.push({ key: 'death' + i });
    }

    let hurtFrames = [];
    for (let i = 1; i <= 4; i++) {
      hurtFrames.push({ key: 'hurt' + i });
    }

    let attackExtraFrames = [];
    for (let i = 0; i <= 6; i++) {
      attackExtraFrames.push({ key: 'attackExtra' + i });
    }
    let fireExtraFrames = [];
    for (let i = 1; i <= 9; i++) {
      fireExtraFrames.push({ key: 'fireExtra' + i });
    }

    let fireFrames = [];
    for (let i = 1; i <= 9; i++) {
      fireFrames.push({ key: 'fire' + i });
    }

    let enemyJumpFrames = [];
    for (let i = 1; i <= 7; i++) {
      enemyJumpFrames.push({ key: 'enemyJump' + i });
    }

    //base animation
    this.anims.create({
      key: 'turn',
      frames: [{ key: 'player' }],
      frameRate: 10,
    });

    // Create the 'left' animation
    this.anims.create({
      key: 'left',
      frames: runFrames,
      frameRate: 10,
      repeat: -1,
      // Set flipX to true when playing the 'left' animation
      onStart: function () {
        player.setFlipX(true);
      },
      // Reset flipX to false when the 'left' animation ends
      onComplete: function () {
        player.setFlipX(false);
      },
    });

    //right animation
    this.anims.create({
      key: 'right',
      frames: runFrames,
      frameRate: 10,
      repeat: -1,
    });

    //jump animation
    this.anims.create({
      key: 'jump',
      frames: jumpFrames,
      frameRate: 10,
      repeat: 0,
    });

    // peak animation
    this.anims.create({
      key: 'peak',
      frames: peakFrame,
      frameRate: 1,
      repeat: 0,
    });

    //fall animation
    this.anims.create({
      key: 'fall',
      frames: fallFrames,
      frameRate: 10,
      repeat: 0,
    });

    // last fall frame
    this.anims.create({
      key: 'lastFallFrame',
      frames: lastFallFrame,
      frameRate: 1,
      repeat: 0,
    });

    // Landing
    this.anims.create({
      key: 'landing',
      frames: landing,
      frameRate: 1,
      repeat: 0,
    });

    // attack animation
    this.anims.create({
      key: 'attack',
      frames: attackFrames,
      frameRate: 10,
      repeat: 0,
    });

    this.anims.create({
      key: 'death',
      frames: deathFrames,
      frameRate: 10,
      repeat: 0,
    });

    this.anims.create({
      key: 'hurt',
      frames: hurtFrames,
      frameRate: 10,
      repeat: 0,
    });

    this.anims.create({
      key: 'attackExtra',
      frames: attackExtraFrames,
      frameRate: 10,
      repeat: 0,
    });

    // Fire_Extra wave VFX (spawned as a traveling sprite, not on the player)
    // Travel holds on fire_extra3; impact plays fire_extra4..9 on enemy hit
    this.anims.create({
      key: 'fireExtraTravel',
      frames: fireExtraFrames.slice(0, 3),
      frameRate: 14,
      repeat: 0,
    });
    this.anims.create({
      key: 'fireExtraImpact',
      frames: fireExtraFrames.slice(3),
      frameRate: 12,
      repeat: 0,
    });

    // fire animation — full flame loop while the bolt travels
    this.anims.create({
      key: 'fire',
      frames: fireFrames,
      frameRate: 14,
      repeat: -1,
    });

    // enemy base animation
    this.anims.create({
      key: 'enemyTurn',
      frames: [{ key: 'enemy' }],
      frameRate: 10,
    });

    //create the enemy runing right animation
    this.anims.create({
      key: 'enemyRunRight',
      frames: enemyRunFrames,
      frameRate: 10,
      repeat: -1,
    });

    //create the enemy runing left animation
    // Facing is set per-enemy in enemyFollows (do not hardcode enemy flip here)
    this.anims.create({
      key: 'enemyRunLeft',
      frames: enemyRunFrames,
      frameRate: 10,
      repeat: -1,
    });

    //jump animation
    this.anims.create({
      key: 'enemyJump',
      frames: [enemyJumpFrames[1]],
      frameRate: 10,
      repeat: -1,
    });

    //fall animation
    this.anims.create({
      key: 'enemyFall',
      frames: [enemyJumpFrames[5]],
      frameRate: 4,
      repeat: -1,
    });

    //add collision between objects in the game
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(enemy, platforms);
    this.physics.add.collider(enemy2, platforms);
    this.physics.add.collider(enemy3, platforms);
    this.physics.add.collider(key, platforms);
    this.physics.add.collider(key, ground);
    this.physics.add.collider(door, platforms);
    this.physics.add.collider(door, ground);

    function playerDies(player, enemyHit) {
      if (!enemyHit || !enemyHit.active || enemyHit.getData("defeated")) {
        return;
      }
      // Brief invulnerability after a hit so colliders cannot chain-kill
      if (this.invulnerableUntil && this.time.now < this.invulnerableUntil) {
        return;
      }
      if (playerState === 'dying' || playerState === 'hurt') {
        return;
      }
      this.invulnerableUntil = this.time.now + 1800;

      player.setVelocity(0, 0);
      if (player.body) {
        player.body.enable = false;
      }

      if (lives > 1) {
        lives -= 1;
        lifeIndicator.setText(`Lives: ${lives}`);
        playerState = 'hurt';
        player.anims.play('hurt', true);
        player.once('animationcomplete-hurt', () => {
          player.enableBody(
            true,
            Math.floor(Math.random() * 1700),
            800,
            true,
            true
          );
          player.setBounce(0.1);
          player.setCollideWorldBounds(true);
          player.setAlpha(0.5);
          player.body.setSize(player.width * 0.43, player.height * 0.45);
          player.body.setOffset(player.width * 0.15, player.height * 0.43);
          playerState = 'idle';
          this.time.delayedCall(1500, () => {
            if (player && player.active) {
              player.setAlpha(1);
            }
          });
        });
      } else {
        lives -= 1;
        lifeIndicator.setText(`Lives: ${lives}`);
        playerState = 'dying';
        setMobileControlsVisible(false);
        player.anims.play('death', true);
        player.once('animationcomplete-death', () => {
          this.scene.start('GameOver');
        });
      }
    }

    function collectKey(player, key) {
      // Remove the key sprite from the scene
      collectedKey = true;
      key.destroy();
    }


    function enterDoor(player, doorSprite) {
      if (collectedKey !== true || this.isExitingLevel) {
        return;
      }
      this.isExitingLevel = true;
      // Create a fade-out effect
      this.cameras.main.fadeOut(500);
      // Wait for the fade-out to complete before advancing
      this.time.delayedCall(
        1000,
        function () {
          doorSprite.destroy();
          collectedKey = false;
          level += 1;
          if (level <= 5) {
            this.scene.start('NextLevel');
          } else {
            this.scene.start('GameWin');
          }
        },
        [],
        this
      );
    }

        //key commands
    wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    //PLayers dies and respawns
    const enemyCanHurtPlayer = (playerObj, enemyObj) => {
      if (!enemyObj || !enemyObj.active || !enemyObj.body || !enemyObj.body.enable || enemyObj.getData("defeated")) {
        return false;
      }
      // While swinging FIRE / SLAM, knights cannot interrupt the attack
      if (playerState === "attacking" || playerState === "attackExtra") {
        return false;
      }
      return true;
    };
    this.physics.add.collider(player, enemy, playerDies, enemyCanHurtPlayer, this);
    this.physics.add.collider(player, enemy2, playerDies, enemyCanHurtPlayer, this);
    this.physics.add.collider(player, enemy3, playerDies, enemyCanHurtPlayer, this);
    //enables player to collect the key
    this.physics.add.overlap(player, key, collectKey, null, this);
    //player enters the door with key
    this.physics.add.overlap(player, door, enterDoor, null, this);



    playerState = 'idle'; // Initial player state
  },

  update: function () {
    const thisScene = this;
    cursors = this.input.keyboard.createCursorKeys();
    const leftHeld = cursors.left.isDown || aKey.isDown || touchInput.left;
    const rightHeld = cursors.right.isDown || dKey.isDown || touchInput.right;
    const upHeld = cursors.up.isDown || wKey.isDown || touchInput.up;
    const attackHeld = fKey.isDown || touchInput.attack;
    const extraHeld = (typeof eKey !== 'undefined' && eKey.isDown) || touchInput.extra;

    // Let hurt/death anims play without movement stealing control
    if (playerState === 'dying' || playerState === 'hurt') {
      if (thisScene.fireballs) {
        thisScene.fireballs.children.each((bolt) => {
          if (!bolt.active || !bolt.body) return;
          bolt.body.allowGravity = false;
          bolt.setVelocityY(0);
          if (bolt.x < -80 || bolt.x > 1970 || bolt.y < -80 || bolt.y > 980) {
            bolt.anims.stop();
            bolt.setActive(false);
            bolt.setVisible(false);
            bolt.body.stop();
            bolt.body.enable = false;
          }
        });
      }
      enemyFollows(enemy, this);
      enemyFollows(enemy2, this);
      enemyFollows(enemy3, this);
      return;
    }

    switch (playerState) {
      case 'idle':
        handleIdleState();
        break;
      case 'running':
        handleRunningState();
        break;
      case 'jumping':
        handleJumpingState();
        break;
      case 'falling':
        handleFallingState();
        break;
      case 'attacking':
        handleAttackingState();
        break;
      case 'attackExtra':
        handleAttackExtraState();
        break;
    }

    handleStateTransitions();

    function moveLeft() {
      player.setVelocityX(-160);
      player.setFlipX(true); // Flip the player when moving left
      player.body.setSize(player.width * 0.43, player.height * 0.45);
      player.body.setOffset(player.width * 0.42, player.height * 0.43);
    }

    function moveRight() {
      player.setVelocityX(160);
      player.setFlipX(false); // Reset flip when moving right
      player.body.setSize(player.width * 0.43, player.height * 0.45);
      player.body.setOffset(player.width * 0.15, player.height * 0.43);
    }

    // Handle Idle State
    function handleIdleState() {
      player.setVelocityX(0);
      player.anims.play('turn', true);

      // Transitions to running
      if (leftHeld) {
        playerState = 'running';
      } else if (rightHeld) {
        playerState = 'running';
      }
      // Transition to jumping
      if (upHeld && player.body.touching.down) {
        playerState = 'jumping';
      }
      // Transition to attacking
      if (attackHeld) {
        playerState = 'attacking';
      }
      if (extraHeld) {
        playerState = 'attackExtra';
      }
    }

    //Handle Running State
    function handleRunningState() {
      if (leftHeld) {
        player.setVelocityX(-160);
        // Play running left animation only if the player is on the ground
        if (player.body.touching.down) {
          player.anims.play('left', true);
        }
        player.setFlipX(true); // Flip the player when moving left
        player.body.setSize(player.width * 0.43, player.height * 0.45);
        player.body.setOffset(player.width * 0.42, player.height * 0.43);
      } else if (rightHeld) {
        player.setVelocityX(160);
        // Play running right animation only if the player is on the ground
        if (player.body.touching.down) {
          player.anims.play('right', true);
        }
        player.setFlipX(false); // Reset flip when moving right
        player.body.setSize(player.width * 0.43, player.height * 0.45);
        player.body.setOffset(player.width * 0.15, player.height * 0.43);
      }

      // Transition to idle
      if (!leftHeld && !rightHeld) {
        playerState = 'idle';
      }
      // Transition to jumping
      if (upHeld && player.body.touching.down) {
        playerState = 'jumping';
      }
      // Transition to attacking
      if (attackHeld) {
        playerState = 'attacking';
      }
      if (extraHeld) {
        playerState = 'attackExtra';
      }
    }

    function handleJumpingState() {
      if (
        upHeld && player.body.touching.down
      ) {
        player.setVelocityY(-350);
        player.anims.play('jump', true);
      }

      if (leftHeld) {
        moveLeft();
      } else if (rightHeld) {
        moveRight();
      }

      // modified jumping animation to check for rising and falling condition
      if (!player.body.touching.down && player.body.velocity.y === 0) {
        player.anims.play('peak', true);
      }
    }

    function handleFallingState() {
      if (!player.body.touching.down && player.body.velocity.y > 0) {
        player.anims.play('fall', true);
        if (!player.body.touching.down) {
          player.anims.play('lastFallFrame', true);
        }
      }

      if (player.body.touching.down && (leftHeld || rightHeld)) {
        playerState = 'running';
      } else if (player.body.touching.down) {
        playerState = 'idle';
      }
    }

    function handleAttackingState() {
      // Play attack first; release the bolt near the end of the staff extension
      if (!player.anims.isPlaying || player.anims.currentAnim.key !== 'attack') {
        player.anims.play('attack', true);
        player.setVelocityX(0);
        let boltReleased = false;

        const releaseBoltFromStaff = (anim, frame) => {
          if (!anim || anim.key !== 'attack' || boltReleased) return;
          // attack has 7 frames (0..6); release a bit earlier as the staff extends (~frame 3)
          if (frame.index < 3) return;
          boltReleased = true;
          const facingLeft = player.flipX;
          // Closer to the glowing staff tip
          const spawnX = player.x + (facingLeft ? -58 : 58);
          const spawnY = player.y - 22;
          const bolt = thisScene.fireballs.getFirstDead(false);
          if (bolt) {
            bolt.fire(spawnX, spawnY, facingLeft ? -1 : 1);
          }
        };

        player.on('animationupdate-attack', releaseBoltFromStaff);
        player.once('animationcomplete-attack', () => {
          player.off('animationupdate-attack', releaseBoltFromStaff);
          // Fallback if update events were sparse
          if (!boltReleased) {
            releaseBoltFromStaff(player.anims.currentAnim, { index: 6 });
          }
          playerState = 'idle';
        });
      }
    }

    function defeatEnemyWithMelee(enemyHit) {
      if (!enemyHit || !enemyHit.active || enemyHit.getData('defeated')) {
        return;
      }
      enemyHit.setData('defeated', true);
      enemyHit.setVelocity(0, 0);
      enemyHit.disableBody(true, true);
      enemyHit.setActive(false);
      enemyHit.setVisible(false);
    }

    function applyMeleeInFront() {
      const facingLeft = player.flipX;
      const reach = 110;
      const xMin = facingLeft ? player.x - reach : player.x;
      const xMax = facingLeft ? player.x : player.x + reach;
      [enemy, enemy2, enemy3].forEach((foe) => {
        if (!foe || !foe.active || foe.getData('defeated')) return;
        if (foe.x >= xMin && foe.x <= xMax && Math.abs(foe.y - player.y) < 90) {
          defeatEnemyWithMelee(foe);
        }
      });
    }

    function handleAttackExtraState() {
      // Extra Attack: play staff swing on the mage, then launch Fire_Extra as a traveling wave
      if (!player.anims.isPlaying || player.anims.currentAnim.key !== 'attackExtra') {
        player.anims.play('attackExtra', true);
        player.setVelocityX(0);
        let waveReleased = false;

        const releaseWaveFromStaff = (anim, frame) => {
          if (!anim || anim.key !== 'attackExtra' || waveReleased) return;
          // 7 frames (0..6); release near the end of the swing so anim plays first
          if (frame.index < 5) return;
          waveReleased = true;
          const facingLeft = player.flipX;
          const dir = facingLeft ? -1 : 1;
          const spawnX = player.x + (facingLeft ? -62 : 62);
          const spawnY = player.y - 18;
          const wave = thisScene.slamWaves.getFirstDead(false);
          if (wave) {
            wave.launch(spawnX, spawnY, dir);
          }
        };

        player.on('animationupdate-attackExtra', releaseWaveFromStaff);
        player.once('animationcomplete-attackExtra', () => {
          player.off('animationupdate-attackExtra', releaseWaveFromStaff);
          if (!waveReleased) {
            const facingLeft = player.flipX;
            const dir = facingLeft ? -1 : 1;
            const wave = thisScene.slamWaves.getFirstDead(false);
            if (wave) {
              wave.launch(
                player.x + (facingLeft ? -62 : 62),
                player.y - 18,
                dir
              );
            }
          }
          playerState = 'idle';
        });
      }
    }
    

    // Handle State Transitions
    function handleStateTransitions() {
      // Transition from jumping to falling
      if (playerState === 'jumping' && player.body.velocity.y > 0) {
        playerState = 'falling';
      }

      // Transition from falling to idle (when landing)
      if (playerState === 'falling' && player.body.touching.down) {
        playerState = 'idle';
      }
    }


    //function for all enemies
    function enemyFollows(enemy, scene) {
      // Skip defeated / inactive knights — otherwise setVelocity re-enables them
      if (!enemy || !enemy.active || enemy.getData("defeated") || !enemy.body || !enemy.body.enable) {
        return;
      }
      // Enemy animation for following the enemies on the y-axis
      //Enemy has a  delay jumping after player jumps
      if (player.body.y < enemy.body.y && enemy.body.touching.down) {
        scene.time.delayedCall(
          650,
          function () {
            if (!enemy.active || enemy.getData("defeated") || !enemy.body || !enemy.body.enable) {
              return;
            }
            enemy.setVelocityY(-350);
          },
          [],
          scene
        );
      }

      // enemy jumping animation
      if (!enemy.body.touching.down && !(enemy.body.velocity.y > 0)) {
        enemy.anims.play('enemyJump', true);
      }
      if (!enemy.body.touching.down && enemy.body.velocity.y > 0) {
        enemy.anims.play('enemyFall', true);
      }

      // Enemy animation for following the enemies on the x-axis
      if (level < 3) {
        if (
          player.body.x < enemy.body.x &&
          player.body.x + enemy.body.x > 50 &&
          enemy.body.touching.down
        ) {
          enemy.setVelocityX(-enemySpeed * (1 + level / 8.3));
          enemy.anims.play('enemyRunLeft', true);
          enemy.setFlipX(true); // Flip the enemy when moving left
          enemy.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
          enemy.body.setOffset(enemy.width * 0.42, enemy.height * 0.43);
        } else if (
          player.body.x > enemy.body.x &&
          enemy.body.x - player.body.x < -50 &&
          enemy.body.touching.down
        ) {
          enemy.setVelocityX(enemySpeed * (1 + level / 8.3));
          enemy.anims.play('enemyRunRight', true);
          enemy.setFlipX(false); // Flip the enemy when moving right
          enemy.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
          enemy.body.setOffset(enemy.width * 0.15, enemy.height * 0.43);
        }
      } else {
        //Knights jumping animation changes at level 3, to disguise itself.
        if (
          player.body.x < enemy.body.x &&
          player.body.x + enemy.body.x > 50 &&
          enemy.body.touching.down
        ) {
          enemy.setVelocityX(-enemySpeed * (1 + level / 8.3));
          enemy.anims.play('left', true);
          enemy.setFlipX(true); // Flip the enemy when moving left
          enemy.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
          enemy.body.setOffset(enemy.width * 0.42, enemy.height * 0.43);
        } else if (
          player.body.x > enemy.body.x &&
          enemy.body.x - player.body.x < -50 &&
          enemy.body.touching.down
        ) {
          enemy.setVelocityX(enemySpeed * (1 + level / 8.3));
          enemy.anims.play('right', true);
          enemy.setFlipX(false); // Flip the enemy when moving right
          enemy.body.setSize(enemy.width * 0.43, enemy.height * 0.45);
          enemy.body.setOffset(enemy.width * 0.15, enemy.height * 0.43);
        }
      }
    }

    // Calls the function for each enemy
    enemyFollows(enemy, this);
    enemyFollows(enemy2, this);
    enemyFollows(enemy3, this);

    // Keep fireballs / slam waves on a linear path and recycle when they leave the screen
    const recycleOffscreen = (bolt) => {
      if (!bolt.active || !bolt.body) return;
      bolt.body.allowGravity = false;
      bolt.setVelocityY(0);
      if (bolt.x < -80 || bolt.x > 1970 || bolt.y < -80 || bolt.y > 980) {
        bolt.anims.stop();
        bolt.setActive(false);
        bolt.setVisible(false);
        bolt.body.stop();
        bolt.body.enable = false;
      }
    };
    if (thisScene.fireballs) {
      thisScene.fireballs.children.each(recycleOffscreen);
    }
    if (thisScene.slamWaves) {
      thisScene.slamWaves.children.each(recycleOffscreen);
    }
  },
};

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: "#000000",
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
  scene: [menuScene, gameScene, gameOverScene, levelWinScene, gameWinScene],
  // scene: {
  //   preload: preload,
  //   create: create,
  //   update: update,
  // },
};

const game = new Phaser.Game(config);

let rotateHintDismissed = false;

function isPortraitPhone() {
  const narrow = Math.min(window.innerWidth, window.innerHeight) < 900;
  return narrow && window.matchMedia("(orientation: portrait)").matches;
}

function updateRotateHint() {
  const hint = document.getElementById("rotate-hint");
  if (!hint) return;
  const show = !rotateHintDismissed && isPortraitPhone();
  hint.classList.toggle("show", show);
  hint.style.display = show ? "flex" : "none";
}

function dismissRotateHint(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  rotateHintDismissed = true;
  const hint = document.getElementById("rotate-hint");
  if (hint) {
    hint.classList.remove("show");
    hint.style.display = "none";
    hint.setAttribute("aria-hidden", "true");
  }
}

function refreshGameScale() {
  updateRotateHint();
  if (!game || !game.scale) return;
  try {
    game.scale.resize(1890, 890);
  } catch (e) {}
  game.scale.refresh();
}

setupMobileControls();
const dismissBtn = document.getElementById("rotate-dismiss");
if (dismissBtn) {
  ["pointerdown", "touchstart", "click"].forEach((evt) => {
    dismissBtn.addEventListener(evt, dismissRotateHint, { passive: false });
  });
}
updateRotateHint();
refreshGameScale();

["resize", "orientationchange"].forEach((evt) => {
  window.addEventListener(evt, () => {
    refreshGameScale();
    setTimeout(refreshGameScale, 100);
    setTimeout(refreshGameScale, 300);
    setTimeout(refreshGameScale, 600);
  });
});

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => {
    refreshGameScale();
  });
}

