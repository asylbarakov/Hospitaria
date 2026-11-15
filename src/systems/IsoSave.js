// Сохранение изометрической больницы (v2): единое состояние, мебель и игрок.
// Ключ остаётся v1 для совместимости; версия схемы GameState хранится в поле schema.
// items = null значит «планировка по умолчанию», player = null значит «ещё не создан».

import { normalizePlayer } from '../data/playerSkins.js';
import { SCHEMA_VERSION } from '../data/economy.js';

const KEY = 'hospitaria.iso.layout.v1';

export function loadIsoSave() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    const data = JSON.parse(raw);
    if (!data || data.v !== 1) {
      return null;
    }
    return {
      schema: Number.isFinite(data.schema) ? data.schema : 1,
      coins: Number.isFinite(data.coins) ? data.coins : null,
      debt: Number.isFinite(data.debt) ? Math.max(0, data.debt) : null,
      items: Array.isArray(data.items) ? data.items : null,
      player: data.player ? normalizePlayer(data.player) : null,
      reputation: Number.isFinite(data.reputation)
        ? Math.max(0, Math.min(100, data.reputation))
        : null,
      experience: Number.isFinite(data.experience) ? Math.max(0, data.experience) : null,
      crystals: Number.isFinite(data.crystals) ? Math.max(0, data.crystals) : null,
      statistics: data.statistics && typeof data.statistics === 'object'
        ? data.statistics
        : null,
      economy: data.economy && typeof data.economy === 'object' ? data.economy : null,
      staff: Array.isArray(data.staff) ? data.staff : null,
      quests: data.quests && typeof data.quests === 'object' ? data.quests : null,
    };
  } catch (err) {
    return null;
  }
}

function pickNumber(stats, previous, field, sanitize = (n) => n) {
  if (stats && Number.isFinite(stats[field])) {
    return sanitize(stats[field]);
  }
  if (previous && Number.isFinite(previous[field])) {
    return sanitize(previous[field]);
  }
  return null;
}

/**
 * @param {number|null} coins
 * @param {Array|null} items
 * @param {object|null} player
 * @param {{reputation?:number, experience?:number, crystals?:number, debt?:number,
 *   statistics?:object, economy?:object, staff?:Array, quests?:object}|null} stats
 */
export function saveIso(coins, items, player = null, stats = null) {
  try {
    const previous = loadIsoSave();
    const data = {
      v: 1,
      schema: SCHEMA_VERSION,
      coins: Number.isFinite(coins) ? coins : null,
      items: Array.isArray(items) ? items : null,
    };
    if (player) {
      data.player = normalizePlayer(player);
    }
    const reputation = pickNumber(stats, previous, 'reputation', (n) => Math.max(0, Math.min(100, n)));
    if (Number.isFinite(reputation)) {
      data.reputation = reputation;
    }
    const debt = pickNumber(stats, previous, 'debt', (n) => Math.max(0, Math.round(n)));
    if (Number.isFinite(debt)) {
      data.debt = debt;
    }
    const staff = stats && Array.isArray(stats.staff)
      ? stats.staff
      : (previous && Array.isArray(previous.staff) ? previous.staff : null);
    if (Array.isArray(staff)) {
      data.staff = staff.map((entry) => ({
        roleId: entry && entry.roleId,
        name: entry && entry.name,
        postItemId: entry && Number.isFinite(entry.postItemId) ? entry.postItemId : null,
      }));
    }
    const experience = pickNumber(stats, previous, 'experience', (n) => Math.max(0, Math.round(n)));
    if (Number.isFinite(experience)) {
      data.experience = experience;
    }
    const crystals = pickNumber(stats, previous, 'crystals', (n) => Math.max(0, Math.round(n)));
    if (Number.isFinite(crystals)) {
      data.crystals = crystals;
    }
    if (stats && stats.statistics && typeof stats.statistics === 'object') {
      data.statistics = { ...stats.statistics };
    } else if (previous && previous.statistics) {
      data.statistics = previous.statistics;
    }
    if (stats && stats.economy && typeof stats.economy === 'object') {
      data.economy = stats.economy;
    } else if (previous && previous.economy) {
      data.economy = previous.economy;
    }
    if (stats && stats.quests && typeof stats.quests === 'object') {
      data.quests = stats.quests;
    } else if (previous && previous.quests) {
      data.quests = previous.quests;
    }
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch (err) {
    // localStorage может быть недоступен (приватный режим): игра работает без сохранения.
  }
}

export function clearIsoSave() {
  try {
    window.localStorage.removeItem(KEY);
  } catch (err) {
    // ничего не делаем
  }
}
