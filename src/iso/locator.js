// Где сейчас игрок (для верхней панели): кабинет, зона, коридор или улица.
// Чистая функция без Phaser: берёт данные планировки (ROOMS, BUILDING) и тайл.

const inside = (box, x, y) => x >= box.x && x < box.x + box.w && y >= box.y && y < box.y + box.h;

function doorTiles(room) {
  return (room.doors || []).map((door) => {
    if (door.side === 'N') {
      return { x: door.at, y: room.y - 1 };
    }
    if (door.side === 'S') {
      return { x: door.at, y: room.y + room.h };
    }
    if (door.side === 'W') {
      return { x: room.x - 1, y: door.at };
    }
    return { x: room.x + room.w, y: door.at };
  });
}

/**
 * @param {{ROOMS?:object[], BUILDING?:object}|null} layout
 * @param {number} px тайл по X (дробные округляются вниз)
 * @param {number} py тайл по Y
 * @returns {string} название места; пустая строка, если координаты некорректны
 */
export function locationName(layout, px, py) {
  if (!layout || !Number.isFinite(px) || !Number.isFinite(py)) {
    return '';
  }
  const x = Math.floor(px);
  const y = Math.floor(py);
  const rooms = layout.ROOMS || [];
  for (const room of rooms) {
    if (room.kind === 'room'
      && (inside(room, x, y) || doorTiles(room).some((tile) => tile.x === x && tile.y === y))) {
      return room.name;
    }
  }
  for (const zone of rooms) {
    if (zone.kind === 'zone' && inside(zone, x, y)) {
      return zone.name;
    }
  }
  return layout.BUILDING && !inside(layout.BUILDING, x, y) ? 'Улица' : 'Коридор';
}

export default locationName;
