// Retro sound effects, rendered from https://sfxr.me (public domain / Unlicense)
// presets ahead of time into the WAV files in ./sounds. Loaded once via Web
// Audio and played back as buffers — no Phaser sound manager coupling, so
// this can be called from plain modules (combat.js, player-controller.js)
// without needing a scene reference.
const STORAGE_KEY = 'mageHopper.muted';

const SOUND_FILES = {
  jump: './sounds/jump.wav',
  fire: './sounds/fire.wav',
  hurt: './sounds/hurt.wav',
  slam: './sounds/slam.wav',
  enemyDefeat: './sounds/enemy-defeat.wav',
  keyCollect: './sounds/key-collect.wav',
  uiClick: './sounds/ui-click.wav',
  chime: './sounds/chime.wav',
  sadTone: './sounds/sad-tone.wav',
};

let ctx = null;
let muted = false;
try {
  muted = localStorage.getItem(STORAGE_KEY) === 'true';
} catch (e) {}

const bufferCache = new Map();
const loadingPromises = new Map();

function getContext() {
  if (!ctx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioContextClass();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

function loadBuffer(name) {
  if (bufferCache.has(name)) return Promise.resolve(bufferCache.get(name));
  if (loadingPromises.has(name)) return loadingPromises.get(name);
  const audioCtx = getContext();
  const promise = fetch(SOUND_FILES[name])
    .then((res) => res.arrayBuffer())
    .then((data) => audioCtx.decodeAudioData(data))
    .then((buffer) => {
      bufferCache.set(name, buffer);
      return buffer;
    });
  loadingPromises.set(name, promise);
  return promise;
}

// Kick off loading every sound the first time any sound is requested, so
// later calls (which need to feel instant) aren't waiting on a fetch.
let preloadStarted = false;
function ensurePreloaded() {
  if (preloadStarted) return;
  preloadStarted = true;
  Object.keys(SOUND_FILES).forEach(loadBuffer);
}

function playSample(name, { rate = 1, gain = 0.5, delay = 0 } = {}) {
  if (muted) return;
  ensurePreloaded();
  loadBuffer(name).then((buffer) => {
    if (muted) return; // guard against a mute toggle while the fetch/decode was in flight
    const audioCtx = getContext();
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = gain;
    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    source.start(audioCtx.currentTime + delay);
  });
}

// A short run of pitch-shifted copies of one sample, played back-to-back
// (for jingles/chimes) — reuses one designed "note" voice at different
// playback rates instead of needing a separate file per pitch.
function chimeSequence(voice, rates, noteGap, gain) {
  let t = 0;
  rates.forEach((rate) => {
    playSample(voice, { rate, gain, delay: t });
    t += noteGap;
  });
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  try {
    localStorage.setItem(STORAGE_KEY, String(muted));
  } catch (e) {}
}

export function toggleMuted() {
  setMuted(!muted);
  return muted;
}

export function playJump() {
  playSample('jump', { gain: 0.55 });
}

export function playFire() {
  playSample('fire', { gain: 0.45 });
}

export function playSlam() {
  playSample('slam', { gain: 0.55 });
}

export function playHurt() {
  playSample('hurt', { gain: 0.6 });
}

export function playEnemyDefeat() {
  playSample('enemyDefeat', { gain: 0.5 });
}

export function playKeyCollect() {
  playSample('keyCollect', { gain: 0.5 });
}

export function playUiClick() {
  playSample('uiClick', { gain: 0.35 });
}

export function playPauseOpen() {
  playSample('uiClick', { rate: 0.75, gain: 0.4 });
}

// Musical intervals (relative to the base pitch) reused from the original
// synthesized jingles — same melodic shape, now with a designed sample voice.
export function playLevelComplete() {
  chimeSequence('chime', [1, 1.26, 1.5, 2.0], 0.13, 0.5);
}

export function playVictory() {
  chimeSequence('chime', [1, 1.26, 1.5, 2.0, 2.52], 0.12, 0.5);
}

export function playGameOver() {
  chimeSequence('sadTone', [1, 0.89, 0.75], 0.24, 0.5);
}
