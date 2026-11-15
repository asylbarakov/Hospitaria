export const VIEW_HEIGHT = 720;
export const FLOOR_HEIGHT = VIEW_HEIGHT;
export const ROOM_WIDTH = 640;
export const ROOMS_PER_FLOOR = 5;
export const WORLD_WIDTH = ROOM_WIDTH * ROOMS_PER_FLOOR + 160;
export const WORLD_HEIGHT = FLOOR_HEIGHT * 2;
export const FLOOR_Y = 560;
export const FLOOR_2_Y = FLOOR_Y + FLOOR_HEIGHT;
export const DOOR_LOCAL_X = 80;
export const LIFT_LEFT = WORLD_WIDTH - 160;
export const LIFT_X = WORLD_WIDTH - 80;

const ROOM_LAYOUT = [
  {
    id: 'reception',
    floor: 1,
    title: 'Приёмная',
    accent: 0x3f8fb0,
    wallTop: 0xe1f4fb,
    wallBottom: 0xfbfeff,
    doorColor: 0xa9d6e5,
    furniture: [
      { type: 'desk', x: 230 },
      { type: 'bench', x: 470 },
      { type: 'plant', x: 600 },
    ],
  },
  {
    id: 'doctor',
    floor: 1,
    title: 'Кабинет врача',
    accent: 0x3f9b4a,
    wallTop: 0xe6f7ea,
    wallBottom: 0xfbfefc,
    doorColor: 0xb7dfb9,
    furniture: [
      { type: 'plant', x: 180 },
      { type: 'desk', x: 330 },
      { type: 'chair', x: 500 },
      { type: 'cabinet', x: 580 },
    ],
  },
  {
    id: 'procedure',
    floor: 1,
    title: 'Процедурная',
    accent: 0x5b7fc7,
    wallTop: 0xe8f0fc,
    wallBottom: 0xfbfdff,
    doorColor: 0xb8c9ee,
    furniture: [
      { type: 'bed', x: 280 },
      { type: 'iv', x: 450 },
      { type: 'sink', x: 560 },
    ],
  },
  {
    id: 'ward',
    floor: 1,
    title: 'Палата',
    accent: 0xd08a4a,
    wallTop: 0xfdf1e7,
    wallBottom: 0xfffbf6,
    doorColor: 0xf0c9a8,
    furniture: [
      { type: 'bed', x: 250 },
      { type: 'nightstand', x: 390 },
      { type: 'bed', x: 520 },
    ],
  },
  {
    id: 'cafeteria',
    floor: 1,
    title: 'Кафетерий',
    accent: 0xc25b84,
    wallTop: 0xfbeef3,
    wallBottom: 0xfffafc,
    doorColor: 0xf2bfd2,
    furniture: [
      { type: 'counter', x: 250 },
      { type: 'table', x: 450 },
      { type: 'vending', x: 590 },
    ],
  },
  {
    id: 'lab',
    floor: 2,
    title: 'Лаборатория',
    accent: 0x4f9c94,
    wallTop: 0xe4f6f3,
    wallBottom: 0xfafffe,
    doorColor: 0xb2e0da,
    furniture: [
      { type: 'plant', x: 150 },
      { type: 'desk', x: 300 },
      { type: 'sink', x: 470 },
      { type: 'cabinet', x: 580 },
    ],
  },
  {
    id: 'pharmacy',
    floor: 2,
    title: 'Аптека',
    accent: 0x7c9c3f,
    wallTop: 0xf3f9e6,
    wallBottom: 0xfdfff8,
    doorColor: 0xd3e5ab,
    furniture: [
      { type: 'cabinet', x: 180 },
      { type: 'counter', x: 330 },
      { type: 'cabinet', x: 500 },
      { type: 'plant', x: 600 },
    ],
  },
  {
    id: 'rest',
    floor: 2,
    title: 'Зона отдыха',
    accent: 0xc98a4b,
    wallTop: 0xfdf2e6,
    wallBottom: 0xfffcf8,
    doorColor: 0xf0cba4,
    furniture: [
      { type: 'floorLamp', x: 170 },
      { type: 'sofa', x: 320 },
      { type: 'table', x: 480 },
      { type: 'rug', x: 390 },
      { type: 'plant', x: 600 },
    ],
  },
  {
    id: 'archive',
    floor: 2,
    title: 'Архив',
    accent: 0x8d7bb5,
    wallTop: 0xf1edfa,
    wallBottom: 0xfcfbff,
    doorColor: 0xcfc3e8,
    furniture: [
      { type: 'plant', x: 140 },
      { type: 'cabinet', x: 280 },
      { type: 'desk', x: 430 },
      { type: 'chair', x: 560 },
    ],
  },
  {
    id: 'staff',
    floor: 2,
    title: 'Ординаторская',
    accent: 0x5b7f8c,
    wallTop: 0xeef4f6,
    wallBottom: 0xfbfdfe,
    doorColor: 0xc2d5db,
    furniture: [
      { type: 'plant', x: 140 },
      { type: 'table', x: 300 },
      { type: 'chair', x: 420 },
      { type: 'bench', x: 560 },
    ],
  },
];

let floorCounters = {};

export const ROOMS = ROOM_LAYOUT.map((room) => {
  const floor = room.floor || 1;
  const index = floorCounters[floor] || 0;
  floorCounters[floor] = index + 1;

  return {
    ...room,
    floor,
    x: index * ROOM_WIDTH,
    y: (floor - 1) * FLOOR_HEIGHT,
    width: ROOM_WIDTH,
  };
});

floorCounters = null;

export function floorBaseY(floor) {
  return FLOOR_Y + (Math.max(1, Number(floor) || 1) - 1) * FLOOR_HEIGHT;
}

export function roomAt(x, floor) {
  return ROOMS.find(
    (room) => room.floor === floor && x >= room.x && x < room.x + room.width,
  ) || null;
}

export function findRoom(id) {
  return ROOMS.find((room) => room.id === id) || null;
}
