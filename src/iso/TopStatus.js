// Верхняя строка HUD изометрии (этап 17): монеты, кристаллы, долг, уровень,
// полоска опыта, часы игрового дня, репутация и техническая строка.
// Вынесено из IsoHospitalHud, чтобы сцена HUD оставалась короткой.

import { isoKey } from './isoAssets.js';

const FONT = 'Arial, "Segoe UI", sans-serif';
const STROKE = '#10222e';

function label(scene, x, y, size, color, bold = false) {
  return scene.add.text(x, y, '', {
    fontFamily: FONT,
    fontSize: `${size}px`,
    fontStyle: bold ? 'bold' : 'normal',
    color,
    stroke: STROKE,
    strokeThickness: 4,
  }).setDepth(10);
}

export default class TopStatus {
  constructor(scene) {
    this.scene = scene;
    this.root = scene.add.container(0, 0).setDepth(10);

    this.coinIcon = scene.add.image(40, 34, isoKey('icons_icon_coin')).setScale(0.26);
    this.coinText = label(scene, 70, 34, 28, '#fff3b0', true).setOrigin(0, 0.5);
    this.crystalIcon = scene.add.image(200, 34, isoKey('icons_icon_crystal')).setScale(0.2);
    this.crystalText = label(scene, 222, 34, 22, '#9fe7ff', true).setOrigin(0, 0.5);
    this.debtText = label(scene, 330, 34, 18, '#ff8a80', true);
    this.levelText = label(scene, 16, 64, 18, '#ffffff', true);
    this.xpText = label(scene, 146, 86, 13, '#dff3ff');
    this.clockText = label(scene, 16, 102, 17, '#ffe082', true);
    this.reputationText = label(scene, 16, 126, 15, '#b9f6ca', true);
    this.info = label(scene, 16, 148, 13, '#dff3ff');

    this.bar = scene.add.graphics().setDepth(10);
    this.root.add([
      this.coinIcon, this.coinText, this.crystalIcon, this.crystalText, this.debtText,
      this.levelText, this.bar, this.xpText, this.clockText, this.reputationText, this.info,
    ]);
  }

  setVisible(visible) {
    this.root.setVisible(visible);
  }

  paintBar(progress) {
    const g = this.bar;
    g.clear();
    g.fillStyle(0x0b2833, 0.9);
    g.fillRoundedRect(16, 86, 120, 9, 4);
    if (!progress || !progress.need) {
      return;
    }
    const ratio = Math.max(0, Math.min(1, progress.into / progress.need));
    if (ratio > 0) {
      g.fillStyle(0x4fb3a5, 1);
      g.fillRoundedRect(16, 86, Math.max(9, 120 * ratio), 9, 4);
    }
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
    this.paintBar(progress);

    this.clockText.setText(state.economy ? state.economy.label : '');
    this.reputationText.setText(`Репутация ${state.reputation} · Пациентов ${state.patients}`);
    this.info.setText(`Зум ${state.zoom.toFixed(2)}  FPS ${state.fps}  Тайл ${state.tile.x}, ${state.tile.y}`);
  }
}
