// Панели, окна, полоски и карточки UI-кита (этап 19).
// Все элементы берут PNG из assets/final/ui; при отсутствии текстуры остаётся
// код-рисованный запас, чтобы старые сцены v0.1 не падали.

import { uiKey } from '../iso/isoAssets.js';
import { UI_FONT, UI_INK, colorCss } from './uiTheme.js';

const PLATE_CROP = { x: 100, y: 24, w: 860, h: 114 };
const PLATE_SIZE = 96;
const PLATE_RADIUS = 18;
const PANEL_SOURCE_H = 162;

/** Окно с PNG-шапкой. options: { tint, depth, interactive } */
export function windowFrame(scene, x, y, width, height, options = {}) {
  const { tint = null, depth = 0, interactive = false } = options;
  if (!scene.textures.exists(uiKey('ui_window'))) {
    const fallback = scene.add.graphics().setDepth(depth);
    fallback.fillStyle(0x0b1e28, 0.3);
    fallback.fillRoundedRect(x - width / 2 + 8, y - height / 2 + 10, width, height, 26);
    fallback.fillStyle(0xffffff, 1);
    fallback.fillRoundedRect(x - width / 2, y - height / 2, width, height, 26);
    fallback.lineStyle(3, 0x8fb7c7, 1);
    fallback.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 26);
    return fallback;
  }
  // Окно ниже 242 px или уже 200 px уменьшаем равномерно, чтобы углы не наезжали друг на друга.
  const scale = Math.min(1, height / 242, width / 200);
  // ui_window: зелёная шапка занимает ровно 150 px исходника, ниже — белое тело.
  // Держим верхнюю кромку фиксированной (150), иначе середина шапки растягивается
  // вместе с окном и наезжает на текст. Нижняя белая кромка — 42 px.
  const frame = scene.add.nineslice(
    x, y, uiKey('ui_window'), undefined, width / scale, height / scale, 70, 70, 150, 42,
  ).setScale(scale).setDepth(depth);
  if (Number.isFinite(tint)) {
    frame.setTint(tint);
  }
  if (interactive) {
    frame.setInteractive();
  }
  return frame;
}

/** Белая плашка ui_panel (верхняя строка HUD, нижняя панель). */
export function panel(scene, x, y, width, height, options = {}) {
  const { tint = null, depth = 0 } = options;
  if (!scene.textures.exists(uiKey('ui_panel'))) {
    const fallback = scene.add.graphics().setDepth(depth);
    fallback.fillStyle(0xffffff, 0.95);
    fallback.fillRoundedRect(x, y, width, height, 24);
    fallback.lineStyle(2, 0xbad8e4, 1);
    fallback.strokeRoundedRect(x, y, width, height, 24);
    return fallback;
  }
  // У ui_panel (1061x162) декоративные листья по краям (~95 px). Рамка масштабируется
  // равномерно по высоте, растягивается только середина: иначе листья сплющиваются.
  const scale = Math.min(1, height / PANEL_SOURCE_H);
  const slice = scene.add.nineslice(
    x, y, uiKey('ui_panel'), undefined, width / scale, height / scale, 96, 96, 28, 28,
  ).setOrigin(0, 0).setScale(scale).setDepth(depth);
  if (Number.isFinite(tint)) {
    slice.setTint(tint);
  }
  return slice;
}

