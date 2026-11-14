// Построитель карты больницы по данным src/data/layout.js. Чистые данные, без Phaser,
// поэтому проверяется в node. Возвращает:
//   grid    IsoGrid (пол, непроходимые стены, мебель),
//   floors  массив cols*rows с именем спрайта пола или null,
//   pieces  стены, двери, окна и колонны: {kind, name, fx, fy, box, tall} (fx, fy: якорь в тайлах),
//   signs   таблички: {text, x, y, lift, id} (x, y центр тайла двери, lift высота над полом в px),
//   items   мебель: {type, x, y, rot, w, d, gridId}.
//
// Геометрия стены (проверена превью tools/make_walls.py): у каждой комнаты кольцо стен в один
// тайл вокруг внутреннего прямоугольника. Тонкая плита стены прилегает к внутренней стороне:
//   N: y в [ty+1-T, ty+1]   S: y в [ty, ty+T]   W: x в [tx+1-T, tx+1]   E: x в [tx, tx+T]
// Верхние (N) и левые (W) стены на границе здания высокие, остальные низкие, чтобы
// коридоры за комнатами были видны. Дверь в низкой стене это просто проём без спрайта.

import IsoGrid from './IsoGrid.js';
import { CATALOG_BY_TYPE } from '../data/buildCatalog.js';

export const WALL_T = 0.16;

/** Основание предмета с учётом поворота. */
export function footprintOf(type, rot = 0) {
  const def = CATALOG_BY_TYPE[type];
  if (!def) {
    return null;
  }
  return rot ? { w: def.d, d: def.w } : { w: def.w, d: def.d };
}

function wallPiece(side, tx, ty, tall, kind) {
  const T = WALL_T;
  const run = side === 'N' || side === 'S' ? 'r' : 'l';
  const height = tall ? 'tall' : 'low';
  let name = `wall_${height}_${run}`;
  if (kind === 'door' && tall) {
    name = `door_tall_${run}`;
  } else if (kind === 'window' && tall) {
    name = `window_tall_${run}`;
  }
  const geo = {
    N: { fx: tx, fy: ty + 1, box: { minX: tx, maxX: tx + 1, minY: ty + 1 - T, maxY: ty + 1 } },
    S: { fx: tx, fy: ty + T, box: { minX: tx, maxX: tx + 1, minY: ty, maxY: ty + T } },
    W: { fx: tx + 1, fy: ty, box: { minX: tx + 1 - T, maxX: tx + 1, minY: ty, maxY: ty + 1 } },
    E: { fx: tx + T, fy: ty, box: { minX: tx, maxX: tx + T, minY: ty, maxY: ty + 1 } },
  }[side];
  return { kind: kind === 'wall' ? 'wall' : kind, name, tall, side, tx, ty, ...geo };
}

function columnPiece(fx, fy, tall) {
  const T = WALL_T;
  return {
    kind: 'col',
    name: tall ? 'col_tall' : 'col_low',
    tall,
    fx,
    fy,
    box: { minX: fx - T, maxX: fx, minY: fy - T, maxY: fy },
  };
}

/** Кольцо стен вокруг внутреннего прямоугольника ring = {x, y, w, h, doors, windows}. */
function collectRing(ring, building, walls, columns, openTiles) {
  const ix = ring.x;
  const iy = ring.y;
  const x0 = ix - 1;
  const y0 = iy - 1;
  const x1 = ix + ring.w;
  const y1 = iy + ring.h;
  const nTall = y0 === building.y;
  const wTall = x0 === building.x;
  const doors = ring.doors || [];
  const windows = ring.windows || [];

  const addSide = (side, tx, ty) => {
    const coord = side === 'N' || side === 'S' ? tx : ty;
    const isDoor = doors.some((d) => d.side === side && d.at === coord);
    const isWindow = windows.some((w) => w.side === side && w.at === coord);
    const tall = (side === 'N' && nTall) || (side === 'W' && wTall);
    const key = `${side}:${tx}:${ty}`;
    let kind = 'wall';
    if (isDoor) {
      kind = 'door';
      openTiles.add(`${tx}:${ty}`);
    } else if (isWindow && tall) {
      kind = 'window';
    }
    const old = walls.get(key);
    if (old && old.kind !== 'wall' && kind === 'wall') {
      return; // дверь/окно комнаты не затираем общей стеной здания
    }
    walls.set(key, wallPiece(side, tx, ty, tall, kind));
  };

  for (let x = ix; x < x1; x += 1) {
    addSide('N', x, y0);
    addSide('S', x, y1);
  }
  for (let y = iy; y < y1; y += 1) {
    addSide('W', x0, y);
    addSide('E', x1, y);
  }

  const T = WALL_T;
  const cols = [
    [ix, iy, nTall || wTall],
    [x1 + T, iy, nTall],
    [ix, y1 + T, wTall],
    [x1 + T, y1 + T, false],
  ];
  cols.forEach(([fx, fy, tall]) => {
    const key = `${fx.toFixed(2)}:${fy.toFixed(2)}`;
    const old = columns.get(key);
    columns.set(key, columnPiece(fx, fy, tall || (old ? old.tall : false)));
  });
  return { x0, y0, x1, y1 };
}

