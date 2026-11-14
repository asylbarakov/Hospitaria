import { ACTOR_MOTION, ACTOR_VIEW } from '../data/actorConfig.js';
import { anchorOf, iconKey, isoKey } from './isoAssets.js';
import { SPRITE_SCALE, tileToScreen } from './IsoMath.js';

// Персонаж изометрии: позиция в тайлах, путь, поворот и анимация.
// Сцена больше не хранит позицию ходока: всё состояние живёт здесь.
// Порядок отрисовки задаёт IsoDepth через root (ActorLayer), тень рисуется у пола.

const FONT = 'Arial, "Segoe UI", sans-serif';
const FACING_EPS = 0.01;

export default class IsoActor {
  /**
   * @param {Phaser.Scene} scene
   * @param {{x?:number, y?:number, sprite:string, name?:string, icon?:string|null,
   *   accent?:number, kind?:string, speed?:number, radius?:number}} options
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.kind = options.kind || 'actor';
    this.pos = {
      x: Number.isFinite(options.x) ? options.x : 0.5,
      y: Number.isFinite(options.y) ? options.y : 0.5,
    };
    this.speed = Number.isFinite(options.speed) ? options.speed : ACTOR_MOTION.walkSpeed;
    this.radius = Number.isFinite(options.radius) ? options.radius : ACTOR_MOTION.radius;
    this.name = options.name || '';
    this.spriteName = options.sprite || 'staff_doctor';
    this.iconName = options.icon || null;
    this.accent = Number.isFinite(options.accent) ? options.accent : 0x35c4a0;

    this.path = [];
    this.facing = 1;
    this.moving = false;
    this.walkClock = 0;
    this.idleClock = 0;
    this.bob = 0;
    this.breathe = 0;
    this._box = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    this.screen = { x: 0, y: 0 };

    this.buildView();
    this.box();
    this.syncView();
  }

  buildView() {
    this.shadow = this.scene.add
      .ellipse(0, 0, ACTOR_VIEW.shadowWidth, ACTOR_VIEW.shadowHeight, 0x000000, ACTOR_VIEW.shadowAlpha)
      .setDepth(ACTOR_VIEW.shadowDepth);
    this.sprite = this.scene.add
      .image(0, 0, isoKey(this.spriteName))
      .setOrigin(0.5, anchorOf(this.scene, this.spriteName))
      .setScale(SPRITE_SCALE);

    this.plate = this.scene.add.graphics();
    this.icon = this.iconName
      ? this.scene.add.image(0, ACTOR_VIEW.iconOffsetY, iconKey(this.iconName)).setScale(ACTOR_VIEW.iconScale)
      : null;
    this.label = this.scene.add
      .text(0, ACTOR_VIEW.nameOffsetY, this.name, {
        fontFamily: FONT,
        fontSize: `${ACTOR_VIEW.nameFontSize}px`,
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#10222e',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setVisible(!!this.name);

    const children = [this.sprite, this.plate];
    if (this.icon) {
      children.push(this.icon);
    }
    children.push(this.label);
    this.root = this.scene.add.container(0, 0, children);
    this.drawPlate();
  }

  drawPlate() {
    const size = ACTOR_VIEW.plateSize;
    this.plate.clear();
    if (!this.icon) {
      return;
    }
    const x = -size / 2;
    const y = ACTOR_VIEW.iconOffsetY - size / 2;
    this.plate.fillStyle(this.accent, ACTOR_VIEW.plateAlpha);
    this.plate.fillRoundedRect(x, y, size, size, size * 0.3);
    this.plate.lineStyle(3, 0xffffff, 0.85);
    this.plate.strokeRoundedRect(x, y, size, size, size * 0.3);
  }

  /** Прямоугольник основания в тайлах (переиспользуемый объект). */
  box() {
    const r = this.radius;
    this._box.minX = this.pos.x - r;
    this._box.maxX = this.pos.x + r;
    this._box.minY = this.pos.y - r;
    this._box.maxY = this.pos.y + r;
    return this._box;
  }

