// Этап 12: персонажи. Движение по пути, box, удаление из сортировщика,
// производительность сортировки 30 актёров + 382 статичных объекта.
import assert from 'node:assert';
import IsoActor from '../src/iso/IsoActor.js';
import ActorLayer from '../src/iso/ActorLayer.js';
import IsoDepth from '../src/iso/IsoDepth.js';
import * as layout from '../src/data/layout.js';
import { buildLayout } from '../src/iso/layoutBuilder.js';
import { ACTOR_MOTION } from '../src/data/actorConfig.js';

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
      if (p === 'bringToTop') return () => self;
      if (p === 'destroy') return () => { t.destroyed = true; };
      if (p === 'type') return 'Obj';
      if (p === 'width' || p === 'height') return 100;
      return () => self;
    },
    set(t, p, v) { t[p] = v; return true; },
  });
  return self;
}

const anchors = {
  staff_doctor: { anchorY: 0.996 },
  staff_nurse: { anchorY: 0.996 },
  patient_01: { anchorY: 0.996 },
  patient_02: { anchorY: 0.996 },
};

function fakeScene() {
  return {
    add: new Proxy({}, { get: () => (...args) => chain({ x: args[0], y: args[1], key: args[2] }) }),
    cache: { json: { get: () => anchors } },
    textures: { exists: () => true },
  };
}

// 1. Создание и движение по пути до цели.
const scene = fakeScene();
const actor = new IsoActor(scene, { x: 1.5, y: 1.5, sprite: 'staff_doctor', name: 'Тест' });
assert.equal(actor.pos.x, 1.5);
assert.equal(actor.pos.y, 1.5);
let box = actor.box();
assert.equal(box.minX, 1.5 - ACTOR_MOTION.radius);
assert.equal(box.maxY, 1.5 + ACTOR_MOTION.radius);
assert.equal(actor.iconName, null);
assert(actor.root && actor.shadow, 'визуальные объекты созданы');

actor.setPath([{ x: 2, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 2 }]);
for (let i = 0; i < 400 && actor.path.length; i += 1) {
  actor.update(1 / 60);
}
assert.equal(actor.path.length, 0, 'путь пройден');
assert(Math.abs(actor.pos.x - 3.5) < 1e-9, 'пришёл в x=3.5: ' + actor.pos.x);
assert(Math.abs(actor.pos.y - 2.5) < 1e-9, 'пришёл в y=2.5: ' + actor.pos.y);
assert.equal(actor.facing, -1, 'в последнем шаге шёл влево-вниз по экрану');
box = actor.box();
assert(Math.abs(box.maxX - (3.5 + ACTOR_MOTION.radius)) < 1e-9, 'box обновился');
assert.equal(actor.update(1 / 60), false, 'в покое позиция не меняется');
const breatheBefore = actor.breathe;
actor.update(0.2);
assert(actor.breathe !== breatheBefore, 'в покое есть дыхание');

// 2. ActorLayer: регистрация в сортировщике и удаление.
const world = { sorter: new IsoDepth(100) };
const staticObj = { setDepth() {} };
world.sorter.add(staticObj, { minX: 0, maxX: 1, minY: 0, maxY: 1 });
const layer = new ActorLayer(scene, world);
const a1 = layer.spawn({ x: 4.5, y: 3.5, sprite: 'patient_01', name: 'Оля', icon: 'icon_waiting' });
const a2 = layer.spawn({ x: 6.5, y: 3.5, sprite: 'patient_02', name: 'Иван' });
assert.equal(world.sorter.dynamics.length, 2, 'два dynamic в сортировщике');
assert.equal(layer.fadeTargets().length, 2);
assert.equal(a2.spriteName, 'patient_02');
world.sorter.sort();
assert(a1.root.depth > 100 && a2.root.depth > 100, 'актёрам назначена глубина');
a1.setPath([{ x: 5, y: 4 }]);
for (let i = 0; i < 120; i += 1) {
  layer.update(1 / 60);
  world.sorter.sort();
}
assert.equal(layer.remove(a1), true);
assert.equal(world.sorter.dynamics.length, 1, 'актёр удалён из сортировщика');
assert.equal(layer.actors.length, 1);
assert.equal(layer.fadeTargets().length, 1);
assert.equal(a1.root, null, 'спрайт уничтожен');
assert.equal(layer.remove(a1), false, 'повторное удаление безопасно');
layer.clear();
assert.equal(world.sorter.dynamics.length, 0);
assert.equal(layer.fadeTargets().length, 0);

// 3. Производительность: 30 актёров и статичный мир больницы.
const data = buildLayout(layout);
const perfWorld = { sorter: new IsoDepth(100) };
data.pieces.forEach((p) => perfWorld.sorter.add({ setDepth() {} }, p.box));
data.items.forEach((i) => perfWorld.sorter.add({ setDepth() {} }, {
  minX: i.x, maxX: i.x + i.w, minY: i.y, maxY: i.y + i.d,
}));
const statics = perfWorld.sorter.statics.length;
const perfLayer = new ActorLayer(fakeScene(), perfWorld);
for (let i = 0; i < 30; i += 1) {
  const x = 28 + (i % 10) * 1.6;
  const y = 28 + Math.floor(i / 10) * 1.6;
  perfLayer.spawn({ x, y, sprite: 'patient_01', name: `Пациент ${i}`, icon: 'icon_waiting' });
}
perfLayer.update(1 / 60);
perfWorld.sorter.sort(); // первый sort статики не входит в замер
const frames = 120;
const start = performance.now();
for (let i = 0; i < frames; i += 1) {
  perfLayer.update(1 / 60);
  perfWorld.sorter.sort();
}
const avg = (performance.now() - start) / frames;
assert(statics >= 380, 'статичных объектов: ' + statics);
assert.equal(perfWorld.sorter.dynamics.length, 30);
assert(avg < 5, `сортировка ${avg.toFixed(3)} мс за кадр (нужно < 5)`);
console.log(`actor tests ok; statics ${statics}, dynamics 30, sort avg ${avg.toFixed(2)} ms`);
