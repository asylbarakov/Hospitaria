import IsoDepth from './IsoDepth.js';
import { buildLayout, footprintOf } from './layoutBuilder.js';
import {
  evaluatePlacement, facingTile as facingTileOf, nearestWalkable as nearestWalkableOf,
  standCandidates, tileKey, unwrapItem,
} from './connectivity.js';
import { PATH_CONFIG } from '../data/pathConfig.js';
import TileReservations from './TileReservations.js';
import { anchorOf, isoKey, wallKey, wallMeta } from './isoAssets.js';
import worldRooms from './worldRooms.js';
import worldVisuals from './worldVisuals.js';
import worldGrid from './worldGrid.js';
import {
  HALF_H, HALF_W, SPRITE_SCALE, footprintScreen, tileToScreen,
} from './IsoMath.js';

// Изометрический мир больницы: пол, стены, таблички и мебель на сцене Phaser.
// Данные строит layoutBuilder (чистая логика), здесь только спрайты и порядок отрисовки.

export default class IsoWorld {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} layout модуль src/data/layout.js
   * @param {Array|null} savedItems мебель из сохранения (вместо планировки по умолчанию)
   * @param {{roomLocks?:object}} options roomLocks: RoomUnlocks для закрытых кабинетов
   */
  constructor(scene, layout, savedItems = null, options = {}) {
    this.scene = scene;
    this.layout = layout;
    this.roomLocks = options.roomLocks || null;
    const data = buildLayout(layout, savedItems);
    this.grid = data.grid;
    this.sorter = new IsoDepth(100);
    this.furniture = new Map(); // gridId -> { item, sprite }
    this.wallSprites = [];
    this.floorSprites = new Map();
    this.signs = [];
    this.closedRooms = new Set();
    this.openTiles = data.openTiles;
    this.entrance = layout.ENTRANCE;
    this.reserved = new TileReservations();
    this.placementCache = { key: '', issue: null };

    this.buildFloors(data.floors);
    this.buildPieces(data.pieces);
    this.buildSigns(data.signs);
    data.items.forEach((item) => this.createItemSprite(item));
    this.applyRoomLocks();
    this.buildGridOverlay();
    this.sorter.sort();
  }

  // ---- построение --------------------------------------------------------------------

  buildFloors(floors) {
    const { cols, rows } = this.grid;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const name = floors[y * cols + x];
        if (!name) {
          continue;
        }
        const p = tileToScreen(x, y);
        // Ромб чуть больше тайла, чтобы между плитками не было щелей.
        const sprite = this.scene.add
          .image(p.x, p.y, isoKey(`floor_${name}`))
          .setOrigin(0.5, 0)
          .setDisplaySize(HALF_W * 2 + 2, HALF_H * 2 + 1)
          .setDepth(0);
        this.floorSprites.set(`${x}:${y}`, sprite);
      }
    }
  }

  buildPieces(pieces) {
    pieces.forEach((piece) => {
      const meta = wallMeta(this.scene, piece.name);
      const p = tileToScreen(piece.fx, piece.fy);
      const sprite = this.scene.add
        .image(p.x, p.y, wallKey(piece.name))
        .setOrigin(meta.ax / meta.w, meta.ay / meta.h)
        .setScale(SPRITE_SCALE);
      this.sorter.add(sprite, piece.box);
      this.wallSprites.push({
        sprite,
        box: piece.box,
        rect: {
          x: p.x - meta.ax * SPRITE_SCALE,
          y: p.y - meta.ay * SPRITE_SCALE,
          w: meta.w * SPRITE_SCALE,
          h: meta.h * SPRITE_SCALE,
        },
      });
    });
  }

  createItemSprite(item) {
    const fp = footprintScreen(item.x, item.y, item.w, item.d);
    const sprite = this.scene.add
      .image(fp.center.x, fp.bottom.y, isoKey(item.type))
      .setOrigin(0.5, anchorOf(this.scene, item.type))
      .setScale(SPRITE_SCALE)
      .setFlipX(!!item.rot);
    this.sorter.add(sprite, { minX: item.x, maxX: item.x + item.w, minY: item.y, maxY: item.y + item.d });
    this.furniture.set(item.gridId, { item, sprite });
  }

  // ---- мебель: постановка и продажа --------------------------------------------------

  canPlaceItem(type, x, y, rot = 0) {
    const fp = footprintOf(type, rot);
    if (!fp || this.overlapsDoor(x, y, fp.w, fp.d)) {
      return false;
    }
    return this.grid.canPlace(x, y, fp.w, fp.d);
  }

  /** Дверные тайлы всегда остаются проходимыми: мебель на них не ставим. */
  overlapsDoor(x, y, w, d) {
    for (let ty = y; ty < y + d; ty += 1) {
      for (let tx = x; tx < x + w; tx += 1) {
        if (this.openTiles.has(tileKey(tx, ty))) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Причина отказа: null | 'door' | 'occupied' | 'passage'.
   * Проверяет и свободное место, и то, что после постановки все двери и подходы
   * к мебели останутся достижимыми от входа.
   */
  placementIssue(type, x, y, rot = 0) {
    const key = `${this.grid.revision}:${type}:${x}:${y}:${rot}`;
    if (this.placementCache.key === key) {
      return this.placementCache.issue;
    }
    const items = [...this.furniture.values()]
      .filter(({ item }) => !this.itemInClosedRoom(item))
      .map(({ item }) => item);
    const issue = evaluatePlacement(
      this.grid, this.activeOpenTiles(), items, type, x, y, rot, this.entrance,
    );
    this.placementCache = { key, issue };
    return issue;
  }

  /** Ближайший проходимый тайл рядом с предметом; facing — тайл, на который смотрит актёр. */
  standTileFor(target) {
    const item = unwrapItem(target);
    if (!item) {
      return null;
    }
    const stand = standCandidates(this.grid, item)[0];
    return stand ? { ...stand, facing: facingTileOf(item, stand) } : null;
  }

  facingTile(target, from) {
    return facingTileOf(target, from);
  }

  nearestWalkable(x, y, maxRadius = PATH_CONFIG.maxStandRadius) {
    return nearestWalkableOf(this.grid, x, y, maxRadius);
  }

  /** Предметы мебели: для точек интереса пациентов и проверок строительства. */
  items() {
    return [...this.furniture.values()].map(({ item }) => item);
  }

  isDoorTile(x, y) {
    return this.openTiles.has(tileKey(x, y));
  }

  // ---- закрытые кабинеты (этап 17.5) -------------------------------------------------

  nowMs() {
    return this.scene && this.scene.time && Number.isFinite(this.scene.time.now)
      ? this.scene.time.now
      : Date.now();
  }

  /** Короткая бронь узкого места (двери), чтобы двое не прошли одновременно. */
  reserveTile(x, y, owner, now = this.nowMs(), ttl = PATH_CONFIG.doorReserveMs) {
    this.reserved.reserve(x, y, owner, now, ttl);
  }

  isTileFree(x, y, owner, now = this.nowMs()) {
    return this.reserved.isFree(x, y, owner, now);
  }

  releaseTile(x, y, owner) {
    this.reserved.release(x, y, owner);
  }

  releaseActorTiles(owner) {
    this.reserved.releaseOwner(owner);
  }

  /** Ставит предмет. Возвращает запись предмета или null, если место занято. */
  addItem(type, x, y, rot = 0) {
    const fp = footprintOf(type, rot);
    if (!fp || !this.canPlaceItem(type, x, y, rot)) {
      return null;
    }
    const gridId = this.grid.place(x, y, fp.w, fp.d, { type });
    if (gridId === -1) {
      return null;
    }
    const item = { type, x, y, rot: rot ? 1 : 0, w: fp.w, d: fp.d, gridId };
    this.createItemSprite(item);
    this.sorter.sort();
    return item;
  }

  removeItem(gridId) {
    const entry = this.furniture.get(gridId);
    if (!entry) {
      return null;
    }
    this.grid.remove(gridId);
    this.sorter.remove(entry.sprite);
    entry.sprite.destroy();
    this.furniture.delete(gridId);
    this.sorter.sort();
    return entry.item;
  }

  itemAt(x, y) {
    const obj = this.grid.objectAt(x, y);
    return obj ? this.furniture.get(obj.id) || null : null;
  }

  serialize() {
    return [...this.furniture.values()].map(({ item }) => ({
      type: item.type, x: item.x, y: item.y, rot: item.rot,
    }));
  }

}

// Методы кабинетов, визуала и сетки вынесены в отдельные файлы (лимит 300 строк на файл).
Object.assign(IsoWorld.prototype, worldRooms, worldVisuals, worldGrid);
