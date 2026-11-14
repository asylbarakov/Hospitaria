import * as layout from '../src/data/layout.js';
import { buildLayout } from '../src/iso/layoutBuilder.js';
import IsoDepth, { isBehind } from '../src/iso/IsoDepth.js';
const L = buildLayout(layout);
const d = new IsoDepth(100);
const mk = () => ({ setDepth() {} });
L.pieces.forEach((p) => d.add(mk(), p.box));
L.items.forEach((i) => d.add(mk(), { minX: i.x, maxX: i.x + i.w, minY: i.y, maxY: i.y + i.d }));
const t = performance.now(); d.sort(); const ms = performance.now() - t;
const st = d.statics; let viol = 0;
for (let i = 0; i < st.length; i++) for (let j = 0; j < st.length; j++) {
  if (i === j) continue;
  if (isBehind(st[i], st[j]) && !isBehind(st[j], st[i]) && st[i].rank > st[j].rank) viol++;
}
console.log('statics', st.length, 'sort ms', ms.toFixed(1), 'violations', viol);
process.exit(viol ? 1 : 0);
