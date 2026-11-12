/**
 * Web Audio alerts — shared context (unlocked on first user gesture for autoplay policy)
 */
let sharedAudioContext = null;
let audioUnlockBound = false;

export function ensureAudioUnlocked() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!sharedAudioContext) {
      sharedAudioContext = new AudioContext();
    }
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }
  } catch {
    // ignore
  }
}

export function bindAudioUnlockOnInteraction() {
  if (typeof window === 'undefined' || audioUnlockBound) return;
  audioUnlockBound = true;
  const unlock = () => ensureAudioUnlocked();
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
}

export function playNotificationSound(type = 'user_message') {
  if (typeof window === 'undefined') return;

  ensureAudioUnlocked();

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!sharedAudioContext) {
      sharedAudioContext = new AudioContext();
    }
    const audioCtx = sharedAudioContext;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => playNotificationSound(type)).catch(() => {});
      return;
    }

    if (type === 'admin_request') {
      const now = audioCtx.currentTime;
      const notes = [783.99, 987.77, 1174.66];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.28, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.35);
      });
    } else {
      const now = audioCtx.currentTime;
      const notes = [659.25, 880.0];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.22, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    }
  } catch {
    // autoplay policy or unsupported
  }
}
