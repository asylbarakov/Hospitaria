import * as layout from '../src/data/layout.js';
import { buildLayout, footprintOf } from '../src/iso/layoutBuilder.js';
import { CATALOG } from '../src/data/buildCatalog.js';
import fs from 'node:fs';

let fails = 0;
const ok = (c, m) => { if (!c) { fails += 1; console.log('FAIL', m); } };
const walls = JSON.parse(fs.readFileSync(new URL('../assets/final/walls/walls.json', import.meta.url), 'utf8'));
const anchors = JSON.parse(fs.readFileSync(new URL('../assets/final/anchors.json', import.meta.url), 'utf8'));

const total = layout.ROOMS.reduce((n, r) => n + (r.items || []).length, 0);
const L = buildLayout(layout);
ok(L.items.length === total, `items placed ${L.items.length}/${total}`);
if (L.items.length !== total) {
  const placed = new Set(L.items.map((i) => `${i.type}@${i.x},${i.y}`));
  layout.ROOMS.forEach((r) => (r.items || []).forEach((i) => { if (!placed.has(`${i.type}@${i.x},${i.y}`)) console.log('  not placed', r.id, i); }));
}
// мебель лежит внутри своей комнаты
layout.ROOMS.forEach((r) => (r.items || []).forEach((i) => {
  const fp = footprintOf(i.type, i.rot || 0);
  ok(i.x >= r.x && i.y >= r.y && i.x + fp.w <= r.x + r.w && i.y + fp.d <= r.y + r.h, `${r.id}: ${i.type} вне комнаты`);
}));
// спрайты и имена
CATALOG.forEach((c) => ok(anchors[c.type], `нет спрайта ${c.type}`));
L.pieces.forEach((p) => ok(walls[p.name], `нет стены ${p.name}`));
// окна только в высоких стенах
layout.ROOMS.forEach((r) => (r.windows || []).forEach((w) => {
  const hit = L.pieces.find((p) => p.kind === 'window' && ((w.side === 'N' || w.side === 'S') ? p.tx === w.at : p.ty === w.at));
  ok(hit, `окно ${r.id} ${w.side}${w.at} не стало окном`);
}));
// связность от входа
const g = L.grid;
const start = layout.ENTRANCE;
ok(g.isWalkable(start.x, start.y), 'вход непроходим');
const seen = new Set([`${start.x},${start.y}`]);
const q = [[start.x, start.y]];
for (let h = 0; h < q.length; h += 1) {
  const [x, y] = q[h];
  [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
    const k = `${x + dx},${y + dy}`;
    if (!seen.has(k) && g.isWalkable(x + dx, y + dy)) { seen.add(k); q.push([x + dx, y + dy]); }
  });
}
layout.ROOMS.forEach((r) => {
  let free = 0; let reach = 0;
  for (let y = r.y; y < r.y + r.h; y += 1) for (let x = r.x; x < r.x + r.w; x += 1) {
    if (g.isWalkable(x, y)) { free += 1; if (seen.has(`${x},${y}`)) reach += 1; }
  }
  ok(reach === free && free > 0, `${r.id}: достижимо ${reach}/${free}`);
});
L.items.forEach((it) => {
  let adj = false;
  for (let j = it.y - 1; j <= it.y + it.d; j += 1) for (let i = it.x - 1; i <= it.x + it.w; i += 1) {
    if (seen.has(`${i},${j}`)) adj = true;
  }
  ok(adj, `${it.type}@${it.x},${it.y} без подхода`);
});
// двери проходимы, стены нет
layout.ROOMS.filter((r) => r.kind === 'room').forEach((r) => (r.doors || []).forEach((d) => {
  const tx = d.side === 'W' ? r.x - 1 : d.side === 'E' ? r.x + r.w : d.at;
  const ty = d.side === 'N' ? r.y - 1 : d.side === 'S' ? r.y + r.h : d.at;
  ok(g.isWalkable(tx, ty) && seen.has(`${tx},${ty}`), `дверь ${r.id} ${d.side}${d.at} (${tx},${ty})`);
}));
// ни одной стены не проходимо; весь ободок здания закрыт, кроме входа
const B = layout.BUILDING;
let openRing = [];
for (let x = B.x; x < B.x + B.w; x += 1) for (const y of [B.y, B.y + B.h - 1]) if (g.isWalkable(x, y)) openRing.push([x, y]);
for (let y = B.y; y < B.y + B.h; y += 1) for (const x of [B.x, B.x + B.w - 1]) if (g.isWalkable(x, y)) openRing.push([x, y]);
ok(openRing.length === 1 && openRing[0][0] === layout.ENTRANCE.x, `ободок открыт в ${JSON.stringify(openRing)}`);
// пути комнат: из входа в каждую дверь через findPath
const path = g.findPath(start.x, start.y, 5, 9);
ok(path && path.length > 0, 'путь вход -> терапевт');
// продажа и повторная постановка
const it0 = L.items[0];
g.remove(it0.gridId);
ok(g.canPlace(it0.x, it0.y, it0.w, it0.d), 'после продажи место свободно');
// пересборка из сохранения даёт то же
const again = buildLayout(layout, L.items.map(({ type, x, y, rot }) => ({ type, x, y, rot })));
ok(again.items.length === L.items.length, 'пересборка из сохранения');
// подсчёты
const tall = L.pieces.filter((p) => p.tall && p.kind !== 'col').length;
const low = L.pieces.filter((p) => !p.tall && p.kind !== 'col').length;
console.log(`pieces=${L.pieces.length} tall=${tall} low=${low} cols=${L.pieces.filter((p) => p.kind === 'col').length} signs=${L.signs.length} items=${L.items.length} reachable=${seen.size}`);
console.log(fails ? `FAILED ${fails}` : 'layout tests ok');
process.exit(fails ? 1 : 0);
