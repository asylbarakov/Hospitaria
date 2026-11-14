// Точки интереса персонала (этап 15): посты у мебели, место ожидания и пятна.
// Отдельный адаптер, чтобы StaffFlow не зависел от Phaser и IsoWorld.

import { STAFF_DIRT_TILES, STAFF_IDLE_TILES } from '../data/staffCatalog.js';
import { fallbackSlots, staffPosts } from './worldSlots.js';

export default class StaffPoints {
  /** @param {import('./IsoWorld.js').default} world */
  constructor(world) {
    this.world = world;
  }

  get grid() {
    return this.world.grid;
  }

  revision() {
    return this.grid.revision;
  }

  entrance() {
    const tile = this.world.entrance;
    return { x: tile.x + 0.5, y: tile.y + 0.5 };
  }

  /** Посты указанных типов: {key,itemId,type,x,y,roomId}. */
  posts(types) {
    return staffPosts(this.grid, this.world.items(), this.world.layout.ROOMS, types);
  }

  idleSpots() {
    return fallbackSlots(this.grid, STAFF_IDLE_TILES);
  }

  dirtTiles() {
    return fallbackSlots(this.grid, STAFF_DIRT_TILES);
  }
}
