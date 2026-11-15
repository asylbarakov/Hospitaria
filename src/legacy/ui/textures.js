// Помощники для генерации текстур кодом (внешних картинок в проекте нет).
// Готовая текстура рисуется как обычная картинка, а не пересчитывается
// каждый кадр, как команды Graphics. Повторный вызов с тем же ключом ничего не делает.

/** Рисует через Graphics и сохраняет в текстуру width x height (координаты от 0,0). */
export function ensureTexture(scene, key, width, height, paint) {
  if (scene.textures.exists(key)) {
    return key;
  }

  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  paint(g, width, height);
  g.generateTexture(key, width, height);
  g.destroy();
  return key;
}

/** Вертикальный градиент: stops = [[0, '#fff'], [1, '#000']]. */
export function ensureVerticalGradient(scene, key, width, height, stops) {
  if (scene.textures.exists(key)) {
    return key;
  }

  const texture = scene.textures.createCanvas(key, width, height);
  const ctx = texture.getContext();
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  texture.refresh();
  return key;
}

/** Затемнение по краям кадра (виньетка): прозрачный центр, тёмные углы. */
export function ensureVignette(scene, key, width, height, strength = 0.32) {
  if (scene.textures.exists(key)) {
    return key;
  }

  const texture = scene.textures.createCanvas(key, width, height);
  const ctx = texture.getContext();
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    height * 0.38,
    width / 2,
    height / 2,
    width * 0.62,
  );
  gradient.addColorStop(0, 'rgba(8, 26, 36, 0)');
  gradient.addColorStop(1, `rgba(8, 26, 36, ${strength})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  texture.refresh();
  return key;
}
