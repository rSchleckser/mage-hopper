import { bindDomTap, setGameSurfaceInteractive } from './dom-overlays.js';

export function hideGameWinDomUi() {
  const root = document.getElementById('gamewin-dom-ui');
  if (!root) return;
  root.classList.remove('show');
  root.setAttribute('aria-hidden', 'true');
  root.style.display = 'none';
  setGameSurfaceInteractive(true);
}

export function openGameWinDomOverlay(scene, { totalLevels, onPlayAgain, onQuit }) {
  let root = document.getElementById('gamewin-dom-ui');
  if (!root) {
    root = document.createElement('div');
    root.id = 'gamewin-dom-ui';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'You won');
    document.body.appendChild(root);
  }

  const dots = Array.from({ length: totalLevels }, () => '<span class="dot"></span>').join('');

  root.innerHTML = `
    <div class="gamewin-panel">
      <h2>Victory!</h2>
      <div class="gamewin-ribbon">ALL ${totalLevels} STAGES CLEARED</div>
      <p class="gamewin-sub">You saved the realm!</p>
      <div class="gamewin-dots" aria-hidden="true">${dots}</div>
      <div class="gamewin-actions">
        <button type="button" class="gamewin-play-again">Play Again</button>
        <button type="button" class="gamewin-quit">Main Menu</button>
      </div>
    </div>
  `;

  root.style.display = 'flex';
  root.classList.add('show');
  root.setAttribute('aria-hidden', 'false');

  // Keep Phaser/canvas from eating Android touches under the overlay.
  setGameSurfaceInteractive(false);
  if (scene.input) scene.input.enabled = false;

  const playAgainBtn = root.querySelector('.gamewin-play-again');
  const quitBtn = root.querySelector('.gamewin-quit');

  bindDomTap(playAgainBtn, () => {
    hideGameWinDomUi();
    if (scene.input) scene.input.enabled = true;
    onPlayAgain();
  });
  bindDomTap(quitBtn, () => {
    hideGameWinDomUi();
    if (scene.input) scene.input.enabled = true;
    onQuit();
  });

  return root;
}
