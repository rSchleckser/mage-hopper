import { bindDomTap, setGameSurfaceInteractive } from './dom-overlays.js';

export function hideGameOverDomUi() {
  const root = document.getElementById('gameover-dom-ui');
  if (!root) return;
  root.classList.remove('show');
  root.setAttribute('aria-hidden', 'true');
  root.style.display = 'none';
  setGameSurfaceInteractive(true);
}

export function openGameOverDomOverlay(scene, { level, onPlayAgain, onQuit }) {
  let root = document.getElementById('gameover-dom-ui');
  if (!root) {
    root = document.createElement('div');
    root.id = 'gameover-dom-ui';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Game over');
    document.body.appendChild(root);
  }

  root.innerHTML = `
    <div class="gameover-panel">
      <h2>Game Over</h2>
      <div class="gameover-ribbon">REACHED LEVEL ${level}</div>
      <p class="gameover-sub">Your mage has fallen...</p>
      <div class="gameover-actions">
        <button type="button" class="gameover-play-again">Play Again</button>
        <button type="button" class="gameover-quit">Quit</button>
      </div>
    </div>
  `;

  root.style.display = 'flex';
  root.classList.add('show');
  root.setAttribute('aria-hidden', 'false');

  // Keep Phaser/canvas from eating Android touches under the overlay.
  setGameSurfaceInteractive(false);
  if (scene.input) scene.input.enabled = false;

  const playAgainBtn = root.querySelector('.gameover-play-again');
  const quitBtn = root.querySelector('.gameover-quit');

  bindDomTap(playAgainBtn, () => {
    hideGameOverDomUi();
    if (scene.input) scene.input.enabled = true;
    onPlayAgain();
  });
  bindDomTap(quitBtn, () => {
    hideGameOverDomUi();
    if (scene.input) scene.input.enabled = true;
    onQuit();
  });

  return root;
}
