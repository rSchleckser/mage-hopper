// Lightweight synthesized sound effects (Web Audio oscillators) — no asset
// files to load, fits the retro pixel-art tone, and sidesteps browser
// autoplay restrictions since every call happens downstream of a real
// user gesture (a key press or a tap).
const STORAGE_KEY = 'mageHopper.muted';

let ctx = null;
let muted = false;
try {
  muted = localStorage.getItem(STORAGE_KEY) === 'true';
} catch (e) {}

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

// One short tone with a quick attack/decay envelope, optionally sweeping
// from `freq` to `freqEnd` over `duration` seconds.
function tone({ freq, freqEnd = freq, duration = 0.15, type = 'sine', gain = 0.2, delay = 0 }) {
  if (muted) return;
  const audioCtx = getContext();
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = type;
  const startTime = audioCtx.currentTime + delay;
  osc.frequency.setValueAtTime(freq, startTime);
  if (freqEnd !== freq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), startTime + duration);
  }
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

// A short run of tones played back-to-back (for jingles/chimes).
function sequence(notes) {
  let t = 0;
  notes.forEach((note) => {
    tone({ ...note, delay: t });
    t += note.gap ?? note.duration ?? 0.15;
  });
}

export function playJump() {
  tone({ freq: 320, freqEnd: 640, duration: 0.12, type: 'triangle', gain: 0.18 });
}

export function playFire() {
  tone({ freq: 900, freqEnd: 220, duration: 0.1, type: 'sawtooth', gain: 0.12 });
}

export function playSlam() {
  tone({ freq: 140, freqEnd: 55, duration: 0.28, type: 'square', gain: 0.22 });
}

export function playHurt() {
  tone({ freq: 300, freqEnd: 90, duration: 0.22, type: 'square', gain: 0.2 });
}

export function playEnemyDefeat() {
  tone({ freq: 520, freqEnd: 180, duration: 0.14, type: 'sawtooth', gain: 0.16 });
}

export function playKeyCollect() {
  sequence([
    { freq: 523, duration: 0.08, type: 'sine', gain: 0.18, gap: 0.08 },
    { freq: 784, duration: 0.14, type: 'sine', gain: 0.18 },
  ]);
}

export function playLevelComplete() {
  sequence([
    { freq: 523, duration: 0.1, type: 'sine', gain: 0.2, gap: 0.1 },
    { freq: 659, duration: 0.1, type: 'sine', gain: 0.2, gap: 0.1 },
    { freq: 784, duration: 0.1, type: 'sine', gain: 0.2, gap: 0.1 },
    { freq: 1046, duration: 0.22, type: 'sine', gain: 0.22 },
  ]);
}

export function playGameOver() {
  sequence([
    { freq: 392, duration: 0.2, type: 'triangle', gain: 0.2, gap: 0.2 },
    { freq: 349, duration: 0.2, type: 'triangle', gain: 0.2, gap: 0.2 },
    { freq: 294, duration: 0.4, type: 'triangle', gain: 0.22 },
  ]);
}

export function playVictory() {
  sequence([
    { freq: 523, duration: 0.1, type: 'sine', gain: 0.2, gap: 0.1 },
    { freq: 659, duration: 0.1, type: 'sine', gain: 0.2, gap: 0.1 },
    { freq: 784, duration: 0.1, type: 'sine', gain: 0.2, gap: 0.1 },
    { freq: 1046, duration: 0.1, type: 'sine', gain: 0.22, gap: 0.1 },
    { freq: 1318, duration: 0.3, type: 'sine', gain: 0.24 },
  ]);
}

export function playUiClick() {
  tone({ freq: 440, duration: 0.05, type: 'triangle', gain: 0.1 });
}

export function playPauseOpen() {
  sequence([
    { freq: 440, duration: 0.06, type: 'triangle', gain: 0.12, gap: 0.06 },
    { freq: 330, duration: 0.1, type: 'triangle', gain: 0.12 },
  ]);
}
