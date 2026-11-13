import { createButton } from '../ui/Button.js';

const FONT = 'Arial, "Segoe UI", sans-serif';

// HUD тестовой сцены: подсказка, координаты тайла под курсором, зум, FPS.
// Живёт отдельной сценой, чтобы не масштабироваться вместе с камерой мира.
export default class IsoHudScene extends Phaser.Scene {
  constructor() {
    super('IsoHudScene');
  }

  create() {
    this.uiRects = [];

    this.info = this.add
      .text(16, 14, '', {
        fontFamily: FONT, fontSize: '20px', color: '#ffffff', stroke: '#10222e', strokeThickness: 4,
      })
      .setDepth(10);

    this.add
      .text(
        640,
        700,
        'Тап по тайлу: идти   |   Перетаскивание: камера   |   Колесо / щипок: зум   |   G: сетка   |   Esc: меню',
        {
          fontFamily: FONT, fontSize: '17px', color: '#dff3ff', stroke: '#10222e', strokeThickness: 4,
        },
      )
      .setOrigin(0.5)
      .setDepth(10);

    this.addButton(1180, 40, 'Меню', () => this.world().exitToMenu(), 0x5b7f8c, 0x729aa8);
    this.addButton(1180, 100, 'Сетка (G)', () => this.world().toggleDebug(), 0x2f80c9, 0x4a9be0);
    this.addButton(1180, 160, 'Зум 100%', () => this.world().iso.setZoom(1), 0x3f9b4a, 0x55b963);
  }

  addButton(x, y, label, onClick, color, hoverColor) {
    const width = 180;
    const height = 46;
    createButton(this, x, y, label, onClick, { width, height, fontSize: 20, color, hoverColor, depth: 10 });
    this.uiRects.push({ x: x - width / 2 - 6, y: y - height / 2 - 6, w: width + 12, h: height + 14 });
  }

  world() {
    return this.scene.get('IsoTestScene');
  }

  /** Лежит ли указатель на кнопке HUD (чтобы клик по кнопке не двигал персонажа и камеру). */
  isOverUi(pointer) {
    return (this.uiRects || []).some((r) => pointer.x >= r.x && pointer.x <= r.x + r.w && pointer.y >= r.y && pointer.y <= r.y + r.h);
  }

  update() {
    const info = this.world().debugInfo;
    if (!info) {
      return;
    }
    this.info.setText([
      `Тайл под курсором: ${info.tile.x}, ${info.tile.y}`,
      `Зум: ${info.zoom.toFixed(2)}   FPS: ${info.fps}`,
      `Объектов в сортировке: ${info.objects}${info.walking ? '   (идёт)' : ''}`,
      `Сверка проекции с Phaser: ${info.projDelta.toFixed(1)} px (в покое ~0)`,
    ]);
  }
}
