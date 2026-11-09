import Avatar from '../systems/Avatar.js';
import { MG_FONT } from '../ui/minigameDrawing.js';

const BASE_X = 400;
const BASE_Y = 600;
const AVATAR_SCALE = 1.6;
const THREE_STAR_TIME = 9000;
const TWO_STAR_TIME = 15000;

const POINTS = [
  { x: 0, y: -212 },
  { x: 0, y: -178 },
  { x: -30, y: -125 },
  { x: 28, y: -78 },
  { x: 28, y: -20 },
];

export function createExam(scene, root, ctx) {
  let elapsed = 0;
  let found = 0;
  let earnedStars = 0;
  let finishing = false;
  let finishDelay = 0;
  let done = false;

  const shadow = scene.add.graphics();
  shadow.fillStyle(0x000000, 0.1);
  shadow.fillEllipse(BASE_X, BASE_Y + 4, 190, 34);
  root.add(shadow);

  const avatar = new Avatar(scene, BASE_X, BASE_Y, ctx.patient.avatar.config, {
    scale: AVATAR_SCALE,
  });
  root.add(avatar.container);

  const title = scene.add
    .text(640, 150, 'Осмотр: нажмите на все подсвеченные точки', {
      fontFamily: MG_FONT,
      fontSize: '27px',
      fontStyle: 'bold',
      color: '#2f5d6b',
    })
    .setOrigin(0.5);
  root.add(title);

  const counter = scene.add
    .text(640, 195, `Найдено: 0 из ${POINTS.length}`, {
      fontFamily: MG_FONT,
      fontSize: '20px',
      color: '#5b7f8c',
    })
    .setOrigin(0.5);
  root.add(counter);

  const points = POINTS.map((point) => {
    const x = BASE_X + point.x * AVATAR_SCALE;
    const y = BASE_Y + point.y * AVATAR_SCALE;
    const glow = scene.add
      .circle(x, y, 28, 0xffd54f, 0.4)
      .setStrokeStyle(4, 0xffb300, 1)
      .setInteractive({ useHandCursor: true });

    scene.tweens.add({
      targets: glow,
      scale: 1.2,
      alpha: 0.72,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    glow.on('pointerdown', () => {
      if (done || finishing || glow.getData('found')) {
        return;
      }

      glow.setData('found', true);
      glow.disableInteractive();
      scene.tweens.killTweensOf(glow);
      glow.setScale(1);
      glow.setAlpha(1);

      scene.tweens.add({
        targets: glow,
        scale: 1.9,
        alpha: 0,
        duration: 260,
        ease: 'Quad.easeOut',
        onComplete: () => glow.setVisible(false),
      });

      found += 1;
      counter.setText(`Найдено: ${found} из ${POINTS.length}`);

      if (found === POINTS.length) {
        finishing = true;
        earnedStars = elapsed <= THREE_STAR_TIME
          ? 3
          : elapsed <= TWO_STAR_TIME
            ? 2
            : 1;
        finishDelay = 320;
      }
    });

    root.add(glow);
    return glow;
  });

  return {
    update(delta) {
      if (done) {
        return;
      }

      elapsed += delta;

      if (finishing) {
        finishDelay -= delta;
        if (finishDelay <= 0) {
          done = true;
          ctx.finish(earnedStars, 'complete');
        }
      }
    },
    points,
    get found() {
      return found;
    },
  };
}

export default createExam;