  /** @param {Array<{x:number,y:number}>|null} tiles путь без стартового тайла */
  setPath(tiles) {
    this.path = Array.isArray(tiles) ? tiles.map((tile) => ({ x: tile.x, y: tile.y })) : [];
    return this.path;
  }

  stop() {
    this.path.length = 0;
    this.moving = false;
  }

  setSkin(spriteName) {
    if (!spriteName || spriteName === this.spriteName) {
      return;
    }
    this.spriteName = spriteName;
    this.sprite.setTexture(isoKey(spriteName));
    this.sprite.setOrigin(0.5, anchorOf(this.scene, spriteName));
  }

  setName(name) {
    this.name = name || '';
    this.label.setText(this.name).setVisible(!!this.name);
  }

  setIcon(iconName) {
    this.iconName = iconName || null;
    if (!this.iconName) {
      if (this.icon) {
        this.icon.setVisible(false);
      }
      this.drawPlate();
      return;
    }
    if (!this.icon) {
      this.icon = this.scene.add.image(0, ACTOR_VIEW.iconOffsetY, iconKey(this.iconName)).setScale(ACTOR_VIEW.iconScale);
      this.root.add(this.icon);
    } else {
      this.icon.setTexture(iconKey(this.iconName)).setVisible(true);
    }
    this.root.bringToTop(this.icon);
    this.root.bringToTop(this.label);
    this.drawPlate();
  }

  setAccent(color) {
    if (!Number.isFinite(color)) {
      return;
    }
    this.accent = color;
    this.drawPlate();
  }

  /** Шаг анимации. Возвращает true, если позиция изменилась (нужно обновить box в сортере). */
  update(dt) {
    const oldX = this.pos.x;
    const oldY = this.pos.y;
    const target = this.path.length ? this.path[0] : null;

    if (target) {
      this.moving = true;
      const dx = target.x + 0.5 - this.pos.x;
      const dy = target.y + 0.5 - this.pos.y;
      const dist = Math.hypot(dx, dy);
      const step = this.speed * dt;
      if (dist <= step || dist < 1e-6) {
        this.pos.x = target.x + 0.5;
        this.pos.y = target.y + 0.5;
        this.path.shift();
      } else {
        this.pos.x += (dx / dist) * step;
        this.pos.y += (dy / dist) * step;
      }
      if (Math.abs(dx - dy) > FACING_EPS) {
        this.facing = dx - dy < 0 ? -1 : 1;
      }
      this.walkClock += dt * this.speed * ACTOR_MOTION.walkAnimRate;
      this.bob = Math.abs(Math.sin(this.walkClock)) * ACTOR_MOTION.bobHeight;
      this.idleClock = 0;
      this.breathe = 0;
    } else {
      this.moving = false;
      this.walkClock = 0;
      this.bob += (0 - this.bob) * Math.min(1, dt * ACTOR_MOTION.bobReturn);
      this.idleClock += dt;
      this.breathe = Math.sin(this.idleClock * ACTOR_MOTION.idleRate);
    }

    this.syncView();
    return this.pos.x !== oldX || this.pos.y !== oldY;
  }

  syncView() {
    const point = tileToScreen(this.pos.x, this.pos.y);
    this.screen.x = point.x;
    this.screen.y = point.y;
    this.root.setPosition(point.x, point.y - this.bob);
    this.shadow.setPosition(point.x, point.y);

    this.sprite.setFlipX(this.facing < 0);
    const tilt = this.moving ? Math.sin(this.walkClock) * ACTOR_MOTION.tilt : 0;
    this.sprite.setRotation(tilt);

    const breathe = 1 + this.breathe * ACTOR_MOTION.breatheAmount;
    this.sprite.setScale(SPRITE_SCALE * breathe, SPRITE_SCALE / breathe);
  }

  destroy() {
    if (this.root) {
      this.root.destroy();
      this.root = null;
    }
    if (this.shadow) {
      this.shadow.destroy();
      this.shadow = null;
    }
  }
}
