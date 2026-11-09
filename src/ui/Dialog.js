import { createButton } from './Button.js';
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

  const panel = scene.add.graphics();
  panel.fillStyle(0x0b1e28, 0.28);
  panel.fillRoundedRect(PANEL_X + 8, PANEL_Y + 10, PANEL_W, PANEL_H, 26);
  panel.fillStyle(0xffffff, 1);
  panel.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 26);
  panel.fillStyle(accent, 1);
  panel.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, 82, {
    tl: 26,
    tr: 26,
    bl: 0,
    br: 0,
  });
  panel.fillStyle(0x0b1e28, 0.2);
  panel.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, 82, {
    tl: 26,
    tr: 26,
    bl: 0,
    br: 0,
  });
  panel.lineStyle(3, 0x8fb7c7, 1);
  panel.strokeRoundedRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 26);

  const titleText = scene.add
    .text(W / 2, PANEL_Y + 40, title, {
      fontFamily: HUD_FONT,
      fontSize: '29px',
      fontStyle: 'bold',
      color: '#ffffff',
    })
    .setOrigin(0.5);

  const children = [backdrop, panel, titleText];

  if (subtitle) {
    children.push(
      scene.add
        .text(W / 2, PANEL_Y + 68, subtitle, {
          fontFamily: HUD_FONT,
          fontSize: '15px',
          color: '#eaf4f8',
        })
        .setOrigin(0.5),
    );
  }

  children.push(
    scene.add
      .text(PANEL_X + 42, PANEL_Y + 108, text, {
        fontFamily: HUD_FONT,
        fontSize: '18px',
        color: '#24444f',
        lineSpacing: 7,
        wordWrap: { width: PANEL_W - 84 },
      })
      .setOrigin(0, 0),
  );

  const list = buttons.slice(0, 3);
  const buttonWidth = list.length > 1 ? 230 : 260;
  const gap = 26;
  const totalWidth = list.length * buttonWidth + (list.length - 1) * gap;
  const startX = W / 2 - totalWidth / 2 + buttonWidth / 2;
  const buttonY = PANEL_Y + PANEL_H - 58;

  list.forEach((item, index) => {
    const button = createButton(
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
