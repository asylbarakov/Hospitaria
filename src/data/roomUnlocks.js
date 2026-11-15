// Открытие кабинетов (этап 17.5): цены в монетах и кристаллах, минимальный уровень.
// Данные берутся из планировки layout.js, чтобы список комнат не расходился с миром.
// Стартовые комнаты открыты всегда: без них новая игра не начнётся.

import { ROOMS } from './layout.js';

export const STARTER_ROOMS = Object.freeze(['hall', 'reception', 'therapist']);

// roomId -> цена. Меняйте только здесь; логика в src/systems/RoomUnlocks.js.
export const ROOM_PRICES = {
  hall: { coins: 0, crystals: 0, minLevel: 1 },
  reception: { coins: 0, crystals: 0, minLevel: 1 },
  therapist: { coins: 0, crystals: 0, minLevel: 1 },
  cafeteria: { coins: 100, crystals: 5, minLevel: 3 },
  procedure: { coins: 100, crystals: 5, minLevel: 3 },
  pharmacy: { coins: 100, crystals: 5, minLevel: 4 },
  ward: { coins: 150, crystals: 6, minLevel: 4 },
  lab: { coins: 250, crystals: 8, minLevel: 5 },
  xray: { coins: 250, crystals: 8, minLevel: 6 },
};

const FALLBACK_PRICE = { coins: 0, crystals: 0, minLevel: 1 };

export const ROOM_UNLOCKS = ROOMS.map((room) => ({
  roomId: room.id,
  title: room.name,
  kind: room.kind,
  ...(ROOM_PRICES[room.id] || FALLBACK_PRICE),
}));

export const ROOM_UNLOCK_BY_ID = Object.fromEntries(
  ROOM_UNLOCKS.map((entry) => [entry.roomId, entry]),
);

export const ROOM_IDS = ROOM_UNLOCKS.map((entry) => entry.roomId);

export function roomUnlockOf(roomId) {
  return ROOM_UNLOCK_BY_ID[roomId] || null;
}

export function isStarterRoom(roomId) {
  return STARTER_ROOMS.includes(roomId);
}

/** Полная стоимость всех закрытых на старте кабинетов: используется в балансе и тестах. */
export function totalRoomCrystals() {
  return ROOM_UNLOCKS
    .filter((entry) => !STARTER_ROOMS.includes(entry.roomId))
    .reduce((sum, entry) => sum + entry.crystals, 0);
}

export default ROOM_UNLOCKS;
