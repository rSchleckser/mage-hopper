// Per-character asset config: folder layout, base texture, combat mode, and
// the file naming/indexing convention for each animation (these differ
// between packs — e.g. Rogue's Attack_Extra frames are 1-indexed with 11
// frames while Mage's are 0-indexed with 7, and Rogue's Idle folder skips
// frame 11 entirely, so an explicit `indices` list stands in for `start`/`count`
// wherever the on-disk numbering isn't a contiguous run).
export const CHARACTERS = {
  mage: {
    id: 'mage',
    name: 'Mage',
    folder: 'Mage',
    baseFile: 'mage.png',
    combat: 'ranged',
    tagline: 'Ranged fire magic',
    anims: {
      idle: { dir: 'Idle', prefix: 'idle', start: 1, count: 14 },
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
    tagline: 'Close-quarters blades',
    anims: {
      // idle11.png is missing from the pack — 17 frames numbered 1-10, 12-18.
      idle: { dir: 'Idle', prefix: 'idle', indices: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18] },
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

export function getAllCharacters() {
  return Object.values(CHARACTERS);
}

// The on-disk file index for each of an animation's frames, in order.
export function frameFileIndices(def) {
  return def.indices ? def.indices : Array.from({ length: def.count }, (_, i) => def.start + i);
}

export function frameCount(def) {
  return def.indices ? def.indices.length : def.count;
}
