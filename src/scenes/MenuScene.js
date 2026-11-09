import { createButton } from '../ui/Button.js';
import Save from '../systems/Save.js';

const W = 1280;
const H = 720;

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.drawSky();
    this.drawHospital();
    this.drawTitle();
    this.drawButtons();
  }

  drawSky() {
    const g = this.add.graphics();

    // Небо.
    g.fillGradientStyle(0x8fd3f4, 0x8fd3f4, 0xe6f7ff, 0xe6f7ff, 1);
    g.fillRect(0, 0, W, H);

    // Солнце.
    g.fillStyle(0xffe082, 0.35);
    g.fillCircle(1090, 120, 90);
    g.fillStyle(0xffd54f, 1);
    g.fillCircle(1090, 120, 58);

    // Облака.
    this.drawCloud(g, 210, 150, 1);
    this.drawCloud(g, 470, 95, 0.75);
    this.drawCloud(g, 860, 185, 0.9);

    // Земля.
    g.fillStyle(0x9ccc65, 1);
    g.fillRect(0, 640, W, H - 640);
    g.fillStyle(0x7cb342, 1);
    g.fillRect(0, 640, W, 14);
  }

  drawCloud(g, x, y, scale) {
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(x, y, 42 * scale);
    g.fillCircle(x + 46 * scale, y - 18 * scale, 52 * scale);
    g.fillCircle(x + 100 * scale, y, 40 * scale);
    g.fillRoundedRect(x - 20 * scale, y, 140 * scale, 42 * scale, 20 * scale);
  }

  drawHospital() {
    const g = this.add.graphics();
    const left = 360;
    const right = 920;
    const top = 330;
    const bottom = 645;

    // Корпус.
    g.fillStyle(0x000000, 0.12);
    g.fillRoundedRect(left + 12, top + 14, right - left, bottom - top, 18);
    g.fillStyle(0xf7fbfd, 1);
    g.fillRoundedRect(left, top, right - left, bottom - top, 18);
    g.lineStyle(4, 0xd7e6ee, 1);
    g.strokeRoundedRect(left, top, right - left, bottom - top, 18);

    // Крыша-карниз.
    g.fillStyle(0xe3f1f7, 1);
    g.fillRoundedRect(left - 18, top - 22, right - left + 36, 34, 12);

    // Окна.
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const wx = left + 52 + col * 122;
        const wy = top + 54 + row * 92;
        g.fillStyle(0xbfe3f5, 1);
        g.fillRoundedRect(wx, wy, 86, 64, 8);
        g.lineStyle(3, 0xffffff, 1);
        g.strokeRoundedRect(wx, wy, 86, 64, 8);
      }
    }

    // Вход.
    g.fillStyle(0xcfe8f2, 1);
    g.fillRoundedRect(590, 520, 100, 125, 10);
    g.fillStyle(0x8fb7c7, 1);
    g.fillRoundedRect(604, 548, 72, 97, 8);

    // Вывеска с крестом.
    g.fillStyle(0xffffff, 1);
    g.fillCircle(right - 78, top + 6, 44);
    g.lineStyle(4, 0xe0eef5, 1);
    g.strokeCircle(right - 78, top + 6, 44);
    g.fillStyle(0xe53935, 1);
    g.fillRoundedRect(right - 88, top - 18, 20, 48, 4);
    g.fillRoundedRect(right - 102, top - 4, 48, 20, 4);
  }

  drawTitle() {
    const shadow = this.add
      .text(W / 2 + 4, 124, 'Больница', {
        fontFamily: 'Arial, "Segoe UI", sans-serif',
        fontSize: '92px',
        fontStyle: 'bold',
        color: '#1b4b5a',
      })
      .setOrigin(0.5)
      .setAlpha(0.18);

    const title = this.add
      .text(W / 2, 120, 'Больница', {
        fontFamily: 'Arial, "Segoe UI", sans-serif',
        fontSize: '92px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#2f7f95',
        strokeThickness: 10,
        shadow: { offsetX: 0, offsetY: 6, color: '#1b4b5a', blur: 12, fill: true },
      })
      .setOrigin(0.5);

    this.add
      .text(W / 2, 205, 'симулятор больницы', {
        fontFamily: 'Arial, "Segoe UI", sans-serif',
        fontSize: '30px',
        color: '#2f6274',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: [title, shadow],
      scale: { from: 1, to: 1.03 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  drawButtons() {
    const hasSave = Save.exists();

    createButton(this, W / 2, 445, 'Новая игра', () => this.startNewGame(), {
      width: 380,
      height: 78,
      fontSize: 34,
      color: 0x3f9b4a,
      hoverColor: 0x55b963,
      depth: 10,
    });

    createButton(this, W / 2, 550, 'Продолжить', () => this.continueGame(), {
      width: 380,
      height: 78,
      fontSize: 34,
      color: 0x2f80c9,
      hoverColor: 0x4a9be0,
      disabled: !hasSave,
      depth: 10,
    });

    if (!hasSave) {
      this.add
        .text(W / 2, 612, 'Сохранения пока нет — начните новую игру', {
          fontFamily: 'Arial, "Segoe UI", sans-serif',
          fontSize: '20px',
          color: '#5b7f8c',
        })
        .setOrigin(0.5)
        .setDepth(10);
    }
  }

  startNewGame() {
    Save.save({
      version: 1,
      createdAt: Date.now(),
      player: null,
      coins: 0,
      xp: 0,
      level: 1,
      reputation: 50,
    });
    this.scene.start('HospitalScene');
  }

  continueGame() {
    this.scene.start('HospitalScene');
  }
}

export { W, H };
