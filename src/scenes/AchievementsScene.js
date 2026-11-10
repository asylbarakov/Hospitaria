import { createButton } from '../ui/Button.js';
import { HUD_FONT, drawCoinIcon } from '../ui/hudDrawing.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { DISEASES } from '../data/diseases.js';
import { createAchievementCard, createCollectionCard } from '../ui/achievementCards.js';
import {
  ensureAchievements,
  checkAchievements,
  achievementProgress,
} from '../systems/Achievements.js';

const W = 1280;
const H = 720;
const PANEL_X = 50;
const PANEL_Y = 32;
const PANEL_W = 1180;
const PANEL_H = 658;

export default class AchievementsScene extends Phaser.Scene {
  constructor() {
    super('AchievementsScene');
  }

  init() {
    this.closed = false;
    this.hospital = null;
    this.tab = 'achievements';
    this.contentRoot = null;
    this.tabsRoot = null;
    this.unlockedNow = 0;
  }

  create() {
    this.hospital = this.scene.get('HospitalScene');
    this.registry.set('uiModal', true);
    if (this.scene.isActive('HospitalScene')) {
      this.scene.pause('HospitalScene');
    }

    const save = this.hospital ? this.hospital.saveData : null;
    ensureAchievements(save);
    this.unlockedNow = this.hospital
      ? checkAchievements(this.hospital, this, true).length
      : 0;

    this.drawPanel();
    this.buildHeader();
    this.buildTabs();
    this.render();

    this.input.keyboard.on('keydown-ESC', () => this.close());
    this.events.once('shutdown', () => this.handleShutdown());
  }

  drawPanel() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x10222e, 0.58);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0x0b1e28, 0.25);
    g.fillRoundedRect(PANEL_X + 8, PANEL_Y + 8, PANEL_W, PANEL_H, 26);
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 26);
    g.fillStyle(0x8d7bb5, 1);
    g.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, 92, { tl: 26, tr: 26, bl: 0, br: 0 });
    g.fillStyle(0x0b1e28, 0.16);
    g.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, 92, { tl: 26, tr: 26, bl: 0, br: 0 });
    g.lineStyle(3, 0x8fb7c7, 1);
    g.strokeRoundedRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 26);

    this.add
      .rectangle(W / 2, H / 2, W, H, 0x10222e, 0.001)
      .setDepth(-1)
      .setInteractive();
  }

  buildHeader() {
    this.add
      .text(92, 78, 'Успехи', {
        fontFamily: HUD_FONT,
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0, 0.5)
      .setDepth(2);

    this.add
      .text(290, 82, 'достижения и коллекция болезней', {
        fontFamily: HUD_FONT,
        fontSize: '14px',
        color: '#ece4f7',
      })
      .setOrigin(0, 0.5)
      .setDepth(2);

    const pill = this.add.graphics().setDepth(2);
    pill.fillStyle(0xfff4d6, 1);
    pill.fillRoundedRect(886, 54, 196, 44, 14);
    pill.lineStyle(2, 0xefd48a, 1);
    pill.strokeRoundedRect(886, 54, 196, 44, 14);
    drawCoinIcon(pill, 912, 76, 11);

    this.coinText = this.add
      .text(934, 76, '0', {
        fontFamily: HUD_FONT,
        fontSize: '21px',
        fontStyle: 'bold',
        color: '#8a5a00',
      })
      .setOrigin(0, 0.5)
      .setDepth(3);

    createButton(this, 1146, 76, 'Закрыть', () => this.close(), {
      width: 130,
      height: 44,
      fontSize: 17,
      color: 0x5b7f8c,
      hoverColor: 0x729aa8,
      depth: 3,
    });

    this.statusText = this.add
      .text(640, 670, '', {
        fontFamily: HUD_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#2e7d32',
      })
      .setOrigin(0.5)
      .setDepth(3);

    if (this.unlockedNow > 0) {
      this.statusText.setText(`Открыто новых достижений: ${this.unlockedNow}. Награда уже начислена.`);
    }
  }

  buildTabs() {
    if (this.tabsRoot) {
      this.tabsRoot.destroy(true);
    }
    this.tabsRoot = this.add.container(0, 0).setDepth(2);

    const tabs = [
      { id: 'achievements', label: 'Достижения', color: 0x8d7bb5 },
      { id: 'collection', label: 'Коллекция', color: 0x4f9c94 },
    ];

    tabs.forEach((tab, index) => {
      const active = this.tab === tab.id;
      const button = createButton(
        this,
        210 + index * 230,
        158,
        tab.label,
        () => this.setTab(tab.id),
        {
          width: 210,
          height: 46,
          fontSize: 18,
          color: active ? tab.color : 0xb9cbd3,
          hoverColor: active ? tab.color : 0x9fb8c3,
          depth: 3,
        },
      );
      this.tabsRoot.add(button);
    });

    this.refreshCoins();
  }

  refreshCoins() {
    this.coinText.setText(String(Math.max(0, Number(this.registry.get('coins')) || 0)));
  }

  setTab(tabId) {
    if (this.tab === tabId) {
      return;
    }
    this.tab = tabId;
    this.buildTabs();
    this.render();
  }

  render() {
    if (this.contentRoot) {
      this.contentRoot.destroy(true);
    }
    this.contentRoot = this.add.container(0, 0).setDepth(1);

    if (this.tab === 'collection') {
      this.renderCollection();
    } else {
      this.renderAchievements();
    }

    this.refreshCoins();
  }

  renderAchievements() {
    const save = this.hospital ? this.hospital.saveData : null;
    const done = save && Array.isArray(save.achievements) ? save.achievements.length : 0;

    this.addCounter(`Выполнено: ${done} из ${ACHIEVEMENTS.length}`);

    ACHIEVEMENTS.forEach((achievement, index) => {
      const unlocked = !!save && save.achievements.includes(achievement.id);
      const progress = Math.min(achievementProgress(save, achievement), achievement.target);
      const ratio = achievement.target > 0 ? progress / achievement.target : 0;

      createAchievementCard(
        this,
        this.contentRoot,
        achievement,
        { unlocked, progress, ratio },
        328 + (index % 2) * 610,
        238 + Math.floor(index / 2) * 64,
      );
    });
  }

  renderCollection() {
    const save = this.hospital ? this.hospital.saveData : null;
    const cured = save && Array.isArray(save.collection) ? save.collection : [];

    this.addCounter(`Собрано: ${cured.length} из ${DISEASES.length}`);

    DISEASES.forEach((disease, index) => {
      createCollectionCard(
        this,
        this.contentRoot,
        disease,
        cured.includes(disease.id),
        232 + (index % 3) * 408,
        238 + Math.floor(index / 3) * 74,
      );
    });
  }

  addCounter(text) {
    const label = this.add
      .text(1180, 198, text, {
        fontFamily: HUD_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#5b7f8c',
      })
      .setOrigin(1, 0.5);
    this.contentRoot.add(label);
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
    this.contentRoot = null;
    this.tabsRoot = null;
  }
}
