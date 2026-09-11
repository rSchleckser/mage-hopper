import { MENU_COLORS } from './theme.js';
import { makePillButton, buildKeyChip, buildActionRow } from './menu-widgets.js';
import { hideMenuDomUi, bindDomTap, setGameSurfaceInteractive, shouldUseDomOverlay } from './dom-overlays.js';

export function hideInstructionsDomUi() {
  const root = document.getElementById('instructions-dom-ui');
  if (!root) return;
  root.classList.remove('show');
  root.setAttribute('aria-hidden', 'true');
  root.style.display = 'none';
  setGameSurfaceInteractive(true);
}

export function openInstructionsDomOverlay(scene) {
  hideMenuDomUi();
  // Don't call hideInstructionsDomUi() first — it can fight the show we're about to do.

  let root = document.getElementById('instructions-dom-ui');
  if (!root) {
    root = document.createElement('div');
    root.id = 'instructions-dom-ui';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'How to play');
    document.body.appendChild(root);
  }

  root.innerHTML = `
    <div class="howto-panel">
      <header class="howto-header">
        <h2>How to play</h2>
        <button type="button" class="howto-close" aria-label="Close">Close</button>
      </header>
      <div class="howto-body">
        <section class="howto-page" data-page="0">
          <div class="howto-keys" aria-hidden="true">
            <div class="howto-keyrow">
              <span class="howto-key">←</span>
              <span class="howto-key">→</span>
              <span class="howto-key wide">SPACE</span>
            </div>
            <div class="howto-keyrow">
              <span class="howto-key fire">F</span>
              <span class="howto-key slam">E</span>
            </div>
            <p class="howto-note">On mobile: JUMP / FIRE / SLAM buttons</p>
          </div>
          <ul class="howto-actions">
            <li><span class="tag teal">MOVE</span> Left / Right</li>
            <li><span class="tag teal">JUMP</span> Space / Jump button</li>
            <li><span class="tag fire">FIRE</span> Shoot a bolt</li>
            <li><span class="tag slam">SLAM</span> Staff ground slam</li>
          </ul>
        </section>
        <section class="howto-page" data-page="1" hidden>
          <h3>Your quest</h3>
          <ul class="howto-list">
            <li>Explore platforms and avoid falling</li>
            <li>Defeat knights with FIRE or SLAM</li>
            <li>Collect the key, then reach the door</li>
            <li>Clear each stage to advance</li>
          </ul>
        </section>
        <section class="howto-page" data-page="2" hidden>
          <h3>Tips</h3>
          <ul class="howto-list">
            <li>Hold SLAM extras for a stronger wave</li>
            <li>FIRE travels straight — lead your shots</li>
            <li>On phones, use on-screen controls</li>
            <li>Landscape feels best; portrait still plays</li>
          </ul>
        </section>
      </div>
      <footer class="howto-footer">
        <div class="howto-dots" aria-hidden="true">
          <span class="dot on"></span><span class="dot"></span><span class="dot"></span>
        </div>
        <div class="howto-nav">
          <button type="button" class="howto-prev">Previous</button>
          <button type="button" class="howto-next">Next</button>
        </div>
      </footer>
    </div>
  `;

  root.style.display = 'flex';
  root.classList.add('show');
  root.setAttribute('aria-hidden', 'false');

  // Keep Phaser/canvas from eating Android touches under the overlay.
  setGameSurfaceInteractive(false);
  if (scene.input) scene.input.enabled = false;

  scene._instructionsOverlay = { dom: true };

  let pageIndex = 0;
  const pages = Array.from(root.querySelectorAll('.howto-page'));
  const dots = Array.from(root.querySelectorAll('.howto-dots .dot'));
  const prevBtn = root.querySelector('.howto-prev');
  const nextBtn = root.querySelector('.howto-next');
  const closeBtn = root.querySelector('.howto-close');

  const closeOverlay = () => {
    hideInstructionsDomUi();
    setGameSurfaceInteractive(true);
    if (scene.input) scene.input.enabled = true;
    scene._instructionsOverlay = null;
    scene.events.emit('instructions-closed');
  };

  const showPage = (idx) => {
    pageIndex = Math.max(0, Math.min(pages.length - 1, idx));
    pages.forEach((p, i) => {
      if (i === pageIndex) p.removeAttribute('hidden');
      else p.setAttribute('hidden', '');
    });
    dots.forEach((d, i) => d.classList.toggle('on', i === pageIndex));
    prevBtn.disabled = pageIndex === 0;
    prevBtn.setAttribute('aria-disabled', pageIndex === 0 ? 'true' : 'false');
    prevBtn.style.opacity = pageIndex === 0 ? '0.45' : '1';
    nextBtn.textContent = pageIndex >= pages.length - 1 ? 'Done' : 'Next';
  };
  showPage(0);

  bindDomTap(prevBtn, () => {
    if (pageIndex > 0) showPage(pageIndex - 1);
  });
  bindDomTap(nextBtn, () => {
    if (pageIndex < pages.length - 1) showPage(pageIndex + 1);
    else closeOverlay();
  });
  bindDomTap(closeBtn, () => closeOverlay());

  // Backdrop tap closes (only the dimmed root, not the panel).
  bindDomTap(root, () => closeOverlay(), { onlyDirect: true });

  return scene._instructionsOverlay;
}

export function openInstructionsOverlay(scene) {
  if (scene._instructionsOverlay) {
    if (scene._instructionsOverlay.dom) {
      hideInstructionsDomUi();
    } else if (scene._instructionsOverlay.destroy) {
      scene._instructionsOverlay.destroy(true);
    }
    scene._instructionsOverlay = null;
  }

  // Mobile / portrait: full-viewport DOM overlay (not tiny letterboxed Phaser modal).
  if (shouldUseDomOverlay()) {
    return openInstructionsDomOverlay(scene);
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
        .text(kx + 16, ky + kh - 28, 'On mobile: JUMP / FIRE / SLAM buttons', {
          fontFamily: 'Nunito, system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: '700',
          color: 'rgba(255,255,255,0.8)',
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

  const closeOverlay = () => {
    if (!scene._instructionsOverlay) return;
    overlay.destroy(true);
    scene._instructionsOverlay = null;
    scene.events.emit('instructions-closed');
  };

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
    else closeOverlay();
  });
  closeBtn.setOnActivate(closeOverlay);
  return overlay;
}
