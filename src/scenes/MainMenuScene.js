import { button, UI_FILES, text } from '../ui/IsoUi.js';
import { queueIsoAssets, isoKey, anchorOf } from '../iso/isoAssets.js';
import { openDialog } from '../ui/Dialog.js';
import { loadIsoSave, clearIsoSave } from '../systems/IsoSave.js';
import { migrateLegacyOnce } from '../systems/migrateV1.js';

const W = 1280;
const H = 720;

// Главное меню v0.2: «Играть» (или «Продолжить»), «Новая игра». Боковой версии здесь нет.
export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  preload() {
    // Экран загрузки: игра подтягивает около 56 PNG (5-6 МБ), без индикатора экран пустой.
    this.cameras.main.setBackgroundColor('#10222e');
    this.add.text(W / 2, H / 2 - 34, 'Загрузка…', {
      fontFamily: 'Arial, "Segoe UI", sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
    const frame = this.add.rectangle(W / 2, H / 2 + 12, 420, 20, 0x1c3d4d).setStrokeStyle(2, 0x4fb3a5);
    const fill = this.add.rectangle(W / 2 - 208, H / 2 + 12, 4, 12, 0x35c4a0).setOrigin(0, 0.5);
    this.onProgress = (value) => fill.setSize(Math.max(4, 416 * value), 12);
    this.load.on('progress', this.onProgress);
    this.events.once('shutdown', () => this.load.off('progress', this.onProgress));
    frame.setDepth(0);
    queueIsoAssets(this, UI_FILES);
  }

  create() {
    this.children.removeAll(true);
    this.migration = migrateLegacyOnce();
    const saved = loadIsoSave();
    this.hasGame = !!(saved && saved.player);
    this.confirming = false;

    this.drawBackground();
    text(this, W / 2, 150, 'Больница', {
      size: 92, color: '#ffffff', bold: true, stroke: '#2f7f95', strokeThickness: 10, origin: [0.5, 0.5],
    });
    text(this, W / 2, 232, 'изометрический симулятор больницы', {
      size: 28, color: '#cfe6ef', origin: [0.5, 0.5],
    });

    button(this, W / 2, 330, this.hasGame ? 'Продолжить' : 'Играть', () => this.play(), {
      width: 380, height: 78, fontSize: 34, variant: 'green',
    });
    if (this.hasGame) {
      this.newGameButton = button(this, W / 2, 430, 'Новая игра', () => this.askNewGame(), {
        width: 380, height: 78, fontSize: 30, variant: 'blue',
      });
    }
    if (this.migration.migrated) {
      text(this, W / 2, 500, 'Сохранение старой версии перенесено', {
        size: 20, color: '#dff3ff', origin: [0.5, 0.5],
      });
    }
    button(this, 1160, 668, 'Об игре', () => this.openAbout(), {
      width: 170, height: 52, fontSize: 20, variant: 'gray', depth: 20,
    });
    text(this, W / 2, 20, 'Игра для развлечения, не медицинский совет', {
      size: 18, color: '#cfe6ef', origin: [0.5, 0.5],
    });
    this.cameras.main.fadeIn(300, 16, 34, 46);
  }

  drawBackground() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x2c6a7f, 0x2c6a7f, 0x10222e, 0x10222e, 1);
    g.fillRect(0, 0, W, H);
    // Пол холла внизу и мебель из игры: меню показывает ту же графику, что и больница.
    g.fillStyle(0x0b1c26, 0.5);
    g.fillRect(0, 520, W, H - 520);
    const put = (name, x, y, scale = 0.62) => {
      if (!this.textures.exists(isoKey(name))) {
        return;
      }
      this.add.image(x, y, isoKey(name)).setOrigin(0.5, anchorOf(this, name)).setScale(scale).setDepth(2);
    };
    put('plant_big', 120, 640);
    put('hall_sofa', 300, 660);
    put('reception_desk', 520, 600);
    put('staff_nurse', 690, 690, 1.15);
    put('staff_doctor', 800, 700, 1.25);
    put('water_cooler', 950, 650);
    put('waiting_sofa', 1100, 665);
    put('plant_big', 1200, 640);
    // Красные кресты по бокам заголовка.
    g.fillStyle(0xe53935, 1);
    [W / 2 - 330, W / 2 + 330].forEach((cx) => {
      g.fillRoundedRect(cx - 28, 122, 56, 56, 12);
    });
    g.fillStyle(0xffffff, 1);
    [W / 2 - 330, W / 2 + 330].forEach((cx) => {
      g.fillRect(cx - 6, 130, 12, 40);
      g.fillRect(cx - 20, 144, 40, 12);
    });
  }

  openAbout() {
    openDialog(this, {
      title: 'Об игре',
      subtitle: 'Больница v0.2',
      text: 'Игра создана для развлечения и не является медицинским советом.\n\n'
        + 'Принимайте пациентов, ставьте диагнозы, лечите их в мини-играх, '
        + 'стройте кабинеты и нанимайте персонал.\n\n'
        + 'Старая боковая версия: добавьте ?legacy=1 к адресу страницы.',
      buttons: [{ label: 'Понятно' }],
    });
  }

  play() {
    this.scene.start(this.hasGame ? 'IsoHospitalScene' : 'IsoCreatorScene');
  }

  /** Двойное нажатие: первое просит подтвердить, чтобы не стереть прогресс случайно. */
  askNewGame() {
    if (!this.confirming) {
      this.confirming = true;
      this.confirmText = text(this, W / 2, 500, 'Прогресс будет удалён. Нажмите ещё раз.', {
        size: 20, color: '#ffd2cf', origin: [0.5, 0.5],
      }).setDepth(30);
      this.time.delayedCall(3500, () => {
        this.confirming = false;
        if (this.confirmText) {
          this.confirmText.destroy();
          this.confirmText = null;
        }
      });
      return;
    }
    clearIsoSave();
    this.scene.start('IsoCreatorScene');
  }
}