function firstDoorSign(ring) {
  const door = (ring.doors || [])[0];
  if (!door) {
    return null;
  }
  const ix = ring.x;
  const iy = ring.y;
  const pos = {
    N: { x: door.at + 0.5, y: iy - 0.5 },
    S: { x: door.at + 0.5, y: iy + ring.h + 0.5 },
    W: { x: ix - 0.5, y: door.at + 0.5 },
    E: { x: ix + ring.w + 0.5, y: door.at + 0.5 },
  }[door.side];
  return { ...pos, side: door.side };
}

export function buildLayout(layout, itemsOverride = null) {
  const { MAP, BUILDING, ENTRANCE, ROOMS, FLOOR_CORRIDOR } = layout;
  const grid = new IsoGrid(MAP.cols, MAP.rows);
  const floors = new Array(MAP.cols * MAP.rows).fill(null);

  const paint = (x, y, w, h, name) => {
    for (let j = y; j < y + h; j += 1) {
      for (let i = x; i < x + w; i += 1) {
        floors[j * MAP.cols + i] = name;
      }
    }
  };
  grid.fillFloor(BUILDING.x, BUILDING.y, BUILDING.w, BUILDING.h, 1);
  paint(BUILDING.x, BUILDING.y, BUILDING.w, BUILDING.h, FLOOR_CORRIDOR);
  ROOMS.forEach((room) => paint(room.x, room.y, room.w, room.h, room.floor));

  const walls = new Map();
  const columns = new Map();
  const openTiles = new Set();
  const signs = [];

  const rings = ROOMS.filter((r) => r.kind === 'room');
  rings.forEach((room) => {
    collectRing(room, BUILDING, walls, columns, openTiles);
    const s = firstDoorSign(room);
    if (s) {
      signs.push({ id: room.id, text: room.name, x: s.x, y: s.y, lift: s.side === 'N' || s.side === 'W' ? 250 : 150 });
    }
  });
  const shell = {
    x: BUILDING.x + 1,
    y: BUILDING.y + 1,
    w: BUILDING.w - 2,
    h: BUILDING.h - 2,
    doors: [{ side: 'S', at: ENTRANCE.x }],
    windows: [],
  };
  collectRing(shell, BUILDING, walls, columns, openTiles);
  signs.push({ id: 'entrance', text: 'Вход', x: ENTRANCE.x + 0.5, y: ENTRANCE.y + 0.5, lift: 170 });

  // Зоны без стен: табличка над задней границей.
  ROOMS.filter((r) => r.kind === 'zone').forEach((zone) => {
    signs.push({ id: zone.id, text: zone.name, x: zone.x + zone.w / 2, y: zone.y + 0.5, lift: 120 });
  });

  // Непроходимые тайлы: все кольца, кроме дверных проёмов.
  const blockTile = (tx, ty) => {
    if (!openTiles.has(`${tx}:${ty}`)) {
      grid.setBlocked(tx, ty, 1);
    }
  };
  walls.forEach((w) => blockTile(w.tx, w.ty));
  [...rings, shell].forEach((r) => {
    [[r.x - 1, r.y - 1], [r.x + r.w, r.y - 1], [r.x - 1, r.y + r.h], [r.x + r.w, r.y + r.h]].forEach(([tx, ty]) => {
      grid.setBlocked(tx, ty, 1);
    });
  });

  const wallList = [...walls.values()].concat([...columns.values()]);

  // Мебель из планировки или из сохранения.
  const source = itemsOverride || ROOMS.flatMap((room) => room.items || []);
  const items = [];
  source.forEach((it) => {
    const fp = footprintOf(it.type, it.rot || 0);
    if (!fp) {
      return;
    }
    const gridId = grid.place(it.x, it.y, fp.w, fp.d, { type: it.type });
    if (gridId !== -1) {
      items.push({ type: it.type, x: it.x, y: it.y, rot: it.rot || 0, w: fp.w, d: fp.d, gridId });
    }
  });

  return { grid, floors, pieces: wallList, signs, items, openTiles };
}
