import { WORLD_WIDTH, WORLD_HEIGHT } from '../data/rooms.js';

// Phaser заново разбирает команды Graphics каждый кадр, поэтому большая
// статичная картинка (стены, пол, мебель) дорого стоит. Здесь она один раз
// «запекается» в RenderTexture: дальше это обычные картинки без пересчёта.
// Куски небольшие, чтобы уложиться в лимит текстур слабых телефонов (2048).
const CHUNK_W = 1120;
const CHUNK_H = 720;

/**
 * Запекает всю карту больницы из graphics в несколько RenderTexture.
 * Возвращает Container (его можно destroy(true)).
 * Если запекание не удалось, graphics остаётся на сцене и возвращается как есть.
 */
export function bakeWorldGraphics(scene, graphics, depth = 0) {
  const holder = scene.add.container(0, 0).setDepth(depth);

  try {
    for (let y = 0; y < WORLD_HEIGHT; y += CHUNK_H) {
      for (let x = 0; x < WORLD_WIDTH; x += CHUNK_W) {
        const w = Math.min(CHUNK_W, WORLD_WIDTH - x);
        const h = Math.min(CHUNK_H, WORLD_HEIGHT - y);
        const rt = scene.add.renderTexture(x, y, w, h).setOrigin(0, 0);

        graphics.setPosition(-x, -y);
        rt.draw(graphics);
        holder.add(rt);
      }
    }
  } catch (error) {
    console.warn('Не удалось запечь мир, рисуем напрямую:', error);
    holder.destroy(true);
    graphics.setPosition(0, 0).setDepth(depth);
    return graphics;
  }

  graphics.destroy();
  return holder;
}

/**
 * Запекает один предмет мебели в маленькую RenderTexture.
 * paint(g, x, y) рисует предмет с точкой опоры (x, y) на полу.
 */
const ITEM_W = 360;
const ITEM_H = 290;
const ITEM_ANCHOR_X = 180;
const ITEM_ANCHOR_Y = 268;

export function bakeFurnitureItem(scene, paint, worldX, worldY, depth = 1) {
  const g = scene.add.graphics();
  paint(g, ITEM_ANCHOR_X, ITEM_ANCHOR_Y);

  try {
    const rt = scene.add
      .renderTexture(worldX - ITEM_ANCHOR_X, worldY - ITEM_ANCHOR_Y, ITEM_W, ITEM_H)
      .setOrigin(0, 0)
      .setDepth(depth);
    rt.draw(g);
    g.destroy();
    return rt;
  } catch (error) {
    console.warn('Не удалось запечь предмет мебели:', error);
    g.destroy();
    const fallback = scene.add.graphics().setDepth(depth);
    paint(fallback, worldX, worldY);
    return fallback;
  }
}
