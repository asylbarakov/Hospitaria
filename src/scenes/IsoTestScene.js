import IsoGrid from '../iso/IsoGrid.js';
import IsoDepth from '../iso/IsoDepth.js';
import IsoCamera from '../iso/IsoCamera.js';
import { queueIsoAssets, anchorOf, isoKey } from '../iso/isoAssets.js';
import {
  HALF_H, HALF_W, SPRITE_SCALE, footprintScreen, screenToTileIndex, tileCenter, tileToScreen, worldBounds,
} from '../iso/IsoMath.js';

// Тестовая сцена этапа 10: сетка, подсветка тайла под курсором, предметы с сортировкой
// по глубине и персонаж, который ходит по клику. Мир строится из PNG assets/final.

const COLS = 20;
const ROWS = 20;
const WALK_SPEED = 3.2; // тайлов в секунду
const WALKER_RADIUS = 0.2; // «толщина» персонажа для сортировки, в тайлах

// Предметы: имя спрайта из assets/final, тайл (x, y) и размер основания (w x d) в тайлах.
const FURNITURE = [
  { name: 'reception_desk', x: 6, y: 3, w: 3, d: 1 },
  { name: 'hall_sofa', x: 2, y: 7, w: 2, d: 1 },
  { name: 'doctor_desk', x: 9, y: 9, w: 2, d: 1 },
  { name: 'plant_big', x: 13, y: 5, w: 1, d: 1 },
  { name: 'exam_couch', x: 5, y: 12, w: 2, d: 1 },
  { name: 'waiting_chair', x: 9, y: 6, w: 1, d: 1 },
  { name: 'waiting_chair', x: 10, y: 6, w: 1, d: 1 },
  { name: 'water_cooler', x: 3, y: 4, w: 1, d: 1 },
  { name: 'ward_bed', x: 14, y: 12, w: 2, d: 1 },
  { name: 'vending_machine', x: 16, y: 4, w: 1, d: 1 },
  { name: 'xray_machine', x: 13, y: 15, w: 2, d: 2 },
  { name: 'cafe_table', x: 4, y: 16, w: 1, d: 1 },
];

export default class IsoTestScene extends Phaser.Scene {
  constructor() {
    super('IsoTestScene');
  }

