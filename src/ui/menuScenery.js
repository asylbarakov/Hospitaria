import { ensureMenuTextures, MENU_TEXTURES as T, AMBULANCE_SIZE } from './menuTextures.js';

const W = 1280;
const H = 720;
const GROUND_Y = 645;

/** Облако медленно плывёт вправо и, уходя за край, появляется слева. */
function driftCloud(scene, image, speed) {
  const run = () => {
    const distance = W + 300 - image.x;
    scene.tweens.add({
      targets: image,
      x: W + 300,
      duration: (distance / speed) * 1000,
      ease: 'Linear',
      onComplete: () => {
        image.x = -320;
        run();
      },
    });
  };
  run();
}

function addSky(scene) {
  scene.add.image(0, 0, T.sky).setOrigin(0, 0).setDisplaySize(W, H).setDepth(0);

  const rays = scene.add.image(1090, 120, T.rays).setDepth(1).setAlpha(0.9);
  scene.tweens.add({ targets: rays, angle: 360, duration: 90000, repeat: -1 });

  const sun = scene.add.image(1090, 120, T.sun).setDepth(2);
  scene.tweens.add({
    targets: sun,
    scale: 1.05,
    duration: 2400,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

function addClouds(scene) {
  const clouds = [
    { key: T.cloudA, x: 180, y: 150, scale: 1, speed: 9 },
    { key: T.cloudB, x: 520, y: 92, scale: 0.9, speed: 6 },
    { key: T.cloudA, x: 860, y: 205, scale: 0.7, speed: 12 },
    { key: T.cloudB, x: 1180, y: 160, scale: 1.1, speed: 7 },
    { key: T.cloudB, x: 20, y: 250, scale: 0.6, speed: 14 },
  ];

  clouds.forEach((cloud) => {
    const image = scene.add
      .image(cloud.x, cloud.y, cloud.key)
      .setScale(cloud.scale)
      .setAlpha(0.95)
      .setDepth(3);
    driftCloud(scene, image, cloud.speed);
  });
}

function addTrees(scene) {
  const trees = [
    { x: 120, y: GROUND_Y + 8, scale: 1.15 },
    { x: 250, y: GROUND_Y + 14, scale: 0.85 },
    { x: 1030, y: GROUND_Y + 14, scale: 0.9 },
    { x: 1160, y: GROUND_Y + 8, scale: 1.2 },
  ];

  trees.forEach((tree, index) => {
    const image = scene.add
      .image(tree.x, tree.y, T.tree)
      .setOrigin(0.5, 1)
      .setScale(tree.scale)
      .setDepth(5);

    // Лёгкое покачивание на ветру.
    scene.tweens.add({
      targets: image,
      angle: { from: -1.6, to: 1.6 },
      duration: 2600 + index * 350,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  });
}

function addAmbulance(scene) {
  const image = scene.add.image(0, 0, T.ambulance).setOrigin(0.5, 1);
  const lampY = -AMBULANCE_SIZE.h + 21;
  const red = scene.add.circle(-9, lampY, 24, 0xff5252, 0.6);
  const blue = scene.add.circle(15, lampY, 24, 0x42a5f5, 0.6);
  const van = scene.add.container(-160, H - 14, [image, red, blue]).setDepth(7);

  scene.tweens.add({ targets: red, alpha: { from: 0.1, to: 0.8 }, duration: 260, yoyo: true, repeat: -1 });
  scene.tweens.add({
    targets: blue,
    alpha: { from: 0.8, to: 0.1 },
    duration: 260,
    yoyo: true,
    repeat: -1,
  });

  scene.tweens.add({
    targets: van,
    x: W + 200,
    duration: 15000,
    delay: 3000,
    repeat: -1,
    repeatDelay: 9000,
    ease: 'Linear',
  });
}

function addFloatingCrosses(scene) {
  const spots = [
    [70, 520], [200, 430], [310, 560], [960, 540], [1070, 440], [1200, 560], [1110, 330],
  ];

  spots.forEach(([x, y], index) => {
    const cross = scene.add.image(x, y, T.cross).setDepth(6).setAlpha(0).setScale(0.8);
    scene.tweens.add({
      targets: cross,
      y: y - 90,
      alpha: { from: 0, to: 0.7 },
      duration: 3200,
      delay: index * 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  });
}

/** Весь фон главного меню: небо, солнце, облака, холмы, больница, «скорая». */
export function buildMenuScenery(scene) {
  ensureMenuTextures(scene);

  addSky(scene);
  addClouds(scene);
  scene.add.image(0, 460, T.hills).setOrigin(0, 0).setDepth(4);
  addTrees(scene);
  scene.add.image(W / 2, GROUND_Y, T.building).setOrigin(0.5, 1).setDepth(6);
  addFloatingCrosses(scene);
  addAmbulance(scene);
}

export { W, H };
