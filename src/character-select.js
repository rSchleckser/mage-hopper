// Persisted playable-character choice, mirroring audio.js's mute-preference
// pattern (localStorage, wrapped in try/catch for private-mode safety).
import { CHARACTERS, DEFAULT_CHARACTER_ID, getCharacter } from './characters.js';

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

// Starting lives for whichever character is currently selected — used
// whenever a scene resets `gameState.lives` (quit, game over, game win,
// level advance), so the reset reflects the active character, not a stale
// value left over from a previous selection.
export function livesForSelectedCharacter() {
  return getCharacter(selectedId).startingLives;
}

// Max HP for whichever character is currently selected — used the same way
// as livesForSelectedCharacter(), resetting `gameState.hp` at every point a
// life/run restarts.
export function maxHpForSelectedCharacter() {
  return getCharacter(selectedId).maxHp;
}
