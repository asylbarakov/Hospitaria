import { createButton } from './Button.js';
import { HUD_FONT } from './hudDrawing.js';

export function createBottomBar(scene, callbacks = {}) {
  const g = scene.add.graphics().setDepth(0);
  g.fillStyle(0x1b4b5a, 0.58);
  g.fillRoundedRect(24, 672, 596, 36, 18);
  g.lineStyle(2, 0xffffff, 0.2);
  g.strokeRoundedRect(24, 672, 596, 36, 18);

  scene.add
    .text(44, 690, 'Клик по полу — идти   •   Клик по пациенту — принять', {
      fontFamily: HUD_FONT,
      fontSize: '16px',
      color: '#ffffff',
    })
    .setOrigin(0, 0.5)
    .setDepth(2);

  createButton(scene, 700, 688, 'Магазин', callbacks.onShop, {
    width: 170,
    height: 48,
    fontSize: 19,
    color: 0x3f8fb0,
    hoverColor: 0x57a8c9,
    depth: 3,
  });

  createButton(scene, 890, 688, 'Задания', callbacks.onTasks, {
    width: 170,
    height: 48,
    fontSize: 19,
    color: 0x8a6d5b,
    hoverColor: 0xa88a76,
    depth: 3,
  });

  createButton(scene, 1234, 688, '?', callbacks.onHelp, {
    width: 52,
    height: 52,
    radius: 26,
    fontSize: 26,
    color: 0x5b7f8c,
    hoverColor: 0x729aa8,
    depth: 3,
  });
}

export default createBottomBar;
