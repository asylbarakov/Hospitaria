// Открытие кабинетов (этап 17.5). Чистая логика без Phaser: набор открытых комнат,
// проверка цены и атомарная покупка через GameState. Событие roomUnlocked уходит в шину.

import {
  ROOM_IDS, ROOM_UNLOCKS, STARTER_ROOMS, isStarterRoom, roomUnlockOf, totalRoomCrystals,
} from '../data/roomUnlocks.js';

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function stateValue(state, field) {
  return state && Number.isFinite(state[field]) ? num(state[field]) : 0;
}

function stateLevel(state) {
  if (!state) {
    return 1;
  }
  if (Number.isFinite(state.level)) {
    return Math.max(1, Math.floor(state.level));
  }
  return 1;
}

export default class RoomUnlocks {
  /**
   * @param {{state?:object, saved?:object|null, bus?:object,
   *   onChange?:Function}} options
   *   saved: результат loadIsoSave. Старое сохранение без поля rooms открывает всё.
   */
  constructor(options = {}) {
    this.state = options.state || null;
    this.bus = options.bus || null;
    this.onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
    this.rooms = this.readSaved(options.saved);
  }

  readSaved(saved) {
    let list;
    if (!saved) {
      list = [...STARTER_ROOMS]; // новая игра: только три стартовых кабинета
    } else if (Array.isArray(saved.rooms)) {
      list = saved.rooms;
    } else {
      list = [...ROOM_IDS]; // прогресс до 17.5: никого не блокируем
    }
    const known = new Set(list.filter((id) => ROOM_IDS.includes(id)));
    STARTER_ROOMS.forEach((id) => known.add(id));
    return known;
  }

  isUnlocked(roomId) {
    if (!roomUnlockOf(roomId)) {
      return true; // неизвестную комнату не запираем, чтобы не сломать мир
    }
    return isStarterRoom(roomId) || this.rooms.has(roomId);
  }

  /** @returns {{ok:boolean, reason?:string, hint?:string, entry?:object,
   *   missing?:{coins:number,crystals:number,levels:number}}} */
  canUnlock(roomId, state = this.state) {
    const entry = roomUnlockOf(roomId);
    if (!entry) {
      return { ok: false, reason: 'unknown', hint: 'Неизвестный кабинет' };
    }
    if (this.isUnlocked(roomId)) {
      return { ok: false, reason: 'unlocked', hint: 'Кабинет уже открыт', entry };
    }
    const level = stateLevel(state);
    const coins = stateValue(state, 'coins');
    const crystals = stateValue(state, 'crystals');
    const missing = {
      coins: Math.max(0, entry.coins - coins),
      crystals: Math.max(0, entry.crystals - crystals),
      levels: Math.max(0, entry.minLevel - level),
    };
    if (missing.levels > 0) {
      return {
        ok: false,
        reason: 'level',
        hint: `Нужен уровень ${entry.minLevel}`,
        entry,
        missing,
      };
    }
    if (missing.coins > 0) {
      return {
        ok: false,
        reason: 'coins',
        hint: `Не хватает ${missing.coins} монет`,
        entry,
        missing,
      };
    }
    if (missing.crystals > 0) {
      return {
        ok: false,
        reason: 'crystals',
        hint: `Не хватает ${missing.crystals} кристаллов`,
        entry,
        missing,
      };
    }
    return { ok: true, entry, missing };
  }

  /**
   * Покупка. Сначала проверяются обе валюты и уровень, потом списание:
   * при нехватке не меняется ничего.
   */
  unlock(roomId, state = this.state) {
    const check = this.canUnlock(roomId, state);
    if (!check.ok) {
      return check;
    }
    const entry = check.entry;
    if (entry.coins > 0) {
      if (state && typeof state.spend === 'function') {
        state.spend(entry.coins);
      } else if (state) {
        state.coins = Math.max(0, stateValue(state, 'coins') - entry.coins);
      }
    }
    if (entry.crystals > 0) {
      if (state && typeof state.spendCrystals === 'function') {
        state.spendCrystals(entry.crystals);
      } else if (state) {
        state.crystals = Math.max(0, stateValue(state, 'crystals') - entry.crystals);
      }
    }
    this.rooms.add(roomId);
    this.onChange(roomId);
    if (this.bus && typeof this.bus.emit === 'function') {
      this.bus.emit('roomUnlocked', { roomId, title: entry.title });
    }
    return {
      ok: true,
      roomId,
      entry,
      spent: { coins: entry.coins, crystals: entry.crystals },
    };
  }

  /** Данные для магазина и окна открытия. */
  list(state = this.state) {
    return ROOM_UNLOCKS.map((entry) => {
      const unlocked = this.isUnlocked(entry.roomId);
      return {
        ...entry,
        unlocked,
        starter: isStarterRoom(entry.roomId),
        check: unlocked ? null : this.canUnlock(entry.roomId, state),
      };
    });
  }

  serialize() {
    return [...this.rooms];
  }

  reset() {
    this.rooms = new Set(STARTER_ROOMS);
    this.onChange(null);
  }

  static totalCrystals() {
    return totalRoomCrystals();
  }
}

export { ROOM_UNLOCKS, STARTER_ROOMS };
