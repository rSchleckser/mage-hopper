// --- Mobile / touch input ---
export const touchInput = { left: false, right: false, up: false, attack: false, extra: false };

export function isTouchDevice() {
  return (
    window.matchMedia('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    (navigator.maxTouchPoints || 0) > 0
  );
}

function bindHoldButton(el, key) {
  if (!el) return;
  const set = (down, event) => {
    if (event) event.preventDefault();
    touchInput[key] = down;
    el.classList.toggle('pressed', down);
  };
  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture?.(e.pointerId);
    set(true, e);
  });
  el.addEventListener('pointerup', (e) => set(false, e));
  el.addEventListener('pointercancel', (e) => set(false, e));
  el.addEventListener('pointerout', (e) => set(false, e));
  el.addEventListener('lostpointercapture', (e) => set(false, e));
}

export function setMobileControlsVisible(visible) {
  const controls = document.getElementById('mobile-controls');
  if (!controls) return;
  if (visible && isTouchDevice()) {
    controls.classList.add('visible');
    controls.setAttribute('aria-hidden', 'false');
  } else {
    controls.classList.remove('visible');
    controls.setAttribute('aria-hidden', 'true');
    touchInput.left = touchInput.right = touchInput.up = touchInput.attack = touchInput.extra = false;
    controls.querySelectorAll('button.pressed').forEach((b) => b.classList.remove('pressed'));
  }
}

export function setupMobileControls() {
  bindHoldButton(document.getElementById('btn-left'), 'left');
  bindHoldButton(document.getElementById('btn-right'), 'right');
  bindHoldButton(document.getElementById('btn-jump'), 'up');
  bindHoldButton(document.getElementById('btn-attack'), 'attack');
  bindHoldButton(document.getElementById('btn-extra'), 'extra');
  document.body.addEventListener(
    'touchmove',
    (e) => {
      if (e.target.closest('#mobile-controls') || e.target.tagName === 'CANVAS') {
        e.preventDefault();
      }
    },
    { passive: false }
  );
}
