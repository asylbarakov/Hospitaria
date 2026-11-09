import {
  ROOMS,
  FLOOR_Y,
  VIEW_HEIGHT,
  WORLD_WIDTH,
  DOOR_LOCAL_X,
} from '../data/rooms.js';
import { drawFurniture } from './furniturePainter.js';

const FONT = 'Arial, "Segoe UI", sans-serif';

function drawClocks(g) {
  ROOMS.forEach((room) => {
    const x = room.x + room.width / 2;
    const y = 140;

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
    g.fillRect(room.x, 0, room.width, FLOOR_Y);
  });
  drawClocks(g);
}

function drawFloor(g) {
  g.fillStyle(0xf0e6d2, 1);
  g.fillRect(0, FLOOR_Y, WORLD_WIDTH, VIEW_HEIGHT - FLOOR_Y);

  g.lineStyle(2, 0xdccfb4, 1);
  for (let x = 0; x <= WORLD_WIDTH; x += 80) {
    g.lineBetween(x, FLOOR_Y, x, VIEW_HEIGHT);
  }
  for (let y = FLOOR_Y + 40; y <= VIEW_HEIGHT; y += 40) {
    g.lineBetween(0, y, WORLD_WIDTH, y);
  }

  g.fillStyle(0xc4dde7, 1);
  g.fillRect(0, FLOOR_Y - 16, WORLD_WIDTH, 16);
}

function drawDividers(g) {
  for (let i = 1; i < ROOMS.length; i += 1) {
    const x = ROOMS[i].x;
    g.fillStyle(0xc9dfe8, 1);
    g.fillRect(x - 8, 0, 16, FLOOR_Y);
    g.fillStyle(0xffffff, 0.35);
    g.fillRect(x - 2, 0, 4, FLOOR_Y);
  }
}

function drawDoor(g, room) {
  const cx = room.x + DOOR_LOCAL_X;
  const w = 110;
  const h = 200;
  const left = cx - w / 2;
  const top = FLOOR_Y - h;

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

  // Табличка над дверью.
  const signY = FLOOR_Y - 238;
  g.fillStyle(room.accent, 1);
  g.fillRoundedRect(cx - 105, signY - 24, 210, 48, 12);
  g.lineStyle(3, 0xffffff, 0.85);
  g.strokeRoundedRect(cx - 105, signY - 24, 210, 48, 12);
}

function drawFurnitureInRooms(g) {
  ROOMS.forEach((room) => {
    room.furniture.forEach((item) => {
      drawFurniture(g, item.type, room.x + item.x, FLOOR_Y);
    });
  });
}

function addSigns(scene) {
  ROOMS.forEach((room) => {
    scene.add
      .text(room.x + DOOR_LOCAL_X, FLOOR_Y - 238, room.title, {
        fontFamily: FONT,
        fontSize: '21px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(4);
  });
}

export function createHospitalWorld(scene) {
  const g = scene.add.graphics().setDepth(0);

  drawWalls(g);
  drawFloor(g);
  drawDividers(g);
  ROOMS.forEach((room) => drawDoor(g, room));
  drawFurnitureInRooms(g);
  addSigns(scene);

  return g;
}
