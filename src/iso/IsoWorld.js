import IsoDepth, { isBehind } from './IsoDepth.js';
import { buildLayout, footprintOf } from './layoutBuilder.js';
import { anchorOf, isoKey, wallKey, wallMeta } from './isoAssets.js';
import {
  HALF_H, HALF_W, SPRITE_SCALE, footprintScreen, tileToScreen,
} from './IsoMath.js';

// Изометрический мир больницы: пол, стены, таблички и мебель на сцене Phaser.
// Данные строит layoutBuilder (чистая логика), здесь только спрайты и порядок отрисовки.

const FONT = 'Arial, "Segoe UI", sans-serif';
const FADE_ALPHA = 0.32;
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
    return !!fp && this.grid.canPlace(x, y, fp.w, fp.d);
  }

  /** Ставит предмет. Возвращает запись предмета или null, если место занято. */
  addItem(type, x, y, rot = 0) {
    const fp = footprintOf(type, rot);
    if (!fp) {
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

  /** Делает полупрозрачными куски стен, которые закрывают персонажа (стоящего позади них). */
  updateWallFade(walkerBox, screenPoint) {
    const px = screenPoint.x;
    const py = screenPoint.y - 70; // примерно середина тела
    this.wallSprites.forEach((w) => {
      const r = w.rect;
      const covers = px >= r.x - 20 && px <= r.x + r.w + 20 && py >= r.y && py <= r.y + r.h;
      const inFront = isBehind(walkerBox, w.box) && !isBehind(w.box, walkerBox);
      const target = covers && inFront ? FADE_ALPHA : 1;
      const alpha = w.sprite.alpha + (target - w.sprite.alpha) * 0.25;
      w.sprite.setAlpha(Math.abs(alpha - target) < 0.01 ? target : alpha);
    });
  }
}
