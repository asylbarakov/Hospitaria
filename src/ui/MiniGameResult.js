import { button as uiButton, plate, text as uiText, windowFrame } from './IsoUi.js';
import { drawStarShape } from './minigameDrawing.js';

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

  root.add(windowFrame(scene, 640, 355, 620, 430));
  // Табличка заголовка слева в шапке, чтобы не спорить с крестом по центру.
  const titleText = uiText(scene, 374, 180, title, {
    size: 24, bold: true, color: '#ffffff', origin: [0, 0.5],
  });
  const titleW = Math.min(250, titleText.width + 40);
  root.add(plate(scene, 330 + 24 + titleW / 2, 180, titleW, 52, { tint: 0x123240 }));
  root.add(titleText);

  const starsG = scene.add.graphics();
  for (let i = 0; i < 3; i += 1) {
    const filled = i < result.stars;
    drawStarShape(
      starsG,
      550 + i * 90,
      300,
      40,
      filled ? 0xf6c343 : 0xc7d3d9,
      filled ? 1 : 0.7,
    );
  }
  root.add(starsG);

  const crystalPart = result.crystals > 0 ? `   •   +${result.crystals} кристалл` : '';
  const rewardLine = result.coins > 0 || result.xp > 0
    ? `+${result.coins} монет   •   +${result.xp} опыта${crystalPart}`
    : (result.crystals > 0 ? `+${result.crystals} кристалл` : 'Награды за приём нет');
  const reputationLine = result.reputation >= 0
    ? `Репутация +${result.reputation}`
    : `Репутация ${result.reputation}`;

  root.add(uiText(scene, 640, 366, rewardLine, {
    size: 24, bold: true, color: '#2f5d6b', origin: [0.5, 0.5],
  }));
  root.add(uiText(scene, 640, 404, reputationLine, {
    size: 19, color: result.reputation >= 0 ? '#2e7d32' : '#c62828', origin: [0.5, 0.5],
  }));
  root.add(uiText(
    scene,
    640,
    440,
    result.stars > 0 ? 'Пациент доволен и уходит.' : 'Пациент уходит расстроенным.',
    { size: 18, color: '#5b7f8c', origin: [0.5, 0.5] },
  ));

  const nextButton = uiButton(scene, 640, 518, 'Дальше', onContinue, {
    width: 240, height: 56, fontSize: 23, variant: 'green',
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
