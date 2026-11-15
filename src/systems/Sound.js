let audioContext = null;
let masterVolume = 0.7;

/** Громкость 0..1 из настроек (этап 19). */
export function setVolume(value) {
  const number = Number(value);
  masterVolume = Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0.7;
}

export function getVolume() {
  return masterVolume;
}

function getContext() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    if (!audioContext) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) {
        return null;
      }
      audioContext = new Ctor();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    return audioContext;
  } catch (error) {
    return null;
  }
}

function tone(frequency, duration, options = {}) {
  const ctx = getContext();
  if (!ctx) {
    return;
  }

  const {
    type = 'sine',
    gain = 0.05,
    delay = 0,
    slideTo = null,
  } = options;

  if (masterVolume <= 0) {
    return;
  }

  try {
    const start = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const volume = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    }

    const level = Math.max(0.0001, gain * masterVolume);

    volume.gain.setValueAtTime(0.0001, start);
    volume.gain.linearRampToValueAtTime(level, start + 0.012);
    volume.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(volume);
    volume.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
  } catch (error) {
    // Звук не критичен для игры.
  }
}

export function playClick() {
  tone(680, 0.05, { type: 'square', gain: 0.025 });
}

export function playCoin() {
  tone(880, 0.09, { type: 'triangle', gain: 0.04 });
  tone(1320, 0.12, { type: 'triangle', gain: 0.035, delay: 0.08 });
}

export function playSuccess() {
  tone(523.25, 0.12, { type: 'sine', gain: 0.05 });
  tone(659.25, 0.12, { type: 'sine', gain: 0.05, delay: 0.1 });
  tone(783.99, 0.2, { type: 'sine', gain: 0.055, delay: 0.2 });
}

export function playError() {
  tone(260, 0.2, { type: 'triangle', gain: 0.04, slideTo: 170 });
}

/** Тихий шаг: короткий низкий щелчок, не чаще одного раза в несколько кадров. */
export function playStep() {
  tone(150, 0.045, { type: 'sine', gain: 0.014, slideTo: 110 });
}

export function playLevelUp() {
  tone(523.25, 0.1, { type: 'sine', gain: 0.05 });
  tone(659.25, 0.1, { type: 'sine', gain: 0.05, delay: 0.09 });
  tone(783.99, 0.1, { type: 'sine', gain: 0.055, delay: 0.18 });
  tone(1046.5, 0.24, { type: 'sine', gain: 0.055, delay: 0.27 });
}

export default {
  playClick,
  playCoin,
  playSuccess,
  playError,
  playStep,
  playLevelUp,
  setVolume,
  getVolume,
};
