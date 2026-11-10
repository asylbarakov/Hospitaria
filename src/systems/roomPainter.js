import {
  ROOMS,
  FLOOR_Y,
  WORLD_WIDTH,
  DOOR_LOCAL_X,
  LIFT_LEFT,
  LIFT_X,
  floorBaseY,
} from '../data/rooms.js';
import { drawFurniture } from './furniturePainter.js';
import { shade } from './avatarColors.js';
import {
  drawCeiling,
  drawWainscot,
  drawWindows,
  drawPoster,
  drawSunPatches,
  drawFloorPolish,
  drawBaseboard,
} from './roomDecor.js';
import { bakeWorldGraphics } from './worldBaker.js';

const FONT = 'Arial, "Segoe UI", sans-serif';

function drawClock(g, room) {
  const x = room.x + room.width / 2;
  const y = room.y + 140;

  g.fillStyle(0x1b4b5a, 0.14);
  g.fillCircle(x + 3, y + 5, 34);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(x, y, 34);
  g.lineStyle(5, room.accent, 0.85);
  g.strokeCircle(x, y, 33);

  g.lineStyle(2, 0x90a4ae, 1);
  for (let i = 0; i < 12; i += 1) {
    const a = (i * Math.PI) / 6;
    g.lineBetween(
      x + Math.cos(a) * 25,
      y + Math.sin(a) * 25,
      x + Math.cos(a) * 29,
      y + Math.sin(a) * 29,
    );
  }

  g.lineStyle(4, 0x546e7a, 1);
  g.lineBetween(x, y, x, y - 18);
  g.lineBetween(x, y, x + 12, y + 6);
  g.fillStyle(room.accent, 1);
  g.fillCircle(x, y, 4);
}

function drawWalls(g) {
  ROOMS.forEach((room) => {
    g.fillGradientStyle(room.wallTop, room.wallTop, room.wallBottom, room.wallBottom, 1);
    g.fillRect(room.x, room.y, room.width, FLOOR_Y);

    drawCeiling(g, room);
    drawWainscot(g, room);
    drawWindows(g, room);
    drawPoster(g, room);
    drawClock(g, room);
  });
}

function drawFloors(g) {
  for (let floor = 1; floor <= 2; floor += 1) {
    drawFloorPolish(g, floor);
  }
  ROOMS.forEach((room) => {
    drawBaseboard(g, room);
    drawSunPatches(g, room);
  });
}

function drawDividers(g) {
  for (let i = 1; i < ROOMS.length; i += 1) {
    const room = ROOMS[i];
    if (room.floor !== ROOMS[i - 1].floor) {
      continue;
    }
    const x = room.x;
    const bottom = room.y + FLOOR_Y;

    g.fillStyle(0xcfe0e8, 1);
    g.fillRect(x - 10, room.y, 20, FLOOR_Y);
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(x - 10, room.y, 6, FLOOR_Y);
    g.fillStyle(0x1b4b5a, 0.14);
    g.fillRect(x + 4, room.y, 6, FLOOR_Y);
    g.fillStyle(0xb4c9d2, 1);
    g.fillRoundedRect(x - 14, room.y + 20, 28, 10, 4);
    g.fillRoundedRect(x - 14, bottom - 22, 28, 22, 4);
  }
}

