import { createButton } from '../ui/Button.js';
import { MG_FONT } from '../ui/minigameDrawing.js';

const TRACK_LEFT = 260;
const TRACK_RIGHT = 1020;
const TRACK_Y = 380;
const TRACK_WIDTH = TRACK_RIGHT - TRACK_LEFT;
const ROUNDS = 3;
const FEEDBACK_TIME = 700;
const HIT_TOLERANCE = 0.09;

export function createInjection(scene, root, ctx) {
  let round = 0;
  let hits = 0;
  let needleT = 0;
  let zoneT = 0;
  let phase = 'moving';
  let feedback = 0;
  let done = false;

  const track = scene.add.graphics();
  track.fillStyle(0xcfdfe8, 1);
  track.fillRoundedRect(TRACK_LEFT, TRACK_Y - 18, TRACK_WIDTH, 36, 18);
  track.lineStyle(3, 0x8fb7c7, 1);
  track.strokeRoundedRect(TRACK_LEFT, TRACK_Y - 18, TRACK_WIDTH, 36, 18);
  track.lineStyle(2, 0xffffff, 0.45);
  for (let i = 1; i < 10; i += 1) {
    const x = TRACK_LEFT + (TRACK_WIDTH / 10) * i;
    track.lineBetween(x, TRACK_Y - 12, x, TRACK_Y + 12);
  }
  root.add(track);

  const zone = scene.add.container(TRACK_LEFT, TRACK_Y);
  const zoneG = scene.add.graphics();
  zoneG.fillStyle(0x66bb6a, 0.85);
  zoneG.fillRoundedRect(-61, -22, 122, 44, 12);
  zoneG.lineStyle(3, 0x2e7d32, 1);
  zoneG.strokeRoundedRect(-61, -22, 122, 44, 12);
  zone.add(zoneG);
  root.add(zone);

  const needle = scene.add.container(TRACK_LEFT, TRACK_Y);
  const needleG = scene.add.graphics();
  needleG.fillStyle(0xffffff, 1);
  needleG.fillRoundedRect(-10, -84, 20, 58, 7);
  needleG.lineStyle(2, 0x90a4ae, 1);
  needleG.strokeRoundedRect(-10, -84, 20, 58, 7);
  needleG.fillStyle(0x90caf9, 1);
  needleG.fillRoundedRect(-6, -60, 12, 30, 4);
  needleG.fillStyle(0x78909c, 1);
  needleG.fillRoundedRect(-2, -26, 4, 48, 2);
  needleG.fillTriangle(-5, 20, 5, 20, 0, 34);
  needle.add(needleG);
  root.add(needle);

  const title = scene.add
    .text(640, 150, 'Укол / капельница: попадите иглой в зелёную зону', {
      fontFamily: MG_FONT,
      fontSize: '27px',
      fontStyle: 'bold',
      color: '#2f5d6b',
    })
    .setOrigin(0.5);
  root.add(title);

  const roundText = scene.add
    .text(640, 195, '', {
      fontFamily: MG_FONT,
      fontSize: '20px',
      color: '#5b7f8c',
    })
    .setOrigin(0.5);
  root.add(roundText);

  const status = scene.add
    .text(640, 245, '', {
      fontFamily: MG_FONT,
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#3f8fb0',
    })
    .setOrigin(0.5);
  root.add(status);

  const starsText = scene.add
    .text(640, 475, '☆☆☆', {
      fontFamily: MG_FONT,
      fontSize: '52px',
      color: '#f6c343',
    })
    .setOrigin(0.5);
  root.add(starsText);

  const shootButton = createButton(scene, 640, 565, 'Сделать укол', () => shoot(), {
    width: 290,
    height: 64,
    fontSize: 24,
    color: 0x3f8fb0,
    hoverColor: 0x57a8c9,
  });
  root.add(shootButton);

  const toPosition = (value) => {
    const cycle = value % 2;
    return cycle <= 1 ? cycle : 2 - cycle;
  };

  const updateStars = () => {
    starsText.setText(`${'★'.repeat(hits)}${'☆'.repeat(Math.max(0, ROUNDS - hits))}`);
  };

  const updatePositions = () => {
    needle.setX(TRACK_LEFT + toPosition(needleT) * TRACK_WIDTH);
    zone.setX(TRACK_LEFT + toPosition(zoneT) * TRACK_WIDTH);
  };

  const startRound = () => {
    round += 1;
    needleT = Math.random() * 2;
    zoneT = Math.random() * 2;
    phase = 'moving';
    roundText.setText(`Попытка ${round} из ${ROUNDS}`);
    status.setText('Нажмите «Сделать укол», когда игла в зелёной зоне');
    status.setColor('#3f8fb0');
    updatePositions();
  };

  function shoot() {
    if (phase !== 'moving' || done) {
      return;
    }

    phase = 'feedback';
    const distance = Math.abs(toPosition(needleT) - toPosition(zoneT));
    const inside = distance <= HIT_TOLERANCE;

    if (inside) {
      hits += 1;
      status.setText('Точно!');
      status.setColor('#2e7d32');
    } else {
      status.setText('Мимо!');
      status.setColor('#c62828');
    }

    updateStars();
    feedback = FEEDBACK_TIME;
  }

  updateStars();
  startRound();

  return {
    update(delta) {
      if (done) {
        return;
      }

      if (phase === 'moving') {
        needleT += delta * (0.00065 + (round - 1) * 0.0001);
        zoneT += delta * (0.00032 + (round - 1) * 0.00005);
        updatePositions();
        return;
      }

      feedback -= delta;
      if (feedback <= 0) {
        if (round >= ROUNDS) {
          done = true;
          ctx.finish(hits, 'complete');
        } else {
          startRound();
        }
      }
    },
    shoot,
    setPositionsForTest(needleValue, zoneValue) {
      needleT = needleValue;
      zoneT = zoneValue;
      updatePositions();
    },
    get hits() {
      return hits;
    },
    get round() {
      return round;
    },
  };
}

export default createInjection;
