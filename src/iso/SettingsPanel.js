// Окно настроек (этап 19): громкость, обучение, сетка, упрощённая графика и сброс.
// Рисуется PNG-китом IsoUi, изменения сразу уходят в сцену больницы.

import { button, panel, text, windowFrame } from '../ui/IsoUi.js';
import { withVolume } from '../systems/Settings.js';

const W = 760;
const H = 620;
const LEFT = 292;
const RIGHT = 830;

export default class SettingsPanel {
  /**
   * @param {Phaser.Scene} scene
   * @param {{getSettings:Function, onChange:Function, onRestartTutorial:Function,
   *   onReset:Function, onClose:Function}} hooks
   */
  constructor(scene, hooks) {
    this.scene = scene;
    this.hooks = hooks;
    this.resetArmedUntil = 0;
    this.root = scene.add.container(0, 0).setDepth(30).setVisible(false);

    const shade = scene.add
      .rectangle(640, 360, 1280, 720, 0x06141d, 0.72)
      .setInteractive();
    shade.on('pointerup', () => this.hide());
    this.root.add(shade);

    this.root.add(windowFrame(scene, 640, 360, W, H));
    this.root.add(panel(scene, 640 - W / 2 + 24, 100, W - 48, 68));
    this.root.add(text(scene, 640, 128, 'Настройки', {
      size: 36, bold: true, origin: [0.5, 0.5],
    }));

    this.volumeText = text(scene, 750, 250, '70%', {
      size: 28, bold: true, origin: [0.5, 0.5],
    });
    this.root.add([
      text(scene, LEFT, 250, 'Громкость звуков', { size: 26, origin: [0, 0.5] }),
      this.volumeText,
    ]);
    this.root.add(button(scene, 660, 250, '−', () => this.changeVolume(-0.1), {
      width: 72, height: 62, fontSize: 32, variant: 'blue',
    }));
    this.root.add(button(scene, 850, 250, '+', () => this.changeVolume(0.1), {
      width: 72, height: 62, fontSize: 32, variant: 'blue',
    }));

    this.root.add(text(scene, LEFT, 325, 'Обучение новичка', { size: 26, origin: [0, 0.5] }));
    this.root.add(button(scene, RIGHT, 325, 'Пройти заново', () => {
      this.hooks.onRestartTutorial();
      this.hide();
    }, { width: 270, height: 62, fontSize: 24, variant: 'purple' }));

    this.root.add(text(scene, LEFT, 400, 'Сетка пола', { size: 26, origin: [0, 0.5] }));
    this.gridButton = button(scene, RIGHT, 400, 'Сетка', () => this.toggle('grid'), {
      width: 270, height: 62, fontSize: 24, variant: 'green',
    });
    this.root.add(this.gridButton);

    this.root.add(text(scene, LEFT, 475, 'Графика', { size: 26, origin: [0, 0.5] }));
    this.graphicsButton = button(scene, RIGHT, 475, 'Графика', () => this.toggle('simpleGraphics'), {
      width: 270, height: 62, fontSize: 24, variant: 'blue',
    });
    this.root.add(this.graphicsButton);

    this.resetButton = button(scene, RIGHT, 550, 'Сбросить прогресс', () => this.confirmReset(), {
      width: 270, height: 62, fontSize: 24, variant: 'red',
    });
    this.root.add([
      text(scene, LEFT, 550, 'Прогресс больницы', { size: 26, origin: [0, 0.5] }),
      this.resetButton,
    ]);

    this.root.add(button(scene, 640, 625, 'Закрыть', () => this.hide(), {
      width: 260, height: 62, fontSize: 26, variant: 'gray',
    }));
  }

  get visible() {
    return this.root.visible;
  }

  show() {
    this.resetArmedUntil = 0;
    this.refresh();
    this.root.setVisible(true);
  }

  hide() {
    this.resetArmedUntil = 0;
    this.root.setVisible(false);
    if (this.hooks.onClose) {
      this.hooks.onClose();
    }
  }

  toggle(field) {
    const current = this.hooks.getSettings();
    const next = { ...current, [field]: !current[field] };
    this.hooks.onChange(next);
    this.refresh();
  }

  changeVolume(delta) {
    const current = this.hooks.getSettings();
    this.hooks.onChange(withVolume(current, current.volume + delta));
    this.refresh();
  }

  confirmReset() {
    const now = this.scene.time.now;
    if (this.resetArmedUntil > now) {
      this.hide();
      this.hooks.onReset();
      return;
    }
    this.resetArmedUntil = now + 3500;
    this.refresh();
  }

  refresh() {
    const settings = this.hooks.getSettings();
    this.volumeText.setText(`${Math.round(settings.volume * 100)}%`);
    this.gridButton.label.setText(settings.grid ? 'Сетка: вкл' : 'Сетка: выкл');
    this.graphicsButton.label.setText(settings.simpleGraphics ? 'Упрощённая' : 'Обычная');
    const armed = this.resetArmedUntil > this.scene.time.now;
    this.resetButton.label.setText(armed ? 'Точно сбросить?' : 'Сбросить прогресс');
    this.resetButton.setActiveState(armed);
  }
}
