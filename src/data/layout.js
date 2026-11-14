// Планировка изометрической больницы (этап 11). Все координаты в тайлах.
//
// Здание это прямоугольник пола BUILDING (коридоры и холл). Внутри лежат комнаты:
//   kind 'room': внутренний прямоугольник x, y, w, h + кольцо стен вокруг него (1 тайл);
//   kind 'zone': участок без стен (холл, регистратура), только название и пол.
// Двери: side 'N' | 'S' | 'W' | 'E' и координата at (x для N/S, y для W/E) внутри кольца.
// Окна: то же, ставятся только в высокие стены (наружные N и W).
// Мебель: type из src/data/buildCatalog.js, x, y левого верхнего тайла и rot (0 или 1, поворот).

export const MAP = { cols: 48, rows: 36 };
export const BUILDING = { x: 1, y: 3, w: 46, h: 32 };
export const ENTRANCE = { x: 24, y: 34 }; // тайл у входа, где появляется персонаж
export const FLOOR_CORRIDOR = 'hall';

export const ROOMS = [
  {
    id: 'therapist', name: 'Терапевт', kind: 'room', x: 2, y: 4, w: 7, h: 6, floor: 'clinic',
    doors: [{ side: 'S', at: 5 }],
    windows: [{ side: 'N', at: 3 }, { side: 'N', at: 7 }, { side: 'W', at: 6 }],
    items: [
      { type: 'doctor_desk', x: 3, y: 5 }, { type: 'doctor_chair', x: 3, y: 6 },
      { type: 'exam_couch', x: 6, y: 8 }, { type: 'plant_big', x: 8, y: 4 },
      { type: 'waiting_chair', x: 2, y: 9 },
    ],
  },
  {
    id: 'lab', name: 'Лаборатория', kind: 'room', x: 13, y: 4, w: 7, h: 6, floor: 'lab',
    doors: [{ side: 'S', at: 16 }],
    windows: [{ side: 'N', at: 14 }, { side: 'N', at: 18 }],
    items: [
      { type: 'microscope_table', x: 14, y: 5 }, { type: 'sample_table', x: 17, y: 5 },
      { type: 'doctor_chair', x: 14, y: 6 }, { type: 'doctor_chair', x: 17, y: 6 },
      { type: 'plant_big', x: 19, y: 9 },
    ],
  },
  {
    id: 'xray', name: 'Рентген', kind: 'room', x: 24, y: 4, w: 9, h: 6, floor: 'clinic',
    doors: [{ side: 'S', at: 28 }],
    windows: [{ side: 'N', at: 26 }, { side: 'N', at: 30 }],
    items: [
      { type: 'xray_machine', x: 26, y: 5 }, { type: 'doctor_desk', x: 30, y: 4 },
      { type: 'doctor_chair', x: 30, y: 5 }, { type: 'waiting_chair', x: 24, y: 9 },
    ],
  },
  {
    id: 'procedure', name: 'Процедурная', kind: 'room', x: 37, y: 4, w: 9, h: 6, floor: 'clinic',
    doors: [{ side: 'S', at: 41 }],
    windows: [{ side: 'N', at: 39 }, { side: 'N', at: 43 }],
    items: [
      { type: 'iv_chair', x: 38, y: 5 }, { type: 'iv_stand', x: 39, y: 5 },
      { type: 'iv_chair', x: 42, y: 5 }, { type: 'iv_stand', x: 43, y: 5 },
      { type: 'ultrasound_machine', x: 45, y: 5 }, { type: 'exam_couch', x: 38, y: 8 },
      { type: 'plant_big', x: 45, y: 9 },
    ],
  },
  {
    id: 'ward', name: 'Палата', kind: 'room', x: 2, y: 16, w: 9, h: 7, floor: 'clinic',
    doors: [{ side: 'N', at: 6 }, { side: 'S', at: 6 }],
    windows: [{ side: 'W', at: 19 }],
    items: [
      { type: 'ward_bed', x: 3, y: 17 }, { type: 'ward_bed', x: 7, y: 17 },
      { type: 'ward_bed', x: 3, y: 20 }, { type: 'ward_bed', x: 7, y: 20 },
      { type: 'iv_stand', x: 5, y: 17 }, { type: 'plant_big', x: 10, y: 22 },
    ],
  },
  {
    id: 'pharmacy', name: 'Аптека', kind: 'room', x: 15, y: 16, w: 7, h: 7, floor: 'lab',
    doors: [{ side: 'N', at: 18 }, { side: 'S', at: 18 }],
    windows: [],
    items: [
      { type: 'pharmacy_shelf', x: 15, y: 16 }, { type: 'pharmacy_shelf', x: 19, y: 16 },
      { type: 'pharmacy_counter', x: 16, y: 19 }, { type: 'waiting_chair', x: 21, y: 19 },
      { type: 'waiting_chair', x: 21, y: 20 },
    ],
  },
  {
    id: 'cafeteria', name: 'Кафетерий', kind: 'room', x: 26, y: 16, w: 9, h: 7, floor: 'hall',
    doors: [{ side: 'N', at: 30 }, { side: 'S', at: 30 }],
    windows: [],
    items: [
      { type: 'cafe_table', x: 27, y: 17 }, { type: 'cafe_table', x: 27, y: 20 },
      { type: 'cafe_table', x: 33, y: 17 }, { type: 'cafe_table', x: 33, y: 20 },
      { type: 'vending_machine', x: 34, y: 16 }, { type: 'water_cooler', x: 26, y: 16 },
      { type: 'plant_big', x: 34, y: 22 },
    ],
  },
  {
    id: 'reception', name: 'Регистратура', kind: 'zone', x: 14, y: 27, w: 11, h: 7, floor: 'hall',
    items: [
      { type: 'reception_desk', x: 17, y: 28 }, { type: 'cash_desk', x: 21, y: 28 },
      { type: 'plant_big', x: 14, y: 27 }, { type: 'water_cooler', x: 24, y: 27 },
    ],
  },
  {
    id: 'hall', name: 'Холл', kind: 'zone', x: 27, y: 27, w: 18, h: 7, floor: 'hall',
    items: [
      { type: 'hall_sofa', x: 29, y: 28 }, { type: 'hall_sofa', x: 33, y: 28 },
      { type: 'hall_sofa', x: 37, y: 28 }, { type: 'waiting_sofa', x: 30, y: 31 },
      { type: 'waiting_sofa', x: 34, y: 31 }, { type: 'waiting_chair', x: 41, y: 28 },
      { type: 'waiting_chair', x: 42, y: 28 }, { type: 'plant_big', x: 44, y: 27 },
    ],
  },
];
