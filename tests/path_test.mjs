// Этап 13: навигация. Пути от входа к комнатам и мебели, стены, перестройка
// после продажи, двери, связность построек, очередь Pathfinder и BFS-резерв.
import assert from 'node:assert';
import * as layout from '../src/data/layout.js';
import { buildLayout } from '../src/iso/layoutBuilder.js';
import Pathfinder from '../src/iso/Pathfinder.js';
import {
  evaluatePlacement, facingTile, isLayoutConnected, nearestWalkable, standCandidates, tileKey,
} from '../src/iso/connectivity.js';

const L = buildLayout(layout);
const g = L.grid;
const entrance = nearestWalkable(g, layout.ENTRANCE.x, layout.ENTRANCE.y);
const doors = [...L.openTiles].map((key) => {
  const [x, y] = key.split(':').map(Number);
  return { x, y };
});
const stands = L.items.map((item) => standCandidates(g, item)[0]).filter(Boolean);

/** BFS по матрице EasyStar: путь вместе со стартом, как у настоящей библиотеки. */
function matrixPath(matrix, sx, sy, tx, ty) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const h = matrix.length;
  const w = matrix[0].length;
  const ok = (x, y) => x >= 0 && y >= 0 && x < w && y < h && matrix[y][x] === 0;
  if (!ok(sx, sy) || !ok(tx, ty)) {
    return null;
  }
  if (sx === tx && sy === ty) {
    return [{ x: sx, y: sy }];
  }
  const prev = new Map([[`${sx}:${sy}`, null]]);
  const queue = [[sx, sy]];
  for (let head = 0; head < queue.length; head += 1) {
    const [cx, cy] = queue[head];
    if (cx === tx && cy === ty) {
      break;
    }
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!ok(nx, ny) || (dx && dy && (!ok(cx + dx, cy) || !ok(cx, cy + dy)))) {
        continue;
      }
      const key = `${nx}:${ny}`;
      if (prev.has(key)) {
        continue;
      }
      prev.set(key, [cx, cy]);
      queue.push([nx, ny]);
    }
  }
  const goal = `${tx}:${ty}`;
  if (!prev.has(goal)) {
    return null;
  }
  const path = [];
  for (let cur = [tx, ty]; cur; cur = prev.get(`${cur[0]}:${cur[1]}`)) {
    path.push({ x: cur[0], y: cur[1] });
  }
  return path.reverse();
}

// Подставной EasyStar.js с тем же контрактом: очередь запросов и calculate().
class FakeEasyStar {
  constructor() {
    this.matrix = null;
    this.requests = [];
    this.started = 0;
    this.gridSets = 0;
    this.calculates = 0;
  }

  setAcceptableTiles() {}

  enableDiagonals() {}

  disableCornerCutting() {}

  setIterationsPerCalculation() {}

  setGrid(matrix) {
    this.matrix = matrix;
    this.gridSets += 1;
  }

  findPath(sx, sy, tx, ty, callback) {
    this.started += 1;
    this.requests.push({ sx, sy, tx, ty, callback });
    return this.requests.length;
  }

  calculate() {
    this.calculates += 1;
    const batch = this.requests;
    this.requests = [];
    for (const req of batch) {
      req.callback(matrixPath(this.matrix, req.sx, req.sy, req.tx, req.ty));
    }
  }
}

async function drain(pf, promises) {
  for (let i = 0; i < 1000 && pf.queue.length; i += 1) {
    pf.update();
    await Promise.resolve();
  }
  return Promise.all(promises);
}

async function checkBackend(name, pf) {
  assert.equal(pf.backend, name, 'backend: ' + name);
  const cases = doors.map((t) => ({ ...t, label: 'дверь' }))
    .concat(stands.map((t) => ({ ...t, label: 'мебель' })))
    .filter((t) => t.x !== entrance.x || t.y !== entrance.y);
  const promises = cases.map((t) => pf.findPath(entrance.x, entrance.y, t.x, t.y));
  const paths = await drain(pf, promises);
  paths.forEach((path, i) => {
    assert(path && path.length > 0, `нет пути: ${cases[i].label} ${cases[i].x},${cases[i].y}`);
    assert(!(path[0].x === entrance.x && path[0].y === entrance.y), 'стартовый тайл не в пути');
    assert.equal(path[path.length - 1].x, cases[i].x);
    assert.equal(path[path.length - 1].y, cases[i].y);
  });
  const same = await pf.findPath(entrance.x, entrance.y, entrance.x, entrance.y);
  assert.deepEqual(same, [], 'путь в тот же тайл пустой');
  const wall = await pf.findPath(entrance.x, entrance.y, 1, 1);
  assert.equal(wall, null, 'в стену пути нет');
  return paths;
}

const bfs = new Pathfinder(g);
const bfsPaths = await checkBackend('bfs', bfs);

const fake = new FakeEasyStar();
const easy = new Pathfinder(g, { easyStarFactory: () => fake });
const easyPaths = await checkBackend('easystar', easy);
assert.equal(easyPaths.length, bfsPaths.length);
assert(fake.gridSets >= 1, 'матрица передана EasyStar');

// 1. Подходы к мебели и направление взгляда.
for (const item of L.items) {
  const candidates = standCandidates(g, item);
  assert(candidates.length > 0, `нет подхода к ${item.type}`);
  assert(candidates.every((t) => g.isWalkable(t.x, t.y)), 'подход проходим');
}
const face = facingTile({ x: 5, y: 8, w: 2, d: 1 }, { x: 7, y: 8 });
assert.deepEqual(face, { x: 6, y: 8 }, 'смотрит на ближний тайл предмета');
assert.deepEqual(facingTile({ x: 5, y: 8, w: 2, d: 1 }, { x: 5, y: 7 }), { x: 5, y: 8 });

