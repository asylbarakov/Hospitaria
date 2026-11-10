import { MG_FONT } from '../ui/minigameDrawing.js';

const TOTAL_DROPS = 8;
const SPAWN_INTERVAL = 820;
const DROP_START_Y = 270;
const DROP_END_Y = 596;
const DROP_MIN_X = 510;
const DROP_MAX_X = 770;

export function createDrops(scene, root, ctx) {
  let hits = 0;
  let resolved = 0;
  let spawned = 0;
  let spawnTimer = 400;
  let done = false;
  let finishDelay = -1;

  const drops = [];

  const backdrop = scene.add.graphics();
  backdrop.fillStyle(0xe3f2fb, 1);
  backdrop.fillRoundedRect(450, 300, 380, 340, 28);
  backdrop.lineStyle(4, 0x9fc3d1, 0.7);
  backdrop.strokeRoundedRect(450, 300, 380, 340, 28);
  root.add(backdrop);

  const dropper = scene.add.graphics();
  dropper.fillStyle(0x90a4ae, 1);
  dropper.fillRoundedRect(612, 220, 56, 52, 12);
  dropper.fillStyle(0xcfdfe8, 1);
  dropper.fillRoundedRect(624, 264, 32, 18, 6);
  dropper.fillStyle(0x64b5f6, 1);
  dropper.fillCircle(640, 286, 7);
  root.add(dropper);

  const beaker = scene.add.graphics();
  beaker.lineStyle(5, 0x81d4fa, 0.9);
  beaker.strokeRoundedRect(490, 600, 300, 34, 16);
  beaker.fillStyle(0x4fc3f7, 0.3);
  beaker.fillRoundedRect(494, 604, 292, 26, 14);
  root.add(beaker);

  const title = scene.add
    .text(640, 150, 'Капли: ловите капли, пока они не упали', {
      fontFamily: MG_FONT,
      fontSize: '27px',
      fontStyle: 'bold',
      color: '#2f5d6b',
    })
    .setOrigin(0.5);
  root.add(title);

  const counter = scene.add
    .text(640, 196, `Поймано: 0 из ${TOTAL_DROPS}`, {
      fontFamily: MG_FONT,
      fontSize: '20px',
      color: '#5b7f8c',
    })
    .setOrigin(0.5);
  root.add(counter);

  const status = scene.add
    .text(640, 246, 'Нажимайте на капли', {
      fontFamily: MG_FONT,
      fontSize: '21px',
      fontStyle: 'bold',
      color: '#3f8fb0',
    })
    .setOrigin(0.5);
  root.add(status);

  const splash = (x, y, color) => {
    const ring = scene.add
      .circle(x, y, 8, color, 0.6)
      .setStrokeStyle(3, color, 1);
    root.add(ring);
    scene.tweens.add({
      targets: ring,
      scale: 2.4,
      alpha: 0,
      duration: 360,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  };

  const resolveDrop = (drop, caught) => {
    if (!drop || drop.getData('resolved')) {
      return;
    }
    drop.setData('resolved', true);

    scene.tweens.killTweensOf(drop);
    const index = drops.indexOf(drop);
    if (index !== -1) {
      drops.splice(index, 1);
    }

    splash(drop.x, caught ? drop.y : DROP_END_Y, caught ? 0x66bb6a : 0xef5350);
    drop.destroy();

    resolved += 1;
    if (caught) {
      hits += 1;
      status.setText('Поймали!');
      status.setColor('#2e7d32');
    } else {
      status.setText('Капля упала мимо');
      status.setColor('#c62828');
    }
    counter.setText(`Поймано: ${hits} из ${TOTAL_DROPS}`);

    if (resolved >= TOTAL_DROPS) {
      finishDelay = 550;
    }
  };

  const spawnDrop = () => {
    if (spawned >= TOTAL_DROPS || done) {
      return;
    }
    spawned += 1;

    const x = Phaser.Math.Between(DROP_MIN_X, DROP_MAX_X);
    const drop = scene.add.container(x, DROP_START_Y);
    const g = scene.add.graphics();
    g.fillStyle(0x64b5f6, 1);
    g.fillCircle(0, 0, 15);
    g.fillStyle(0xffffff, 0.55);
    g.fillCircle(-5, -5, 5);
    g.lineStyle(2, 0x1e88e5, 0.8);
    g.strokeCircle(0, 0, 15);
    drop.add(g);
    drop.setSize(40, 40);
    drop.setInteractive(
      new Phaser.Geom.Circle(0, 0, 22),
      Phaser.Geom.Circle.Contains,
    );
    drop.on('pointerdown', () => resolveDrop(drop, true));
    root.add(drop);
    drops.push(drop);

    scene.tweens.add({
      targets: drop,
      y: DROP_END_Y,
      duration: 1550,
      ease: 'Sine.easeIn',
      onComplete: () => resolveDrop(drop, false),
    });
  };

  const getStars = () => {
    if (hits >= 6) {
      return 3;
    }
    if (hits >= 4) {
      return 2;
    }
    if (hits >= 1) {
      return 1;
    }
    return 0;
  };

  const finish = () => {
    if (done) {
      return;
    }
    done = true;
    ctx.finish(getStars(), 'complete');
  };

  return {
    update(delta) {
      if (done) {
        return;
      }

      if (finishDelay >= 0) {
        finishDelay -= delta;
        if (finishDelay <= 0) {
          finish();
        }
        return;
      }

      if (spawned < TOTAL_DROPS) {
        spawnTimer -= delta;
        if (spawnTimer <= 0) {
          spawnDrop();
          spawnTimer = SPAWN_INTERVAL;
        }
      }
    },
    destroy() {
      drops.slice().forEach((drop) => drop.destroy());
      drops.length = 0;
    },
    catchNextForTest() {
      const drop = drops.find((item) => !item.getData('resolved'));
      if (!drop) {
        return false;
      }
      resolveDrop(drop, true);
      return true;
    },
    get hits() {
      return hits;
    },
    get resolved() {
      return resolved;
    },
    get spawned() {
      return spawned;
    },
  };
}

export default createDrops;
