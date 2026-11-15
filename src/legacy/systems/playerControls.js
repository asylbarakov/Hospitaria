import {
  WORLD_WIDTH,
  FLOOR_Y,
  FLOOR_HEIGHT,
  floorBaseY,
} from '../data/rooms.js';

const MIN_X = 70;
const MAX_X = WORLD_WIDTH - 70;

export function createPlayerControls(scene) {
  scene.cursors = scene.input.keyboard.createCursorKeys();
  scene.extraKeys = scene.input.keyboard.addKeys({
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
  });

  scene.input.on('pointerdown', (pointer) => {
    const patientClicked = scene.patientClickGuard;
    const objectClicked = scene.objectClickGuard;
    scene.patientClickGuard = false;
    scene.objectClickGuard = false;

    if (patientClicked || objectClicked) {
      return;
    }

    if (scene.registry.get('uiModal') || scene.floorTransition) {
      return;
    }

    // Клики по кнопкам и окнам интерфейса не должны двигать персонажа.
    const ui = scene.scene.get('UIScene');
    if (ui && ui.input && ui.input.hitTestPointer(pointer).length > 0) {
      return;
    }

    // Определяем этаж по мировой высоте клика.
    const floor = pointer.worldY >= FLOOR_HEIGHT ? 2 : 1;
    const baseY = floorBaseY(floor);
    if (pointer.worldY < baseY - 40) {
      return;
    }

    const targetX = Phaser.Math.Clamp(pointer.worldX, MIN_X, MAX_X);
    scene.walkPlayerTo(targetX, floor);

    if (floor === scene.playerFloor) {
      scene.spawnRipple(targetX, baseY);
    }
  });

  scene.input.keyboard.on('keydown-ESC', () => {
    if (scene.registry.get('uiModal')) {
      const ui = scene.scene.get('UIScene');
      if (ui && ui.closeModal) {
        ui.closeModal();
      }
      return;
    }
    scene.openPauseMenu();
  });
}

export function spawnPlayerRipple(scene, x, baseY = FLOOR_Y) {
  const ripple = scene.add
    .ellipse(x, baseY - 6, 38, 16, 0x3f8fb0, 0.4)
    .setDepth(9);

  scene.tweens.add({
    targets: ripple,
    scaleX: 1.9,
    scaleY: 1.9,
    alpha: 0,
    duration: 430,
    ease: 'Quad.easeOut',
    onComplete: () => ripple.destroy(),
  });
}

export default createPlayerControls;
