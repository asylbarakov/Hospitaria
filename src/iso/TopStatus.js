// Верхняя строка HUD изометрии (этап 19): PNG-плашка ui_panel, монеты,
// кристаллы, долг, уровень, опыт, часы дня, репутация и где сейчас игрок. Без код-рисованных рамок.

import { isoKey } from './isoAssets.js';
import { panel, progressBar, text } from '../ui/IsoUi.js';

export default class TopStatus {
  constructor(scene) {
    this.scene = scene;
    this.root = scene.add.container(0, 0).setDepth(10);

    const bg = panel(scene, 8, 8, 1064, 74);
    // Плашка ui_panel декоративна по краям: содержимое живёт в 110..970.
    this.coinIcon = scene.add.image(118, 45, isoKey('icons_icon_coin')).setScale(0.2);
    this.coinText = text(scene, 142, 45, '0', { size: 28, bold: true, origin: [0, 0.5] });
    this.crystalIcon = scene.add.image(246, 45, isoKey('icons_icon_crystal')).setScale(0.17);
    this.crystalText = text(scene, 268, 45, '0', { size: 24, bold: true, origin: [0, 0.5] });
    this.debtText = text(scene, 326, 45, '', { size: 19, bold: true, color: '#b5423c', origin: [0, 0.5] });
    this.levelText = text(scene, 410, 45, 'Ур. 1', { size: 22, bold: true, origin: [0, 0.5] });
    this.xpText = text(scene, 600, 45, '', { size: 17, origin: [0, 0.5] });
    this.clockText = text(scene, 696, 45, '', { size: 21, bold: true, color: '#9a5b12', origin: [0, 0.5] });
    this.reputationText = text(scene, 808, 45, '', { size: 20, bold: true, color: '#276d4d', origin: [0, 0.5] });
    // Где сейчас игрок: кабинет, зона, коридор или улица (FPS в панели больше нет).
    this.pin = scene.add.graphics();
    this.pin.fillStyle(0x2f8f7b, 1).fillCircle(0, 0, 7);
    this.pin.fillStyle(0xffffff, 1).fillCircle(0, 0, 2.5);
    this.pin.setPosition(912, 45);
    this.locationText = text(scene, 926, 45, '', { size: 20, bold: true, color: '#1f6f8b', origin: [0, 0.5] });

    this.xp = progressBar(scene, 486, 34, 104, 22);
    this.root.add([
      bg, this.coinIcon, this.coinText, this.crystalIcon, this.crystalText, this.debtText,
      this.levelText, this.xp.root, this.xpText, this.clockText, this.reputationText, this.pin, this.locationText,
    ]);
  }

  setVisible(visible) {
    this.root.setVisible(visible);
  }

  update(state) {
    this.coinText.setText(String(state.coins));
    this.crystalText.setText(String(state.crystals || 0));
    const debt = Number(state.debt) || 0;
    this.debtText.setText(debt > 0 ? `Долг ${debt}` : '');

    const level = Number(state.level) || 1;
    const progress = state.levelProgress;
    this.levelText.setText(`Ур. ${level}`);
    this.xpText.setText(progress ? `${progress.into}/${progress.need} XP` : '');
    this.xp.setProgress(progress && progress.need ? progress.into / progress.need : 0);

    this.clockText.setText(state.economy ? state.economy.label : '');
    this.reputationText.setText(`Реп. ${state.reputation}`);
    this.setLocation(state.location || '');
  }

  /** Название места, сжатое по ширине, если не помещается до края панели. */
  setLocation(name) {
    if (this.locationText.text !== name) {
      this.locationText.setText(name).setScale(1);
      const max = 104;
      if (this.locationText.width > max) {
        this.locationText.setScale(max / this.locationText.width);
      }
    }
  }
}
