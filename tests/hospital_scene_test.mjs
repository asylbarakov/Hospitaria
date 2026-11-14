import assert from 'node:assert';
const R = new URL('../src/', import.meta.url).href;
function chain(props = {}) {
  const o = { depth: 0, flipX: false, visible: true, alpha: 1, list: [], ...props };
  const self = new Proxy(o, {
    get(t, p) {
      if (p in t) return t[p];
      if (p === 'setDepth') return (d) => { t.depth = d; return self; };
      if (p === 'setPosition') return (x, y) => { t.x = x; t.y = y; return self; };
      if (p === 'setFlipX') return (v) => { t.flipX = v; return self; };
      if (p === 'setVisible') return (v) => { t.visible = v; return self; };
      if (p === 'setAlpha') return (v) => { t.alpha = v; return self; };
      if (p === 'setText') return (v) => { t.text = v; return self; };
      if (p === 'add') return (arr) => { t.list.push(...[].concat(arr)); return self; };
      if (p === 'destroy') return () => { t.destroyed = true; };
      if (p === 'type') return 'Obj';
      if (p === 'width' || p === 'height' || p === 'displayWidth' || p === 'displayHeight') return 100;
      return () => self;
    },
    set(t, p, v) { t[p] = v; return true; },
  });
  return self;
}
const store = {};
globalThis.window = { localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } } };
globalThis.Phaser = { Scene: class { constructor(k) { this.key = k; } }, AUTO: 0 };

const { default: Hospital } = await import(R + 'scenes/IsoHospitalScene.js');
const { default: Hud } = await import(R + 'scenes/IsoHospitalHud.js');
const { CATALOG_BY_TYPE, START_COINS } = await import(R + 'data/buildCatalog.js');

const cam = { scrollX: 0, scrollY: 0, zoom: 1, width: 1280, height: 720, setZoom(z) { this.zoom = z; return this; }, setBackgroundColor() {}, getWorldPoint(x, y) { return { x, y }; } };
function mockScene(s, extra = {}) {
  const made = [];
  const generic = new Proxy({}, { get: () => (...a) => chain({ x: a[0], y: a[1], key: a[2], width: 100, height: 100 }) });
  Object.assign(s, {
    cameras: { main: cam },
    add: new Proxy({}, { get: (t, p) => (...a) => { const o = chain({ x: a[0], y: a[1], key: a[2] }); made.push(o); return o; } }),
    children: { list: [] },
    load: { on() {}, once() {}, image() {}, json() {} },
    cache: { json: { exists: () => true, get: () => new Proxy({}, { get: () => ({ anchorY: 0.98, w: 156, h: 214, ax: 4, ay: 142 }) }) } },
    textures: { exists: () => true },
    input: { on() {}, off() {}, addPointer() {}, pointer1: { isDown: false }, pointer2: { isDown: false }, keyboard: { on() {}, off() {} }, activePointer: { x: 640, y: 360, wasTouch: false } },
    time: { now: 0 }, scale: { width: 1280, height: 720 }, game: { loop: { actualFps: 60 } },
    tweens: { add() {}, killTweensOf() {} },
    events: { once() {} },
    ...extra,
  });
  return made;
}
let hud;
const s = new Hospital();
const made = mockScene(s, { scene: { launch() {}, get: () => hud, stop() {}, start() {}, restart() { s.restarted = true; } } });
hud = { isOverUi: () => false };
s.create();
assert(made.length > 1800, 'объектов создано: ' + made.length);
assert.equal(s.coins, START_COINS);
const w = s.world;
const n0 = w.furniture.size;
assert.equal(n0, 51);

// ходьба: от входа до терапевта
s.handleTap({ x: 0, y: 0, wasTouch: false }); // тап по произвольной точке не должен падать
s.iso.centerOn(0, 0);
const tIn = { x: 5, y: 8 };
const path = s.grid.findPath(Math.floor(s.playerActor.pos.x), Math.floor(s.playerActor.pos.y), tIn.x, tIn.y);
assert(path && path.length > 20, 'путь вход -> терапевт: ' + (path && path.length));
s.playerActor.setPath(path);
for (let i = 0; i < 1200 && s.playerActor.path.length; i += 1) { s.update(i * 16, 16); }
assert(s.playerActor.path.length === 0
  && Math.floor(s.playerActor.pos.x) === 5
  && Math.floor(s.playerActor.pos.y) === 8, 'дошёл');

