// Персонал изометрии (этап 15): роли, цены найма, зарплаты и баланс автоматизации.
// Логика живёт в StaffAgent/StaffFlow, здесь только числа и таблицы.

export const STAFF_CONFIG = {
  maxStaff: 6,
  salaryDayMs: 240000, // игровой день до появления календаря этапа 17
  autoDelayMs: 1600, // как часто врач/лаборант проверяет кабинет
  receptionBoost: 3, // во сколько раз быстрее регистрирует регистратор
  cleanMs: 1200,
  dirtIntervalMs: 30000,
  dirtMax: 5,
  dirtGraceMs: 45000, // пятно сначала просто лежит
  dirtPenaltyMs: 30000,
  dirtPenalty: 1,
};

export const STAFF_ROLES = [
  {
    id: 'receptionist',
    title: 'Регистратор',
    sprite: 'staff_receptionist',
    icon: 'icon_role_receptionist',
    color: 0x2f80c9,
    price: 350,
    salary: 35,
    speed: 3.4,
    postTypes: ['reception_desk'],
    service: 'reception',
    hint: 'Регистрирует очередь быстрее',
  },
  {
    id: 'doctor',
    title: 'Врач',
    sprite: 'staff_doctor',
    icon: 'icon_role_doctor',
    color: 0x3f9b4a,
    price: 600,
    salary: 60,
    speed: 3.2,
    postTypes: ['doctor_desk'],
    service: 'treat',
    autoStars: 1,
    hint: 'Сам ведёт приём в своём кабинете',
  },
  {
    id: 'nurse',
    title: 'Медсестра',
    sprite: 'staff_nurse',
    icon: 'icon_role_nurse',
    color: 0x7b5bb8,
    price: 450,
    salary: 45,
    speed: 3.4,
    postTypes: ['iv_stand'],
    service: 'assist',
    autoStars: 1,
    hint: 'Зовёт пациентов в процедурную и палату',
  },
  {
    id: 'labtech',
    title: 'Лаборант',
    sprite: 'staff_labtech',
    icon: 'icon_role_labtech',
    color: 0x2f80c9,
    price: 500,
    salary: 50,
    speed: 3.3,
    postTypes: ['microscope_table', 'sample_table'],
    service: 'treat',
    autoStars: 1,
    hint: 'Делает анализы в лаборатории',
  },
  {
    id: 'janitor',
    title: 'Уборщик',
    sprite: 'staff_janitor',
    icon: 'icon_role_janitor',
    color: 0xc9622f,
    price: 250,
    salary: 25,
    speed: 3.6,
    postTypes: [],
    service: 'clean',
    hint: 'Убирает пятна в холле',
  },
];

export const STAFF_NAMES = [
  'Анна', 'Мария', 'Ирина', 'Ольга', 'Елена', 'Светлана',
  'Павел', 'Игорь', 'Дмитрий', 'Сергей', 'Алексей', 'Михаил',
];

// Свободные тайлы холла, где работник без поста ждёт распоряжений.
export const STAFF_IDLE_TILES = [
  { x: 28, y: 30 }, { x: 31, y: 30 }, { x: 35, y: 30 },
  { x: 39, y: 30 }, { x: 43, y: 31 }, { x: 44, y: 32 },
];

// Где могут появляться пятна. Проходимость проверяет StaffPoints.
export const STAFF_DIRT_TILES = [
  { x: 31, y: 30 }, { x: 35, y: 30 }, { x: 39, y: 30 },
  { x: 28, y: 33 }, { x: 32, y: 33 }, { x: 36, y: 33 },
  { x: 40, y: 33 }, { x: 43, y: 31 }, { x: 31, y: 26 },
  { x: 35, y: 26 }, { x: 28, y: 30 }, { x: 44, y: 32 },
];

export const POST_TITLES = {
  reception_desk: 'стойка регистратуры',
  doctor_desk: 'стол врача',
  iv_stand: 'стойка капельницы',
  microscope_table: 'стол с микроскопом',
  sample_table: 'стол анализов',
};

export function staffRole(roleId) {
  return STAFF_ROLES.find((role) => role.id === roleId) || null;
}
