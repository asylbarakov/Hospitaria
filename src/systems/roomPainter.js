import {
  ROOMS,
  FLOOR_Y,
  FLOOR_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  DOOR_LOCAL_X,
  LIFT_LEFT,
  LIFT_X,
  floorBaseY,
} from '../data/rooms.js';
import { drawFurniture } from './furniturePainter.js';

const FONT = 'Arial, "Segoe UI", sans-serif';

function drawClocks(g) {
  ROOMS.forEach((room) => {
    const x = room.x + room.width / 2;
    const y = room.y + 140;

    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(x, y, 32);
    g.lineStyle(4, room.accent, 0.8);
    g.strokeCircle(x, y, 32);
    g.lineStyle(3, 0x546e7a, 1);
    g.lineBetween(x, y, x, y - 18);
    g.lineBetween(x, y, x + 12, y + 6);
    g.fillStyle(room.accent, 1);
    g.fillCircle(x, y, 4);
  });
}

function drawWalls(g) {
  ROOMS.forEach((room) => {
    g.fillGradientStyle(room.wallTop, room.wallTop, room.wallBottom, room.wallBottom, 1);
    g.fillRect(room.x, room.y, room.width, FLOOR_Y);
  });
  drawClocks(g);
}

function drawFloor(g) {
  for (let floor = 1; floor <= 2; floor += 1) {
    const base = floorBaseY(floor);

    g.fillStyle(0xf0e6d2, 1);
    g.fillRect(0, base, WORLD_WIDTH, FLOOR_HEIGHT - FLOOR_Y);

    g.lineStyle(2, 0xdccfb4, 1);
    for (let x = 0; x <= WORLD_WIDTH; x += 80) {
      g.lineBetween(x, base, x, base + 160);
    }
    for (let y = base + 40; y <= base + 160; y += 40) {
      g.lineBetween(0, y, WORLD_WIDTH, y);
    }

    g.fillStyle(0xc4dde7, 1);
    g.fillRect(0, base - 16, WORLD_WIDTH, 16);
  }
}

function drawDividers(g) {
  for (let i = 1; i < ROOMS.length; i += 1) {
    const room = ROOMS[i];
    if (room.floor !== ROOMS[i - 1].floor) {
      continue;
    }
    const x = room.x;
    g.fillStyle(0xc9dfe8, 1);
    g.fillRect(x - 8, room.y, 16, FLOOR_Y);
    g.fillStyle(0xffffff, 0.35);
    g.fillRect(x - 2, room.y, 4, FLOOR_Y);
  }
}

function drawDoor(g, room) {
  const cx = room.x + DOOR_LOCAL_X;
  const baseY = room.y + FLOOR_Y;
  const w = 110;
  const h = 200;
  const left = cx - w / 2;
  const top = baseY - h;

  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(left - 8, top - 8, w + 16, h + 8, 12);
  g.lineStyle(3, room.accent, 0.35);
  g.strokeRoundedRect(left - 8, top - 8, w + 16, h + 8, 12);

  g.fillStyle(room.doorColor, 1);
  g.fillRoundedRect(left, top, w, h, 10);
  g.lineStyle(3, room.accent, 0.5);
  g.strokeRoundedRect(left, top, w, h, 10);

  g.fillStyle(0xffffff, 0.22);
  g.fillRoundedRect(left + 16, top + 18, w - 32, 66, 8);
  g.fillRoundedRect(left + 16, top + 104, w - 32, 66, 8);

  g.fillStyle(0xffd54f, 1);
  g.fillCircle(left + w - 20, top + 120, 5);

  const signY = baseY - 238;
  g.fillStyle(room.accent, 1);
  g.fillRoundedRect(cx - 105, signY - 24, 210, 48, 12);
  g.lineStyle(3, 0xffffff, 0.85);
  g.strokeRoundedRect(cx - 105, signY - 24, 210, 48, 12);
}

function drawFurnitureInRooms(g) {
  ROOMS.forEach((room) => {
    room.furniture.forEach((item) => {
      drawFurniture(g, item.type, room.x + item.x, room.y + FLOOR_Y);
    });
  });
}

function addSigns(scene) {
  ROOMS.forEach((room) => {
    scene.add
      .text(room.x + DOOR_LOCAL_X, room.y + FLOOR_Y - 238, room.title, {
        fontFamily: FONT,
        fontSize: '21px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(4);
  });
}

function drawLift(g) {
  g.fillStyle(0xdfe9ee, 1);
  g.fillRect(LIFT_LEFT, 0, WORLD_WIDTH - LIFT_LEFT, WORLD_HEIGHT);
  g.lineStyle(4, 0xb4c9d2, 1);
  g.lineBetween(LIFT_LEFT, 0, LIFT_LEFT, WORLD_HEIGHT);

  for (let floor = 1; floor <= 2; floor += 1) {
    const baseY = floorBaseY(floor);
    const signY = baseY - 238;

    g.fillStyle(0x5b7f8c, 1);
    g.fillRoundedRect(LIFT_X - 82, signY - 24, 164, 48, 12);
    g.lineStyle(3, 0xffffff, 0.85);
    g.strokeRoundedRect(LIFT_X - 82, signY - 24, 164, 48, 12);

    g.fillStyle(0x9fb8c3, 1);
    g.fillRoundedRect(LIFT_X - 62, baseY - 206, 124, 206, 10);
    g.lineStyle(4, 0x78909c, 1);
    g.strokeRoundedRect(LIFT_X - 62, baseY - 206, 124, 206, 10);

    g.fillStyle(0xcfe3ea, 1);
    g.fillRect(LIFT_X - 56, baseY - 200, 52, 194);
    g.fillRect(LIFT_X + 4, baseY - 200, 52, 194);
    g.lineStyle(2, 0x90a4ae, 1);
    g.strokeRect(LIFT_X - 56, baseY - 200, 52, 194);
    g.strokeRect(LIFT_X + 4, baseY - 200, 52, 194);

    g.fillStyle(0x455a64, 1);
    g.fillCircle(LIFT_X - 14, baseY - 100, 5);
    g.fillCircle(LIFT_X + 14, baseY - 100, 5);
  }
}

function addLiftSigns(scene) {
  for (let floor = 1; floor <= 2; floor += 1) {
    const baseY = floorBaseY(floor);
    scene.add
      .text(LIFT_X, baseY - 238, 'Лифт', {
        fontFamily: FONT,
        fontSize: '21px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(4);

    scene.add
      .text(LIFT_X, baseY - 300, floor === 1 ? '1 этаж' : '2 этаж', {
        fontFamily: FONT,
        fontSize: '15px',
        color: '#3f6b7a',
        backgroundColor: '#ffffff',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(4);
  }
}

function addLiftZones(scene) {
  for (let floor = 1; floor <= 2; floor += 1) {
    const baseY = floorBaseY(floor);
    const other = floor === 1 ? 2 : 1;
    const zone = scene.add
      .zone(LIFT_X, baseY - 120, 150, 300)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerdown', () => {
      if (scene.objectClickGuard !== undefined) {
        scene.objectClickGuard = true;
      }
      scene.requestFloor(other);
    });
  }
}

export function createHospitalWorld(scene) {
  const g = scene.add.graphics().setDepth(0);

  drawWalls(g);
  drawFloor(g);
  drawDividers(g);
  ROOMS.forEach((room) => drawDoor(g, room));
  drawFurnitureInRooms(g);
  drawLift(g);
  addSigns(scene);
  addLiftSigns(scene);
  addLiftZones(scene);

  return g;
}
