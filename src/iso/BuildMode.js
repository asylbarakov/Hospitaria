import { CATALOG_BY_TYPE, SELL_REFUND } from '../data/buildCatalog.js';
import { footprintOf } from './layoutBuilder.js';
import { anchorOf, isoKey } from './isoAssets.js';
import { SPRITE_SCALE, footprintScreen } from './IsoMath.js';

// Режим строительства: выбор предмета, призрак на сетке (зелёный/красный тайл), поворот, продажа.
// Подтверждение двухшаговое: на телефоне тап ставит призрак, повторный тап по нему (или кнопка
// «Поставить») покупает; мышью клик по тайлу сразу ставит. Перетаскивание камеры тапом не считается.

export default class BuildMode {
  /**
   * @param {Phaser.Scene} scene
   * @param {import('./IsoWorld.js').default} world
   * @param {{getCoins:()=>number, spend:(n:number)=>void, earn:(n:number)=>void,
   *   onChange:()=>void, notify:(text:string)=>void}} hooks
   */
  constructor(scene, world, hooks) {
    this.scene = scene;
    this.world = world;
    this.hooks = hooks;
    this.active = false;
    this.tool = 'none'; // 'none' | 'place' | 'sell'
    this.type = null;
    this.rot = 0;
    this.target = null; // {x, y} левый верхний тайл призрака
    this.sellEntry = null;
    this.g = scene.add.graphics().setDepth(90);
    this.ghost = scene.add.image(0, 0, isoKey('plant_big')).setVisible(false).setDepth(7000).setAlpha(0.7);
  }

  setActive(value) {
    this.active = value;
    if (!value) {
      this.cancel();
    }
  }

  cancel() {
    this.tool = 'none';
    this.type = null;
    this.target = null;
    this.sellEntry = null;
    this.ghost.setVisible(false);
    this.g.clear();
  }

  selectType(type) {
    this.tool = 'place';
    this.type = type;
    this.sellEntry = null;
    this.target = null;
    this.ghost.setTexture(isoKey(type)).setOrigin(0.5, anchorOf(this.scene, type)).setScale(SPRITE_SCALE);
  }

  toggleSell() {
    if (this.tool === 'sell') {
      this.cancel();
      return;
    }
    this.cancel();
    this.tool = 'sell';
  }

  rotate() {
    if (this.tool !== 'place') {
      return;
    }
    this.rot = this.rot ? 0 : 1;
  }

  footprint() {
    return this.type ? footprintOf(this.type, this.rot) : null;
  }

  /** Левый верхний тайл предмета так, чтобы тайл под пальцем был примерно в центре. */
  anchorFor(tile) {
    const fp = this.footprint();
    return { x: tile.x - Math.floor((fp.w - 1) / 2), y: tile.y - Math.floor((fp.d - 1) / 2) };
  }

  issue() {
    if (!this.target) {
      return 'occupied';
    }
    return this.world.placementIssue(this.type, this.target.x, this.target.y, this.rot);
  }

  isValid() {
    return !!this.target && this.issue() === null;
  }

  priceOf() {
    return this.type ? CATALOG_BY_TYPE[this.type].price : 0;
  }

  refundOf(entry) {
    return Math.floor(CATALOG_BY_TYPE[entry.item.type].price * SELL_REFUND);
  }

  /** Наведение мыши: призрак следует за курсором. */
  hover(tile) {
    if (this.active && this.tool === 'place') {
      this.target = this.anchorFor(tile);
    }
  }

  /** Тап/клик по тайлу. */
  tap(tile, isTouch) {
    if (!this.active) {
      return;
    }
    if (this.tool === 'place') {
      const next = this.anchorFor(tile);
      const fp = this.footprint();
      const inside = this.target && tile.x >= this.target.x && tile.x < this.target.x + fp.w
        && tile.y >= this.target.y && tile.y < this.target.y + fp.d;
      if (isTouch && !inside) {
        this.target = next;
        return;
      }
      this.target = isTouch ? this.target : next;
      this.confirm();
    } else if (this.tool === 'sell') {
      const entry = this.world.itemAt(tile.x, tile.y);
      if (!entry) {
        this.sellEntry = null;
      } else if (this.sellEntry === entry) {
        this.confirm();
      } else {
        this.sellEntry = entry;
      }
    }
  }

  confirm() {
    if (this.tool === 'place') {
      if (!this.target) {
        return;
      }
      if (!this.isValid()) {
        const issue = this.issue();
        this.hooks.notify(issue === 'passage'
          ? 'Нельзя перекрывать единственный проход к комнате'
          : 'Сюда поставить нельзя');
        return;
      }
      const price = this.priceOf();
      if (this.hooks.getCoins() < price) {
        this.hooks.notify('Не хватает монет');
        return;
      }
      if (this.world.addItem(this.type, this.target.x, this.target.y, this.rot)) {
        this.hooks.spend(price);
        this.hooks.onChange();
      }
    } else if (this.tool === 'sell' && this.sellEntry) {
      const refund = this.refundOf(this.sellEntry);
      this.world.removeItem(this.sellEntry.item.gridId);
      this.sellEntry = null;
      this.hooks.earn(refund);
      this.hooks.notify(`Продано за ${refund}`);
      this.hooks.onChange();
    }
  }

  /** Данные для HUD. */
  state() {
    const sell = this.tool === 'sell' && this.sellEntry;
    return {
      active: this.active,
      tool: this.tool,
      type: this.type,
      rot: this.rot,
      valid: this.tool === 'place' ? this.isValid() : !!sell,
      hasTarget: this.tool === 'place' ? !!this.target : !!sell,
      price: this.tool === 'sell' && sell ? this.refundOf(this.sellEntry) : this.priceOf(),
      sellTitle: sell ? CATALOG_BY_TYPE[this.sellEntry.item.type].title : '',
    };
  }

  diamond(x, y, w, d, fill, line) {
    const fp = footprintScreen(x, y, w, d);
    const g = this.g;
    g.fillStyle(fill, 0.45);
    g.beginPath();
    g.moveTo(fp.top.x, fp.top.y);
    g.lineTo(fp.right.x, fp.right.y);
    g.lineTo(fp.bottom.x, fp.bottom.y);
    g.lineTo(fp.left.x, fp.left.y);
    g.closePath();
    g.fillPath();
    g.lineStyle(3, line, 0.95);
    g.strokePath();
  }

  update() {
    this.g.clear();
    if (!this.active) {
      this.ghost.setVisible(false);
      return;
    }
    if (this.tool === 'place' && this.target) {
      const fp = this.footprint();
      const ok = this.isValid();
      this.diamond(this.target.x, this.target.y, fp.w, fp.d, ok ? 0x43d17a : 0xe53935, ok ? 0xb9ffd3 : 0xffb3b0);
      const s = footprintScreen(this.target.x, this.target.y, fp.w, fp.d);
      this.ghost
        .setPosition(s.center.x, s.bottom.y)
        .setFlipX(!!this.rot)
        .setTint(ok ? 0xffffff : 0xff8080)
        .setVisible(true);
    } else {
      this.ghost.setVisible(false);
    }
    if (this.tool === 'sell' && this.sellEntry) {
      const it = this.sellEntry.item;
      this.diamond(it.x, it.y, it.w, it.d, 0xffa000, 0xffe0a0);
    }
  }
}
