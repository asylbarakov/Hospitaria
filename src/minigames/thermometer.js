import { createButton } from '../ui/Button.js';
import { MG_FONT } from '../ui/minigameDrawing.js';

const TRACK_LEFT = 250;
const TRACK_RIGHT = 1030;
const TRACK_Y = 340;
const TRACK_WIDTH = TRACK_RIGHT - TRACK_LEFT;
const ROUNDS = 3;
const FEEDBACK_TIME = 700;

export function createThermometer(scene, root, ctx) {
  let round = 0;
  let hits = 0;
  let markerT = 0;
  let zoneStart = 0.3;
  const zoneWidth = 0.18;
  let phase = 'moving';
  let feedback = 0;
  let done = false;

  const track = scene.add.graphics();
  root.add(track);

  const marker = scene.add.container(TRACK_LEFT, TRACK_Y);
  const markerG = scene.add.graphics();
  markerG.fillStyle(0xffffff, 1);
  markerG.fillRoundedRect(-9, -38, 18, 76, 9);
  markerG.lineStyle(3, 0x90a4ae, 1);
  markerG.strokeRoundedRect(-9, -38, 18, 76, 9);
  markerG.fillStyle(0xe05c6e, 1);
  markerG.fillCircle(0, 20, 9);
  marker.add(markerG);
  root.add(marker);

  const title = scene.add
    .text(640, 150, 'Градусник: остановите бегунок в зелёной зоне', {
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
    .text(640, 242, '', {
      fontFamily: MG_FONT,
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#3f8fb0',
    })
    .setOrigin(0.5);
  root.add(status);

  const starsText = scene.add
    .text(640, 440, '☆☆☆', {
      fontFamily: MG_FONT,
      fontSize: '52px',
      color: '#f6c343',
    })
    .setOrigin(0.5);
  root.add(starsText);

  const stopButton = createButton(scene, 640, 555, 'Стоп', () => stopRound(), {
    width: 230,
    height: 64,
    fontSize: 27,
    color: 0x3f9b4a,
    hoverColor: 0x55b963,
  });
  root.add(stopButton);

  const getPosition = () => {
    const cycle = markerT % 2;
    return cycle <= 1 ? cycle : 2 - cycle;
  };

  const paintTrack = () => {
    track.clear();
    track.fillStyle(0xcfdfe8, 1);
    track.fillRoundedRect(TRACK_LEFT, TRACK_Y - 16, TRACK_WIDTH, 32, 16);

    track.fillStyle(0x66bb6a, 1);
    track.fillRoundedRect(
      TRACK_LEFT + zoneStart * TRACK_WIDTH,
      TRACK_Y - 16,
      zoneWidth * TRACK_WIDTH,
      32,
      10,
    );

    track.lineStyle(3, 0x8fb7c7, 1);
    track.strokeRoundedRect(TRACK_LEFT, TRACK_Y - 16, TRACK_WIDTH, 32, 16);

    track.lineStyle(2, 0xffffff, 0.5);
    for (let i = 1; i < 10; i += 1) {
      const x = TRACK_LEFT + (TRACK_WIDTH / 10) * i;
      track.lineBetween(x, TRACK_Y - 10, x, TRACK_Y + 10);
    }
  };

  const updateMarker = () => {
    marker.setX(TRACK_LEFT + getPosition() * TRACK_WIDTH);
  };

  const updateStars = () => {
    starsText.setText(`${'★'.repeat(hits)}${'☆'.repeat(Math.max(0, ROUNDS - hits))}`);
  };

  const startRound = () => {
    round += 1;
    zoneStart = 0.2 + Math.random() * 0.42;
    markerT = 0;
    phase = 'moving';
    roundText.setText(`Попытка ${round} из ${ROUNDS}`);
    status.setText('Нажмите «Стоп», когда бегунок в зелёной зоне');
    status.setColor('#3f8fb0');
    paintTrack();
    updateMarker();
  };

  function stopRound() {
    if (phase !== 'moving' || done) {
      return;
    }

    phase = 'feedback';
    const position = getPosition();
    const inside = position >= zoneStart && position <= zoneStart + zoneWidth;

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
        markerT += delta * (0.00055 + (round - 1) * 0.00012);
        updateMarker();
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
    stopRound,
    setMarkerForTest(value) {
      markerT = value;
      updateMarker();
    },
    get hits() {
      return hits;
    },
    get round() {
      return round;
    },
    get zoneStart() {
      return zoneStart;
    },
    get zoneWidth() {
      return zoneWidth;
    },
  };
}

export default createThermometer;
