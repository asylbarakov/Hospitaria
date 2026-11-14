import * as M from '../src/iso/IsoMath.js';
import IsoGrid from '../src/iso/IsoGrid.js';
import IsoDepth from '../src/iso/IsoDepth.js';
import assert from 'node:assert';

// 1. Круговая проверка проекции
for (let i = 0; i < 1000; i++) {
  const x = Math.random() * 40 - 5, y = Math.random() * 40 - 5;
  const s = M.tileToScreen(x, y), t = M.screenToTile(s.x, s.y);
  assert(Math.abs(t.x - x) < 1e-9 && Math.abs(t.y - y) < 1e-9);
}
// 2. Известные точки: ромб тайла (0,0): верх (0,0), право (64,32), низ (0,64), лево (-64,32)
const fp = M.footprintScreen(0, 0, 1, 1);
assert.deepEqual([fp.top, fp.right, fp.bottom, fp.left], [{x:0,y:0},{x:64,y:32},{x:0,y:64},{x:-64,y:32}]);
// 3. Центр тайла (3,2) -> индекс (3,2); точки у границ
const c = M.tileCenter(3, 2); assert.deepEqual(M.screenToTileIndex(c.x, c.y), {x:3,y:2});
assert.deepEqual(M.screenToTileIndex(c.x + 60, c.y), {x:3,y:2});   // внутри ромба
const n = M.screenToTileIndex(c.x + 66, c.y); assert(n.x !== 3 || n.y !== 2); // за правой вершиной уже другой тайл
// все 4 стороны от центра на 20px внутри остаются тем же тайлом
for (const [dx,dy] of [[0,20],[0,-20],[40,0],[-40,0]]) assert.deepEqual(M.screenToTileIndex(c.x+dx,c.y+dy),{x:3,y:2});
// границы мира
const b = M.worldBounds(20,20,260); assert(b.x === -1280 && b.w === 2560 && b.y === -260);

// 4. Сетка и пути
const g = new IsoGrid(10,10); g.fillFloor(0,0,10,10,1);
assert(g.place(3,3,2,1) === 0); assert(g.place(4,3,1,1) === -1); // пересечение отвергнуто
assert(!g.isWalkable(3,3) && !g.isWalkable(4,3) && g.isWalkable(5,3));
let p = g.findPath(0,0,9,9); assert(p && p.length >= 9 && p.length <= 11 && p.at(-1).x === 9 && p.every(t => g.isWalkable(t.x,t.y)));
// стена из предметов: тупик
const g2 = new IsoGrid(5,5); g2.fillFloor(0,0,5,5,1); g2.place(0,2,5,1);
assert(g2.findPath(0,0,4,4) === null, 'путь через сплошную стену');
// диагональ не режет углы: блок в (1,0) и (0,1), старт (0,0) -> (1,1)
const g3 = new IsoGrid(3,3); g3.fillFloor(0,0,3,3,1); g3.place(1,0,1,1); g3.place(0,1,1,1);
assert(g3.findPath(0,0,2,2) === null);
g.remove(0); assert(g.isWalkable(3,3));
const m = g2.toMatrix(); assert(m[2].every(v=>v===1) && m[0].every(v=>v===0));

// 5. Сортировка по глубине
const mk = (n)=>({n,d:0,setDepth(v){this.d=v;}});
const desk=mk('desk'), a=mk('walker_behind'), b2=mk('walker_front'), side=mk('walker_side');
const D = new IsoDepth(100);
D.add(desk,{minX:6,maxX:9,minY:3,maxY:4});            // стойка 3x1
D.add(a,{minX:7.3,maxX:7.7,minY:2.0,maxY:2.4},{dynamic:true});        // за стойкой (y меньше)
D.add(b2,{minX:7.3,maxX:7.7,minY:4.6,maxY:5.0},{dynamic:true});       // перед стойкой
D.add(side,{minX:9.6,maxX:10.0,minY:3.3,maxY:3.7},{dynamic:true});    // справа вдоль оси x
D.sort();
assert(a.d < desk.d, 'позади стойки рисуется раньше'); assert(b2.d > desk.d, 'перед стойкой рисуется позже');
// обход стойки по кругу: ни разу не нарушаем порядок относительно стола
const w = mk('w'); D.add(w,{minX:0,maxX:.4,minY:0,maxY:.4},{dynamic:true});
let bad=0;
for (let t=0;t<720;t++){ const ang=t*Math.PI/360, cx=7.5+4*Math.cos(ang), cy=3.5+3*Math.sin(ang);
  D.updateBox(w,{minX:cx-.2,maxX:cx+.2,minY:cy-.2,maxY:cy+.2}); D.sort();
  const diag = (cx+.2<=6 && cy-.2>=4) || (cx-.2>=9 && cy+.2<=3); // рядом по диагонали, на экране не пересекаются
  if (diag) continue;
  const inFront = cy-.2 >= 4 || cx-.2 >= 9;
  const behind = cy+.2 <= 3 || cx+.2 <= 6;
  if (inFront && !(w.d > desk.d)) bad++;
  if (behind && !(w.d < desk.d)) bad++;
}
assert.equal(bad,0,'нарушений порядка при обходе: '+bad);
console.log('все проверки IsoMath/IsoGrid/IsoDepth прошли');
