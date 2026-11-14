// Экран заданий (этап 16): ежедневные, недельные и сюжетная цепочка.
// Фон — ui_window/ui_panel из assets/final, прогресс и награды обновляются из систем Quests.
// Панель не начисляет награды сама: сцена обрабатывает onClaim и сохраняет прогресс.

import { createButton } from '../ui/Button.js';
import { isoKey } from './isoAssets.js';

const FONT = 'Arial, "Segoe UI", sans-serif';
const CARD_W = 1120;

export default class QuestPanel {
  /**
   * @param {Phaser.Scene} scene
   * @param {{onClaim:Function, onClose:Function}} hooks
   */
  constructor(scene, hooks) {
    this.scene = scene;
    this.hooks = hooks;
    this.tab = 'daily';
    this.state = null;
    this.lastRevision = -1;
    this.lastTab = null;
    this.root = scene.add.container(0, 0).setDepth(20).setVisible(false);
    this.status = '';

    const overlay = scene.add.graphics();
    overlay.fillStyle(0x06141d, 0.9);
    overlay.fillRect(0, 0, 1280, 720);
    this.root.add(overlay);

    const win = scene.add.nineslice(640, 360, isoKey('ui_ui_window'), undefined, 1216, 664, 48, 48, 48, 48);
    this.root.add(win);

    const headerPlate = scene.add.graphics();
    headerPlate.fillStyle(0x0b2833, 0.82);
    headerPlate.fillRoundedRect(76, 30, 470, 78, 14);
    headerPlate.lineStyle(2, 0x4fb3a5, 0.8);
    headerPlate.strokeRoundedRect(76, 30, 470, 78, 14);
    this.root.add(headerPlate);
    this.root.add(scene.add.text(96, 44, 'Задания', {
      fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: '#ffffff',
      stroke: '#0d3b3a', strokeThickness: 4,
    }));
    this.root.add(scene.add.text(96, 84, 'Ежедневные, недельные и сюжетные задания', {
      fontFamily: FONT, fontSize: '15px', color: '#bfe9e2',
    }));

    this.coinIcon = scene.add.image(860, 58, isoKey('icons_icon_coin')).setScale(0.18);
    this.coinText = scene.add.text(884, 58, '0', {
      fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#fff3b0',
      stroke: '#0d3b3a', strokeThickness: 4,
    }).setOrigin(0, 0.5);
    this.crystalIcon = scene.add.image(980, 58, isoKey('icons_icon_crystal')).setScale(0.18);
    this.crystalText = scene.add.text(1004, 58, '0', {
      fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#dff6ff',
      stroke: '#0d3b3a', strokeThickness: 4,
    }).setOrigin(0, 0.5);
    this.root.add([this.coinIcon, this.coinText, this.crystalIcon, this.crystalText]);

    const close = createButton(scene, 1180, 58, 'Закрыть', () => this.hide(), {
      width: 140, height: 40, fontSize: 17, color: 0x5b7f8c, hoverColor: 0x729aa8,
    });
    this.root.add(close);

    this.tabsRoot = scene.add.container(0, 0);
    this.root.add(this.tabsRoot);
    this.content = scene.add.container(0, 0);
    this.root.add(this.content);

    this.footer = scene.add.text(70, 650, '', {
      fontFamily: FONT, fontSize: '15px', color: '#24444f',
    });
    this.root.add(this.footer);
  }

  get visible() {
    return this.root.visible;
  }

