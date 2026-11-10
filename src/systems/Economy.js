import { xpToNextLevel } from '../data/progression.js';
import { normalizeAvatar } from '../data/avatarOptions.js';
import { PATIENT_CONFIG } from '../data/patientConfig.js';

export const MAX_PATIENTS_CAP = 6;

export function maxPatientsForLevel(level) {
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  return Math.min(
    MAX_PATIENTS_CAP,
    PATIENT_CONFIG.maxPatients + (safeLevel - 1),
  );
}

export function ensureSaveData(data) {
  const save = data && typeof data === 'object' ? data : {};

  save.coins = Math.max(0, Math.round(Number(save.coins) || 0));
  save.xp = Math.max(0, Number(save.xp) || 0);
  save.level = Math.max(1, Math.floor(Number(save.level) || 1));
  save.reputation = Number.isFinite(Number(save.reputation))
    ? Math.max(0, Math.min(100, Number(save.reputation)))
    : 50;
  save.ownedItems = Array.isArray(save.ownedItems) ? save.ownedItems : [];
  save.furniture = Array.isArray(save.furniture) ? save.furniture : [];
  if (save.player && typeof save.player === 'object') {
    save.player = { ...save.player, ...normalizeAvatar(save.player) };
  }
  return save;
}

export function addExperience(state, amount) {
  const gain = Math.max(0, Math.round(Number(amount) || 0));
  let xp = Math.max(0, Number(state.xp) || 0) + gain;
  let level = Math.max(1, Math.floor(Number(state.level) || 1));
  let levelsGained = 0;
  let need = xpToNextLevel(level);

  while (xp >= need && levelsGained < 100) {
    xp -= need;
    level += 1;
    levelsGained += 1;
    need = xpToNextLevel(level);
  }

  return { xp, level, levelsGained };
}

export function isItemUnlocked(item, level) {
  return !!item && (Number(item.level) || 1) <= (Number(level) || 1);
}

export default { maxPatientsForLevel, ensureSaveData, addExperience };
