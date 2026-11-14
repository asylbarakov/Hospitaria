// Чистая логика подходов к мебели и связности проходов (этап 13, без Phaser).
// Используется IsoWorld (standTileFor, проверка постройки) и тестами в node.

import { PATH_CONFIG } from '../data/pathConfig.js';
import { footprintOf } from './layoutBuilder.js';

const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function tileKey(x, y) {
  return `${x}:${y}`;
}

/** Принимает и запись из furniture ({ item }), и сам предмет. */
export function unwrapItem(target) {
  if (!target) {
    return null;
  }
  return target.item || target;
}

export function itemSize(item) {
  if (Number.isFinite(item.w) && Number.isFinite(item.d)) {
    return { w: item.w, d: item.d };
  }
  const fp = footprintOf(item.type, item.rot || 0);
  return fp ? { w: fp.w, d: fp.d } : { w: 1, d: 1 };
}

/** Ближайший проходимый тайл (по сетке) к точке, включая саму точку. */
export function nearestWalkable(grid, x, y, maxRadius = PATH_CONFIG.maxStandRadius) {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  if (grid.isWalkable(cx, cy)) {
    return { x: cx, y: cy };
  }
  let best = null;
  let bestDist = Infinity;
  for (let r = 1; r <= maxRadius && bestDist === Infinity; r += 1) {
    for (let dy = -r; dy <= r; dy += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) {
          continue;
        }
        const tx = cx + dx;
        const ty = cy + dy;
        if (!grid.isWalkable(tx, ty)) {
          continue;
        }
        const dist = Math.hypot(tx + 0.5 - x, ty + 0.5 - y);
        if (dist < bestDist) {
          bestDist = dist;
          best = { x: tx, y: ty };
        }
      }
    }
  }
  return best;
}

/** Проходимые тайлы вокруг основания предмета, от ближних к дальним. */
export function standCandidates(grid, target, maxRadius = PATH_CONFIG.maxStandRadius) {
  const item = unwrapItem(target);
  if (!item || !Number.isFinite(item.x) || !Number.isFinite(item.y)) {
    return [];
  }
  const { w, d } = itemSize(item);
  const cx = item.x + w / 2;
  const cy = item.y + d / 2;
  const list = [];
  for (let y = item.y - maxRadius; y < item.y + d + maxRadius; y += 1) {
    for (let x = item.x - maxRadius; x < item.x + w + maxRadius; x += 1) {
      const inside = x >= item.x && x < item.x + w && y >= item.y && y < item.y + d;
      if (inside || !grid.isWalkable(x, y)) {
        continue;
      }
      list.push({ x, y, dist: Math.hypot(x + 0.5 - cx, y + 0.5 - cy) });
    }
  }
  list.sort((a, b) => a.dist - b.dist || a.y - b.y || a.x - b.x);
  return list.map(({ x, y }) => ({ x, y }));
}

/** Тайл предмета, в сторону которого смотрит стоящий рядом актёр. */
export function facingTile(target, from) {
  const item = unwrapItem(target);
  if (!item) {
    return null;
  }
  const { w, d } = itemSize(item);
  const x = from ? Math.min(item.x + w - 1, Math.max(item.x, Math.floor(from.x))) : item.x;
  const y = from ? Math.min(item.y + d - 1, Math.max(item.y, Math.floor(from.y))) : item.y;
  return { x, y };
}

function footprintKeys(item) {
  const keys = new Set();
  if (!item) {
    return keys;
  }
  const { w, d } = itemSize(item);
  for (let y = item.y; y < item.y + d; y += 1) {
    for (let x = item.x; x < item.x + w; x += 1) {
      keys.add(tileKey(x, y));
    }
  }
  return keys;
}

function nearestFree(grid, blocked, x, y, maxRadius = PATH_CONFIG.maxStandRadius) {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  const free = (tx, ty) => grid.isWalkable(tx, ty) && !blocked.has(tileKey(tx, ty));
  if (free(cx, cy)) {
    return { x: cx, y: cy };
  }
  for (let r = 1; r <= maxRadius; r += 1) {
    for (let dy = -r; dy <= r; dy += 1) {
      for (let dx = -r; dx <= r; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === r && free(cx + dx, cy + dy)) {
          return { x: cx + dx, y: cy + dy };
        }
      }
    }
  }
  return null;
}

function floodFill(grid, blocked, start) {
  const seen = new Set();
  if (!start) {
    return seen;
  }
  const queue = [start];
  seen.add(tileKey(start.x, start.y));
  for (let head = 0; head < queue.length; head += 1) {
    const cur = queue[head];
    for (const [dx, dy] of DIRS4) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const key = tileKey(nx, ny);
      if (seen.has(key) || blocked.has(key) || !grid.isWalkable(nx, ny)) {
        continue;
      }
      seen.add(key);
      queue.push({ x: nx, y: ny });
    }
  }
  return seen;
}

/**
 * Останутся ли после постановки extra достижимы все двери и подходы к мебели.
 * extra: {type,x,y,w,d} или null (проверка текущей планировки).
 */
export function connectedAfterPlacement(grid, openTiles, items, extra, entrance) {
  const blocked = footprintKeys(extra);
  const start = nearestFree(grid, blocked, entrance.x, entrance.y);
  if (!start) {
    return false;
  }
  const seen = floodFill(grid, blocked, start);
  for (const key of openTiles) {
    const [x, y] = key.split(':').map(Number);
    if (!seen.has(key) || blocked.has(key)) {
      return false;
    }
  }
  const all = extra ? items.concat([extra]) : items;
  for (const item of all) {
    const candidates = standCandidates(grid, item);
    let reachable = false;
    for (const tile of candidates) {
      const key = tileKey(tile.x, tile.y);
      if (!blocked.has(key) && seen.has(key)) {
        reachable = true;
        break;
      }
    }
    if (!reachable) {
      return false;
    }
  }
  return true;
}

/** Текущая планировка связна: от входа достижимы все двери и каждый предмет. */
export function isLayoutConnected(grid, openTiles, items, entrance) {
  return connectedAfterPlacement(grid, openTiles, items, null, entrance);
}

/**
 * Причина, по которой предмет нельзя поставить: 'door' | 'occupied' | 'passage' | null.
 * null означает, что место свободно и проходы не перекрыты.
 */
export function evaluatePlacement(grid, openTiles, items, type, x, y, rot, entrance) {
  const fp = footprintOf(type, rot || 0);
  if (!fp) {
    return 'occupied';
  }
  for (let ty = y; ty < y + fp.d; ty += 1) {
    for (let tx = x; tx < x + fp.w; tx += 1) {
      if (openTiles.has(tileKey(tx, ty))) {
        return 'door';
      }
      if (!grid.isWalkable(tx, ty)) {
        return 'occupied';
      }
    }
  }
  const extra = { type, x, y, rot: rot ? 1 : 0, w: fp.w, d: fp.d };
  return connectedAfterPlacement(grid, openTiles, items, extra, entrance) ? null : 'passage';
}