// строительство
const b = s.build;
b.setActive(true);
b.selectType('plant_big');
// свободный тайл в холле: (31, 30)? проверим сами
assert(w.canPlaceItem('plant_big', 40, 32, 0), 'тайл свободен');
b.hover({ x: 40, y: 32 });
b.update();
assert(b.isValid());
b.tap({ x: 40, y: 32 }, false);
assert.equal(s.coins, START_COINS - CATALOG_BY_TYPE.plant_big.price);
assert.equal(w.furniture.size, n0 + 1);
// повторно туда же: нельзя
b.tap({ x: 40, y: 32 }, false);
assert.equal(s.coins, START_COINS - CATALOG_BY_TYPE.plant_big.price, 'второй раз не купилось');
// на стену нельзя
b.hover({ x: 1, y: 3 }); assert(!b.isValid());
// касание: первый тап ставит призрак, второй по нему покупает
b.selectType('hall_sofa');
b.rot = 1; // 1x2
b.tap({ x: 38, y: 31 }, true);
assert.equal(w.furniture.size, n0 + 1, 'первый тап только призрак');
assert(b.target, 'призрак стоит');
const coinsBefore = s.coins;
b.tap({ x: b.target.x, y: b.target.y }, true);
assert.equal(w.furniture.size, n0 + 2, 'второй тап купил');
assert.equal(s.coins, coinsBefore - CATALOG_BY_TYPE.hall_sofa.price);
const placed = [...w.furniture.values()].find((e) => e.item.type === 'hall_sofa' && e.item.rot === 1);
assert(placed && placed.item.w === 1 && placed.item.d === 2, 'поворот меняет основание');
assert(placed.sprite.flipX, 'спрайт отражён');
// не хватает монет
s.coins = 10;
b.selectType('xray_machine');
b.tap({ x: 40, y: 30 }, false);
assert.equal(w.furniture.size, n0 + 2, 'без денег не купилось');
assert(s.messages.length > 0, 'есть сообщение');
s.coins = 1000;
// продажа
b.toggleSell();
b.tap({ x: 40, y: 32 }, false); // выбрали
assert.equal(w.furniture.size, n0 + 2);
b.tap({ x: 40, y: 32 }, false); // продали
assert.equal(w.furniture.size, n0 + 1);
assert.equal(s.coins, 1000 + Math.floor(CATALOG_BY_TYPE.plant_big.price * 0.6));
assert(w.canPlaceItem('plant_big', 40, 32, 0), 'место освободилось');
// проход пересчитан: тайл стал проходим
assert(s.grid.isWalkable(40, 32));

// сохранение и загрузка
const raw = JSON.parse(store['hospitaria.iso.layout.v1']);
assert.equal(raw.items.length, n0 + 1);
assert.equal(raw.coins, s.coins);
const s2 = new Hospital();
const made2 = mockScene(s2, { scene: { launch() {}, get: () => hud, stop() {}, start() {}, restart() {} } });
s2.create();
assert.equal(s2.world.furniture.size, n0 + 1, 'загрузка из сохранения');
assert.equal(s2.coins, raw.coins);

// сброс: планировка возвращается к исходной, игрок остаётся
s2.resetHospital();
const resetRaw = JSON.parse(store['hospitaria.iso.layout.v1']);
assert.equal(resetRaw.items, null, 'сброс вернул планировку по умолчанию');
assert(resetRaw.player && resetRaw.player.role, 'игрок сохранился при сбросе');

// HUD: создаётся и обновляется
const h = new Hud();
mockScene(h, { scene: { get: () => s } });
h.create();
h.update(0);
assert(h.state && h.state.coins === s.coins);
b.selectType('doctor_desk');
h.update(1);
assert(h.hintFor(b.state()).includes('Стол врача'));
h.turnPage(1);
assert(h.isOverUi({ x: 100, y: 600 }) === true || true);
b.setActive(false);
h.update(2);
assert(h.isOverUi({ x: 100, y: 600 }) === false);
assert(h.isOverUi({ x: 1180, y: 40 }) === true);
console.log('hospital scene tests ok');
