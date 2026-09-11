import { bindDomTap, setGameSurfaceInteractive } from './dom-overlays.js';

export function hideLevelCompleteDomUi() {
  const root = document.getElementById('levelup-dom-ui');
  if (!root) return;
  root.classList.remove('show');
  root.setAttribute('aria-hidden', 'true');
  root.style.display = 'none';
  setGameSurfaceInteractive(true);
}

export function openLevelCompleteDomOverlay(scene, { clearedLevel, nextLevel, totalLevels, onContinue }) {
  let root = document.getElementById('levelup-dom-ui');
  if (!root) {
    root = document.createElement('div');
    root.id = 'levelup-dom-ui';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Level complete');
    document.body.appendChild(root);
  }

  const dots = Array.from({ length: totalLevels }, (_, i) =>
    `<span class="dot${i < clearedLevel ? ' on' : ''}"></span>`
  ).join('');

  root.innerHTML = `
    <div class="levelup-panel">
      <h2>Level Complete!</h2>
      <div class="levelup-ribbon">STAGE ${clearedLevel} CLEARED</div>
      <p class="levelup-next">Ready for Level ${nextLevel}?</p>
      <div class="levelup-dots" aria-hidden="true">${dots}</div>
      <button type="button" class="levelup-continue">Continue</button>
    </div>
  `;

  root.style.display = 'flex';
  root.classList.add('show');
  root.setAttribute('aria-hidden', 'false');

  // Keep Phaser/canvas from eating Android touches under the overlay.
  setGameSurfaceInteractive(false);
  if (scene.input) scene.input.enabled = false;

  const continueBtn = root.querySelector('.levelup-continue');
  bindDomTap(continueBtn, () => {
    hideLevelCompleteDomUi();
    if (scene.input) scene.input.enabled = true;
    onContinue();
  });

  return root;
}
