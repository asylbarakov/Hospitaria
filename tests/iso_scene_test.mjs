// Прогон IsoTestScene + IsoCamera на упрощённой модели Phaser: проверяем логику без браузера.
import assert from 'node:assert';
const R = new URL('../src/', import.meta.url).href;

function chain(props = {}) {
  const o = { ...props, depth: 0, flipX: false, visible: true };
  const self = new Proxy(o, {
    get(t, p) {
      if (p in t) return t[p];
      if (p === 'setDepth') return (d) => { t.depth = d; return self; };
      if (p === 'setPosition') return (x, y) => { t.x = x; t.y = y; return self; };
      if (p === 'setFlipX') return (v) => { t.flipX = v; return self; };
      if (p === 'setVisible') return (v) => { t.visible = v; return self; };
      if (p === 'setScale') return (s) => { t.scale = s; return self; };
      if (p === 'destroy') return () => {};
      if (p === 'type') return 'Obj';
      return () => self;
    },
    set(t, p, v) { t[p] = v; return true; },
  });
  return self;
}
class FakeScene {
  constructor(key) { this.key = key; }
}
globalThis.Phaser = { Scene: FakeScene, AUTO: 0 };

const { default: IsoTestScene } = await import(R + 'scenes/IsoTestScene.js');
const M = await import(R + 'iso/IsoMath.js');

const handlers = {};
const cam = { scrollX: 0, scrollY: 0, zoom: 1, width: 1280, height: 720, setZoom(z) { this.zoom = z; return this; }, setBackgroundColor() {}, getWorldPoint(x, y) { return { x: this.scrollX + this.width/2 + (x - this.width/2)/this.zoom, y: this.scrollY + this.height/2 + (y - this.height/2)/this.zoom }; } };
const s = new IsoTestScene();
const made = [];
const hudStub = { isOverUi: () => false, uiRects: [] };
Object.assign(s, {
  cameras: { main: cam },
  add: {
    text: () => chain({ type: 'Text' }), image: (x, y, key) => { const o = chain({ x, y, key, originY: 0 }); made.push(o); return o; },
    ellipse: (x, y) => chain({ x, y }), graphics: () => chain({}),
  },
  children: { list: [] },
  load: { on() {}, once() {}, image() {}, json() {} },
  cache: { json: { exists: () => true, get: () => new Proxy({}, { get: () => ({ anchorY: 0.98 }) }) } },
  textures: { exists: () => true },
  input: {
    on: (n, f) => { handlers[n] = f; }, off() {}, addPointer() {},
    pointer1: { isDown: false, x: 0, y: 0 }, pointer2: { isDown: false, x: 0, y: 0 },
    keyboard: { on() {}, off() {} },
    activePointer: { x: 640, y: 360 },
  },
  time: { now: 0 },
  scale: { width: 1280, height: 720 },
  game: { loop: { actualFps: 60 } },
  scene: { launch() {}, get: () => hudStub, stop() {}, start() {} },
  events: { once() {} },
});
s.create();
assert(made.length >= 400 + 10, 'пол и мебель созданы: ' + made.length);

const iso = s.iso;
const near = (a, b, e = 1e-6) => Math.abs(a - b) < e;

// 1. Клик по любому тайлу даёт верные координаты при разных зуме и сдвигах камеры
for (const zoom of [0.45, 0.8, 1, 1.7, 2]) {
  iso.setZoom(zoom);
  for (const [px, py] of [[100, 100], [640, 360], [1200, 650], [10, 700], [900, 40]]) {
    const w = iso.screenToWorld(px, py);
    const back = iso.worldToScreen(w.x, w.y);
    assert(near(back.x, px) && near(back.y, py), `обратное преобразование zoom=${zoom}`);
    const t = M.screenToTile(w.x, w.y);
    const sp = M.tileToScreen(t.x, t.y);
    assert(near(sp.x, w.x) && near(sp.y, w.y));
  }
}
// 2. Зум в точку: точка мира под курсором не уезжает
iso.setZoom(1); iso.centerOn(0, 600);
for (const [px, py, z] of [[300, 200, 1.5], [900, 500, 0.7], [640, 360, 2], [50, 50, 1.2]]) {
  const before = iso.screenToWorld(px, py);
  iso.zoomAt(px, py, z);
  const after = iso.screenToWorld(px, py);
  // из-за границ камеры сдвиг возможен; проверяем когда зажатия нет
  const b = iso.bounds; const vw = cam.width / cam.zoom, vh = cam.height / cam.zoom;
  const left = cam.scrollX + cam.width / 2 - vw / 2;
  const clamped = left <= b.x - iso.margin + 1e-6 || left >= b.x + b.w + iso.margin - vw - 1e-6;
  if (!clamped) assert(near(before.x, after.x, 1e-6) && near(before.y, after.y, 1e-6), `zoomAt (${px},${py})`);
}
// 3. Границы: камера не уходит за мир, зум ограничен
iso.setZoom(1); iso.centerOn(1e6, -1e6);
const vw = cam.width / cam.zoom; const left = cam.scrollX + cam.width / 2 - vw / 2;
assert(left <= iso.bounds.x + iso.bounds.w + iso.margin - vw + 1e-6, 'правая граница');
iso.setZoom(100); assert(cam.zoom === 2); iso.setZoom(0.01); assert(cam.zoom === 0.45);
// на минимальном зуме мир помещается в экран по высоте -> центрируется, не падает
iso.centerOn(0, 500);