  preload() {
    const label = this.add
      .text(640, 360, 'Загрузка ассетов…', { fontFamily: 'Arial, sans-serif', fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5);
    this.load.on('progress', (value) => label.setText(`Загрузка ассетов… ${Math.round(value * 100)}%`));
    queueIsoAssets(this);
  }

  create() {
    this.children.list.filter((o) => o.type === 'Text').forEach((o) => o.destroy());
    this.cameras.main.setBackgroundColor('#10222e');

    this.grid = new IsoGrid(COLS, ROWS);
    this.grid.fillFloor(0, 0, COLS, ROWS, 1);
    this.sorter = new IsoDepth(100);
    this.showDebug = false;
    this.hoverTile = { x: -1, y: -1 };
    this.pointerInside = false;
    this.path = [];
    this.walkClock = 0;

    this.buildFloor();
    this.buildFurniture();
    this.buildWalker();

    this.hover = this.add.graphics().setDepth(2);
    this.debugLayer = this.add.graphics().setDepth(3).setVisible(false);
    this.drawDebug();

    const bounds = worldBounds(COLS, ROWS, 260);
    this.iso = new IsoCamera(this, {
      bounds,
      minZoom: 0.45,
      maxZoom: 2,
      margin: 120,
      onTap: (pointer) => this.handleTap(pointer),
      canStartDrag: (pointer) => !this.hud || !this.hud.isOverUi(pointer),
    });
    const mid = tileCenter(COLS / 2, ROWS / 2);
    this.iso.centerOn(mid.x, mid.y - 40);

    this.input.keyboard.on('keydown-G', () => this.toggleDebug());
    this.input.keyboard.on('keydown-ESC', () => this.exitToMenu());

    this.scene.launch('IsoHudScene');
    this.hud = this.scene.get('IsoHudScene');
    this.events.once('shutdown', () => this.cleanup());
  }

  // ---- построение мира --------------------------------------------------------------

  buildFloor() {
    // Три вида пола, чтобы сразу видеть стыки: холл (дерево), кабинеты (клетка), лаборатория.
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        let name = 'floor_hall';
        if (x >= 12 && y >= 10) {
          name = 'floor_clinic';
        } else if (x >= 12 && y < 10) {
          name = 'floor_lab';
        }
        const p = tileToScreen(x, y);
        // Ромб чуть больше тайла (на 1 px), чтобы между плитками не было волосяных щелей.
        this.add
          .image(p.x, p.y, isoKey(name))
          .setOrigin(0.5, 0)
          .setDisplaySize(HALF_W * 2 + 2, HALF_H * 2 + 1)
          .setDepth(0);
      }
    }
  }

  buildFurniture() {
    this.furniture = [];
    FURNITURE.forEach((item) => {
      const id = this.grid.place(item.x, item.y, item.w, item.d, item);
      if (id === -1) {
        return;
      }
      const fp = footprintScreen(item.x, item.y, item.w, item.d);
      // Горизонтально центрируем по ромбу основания, по вертикали ставим низ спрайта на нижнюю вершину.
      const sprite = this.add
        .image(fp.center.x, fp.bottom.y, isoKey(item.name))
        .setOrigin(0.5, anchorOf(this, item.name))
        .setScale(SPRITE_SCALE);
      this.sorter.add(sprite, { minX: item.x, maxX: item.x + item.w, minY: item.y, maxY: item.y + item.d });
      this.furniture.push({ item, sprite });
    });
  }

  buildWalker() {
    this.pos = { x: 1.5, y: 1.5 }; // непрерывные координаты тайлов
    this.shadow = this.add.ellipse(0, 0, 46, 20, 0x000000, 0.28).setDepth(1);
    this.walker = this.add
      .image(0, 0, isoKey('staff_doctor'))
      .setOrigin(0.5, anchorOf(this, 'staff_doctor'))
      .setScale(SPRITE_SCALE);
    this.sorter.add(this.walker, this.walkerBox());
    this.placeWalker(0);
  }

  walkerBox() {
    const r = WALKER_RADIUS;
    return { minX: this.pos.x - r, maxX: this.pos.x + r, minY: this.pos.y - r, maxY: this.pos.y + r };
  }

  placeWalker(bob) {
    const p = tileToScreen(this.pos.x, this.pos.y);
    this.walker.setPosition(p.x, p.y - bob);
    this.shadow.setPosition(p.x, p.y);
  }

  // ---- ввод --------------------------------------------------------------------------

  handleTap(pointer) {
    if (this.hud && this.hud.isOverUi(pointer)) {
      return;
    }
    const tile = this.pointerTile(pointer);
    if (!this.grid.isWalkable(tile.x, tile.y)) {
      this.flashBlocked(tile);
      return;
    }
    const start = { x: Math.floor(this.pos.x), y: Math.floor(this.pos.y) };
    const path = this.grid.findPath(start.x, start.y, tile.x, tile.y);
    if (path === null) {
      this.flashBlocked(tile);
      return;
    }
    this.path = path;
  }

  pointerTile(pointer) {
    const w = this.iso.screenToWorld(pointer.x, pointer.y);
    return screenToTileIndex(w.x, w.y);
  }

  flashBlocked(tile) {
    this.blockedFlash = { x: tile.x, y: tile.y, until: this.time.now + 350 };
  }

  toggleDebug() {
    this.showDebug = !this.showDebug;
    this.debugLayer.setVisible(this.showDebug);
  }

  exitToMenu() {
    this.scene.stop('IsoHudScene');
    this.scene.start('MenuScene');
  }

  cleanup() {
    if (this.iso) {
      this.iso.destroy();
    }
    this.input.keyboard.off('keydown-G');
    this.input.keyboard.off('keydown-ESC');
    this.scene.stop('IsoHudScene');
  }

  // ---- отрисовка вспомогательного ----------------------------------------------------

  diamond(g, x, y, w = 1, d = 1) {
    const fp = footprintScreen(x, y, w, d);
    g.beginPath();
    g.moveTo(fp.top.x, fp.top.y);
    g.lineTo(fp.right.x, fp.right.y);
    g.lineTo(fp.bottom.x, fp.bottom.y);
    g.lineTo(fp.left.x, fp.left.y);
    g.closePath();
  }

  drawDebug() {
    const g = this.debugLayer;
    g.clear();
    // Сетка тайлов.
    g.lineStyle(1, 0xffffff, 0.22);
    for (let i = 0; i <= COLS; i += 1) {
      const a = tileToScreen(i, 0);
      const b = tileToScreen(i, ROWS);
      g.lineBetween(a.x, a.y, b.x, b.y);
    }
    for (let j = 0; j <= ROWS; j += 1) {
      const a = tileToScreen(0, j);
      const b = tileToScreen(COLS, j);
      g.lineBetween(a.x, a.y, b.x, b.y);
    }
    // Занятые мебелью тайлы и контуры оснований предметов.
    this.furniture.forEach(({ item }) => {
      g.fillStyle(0xe53935, 0.28);
      this.diamond(g, item.x, item.y, item.w, item.d);
      g.fillPath();
      g.lineStyle(2, 0xffd54f, 0.9);
      this.diamond(g, item.x, item.y, item.w, item.d);
      g.strokePath();
    });
  }

  drawHover() {
    const g = this.hover;
    g.clear();
    const flash = this.blockedFlash && this.blockedFlash.until > this.time.now ? this.blockedFlash : null;
    if (flash) {
      g.fillStyle(0xe53935, 0.55);
      this.diamond(g, flash.x, flash.y);
      g.fillPath();
    }
    const t = this.hoverTile;
    if (!this.pointerInside || !this.grid.inBounds(t.x, t.y)) {
      return;
    }
    const ok = this.grid.isWalkable(t.x, t.y);
    g.fillStyle(ok ? 0x43d17a : 0xe53935, 0.4);
    this.diamond(g, t.x, t.y);
    g.fillPath();
    g.lineStyle(2, ok ? 0xb9ffd3 : 0xffb3b0, 0.95);
    this.diamond(g, t.x, t.y);
    g.strokePath();
  }

  // ---- цикл ----------------------------------------------------------------------------

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.updateWalker(dt);

    const pointer = this.input.activePointer;
    this.pointerInside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= this.scale.width && pointer.y <= this.scale.height;
    const tile = this.pointerTile(pointer);
    this.hoverTile = tile;
    this.drawHover();

    this.sorter.sort();

    // Сверка собственного перевода экран -> мир с встроенным в Phaser (в покое разница ~0).
    const mine = this.iso.screenToWorld(pointer.x, pointer.y);
    const ref = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const projDelta = Math.hypot(mine.x - ref.x, mine.y - ref.y);

    this.debugInfo = {
      projDelta,
      tile,
      zoom: this.cameras.main.zoom,
      fps: Math.round(this.game.loop.actualFps),
      objects: this.sorter.items.length,
      walking: this.path.length > 0,
    };
  }

  updateWalker(dt) {
    let bob = 0;
    if (this.path.length > 0) {
      const target = this.path[0];
      const tx = target.x + 0.5;
      const ty = target.y + 0.5;
      const dx = tx - this.pos.x;
      const dy = ty - this.pos.y;
      const dist = Math.hypot(dx, dy);
      const step = WALK_SPEED * dt;
      if (dist <= step) {
        this.pos.x = tx;
        this.pos.y = ty;
        this.path.shift();
      } else {
        this.pos.x += (dx / dist) * step;
        this.pos.y += (dy / dist) * step;
      }
      // Экранное направление: вправо, если (dx - dy) > 0.
      if (Math.abs(dx - dy) > 0.01) {
        this.walker.setFlipX(dx - dy < 0);
      }
      this.walkClock += dt * WALK_SPEED * 5;
      bob = Math.abs(Math.sin(this.walkClock)) * 4;
      this.sorter.updateBox(this.walker, this.walkerBox());
    }
    this.placeWalker(bob);
  }
}
