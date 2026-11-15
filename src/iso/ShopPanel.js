// Магазин 2.0 (этап 17): вкладки «Мебель», «Персонал», «Украшения».
// Заблокированные по уровню карточки видны серыми с замком. Панель не двигает
// деньги сама: мебель уходит в режим стройки, персонал нанимает StaffFlow.

import { CATALOG, itemUnlockLevel } from '../data/buildCatalog.js';
import { STAFF_ROLES, staffUnlockLevel } from '../data/staffCatalog.js';
import { ROOM_UNLOCKS, STARTER_ROOMS } from '../data/roomUnlocks.js';
import { isoKey } from './isoAssets.js';
import { createButton } from '../ui/Button.js';

const FONT = 'Arial, "Segoe UI", sans-serif';
const CARD_W = 250;
const CARD_H = 150;
const PER_PAGE = 8;
const TABS = [
  { id: 'furniture', title: 'Мебель', color: 0x2f80c9 },
  { id: 'staff', title: 'Персонал', color: 0x3f9b4a },
  { id: 'decor', title: 'Украшения', color: 0x8d7bb5 },
  { id: 'rooms', title: 'Кабинеты', color: 0xc9622f },
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
    this.root.add(scene.add.nineslice(640, 360, isoKey('ui_ui_window'), undefined, 1216, 664, 48, 48, 48, 48));

    this.root.add(scene.add.text(40, 34, 'Магазин', {
      fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: '#ffffff',
      stroke: '#0d3b3a', strokeThickness: 4,
    }));
    this.root.add(scene.add.text(40, 76, 'Мебель, персонал и украшения. Новые позиции открываются с уровнем.', {
      fontFamily: FONT, fontSize: '15px', color: '#bfe9e2',
    }));

    this.tabsRoot = scene.add.container(0, 0);
    this.content = scene.add.container(0, 0);
    this.root.add([this.tabsRoot, this.content]);

    this.footer = scene.add.text(40, 660, '', {
      fontFamily: FONT, fontSize: '15px', color: '#b9e6df',
    });
    this.root.add(this.footer);

    this.prev = createButton(scene, 1040, 660, '◀', () => this.turnPage(-1), {
      width: 60, height: 36, fontSize: 20, color: 0x5b7f8c, hoverColor: 0x729aa8,
    });
    this.next = createButton(scene, 1120, 660, '▶', () => this.turnPage(1), {
      width: 60, height: 36, fontSize: 20, color: 0x5b7f8c, hoverColor: 0x729aa8,
    });
    this.root.add([this.prev, this.next]);

    const close = createButton(scene, 1180, 50, 'Закрыть', () => this.hide(), {
      width: 160, height: 42, fontSize: 17, color: 0x5b7f8c, hoverColor: 0x729aa8,
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
      const button = createButton(this.scene, 300 + index * 210, 122, tab.title, () => this.setTab(tab.id), {
        width: 194, height: 40, fontSize: 17,
        color: active ? tab.color : 0x9fb8c3,
        hoverColor: active ? tab.color : 0xb9cbd3,
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
    const card = this.scene.add.container(190 + col * 260, 238 + row * 180);
    card.setAlpha(locked ? 0.62 : 1);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x14303f, 1);
    bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 14);
    bg.lineStyle(2, locked ? 0x4a5b63 : (open ? 0x8d7bb5 : 0x4fb3a5), 1);
    bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 14);
    card.add(bg);

    const key = kind === 'staff' ? item.sprite : (kind === 'room' ? 'sign_blank' : item.type);
    const img = this.scene.add.image(-82, -10, isoKey(key));
    img.setScale(Math.min(62 / img.width, 78 / img.height));
    card.add(img);

    card.add(this.scene.add.text(-38, -64, item.title, {
      fontFamily: FONT, fontSize: kind === 'room' ? '15px' : '16px', fontStyle: 'bold', color: '#ffffff',
      wordWrap: { width: kind === 'room' ? 150 : 180 },
    }));
    const priceLabel = kind === 'staff'
      ? `Найм ${item.price}`
      : (kind === 'room' ? `${item.coins} монет · ${item.crystals} крист.` : `Цена ${item.price}`);
    card.add(this.scene.add.text(-38, -38, priceLabel, {
      fontFamily: FONT, fontSize: '14px', fontStyle: 'bold', color: '#ffe082',
    }));
    const second = kind === 'staff'
      ? `Зарплата ${item.salary}/день`
      : (kind === 'room' ? `Мин. уровень ${item.minLevel}` : (item.group || ''));
    card.add(this.scene.add.text(-38, -16, second, {
      fontFamily: FONT, fontSize: '12px', color: '#b9e6df',
    }));
    let hint = 'Купить и поставить в больнице';
    if (kind === 'staff') {
      hint = item.hint;
    } else if (kind === 'room') {
      hint = open ? 'Уже открыт и принимает пациентов' : 'Открыть вход и пустить пациентов';
    } else if (locked) {
      hint = `Откроется на уровне ${unlock}`;
    }
    card.add(this.scene.add.text(-CARD_W / 2 + 10, 14, hint, {
      fontFamily: FONT, fontSize: '12px', color: '#dff3ff',
      wordWrap: { width: CARD_W - 20 },
    }));

    let action = kind === 'staff' ? 'Нанять' : 'Поставить';
    if (kind === 'room') {
      action = open ? 'Открыт' : 'Открыть';
    }
    const label = locked && kind !== 'room' ? `С ур. ${unlock}` : action;
    const baseColor = kind === 'staff' ? 0x3f9b4a : (kind === 'room' ? 0xc9622f : 0x2f80c9);
    const hover = kind === 'staff' ? 0x55b963 : (kind === 'room' ? 0xe07a45 : 0x4a9be0);
    const button = createButton(this.scene, 0, CARD_H / 2 - 18, label, () => {
      this.choose(item, kind, locked, unlock);
    }, {
      width: 150, height: 32, fontSize: 15,
      color: open ? 0x6b7f86 : baseColor,
      hoverColor: open ? 0x6b7f86 : hover,
    });
    card.add(button);

    if (locked || open) {
      const badge = open ? 'Открыт' : `Ур. ${unlock}`;
      const badgeX = kind === 'room' ? -CARD_W / 2 + 10 : CARD_W / 2 - 12;
      const badgeOrigin = kind === 'room' ? 0 : 1;
      card.add(this.scene.add.text(badgeX, -CARD_H / 2 + 8, badge, {
        fontFamily: FONT, fontSize: '12px', fontStyle: 'bold',
        color: open ? '#b9f6ca' : '#ffcc80',
        stroke: '#10222e', strokeThickness: 3,
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
