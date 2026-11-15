import { isBehind } from './IsoDepth.js';
import { anchorOf, isoKey } from './isoAssets.js';
import { tileToScreen } from './IsoMath.js';

// Таблички над дверями и прозрачность стен перед актёрами. Методы подмешиваются в IsoWorld.

const FONT = 'Arial, "Segoe UI", sans-serif';
const FADE_ALPHA = 0.32;
const FADE_RADIUS = 3; // тайлов: дальше стены не проверяем
const BODY_OFFSET = 70; // px выше ног: примерная середина тела
const SIGN_SCALE = 0.7;

const worldVisuals = {
  buildSigns(signs) {
    this.signSprites = [];
    signs.forEach((sign) => {
      const p = tileToScreen(sign.x, sign.y);
      const board = this.scene.add.image(0, 0, isoKey('sign_blank')).setOrigin(0.5, anchorOf(this.scene, 'sign_blank'));
      board.setScale(SIGN_SCALE);
      const label = this.scene.add
        .text(0, -board.displayHeight * 0.33, sign.text, {
          fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#ffffff', stroke: '#0f6b57', strokeThickness: 3,
        })
        .setOrigin(0.5);
      const maxWidth = board.displayWidth * 0.66;
      if (label.width > maxWidth) {
        label.setScale(maxWidth / label.width);
      }
      const lock = this.makeLockIcon(board);
      const holder = this.scene.add.container(p.x, p.y - sign.lift, [board, label, lock]);
      holder.setDepth(8000);
      this.signSprites.push(holder);
      this.signs.push({ roomId: sign.id, holder, lock });
    });
  },

  /** Маленький нарисованный замок на табличке закрытого кабинета. */
  makeLockIcon(board) {
    const g = this.scene.add.graphics();
    const x = board.displayWidth * 0.34;
    const y = -board.displayHeight * 0.05;
    g.fillStyle(0x2b1b12, 0.35);
    g.fillRoundedRect(x - 10, y - 7, 24, 20, 5);
    g.fillStyle(0xf2c14e, 1);
    g.fillRoundedRect(x - 12, y - 8, 24, 20, 5);
    g.lineStyle(4, 0xf2c14e, 1);
    g.beginPath();
    g.arc(x, y - 8, 8, Math.PI, 0, false);
    g.strokePath();
    g.fillStyle(0x6b4a12, 1);
    g.fillCircle(x, y + 1, 2.5);
    return g.setVisible(false);
  },

  /**
   * Делает полупрозрачными куски стен, которые закрывают актёров.
   * @param {Array<{pos:{x:number,y:number}, box:object}>} actors
   */
  updateWallFade(actors) {
    if (this.wallFadeEnabled === false) {
      return;
    }
    const list = Array.isArray(actors) ? actors : [];
    const walls = this.wallSprites;
    for (let w = 0; w < walls.length; w += 1) {
      const wall = walls[w];
      let fade = false;
      for (let i = 0; i < list.length; i += 1) {
        const actor = list[i];
        if (this.wallFar(wall, actor.pos)) {
          continue;
        }
        const point = actor.screen || tileToScreen(actor.pos.x, actor.pos.y);
        const px = point.x;
        const py = point.y - BODY_OFFSET;
        const r = wall.rect;
        const covers = px >= r.x - 20 && px <= r.x + r.w + 20 && py >= r.y && py <= r.y + r.h;
        const inFront = isBehind(actor.box, wall.box) && !isBehind(wall.box, actor.box);
        if (covers && inFront) {
          fade = true;
          break;
        }
      }
      const target = fade ? FADE_ALPHA : 1;
      const alpha = wall.sprite.alpha + (target - wall.sprite.alpha) * 0.25;
      wall.sprite.setAlpha(Math.abs(alpha - target) < 0.01 ? target : alpha);
    }
  },

  /** Стена слишком далеко от точки в тайлах, чтобы закрывать актёра. */
  wallFar(wall, pos) {
    const dx = Math.max(wall.box.minX - pos.x, 0, pos.x - wall.box.maxX);
    const dy = Math.max(wall.box.minY - pos.y, 0, pos.y - wall.box.maxY);
    return dx * dx + dy * dy > FADE_RADIUS * FADE_RADIUS;
  },

  /** Упрощённая графика: стены больше не становятся прозрачными (экономит кадры). */
  setWallFadeEnabled(value) {
    this.wallFadeEnabled = !!value;
    if (!this.wallFadeEnabled) {
      this.wallSprites.forEach((wall) => wall.sprite.setAlpha(1));
    }
  },
};

export default worldVisuals;
