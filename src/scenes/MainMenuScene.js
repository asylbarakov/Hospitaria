import { button, UI_FILES, text } from '../ui/IsoUi.js';
import { queueIsoAssets } from '../iso/isoAssets.js';
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
    queueIsoAssets(this, UI_FILES);
  }

  create() {
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

    button(this, W / 2, 380, this.hasGame ? 'Продолжить' : 'Играть', () => this.play(), {
      width: 380, height: 78, fontSize: 34, variant: 'green',
    });
    if (this.hasGame) {
      this.newGameButton = button(this, W / 2, 480, 'Новая игра', () => this.askNewGame(), {
        width: 380, height: 78, fontSize: 30, variant: 'blue',
      });
    }
    if (this.migration.migrated) {
      text(this, W / 2, 580, 'Сохранение старой версии перенесено', {
        size: 20, color: '#dff3ff', origin: [0.5, 0.5],
      });
    }
    text(this, W / 2, 690, 'Игра для развлечения, не медицинский совет', {
      size: 18, color: '#cfe6ef', origin: [0.5, 0.5],
    });
    this.cameras.main.fadeIn(300, 16, 34, 46);
  }

  drawBackground() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x1c3d4d, 0x1c3d4d, 0x10222e, 0x10222e, 1);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0xe53935, 1);
    g.fillRoundedRect(W / 2 - 300, 110, 56, 56, 12);
    g.fillRoundedRect(W / 2 + 244, 110, 56, 56, 12);
    g.fillStyle(0xffffff, 1);
    [W / 2 - 272, W / 2 + 272].forEach((cx) => {
      g.fillRect(cx - 6, 118, 12, 40);
      g.fillRect(cx - 20, 132, 40, 12);
    });
  }

  play() {
    this.scene.start(this.hasGame ? 'IsoHospitalScene' : 'IsoCreatorScene');
  }

  /** Двойное нажатие: первое просит подтвердить, чтобы не стереть прогресс случайно. */
  askNewGame() {
    if (!this.confirming) {
      this.confirming = true;
      this.confirmText = text(this, W / 2, 545, 'Прогресс будет удалён. Нажмите ещё раз.', {
        size: 20, color: '#ffd2cf', origin: [0.5, 0.5],
      });
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
