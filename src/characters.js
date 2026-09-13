// Per-character asset config: folder layout, base texture, combat mode, and
// the file naming/indexing convention for each animation (these differ
// between packs — e.g. Rogue's Attack_Extra frames are 1-indexed with 11
// frames, while Mage's are 0-indexed with 7).
export const CHARACTERS = {
  mage: {
    id: 'mage',
    name: 'Mage',
    folder: 'Mage',
    baseFile: 'mage.png',
    combat: 'ranged',
    anims: {
      run: { dir: 'Run', prefix: 'run', start: 1, count: 8 },
      jump: { dir: 'Jump', prefix: 'jump', start: 1, count: 7 },
      attack: { dir: 'Attack', prefix: 'attack', start: 1, count: 7 },
      death: { dir: 'Death', prefix: 'death', start: 1, count: 10 },
      hurt: { dir: 'Hurt', prefix: 'hurt', start: 1, count: 4 },
      attackExtra: { dir: 'Attack_Extra', prefix: 'attack_extra', start: 0, count: 7 },
    },
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    folder: 'Rogue',
    baseFile: 'rogue.png',
    combat: 'melee',
    anims: {
      run: { dir: 'Run', prefix: 'run', start: 1, count: 8 },
      jump: { dir: 'Jump', prefix: 'jump', start: 1, count: 7 },
      attack: { dir: 'Attack', prefix: 'Attack', start: 1, count: 7 },
      death: { dir: 'Death', prefix: 'death', start: 1, count: 10 },
      hurt: { dir: 'Hurt', prefix: 'hurt', start: 1, count: 4 },
      attackExtra: { dir: 'Attack_Extra', prefix: 'attack_extra', start: 1, count: 11 },
    },
  },
};

export const DEFAULT_CHARACTER_ID = 'mage';

export function getCharacter(id) {
  return CHARACTERS[id] || CHARACTERS[DEFAULT_CHARACTER_ID];
}
