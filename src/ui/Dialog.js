import { button as uiButton, plate, windowFrame } from './IsoUi.js';
import { HUD_FONT } from './hudDrawing.js';

const W = 1280;
const H = 720;
const PANEL_W = 840;
const PANEL_H = 540;
// Шапка ui_window (зелёная полоса с крестом) занимает верхние 150 px окна.
const HEADER_H = 150;
// Отступ текста от шапки; подзаголовок занимает строку перед текстом.
const CONTENT_TOP = HEADER_H + 26;
const SUBTITLE_STEP = 44;

/**
 * Универсальное модальное окно.
 * options: { title, subtitle, text, accent, buttons, onClose, width, height }
 * Заголовок и подзаголовок необязательны: без них текст начинается сразу под шапкой.
 * Возвращает { root, close }.
 */
export function openDialog(scene, options = {}) {
  const {
    title = '',
    subtitle = '',
    text = '',
    accent = 0x3f9b4a,
    buttons = [{ label: 'Понятно' }],
    onClose = null,
    width = PANEL_W,
    height = PANEL_H,
  } = options;

  const root = scene.add.container(0, 0).setDepth(200);
  let closed = false;

  const close = () => {
    if (closed) {
      return;
    }
    closed = true;
    root.destroy(true);
    if (onClose) {
      onClose();
    }
  };

  const backdrop = scene.add
    .rectangle(W / 2, H / 2, W, H, 0x10222e, 0.58)
    .setInteractive();
  backdrop.on('pointerup', close);

  const panelX = (W - width) / 2;
  const panelY = (H - height) / 2;
  const panel = windowFrame(scene, W / 2, panelY + height / 2, width, height);

  const children = [backdrop, panel];

  // Заголовок — тёмная табличка в шапке слева: по центру её перекрывает крест.
  // Без заголовка шапка остаётся декоративной (крест и блокнот).
  if (title) {
    const titleText = scene.add
      .text(panelX + 48, panelY + 40, title, {
        fontFamily: HUD_FONT,
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0, 0.5);
    const titleW = Math.min(width - 96, titleText.width + 44);
    const titlePlate = plate(scene, panelX + 24 + titleW / 2, panelY + 40, titleW, 62, {
      tint: 0x123240,
    });
    children.push(titlePlate, titleText);
  }

  // Подзаголовок и текст — на белом теле окна, ниже шапки.
  let contentTop = panelY + CONTENT_TOP;

  if (subtitle) {
    children.push(
      scene.add
        .text(panelX + 42, contentTop, subtitle, {
          fontFamily: HUD_FONT,
          fontSize: '24px',
          fontStyle: 'bold',
          color: '#4d7b8a',
        })
        .setOrigin(0, 0),
    );
    contentTop += SUBTITLE_STEP;
  }

  children.push(
    scene.add
      .text(panelX + 42, contentTop, text, {
        fontFamily: HUD_FONT,
        fontSize: '25px',
        color: '#24444f',
        lineSpacing: 6,
        wordWrap: { width: width - 84 },
      })
      .setOrigin(0, 0),
  );

  const list = buttons.slice(0, 3);
  const gap = 26;
  // Кнопки не должны вылезать за окно: при трёх вариантах ширина уменьшается.
  const available = width - 72;
  const buttonWidth = list.length > 1
    ? Math.min(260, Math.floor((available - gap * (list.length - 1)) / list.length))
    : 260;
  const totalWidth = list.length * buttonWidth + (list.length - 1) * gap;
  const startX = W / 2 - totalWidth / 2 + buttonWidth / 2;
  const buttonY = panelY + height - 62;

  list.forEach((item, index) => {
    const button = uiButton(
      scene,
      startX + index * (buttonWidth + gap),
      buttonY,
      item.label,
      () => {
        close();
        if (item.onClick) {
          item.onClick();
        }
      },
      {
        width: buttonWidth,
        height: 66,
        fontSize: 26,
        color: item.color || 0x3f9b4a,
        hoverColor: item.hoverColor || 0x55b963,
        depth: 4,
      },
    );
    children.push(button);
  });

  root.add(children);
  root.setAlpha(0);

  scene.tweens.add({
    targets: root,
    alpha: 1,
    duration: 150,
    ease: 'Quad.easeOut',
  });

  return { root, close };
}

export default openDialog;
