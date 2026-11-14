import * as layout from '../data/layout.js';
import { START_COINS } from '../data/buildCatalog.js';
import IsoWorld from '../iso/IsoWorld.js';
import IsoCamera from '../iso/IsoCamera.js';
import BuildMode from '../iso/BuildMode.js';
import { anchorOf, isoKey, queueIsoAssets, queueWallAssets } from '../iso/isoAssets.js';
import {
  SPRITE_SCALE, screenToTileIndex, tileCenter, tileToScreen, worldBounds,
} from '../iso/IsoMath.js';
import { clearIsoSave, loadIsoSave, saveIso } from '../systems/IsoSave.js';

// Этап 11: изометрическая больница. Мир из layout.js, режим строительства, персонаж
// ходит по тапу (простой BFS, EasyStar придёт на этапе 13).

const WALK_SPEED = 3.4; // тайлов в секунду
const WALKER_RADIUS = 0.2;
const ICON_FILES = ['icons/icon_coin.png'];

export default class IsoHospitalScene extends Phaser.Scene {
  constructor() {
    super('IsoHospitalScene');
  }

  preload() {
    const label = this.add
      .text(640, 360, 'Загрузка больницы…', { fontFamily: 'Arial, sans-serif', fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5);
    this.load.on('progress', (v) => label.setText(`Загрузка больницы… ${Math.round(v * 100)}%`));
    queueIsoAssets(this, ICON_FILES);
    queueWallAssets(this);
  }

  create() {
    this.children.list.filter((o) => o.type === 'Text').forEach((o) => o.destroy());
    this.cameras.main.setBackgroundColor('#10222e');

    const saved = loadIsoSave();
    this.coins = saved && saved.coins !== null ? saved.coins : START_COINS;
    this.world = new IsoWorld(this, layout, saved ? saved.items : null);
    this.grid = this.world.grid;
    this.messages = [];
    this.path = [];
    this.walkClock = 0;

    this.buildWalker();
    this.marker = this.add.graphics().setDepth(91);

    this.build = new BuildMode(this, this.world, {
      getCoins: () => this.coins,
      spend: (n) => { this.coins -= n; },
      earn: (n) => { this.coins += n; },
      onChange: () => this.persist(),
      notify: (text) => this.notify(text),
    });

    this.iso = new IsoCamera(this, {
      bounds: worldBounds(layout.MAP.cols, layout.MAP.rows, 420),
      minZoom: 0.3,
      maxZoom: 2,
      margin: 160,
      onTap: (pointer) => this.handleTap(pointer),
      canStartDrag: (pointer) => !this.hud || !this.hud.isOverUi(pointer),
    });
    const start = tileCenter(layout.ENTRANCE.x, layout.ENTRANCE.y - 8);
    this.iso.setZoom(0.75);
    this.iso.centerOn(start.x, start.y);

    this.input.keyboard.on('keydown-R', () => this.build.rotate());
    this.input.keyboard.on('keydown-B', () => this.toggleBuild());
    this.input.keyboard.on('keydown-ESC', () => this.onEscape());

    this.scene.launch('IsoHospitalHud');
    this.hud = this.scene.get('IsoHospitalHud');
    this.events.once('shutdown', () => this.cleanup());
  }

  // ---- персонаж ----------------------------------------------------------------------

  buildWalker() {
    this.pos = { x: layout.ENTRANCE.x + 0.5, y: layout.ENTRANCE.y + 0.5 };
    this.shadow = this.add.ellipse(0, 0, 46, 20, 0x000000, 0.28).setDepth(1);
    this.walker = this.add
      .image(0, 0, isoKey('staff_doctor'))
      .setOrigin(0.5, anchorOf(this, 'staff_doctor'))
      .setScale(SPRITE_SCALE);
    this.world.sorter.add(this.walker, this.walkerBox(), { dynamic: true });
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

  updateWalker(dt) {
    let bob = 0;
    if (this.path.length > 0) {
      const target = this.path[0];
      const dx = target.x + 0.5 - this.pos.x;
      const dy = target.y + 0.5 - this.pos.y;
      const dist = Math.hypot(dx, dy);
      const step = WALK_SPEED * dt;
      if (dist <= step) {
        this.pos.x = target.x + 0.5;
        this.pos.y = target.y + 0.5;
        this.path.shift();
      } else {
        this.pos.x += (dx / dist) * step;
        this.pos.y += (dy / dist) * step;
      }
      if (Math.abs(dx - dy) > 0.01) {
        this.walker.setFlipX(dx - dy < 0);
      }
      this.walkClock += dt * WALK_SPEED * 5;
      bob = Math.abs(Math.sin(this.walkClock)) * 4;
      this.world.sorter.updateBox(this.walker, this.walkerBox());
    }
    this.placeWalker(bob);
  }

  // ---- ввод --------------------------------------------------------------------------

  pointerTile(pointer) {
    const w = this.iso.screenToWorld(pointer.x, pointer.y);
    return screenToTileIndex(w.x, w.y);
  }

  handleTap(pointer) {
    if (this.hud && this.hud.isOverUi(pointer)) {
      return;
    }
    const tile = this.pointerTile(pointer);
    if (this.build.active) {
      this.build.tap(tile, !!pointer.wasTouch);
      return;
    }
    if (!this.grid.isWalkable(tile.x, tile.y)) {
      this.blockedFlash = { x: tile.x, y: tile.y, until: this.time.now + 350 };
      return;
    }
    const path = this.grid.findPath(Math.floor(this.pos.x), Math.floor(this.pos.y), tile.x, tile.y);
    if (path === null) {
      this.blockedFlash = { x: tile.x, y: tile.y, until: this.time.now + 350 };
      return;
    }
    this.path = path;
  }

  toggleBuild() {
    this.build.setActive(!this.build.active);
  }

  onEscape() {
    if (this.build.active && this.build.tool !== 'none') {
      this.build.cancel();
    } else if (this.build.active) {
      this.build.setActive(false);
    } else {
      this.exitToMenu();
    }
  }

  // ---- служебное ---------------------------------------------------------------------

  notify(text) {
    this.messages.push({ text, until: this.time.now + 2200 });
  }

  persist() {
    saveIso(this.coins, this.world.serialize());
  }

  resetHospital() {
    clearIsoSave();
    this.scene.stop('IsoHospitalHud');
    this.scene.restart();
  }

  exitToMenu() {
    this.scene.stop('IsoHospitalHud');
    this.scene.start('MenuScene');
  }

  cleanup() {
    if (this.iso) {
      this.iso.destroy();
    }
    this.input.keyboard.off('keydown-R');
    this.input.keyboard.off('keydown-B');
    this.input.keyboard.off('keydown-ESC');
    this.scene.stop('IsoHospitalHud');
  }

  diamond(g, x, y) {
    const a = tileToScreen(x, y);
    const b = tileToScreen(x + 1, y);
    const c = tileToScreen(x + 1, y + 1);
    const d = tileToScreen(x, y + 1);
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.lineTo(c.x, c.y);
    g.lineTo(d.x, d.y);
    g.closePath();
    g.fillPath();
  }

  // ---- цикл --------------------------------------------------------------------------

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.updateWalker(dt);

    const pointer = this.input.activePointer;
    const inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= this.scale.width && pointer.y <= this.scale.height;
    const overUi = this.hud && this.hud.isOverUi(pointer);
    const tile = this.pointerTile(pointer);
    if (this.build.active && inside && !overUi && !pointer.wasTouch) {
      this.build.hover(tile);
    }
    this.build.update();

    this.marker.clear();
    if (this.blockedFlash && this.blockedFlash.until > time) {
      this.marker.fillStyle(0xe53935, 0.55);
      this.diamond(this.marker, this.blockedFlash.x, this.blockedFlash.y);
    }

    this.world.sorter.sort();
    this.world.updateWallFade(this.walkerBox(), tileToScreen(this.pos.x, this.pos.y));
    this.messages = this.messages.filter((m) => m.until > time);
  }

  /** Данные для HUD. */
  hudState() {
    const pointer = this.input.activePointer;
    return {
      coins: this.coins,
      build: this.build.state(),
      message: this.messages.length ? this.messages[this.messages.length - 1].text : '',
      zoom: this.cameras.main.zoom,
      fps: Math.round(this.game.loop.actualFps),
      tile: this.pointerTile(pointer),
    };
  }
}
