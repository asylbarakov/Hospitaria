// Сетка пола (этап 19): тонкие изометрические линии поверх пола, под мебелью.
// Включается в настройках игры, чтобы новичок видел тайлы для строительства.

import { tileToScreen } from './IsoMath.js';

const GRID_COLOR = 0x1f6f7a;
const GRID_ALPHA = 0.45;

const worldGrid = {
  /** Рисует один Graphics на весь пол: 1472 тайла, но одна перерисовка. */
  buildGridOverlay() {
    if (this.gridOverlay) {
      return this.gridOverlay;
    }
    const g = this.scene.add.graphics().setDepth(1);
    g.lineStyle(2, GRID_COLOR, GRID_ALPHA);
    const { cols, rows } = this.grid;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const top = tileToScreen(x, y);
        const right = tileToScreen(x + 1, y);
        const bottom = tileToScreen(x + 1, y + 1);
        const left = tileToScreen(x, y + 1);
        // Верхнее и левое ребро: соседние ромбы не дублируют линии.
        g.lineBetween(top.x, top.y, right.x, right.y);
        g.lineBetween(top.x, top.y, left.x, left.y);
        if (y === rows - 1) {
          g.lineBetween(left.x, left.y, bottom.x, bottom.y);
        }
        if (x === cols - 1) {
          g.lineBetween(right.x, right.y, bottom.x, bottom.y);
        }
      }
    }
    g.setVisible(!!this.gridVisible);
    this.gridOverlay = g;
    return g;
  },

  setGridVisible(visible) {
    this.gridVisible = !!visible;
    if (!this.gridOverlay) {
      this.buildGridOverlay();
    }
    this.gridOverlay.setVisible(this.gridVisible);
  },
};

export default worldGrid;
