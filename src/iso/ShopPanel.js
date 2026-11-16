// Магазин 2.0 (этап 17): вкладки «Мебель», «Персонал», «Украшения».
// Заблокированные по уровню карточки видны серыми с замком. Панель не двигает
// деньги сама: мебель уходит в режим стройки, персонал нанимает StaffFlow.

import { CATALOG, itemUnlockLevel } from '../data/buildCatalog.js';
import { STAFF_ROLES, staffUnlockLevel } from '../data/staffCatalog.js';
import { ROOM_UNLOCKS, STARTER_ROOMS } from '../data/roomUnlocks.js';
import { isoKey } from './isoAssets.js';
import { button as uiButton, plate, windowFrame } from '../ui/IsoUi.js';

const FONT = 'Arial, "Segoe UI", sans-serif';
const CARD_W = 250;
const CARD_H = 190;
const PER_PAGE = 8;
const TABS = [
  { id: 'furniture', title: 'Мебель', variant: 'blue' },
  { id: 'staff', title: 'Персонал', variant: 'green' },
  { id: 'decor', title: 'Украшения', variant: 'purple' },
  { id: 'rooms', title: 'Кабинеты', variant: 'orange' },
];
const CLOSED_ROOMS = ROOM_UNLOCKS.filter((entry) => !STARTER_ROOMS.includes(entry.roomId));
const DECOR_TYPES = new Set([
  'plant_big', 'water_cooler', 'hall_sofa', 'waiting_sofa', 'waiting_chair', 'cafe_table',
]);
const FURNITURE = CATALOG.filter((item) => !DECOR_TYPES.has(item.type));
const DECOR = CATALOG.filter((item) => DECOR_TYPES.has(item.type));

