// Чистые точки интереса для пациентов (этап 14, без Phaser).
// Слот это один предмет: кресло, диван, кушетка, стойка регистратуры или касса.
// Один агент занимает один слот, поэтому занятость считается по ключу `item:<gridId>`.

import { nearestWalkable, standCandidates } from './connectivity.js';
import {
  PAY_ITEM_TYPES, RECEPTION_ITEM_TYPES, TREATMENT_ITEMS, WAITING_ITEM_TYPES,
} from '../data/patientFlow.js';

export function roomById(rooms, roomId) {
  return (rooms || []).find((room) => room.id === roomId) || null;
}

/** Предмет полностью стоит внутри комнаты (стены и коридор не считаются). */
export function itemInRoom(item, room) {
  if (!item || !room) {
    return false;
  }
  return item.x >= room.x
    && item.y >= room.y
    && item.x + item.w <= room.x + room.w
    && item.y + item.d <= room.y + room.h;
}

export function slotKeyOf(item) {
  const id = Number.isFinite(item.gridId) ? item.gridId : `${item.x},${item.y}`;
  return `item:${id}`;
}

/** Один слот на предмет: ближайший проходимый тайл рядом с ним. */
export function slotForItem(grid, item) {
  if (!item) {
    return null;
  }
  const stand = standCandidates(grid, item)[0];
  if (!stand) {
    return null;
  }
  return {
    key: slotKeyOf(item),
    itemId: item.gridId,
    type: item.type,
    x: stand.x,
    y: stand.y,
  };
}

function collect(grid, items, types, room = null) {
  const out = [];
  (items || []).forEach((item) => {
    if (!types.includes(item.type)) {
      return;
    }
    if (room && !itemInRoom(item, room)) {
      return;
    }
    const slot = slotForItem(grid, item);
    if (slot) {
      out.push(slot);
    }
  });
  out.sort((a, b) => a.y - b.y || a.x - b.x);
  return out;
}

export function waitingSlots(grid, items) {
  return collect(grid, items, WAITING_ITEM_TYPES);
}

export function receptionSlots(grid, items) {
  return collect(grid, items, RECEPTION_ITEM_TYPES);
}

export function paySlots(grid, items) {
  return collect(grid, items, PAY_ITEM_TYPES);
}

export function treatmentSlots(grid, items, rooms, roomId) {
  const room = roomById(rooms, roomId);
  if (!room) {
    return [];
  }
  return collect(grid, items, TREATMENT_ITEMS[roomId] || [], room);
}

/** Есть ли в комнате хотя бы один предмет для лечения. */
export function roomReady(items, rooms, roomId) {
  const room = roomById(rooms, roomId);
  if (!room) {
    return false;
  }
  const types = TREATMENT_ITEMS[roomId] || [];
  return (items || []).some((item) => types.includes(item.type) && itemInRoom(item, room));
}

/** Свободные тайлы для ожидания стоя: только проходимые. */
export function fallbackSlots(grid, tiles) {
  const out = [];
  (tiles || []).forEach((tile, index) => {
    if (grid.isWalkable(tile.x, tile.y)) {
      out.push({ key: `stand:${index}`, x: tile.x, y: tile.y });
    }
  });
  return out;
}

/** Первый проходимый тайл рядом с точкой: сюда встаёт игрок во время приёма. */
export function standNear(grid, x, y, maxRadius = 3) {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  const around = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [2, 0], [-2, 0], [0, 2], [0, -2],
  ];
  for (const [dx, dy] of around) {
    if (grid.isWalkable(cx + dx, cy + dy)) {
      return { x: cx + dx, y: cy + dy };
    }
  }
  return nearestWalkable(grid, x, y, maxRadius);
}
