import { isTouchDevice } from '../input.js';

export function shouldUseDomOverlay() {
  // Portrait / narrow / touch: the letterboxed Phaser canvas shrinks to a thin
  // strip, so full-screen modals (Instructions, Level Complete) render as DOM
  // overlays instead of tiny canvas cards.
  const narrow = Math.min(window.innerWidth, window.innerHeight) < 900;
  const portrait = window.matchMedia('(orientation: portrait)').matches;
  return isTouchDevice() || (narrow && portrait) || window.innerWidth < 700;
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

export function setGameSurfaceInteractive(enabled) {
  const canvas = document.querySelector('#game-container canvas');
  const gc = document.getElementById('game-container');
  if (canvas) canvas.style.pointerEvents = enabled ? '' : 'none';
  if (gc) gc.style.pointerEvents = enabled ? '' : 'none';
}

export function bindDomTap(el, fn, opts) {
  if (!el) return;
  const onlyDirect = !!(opts && opts.onlyDirect);
  let locked = false;
  const run = (e) => {
    if (onlyDirect && e && e.target !== el) return;
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (locked) return;
    locked = true;
    setTimeout(() => {
      locked = false;
    }, 400);
    fn(e);
  };
  // pointerdown is the reliable Android Chrome signal; click alone often never fires
  // when body/canvas use touch-action: none.
  ['pointerdown', 'touchend', 'click'].forEach((evt) => {
    el.addEventListener(evt, run, { passive: false });
  });
}

export function ensureMenuDomUi() {
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

export function hideMenuDomUi() {
  const root = document.getElementById('menu-dom-ui');
  if (!root) return;
  root.classList.remove('show');
  root.setAttribute('aria-hidden', 'true');
  root.style.display = 'none';
}

export function syncMenuDomUi(scene, startHit, instrHit, handlers) {
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
    bindDomTap(next, () => {
      if (typeof fn === 'function') fn();
    });
    return next;
  };
  rebind(document.getElementById('menu-dom-start'), handlers.onStart);
  rebind(document.getElementById('menu-dom-instr'), handlers.onInstr);
}
