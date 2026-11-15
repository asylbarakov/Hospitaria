// Экран заданий (этап 16): ежедневные, недельные и сюжетная цепочка.
// Фон — ui_window/ui_panel из assets/final, прогресс и награды обновляются из систем Quests.
// Панель не начисляет награды сама: сцена обрабатывает onClaim и сохраняет прогресс.

import { button as uiButton, plate, progressBar, windowFrame } from '../ui/IsoUi.js';
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

    this.root.add(windowFrame(scene, 640, 360, 1216, 664));

    this.root.add(plate(scene, 170, 100, 190, 56, { tint: 0x123240 }));
    this.root.add(scene.add.text(96, 100, 'Задания', {
      fontFamily: FONT, fontSize: '32px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0, 0.5));
    this.root.add(scene.add.text(76, 210, 'Ежедневные, недельные и сюжетные задания', {
      fontFamily: FONT, fontSize: '16px', color: '#4d7b8a',
    }));

    this.coinIcon = scene.add.image(860, 100, isoKey('icons_icon_coin')).setScale(0.16);
    this.coinText = scene.add.text(878, 100, '0', {
      fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#fff3b0',
    }).setOrigin(0, 0.5);
    this.crystalIcon = scene.add.image(960, 100, isoKey('icons_icon_crystal')).setScale(0.16);
    this.crystalText = scene.add.text(978, 100, '0', {
      fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#dff6ff',
    }).setOrigin(0, 0.5);
    this.root.add([this.coinIcon, this.coinText, this.crystalIcon, this.crystalText]);

    const close = uiButton(scene, 1150, 100, 'Закрыть', () => this.hide(), {
      width: 150, height: 56, fontSize: 18, variant: 'gray',
    });
    this.root.add(close);

    this.tabsRoot = scene.add.container(0, 0);
    this.root.add(this.tabsRoot);
    this.content = scene.add.container(0, 0);
    this.root.add(this.content);

    this.footer = scene.add.text(72, 655, '', {
      fontFamily: FONT, fontSize: '16px', color: '#1b4b5a',
    }).setOrigin(0, 0.5);
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
    // Сюжетных заданий девять: раскладываем их в две колонки, чтобы всё влезло.
    const step = compact ? 82 : 132;
    const startY = compact ? 274 : 296;
    quests.forEach((quest, index) => {
      const col = compact ? index % 2 : 0;
      const row = compact ? Math.floor(index / 2) : index;
      const x = compact ? 350 + col * 590 : 640;
      this.content.add(this.makeCard(quest, x, startY + row * step, compact));
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
      const button = uiButton(this.scene, 350 + index * 190, 100, tab.label, () => this.setTab(tab.id), {
        width: 174, height: 56, fontSize: 17,
        color: active ? category.color : 0x9fb8c3,
        hoverColor: active ? category.color : 0xb9cbd3,
        active,
      });
      this.tabsRoot.add(button);
    });
  }

  makeCard(quest, x, y, compact) {
    const width = compact ? 560 : CARD_W;
    const height = compact ? 74 : 122;
    const card = this.scene.add.container(x, y);
    card.add(plate(this.scene, 0, 0, width, height, { tint: 0x14303f }));
    // Лёгкое приглушение вместо сильного: текст награды и прогресса должен читаться.
    if (quest.claimed) {
      card.setAlpha(0.9);
    } else if (quest.locked) {
      card.setAlpha(0.86);
    }

    const category = this.state[this.tab];
    const left = -width / 2;
    const ratio = quest.target > 0 ? Math.min(1, quest.progress / quest.target) : 0;
    const rewards = this.rewardText(quest.reward);

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

    if (compact) {
      // Компактная карточка сюжета: прогресс в заголовке, награда второй строкой.
      const icon = this.scene.add.image(left + 24, 0, isoKey(`icons_${category.icon}`)).setScale(0.16);
      card.add(icon);
      card.add(this.scene.add.text(left + 52, -30, `${quest.title}  ${quest.progress}/${quest.target}`, {
        fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#ffffff',
        wordWrap: { width: 320 },
      }));
      card.add(this.scene.add.text(left + 52, 2, rewards, {
        fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffe082',
        wordWrap: { width: 320 },
      }));
      const claim = uiButton(this.scene, width / 2 - 76, 0, label, () => this.claim(quest.id), {
        width: 140, height: 48, fontSize: 16, color, hoverColor: 0x55b963, disabled,
      });
      card.add(claim);
      return card;
    }

    const icon = this.scene.add.image(left + 34, 0, isoKey(`icons_${category.icon}`)).setScale(0.3);
    card.add(icon);
    const top = -height / 2;
    const textX = left + 74;
    card.add(this.scene.add.text(textX, top + 10, quest.title, {
      fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#ffffff',
    }));
    card.add(this.scene.add.text(textX, top + 38, quest.description, {
      fontFamily: FONT, fontSize: '16px', color: '#b9e6df', wordWrap: { width: 430 },
    }));
    const bar = progressBar(this.scene, textX, top + 78, 400, 16);
    bar.setProgress(ratio);
    card.add(bar.root);
    card.add(this.scene.add.text(textX + 410, top + 86, `${quest.progress} / ${quest.target}`, {
      fontFamily: FONT, fontSize: '16px', fontStyle: 'bold',
      color: quest.complete ? '#9dffb0' : '#dff3ff',
    }).setOrigin(0, 0.5));
    card.add(this.scene.add.text(330, -10, rewards, {
      fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffe082',
    }).setOrigin(1, 0.5));
    const claim = uiButton(this.scene, 430, 0, label, () => this.claim(quest.id), {
      width: 170, height: 56, fontSize: 16, color, hoverColor: 0x55b963, disabled,
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
