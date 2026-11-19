// UI-кит изометрии (этап 19): PNG-рамки и кнопки из assets/final/ui.
// Все экраны рисуют панели, окна, кнопки и полоски через этот модуль.
// Если PNG не загрузился (например, старые сцены v0.1), остаётся код-рисованный запас.

import { createButton } from './Button.js';
import { playClick } from '../systems/Sound.js';
import { uiKey } from '../iso/isoAssets.js';
import { UI_FONT, BUTTON_COLORS } from './uiTheme.js';
import {
  panel, windowFrame, progressBar, plate, text,
} from './IsoUiParts.js';

const BUTTON_SOURCE_H = 104;

export const UI_FILES = [
  'ui/ui_window.png', 'ui/ui_panel.png', 'ui/ui_bar.png', 'ui/ui_bar_fill.png',
  'ui/ui_button.png', 'ui/ui_button_hover.png', 'ui/ui_button_down.png',
];

/** Копия PNG-кнопки, подкрашенная в цвет варианта (блики и рамка сохраняются). */
function tintedTexture(scene, source, variant) {
  const key = `${source}_${variant}`;
  if (scene.textures.exists(key)) {
    return key;
  }
  const image = scene.textures.exists(source) ? scene.textures.get(source).getSourceImage() : null;
  if (!image) {
    return null;
  }
  const canvas = scene.textures.createCanvas(key, image.width, image.height);
  if (!canvas) {
    return null;
  }
  const ctx = canvas.getContext();
  ctx.drawImage(image, 0, 0);
  const color = BUTTON_COLORS[variant] || BUTTON_COLORS.green;
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.82)`;
  ctx.fillRect(0, 0, image.width, image.height);
  ctx.globalCompositeOperation = 'source-over';
  canvas.refresh();
  return key;
}

export function ensureUiTextures(scene) {
  ['ui_button', 'ui_button_hover', 'ui_button_down'].forEach((name) => {
    const source = uiKey(name);
    if (!scene.textures.exists(source)) {
      return;
    }
    Object.keys(BUTTON_COLORS).forEach((variant) => tintedTexture(scene, source, variant));
  });
}

function stateTexture(scene, state, variant) {
  const base = state === 'hover'
    ? 'ui_button_hover'
    : (state === 'down' ? 'ui_button_down' : 'ui_button');
  return tintedTexture(scene, uiKey(base), variant) || uiKey('ui_button');
}

function variantName(options) {
  if (options.variant && BUTTON_COLORS[options.variant]) {
    return options.variant;
  }
  const color = Number(options.color);
  let best = 'green';
  let distance = Infinity;
  Object.entries(BUTTON_COLORS).forEach(([name, value]) => {
    const dr = ((value >> 16) & 255) - ((color >> 16) & 255);
    const dg = ((value >> 8) & 255) - ((color >> 8) & 255);
    const db = (value & 255) - (color & 255);
    const d = dr * dr + dg * dg + db * db;
    if (d < distance) {
      best = name;
      distance = d;
    }
  });
  return best;
}

/**
 * Кнопка на PNG-рамке. Возвращает контейнер с подписью в `label`.
 * options: { width, height, fontSize, variant|color, disabled, depth, active, hoverColor }
 */
export function button(scene, x, y, label, onClick, options = {}) {
  const {
    width = 220,
    height = 56,
    fontSize = 20,
    disabled = false,
    depth = 0,
    active = false,
  } = options;
  const variant = disabled ? 'gray' : variantName(options);
  if (!scene.textures.exists(uiKey('ui_button'))) {
    return createButton(scene, x, y, label, onClick, {
      width,
      height,
      fontSize,
      color: options.color || BUTTON_COLORS[variant],
      hoverColor: options.hoverColor || options.color || BUTTON_COLORS[variant],
      disabled,
      depth,
    });
  }

  ensureUiTextures(scene);
  const container = scene.add.container(x, y).setDepth(depth);
  // Рамка кнопки масштабируется равномерно по высоте (104 px в PNG), растягивается
  // только середина по ширине: иначе углы и блики сплющиваются.
  const sliceScale = height / BUTTON_SOURCE_H;
  const bg = scene.add.nineslice(
    0, 0, stateTexture(scene, active ? 'hover' : 'normal', variant), undefined,
    width / sliceScale, BUTTON_SOURCE_H, 54, 54, 30, 30,
  ).setScale(sliceScale);
  const caption = scene.add
    .text(0, -1, label, {
      fontFamily: UI_FONT,
      fontSize: `${Math.max(16, fontSize)}px`,
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: width - 34 },
      shadow: { offsetX: 0, offsetY: 2, color: 'rgba(6, 40, 34, 0.45)', blur: 3, fill: true },
    })
    .setOrigin(0.5);
  // Длинная подпись (например, «Обезвоживание») не должна вылезать за рамку:
  // аккуратно уменьшаем её, если не влезает по ширине.
  const maxLabelWidth = width - 26;
  if (caption.width > maxLabelWidth) {
    caption.setScale(maxLabelWidth / caption.width);
  }
  container.add([bg, caption]);
  container.label = caption;
  container.uiVariant = variant;

  const paint = (state) => bg.setTexture(stateTexture(scene, state, variant));
  container.setActiveState = (value) => {
    bg.setTexture(stateTexture(scene, value ? 'hover' : 'normal', variant));
  };
  container.setDisabled = (value) => {
    const next = value ? 'gray' : variant;
    bg.setTexture(stateTexture(scene, 'normal', next));
    container.setAlpha(value ? 0.7 : 1);
  };

  if (disabled) {
    // Полупрозрачность мягкая: подпись должна оставаться читаемой (этап 19).
    container.setAlpha(0.86);
    container.setDisabled = () => {};
    return container;
  }

  const zone = scene.add
    .zone(0, 0, width, height)
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
  container.add(zone);

  const scaleTo = (value, duration) => {
    scene.tweens.killTweensOf(container);
    scene.tweens.add({ targets: container, scale: value, duration, ease: 'Quad.easeOut' });
  };
  zone.on('pointerover', () => {
    paint('hover');
    scaleTo(1.035, 90);
  });
  zone.on('pointerout', () => {
    paint(active ? 'hover' : 'normal');
    scaleTo(1, 90);
  });
  zone.on('pointerdown', () => {
    paint('down');
    scaleTo(0.97, 50);
  });
  zone.on('pointerup', () => {
    paint('hover');
    scaleTo(1.035, 80);
    playClick();
    onClick();
  });
  return container;
}

export { panel, windowFrame, progressBar, plate, text };
export { UI_FONT, UI_INK, UI_MUTED, BUTTON_COLORS } from './uiTheme.js';
export default {
  button, windowFrame, panel, progressBar, plate, text, ensureUiTextures, UI_FILES,
};
