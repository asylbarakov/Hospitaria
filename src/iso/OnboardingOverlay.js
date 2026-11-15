// Подсказки обучения (этап 19): карточка внизу, пульсирующее кольцо и стрелка у цели.
// Не хранит состояние: все шаги приходят из Onboarding, позицию цели ищет HUD.

import { button, panel, text } from '../ui/IsoUi.js';

const CARD_X = 250;
const CARD_Y = 96;
const CARD_W = 780;
const CARD_H = 108;

export default class OnboardingOverlay {
  /**
   * @param {Phaser.Scene} scene
   * @param {{onboarding:object, getTarget:Function, onSkip:Function}} options
   */
  constructor(scene, options) {
    this.scene = scene;
    this.onboarding = options.onboarding;
    this.getTarget = options.getTarget;
    this.root = scene.add.container(0, 0).setDepth(18).setVisible(false);

    this.root.add(panel(scene, CARD_X, CARD_Y, CARD_W, CARD_H));
    // Текст сдвинут от левого декора ui_panel, иначе орнамент бьётся с буквами.
    this.title = text(scene, CARD_X + 118, CARD_Y + 14, '', {
      size: 16, bold: true, color: '#2f8f7b',
    });
    this.body = text(scene, CARD_X + 118, CARD_Y + 44, '', {
      size: 20, bold: true, wrap: 460,
    });
    this.root.add([this.title, this.body]);
    this.root.add(button(scene, CARD_X + CARD_W - 100, CARD_Y + CARD_H / 2, 'Пропустить', () => {
      if (options.onSkip) {
        options.onSkip();
      }
    }, { width: 170, height: 56, fontSize: 16, variant: 'gray' }));

    this.pointer = scene.add.graphics().setDepth(17);
    this.step = -1;
  }

  /** Пересчитывает текст шага и позицию кольца. Вызывать каждый кадр HUD. */
  update() {
    if (!this.onboarding || !this.onboarding.active) {
      this.root.setVisible(false);
      this.pointer.setVisible(false);
      return;
    }
    const step = this.onboarding.current;
    if (!step) {
      this.root.setVisible(false);
      this.pointer.setVisible(false);
      return;
    }
    this.root.setVisible(true);
    if (this.step !== this.onboarding.index) {
      this.step = this.onboarding.index;
      this.title.setText(`${step.title} · Обучение`);
      this.body.setText(step.text);
    }
    const target = this.getTarget ? this.getTarget(step) : null;
    this.paintPointer(target);
  }

  paintPointer(target) {
    const g = this.pointer;
    g.clear();
    if (!target) {
      g.setVisible(false);
      return;
    }
    g.setVisible(true);
    g.lineStyle(4, 0xffd54f, 0.9);
    g.strokeCircle(target.x, target.y, 34);
    g.lineStyle(2, 0xffffff, 0.6);
    g.strokeCircle(target.x, target.y, 44);
    // Стрелка над целью (или под ней, если цель у верхнего края).
    const above = target.y > 160;
    const tipY = above ? target.y - 46 : target.y + 46;
    const baseY = above ? tipY - 26 : tipY + 26;
    g.fillStyle(0xffd54f, 1);
    g.fillTriangle(
      target.x, tipY,
      target.x - 15, baseY,
      target.x + 15, baseY,
    );
  }

  clear() {
    this.root.setVisible(false);
    this.pointer.setVisible(false);
  }
}
