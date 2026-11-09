import { createButton } from '../ui/Button.js';
import Save from '../systems/Save.js';
import Avatar from '../systems/Avatar.js';
import { DEFAULT_AVATAR, normalizeAvatar } from '../data/avatarOptions.js';

const W = 1280;
const H = 720;
const FLOOR_Y = 560;

export default class HospitalScene extends Phaser.Scene {
  constructor() {
    super('HospitalScene');
  }

  create() {
    this.saveData = Save.load();
    const player = this.saveData && this.saveData.player ? this.saveData.player : null;
    this.playerName = player && player.name ? player.name : 'Игрок';

    this.drawRoom();
    this.drawPlayer(player);
    this.drawBackButton();

    this.add
      .text(W / 2, 95, 'Здесь будет больница', {
        fontFamily: 'Arial, "Segoe UI", sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#3d7d8f',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(W / 2, 138, 'Познакомьтесь — это вы', {
        fontFamily: 'Arial, "Segoe UI", sans-serif',
        fontSize: '20px',
        color: '#4d7b8a',
      })
      .setOrigin(0.5);

    this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));
  }

  drawRoom() {
    const g = this.add.graphics();

    // Стена.
    g.fillGradientStyle(0xd7f0fa, 0xd7f0fa, 0xf3fbfe, 0xf3fbfe, 1);
    g.fillRect(0, 0, W, FLOOR_Y);

    // Плинтус.
    g.fillStyle(0xc4dde7, 1);
    g.fillRect(0, FLOOR_Y - 18, W, 18);

    // Пол в клетку.
    g.fillStyle(0xf0e6d2, 1);
    g.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
    g.lineStyle(2, 0xdccfb4, 1);
    for (let x = 0; x <= W; x += 80) {
      g.lineBetween(x, FLOOR_Y, x, H);
    }
    for (let y = FLOOR_Y + 40; y <= H; y += 40) {
      g.lineBetween(0, y, W, y);
    }

    this.drawWindow(g, 150, 130);
    this.drawWindow(g, 940, 130);
    this.drawPlant(g, 1120, FLOOR_Y);
    this.drawBench(g, 880, FLOOR_Y);
  }

  drawWindow(g, x, y) {
    g.fillStyle(0x9fd8ef, 1);
    g.fillRoundedRect(x, y, 190, 150, 14);
    g.lineStyle(8, 0xffffff, 1);
    g.strokeRoundedRect(x, y, 190, 150, 14);
    g.lineBetween(x + 95, y, x + 95, y + 150);
    g.lineBetween(x, y + 75, x + 190, y + 75);
  }

  drawPlant(g, x, floorY) {
    g.fillStyle(0xc47a4a, 1);
    g.fillRoundedRect(x - 44, floorY - 78, 88, 78, 10);
    g.fillStyle(0x6aa84f, 1);
    g.fillCircle(x, floorY - 112, 40);
    g.fillCircle(x - 36, floorY - 92, 30);
    g.fillCircle(x + 36, floorY - 92, 30);
    g.fillStyle(0x4f8f3a, 1);
    g.fillCircle(x, floorY - 140, 30);
  }

  drawBench(g, x, floorY) {
    g.fillStyle(0x8d6e63, 1);
    g.fillRoundedRect(x - 110, floorY - 120, 220, 26, 8);
    g.fillRoundedRect(x - 110, floorY - 78, 220, 20, 8);
    g.fillStyle(0x5d4037, 1);
    g.fillRect(x - 96, floorY - 94, 12, 94);
    g.fillRect(x + 84, floorY - 94, 12, 94);
  }

  drawPlayer(player) {
    const config = normalizeAvatar(player || DEFAULT_AVATAR);
    new Avatar(this, W / 2, FLOOR_Y, config, { scale: 1.15 });

    this.add
      .text(W / 2, 224, this.playerName, {
        fontFamily: 'Arial, "Segoe UI", sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#2f5d6b',
        stroke: '#ffffff',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  drawBackButton() {
    createButton(this, 118, 62, 'В меню', () => this.scene.start('MenuScene'), {
      width: 180,
      height: 56,
      fontSize: 22,
      color: 0x5b7f8c,
      hoverColor: 0x729aa8,
      depth: 20,
    });

    if (this.saveData) {
      this.add
        .text(W - 24, 24, 'Сохранение загружено', {
          fontFamily: 'Arial, "Segoe UI", sans-serif',
          fontSize: '18px',
          color: '#6b8e99',
        })
        .setOrigin(1, 0)
        .setDepth(20);
    }
  }
}
