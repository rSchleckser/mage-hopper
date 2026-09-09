let rotateHintDismissed = false;

export function isPortraitPhone() {
  const narrow = Math.min(window.innerWidth, window.innerHeight) < 900;
  return narrow && window.matchMedia('(orientation: portrait)').matches;
}

export function updateRotateHint() {
  const hint = document.getElementById('rotate-hint');
  if (!hint) return;
  const show = !rotateHintDismissed && isPortraitPhone();
  hint.classList.toggle('show', show);
  hint.style.display = show ? 'flex' : 'none';
}

export function dismissRotateHint(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  rotateHintDismissed = true;
  const hint = document.getElementById('rotate-hint');
  if (hint) {
    hint.classList.remove('show');
    hint.style.display = 'none';
    hint.setAttribute('aria-hidden', 'true');
  }
}

export function refreshGameScale(game) {
  updateRotateHint();
  if (!game || !game.scale) return;
  try {
    game.scale.resize(1890, 890);
  } catch (e) {}
  game.scale.refresh();
}
