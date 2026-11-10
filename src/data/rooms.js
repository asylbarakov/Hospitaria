export const VIEW_HEIGHT = 720;
export const ROOM_WIDTH = 640;
export const WORLD_WIDTH = ROOM_WIDTH * 5;
export const FLOOR_Y = 560;
export const DOOR_LOCAL_X = 80;

const ROOM_LAYOUT = [
  {
    id: 'reception',
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
];

export const ROOMS = ROOM_LAYOUT.map((room, index) => ({
  ...room,
  x: index * ROOM_WIDTH,
  width: ROOM_WIDTH,
}));
