import { tileKey } from './connectivity.js';

// Закрытые кабинеты (этап 17.5): методы подмешиваются в IsoWorld (Object.assign в IsoWorld.js).
// Здесь `this` это IsoWorld; файл вынесен из него, чтобы держать модули в пределах 300 строк.

const worldRooms = {
  itemInClosedRoom(item) {
    return (this.layout.ROOMS || []).some((room) => {
      if (room.kind !== 'room' || !this.closedRooms.has(room.id)) {
        return false;
      }
      return item.x >= room.x && item.y >= room.y
        && item.x + item.w <= room.x + room.w
        && item.y + item.d <= room.y + room.h;
    });
  },

  /** Двери закрытых кабинетов не участвуют в проверке связности построек. */
  activeOpenTiles() {
    if (!this.closedRooms || this.closedRooms.size === 0) {
      return this.openTiles;
    }
    const closedDoors = new Set();
    this.closedRooms.forEach((roomId) => {
      const room = this.roomById(roomId);
      if (room) {
        this.doorTilesOf(room).forEach((tile) => closedDoors.add(tileKey(tile.x, tile.y)));
      }
    });
    return new Set([...this.openTiles].filter((key) => !closedDoors.has(key)));
  },

  roomById(roomId) {
    return (this.layout.ROOMS || []).find((room) => room.id === roomId) || null;
  },

  roomName(roomId) {
    const room = this.roomById(roomId);
    return room ? room.name : 'Кабинет';
  },

  /** id комнаты по тайлу: внутренность или дверной проём. */
  roomForTile(x, y) {
    const rooms = this.layout.ROOMS || [];
    for (const room of rooms) {
      if (room.kind !== 'room') {
        continue;
      }
      if (x >= room.x && x < room.x + room.w && y >= room.y && y < room.y + room.h) {
        return room.id;
      }
      if (this.doorTilesOf(room).some((tile) => tile.x === x && tile.y === y)) {
        return room.id;
      }
    }
    return null;
  },

  /** Дверные тайлы комнаты в координатах сетки. */
  doorTilesOf(room) {
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
  },

  /** Закрытая комната, в которую попадает прямоугольник застройки. */
  isRoomLockedAt(x, y, w = 1, d = 1) {
    for (const room of this.layout.ROOMS || []) {
      if (room.kind !== 'room' || !this.closedRooms.has(room.id)) {
        continue;
      }
      const overlap = x < room.x + room.w && x + w > room.x
        && y < room.y + room.h && y + d > room.y;
      if (overlap) {
        return room.id;
      }
    }
    return null;
  },

  /** Затемняет комнату, запирает двери и показывает замок в центре комнаты. */
  applyRoomLocks() {
    if (!this.roomLocks) {
      return;
    }
    (this.layout.ROOMS || []).forEach((room) => {
      if (room.kind !== 'room' || this.roomLocks.isUnlocked(room.id)) {
        return;
      }
      this.closedRooms.add(room.id);
      this.doorTilesOf(room).forEach((tile) => this.grid.setBlocked(tile.x, tile.y, 1));
      this.tintRoom(room, true);
      const badge = this.lockBadges.get(room.id);
      if (badge) {
        badge.setVisible(true);
      }
    });
  },

  tintRoom(room, closed) {
    for (let y = room.y; y < room.y + room.h; y += 1) {
      for (let x = room.x; x < room.x + room.w; x += 1) {
        const floor = this.floorSprites.get(`${x}:${y}`);
        if (!floor) {
          continue;
        }
        if (closed) {
          floor.setTint(0x6f838c).setAlpha(0.8);
        } else {
          floor.clearTint().setAlpha(1);
        }
      }
    }
    this.furniture.forEach(({ item, sprite }) => {
      const inside = item.x >= room.x && item.y >= room.y
        && item.x + item.w <= room.x + room.w
        && item.y + item.d <= room.y + room.h;
      if (!inside) {
        return;
      }
      if (closed) {
        sprite.setTint(0x8fa0a5).setAlpha(0.7);
      } else {
        sprite.clearTint().setAlpha(1);
      }
    });
  },

  /** Открывает комнату без перезапуска сцены: двери снова проходимы, цвета возвращаются. */
  setRoomUnlocked(roomId) {
    const room = this.roomById(roomId);
    if (!room || !this.closedRooms.has(roomId)) {
      return;
    }
    this.closedRooms.delete(roomId);
    this.doorTilesOf(room).forEach((tile) => this.grid.setBlocked(tile.x, tile.y, 0));
    this.tintRoom(room, false);
    const badge = this.lockBadges.get(roomId);
    if (badge) {
      badge.setVisible(false);
    }
    this.placementCache = { key: '', issue: null };
    this.sorter.sort();
  }
};

export default worldRooms;
