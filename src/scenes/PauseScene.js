import { createButton } from '../ui/Button.js';
import { openDialog } from '../ui/Dialog.js';
import { HUD_FONT } from '../ui/hudDrawing.js';
import { playError } from '../systems/Sound.js';
import Save from '../systems/Save.js';

const W = 1280;
const H = 720;
const PANEL_X = 350;
const PANEL_Y = 130;
const PANEL_W = 580;
const PANEL_H = 470;

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  init() {
    this.closed = false;
    this.confirmDialog = null;
  }

  create() {
    this.registry.set('uiModal', true);

    this.drawPanel();
    this.buildButtons();

    this.input.keyboard.on('keydown-ESC', () => {
      if (this.confirmDialog) {
        this.confirmDialog.close();
        return;
      }
      this.resumeGame();
    });
    this.events.once('shutdown', () => this.handleShutdown());
  }

  drawPanel() {
    const g = this.add.graphics().setDepth(100);

    g.fillStyle(0x10222e, 0.62);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0x0b1e28, 0.28);
    g.fillRoundedRect(PANEL_X + 8, PANEL_Y + 10, PANEL_W, PANEL_H, 26);
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 26);
    g.fillStyle(0x3f8fb0, 1);
    g.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, 86, {
      tl: 26,
      tr: 26,
      bl: 0,
      br: 0,
    });
    g.fillStyle(0x0b1e28, 0.14);
    g.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, 86, {
      tl: 26,
      tr: 26,
      bl: 0,
      br: 0,
    });
    g.lineStyle(3, 0x8fb7c7, 1);
    g.strokeRoundedRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 26);

    this.add
      .text(W / 2, PANEL_Y + 42, 'Пауза', {
        fontFamily: HUD_FONT,
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(101);

    this.add
      .text(W / 2, PANEL_Y + 116, 'Больница ждёт вашего возвращения', {
        fontFamily: HUD_FONT,
        fontSize: '17px',
        color: '#5b7f8c',
      })
      .setOrigin(0.5)
      .setDepth(101);
  }

  buildButtons() {
    createButton(this, W / 2, PANEL_Y + 188, 'Продолжить', () => this.resumeGame(), {
      width: 340,
      height: 62,
      fontSize: 25,
      color: 0x3f9b4a,
      hoverColor: 0x55b963,
      depth: 102,
    });

    createButton(this, W / 2, PANEL_Y + 268, 'В главное меню', () => this.returnToMenu(), {
      width: 340,
      height: 62,
      fontSize: 23,
      color: 0x3f8fb0,
      hoverColor: 0x57a8c9,
      depth: 102,
    });

    createButton(this, W / 2, PANEL_Y + 348, 'Сбросить сохранение', () => this.askReset(), {
      width: 340,
      height: 56,
      fontSize: 20,
      color: 0x8a6d5b,
      hoverColor: 0xa88a76,
      depth: 102,
    });

    this.add
      .text(W / 2, PANEL_Y + 420, 'Игра для развлечения, не медицинский совет', {
        fontFamily: HUD_FONT,
        fontSize: '14px',
        color: '#8aa6b0',
      })
      .setOrigin(0.5)
      .setDepth(101);
  }

  askReset() {
    if (this.confirmDialog) {
      return;
    }

    playError();
    this.confirmDialog = openDialog(this, {
      title: 'Сбросить сохранение?',
      subtitle: 'Это действие нельзя отменить',
      text: [
        'Весь прогресс будет удалён: уровень, монеты,',
        'одежда, мебель и ежедневные задания.',
        '',
        'После сброса игра начнётся с создания персонажа.',
      ].join('\n'),
      accent: 0xc07a4a,
      buttons: [
        {
          label: 'Отмена',
          color: 0x5b7f8c,
          hoverColor: 0x729aa8,
        },
        {
          label: 'Да, сбросить',
          color: 0xc0524a,
          hoverColor: 0xd06a62,
          onClick: () => this.resetSave(),
        },
      ],
      onClose: () => {
        this.confirmDialog = null;
      },
    });
  }

  resetSave() {
    Save.clear();
    this.goToMenu();
  }

  resumeGame() {
    if (this.closed) {
      return;
    }
    this.closed = true;

    if (this.scene.isPaused('HospitalScene')) {
      this.scene.resume('HospitalScene');
    }
    if (this.scene.isPaused('UIScene')) {
      this.scene.resume('UIScene');
    }
    this.registry.set('uiModal', false);
    this.scene.stop();
  }

  returnToMenu() {
    if (this.closed) {
      return;
    }
    this.goToMenu();
  }

  goToMenu() {
    this.closed = true;
    this.registry.set('uiModal', false);
    this.scene.stop('UIScene');
    this.scene.stop('HospitalScene');
    this.scene.start('MenuScene');
  }

  handleShutdown() {
    this.confirmDialog = null;
    this.registry.set('uiModal', false);
  }
}
