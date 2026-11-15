// Нижняя панель стройки (этап 17): каталог по страницам и замки по уровню.
// Вынесено из IsoHospitalHud, чтобы сцена HUD оставалась короткой.

import { CATALOG, CATALOG_BY_TYPE, SELL_REFUND, itemUnlockLevel } from '../data/buildCatalog.js';
import { isoKey } from './isoAssets.js';

const FONT = 'Arial, "Segoe UI", sans-serif';
export const PANEL_Y = 540;
const PER_PAGE = 7;
const CARD_W = 112;
const CARD_H = 128;

export default class BuildPanel {
  /**
   * @param {Phaser.Scene} scene
   * @param {{onSelect:(type:string, lock:number)=>void}} hooks
   */
  constructor(scene, hooks) {
    this.scene = scene;
    this.hooks = hooks;
    this.page = 0;
    this.cards = [];
    this.level = 1;
    this.active = false;

    this.graphics = scene.add.graphics().setDepth(5);
    this.graphics.fillStyle(0x0d1f2b, 0.9);
    this.graphics.fillRect(0, PANEL_Y, 1280, 720 - PANEL_Y);
    this.graphics.lineStyle(3, 0x4fb3a5, 1);
    this.graphics.lineBetween(0, PANEL_Y, 1280, PANEL_Y);
    this.graphics.setVisible(false);
    this.buildCards();
  }

  pageItems() {
    return CATALOG.slice(this.page * PER_PAGE, this.page * PER_PAGE + PER_PAGE);
  }

  turnPage(dir) {
    const pages = Math.ceil(CATALOG.length / PER_PAGE);
    this.page = (this.page + dir + pages) % pages;
    this.buildCards();
    this.paintCards(null, this.level);
    this.setActive(this.active);
  }

  buildCards() {
    this.cards.forEach((card) => card.destroy());
    this.cards = [];
    this.pageItems().forEach((def, index) => {
      const card = this.scene.add.container(120 + index * 120, PANEL_Y + 78).setDepth(11);
      const bg = this.scene.add.graphics();
      card.bg = bg;
      card.type = def.type;
      card.lockLevel = itemUnlockLevel(def);
      const img = this.scene.add.image(0, -14, isoKey(def.type));
      img.setScale(Math.min(96 / img.width, 62 / img.height));
      card.img = img;
      const title = this.scene.add.text(0, 30, def.title, {
        fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#ffffff',
        align: 'center', wordWrap: { width: CARD_W - 8 },
      }).setOrigin(0.5, 0);
      const price = this.scene.add.text(0, CARD_H / 2 - 10, `${def.price}`, {
        fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffe082',
      }).setOrigin(0.5);
      const lock = this.scene.add.text(CARD_W / 2 - 8, -CARD_H / 2 + 6, `Ур. ${card.lockLevel}`, {
        fontFamily: FONT, fontSize: '12px', fontStyle: 'bold', color: '#ffcc80',
      }).setOrigin(1, 0);
      card.lock = lock;
      const zone = this.scene.add.zone(0, 0, CARD_W, CARD_H).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        if (card.lockLevel > this.level) {
          this.hooks.onSelect(def.type, card.lockLevel);
          return;
        }
        if (this.active) {
          this.hooks.onSelect(def.type, 0);
        }
      });
      card.add([bg, img, title, price, lock, zone]);
      card.setVisible(this.active);
      this.cards.push(card);
    });
    this.paintCards(null, this.level);
  }

  paintCards(selected, level) {
    this.level = Math.max(1, Number(level) || 1);
    this.cards.forEach((card) => {
      const locked = card.lockLevel > this.level;
      const on = card.type === selected && !locked;
      card.setAlpha(locked ? 0.45 : 1);
      card.lock.setVisible(locked);
      card.bg.clear();
      card.bg.fillStyle(on ? 0x2f6f5f : 0x1c3a4a, 1);
      card.bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 12);
      card.bg.lineStyle(on ? 4 : 2, on ? 0xffe082 : 0x4fb3a5, 1);
      card.bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 12);
    });
  }

  setActive(value) {
    this.active = !!value;
    this.graphics.setVisible(this.active);
    this.cards.forEach((card) => card.setVisible(this.active));
  }

  update(build, level) {
    this.setActive(build.active);
    this.paintCards(build.tool === 'place' ? build.type : null, level);
  }

  hintFor(build) {
    if (build.tool === 'none') {
      return 'Выберите предмет в каталоге или нажмите «Продать»';
    }
    if (build.tool === 'sell') {
      return build.hasTarget
        ? `${build.sellTitle}: вернём ${build.price} (${Math.round(SELL_REFUND * 100)}%). Тап по нему ещё раз или «Готово»`
        : 'Тапните по предмету, который хотите продать';
    }
    const def = CATALOG_BY_TYPE[build.type];
    if (def && itemUnlockLevel(def) > this.level) {
      return `${def.title} откроется на уровне ${itemUnlockLevel(def)}`;
    }
    if (!build.hasTarget) {
      return `${def.title} за ${def.price}: тапните по полу, куда поставить`;
    }
    return build.valid ? 'Тап по призраку или «Готово»: купить и поставить' : 'Сюда нельзя: тайл занят или это стена';
  }
}
