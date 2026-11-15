export const MINIGAME_KEYS = [
  'exam',
  'thermometer',
  'medicine',
  'injection',
  'breath',
  'drops',
  'compress',
];

export const MINIGAME_TIME_LIMIT = 25000;

// Этап 18: какая мини-игра какой комнате подходит. Первая игра — основная.
// Болезнь просит свою игру (disease.game), но если комнате она не подходит,
// берётся первая из списка. Новые игры сюда не добавлены: только существующие.
export const ROOM_MINIGAMES = Object.freeze({
  therapist: ['exam', 'thermometer', 'medicine', 'breath', 'compress'],
  procedure: ['injection', 'compress', 'medicine', 'breath'],
  ward: ['breath', 'thermometer', 'drops'],
  lab: ['drops', 'medicine', 'injection', 'exam'],
  xray: ['exam', 'compress'],
  pharmacy: ['medicine', 'drops'],
  cafeteria: ['breath', 'exam'],
  reception: [],
  hall: [],
});

export const MINIGAME_TITLES = Object.freeze({
  exam: 'Осмотр',
  thermometer: 'Градусник',
  medicine: 'Подбор лекарства',
  injection: 'Укол / капельница',
  breath: 'Дыхание',
  drops: 'Капли',
  compress: 'Компресс',
});

// Сложные болезни врач не лечит автоматически: их ведёт игрок.
export const PLAYER_PRIORITY_DISEASES = Object.freeze([
  'bronchitis',
  'food-poisoning',
  'dehydration',
  'migraine',
  'sinusitis',
  'sprain',
]);

// Камера перед мини-игрой: наезд на комнату и возврат после результата.
export const TREATMENT_CAMERA_ZOOM = 1.1;
export const TREATMENT_CAMERA_FOCUS_MS = 420;
export const TREATMENT_CAMERA_RETURN_MS = 320;

// Редкая награда за идеальный приём (этап 17.5): 1 кристалл с шансом 20%.
// Кристаллы нужны для открытия кабинетов и кристальных нарядов.
export const PERFECT_TREATMENT_CRYSTAL_CHANCE = 0.2;
export const PERFECT_TREATMENT_CRYSTALS = 1;

export const STAR_REWARD_MULTIPLIER = {
  1: 0.6,
  2: 1,
  3: 1.5,
};

export const STAR_REPUTATION = {
  1: 1,
  2: 2,
  3: 3,
};

export const SKIP_REPUTATION_PENALTY = 5;
export const FAIL_REPUTATION_PENALTY = 2;
