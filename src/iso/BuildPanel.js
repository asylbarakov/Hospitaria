// Нижняя панель стройки (этап 17): каталог по страницам и замки по уровню.
// Вынесено из IsoHospitalHud, чтобы сцена HUD оставалась короткой.

import { CATALOG, CATALOG_BY_TYPE, SELL_REFUND, itemUnlockLevel } from '../data/buildCatalog.js';
import { isoKey } from './isoAssets.js';
import { panel, plate } from '../ui/IsoUi.js';

const FONT = 'Arial, "Segoe UI", sans-serif';
export const PANEL_Y = 540;
const PER_PAGE = 7;
const CARD_W = 104;
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

    this.graphics = panel(scene, 0, PANEL_Y, 1280, 720 - PANEL_Y, { tint: 0x123240 });
    this.graphics.setDepth(5).setVisible(false);
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
      const card = this.scene.add.container(160 + index * 112, PANEL_Y + 78).setDepth(11);
      const bg = plate(this.scene, 0, 0, CARD_W, CARD_H, { tint: 0x1c3a4a });
      card.bg = bg;
      card.type = def.type;
      card.lockLevel = itemUnlockLevel(def);
      card.priceValue = def.price;
      const img = this.scene.add.image(0, -30, isoKey(def.type));
      img.setScale(Math.min(92 / img.width, 52 / img.height));
      card.img = img;
      const title = this.scene.add.text(0, -2, def.title, {
        fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#ffffff',
        align: 'center', wordWrap: { width: CARD_W - 8 },
      }).setOrigin(0.5, 0);
      // Одна подпись снизу: цена или уровень разблокировки. Так ничего не наезжает.
      const price = this.scene.add.text(0, CARD_H / 2 - 14, `${def.price}`, {
        fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#ffe082',
      }).setOrigin(0.5);
      card.price = price;
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
      card.add([bg, img, title, price, zone]);
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
      // Замок показываем подписью вместо цены, а не бейджем поверх картинки.
      card.price.setText(locked ? `Ур. ${card.lockLevel}` : `${card.priceValue}`);
      card.price.setColor(locked ? '#ffcc80' : '#ffe082');
      card.setAlpha(locked ? 0.92 : 1);
      card.bg.setTint(on ? 0x2f6f5f : 0x1c3a4a);
      card.bg.setAlpha(on ? 1 : 0.92);
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
