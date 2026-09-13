// Persisted playable-character choice, mirroring audio.js's mute-preference
// pattern (localStorage, wrapped in try/catch for private-mode safety).
import { CHARACTERS, DEFAULT_CHARACTER_ID } from './characters.js';

const STORAGE_KEY = 'mageHopper.character';

let selectedId = DEFAULT_CHARACTER_ID;
try {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && CHARACTERS[stored]) {
    selectedId = stored;
  }
} catch (e) {}

export function getSelectedCharacterId() {
  return selectedId;
}

export function setSelectedCharacterId(id) {
  if (!CHARACTERS[id]) return;
  selectedId = id;
  try {
    localStorage.setItem(STORAGE_KEY, selectedId);
  } catch (e) {}
}
