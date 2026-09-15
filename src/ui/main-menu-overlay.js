import { bindDomTap, setGameSurfaceInteractive } from './dom-overlays.js';

export function hideMainMenuDomUi() {
  const root = document.getElementById('mainmenu-dom-ui');
  if (!root) return;
  root.classList.remove('show');
  root.setAttribute('aria-hidden', 'true');
  root.style.display = 'none';
  setGameSurfaceInteractive(true);
}

export function openMainMenuDomOverlay(scene, { muted, onStart, onInstr, onToggleMute }) {
  let root = document.getElementById('mainmenu-dom-ui');
  if (!root) {
    root = document.createElement('div');
    root.id = 'mainmenu-dom-ui';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'Main menu');
    document.body.appendChild(root);
  }

  root.innerHTML = `
    <div class="mainmenu-panel">
      <button type="button" class="mainmenu-sound" aria-label="Toggle sound">${muted ? 'Sound: Off' : 'Sound: On'}</button>
      <h1 class="mainmenu-title">Mage Hopper</h1>
      <div class="mainmenu-ribbon">A PLATFORM ADVENTURE</div>
      <div class="mainmenu-actions">
        <button type="button" class="mainmenu-start">Start Game</button>
        <button type="button" class="mainmenu-instr">Instructions</button>
      </div>
    </div>
  `;

  root.style.display = 'flex';
  root.classList.add('show');
  root.setAttribute('aria-hidden', 'false');

  // Keep Phaser/canvas from eating Android touches under the overlay.
  setGameSurfaceInteractive(false);
  if (scene.input) scene.input.enabled = false;

  const startBtn = root.querySelector('.mainmenu-start');
  const instrBtn = root.querySelector('.mainmenu-instr');
  const soundBtn = root.querySelector('.mainmenu-sound');

  bindDomTap(startBtn, () => onStart());
  bindDomTap(instrBtn, () => onInstr());
  bindDomTap(soundBtn, () => {
    const nowMuted = onToggleMute();
    soundBtn.textContent = nowMuted ? 'Sound: Off' : 'Sound: On';
  });

  return root;
}
