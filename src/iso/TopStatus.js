// Верхняя строка HUD изометрии (этап 19): PNG-плашка ui_panel, монеты,
// кристаллы, долг, уровень, опыт, часы дня и репутация. Без код-рисованных рамок.

import { isoKey } from './isoAssets.js';
import { panel, progressBar, text } from '../ui/IsoUi.js';

export default class TopStatus {
  constructor(scene) {
    this.scene = scene;
    this.root = scene.add.container(0, 0).setDepth(10);

    const bg = panel(scene, 8, 8, 1064, 74);
    // Плашка ui_panel декоративна по краям: содержимое живёт в 110..970.
    this.coinIcon = scene.add.image(120, 45, isoKey('icons_icon_coin')).setScale(0.18);
    this.coinText = text(scene, 144, 45, '0', { size: 24, bold: true, origin: [0, 0.5] });
    this.crystalIcon = scene.add.image(238, 45, isoKey('icons_icon_crystal')).setScale(0.15);
    this.crystalText = text(scene, 260, 45, '0', { size: 20, bold: true, origin: [0, 0.5] });
    this.debtText = text(scene, 318, 45, '', { size: 16, bold: true, color: '#b5423c', origin: [0, 0.5] });
    this.levelText = text(scene, 380, 45, 'Ур. 1', { size: 18, bold: true, origin: [0, 0.5] });
    this.xpText = text(scene, 574, 45, '', { size: 16, origin: [0, 0.5] });
    this.clockText = text(scene, 660, 45, '', { size: 19, bold: true, color: '#9a5b12', origin: [0, 0.5] });
    this.reputationText = text(scene, 810, 45, '', { size: 17, bold: true, color: '#276d4d', origin: [0, 0.5] });
    this.info = text(scene, 905, 45, '', { size: 16, color: '#4d7b8a', origin: [0, 0.5] });

    this.xp = progressBar(scene, 436, 35, 130, 20);
    this.root.add([
      bg, this.coinIcon, this.coinText, this.crystalIcon, this.crystalText, this.debtText,
      this.levelText, this.xp.root, this.xpText, this.clockText, this.reputationText, this.info,
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
    this.info.setText(`FPS ${state.fps}`);
  }
}