/** Гладкая карточка: ровная часть ui_panel с закруглёнными углами, крашеная в tint. */
function plateTexture(scene, tint) {
  // В headless-тестах у mock-сцены может не быть менеджера текстур.
  if (!scene.textures || typeof scene.textures.get !== 'function') {
    return null;
  }
  const source = scene.textures.exists(uiKey('ui_panel'))
    ? scene.textures.get(uiKey('ui_panel')).getSourceImage()
    : null;
  if (!source) {
    return null;
  }
  const key = `iso_plate_${tint.toString(16)}`;
  if (scene.textures.exists(key)) {
    return key;
  }
  const canvas = scene.textures.createCanvas(key, PLATE_SIZE, PLATE_SIZE);
  if (!canvas) {
    return null;
  }
  const ctx = canvas.getContext();
  ctx.drawImage(
    source,
    PLATE_CROP.x, PLATE_CROP.y, PLATE_CROP.w, PLATE_CROP.h,
    0, 0, PLATE_SIZE, PLATE_SIZE,
  );
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = colorCss(tint, 1);
  ctx.fillRect(0, 0, PLATE_SIZE, PLATE_SIZE);
  ctx.globalCompositeOperation = 'destination-in';
  const r = PLATE_RADIUS;
  const s = PLATE_SIZE;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(s - r, 0);
  ctx.quadraticCurveTo(s, 0, s, r);
  ctx.lineTo(s, s - r);
  ctx.quadraticCurveTo(s, s, s - r, s);
  ctx.lineTo(r, s);
  ctx.quadraticCurveTo(0, s, 0, s - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  canvas.refresh();
  return key;
}

/** Прямоугольная карточка в стиле кита. options: { tint, depth } */
export function plate(scene, x, y, width, height, options = {}) {
  const { tint = 0xffffff, depth = 0 } = options;
  const key = plateTexture(scene, tint);
  if (!key) {
    const fallback = scene.add.graphics().setDepth(depth);
    fallback.fillStyle(tint, 1);
    fallback.fillRoundedRect(x - width / 2, y - height / 2, width, height, PLATE_RADIUS);
    return fallback;
  }
  return scene.add
    .nineslice(x, y, key, undefined, width, height, 20, 20, 20, 20)
    .setDepth(depth);
}

/** Полоска прогресса из ui_bar/ui_bar_fill. Возвращает { root, setProgress }. */
export function progressBar(scene, x, y, width, height, options = {}) {
  const { depth = 0 } = options;
  const root = scene.add.container(0, 0).setDepth(depth);
  const hasFrame = scene.textures.exists(uiKey('ui_bar'));
  const frame = hasFrame
    ? scene.add.image(x, y, uiKey('ui_bar')).setOrigin(0, 0).setDisplaySize(width, height)
    : scene.add.graphics();
  if (!hasFrame) {
    frame.fillStyle(0xb9d4df, 1).fillRoundedRect(x, y, width, height, height / 2);
  }
  root.add(frame);
  const inset = Math.max(5, Math.round(height * 0.3));
  const inner = width - inset * 2;
  const fillHeight = Math.max(4, height - inset * 2);
  const hasFill = scene.textures.exists(uiKey('ui_bar_fill'));
  const fill = hasFill
    ? scene.add
      .image(x + inset, y + height / 2, uiKey('ui_bar_fill'))
      .setOrigin(0, 0.5)
      .setDisplaySize(inner, fillHeight)
    : scene.add.rectangle(x + inset, y + height / 2, inner, fillHeight, 0x43a047).setOrigin(0, 0.5);
  root.add(fill);
  let ratio = 0;
  const setProgress = (value) => {
    ratio = Math.max(0, Math.min(1, Number(value) || 0));
    fill.setVisible(ratio > 0);
    if (ratio <= 0) {
      return;
    }
    fill.setDisplaySize(Math.max(6, inner * ratio), fillHeight);
  };
  setProgress(0);
  return { root, fill, setProgress, ratio: () => ratio };
}

export function text(scene, x, y, value, options = {}) {
  const {
    size = 18, color = UI_INK, bold = false, origin = [0, 0], depth = 0,
    wrap = null, align = 'left', stroke = null, strokeThickness = 0,
  } = options;
  return scene.add.text(x, y, value, {
    fontFamily: UI_FONT,
    fontSize: `${Math.max(16, size)}px`,
    fontStyle: bold ? 'bold' : 'normal',
    color,
    stroke: stroke || undefined,
    strokeThickness,
    align,
    lineSpacing: options.lineSpacing || 6,
    wordWrap: wrap ? { width: wrap } : undefined,
  }).setOrigin(origin[0], origin[1]).setDepth(depth);
}
