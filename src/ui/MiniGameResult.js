import { createButton } from './Button.js';
import { MG_FONT, drawStarShape } from './minigameDrawing.js';

const W = 1280;
const H = 720;

export function showMiniGameResult(scene, result, onContinue) {
  const skipped = result.reason === 'skip';
  const timeout = result.reason === 'timeout';
  let title = 'Можно было лучше';

  if (skipped) {
    title = 'Приём пропущен';
  } else if (timeout) {
    title = 'Время вышло';
  } else if (result.stars === 3) {
    title = 'Отличная работа!';
  } else if (result.stars === 2) {
    title = 'Хорошо!';
  }

  const root = scene.add.container(0, 0).setDepth(100);
  const backdrop = scene.add
    .rectangle(W / 2, H / 2, W, H, 0x10222e, 0.62)
    .setInteractive();
  root.add(backdrop);

  const panel = scene.add.graphics();
  panel.fillStyle(0x0b1e28, 0.3);
  panel.fillRoundedRect(338, 150, 620, 430, 26);
  panel.fillStyle(0xffffff, 1);
  panel.fillRoundedRect(330, 140, 620, 430, 26);
  panel.fillStyle(result.stars > 0 ? 0x3f9b4a : 0xc07a4a, 1);
  panel.fillRoundedRect(330, 140, 620, 78, { tl: 26, tr: 26, bl: 0, br: 0 });
  panel.fillStyle(0x0b1e28, 0.18);
  panel.fillRoundedRect(330, 140, 620, 78, { tl: 26, tr: 26, bl: 0, br: 0 });
  panel.lineStyle(3, 0x8fb7c7, 1);
  panel.strokeRoundedRect(330, 140, 620, 430, 26);
  root.add(panel);

  root.add(
    scene.add
      .text(640, 179, title, {
        fontFamily: MG_FONT,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5),
  );

  const starsG = scene.add.graphics();
  for (let i = 0; i < 3; i += 1) {
    const filled = i < result.stars;
    drawStarShape(
      starsG,
      550 + i * 90,
      282,
      40,
      filled ? 0xf6c343 : 0xc7d3d9,
      filled ? 1 : 0.7,
    );
  }
  root.add(starsG);

  const rewardLine = result.coins > 0 || result.xp > 0
    ? `+${result.coins} монет   •   +${result.xp} опыта`
    : 'Награды за приём нет';
  const reputationLine = result.reputation >= 0
    ? `Репутация +${result.reputation}`
    : `Репутация ${result.reputation}`;

  root.add(
    scene.add
      .text(640, 352, rewardLine, {
        fontFamily: MG_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#2f5d6b',
      })
      .setOrigin(0.5),
  );

  root.add(
    scene.add
      .text(640, 390, reputationLine, {
        fontFamily: MG_FONT,
        fontSize: '19px',
        color: result.reputation >= 0 ? '#2e7d32' : '#c62828',
      })
      .setOrigin(0.5),
  );

  root.add(
    scene.add
      .text(
        640,
        430,
        result.stars > 0
          ? 'Пациент доволен и уходит.'
          : 'Пациент уходит расстроенным.',
        {
          fontFamily: MG_FONT,
          fontSize: '18px',
          color: '#5b7f8c',
        },
      )
      .setOrigin(0.5),
  );

  const nextButton = createButton(scene, 640, 515, 'Дальше', onContinue, {
    width: 240,
    height: 56,
    fontSize: 23,
    color: 0x3f9b4a,
    hoverColor: 0x55b963,
  });
  root.add(nextButton);

  root.setAlpha(0);
  scene.tweens.add({
    targets: root,
    alpha: 1,
    duration: 160,
    ease: 'Quad.easeOut',
  });

  return root;
}

export default showMiniGameResult;
