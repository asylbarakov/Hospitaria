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
    };
  } catch (err) {
    return null;
  }
}

export function saveIso(coins, items, player = null) {
  try {
    const data = {
      v: 1,
      coins: Number.isFinite(coins) ? coins : null,
      items: Array.isArray(items) ? items : null,
    };
    if (player) {
      data.player = normalizePlayer(player);
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