  show() {
    this.root.setVisible(true);
    this.status = '';
    this.lastRevision = -1;
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

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  setTab(tab) {
    if (this.tab === tab) {
      return;
    }
    this.tab = tab;
    this.refresh();
  }

  /** Вызывается из HUD каждый кадр; перестраивает карточки только при изменениях. */
  update(state, coins, crystals) {
    if (!this.root.visible || !state) {
      return;
    }
    this.coinText.setText(String(coins));
    this.crystalText.setText(String(crystals));
    const revision = state.revision;
    if (revision !== this.lastRevision || this.tab !== this.lastTab) {
      this.state = state;
      this.refresh();
    }
  }

  refresh() {
    if (!this.state) {
      return;
    }
    this.lastRevision = this.state.revision;
    this.lastTab = this.tab;
    this.buildTabs();
    this.content.removeAll(true);
    const category = this.state[this.tab];
    const quests = category ? category.quests : [];
    const compact = this.tab === 'story';
    const step = compact ? 62 : 132;
    const startY = compact ? 212 : 220;
    quests.forEach((quest, index) => {
      this.content.add(this.makeCard(quest, startY + index * step, compact));
    });
    this.updateFooter(category, quests);
  }

  buildTabs() {
    this.tabsRoot.removeAll(true);
    const tabs = [
      { id: 'daily', label: 'Ежедневные' },
      { id: 'weekly', label: 'Недельные' },
      { id: 'story', label: 'Сюжет' },
    ];
    tabs.forEach((tab, index) => {
      const category = this.state[tab.id];
      const active = tab.id === this.tab;
      const button = createButton(this.scene, 190 + index * 190, 132, tab.label, () => this.setTab(tab.id), {
        width: 174, height: 42, fontSize: 17,
        color: active ? category.color : 0x9fb8c3,
        hoverColor: active ? category.color : 0xb9cbd3,
      });
      this.tabsRoot.add(button);
    });
  }

  makeCard(quest, y, compact) {
    const height = compact ? 56 : 122;
    const card = this.scene.add.container(640, y);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x14303f, 0.98);
    bg.fillRoundedRect(-CARD_W / 2, -height / 2, CARD_W, height, 12);
    bg.lineStyle(2, this.state[this.tab].color, 0.9);
    bg.strokeRoundedRect(-CARD_W / 2, -height / 2, CARD_W, height, 12);
    card.add(bg);
    if (quest.claimed) {
      card.setAlpha(0.78);
    } else if (quest.locked) {
      card.setAlpha(0.68);
    }

    const category = this.state[this.tab];
    const icon = this.scene.add.image(-520, 0, isoKey(`icons_${category.icon}`));
    icon.setScale(compact ? 0.2 : 0.3);
    card.add(icon);

    const top = -height / 2;
    const title = this.scene.add.text(-474, top + (compact ? 5 : 10), quest.title, {
      fontFamily: FONT, fontSize: compact ? '17px' : '20px', fontStyle: 'bold', color: '#ffffff',
    });
    card.add(title);
    if (!compact) {
      card.add(this.scene.add.text(-474, top + 38, quest.description, {
        fontFamily: FONT, fontSize: '13px', color: '#b9e6df', wordWrap: { width: 420 },
      }));
    }

    const barX = -474;
    const barY = top + (compact ? 32 : 78);
    const barW = compact ? 300 : 400;
    const ratio = quest.target > 0 ? Math.min(1, quest.progress / quest.target) : 0;
    const bar = this.scene.add.graphics();
    bar.fillStyle(0x0b2833, 1);
    bar.fillRoundedRect(barX, barY, barW, 13, 6);
    if (ratio > 0) {
      bar.fillStyle(quest.complete ? 0x4caf50 : category.color, 1);
      bar.fillRoundedRect(barX, barY, Math.max(12, barW * ratio), 13, 6);
    }
    card.add(bar);
    card.add(this.scene.add.text(barX + barW + 12, barY + 6, `${quest.progress} / ${quest.target}`, {
      fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: quest.complete ? '#9dffb0' : '#dff3ff',
    }).setOrigin(0, 0.5));

    const rewards = this.rewardText(quest.reward);
    card.add(this.scene.add.text(40, compact ? 0 : -10, rewards, {
      fontFamily: FONT, fontSize: '13px', fontStyle: 'bold', color: '#ffe082',
    }).setOrigin(0, 0.5));

    let label = 'В процессе';
    let color = 0x9e9e9e;
    let disabled = true;
    if (quest.claimed) {
      label = 'Получено';
    } else if (quest.locked) {
      label = 'Закрыто';
    } else if (quest.complete) {
      label = 'Забрать';
      color = 0x3f9b4a;
      disabled = false;
    }
    const claim = createButton(this.scene, 430, 0, label, () => this.claim(quest.id), {
      width: 170, height: 40, fontSize: 16, color, hoverColor: 0x55b963, disabled,
    });
    card.add(claim);
    return card;
  }

  rewardText(reward) {
    if (!reward) {
      return '';
    }
    const parts = [];
    if (reward.coins) parts.push(`${reward.coins} монет`);
    if (reward.experience) parts.push(`${reward.experience} опыта`);
    if (reward.crystals) parts.push(`${reward.crystals} крист.`);
    return parts.join(' · ');
  }

  claim(id) {
    const result = this.hooks.onClaim(this.tab, id);
    if (result && result.ok) {
      this.status = `Награда получена: ${this.rewardText(result.reward)}`;
    } else {
      this.status = (result && result.hint) || 'Не удалось забрать награду';
    }
    // Новое состояние придёт из HUD следующим кадром; заставим карточки пересобраться.
    this.lastRevision = -1;
  }

  updateFooter(category, quests) {
    const done = quests.filter((quest) => quest.claimed).length;
    const ready = quests.filter((quest) => quest.complete && !quest.claimed).length;
    const parts = [`Выполнено: ${done} из ${quests.length}`];
    if (ready > 0) {
      parts.push(`готово к награде: ${ready}`);
    }
    if (this.status) {
      parts.push(this.status);
    }
    this.footer.setText(parts.join('  •  '));
  }
}
