import IsoDepth, { isBehind } from './IsoDepth.js';
import { buildLayout, footprintOf } from './layoutBuilder.js';
import {
  evaluatePlacement, facingTile as facingTileOf, nearestWalkable as nearestWalkableOf,
  standCandidates, tileKey, unwrapItem,
} from './connectivity.js';
import { PATH_CONFIG } from '../data/pathConfig.js';
import TileReservations from './TileReservations.js';
import { anchorOf, isoKey, wallKey, wallMeta } from './isoAssets.js';
import {
  HALF_H, HALF_W, SPRITE_SCALE, footprintScreen, tileToScreen,
} from './IsoMath.js';

// Изометрический мир больницы: пол, стены, таблички и мебель на сцене Phaser.
// Данные строит layoutBuilder (чистая логика), здесь только спрайты и порядок отрисовки.

const FONT = 'Arial, "Segoe UI", sans-serif';
const FADE_ALPHA = 0.32;
const FADE_RADIUS = 3; // тайлов: дальше стены не проверяем
const BODY_OFFSET = 70; // px выше ног: примерная середина тела
const SIGN_SCALE = 0.7;

export default class IsoWorld {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} layout модуль src/data/layout.js
   * @param {Array|null} savedItems мебель из сохранения (вместо планировки по умолчанию)
   */
  constructor(scene, layout, savedItems = null) {
    this.scene = scene;
    this.layout = layout;
    const data = buildLayout(layout, savedItems);
    this.grid = data.grid;
    this.sorter = new IsoDepth(100);
    this.furniture = new Map(); // gridId -> { item, sprite }
    this.wallSprites = [];
    this.openTiles = data.openTiles;
    this.entrance = layout.ENTRANCE;
    this.reserved = new TileReservations();
    this.placementCache = { key: '', issue: null };

    this.buildFloors(data.floors);
    this.buildPieces(data.pieces);
    this.buildSigns(data.signs);
    data.items.forEach((item) => this.createItemSprite(item));
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
        this.scene.add
          .image(p.x, p.y, isoKey(`floor_${name}`))
          .setOrigin(0.5, 0)
          .setDisplaySize(HALF_W * 2 + 2, HALF_H * 2 + 1)
          .setDepth(0);
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

  buildSigns(signs) {
    this.signSprites = [];
    signs.forEach((sign) => {
      const p = tileToScreen(sign.x, sign.y);
      const board = this.scene.add.image(0, 0, isoKey('sign_blank')).setOrigin(0.5, anchorOf(this.scene, 'sign_blank'));
      board.setScale(SIGN_SCALE);
      const label = this.scene.add
        .text(0, -board.displayHeight * 0.33, sign.text, {
          fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#ffffff', stroke: '#0f6b57', strokeThickness: 3,
        })
        .setOrigin(0.5);
      const maxWidth = board.displayWidth * 0.66;
      if (label.width > maxWidth) {
        label.setScale(maxWidth / label.width);
      }
      const holder = this.scene.add.container(p.x, p.y - sign.lift, [board, label]).setDepth(8000);
      this.signSprites.push(holder);
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
    const items = [...this.furniture.values()].map(({ item }) => item);
    const issue = evaluatePlacement(
      this.grid, this.openTiles, items, type, x, y, rot, this.entrance,
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

  // ---- стены перед персонажем --------------------------------------------------------

  /**
   * Делает полупрозрачными куски стен, которые закрывают актёров.
   * @param {Array<{pos:{x:number,y:number}, box:object}>} actors
   */
  updateWallFade(actors) {
    const list = Array.isArray(actors) ? actors : [];
    const walls = this.wallSprites;
    for (let w = 0; w < walls.length; w += 1) {
      const wall = walls[w];
      let fade = false;
      for (let i = 0; i < list.length; i += 1) {
        const actor = list[i];
        if (this.wallFar(wall, actor.pos)) {
          continue;
        }
        const point = actor.screen || tileToScreen(actor.pos.x, actor.pos.y);
        const px = point.x;
        const py = point.y - BODY_OFFSET;
        const r = wall.rect;
        const covers = px >= r.x - 20 && px <= r.x + r.w + 20 && py >= r.y && py <= r.y + r.h;
        const inFront = isBehind(actor.box, wall.box) && !isBehind(wall.box, actor.box);
        if (covers && inFront) {
          fade = true;
          break;
        }
      }
      const target = fade ? FADE_ALPHA : 1;
      const alpha = wall.sprite.alpha + (target - wall.sprite.alpha) * 0.25;
      wall.sprite.setAlpha(Math.abs(alpha - target) < 0.01 ? target : alpha);
    }
  }

  /** Стена слишком далеко от точки в тайлах, чтобы закрывать актёра. */
  wallFar(wall, pos) {
    const dx = Math.max(wall.box.minX - pos.x, 0, pos.x - wall.box.maxX);
    const dy = Math.max(wall.box.minY - pos.y, 0, pos.y - wall.box.maxY);
    return dx * dx + dy * dy > FADE_RADIUS * FADE_RADIUS;
  }
}
