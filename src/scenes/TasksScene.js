import { createButton } from '../ui/Button.js';
import { HUD_FONT, drawCoinIcon } from '../ui/hudDrawing.js';
import { DAILY_TASKS } from '../data/dailyTasks.js';
import {
  getTaskProgress,
  isTaskComplete,
  isTaskClaimed,
} from '../systems/DailyTasks.js';

const W = 1280;
const H = 720;
const PANEL_X = 140;
const PANEL_Y = 50;
const PANEL_W = 1000;
const PANEL_H = 620;
const CARD_W = 860;
const CARD_H = 140;

export default class TasksScene extends Phaser.Scene {
  constructor() {
    super('TasksScene');
  }

  init() {
    this.closed = false;
    this.hospital = null;
    this.tasksRoot = null;
  }

  create() {
    this.hospital = this.scene.get('HospitalScene');
    this.registry.set('uiModal', true);
    if (this.scene.isActive('HospitalScene')) {
      this.scene.pause('HospitalScene');
    }

    this.drawPanel();
    this.buildHeader();
    this.buildTasks();

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
    g.fillStyle(0x8a6d5b, 1);
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
      .text(182, 96, 'Ежедневные задания', {
        fontFamily: HUD_FONT,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0, 0.5)
      .setDepth(2);

    this.add
      .text(182, 122, 'Обновляются каждый день', {
        fontFamily: HUD_FONT,
        fontSize: '14px',
        color: '#eadfd8',
      })
      .setOrigin(0, 0.5)
      .setDepth(2);

    const pill = this.add.graphics().setDepth(2);
    pill.fillStyle(0xfff4d6, 1);
    pill.fillRoundedRect(790, 72, 190, 44, 14);
    pill.lineStyle(2, 0xefd48a, 1);
    pill.strokeRoundedRect(790, 72, 190, 44, 14);
    drawCoinIcon(pill, 814, 94, 11);

    this.coinText = this.add
      .text(834, 94, '0', {
        fontFamily: HUD_FONT,
        fontSize: '21px',
        fontStyle: 'bold',
        color: '#8a5a00',
      })
      .setOrigin(0, 0.5)
      .setDepth(3);

    createButton(this, 1062, 94, 'Закрыть', () => this.close(), {
      width: 130,
      height: 44,
      fontSize: 17,
      color: 0x5b7f8c,
      hoverColor: 0x729aa8,
      depth: 3,
    });

    this.statusText = this.add
      .text(640, 646, '', {
        fontFamily: HUD_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#2e7d32',
      })
      .setOrigin(0.5)
      .setDepth(3);
  }

  refreshCoins() {
    this.coinText.setText(String(Number(this.registry.get('coins')) || 0));
  }

  buildTasks() {
    if (this.tasksRoot) {
      this.tasksRoot.destroy(true);
    }
    this.tasksRoot = this.add.container(0, 0).setDepth(1);

    DAILY_TASKS.forEach((task, index) => {
      this.createTaskCard(task, 240 + index * 160);
    });

    this.refreshCoins();
  }

  createTaskCard(task, y) {
    const save = this.hospital ? this.hospital.saveData : null;
    const progress = Math.min(getTaskProgress(save, task.id), task.target);
    const complete = isTaskComplete(save, task.id);
    const claimed = isTaskClaimed(save, task.id);
    const ratio = task.target > 0 ? progress / task.target : 0;

    const bg = this.add.graphics();
    bg.fillStyle(0x0b1e28, 0.08);
    bg.fillRoundedRect(-CARD_W / 2 + 5, -CARD_H / 2 + 6, CARD_W, CARD_H, 16);
    bg.fillStyle(0xf8fbfc, 1);
    bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 16);
    bg.lineStyle(2, 0xb9d4e0, 1);
    bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 16);
    bg.fillStyle(task.color, 0.95);
    bg.fillCircle(-CARD_W / 2 + 52, -8, 30);

    bg.fillStyle(0xcfdfe8, 1);
    bg.fillRoundedRect(-CARD_W / 2 + 105, 14, 430, 12, 6);
    if (ratio > 0) {
      bg.fillStyle(complete ? 0x4caf50 : task.color, 1);
      bg.fillRoundedRect(-CARD_W / 2 + 105, 14, Math.max(12, 430 * ratio), 12, 6);
    }

    const coin = this.add.graphics();
    drawCoinIcon(coin, -CARD_W / 2 + 596, -10, 11);

    const title = this.add
      .text(-CARD_W / 2 + 100, -CARD_H / 2 + 22, task.title, {
        fontFamily: HUD_FONT,
        fontSize: '21px',
        fontStyle: 'bold',
        color: '#24444f',
      })
      .setOrigin(0, 0);

    const description = this.add
      .text(-CARD_W / 2 + 100, -CARD_H / 2 + 54, task.description, {
        fontFamily: HUD_FONT,
        fontSize: '14px',
        color: '#6b8e99',
        wordWrap: { width: 520 },
      })
      .setOrigin(0, 0);

    const progressText = this.add
      .text(-CARD_W / 2 + 535, -CARD_H / 2 + 30, `${progress} / ${task.target}`, {
        fontFamily: HUD_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
        color: complete ? '#2e7d32' : '#5b7f8c',
      })
      .setOrigin(1, 0);

    const reward = this.add
      .text(-CARD_W / 2 + 616, -10, `+${task.reward}`, {
        fontFamily: HUD_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#8a5a00',
      })
      .setOrigin(0, 0.5);

    let label = 'В процессе';
    let color = 0x9e9e9e;
    let disabled = true;

    if (claimed) {
      label = 'Получено';
    } else if (complete) {
      label = 'Забрать';
      color = 0x3f9b4a;
      disabled = false;
    }

    const button = createButton(
      this,
      CARD_W / 2 - 100,
      12,
      label,
      () => this.claim(task),
      {
        width: 170,
        height: 46,
        fontSize: 17,
        color,
        hoverColor: 0x55b963,
        disabled,
      },
    );

    const container = this.add.container(640, y);
    container.add([bg, coin, title, description, progressText, reward, button]);
    this.tasksRoot.add(container);
  }

  claim(task) {
    if (!this.hospital || !this.hospital.claimTask) {
      return;
    }

    const reward = this.hospital.claimTask(task.id);
    if (reward > 0) {
      this.statusText.setText(`Задание выполнено: +${reward} монет`);
      this.statusText.setColor('#2e7d32');
      this.buildTasks();
    }
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
    this.tasksRoot = null;
  }
}
