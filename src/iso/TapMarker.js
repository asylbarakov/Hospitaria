// Красный ромб на тайле, куда нельзя пройти (этап 13, вынесено из IsoHospitalScene).

import { tileToScreen } from './IsoMath.js';

const FLASH_MS = 350;
const COLOR = 0xe53935;
const ALPHA = 0.55;

export default class TapMarker {
  /** @param {Phaser.Scene} scene */
  constructor(scene) {
    this.graphics = scene.add.graphics().setDepth(91);
    this.x = null;
    this.y = null;
    this.until = 0;
  }

  /** Подсветить тайл на FLASH_MS от текущего времени сцены. */
  flash(x, y, now) {
    this.x = x;
    this.y = y;
    this.until = now + FLASH_MS;
  }

  update(now) {
    this.graphics.clear();
    if (this.x === null || this.until <= now) {
      return;
    }
    const points = [
      tileToScreen(this.x, this.y),
      tileToScreen(this.x + 1, this.y),
      tileToScreen(this.x + 1, this.y + 1),
      tileToScreen(this.x, this.y + 1),
    ];
    this.graphics.fillStyle(COLOR, ALPHA);
    this.graphics.beginPath();
    this.graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      this.graphics.lineTo(points[i].x, points[i].y);
    }
    this.graphics.closePath();
    this.graphics.fillPath();
  }
}
