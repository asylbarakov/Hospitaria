// Короткие брони тайлов (этап 13): двери и узкие проходы, чтобы двое не прошли разом.
// Чистая логика без Phaser, проверяется в node.

import { PATH_CONFIG } from '../data/pathConfig.js';
import { tileKey } from './connectivity.js';

export default class TileReservations {
  constructor() {
    this.map = new Map(); // "x:y" -> { owner, until }
  }

  /** @param {number} ttl миллисекунды жизни брони */
  reserve(x, y, owner, now = 0, ttl = PATH_CONFIG.doorReserveMs) {
    this.map.set(tileKey(x, y), { owner, until: now + ttl });
  }

  isFree(x, y, owner, now = 0) {
    const entry = this.map.get(tileKey(x, y));
    return !entry || entry.owner === owner || entry.until <= now;
  }

  release(x, y, owner) {
    const key = tileKey(x, y);
    const entry = this.map.get(key);
    if (entry && entry.owner === owner) {
      this.map.delete(key);
    }
  }

  releaseOwner(owner) {
    for (const [key, entry] of this.map) {
      if (entry.owner === owner) {
        this.map.delete(key);
      }
    }
  }

  clear() {
    this.map.clear();
  }

  get size() {
    return this.map.size;
  }
}