function drawDoor(g, room) {
  const cx = room.x + DOOR_LOCAL_X;
  const baseY = room.y + FLOOR_Y;
  const w = 110;
  const h = 200;
  const left = cx - w / 2;
  const top = baseY - h;

  g.fillStyle(0x1b4b5a, 0.12);
  g.fillRoundedRect(left - 4, top - 2, w + 20, h + 6, 12);
  g.fillStyle(0xffffff, 1);
  g.fillRoundedRect(left - 8, top - 8, w + 16, h + 8, 12);
  g.lineStyle(3, room.accent, 0.35);
  g.strokeRoundedRect(left - 8, top - 8, w + 16, h + 8, 12);

  g.fillStyle(room.doorColor, 1);
  g.fillRoundedRect(left, top, w, h, 10);
  g.lineStyle(3, room.accent, 0.5);
  g.strokeRoundedRect(left, top, w, h, 10);

  // Стекло в верхней части двери.
  g.fillStyle(0xe8f7ff, 0.95);
  g.fillRoundedRect(left + 16, top + 18, w - 32, 72, 8);
  g.fillStyle(0xffffff, 0.55);
  g.fillTriangle(left + 20, top + 22, left + 52, top + 22, left + 20, top + 62);
  g.lineStyle(3, 0xffffff, 0.9);
  g.strokeRoundedRect(left + 16, top + 18, w - 32, 72, 8);

  // Нижняя филёнка и отбойная пластина.
  g.fillStyle(shade(room.doorColor, 0.9), 1);
  g.fillRoundedRect(left + 16, top + 106, w - 32, 56, 8);
  g.fillStyle(room.accent, 0.5);
  g.fillRoundedRect(left + 6, baseY - 26, w - 12, 18, 6);

  // Металлическая ручка.
  g.fillStyle(0x90a4ae, 1);
  g.fillCircle(left + w - 20, top + 120, 7);
  g.fillStyle(0xeceff1, 1);
  g.fillCircle(left + w - 22, top + 118, 3);

  // Табличка над дверью.
  const signY = baseY - 238;
  g.fillStyle(0x1b4b5a, 0.18);
  g.fillRoundedRect(cx - 105, signY - 20, 210, 48, 12);
  g.fillStyle(room.accent, 1);
  g.fillRoundedRect(cx - 105, signY - 24, 210, 48, 12);
  g.fillStyle(0xffffff, 0.18);
  g.fillRoundedRect(cx - 99, signY - 20, 198, 14, 7);
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

function drawLiftFloor(g, floor) {
  const baseY = floorBaseY(floor);
  const top = baseY - FLOOR_Y;
  const width = WORLD_WIDTH - LIFT_LEFT;

  g.fillGradientStyle(0xe9f1f5, 0xe9f1f5, 0xcfdde4, 0xcfdde4, 1);
  g.fillRect(LIFT_LEFT, top, width, FLOOR_Y);
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(LIFT_LEFT, top, width, 20);
  g.fillStyle(0x5b7f8c, 0.4);
  g.fillRect(LIFT_LEFT, top + 20, width, 5);
  g.fillStyle(0xffffff, 1);
  g.fillRect(LIFT_LEFT, baseY - 18, width, 18);
  g.fillStyle(0x5b7f8c, 0.4);
  g.fillRect(LIFT_LEFT, baseY - 18, width, 4);

  // Металлическая рама и двери кабины.
  g.fillStyle(0x1b4b5a, 0.14);
  g.fillRoundedRect(LIFT_X - 66, baseY - 210, 148, 214, 12);
  g.fillStyle(0x7f98a3, 1);
  g.fillRoundedRect(LIFT_X - 70, baseY - 214, 140, 214, 10);
  g.fillStyle(0xb7c9d1, 1);
  g.fillRoundedRect(LIFT_X - 64, baseY - 208, 128, 208, 8);

  g.fillGradientStyle(0xf4f8fa, 0xc9d8df, 0xf4f8fa, 0xc9d8df, 1);
  g.fillRect(LIFT_X - 58, baseY - 202, 56, 202);
  g.fillGradientStyle(0xc9d8df, 0xf4f8fa, 0xc9d8df, 0xf4f8fa, 1);
  g.fillRect(LIFT_X + 2, baseY - 202, 56, 202);

  g.fillStyle(0x6c8591, 1);
  g.fillRect(LIFT_X - 2, baseY - 202, 4, 202);
  g.fillStyle(0x90a4ae, 1);
  g.fillRect(LIFT_X - 58, baseY - 100, 116, 4);
  g.fillStyle(0xffffff, 0.35);
  g.fillTriangle(LIFT_X - 54, baseY - 198, LIFT_X - 18, baseY - 198, LIFT_X - 54, baseY - 120);
  g.fillTriangle(LIFT_X + 6, baseY - 198, LIFT_X + 42, baseY - 198, LIFT_X + 6, baseY - 120);

  // Табличка и стрелка направления.
  const signY = baseY - 238;
  g.fillStyle(0x1b4b5a, 0.18);
  g.fillRoundedRect(LIFT_X - 82, signY - 20, 164, 48, 12);
  g.fillStyle(0x5b7f8c, 1);
  g.fillRoundedRect(LIFT_X - 82, signY - 24, 164, 48, 12);
  g.fillStyle(0xffffff, 0.18);
  g.fillRoundedRect(LIFT_X - 76, signY - 20, 152, 14, 7);
  g.lineStyle(3, 0xffffff, 0.85);
  g.strokeRoundedRect(LIFT_X - 82, signY - 24, 164, 48, 12);

  g.fillStyle(0x9be7a5, 1);
  if (floor === 1) {
    g.fillTriangle(LIFT_X + 48, signY + 6, LIFT_X + 64, signY + 6, LIFT_X + 56, signY - 8);
  } else {
    g.fillTriangle(LIFT_X + 48, signY - 6, LIFT_X + 64, signY - 6, LIFT_X + 56, signY + 8);
  }
}

function drawLift(g) {
  for (let floor = 1; floor <= 2; floor += 1) {
    drawLiftFloor(g, floor);
  }
  g.lineStyle(4, 0xb4c9d2, 1);
  g.lineBetween(LIFT_LEFT, 0, LIFT_LEFT, floorBaseY(2) + 160);
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

function addLiftSigns(scene) {
  for (let floor = 1; floor <= 2; floor += 1) {
    const baseY = floorBaseY(floor);
    scene.add
      .text(LIFT_X - 14, baseY - 238, 'Лифт', {
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
  const g = scene.add.graphics();

  drawWalls(g);
  drawFloors(g);
  drawDividers(g);
  ROOMS.forEach((room) => drawDoor(g, room));
  drawFurnitureInRooms(g);
  drawLift(g);

  // Вся статичная картинка запекается в текстуры: в кадре это просто картинки.
  const world = bakeWorldGraphics(scene, g, 0);

  addSigns(scene);
  addLiftSigns(scene);
  addLiftZones(scene);

  return world;
}
