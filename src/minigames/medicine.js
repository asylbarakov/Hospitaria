import { DISEASES } from '../data/diseases.js';
import { MG_FONT } from '../ui/minigameDrawing.js';

const CARD_WIDTH = 370;
const CARD_HEIGHT = 126;
const CARD_POSITIONS = [
  { x: 450, y: 330 },
  { x: 830, y: 330 },
  { x: 450, y: 475 },
  { x: 830, y: 475 },
];

function pickDistractors(correctMedicine) {
  const names = DISEASES
    .map((item) => item.medicine)
    .filter((name) => name !== correctMedicine);

  for (let i = names.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }

  return names.slice(0, 3);
}

function paintCard(g, state) {
  const fill = state === 'correct'
    ? 0xd7f5dc
    : state === 'wrong'
      ? 0xfde2e2
      : 0xffffff;
  const border = state === 'correct'
    ? 0x43a047
    : state === 'wrong'
      ? 0xe57373
      : 0x9fc3d1;

  g.clear();
  g.fillStyle(0x0b1e28, 0.12);
  g.fillRoundedRect(-CARD_WIDTH / 2 + 5, -CARD_HEIGHT / 2 + 7, CARD_WIDTH, CARD_HEIGHT, 18);
  g.fillStyle(fill, 1);
  g.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 18);
  g.lineStyle(4, border, 1);
  g.strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, 18);
}

export function createMedicine(scene, root, ctx) {
  const disease = ctx.disease;
  const symptom = disease.symptoms[Math.floor(Math.random() * disease.symptoms.length)];
  const correct = disease.medicine;
  const options = [correct, ...pickDistractors(correct)]
    .sort(() => Math.random() - 0.5)
    .map((medicine) => ({ medicine, correct: medicine === correct }));

  let wrongCount = 0;
  let answered = false;
  let earnedStars = 0;
  let finishDelay = 0;
  let done = false;

  const title = scene.add
    .text(640, 152, 'Выберите правильное лекарство по симптому', {
      fontFamily: MG_FONT,
      fontSize: '27px',
      fontStyle: 'bold',
      color: '#2f5d6b',
    })
    .setOrigin(0.5);
  root.add(title);

  const question = scene.add
    .text(640, 205, `Что подойдёт при симптоме:\n«${symptom}»?`, {
      fontFamily: MG_FONT,
      fontSize: '22px',
      color: '#3f5f6b',
      align: 'center',
      lineSpacing: 6,
      wordWrap: { width: 900 },
    })
    .setOrigin(0.5, 0);
  root.add(question);

  const status = scene.add
    .text(640, 568, 'Выберите один из четырёх вариантов', {
      fontFamily: MG_FONT,
      fontSize: '20px',
      color: '#5b7f8c',
    })
    .setOrigin(0.5);
  root.add(status);

  const cards = options.map((option, index) => {
    const position = CARD_POSITIONS[index];
    const container = scene.add.container(position.x, position.y);
    const bg = scene.add.graphics();
    paintCard(bg, 'idle');

    const label = scene.add
      .text(0, 0, option.medicine, {
        fontFamily: MG_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#24444f',
        align: 'center',
        wordWrap: { width: CARD_WIDTH - 46 },
      })
      .setOrigin(0.5);

    const zone = scene.add
      .zone(0, 0, CARD_WIDTH, CARD_HEIGHT)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerdown', () => choose(index));

    container.add([bg, label, zone]);
    root.add(container);

    return { container, bg, zone, option };
  });

  function choose(index) {
    if (answered || done) {
      return;
    }

    const card = cards[index];
    if (!card) {
      return;
    }

    if (card.option.correct) {
      answered = true;
      earnedStars = Math.max(1, 3 - wrongCount);
      paintCard(card.bg, 'correct');
      status.setText('Верно! Это лекарство подойдёт.');
      status.setColor('#2e7d32');
      cards.forEach((item) => item.zone.disableInteractive());
      finishDelay = 850;
      return;
    }

    if (card.zone.input && card.zone.input.enabled) {
      wrongCount += 1;
      paintCard(card.bg, 'wrong');
      card.zone.disableInteractive();
      status.setText('Не подходит. Попробуйте другое.');
      status.setColor('#c62828');

      scene.tweens.add({
        targets: card.container,
        x: card.container.x + 8,
        duration: 70,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          card.container.x = CARD_POSITIONS[index].x;
        },
      });
    }
  }

  return {
    update(delta) {
      if (!answered || done) {
        return;
      }

      finishDelay -= delta;
      if (finishDelay <= 0) {
        done = true;
        ctx.finish(earnedStars, 'complete');
      }
    },
    choose,
    cards,
    get wrongCount() {
      return wrongCount;
    },
  };
}

export default createMedicine;
