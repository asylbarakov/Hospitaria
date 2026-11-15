import { button as uiButton, plate, windowFrame } from './IsoUi.js';
import { HUD_FONT } from './hudDrawing.js';

const W = 1280;
const H = 720;
const PANEL_X = 310;
const PANEL_Y = 108;
const PANEL_W = 660;
const PANEL_H = 474;

/**
 * Универсальное модальное окно.
 * options: { title, subtitle, text, accent, buttons, onClose }
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

  const panel = windowFrame(scene, W / 2, PANEL_Y + PANEL_H / 2, PANEL_W, PANEL_H);

  // Заголовок — тёмная табличка в шапке слева: по центру её перекрывает крест.
  const titleText = scene.add
    .text(PANEL_X + 48, PANEL_Y + 40, title, {
      fontFamily: HUD_FONT,
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#ffffff',
    })
    .setOrigin(0, 0.5);
  const titleW = Math.min(PANEL_W - 96, titleText.width + 44);
  const titlePlate = plate(scene, PANEL_X + 24 + titleW / 2, PANEL_Y + 40, titleW, 56, {
    tint: 0x123240,
  });

  const children = [backdrop, panel, titlePlate, titleText];

  // Подзаголовок и текст — уже на белом теле окна, ниже шапки.
  if (subtitle) {
    children.push(
      scene.add
        .text(PANEL_X + 42, PANEL_Y + 150, subtitle, {
          fontFamily: HUD_FONT,
          fontSize: '17px',
          fontStyle: 'bold',
          color: '#4d7b8a',
        })
        .setOrigin(0, 0),
    );
  }

  children.push(
    scene.add
      .text(PANEL_X + 42, PANEL_Y + 178, text, {
        fontFamily: HUD_FONT,
        fontSize: '18px',
        color: '#24444f',
        lineSpacing: 5,
        wordWrap: { width: PANEL_W - 84 },
      })
      .setOrigin(0, 0),
  );

  const list = buttons.slice(0, 3);
  const gap = 26;
  // Кнопки не должны вылезать за окно: при трёх вариантах ширина уменьшается.
  const available = PANEL_W - 72;
  const buttonWidth = list.length > 1
    ? Math.min(230, Math.floor((available - gap * (list.length - 1)) / list.length))
    : 260;
  const totalWidth = list.length * buttonWidth + (list.length - 1) * gap;
  const startX = W / 2 - totalWidth / 2 + buttonWidth / 2;
  const buttonY = PANEL_Y + PANEL_H - 58;

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
        height: 56,
        fontSize: 20,
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
