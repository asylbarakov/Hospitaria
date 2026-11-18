import { isBehind } from './IsoDepth.js';
import { tileToScreen } from './IsoMath.js';

// Замки закрытых кабинетов и прозрачность стен перед актёрами. Методы подмешиваются в IsoWorld.

const FADE_ALPHA = 0.32;
const FADE_RADIUS = 3; // тайлов: дальше стены не проверяем
const BODY_OFFSET = 70; // px выше ног: примерная середина тела
const LOCK_LIFT = 70; // px над полом: замок парит в центре закрытого кабинета

// Табличек над дверями больше нет: название кабинета показывает верхняя панель,
// а закрытый кабинет помечен замком в центре комнаты.
const worldVisuals = {
  /** По одному скрытому замку на кабинет; applyRoomLocks показывает замки закрытых. */
  buildLockBadges() {
    (this.layout.ROOMS || []).forEach((room) => {
      if (room.kind !== 'room') {
        return;
      }
      const p = tileToScreen(room.x + room.w / 2, room.y + room.h / 2);
      const badge = this.makeLockBadge();
      badge.setPosition(p.x, p.y - LOCK_LIFT).setDepth(8000).setVisible(false);
      this.lockBadges.set(room.id, badge);
    });
  },

  /** Золотой замок на тёмной круглой плашке (рисуется кодом, без картинок). */
  makeLockBadge() {
    const g = this.scene.add.graphics();
    g.fillStyle(0x10222e, 0.55);
    g.fillCircle(0, 0, 34);
    g.lineStyle(3, 0xf2c14e, 0.9);
    g.strokeCircle(0, 0, 34);
    g.lineStyle(6, 0xf2c14e, 1);
    g.beginPath();
    g.arc(0, -8, 11, Math.PI, 0, false);
    g.strokePath();
    g.fillStyle(0xf2c14e, 1);
    g.fillRoundedRect(-16, -8, 32, 26, 6);
    g.fillStyle(0x6b4a12, 1);
    g.fillCircle(0, 3, 4);
    g.fillRect(-1.5, 3, 3, 8);
    return g;
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