// 4. Перетаскивание и тап
iso.setZoom(1); iso.centerOn(0, 500);
const sx0 = cam.scrollX;
const p = { x: 500, y: 300, isDown: true };
handlers.pointerdown(p);
p.x = 503; p.y = 301; handlers.pointermove(p);          // меньше порога -> не drag
assert(cam.scrollX === sx0, 'порог перетаскивания');
p.x = 560; p.y = 330; handlers.pointermove(p);          // превысили порог, но first move только фиксирует
p.x = 600; p.y = 330; handlers.pointermove(p);
assert(cam.scrollX < sx0, 'камера сдвинулась при перетаскивании'); 
let tapped = 0; iso.onTap = () => tapped++;
s.time.now = 100; p.isDown = false; handlers.pointerup(p);
assert(tapped === 0, 'после drag тапа нет');
const q = { x: 700, y: 400, isDown: true }; s.time.now = 1000; handlers.pointerdown(q); s.time.now = 1100; q.isDown = false; handlers.pointerup(q);
assert(tapped === 1, 'короткий клик = тап');
// долгий клик без движения не считается тапом
const l = { x: 700, y: 400, isDown: true }; s.time.now = 2000; handlers.pointerdown(l); s.time.now = 3000; l.isDown = false; handlers.pointerup(l);
assert(tapped === 1, 'долгое удержание не тап');

// 5. Щипок
iso.setZoom(1); iso.centerOn(0, 500);
const a = s.input.pointer1, b = s.input.pointer2;
a.isDown = b.isDown = true; a.x = 540; a.y = 360; b.x = 740; b.y = 360;
handlers.pointerdown(b);
a.x = 440; b.x = 840; handlers.pointermove(a);          // разошлись вдвое -> зум x2
assert(near(cam.zoom, 2, 0.01), 'щипок увеличивает зум: ' + cam.zoom);
a.isDown = b.isDown = false; handlers.pointerup(a); handlers.pointerup(b);
assert(iso.pinch === null);

// 6. Ходьба: тап по свободному тайлу -> персонаж доходит; тап по мебели -> не идёт
iso.setZoom(1); iso.centerOn(0, 500);
const target = { x: 10, y: 3 };
const tp = M.tileCenter(target.x, target.y); const scr = iso.worldToScreen(tp.x, tp.y);
const tile = s.pointerTile({ x: scr.x, y: scr.y });
assert.deepEqual(tile, target, 'pointerTile вернул нужный тайл');
s.handleTap({ x: scr.x, y: scr.y });
assert(s.path.length > 0, 'путь построен');
for (let i = 0; i < 600 && s.path.length; i++) s.update(i * 16, 16);
assert(s.path.length === 0 && near(s.pos.x, 10.5) && near(s.pos.y, 3.5), `дошёл до цели: ${s.pos.x},${s.pos.y}`);
// маршрут не проходит сквозь мебель
const pathBlocked = s.grid.findPath(1, 1, 7, 5);
assert(pathBlocked && pathBlocked.every((t) => s.grid.isWalkable(t.x, t.y)), 'путь вокруг стойки');
// тап по тайлу стойки
const desk = M.tileCenter(7, 3); const ds = iso.worldToScreen(desk.x, desk.y);
const before = s.path.length; s.handleTap({ x: ds.x, y: ds.y });
assert(s.path.length === before && s.blockedFlash, 'клик по мебели отклонён');

// 7. Персонаж обходит стойку: порядок отрисовки корректен всё время
const deskSprite = s.furniture.find((f) => f.item.name === 'reception_desk').sprite;
let bad = 0;
s.pos.x = 3.5; s.pos.y = 3.5; s.path = s.grid.findPath(3, 3, 10, 5) || []; // обход вокруг стойки (6..9, 3..4)
let steps = 0;
for (; steps < 900 && s.path.length; steps++) {
  s.update(steps * 16, 16);
  const { x, y } = s.pos;
  const front = y - 0.2 >= 4 || x - 0.2 >= 9, back = y + 0.2 <= 3 || x + 0.2 <= 6;
  const diag = (x + 0.2 <= 6 && y - 0.2 >= 4) || (x - 0.2 >= 9 && y + 0.2 <= 3);
  if (diag) continue;
  if (front && !(s.walker.depth > deskSprite.depth)) bad++;
  if (back && !(s.walker.depth < deskSprite.depth)) bad++;
}
assert.equal(bad, 0, 'нарушений глубины: ' + bad);
console.log('сцена и камера: все проверки прошли, шагов обхода', steps);
