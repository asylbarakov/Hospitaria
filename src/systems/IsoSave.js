// Сохранение изометрической больницы (v2): монеты, расстановка мебели и игрок.
// Отдельный ключ, чтобы не мешать сохранению v0.1; миграция в этапе 20.
// items = null значит «планировка по умолчанию», player = null значит «ещё не создан».

import { normalizePlayer } from '../data/playerSkins.js';

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
      coins: Number.isFinite(data.coins) ? data.coins : null,
      items: Array.isArray(data.items) ? data.items : null,
      player: data.player ? normalizePlayer(data.player) : null,
      reputation: Number.isFinite(data.reputation)
        ? Math.max(0, Math.min(100, data.reputation))
        : null,
      experience: Number.isFinite(data.experience) ? Math.max(0, data.experience) : null,
      crystals: Number.isFinite(data.crystals) ? Math.max(0, data.crystals) : null,
      staff: Array.isArray(data.staff) ? data.staff : null,
      quests: data.quests && typeof data.quests === 'object' ? data.quests : null,
    };
  } catch (err) {
    return null;
  }
}

/**
 * @param {number|null} coins
 * @param {Array|null} items
 * @param {object|null} player
 * @param {{reputation?:number, experience?:number, crystals?:number,
 *   staff?:Array, quests?:object}|null} stats поля этапов v2
 */
export function saveIso(coins, items, player = null, stats = null) {
  try {
    const previous = loadIsoSave();
    const data = {
      v: 1,
      coins: Number.isFinite(coins) ? coins : null,
      items: Array.isArray(items) ? items : null,
    };
    if (player) {
      data.player = normalizePlayer(player);
    }
    const reputation = stats && Number.isFinite(stats.reputation)
      ? stats.reputation
      : (previous && Number.isFinite(previous.reputation) ? previous.reputation : null);
    if (Number.isFinite(reputation)) {
      data.reputation = Math.max(0, Math.min(100, reputation));
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
    const experience = stats && Number.isFinite(stats.experience)
      ? stats.experience
      : (previous && Number.isFinite(previous.experience) ? previous.experience : null);
    if (Number.isFinite(experience)) {
      data.experience = Math.max(0, Math.round(experience));
    }
    const crystals = stats && Number.isFinite(stats.crystals)
      ? stats.crystals
      : (previous && Number.isFinite(previous.crystals) ? previous.crystals : null);
    if (Number.isFinite(crystals)) {
      data.crystals = Math.max(0, Math.round(crystals));
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
