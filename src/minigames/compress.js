import Avatar from '../systems/Avatar.js';
import { MG_FONT } from '../ui/minigameDrawing.js';

const BASE_X = 400;
const BASE_Y = 600;
const AVATAR_SCALE = 1.6;
const THREE_STAR_TIME = 9000;
const TWO_STAR_TIME = 15000;
const TOUCH_DISTANCE = 42;

const POINTS = [
  { x: 45, y: -205 },
  { x: 52, y: -160 },
  { x: 58, y: -115 },
  { x: 62, y: -70 },
  { x: 66, y: -28 },
];

export function createCompress(scene, root, ctx) {
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
    .text(640, 150, 'Компресс: проведите по всем подсвеченным точкам', {
      fontFamily: MG_FONT,
      fontSize: '27px',
      fontStyle: 'bold',
      color: '#2f5d6b',
    })
    .setOrigin(0.5);
  root.add(title);

  const counter = scene.add
    .text(640, 195, `Обработано: 0 из ${POINTS.length}`, {
      fontFamily: MG_FONT,
      fontSize: '20px',
      color: '#5b7f8c',
    })
    .setOrigin(0.5);
  root.add(counter);

  const hint = scene.add
    .text(640, 640, 'Зажмите кнопку мыши и ведите компрессом по точкам', {
      fontFamily: MG_FONT,
      fontSize: '18px',
      color: '#5b7f8c',
    })
    .setOrigin(0.5);
  root.add(hint);

  const pack = scene.add.container(0, 0).setDepth(5).setVisible(false);
  const packG = scene.add.graphics();
  packG.fillStyle(0xffffff, 0.9);
  packG.fillCircle(0, 0, 26);
  packG.lineStyle(4, 0x4fc3f7, 1);
  packG.strokeCircle(0, 0, 26);
  packG.fillStyle(0x81d4fa, 0.7);
  packG.fillCircle(-7, -7, 8);
  pack.add(packG);
  root.add(pack);

  const collect = (spot) => {
    if (done || finishing || spot.getData('found')) {
      return;
    }

    spot.setData('found', true);
    spot.disableInteractive();
    scene.tweens.killTweensOf(spot);
    spot.setScale(1);
    spot.setAlpha(1);

    scene.tweens.add({
      targets: spot,
      scale: 1.9,
      alpha: 0,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () => spot.setVisible(false),
    });

    found += 1;
    counter.setText(`Обработано: ${found} из ${POINTS.length}`);

    if (found === POINTS.length) {
      finishing = true;
      earnedStars = elapsed <= THREE_STAR_TIME
        ? 3
        : elapsed <= TWO_STAR_TIME
          ? 2
          : 1;
      finishDelay = 320;
    }
  };

  const spots = POINTS.map((point) => {
    const x = BASE_X + point.x * AVATAR_SCALE;
    const y = BASE_Y + point.y * AVATAR_SCALE;
    const glow = scene.add
      .circle(x, y, 26, 0x81d4fa, 0.4)
      .setStrokeStyle(4, 0x4fc3f7, 1)
      .setInteractive({ useHandCursor: true });

    scene.tweens.add({
      targets: glow,
      scale: 1.18,
      alpha: 0.74,
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    glow.on('pointerdown', () => collect(glow));
    root.add(glow);
    return glow;
  });

  const onPointerMove = (pointer) => {
    if (done) {
      return;
    }

    pack.setVisible(pointer.isDown);
    pack.setPosition(pointer.x, pointer.y);

    if (!pointer.isDown) {
      return;
    }

    spots.forEach((spot) => {
      if (spot.getData('found') || !spot.visible) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, spot.x, spot.y);
      if (distance <= TOUCH_DISTANCE) {
        collect(spot);
      }
    });
  };

  scene.input.on('pointermove', onPointerMove);
  scene.input.on('pointerup', () => pack.setVisible(false));

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
          scene.input.off('pointermove', onPointerMove);
          ctx.finish(earnedStars, 'complete');
        }
      }
    },
    destroy() {
      scene.input.off('pointermove', onPointerMove);
    },
    collectAllForTest() {
      spots.forEach((spot) => {
        if (!spot.getData('found')) {
          collect(spot);
        }
      });
    },
    get found() {
      return found;
    },
  };
}

export default createCompress;
