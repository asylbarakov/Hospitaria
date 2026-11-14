import * as layout from '../src/data/layout.js';
import { buildLayout } from '../src/iso/layoutBuilder.js';
const L = buildLayout(layout); const g = L.grid;
const walk = []; for (let y=0;y<g.rows;y++) for (let x=0;x<g.cols;x++) if (g.isWalkable(x,y)) walk.push([x,y]);
const slabs = L.pieces.filter(p=>p.kind!=='col'&&p.kind!=='door').map(p=>p.box);
const R=0.2; let hits=0, runs=0, ex=null;
let seed=1; const rnd=()=> (seed=(seed*16807)%2147483647)/2147483647;
for (let n=0;n<400;n++){
  const a=walk[Math.floor(rnd()*walk.length)], b=walk[Math.floor(rnd()*walk.length)];
  const path=g.findPath(a[0],a[1],b[0],b[1]); if(!path) continue; runs++;
  let cur={x:a[0]+.5,y:a[1]+.5};
  for (const t of path){
    const tx=t.x+.5, ty=t.y+.5;
    for (let s=0;s<=20;s++){
      const px=cur.x+(tx-cur.x)*s/20, py=cur.y+(ty-cur.y)*s/20;
      for (const bx of slabs){
        if (px+R>bx.minX && px-R<bx.maxX && py+R>bx.minY && py-R<bx.maxY){ hits++; if(!ex) ex={px,py,bx}; }
      }
    }
    cur={x:tx,y:ty};
  }
}
console.log({runs,hits,ex});
process.exit(hits ? 1 : 0);
