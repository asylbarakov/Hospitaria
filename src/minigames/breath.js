import { MG_FONT } from '../ui/minigameDrawing.js';

const TRACK_LEFT = 320;
const TRACK_RIGHT = 960;
const TRACK_WIDTH = TRACK_RIGHT - TRACK_LEFT;
const TRACK_Y = 360;
const ROUNDS = 3;
const FEEDBACK_TIME = 700;
const FILL_SPEED = 0.72;

export function createBreath(scene, root, ctx) {
  let round = 0;
  let hits = 0;
  let fill = 0;
  let zoneStart = 0.52;
  const zoneWidth = 0.18;
  let holding = false;
  let phase = 'idle';
  let feedback = 0;
  let done = false;

  const track = scene.add.graphics();
  root.add(track);

  const marker = scene.add.container(TRACK_LEFT, TRACK_Y);
  const markerG = scene.add.graphics();
  markerG.fillStyle(0xffffff, 1);
  markerG.fillCircle(0, 0, 20);
  markerG.lineStyle(4, 0x3f8fb0, 1);
  markerG.strokeCircle(0, 0, 20);
  markerG.fillStyle(0x81d4fa, 1);
  markerG.fillCircle(0, 0, 11);
  marker.add(markerG);
  root.add(marker);

  const title = scene.add
    .text(640, 150, 'Дыхание: удерживайте «Вдох» и отпустите в зелёной зоне', {
      fontFamily: MG_FONT,
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#2f5d6b',
    })
    .setOrigin(0.5);
  root.add(title);

  const roundText = scene.add
    .text(640, 196, '', {
      fontFamily: MG_FONT,
      fontSize: '20px',
      color: '#5b7f8c',
    })
    .setOrigin(0.5);
  root.add(roundText);

  const status = scene.add
    .text(640, 244, '', {
      fontFamily: MG_FONT,
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#3f8fb0',
    })
    .setOrigin(0.5);
  root.add(status);

  const starsText = scene.add
    .text(640, 448, '☆☆☆', {
      fontFamily: MG_FONT,
      fontSize: '52px',
      color: '#f6c343',
    })
    .setOrigin(0.5);
  root.add(starsText);

  const button = scene.add.container(640, 540);
  const buttonBg = scene.add.graphics();
  const paintButton = (active) => {
    buttonBg.clear();
    buttonBg.fillStyle(0x0b1e28, 0.16);
    buttonBg.fillRoundedRect(-160, -38, 320, 84, 24);
    buttonBg.fillStyle(active ? 0x3f9b4a : 0x3f8fb0, 1);
    buttonBg.fillRoundedRect(-160, -44, 320, 84, 24);
    buttonBg.lineStyle(3, 0xffffff, 0.5);
    buttonBg.strokeRoundedRect(-160, -44, 320, 84, 24);
  };
  paintButton(false);

  const buttonLabel = scene.add
    .text(0, -2, 'Вдох', {
      fontFamily: MG_FONT,
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#ffffff',
    })
    .setOrigin(0.5);

  const buttonZone = scene.add
    .zone(0, 0, 320, 84)
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

  button.add([buttonBg, buttonLabel, buttonZone]);
  root.add(button);

  const paintTrack = () => {
    track.clear();
    track.fillStyle(0xcfdfe8, 1);
    track.fillRoundedRect(TRACK_LEFT, TRACK_Y - 18, TRACK_WIDTH, 36, 18);

    track.fillStyle(0x66bb6a, 1);
    track.fillRoundedRect(
      TRACK_LEFT + zoneStart * TRACK_WIDTH,
      TRACK_Y - 18,
      zoneWidth * TRACK_WIDTH,
      36,
      12,
    );

    track.fillStyle(0x81d4fa, 0.9);
    track.fillRoundedRect(
      TRACK_LEFT,
      TRACK_Y - 8,
      Math.max(8, fill * TRACK_WIDTH),
      16,
      8,
    );

    track.lineStyle(3, 0x8fb7c7, 1);
    track.strokeRoundedRect(TRACK_LEFT, TRACK_Y - 18, TRACK_WIDTH, 36, 18);

    marker.setX(TRACK_LEFT + fill * TRACK_WIDTH);
  };

  const updateStars = () => {
    starsText.setText(`${'★'.repeat(hits)}${'☆'.repeat(Math.max(0, ROUNDS - hits))}`);
  };

  const startRound = () => {
    round += 1;
    fill = 0;
    zoneStart = 0.48 + Math.random() * 0.3;
    phase = 'idle';
    holding = false;
    buttonLabel.setText('Вдох');
    paintButton(false);
    roundText.setText(`Подход ${round} из ${ROUNDS}`);
    status.setText('Нажмите и удерживайте кнопку, затем отпустите в зелёной зоне');
    status.setColor('#3f8fb0');
    paintTrack();
  };

  function press() {
    if (phase !== 'idle' || done) {
      return;
    }
    phase = 'holding';
    holding = true;
    fill = 0;
    buttonLabel.setText('Держите...');
    paintButton(true);
    status.setText('Наполняйте шкалу — не переусердствуйте');
    status.setColor('#2f5d6b');
  }

  function release() {
    if (!holding || done) {
      return;
    }

    holding = false;
    phase = 'feedback';
    paintButton(false);
    buttonLabel.setText('Вдох');

    const inside = fill >= zoneStart && fill <= zoneStart + zoneWidth;
    if (inside) {
      hits += 1;
      status.setText('Отличный вдох!');
      status.setColor('#2e7d32');
    } else {
      status.setText(fill >= 1 ? 'Слишком глубоко!' : 'Немного мимо');
      status.setColor('#c62828');
    }

    updateStars();
    feedback = FEEDBACK_TIME;
  }

  buttonZone.on('pointerdown', press);
  buttonZone.on('pointerup', release);
  buttonZone.on('pointerout', release);
  scene.input.on('pointerup', release);

  updateStars();
  startRound();

  return {
    update(delta) {
      if (done) {
        return;
      }

      if (phase === 'holding') {
        fill = Math.min(1, fill + (delta / 1000) * FILL_SPEED);
        paintTrack();
        if (fill >= 1) {
          release();
        }
        return;
      }

      if (phase === 'feedback') {
        feedback -= delta;
        if (feedback <= 0) {
          if (round >= ROUNDS) {
            done = true;
            scene.input.off('pointerup', release);
            ctx.finish(hits, 'complete');
          } else {
            startRound();
          }
        }
      }
    },
    destroy() {
      scene.input.off('pointerup', release);
    },
    pressForTest() {
      press();
    },
    setFillForTest(value) {
      fill = Math.max(0, Math.min(0.99, Number(value) || 0));
      paintTrack();
    },
    releaseForTest() {
      release();
    },
    get hits() {
      return hits;
    },
    get round() {
      return round;
    },
    get fill() {
      return fill;
    },
    get zoneStart() {
      return zoneStart;
    },
    get zoneWidth() {
      return zoneWidth;
    },
  };
}

export default createBreath;
