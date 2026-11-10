import { HUD_FONT } from './hudDrawing.js';
import { drawSymptomBubble } from '../systems/patientDrawing.js';

export function createAchievementCard(scene, parent, achievement, state, x, y) {
  const { unlocked, progress, ratio } = state;

  const bg = scene.add.graphics();
  bg.fillStyle(0x0b1e28, 0.07);
  bg.fillRoundedRect(-250 + 4, -28 + 5, 500, 56, 14);
  bg.fillStyle(unlocked ? 0xf1fbf2 : 0xf8fbfc, 1);
  bg.fillRoundedRect(-250, -28, 500, 56, 14);
  bg.lineStyle(2, unlocked ? 0xa5d6a7 : 0xc6dbe4, 1);
  bg.strokeRoundedRect(-250, -28, 500, 56, 14);

  bg.fillStyle(unlocked ? achievement.color : 0xb0bec5, 1);
  bg.fillCircle(-220, 0, 16);
  if (unlocked) {
    bg.lineStyle(3, 0xffffff, 1);
    bg.lineBetween(-227, 0, -221, 7);
    bg.lineBetween(-221, 7, -212, -8);
  } else {
    bg.lineStyle(2.5, 0xffffff, 1);
    bg.strokeRoundedRect(-226, -4, 12, 9, 2);
    bg.beginPath();
    bg.arc(-220, -4, 5, Math.PI, 0, false);
    bg.strokePath();
  }

  const title = scene.add
    .text(-196, -14, achievement.title, {
      fontFamily: HUD_FONT,
      fontSize: '16px',
      fontStyle: 'bold',
      color: unlocked ? '#24444f' : '#5b7f8c',
    })
    .setOrigin(0, 0.5);

  const description = scene.add
    .text(-196, 3, achievement.description, {
      fontFamily: HUD_FONT,
      fontSize: '11px',
      color: '#7c99a3',
      wordWrap: { width: 300 },
    })
    .setOrigin(0, 0.5);

  bg.fillStyle(0xcfdfe8, 1);
  bg.fillRoundedRect(-196, 16, 170, 6, 3);
  if (ratio > 0) {
    bg.fillStyle(unlocked ? 0x4caf50 : achievement.color, 1);
    bg.fillRoundedRect(-196, 16, Math.max(6, 170 * ratio), 6, 3);
  }

  const progressText = scene.add
    .text(236, -12, `${progress} / ${achievement.target}`, {
      fontFamily: HUD_FONT,
      fontSize: '13px',
      fontStyle: 'bold',
      color: unlocked ? '#2e7d32' : '#6b8e99',
    })
    .setOrigin(1, 0.5);

  const reward = scene.add
    .text(236, 10, unlocked ? 'Получено' : `+${achievement.reward} монет`, {
      fontFamily: HUD_FONT,
      fontSize: '12px',
      fontStyle: 'bold',
      color: unlocked ? '#2e7d32' : '#8a5a00',
    })
    .setOrigin(1, 0.5);

  const card = scene.add.container(x, y);
  card.add([bg, title, description, progressText, reward]);
  parent.add(card);
  return card;
}

export function createCollectionCard(scene, parent, disease, cured, x, y) {
  const bg = scene.add.graphics();
  bg.fillStyle(0x0b1e28, 0.07);
  bg.fillRoundedRect(-170 + 4, -31 + 5, 340, 62, 14);
  bg.fillStyle(cured ? 0xf8fbfc : 0xf2f4f5, 1);
  bg.fillRoundedRect(-170, -31, 340, 62, 14);
  bg.lineStyle(2, cured ? disease.color : 0xd5dee2, 1);
  bg.strokeRoundedRect(-170, -31, 340, 62, 14);

  const icon = scene.add.graphics().setPosition(-134, -4).setScale(0.62);
  drawSymptomBubble(icon, disease);
  if (!cured) {
    icon.setAlpha(0.28);
  }

  const name = scene.add
    .text(-96, -12, disease.name, {
      fontFamily: HUD_FONT,
      fontSize: '16px',
      fontStyle: 'bold',
      color: cured ? '#24444f' : '#7c99a3',
    })
    .setOrigin(0, 0.5);

  const status = scene.add
    .text(-96, 10, cured ? 'Вылечено' : 'Ещё не встречалось', {
      fontFamily: HUD_FONT,
      fontSize: '12px',
      color: cured ? '#2e7d32' : '#9fb0b7',
    })
    .setOrigin(0, 0.5);

  const mark = scene.add
    .text(150, 0, cured ? '✓' : '?', {
      fontFamily: HUD_FONT,
      fontSize: '24px',
      fontStyle: 'bold',
      color: cured ? '#2e7d32' : '#c2ced3',
    })
    .setOrigin(0.5);

  const card = scene.add.container(x, y);
  card.add([bg, icon, name, status, mark]);
  parent.add(card);
  return card;
}