// 2. Двери проходимы, мебель на дверь не ставится, единственный проход защищён.
assert.equal(doors.length, 11);
doors.forEach((t) => assert(g.isWalkable(t.x, t.y), `дверь ${t.x}:${t.y} проходима`));
const firstDoor = doors[0];
assert.equal(
  evaluatePlacement(g, L.openTiles, L.items, 'hall_sofa', firstDoor.x, firstDoor.y, 0, entrance),
  'door',
);
assert.equal(isLayoutConnected(g, L.openTiles, L.items, entrance), true, 'стартовая планировка связна');
assert.equal(
  evaluatePlacement(g, L.openTiles, L.items, 'plant_big', 5, 11, 0, entrance),
  'passage',
  'перекрытие единственного прохода запрещено',
);
assert.equal(
  evaluatePlacement(g, L.openTiles, L.items, 'plant_big', 40, 32, 0, entrance),
  null,
  'свободное место в холле разрешено',
);

// 3. Стены: путь не пересекает плиты стен (подход из walk_test, R = 0.2).
const slabs = L.pieces.filter((p) => p.kind !== 'col' && p.kind !== 'door').map((p) => p.box);
const R = 0.2;
let hits = 0;
for (const path of bfsPaths) {
  let cur = { x: entrance.x + 0.5, y: entrance.y + 0.5 };
  for (const tile of path) {
    const tx = tile.x + 0.5;
    const ty = tile.y + 0.5;
    for (let s = 0; s <= 12; s += 1) {
      const px = cur.x + (tx - cur.x) * (s / 12);
      const py = cur.y + (ty - cur.y) * (s / 12);
      for (const box of slabs) {
        if (px + R > box.minX && px - R < box.maxX && py + R > box.minY && py - R < box.maxY) {
          hits += 1;
        }
      }
    }
    cur = { x: tx, y: ty };
  }
}
assert.equal(hits, 0, 'пересечений стен: ' + hits);

// 4. Продажа стула: занятый тайл обходится, после удаления путь снова свободен.
const goal = stands[0];
const before = g.findPath(entrance.x, entrance.y, goal.x, goal.y);
assert(before && before.length > 8);
const blocked = before[Math.floor(before.length / 2)];
assert(!L.openTiles.has(tileKey(blocked.x, blocked.y)), 'блокируем не дверь');
const rev = g.revision;
const id = g.place(blocked.x, blocked.y, 1, 1, { type: 'test_chair' });
assert(id !== -1);
assert(g.revision > rev, 'ревизия сетки выросла');
const afterPlace = g.findPath(entrance.x, entrance.y, goal.x, goal.y);
assert(afterPlace, 'обход существует');
assert(!afterPlace.some((t) => t.x === blocked.x && t.y === blocked.y), 'занятый тайл не в маршруте');
g.remove(id);
const afterRemove = g.findPath(entrance.x, entrance.y, goal.x, goal.y);
assert(afterRemove, 'после продажи путь есть');
assert(afterRemove.some((t) => t.x === blocked.x && t.y === blocked.y), 'старый тайл снова доступен');

// EasyStar получает новую матрицу после изменения сетки.
const fake2 = new FakeEasyStar();
const pf2 = new Pathfinder(g, { easyStarFactory: () => fake2 });
const first = pf2.findPath(entrance.x, entrance.y, goal.x, goal.y);
await drain(pf2, [first]);
assert.equal(fake2.gridSets, 1);
const free = g.findPath(entrance.x, entrance.y, goal.x, goal.y);
const tile = free[Math.floor(free.length / 2)];
const chair = g.place(tile.x, tile.y, 1, 1, { type: 'test_chair' });
assert(chair !== -1);
const second = pf2.findPath(entrance.x, entrance.y, goal.x, goal.y);
await drain(pf2, [second]);
assert.equal(fake2.gridSets, 2, 'setGrid после постановки');
g.remove(chair);

// 5. Очередь: не больше 2 запросов за кадр, 10 маршрутов не зависают.
const fake3 = new FakeEasyStar();
const pf3 = new Pathfinder(g, { easyStarFactory: () => fake3 });
const goals = Array.from({ length: 10 }, (_, i) => stands[i % stands.length]);
const ten = goals.map((t) => pf3.findPath(entrance.x, entrance.y, t.x, t.y));
assert.equal(pf3.update(), 2, 'за кадр запущено 2 запроса');
assert.equal(fake3.started, 2);
const tenPaths = await drain(pf3, ten);
assert.equal(tenPaths.filter(Boolean).length, 10, 'все 10 маршрутов построены');

// 6. 200 запросов быстрее 50 мс (BFS-резерв, как в node и без CDN).
const walk = [];
for (let y = 0; y < g.rows; y += 1) {
  for (let x = 0; x < g.cols; x += 1) {
    if (g.isWalkable(x, y)) {
      walk.push({ x, y });
    }
  }
}
let seed = 7;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const startedAt = performance.now();
const many = [];
for (let i = 0; i < 200; i += 1) {
  const a = walk[Math.floor(rnd() * walk.length)];
  const b = walk[Math.floor(rnd() * walk.length)];
  many.push(bfs.findPath(a.x, a.y, b.x, b.y));
}
const manyPaths = await Promise.all(many);
const elapsed = performance.now() - startedAt;
assert.equal(manyPaths.filter(Boolean).length, 200, '200 маршрутов построены');
assert(elapsed < 50, `200 запросов за ${elapsed.toFixed(1)} мс (нужно < 50)`);

console.log(`path tests ok; doors ${doors.length}, items ${L.items.length}, 200 paths ${elapsed.toFixed(1)} ms`);
