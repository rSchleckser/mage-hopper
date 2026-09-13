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
        <button type="button" class="charselect-card${c.id === currentId ? ' selected' : ''}" data-id="${c.id}" aria-pressed="${c.id === currentId ? 'true' : 'false'}">
          <img src="./${c.folder}/${c.baseFile}" alt="" />
          <span class="charselect-name">${c.name}</span>
          <span class="charselect-tagline">${c.tagline}</span>
          <span class="charselect-selected-label">Selected</span>
        </button>
      `
    )
    .join('');

  root.innerHTML = `
    <div class="charselect-panel">
      <h2>Choose Your Hero</h2>
      <p class="charselect-sub">Pick a fighter, then confirm</p>
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

  setGameSurfaceInteractive(false);
  if (scene.input) scene.input.enabled = false;

  const syncSelected = () => {
    root.querySelectorAll('.charselect-card').forEach((c) => {
      const on = c.dataset.id === currentId;
      c.classList.toggle('selected', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  };

  root.querySelectorAll('.charselect-card').forEach((card) => {
    bindDomTap(card, () => {
      currentId = card.dataset.id;
      syncSelected();
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
