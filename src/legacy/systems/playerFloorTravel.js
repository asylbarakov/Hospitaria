import {
  WORLD_WIDTH,
  LIFT_X,
  FLOOR_HEIGHT,
  floorBaseY,
  roomAt,
} from '../data/rooms.js';

const MIN_X = 70;
const MAX_X = WORLD_WIDTH - 70;
const NAME_OFFSET_Y = -350;

export function syncRoomTitle(scene) {
  const room = roomAt(scene.playerX, scene.playerFloor);
  const title = room ? room.title : 'Лифт';

  if (title !== scene.currentRoom) {
    scene.currentRoom = title;
    scene.registry.set('currentRoom', title);
  }
}

export function movePlayerTo(scene, x, floor = scene.playerFloor) {
  const clamped = Phaser.Math.Clamp(x, MIN_X, MAX_X);

  if (floor !== scene.playerFloor) {
    scene.destinationX = clamped;
    scene.targetFloor = floor;
    scene.targetX = LIFT_X;
    scene.movingFloor = true;
    return;
  }

  scene.destinationX = clamped;
  scene.targetX = clamped;
}

export function requestPlayerFloor(scene, floor) {
  const target = Phaser.Math.Clamp(Math.round(floor), 1, 2);
  if (target === scene.playerFloor || scene.movingFloor || scene.floorTransition) {
    return;
  }

  scene.movingFloor = true;
  scene.targetFloor = target;
  scene.destinationX = scene.playerX;
  scene.targetX = LIFT_X;
}

export function performFloorChange(scene, floor) {
  if (scene.floorTransition) {
    return;
  }

  scene.floorTransition = true;
  scene.movingFloor = false;
  scene.targetX = LIFT_X;

  const camera = scene.cameras.main;
  camera.fadeOut(220, 12, 32, 42);

  camera.once('camerafadeoutcomplete', () => {
    scene.playerFloor = floor;
    scene.playerY = floorBaseY(floor);
    scene.playerX = LIFT_X;
    scene.avatar.setPosition(scene.playerX, scene.playerY);
    scene.nameText.setY(scene.playerY + NAME_OFFSET_Y);
    syncRoomTitle(scene);
    camera.scrollY = (floor - 1) * FLOOR_HEIGHT;

    scene.targetX = Phaser.Math.Clamp(scene.destinationX, MIN_X, MAX_X);
    scene.destinationX = scene.targetX;

    camera.fadeIn(220, 12, 32, 42);
    scene.floorTransition = false;
  });
}

export default movePlayerTo;
