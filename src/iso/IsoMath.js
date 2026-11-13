// Математика изометрии 2:1 (dimetric). Тайл — ромб 128x64.
//
// Координаты тайлов непрерывные: целые числа это УГЛЫ тайлов, тайл (i, j) занимает
// [i, i+1) x [j, j+1), центр тайла в (i+0.5, j+0.5).
//   x_screen = (x - y) * TILE_W / 2
//   y_screen = (x + y) * TILE_H / 2
// Ось x уходит вправо-вниз, ось y влево-вниз. Чем больше x + y, тем «ближе к камере».

export const TILE_W = 128;
export const TILE_H = 64;
export const HALF_W = TILE_W / 2;
export const HALF_H = TILE_H / 2;
export const WALL_H = 192;
// PNG из assets/final нарисованы в масштабе 2x, в игре их показываем с этим масштабом.
export const SPRITE_SCALE = 0.5;

export function tileToScreen(x, y) {
  return { x: (x - y) * HALF_W, y: (x + y) * HALF_H };
}

export function screenToTile(sx, sy) {
  const a = sx / HALF_W;
  const b = sy / HALF_H;
  return { x: (a + b) / 2, y: (b - a) / 2 };
}

/** Целый индекс тайла под точкой экрана (мировых пикселей). */
export function screenToTileIndex(sx, sy) {
  const t = screenToTile(sx, sy);
  return { x: Math.floor(t.x), y: Math.floor(t.y) };
}

export function tileCenter(i, j) {
  return tileToScreen(i + 0.5, j + 0.5);
}

/** Вершины ромба основания предмета w x d тайлов, стоящего в тайле (x0, y0). */
export function footprintScreen(x0, y0, w = 1, d = 1) {
  return {
    top: tileToScreen(x0, y0),
    right: tileToScreen(x0 + w, y0),
    bottom: tileToScreen(x0 + w, y0 + d),
    left: tileToScreen(x0, y0 + d),
    center: tileToScreen(x0 + w / 2, y0 + d / 2),
  };
}

/** Прямоугольник мира в пикселях для карты cols x rows тайлов (сверху запас под высоту стен). */
export function worldBounds(cols, rows, topMargin = WALL_H) {
  const left = tileToScreen(0, rows).x;
  const right = tileToScreen(cols, 0).x;
  const bottom = tileToScreen(cols, rows).y;
  return { x: left, y: -topMargin, w: right - left, h: bottom + topMargin };
}
