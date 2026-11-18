// Настройки игрока (этап 19): громкость, обучение, сетка и упрощённая графика.
// Чистые функции без Phaser: сцена читает их при старте и сохраняет вместе с прогрессом.

export const DEFAULT_SETTINGS = Object.freeze({
  volume: 0.7,
  onboardingDone: false,
  onboardingStep: 0,
  grid: false,
  simpleGraphics: false,
  hudCollapsed: false, // боковые кнопки свёрнуты
});

function bool(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, number));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

export function normalizeSettings(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  return {
    volume: round2(clamp(data.volume, 0, 1, DEFAULT_SETTINGS.volume)),
    onboardingDone: bool(data.onboardingDone, DEFAULT_SETTINGS.onboardingDone),
    onboardingStep: Math.floor(clamp(data.onboardingStep, 0, 20, 0)),
    grid: bool(data.grid, DEFAULT_SETTINGS.grid),
    simpleGraphics: bool(data.simpleGraphics, DEFAULT_SETTINGS.simpleGraphics),
    hudCollapsed: bool(data.hudCollapsed, DEFAULT_SETTINGS.hudCollapsed),
  };
}

export function withVolume(settings, value) {
  return { ...normalizeSettings(settings), volume: round2(clamp(value, 0, 1, DEFAULT_SETTINGS.volume)) };
}

export function toggleBoolean(settings, field) {
  const next = normalizeSettings(settings);
  if (field in next && typeof next[field] === 'boolean') {
    next[field] = !next[field];
  }
  return next;
}

export function resetOnboarding(settings) {
  return { ...normalizeSettings(settings), onboardingDone: false, onboardingStep: 0 };
}

/** Сброс прогресса сохраняет звук и оформление, но обучение показывается снова. */
export function afterProgressReset(settings) {
  return { ...normalizeSettings(settings), onboardingDone: false, onboardingStep: 0 };
}

export default normalizeSettings;
