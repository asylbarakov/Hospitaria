// Ручка сворачивания боковых кнопок HUD (вид). Состояние и правила в sideDockModel.js.
// Кнопки на 50% прозрачны; свёрнутая панель оставляет только узкую ручку у края экрана.

import { DockModel, SIDE_BUTTON_ALPHA } from './sideDockModel.js';

const FONT = 'Arial, "Segoe UI", sans-serif';
const HANDLE_W = 34;
const HANDLE_H = 92;
const HANDLE_Y = 275; // середина колонки кнопок (44..506)
const OPEN_X = 1073; // слева от колонки кнопок (1090..1270)
const CLOSED_X = 1280 - HANDLE_W / 2; // у правого края экрана
const HANDLE_ALPHA = 0.7;

export default class SideDock {
  /**
   * @param {Phaser.Scene} hud сцена HUD: у неё есть buttons[] и rects[] (только боковые)
   * @param {{collapsed?:boolean, onToggle?:(collapsed:boolean)=>void}} options
   */
  constructor(hud, options = {}) {
    this.hud = hud;
    this.model = new DockModel({ collapsed: options.collapsed, onChange: options.onToggle });
    // Боковые кнопки: половинная прозрачность и пометка для сворачивания.
    hud.buttons.filter((entry) => !entry.inPanel).forEach((entry) => {
      entry.side = true;
      entry.container.setAlpha(SIDE_BUTTON_ALPHA);
    });

    this.bg = hud.add.graphics();
    this.arrow = hud.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5);
    this.root = hud.add.container(0, HANDLE_Y, [this.bg, this.arrow]).setDepth(12).setAlpha(HANDLE_ALPHA);
    const zone = hud.add.zone(0, 0, HANDLE_W + 10, HANDLE_H + 10).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.toggle());
    zone.on('pointerover', () => this.root.setAlpha(1));
    zone.on('pointerout', () => this.root.setAlpha(HANDLE_ALPHA));
    this.root.add(zone);
    this.draw();
  }

  get collapsed() {
    return this.model.collapsed;
  }

  buttonsShown() {
    return this.model.buttonsShown();
  }

  toggle() {
    this.model.toggle();
    this.draw();
  }

  /** Шаг обучения с боковой кнопкой раскрывает панель на время шага. */
  expandForTutorial(needsButtons) {
    if (this.model.expandForTutorial(needsButtons)) {
      this.draw();
    }
  }

  draw() {
    const collapsed = this.model.collapsed;
    this.root.setX(collapsed ? CLOSED_X : OPEN_X);
    this.arrow.setText(collapsed ? '◀' : '▶');
    this.bg.clear();
    this.bg.fillStyle(0x1f6f8b, 1);
    this.bg.fillRoundedRect(-HANDLE_W / 2, -HANDLE_H / 2, HANDLE_W, HANDLE_H, 10);
    this.bg.lineStyle(2, 0xffffff, 0.55);
    this.bg.strokeRoundedRect(-HANDLE_W / 2, -HANDLE_H / 2, HANDLE_W, HANDLE_H, 10);
  }

  handleRect() {
    return { x: this.root.x - HANDLE_W / 2 - 6, y: HANDLE_Y - HANDLE_H / 2 - 6, w: HANDLE_W + 12, h: HANDLE_H + 12 };
  }

  /** Лежит ли указатель на ручке или на видимых боковых кнопках. */
  isOver(pointer, sideRects) {
    return this.model.rects(sideRects, this.handleRect())
      .some((r) => pointer.x >= r.x && pointer.x <= r.x + r.w && pointer.y >= r.y && pointer.y <= r.y + r.h);
  }
}
