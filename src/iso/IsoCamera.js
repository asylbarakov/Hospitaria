// Камера изометрического мира: перетаскивание, зум колёсиком и щипком, границы мира.
//
// Phaser-камера увеличивает вокруг своего центра, поэтому перевод экран -> мир считаем
// сами по формуле worldX = scrollX + w/2 + (screenX - w/2) / zoom. Она не зависит от
// матриц, которые Phaser обновляет только при отрисовке, и работает сразу после setZoom.

const DRAG_THRESHOLD = 8; // px экрана: меньше этого сдвига это ещё тап, а не перетаскивание
const TAP_MAX_MS = 450;

export default class IsoCamera {
  /**
   * @param {Phaser.Scene} scene
   * @param {{bounds:{x:number,y:number,w:number,h:number}, minZoom?:number, maxZoom?:number,
   *   margin?:number, onTap?:(pointer:Phaser.Input.Pointer)=>void, canStartDrag?:(pointer)=>boolean}} options
   */
  constructor(scene, options) {
    this.scene = scene;
    this.cam = scene.cameras.main;
    this.bounds = options.bounds;
    this.minZoom = options.minZoom ?? 0.45;
    this.maxZoom = options.maxZoom ?? 2;
    this.margin = options.margin ?? 160;
    this.onTap = options.onTap || null;
    this.canStartDrag = options.canStartDrag || (() => true);

    this.dragPointer = null;
    this.dragStart = { x: 0, y: 0, time: 0 };
    this.dragLast = { x: 0, y: 0 };
    this.moved = false;
    this.pinch = null;

    const input = scene.input;
    // Для щипка нужен второй палец; указатели создаются один раз на весь Phaser.Game.
    if (!input.pointer2) {
      input.addPointer(1);
    }

    this.handlers = {
      pointerdown: (p) => this.handleDown(p),
      pointermove: (p) => this.handleMove(p),
      pointerup: (p) => this.handleUp(p),
      pointerupoutside: (p) => this.handleUp(p),
      wheel: (p, over, dx, dy) => this.handleWheel(p, dy),
    };
    Object.entries(this.handlers).forEach(([name, fn]) => input.on(name, fn));
  }

  destroy() {
    Object.entries(this.handlers).forEach(([name, fn]) => this.scene.input.off(name, fn));
    this.handlers = {};
  }

  // ---- преобразования -------------------------------------------------------------

  screenToWorld(px, py) {
    const cam = this.cam;
    return {
      x: cam.scrollX + cam.width / 2 + (px - cam.width / 2) / cam.zoom,
      y: cam.scrollY + cam.height / 2 + (py - cam.height / 2) / cam.zoom,
    };
  }

  worldToScreen(wx, wy) {
    const cam = this.cam;
    return {
      x: (wx - cam.scrollX - cam.width / 2) * cam.zoom + cam.width / 2,
      y: (wy - cam.scrollY - cam.height / 2) * cam.zoom + cam.height / 2,
    };
  }

  centerOn(wx, wy) {
    const cam = this.cam;
    cam.scrollX = wx - cam.width / 2;
    cam.scrollY = wy - cam.height / 2;
    this.clamp();
  }

  setZoom(zoom) {
    this.cam.setZoom(Math.min(this.maxZoom, Math.max(this.minZoom, zoom)));
    this.clamp();
  }

  /** Зум так, чтобы точка мира под (px, py) осталась на месте. */
  zoomAt(px, py, zoom) {
    const cam = this.cam;
    const before = this.screenToWorld(px, py);
    cam.setZoom(Math.min(this.maxZoom, Math.max(this.minZoom, zoom)));
    const after = this.screenToWorld(px, py);
    cam.scrollX += before.x - after.x;
    cam.scrollY += before.y - after.y;
    this.clamp();
  }

  panBy(screenDx, screenDy) {
    this.cam.scrollX -= screenDx / this.cam.zoom;
    this.cam.scrollY -= screenDy / this.cam.zoom;
    this.clamp();
  }

  /** Не даёт камере уйти за границы мира (плюс небольшой запас). */
  clamp() {
    const cam = this.cam;
    const viewW = cam.width / cam.zoom;
    const viewH = cam.height / cam.zoom;
    const b = this.bounds;
    const fit = (left, lo, hi) => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, left)));

    let left = cam.scrollX + cam.width / 2 - viewW / 2;
    let top = cam.scrollY + cam.height / 2 - viewH / 2;
    left = fit(left, b.x - this.margin, b.x + b.w + this.margin - viewW);
    top = fit(top, b.y - this.margin, b.y + b.h + this.margin - viewH);
    cam.scrollX = left - cam.width / 2 + viewW / 2;
    cam.scrollY = top - cam.height / 2 + viewH / 2;
  }

  // ---- ввод -----------------------------------------------------------------------

  touchesDown() {
    const input = this.scene.input;
    return [input.pointer1, input.pointer2].filter((p) => p && p.isDown);
  }

  handleDown(pointer) {
    const touches = this.touchesDown();
    if (touches.length >= 2) {
      const [a, b] = touches;
      this.pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      this.dragPointer = null;
      this.moved = true;
      return;
    }
    if (!this.canStartDrag(pointer)) {
      this.dragPointer = null;
      return;
    }
    this.dragPointer = pointer;
    this.dragStart = { x: pointer.x, y: pointer.y, time: this.scene.time.now };
    this.dragLast = { x: pointer.x, y: pointer.y };
    this.moved = false;
  }

  handleMove(pointer) {
    if (this.pinch) {
      const touches = this.touchesDown();
      if (touches.length >= 2) {
        const [a, b] = touches;
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        if (this.pinch.dist > 0 && dist > 0) {
          this.zoomAt(mx, my, this.cam.zoom * (dist / this.pinch.dist));
        }
        this.panBy(mx - this.pinch.mx, my - this.pinch.my);
        this.pinch = { dist, mx, my };
      }
      return;
    }

    if (!this.dragPointer || pointer !== this.dragPointer || !pointer.isDown) {
      return;
    }
    if (!this.moved) {
      const far = Math.hypot(pointer.x - this.dragStart.x, pointer.y - this.dragStart.y);
      if (far < DRAG_THRESHOLD) {
        return;
      }
      this.moved = true;
      this.dragLast = { x: pointer.x, y: pointer.y };
      return;
    }
    this.panBy(pointer.x - this.dragLast.x, pointer.y - this.dragLast.y);
    this.dragLast = { x: pointer.x, y: pointer.y };
  }

  handleUp(pointer) {
    if (this.pinch) {
      if (this.touchesDown().length < 2) {
        this.pinch = null;
      }
      this.dragPointer = null;
      return;
    }
    if (this.dragPointer && pointer === this.dragPointer) {
      const quick = this.scene.time.now - this.dragStart.time <= TAP_MAX_MS;
      if (!this.moved && quick && this.onTap) {
        this.onTap(pointer);
      }
      this.dragPointer = null;
    }
  }

  handleWheel(pointer, deltaY) {
    this.zoomAt(pointer.x, pointer.y, this.cam.zoom * Math.exp(-deltaY * 0.0012));
  }
}
