import { bindDomTap, setGameSurfaceInteractive } from './dom-overlays.js';

export function hidePauseDomUi() {
  const root = document.getElementById('pause-dom-ui');
  if (!root) return;
  root.classList.remove('show');
  root.setAttribute('aria-hidden', 'true');
  root.style.display = 'none';
  setGameSurfaceInteractive(true);
}

export function openPauseDomOverlay(scene, { level, onResume, onRestart, onQuit }) {
  let root = document.getElementById('pause-dom-ui');
  if (!root) {
    root = document.createElement('div');
    root.id = 'pause-dom-ui';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Paused');
    document.body.appendChild(root);
  }

  root.innerHTML = `
    <div class="pause-panel">
      <h2>Paused</h2>
      <div class="pause-ribbon">LEVEL ${level}</div>
      <div class="pause-actions">
        <button type="button" class="pause-resume">Resume</button>
        <button type="button" class="pause-restart">Restart Level</button>
        <button type="button" class="pause-quit">Quit to Menu</button>
      </div>
    </div>
  `;

  root.style.display = 'flex';
  root.classList.add('show');
  root.setAttribute('aria-hidden', 'false');

  // Keep Phaser/canvas from eating Android touches under the overlay.
  setGameSurfaceInteractive(false);
  if (scene.input) scene.input.enabled = false;

  const resumeBtn = root.querySelector('.pause-resume');
  const restartBtn = root.querySelector('.pause-restart');
  const quitBtn = root.querySelector('.pause-quit');

  bindDomTap(resumeBtn, () => {
    hidePauseDomUi();
    if (scene.input) scene.input.enabled = true;
    onResume();
  });
  bindDomTap(restartBtn, () => {
    hidePauseDomUi();
    if (scene.input) scene.input.enabled = true;
    onRestart();
  });
  bindDomTap(quitBtn, () => {
    hidePauseDomUi();
    if (scene.input) scene.input.enabled = true;
    onQuit();
  });

  return root;
}
