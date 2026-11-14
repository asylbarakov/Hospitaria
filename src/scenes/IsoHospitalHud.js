import { createButton } from '../ui/Button.js';
import { CATALOG, CATALOG_BY_TYPE, SELL_REFUND } from '../data/buildCatalog.js';
import { isoKey } from '../iso/isoAssets.js';

const FONT = 'Arial, "Segoe UI", sans-serif';
const PANEL_Y = 540;
const PER_PAGE = 7;
const CARD_W = 112;
const CARD_H = 128;

// HUD изометрической больницы: монеты, кнопки, панель строительства с каталогом по страницам.
export default class IsoHospitalHud extends Phaser.Scene {
  constructor() {
    super('IsoHospitalHud');
  }

  create() {
    this.page = 0;
    this.cards = [];
    this.buttons = [];
    this.resetArmedUntil = 0;
    this.rects = [];

    this.add.image(40, 40, isoKey('icons_icon_coin')).setScale(0.26).setDepth(10);
    this.coinText = this.add
      .text(72, 40, '', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#fff3b0', stroke: '#10222e', strokeThickness: 5 })
      .setOrigin(0, 0.5).setDepth(10);
    this.message = this.add
      .text(640, 90, '', { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#ffffff', stroke: '#b3261e', strokeThickness: 6 })
      .setOrigin(0.5).setDepth(12);
    this.reputationText = this.add
      .text(16, 78, '', { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: '#b9f6ca', stroke: '#10222e', strokeThickness: 4 })
      .setDepth(10);
    this.info = this.add
      .text(16, 106, '', { fontFamily: FONT, fontSize: '16px', color: '#dff3ff', stroke: '#10222e', strokeThickness: 3 })
      .setDepth(10);
    this.hint = this.add
      .text(640, PANEL_Y - 22, '', { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#ffffff', stroke: '#10222e', strokeThickness: 5 })
      .setOrigin(0.5).setDepth(10);

    this.buildPanelBackground();
    this.addButton(1180, 40, 180, 'Меню', () => this.world().exitToMenu(), 0x5b7f8c, 0x729aa8);
    this.buildToggle = this.addButton(1180, 100, 180, 'Строить (B)', () => this.world().toggleBuild(), 0xe08a1e, 0xf2a43f);
    this.addButton(1180, 160, 180, 'Зум 100%', () => this.world().iso.setZoom(1), 0x3f9b4a, 0x55b963);
    this.addButton(1180, 220, 180, 'Гардероб', () => this.world().openWardrobe(), 0x7b5bb8, 0x9273cf);
    this.resetButton = this.addButton(1180, 280, 180, 'Сброс', () => this.onReset(), 0x8a4a4a, 0xa96060);

    const inBuild = () => this.state && this.state.build.active;
    this.rotateButton = this.addButton(1020, PANEL_Y + 55, 150, 'Повернуть', () => this.world().build.rotate(), 0x2f80c9, 0x4a9be0, inBuild, true);
    this.sellButton = this.addButton(1180, PANEL_Y + 55, 150, 'Продать', () => this.world().build.toggleSell(), 0xc9622f, 0xe07a45, inBuild, true);
    this.okButton = this.addButton(1020, PANEL_Y + 115, 150, 'Готово', () => this.world().build.confirm(), 0x3f9b4a, 0x55b963, () => inBuild() && this.state.build.hasTarget, true);
    this.cancelButton = this.addButton(1180, PANEL_Y + 115, 150, 'Отмена', () => this.world().build.cancel(), 0x5b7f8c, 0x729aa8, () => inBuild() && this.state.build.tool !== 'none', true);

    this.addButton(44, PANEL_Y + 90, 56, '◀', () => this.turnPage(-1), 0x5b7f8c, 0x729aa8, inBuild, true, 24);
    this.addButton(916, PANEL_Y + 90, 56, '▶', () => this.turnPage(1), 0x5b7f8c, 0x729aa8, inBuild, true, 24);
    this.buildCards();
  }

  world() {
    return this.scene.get('IsoHospitalScene');
  }

  buildPanelBackground() {
    this.panel = this.add.graphics().setDepth(5);
    this.panel.fillStyle(0x0d1f2b, 0.9);
    this.panel.fillRect(0, PANEL_Y, 1280, 720 - PANEL_Y);
    this.panel.lineStyle(3, 0x4fb3a5, 1);
    this.panel.lineBetween(0, PANEL_Y, 1280, PANEL_Y);
    this.panel.setVisible(false);
  }

  /** @param {boolean} [panelOnly] кнопка живёт только когда открыта панель (прямоугольник учитывает панель) */
  addButton(x, y, width, label, onClick, color, hoverColor, shown = null, inPanel = false, fontSize = 20) {
    const height = 46;
    const guard = () => {
      if (!shown || shown()) {
        onClick();
      }
    };
    const container = createButton(this, x, y, label, guard, { width, height, fontSize, color, hoverColor, depth: 11 });
    const entry = { container, shown, inPanel, label: container.list[1] };
    this.buttons.push(entry);
    if (!inPanel) {
      this.rects.push({ x: x - width / 2 - 6, y: y - height / 2 - 6, w: width + 12, h: height + 14 });
    }
    return entry;
  }

  pageItems() {
    return CATALOG.slice(this.page * PER_PAGE, this.page * PER_PAGE + PER_PAGE);
  }

  turnPage(dir) {
    const pages = Math.ceil(CATALOG.length / PER_PAGE);
    this.page = (this.page + dir + pages) % pages;
    this.buildCards();
  }

  buildCards() {
    this.cards.forEach((c) => c.destroy());
    this.cards = [];
    this.pageItems().forEach((def, i) => {
      const x = 120 + i * 120;
      const y = PANEL_Y + 78;
      const card = this.add.container(x, y).setDepth(11);
      const bg = this.add.graphics();
      card.bg = bg;
      card.type = def.type;
      const img = this.add.image(0, -14, isoKey(def.type));
      img.setScale(Math.min(96 / img.width, 62 / img.height));
      const title = this.add.text(0, 30, def.title, {
        fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#ffffff', align: 'center', wordWrap: { width: CARD_W - 8 },
      }).setOrigin(0.5, 0);
      const price = this.add.text(0, CARD_H / 2 - 10, `${def.price}`, {
        fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffe082',
      }).setOrigin(0.5);
      const zone = this.add.zone(0, 0, CARD_W, CARD_H).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        if (this.state && this.state.build.active) {
          this.world().build.selectType(def.type);
        }
      });
      card.add([bg, img, title, price, zone]);
      card.setVisible(this.panel.visible);
      this.cards.push(card);
    });
  }

  paintCards(selected) {
    this.cards.forEach((card) => {
      const on = card.type === selected;
      card.bg.clear();
      card.bg.fillStyle(on ? 0x2f6f5f : 0x1c3a4a, 1);
      card.bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 12);
      card.bg.lineStyle(on ? 4 : 2, on ? 0xffe082 : 0x4fb3a5, 1);
      card.bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 12);
    });
  }

  onReset() {
    const now = this.time.now;
    if (this.resetArmedUntil > now) {
      this.world().resetHospital();
      return;
    }
    this.resetArmedUntil = now + 3000;
    this.world().notify('Нажмите «Сброс» ещё раз: вернуть больницу в исходный вид');
  }

  /** Лежит ли указатель на элементе HUD (тогда он не двигает камеру и персонажа). */
  isOverUi(pointer) {
    if (this.state && this.state.build.active && pointer.y >= PANEL_Y) {
      return true;
    }
    return this.rects.some((r) => pointer.x >= r.x && pointer.x <= r.x + r.w && pointer.y >= r.y && pointer.y <= r.y + r.h);
  }

  hintFor(b) {
    if (b.tool === 'none') {
      return 'Выберите предмет в каталоге или нажмите «Продать»';
    }
    if (b.tool === 'sell') {
      return b.hasTarget
        ? `${b.sellTitle}: вернём ${b.price} (${Math.round(SELL_REFUND * 100)}%). Тап по нему ещё раз или «Готово»`
        : 'Тапните по предмету, который хотите продать';
    }
    const def = CATALOG_BY_TYPE[b.type];
    if (!b.hasTarget) {
      return `${def.title} за ${def.price}: тапните по полу, куда поставить`;
    }
    return b.valid ? 'Тап по призраку или «Готово»: купить и поставить' : 'Сюда нельзя: тайл занят или это стена';
  }

  update(time) {
    const scene = this.world();
    if (!scene || !scene.hudState) {
      return;
    }
    const state = scene.hudState();
    this.state = state;
    const b = state.build;

    this.coinText.setText(`${state.coins}`);
    this.reputationText.setText(`Репутация ${state.reputation}  •  Пациентов ${state.patients}`);
    this.message.setText(state.message);
    this.info.setText(`Зум ${state.zoom.toFixed(2)}  FPS ${state.fps}  Тайл ${state.tile.x}, ${state.tile.y}`);
    this.panel.setVisible(b.active);
    this.hint.setVisible(b.active).setText(b.active ? this.hintFor(b) : '');
    this.cards.forEach((c) => c.setVisible(b.active));
    this.paintCards(b.tool === 'place' ? b.type : null);

    this.buildToggle.label.setText(b.active ? 'Готово (B)' : 'Строить (B)');
    this.sellButton.label.setText(b.tool === 'sell' ? 'Продажа' : 'Продать');
    this.resetButton.label.setText(this.resetArmedUntil > time ? 'Точно?' : 'Сброс');
    this.buttons.forEach((entry) => {
      entry.container.setVisible(!entry.shown || entry.shown());
    });
  }
}
