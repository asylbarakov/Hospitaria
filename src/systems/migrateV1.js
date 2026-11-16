// Миграция сохранения v0.1 (hospital_save_v1) в изометрическую больницу v0.2.
// Старый ключ не изменяется и не удаляется: он остаётся резервной копией и
// нужен режиму ?legacy=1. Чистая функция migrateV1 тестируется в node.

import { LEGACY_SHOP, LEGACY_SAVE_KEY } from '../data/legacyMigration.js';
import { xpToNextLevel } from '../data/progression.js';
import { crystalsForLevel } from '../data/economy.js';
import { STARTER_ROOMS } from '../data/roomUnlocks.js';
import { normalizePlayer } from '../data/playerSkins.js';
import { loadIsoSave, saveIso } from './IsoSave.js';

function count(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

/** Общий опыт из уровня и опыта внутри уровня (формула progression.js). */
export function totalExperience(level, xp) {
  const safeLevel = Math.max(1, Math.min(99, Math.floor(Number(level) || 1)));
  let total = count(xp);
  for (let l = 1; l < safeLevel; l += 1) {
    total += xpToNextLevel(l);
  }
  return total;
}

/** Роль v0.1 (doctor/nurse) переходит в роль и облик v0.2; акцент по умолчанию «Мята». */
function legacyPlayer(player) {
  const nurse = player.role === 'nurse';
  return normalizePlayer({
    name: player.name,
    role: nurse ? 'nurse' : 'doctor',
    skin: nurse ? 'staff_nurse' : 'staff_doctor',
    accent: 'mint',
  });
}

/**
 * @param {object} legacy сохранение v0.1 (любой версии формы)
 * @returns {{coins:number, player:object, stats:object}|null} null, если игрока ещё нет
 */
export function migrateV1(legacy) {
  if (!legacy || typeof legacy !== 'object' || !legacy.player || typeof legacy.player !== 'object') {
    return null;
  }
  const owned = Array.isArray(legacy.ownedItems) ? legacy.ownedItems : [];
  const known = [...new Set(owned)].filter((id) => LEGACY_SHOP[id]);
  const refunded = known.reduce((sum, id) => sum + LEGACY_SHOP[id].price, 0);
  const level = Math.max(1, Math.min(99, Math.floor(Number(legacy.level) || 1)));
  let crystals = 0;
  for (let l = 2; l <= level; l += 1) {
    crystals += crystalsForLevel(l);
  }
  const legacyStats = legacy.stats && typeof legacy.stats === 'object' ? legacy.stats : {};
  const reputation = Number.isFinite(Number(legacy.reputation))
    ? Math.max(0, Math.min(100, Number(legacy.reputation)))
    : 50;
  return {
    coins: count(legacy.coins) + refunded,
    player: legacyPlayer(legacy.player),
    stats: {
      reputation,
      experience: totalExperience(level, legacy.xp),
      crystals,
      rooms: [...STARTER_ROOMS],
      statistics: { patientsTreated: count(legacyStats.healed) },
      migration: {
        from: LEGACY_SAVE_KEY,
        refunded,
        furnitureTypes: known.map((id) => LEGACY_SHOP[id].type).filter(Boolean),
        achievements: Array.isArray(legacy.achievements)
          ? legacy.achievements.filter((id) => typeof id === 'string')
          : [],
      },
    },
  };
}

/** Запускается при старте меню: если изометрического игрока нет, берёт его из v0.1. */
export function migrateLegacyOnce(storage = window.localStorage) {
  try {
    const current = loadIsoSave();
    if (current && current.player) {
      return { migrated: false };
    }
    const raw = storage.getItem(LEGACY_SAVE_KEY);
    if (!raw) {
      return { migrated: false };
    }
    const result = migrateV1(JSON.parse(raw));
    if (!result) {
      return { migrated: false };
    }
    saveIso(result.coins, null, result.player, result.stats);
    return { migrated: true, refunded: result.stats.migration.refunded };
  } catch (err) {
    return { migrated: false };
  }
}
