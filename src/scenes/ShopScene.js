import { createButton } from '../ui/Button.js';
import { createShopCard } from '../ui/ShopCard.js';
import { HUD_FONT, drawCoinIcon } from '../ui/hudDrawing.js';
import { SHOP_TABS, getShopItems } from '../data/shopItems.js';
import { ownsItem, isItemEquipped } from '../systems/ShopActions.js';
import { playCoin, playError } from '../systems/Sound.js';
import { spawnSparkle } from '../ui/particles.js';
import { checkAchievements } from '../systems/Achievements.js';

const W = 1280;
const H = 720;
const COLUMN_X = [190, 458, 726, 994];
const ROW_Y = [342, 562];

export default class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  init(data = {}) {
    this.currentTab = data.tab === 'furniture' ? 'furniture' : 'clothes';
    this.closed = false;
    this.hospital = null;
    this.cardsRoot = null;
    this.tabRoot = null;
  }

  create() {
    this.hospital = this.scene.get('HospitalScene');
    this.registry.set('uiModal', true);
    if (this.scene.isActive('HospitalScene')) {
      this.scene.pause('HospitalScene');
    }

    this.drawPanel();
    this.buildHeader();
    this.buildTabs();
    this.renderCards();

    this.input.keyboard.on('keydown-ESC', () => this.close());
    this.events.once('shutdown', () => this.handleShutdown());
  }

  drawPanel() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x10222e, 0.58);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0x0b1e28, 0.25);
    g.fillRoundedRect(58, 40, 1180, 658, 26);
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(50, 32, 1180, 658, 26);
    g.fillStyle(0x3f8fb0, 1);
    g.fillRoundedRect(50, 32, 1180, 92, { tl: 26, tr: 26, bl: 0, br: 0 });
    g.fillStyle(0x0b1e28, 0.16);
    g.fillRoundedRect(50, 32, 1180, 92, { tl: 26, tr: 26, bl: 0, br: 0 });
    g.lineStyle(3, 0x8fb7c7, 1);
    g.strokeRoundedRect(50, 32, 1180, 658, 26);

    const backdrop = this.add
      .rectangle(W / 2, H / 2, W, H, 0x10222e, 0.001)
      .setDepth(-1)
      .setInteractive();
    backdrop.setData('shopBlocker', true);
  }

  buildHeader() {
    this.add
      .text(92, 78, 'Магазин', {
        fontFamily: HUD_FONT,
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0, 0.5)
      .setDepth(2);

    const pill = this.add.graphics().setDepth(2);
    pill.fillStyle(0xeaf3ff, 1);
    pill.fillRoundedRect(890, 54, 196, 44, 14);
    pill.lineStyle(2, 0xb9cdf0, 1);
    pill.strokeRoundedRect(890, 54, 196, 44, 14);
    drawCoinIcon(pill, 914, 76, 11);

    this.coinText = this.add
      .text(934, 76, '0', {
        fontFamily: HUD_FONT,
        fontSize: '21px',
        fontStyle: 'bold',
        color: '#8a5a00',
      })
      .setOrigin(0, 0.5)
      .setDepth(3);

    createButton(this, 1168, 76, 'Закрыть', () => this.close(), {
      width: 130,
      height: 44,
      fontSize: 17,
      color: 0x8a6d5b,
      hoverColor: 0xa88a76,
      depth: 3,
    });

    this.statusText = this.add
      .text(1202, 118, '', {
        fontFamily: HUD_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#2e7d32',
      })
      .setOrigin(1, 0.5)
      .setDepth(3);

    this.refreshCoins();
  }

  refreshCoins() {
    const coins = Number(this.registry.get('coins')) || 0;
    this.coinText.setText(String(coins));
  }

  buildTabs() {
    if (this.tabRoot) {
      this.tabRoot.destroy(true);
    }
    this.tabRoot = this.add.container(0, 0).setDepth(2);

    SHOP_TABS.forEach((tab, index) => {
      const active = tab.id === this.currentTab;
      const button = createButton(
        this,
        210 + index * 260,
        182,
        tab.label,
        () => this.setTab(tab.id),
        {
          width: 240,
          height: 44,
          fontSize: 18,
          color: active ? 0x3f8fb0 : 0x8aa6b0,
          hoverColor: active ? 0x57a8c9 : 0x9fb8c2,
        },
      );
      this.tabRoot.add(button);
    });
  }

  setTab(tabId) {
    if (this.currentTab === tabId) {
      return;
    }
    this.currentTab = tabId;
    this.statusText.setText('');
    this.buildTabs();
    this.renderCards();
  }

  renderCards() {
    if (this.cardsRoot) {
      this.cardsRoot.destroy(true);
    }
    this.cardsRoot = this.add.container(0, 0).setDepth(1);

    const items = getShopItems(this.currentTab);
    const level = Number(this.registry.get('level')) || 1;
    const coins = Number(this.registry.get('coins')) || 0;

    items.forEach((item, index) => {
      const column = index % COLUMN_X.length;
      const row = Math.floor(index / COLUMN_X.length);
      if (!ROW_Y[row]) {
        return;
      }

      const owned = ownsItem(this.hospital, item.id);
      const state = {
        locked: level < item.level,
        owned,
        equipped: isItemEquipped(this.hospital, item),
        affordable: coins >= item.price,
      };

      createShopCard(
        this,
        this.cardsRoot,
        COLUMN_X[column],
        ROW_Y[row],
        item,
        state,
        () => this.handleAction(item),
      );
    });
  }

  handleAction(item) {
    if (!this.hospital) {
      return;
    }

    const level = Number(this.registry.get('level')) || 1;
    if (level < item.level) {
      playError();
      this.showStatus(`Откроется на уровне ${item.level}`, '#c62828');
      return;
    }

    if (ownsItem(this.hospital, item.id)) {
      if (this.hospital.equipItem) {
        this.hospital.equipItem(item);
      }
      this.showStatus(`Применено: ${item.name}`, '#2e7d32');
      this.refreshAll();
      return;
    }

    const result = this.hospital.purchaseItem
      ? this.hospital.purchaseItem(item)
      : { ok: false, reason: 'error' };

    if (!result.ok) {
      playError();
      const message = result.reason === 'coins'
        ? 'Недостаточно монет'
        : 'Покупка недоступна';
      this.showStatus(message, '#c62828');
      return;
    }

    playCoin();
    spawnSparkle(this, this.input.activePointer.x, this.input.activePointer.y);
    this.showStatus(`Куплено: ${item.name}`, '#2e7d32');
    this.refreshAll();
  }

  refreshAll() {
    if (this.hospital) {
      checkAchievements(this.hospital, this);
    }
    this.refreshCoins();
    this.renderCards();
  }

  showStatus(message, color) {
    this.statusText.setText(message);
    this.statusText.setColor(color);
  }

  close() {
    if (this.closed) {
      return;
    }
    this.closed = true;
    if (this.scene.isPaused('HospitalScene')) {
      this.scene.resume('HospitalScene');
    }
    this.registry.set('uiModal', false);
    this.scene.stop();
  }

  handleShutdown() {
    if (this.scene.isPaused('HospitalScene')) {
      this.scene.resume('HospitalScene');
    }
    this.registry.set('uiModal', false);
    this.cardsRoot = null;
    this.tabRoot = null;
  }
}
