export const BASE_XP = 100;
export const XP_PER_LEVEL_STEP = 50;

export function xpToNextLevel(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  return BASE_XP + (safeLevel - 1) * XP_PER_LEVEL_STEP;
}

/** Разбор общего опыта на уровень и прогресс внутри уровня. */
export function levelFromExperience(total) {
  const safeTotal = Math.max(0, Math.round(Number(total) || 0));
  let level = 1;
  let into = safeTotal;
  let need = xpToNextLevel(level);
  while (into >= need && level < 99) {
    into -= need;
    level += 1;
    need = xpToNextLevel(level);
  }
  return { level, into, need, ratio: need > 0 ? into / need : 0 };
}
