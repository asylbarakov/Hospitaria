import { plate } from '../ui/IsoUi.js';

const FONT = 'Arial, "Segoe UI", sans-serif';
const DEPTH = 60; // выше всех панелей HUD (20-30) и карточки обучения (18)
const MAX_WIDTH = 760;

// Короткое сообщение: тёмная плашка с белым текстом по центру под верхней панелью.
export default class Toast {
  constructor(scene) {
    this.scene = scene;
    this.shown = '';
    this.root = scene.add.container(640, 108).setDepth(DEPTH).setVisible(false);
    this.label = scene.add
      .text(0, 0, '', {
        fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#ffffff', align: 'center',
        wordWrap: { width: MAX_WIDTH - 44 },
      })
      .setOrigin(0.5);
    this.plate = null;
    this.root.add(this.label);
  }

  /** @param {string} text пустая строка прячет плашку; y положение по вертикали */
  set(text, y) {
    this.root.setY(y);
    if (text === this.shown) {
      return;
    }
    this.shown = text;
    if (!text) {
      this.root.setVisible(false);
      return;
    }
    this.label.setText(text);
    const width = Math.min(MAX_WIDTH, this.label.width + 44);
    const height = this.label.height + 22;
    if (this.plate) {
      this.plate.destroy();
    }
    this.plate = plate(this.scene, 0, 0, width, height, { tint: 0x123240 });
    this.root.addAt(this.plate, 0);
    this.root.setVisible(true);
  }
}
