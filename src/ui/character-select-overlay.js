import { bindDomTap, setGameSurfaceInteractive } from './dom-overlays.js';

export function hideCharacterSelectDomUi() {
  const root = document.getElementById('charselect-dom-ui');
  if (!root) return;
  root.classList.remove('show');
  root.setAttribute('aria-hidden', 'true');
  root.style.display = 'none';
  setGameSurfaceInteractive(true);
}

export function openCharacterSelectDomOverlay(scene, { characters, selectedId, onSelect, onConfirm, onBack }) {
  let root = document.getElementById('charselect-dom-ui');
  if (!root) {
    root = document.createElement('div');
    root.id = 'charselect-dom-ui';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Choose your hero');
    document.body.appendChild(root);
  }

  let currentId = selectedId;

  const cardsHtml = characters
    .map(
      (c) => `
        <button type="button" class="charselect-card${c.id === currentId ? ' selected' : ''}" data-id="${c.id}">
          <img src="./${c.folder}/${c.baseFile}" alt="${c.name}" />
          <span class="charselect-name">${c.name}</span>
          <span class="charselect-tagline">${c.tagline}</span>
        </button>
      `
    )
    .join('');

  root.innerHTML = `
    <div class="charselect-panel">
      <h2>Choose Your Hero</h2>
      <div class="charselect-cards">${cardsHtml}</div>
      <div class="charselect-actions">
        <button type="button" class="charselect-back">Back</button>
        <button type="button" class="charselect-confirm">Start Adventure</button>
      </div>
    </div>
  `;

  root.style.display = 'flex';
  root.classList.add('show');
  root.setAttribute('aria-hidden', 'false');

  // Keep Phaser/canvas from eating Android touches under the overlay.
  setGameSurfaceInteractive(false);
  if (scene.input) scene.input.enabled = false;

  root.querySelectorAll('.charselect-card').forEach((card) => {
    bindDomTap(card, () => {
      currentId = card.dataset.id;
      root.querySelectorAll('.charselect-card').forEach((c) => c.classList.toggle('selected', c === card));
      onSelect(currentId);
    });
  });

  bindDomTap(root.querySelector('.charselect-confirm'), () => {
    hideCharacterSelectDomUi();
    if (scene.input) scene.input.enabled = true;
    onConfirm();
  });
  bindDomTap(root.querySelector('.charselect-back'), () => {
    hideCharacterSelectDomUi();
    if (scene.input) scene.input.enabled = true;
    onBack();
  });

  return root;
}
