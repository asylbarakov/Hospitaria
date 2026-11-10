export const BASE_XP = 100;
export const XP_PER_LEVEL_STEP = 50;

export function xpToNextLevel(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  return BASE_XP + (safeLevel - 1) * XP_PER_LEVEL_STEP;
}