export default class ShopPanel {
  /**
   * @param {Phaser.Scene} scene
   * @param {{onHire:Function, onPlace:Function, onClose:Function,
   *   onShow?:Function, onHide?:Function, notify?:Function}} hooks
   */
  constructor(scene, hooks) {
    this.scene = scene;
    this.hooks = hooks;
    this.tab = 'furniture';
    this.page = 0;
    this.coins = 0;
    this.level = 1;
    this.roomsState = [];
    this.signature = '';
    this.cards = [];

    this.root = scene.add.container(0, 0).setDepth(22).setVisible(false);
    const overlay = scene.add.graphics();
    overlay.fillStyle(0x06141d, 0.92);
    overlay.fillRect(0, 0, 1280, 720);
    this.root.add(overlay);
    this.root.add(windowFrame(scene, 640, 360, 1216, 664));

    // Шапка окна зелёная: заголовок белый, подпись уже на белом теле.
    // Заголовок — тёмная табличка поверх зелёной шапки, подпись на белом теле.
    this.root.add(plate(scene, 200, 100, 230, 56, { tint: 0x123240 }));
    this.root.add(scene.add.text(112, 100, 'Магазин', {
      fontFamily: FONT, fontSize: '32px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0, 0.5));
    this.root.add(scene.add.text(76, 210, 'Мебель, персонал и украшения. Новые позиции открываются с уровнем.', {
      fontFamily: FONT, fontSize: '16px', color: '#4d7b8a',
    }));

    this.tabsRoot = scene.add.container(0, 0);
    this.content = scene.add.container(0, 0);
    this.root.add([this.tabsRoot, this.content]);

    this.footer = scene.add.text(72, 652, '', {
      fontFamily: FONT, fontSize: '16px', color: '#1b4b5a',
    }).setOrigin(0, 0.5);
    this.root.add(this.footer);

    this.prev = uiButton(scene, 1100, 652, '◀', () => this.turnPage(-1), {
      width: 64, height: 56, fontSize: 20, variant: 'gray',
    });
    this.next = uiButton(scene, 1180, 652, '▶', () => this.turnPage(1), {
      width: 64, height: 56, fontSize: 20, variant: 'gray',
    });
    this.root.add([this.prev, this.next]);

    const close = uiButton(scene, 1150, 100, 'Закрыть', () => this.hide(), {
      width: 160, height: 56, fontSize: 18, variant: 'gray',
    });
    this.root.add(close);
  }

  get visible() {
    return this.root.visible;
  }

  show() {
    this.root.setVisible(true);
    this.page = 0;
    this.signature = '';
    if (typeof this.hooks.onShow === 'function') {
      this.hooks.onShow();
    }
    this.refresh();
  }

  hide() {
    if (!this.root.visible) {
      return;
    }
    this.root.setVisible(false);
    if (typeof this.hooks.onHide === 'function') {
      this.hooks.onHide();
    }
  }

  setTab(tab) {
    if (this.tab === tab) {
      return;
    }
    this.tab = tab;
    this.page = 0;
    this.refresh();
  }

  items() {
    if (this.tab === 'staff') {
      return STAFF_ROLES;
    }
    if (this.tab === 'rooms') {
      return CLOSED_ROOMS;
    }
    return this.tab === 'decor' ? DECOR : FURNITURE;
  }

  pageCount() {
    return Math.max(1, Math.ceil(this.items().length / PER_PAGE));
  }

  turnPage(dir) {
    const pages = this.pageCount();
    this.page = (this.page + dir + pages) % pages;
    this.refresh();
  }

  signatureFor(state, coins, level) {
    const staff = state && state.staff
      ? `${state.staff.hired.length}/${state.staff.max}/${state.staff.salary}`
      : '';
    const rooms = state && Array.isArray(state.rooms) ? state.rooms.join(',') : '';
    return `${this.tab}|${this.page}|${coins}|${level}|${staff}|${rooms}`;
  }

  /** HUD вызывает каждый кадр; перестройка только при изменениях. */
  update(state, coins, level) {
    if (!this.root.visible) {
      return;
    }
    const signature = this.signatureFor(state, coins, level);
    if (signature === this.signature) {
      return;
    }
    this.coins = coins;
    this.level = level;
    this.staffState = state ? state.staff : null;
    this.roomsState = state && Array.isArray(state.rooms) ? state.rooms : [];
    this.refresh();
  }

  refresh() {
    const signature = this.signatureFor(
      { staff: this.staffState, rooms: this.roomsState }, this.coins, this.level,
    );
    this.signature = signature;
    this.buildTabs();
    this.content.removeAll(true);
    this.cards = [];
    const items = this.items();
    const start = this.page * PER_PAGE;
    items.slice(start, start + PER_PAGE).forEach((item, index) => {
      this.content.add(this.makeCard(item, index));
    });
    const staff = this.staffState;
    const hired = staff ? `${staff.hired.length} из ${staff.max}` : '0';
    const salary = staff ? staff.salary : 0;
    this.footer.setText(`Монеты: ${this.coins} · Уровень ${this.level} · Нанято ${hired} · Зарплата ${salary}/день`);
    this.prev.setVisible(this.pageCount() > 1).setAlpha(this.page > 0 ? 1 : 0.45);
    this.next.setVisible(this.pageCount() > 1).setAlpha(this.page < this.pageCount() - 1 ? 1 : 0.45);
  }

  buildTabs() {
    this.tabsRoot.removeAll(true);
    TABS.forEach((tab, index) => {
      const active = tab.id === this.tab;
      const button = uiButton(this.scene, 380 + index * 196, 100, tab.title, () => this.setTab(tab.id), {
        width: 186, height: 56, fontSize: 17,
        variant: active ? tab.variant : 'gray',
        active,
      });
      this.tabsRoot.add(button);
    });
  }

  makeCard(item, index) {
    const kind = this.tab === 'staff' ? 'staff' : (this.tab === 'rooms' ? 'room' : 'item');
    const unlock = kind === 'staff' ? staffUnlockLevel(item) : (kind === 'room' ? item.minLevel : itemUnlockLevel(item));
    const open = kind === 'room' && this.roomsState.includes(item.roomId);
    const locked = kind === 'room' ? (!open && this.level < unlock) : this.level < unlock;
    const col = index % 4;
    const row = Math.floor(index / 4);
    const card = this.scene.add.container(210 + col * 260, 330 + row * 200);
    card.setAlpha(locked ? 0.85 : 1);

    card.add(plate(this.scene, 0, 0, CARD_W, CARD_H, { tint: locked ? 0x33474f : 0x14303f }));

    const key = kind === 'staff' ? item.sprite : (kind === 'room' ? 'sign_blank' : item.type);
    const img = this.scene.add.image(-84, -14, isoKey(key));
    img.setScale(Math.min(60 / img.width, 74 / img.height));
    card.add(img);

    card.add(this.scene.add.text(-40, -76, item.title, {
      fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffffff',
      lineSpacing: 2,
      wordWrap: { width: 152 },
    }));
    const priceLabel = kind === 'staff'
      ? `Найм ${item.price}`
      : (kind === 'room' ? `${item.coins} монет · ${item.crystals} крист.` : `Цена ${item.price}`);
    card.add(this.scene.add.text(-40, -32, priceLabel, {
      fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffe082',
    }));
    const second = kind === 'staff'
      ? `Зарплата ${item.salary}/день`
      : (kind === 'room' ? `Мин. уровень ${item.minLevel}` : (item.group || ''));
    card.add(this.scene.add.text(-40, -10, second, {
      fontFamily: FONT, fontSize: '16px', color: '#b9e6df',
    }));
    let hint = '';
    if (kind === 'staff') {
      hint = item.hint;
    } else if (kind === 'room') {
      hint = open ? 'Уже открыт и принимает пациентов' : 'Откроет вход пациентам';
    } else if (locked) {
      hint = `Откроется на уровне ${unlock}`;
    }
    card.add(this.scene.add.text(-CARD_W / 2 + 10, 12, hint, {
      fontFamily: FONT, fontSize: '16px', color: '#dff3ff',
      lineSpacing: 2,
      wordWrap: { width: CARD_W - 20 },
    }));

    let action = kind === 'staff' ? 'Нанять' : 'Поставить';
    if (kind === 'room') {
      action = open ? 'Открыт' : 'Открыть';
    }
    const label = locked && kind !== 'room' ? `С ур. ${unlock}` : action;
    const baseColor = kind === 'staff' ? 0x3f9b4a : (kind === 'room' ? 0xc9622f : 0x2f80c9);
    const hover = kind === 'staff' ? 0x55b963 : (kind === 'room' ? 0xe07a45 : 0x4a9be0);
    const button = uiButton(this.scene, 0, CARD_H / 2 - 20, label, () => {
      this.choose(item, kind, locked, unlock);
    }, {
      width: 170, height: 36, fontSize: 16,
      color: open ? 0x6b7f86 : baseColor,
      hoverColor: open ? 0x6b7f86 : hover,
      disabled: locked && kind !== 'room',
    });
    card.add(button);

    if (locked || open) {
      const badge = open ? 'Открыт' : `Ур. ${unlock}`;
      const badgeX = kind === 'room' ? -CARD_W / 2 + 10 : CARD_W / 2 - 10;
      const badgeOrigin = kind === 'room' ? 0 : 1;
      card.add(this.scene.add.text(badgeX, -CARD_H / 2 + 6, badge, {
        fontFamily: FONT, fontSize: '16px', fontStyle: 'bold',
        color: open ? '#b9f6ca' : '#ffcc80',
      }).setOrigin(badgeOrigin, 0));
    }
    this.cards.push(card);
    return card;
  }

  choose(item, kind, locked, unlock) {
    if (kind === 'room') {
      if (this.roomsState.includes(item.roomId)) {
        this.hooks.notify('Этот кабинет уже открыт');
      } else if (this.level < item.minLevel) {
        this.hooks.notify(`Кабинет откроется на уровне ${item.minLevel}`);
      } else if (typeof this.hooks.onUnlockRoom === 'function') {
        this.hooks.onUnlockRoom(item.roomId);
      }
      return;
    }
    if (locked) {
      if (typeof this.hooks.notify === 'function') {
        this.hooks.notify(`Откроется на уровне ${unlock}`);
      }
      return;
    }
    if (kind === 'staff') {
      this.hooks.onHire(item.id);
    } else {
      this.hooks.onPlace(item.type, item.price);
    }
  }
}
