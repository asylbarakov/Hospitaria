import { createButton } from './Button.js';
import { HUD_FONT } from './hudDrawing.js';

const W = 1280;
const H = 720;

export function openHelpPanel(scene, onClose) {
  const root = scene.add.container(0, 0).setDepth(150);

  const backdrop = scene.add
    .rectangle(W / 2, H / 2, W, H, 0x10222e, 0.58)
    .setInteractive();

  backdrop.on('pointerup', (pointer) => {
    const insidePanel = pointer.x > 330
      && pointer.x < 950
      && pointer.y > 120
      && pointer.y < 600;
    if (!insidePanel) {
      onClose();
    }
  });

  const panel = scene.add.graphics();
  panel.fillStyle(0x0b1e28, 0.25);
  panel.fillRoundedRect(338, 130, 620, 480, 26);
  panel.fillStyle(0xffffff, 1);
  panel.fillRoundedRect(330, 120, 620, 480, 26);
  panel.fillStyle(0x3f9b4a, 1);
  panel.fillRoundedRect(330, 120, 620, 74, { tl: 26, tr: 26, bl: 0, br: 0 });
  panel.lineStyle(3, 0x8fb7c7, 1);
  panel.strokeRoundedRect(330, 120, 620, 480, 26);

  const title = scene.add
    .text(640, 157, 'Как играть', {
      fontFamily: HUD_FONT,
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#ffffff',
    })
    .setOrigin(0.5);

  const body = [
    '• Кликните по полу — персонаж подойдёт к выбранному месту.',
    '',
    '• Кликните по пациенту — он пойдёт в нужную комнату, а вы за ним.',
    '',
    '• Стрелки ← → или A / D — ходьба с клавиатуры.',
    '',
    '• Кнопка «Меню» или Esc — пауза: можно продолжить, выйти в меню или сбросить сохранение.',
    '',
    '• Панель сверху показывает комнату, монеты, уровень, опыт и репутацию.',
  ].join('\n');

  const bodyText = scene.add
    .text(370, 215, body, {
      fontFamily: HUD_FONT,
      fontSize: '17px',
      color: '#24444f',
      lineSpacing: 8,
      wordWrap: { width: 540 },
    })
    .setOrigin(0, 0);

  const disclaimer = scene.add
    .text(
      640,
      468,
      'Игра создана для развлечения и не является медицинским советом.',
      {
        fontFamily: HUD_FONT,
        fontSize: '15px',
        color: '#b05c5c',
        align: 'center',
        wordWrap: { width: 540 },
      },
    )
    .setOrigin(0.5, 0);

  const closeButton = createButton(scene, 640, 552, 'Понятно', onClose, {
    width: 240,
    height: 54,
    fontSize: 22,
    color: 0x3f9b4a,
    hoverColor: 0x55b963,
    depth: 4,
  });

  root.add([backdrop, panel, title, bodyText, disclaimer, closeButton]);
  root.setAlpha(0);

  scene.tweens.add({
    targets: root,
    alpha: 1,
    duration: 160,
    ease: 'Quad.easeOut',
  });

  return root;
}

export default openHelpPanel;
