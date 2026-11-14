// Баланс заданий v2 (этап 16): ежедневные, недельные и сюжетная цепочка.
// Меняйте цели, награды и тексты здесь; логика живёт в systems/Quests.js.
// reward: { coins, experience, crystals } — кристаллы даются только за задания.

export const QUEST_EVENTS = [
  'patientTreated',
  'patientLeftAngry',
  'itemBought',
  'itemSold',
  'staffHired',
  'roomUnlocked',
  'coinsEarned',
];

export const QUEST_CATEGORIES = {
  daily: { title: 'Ежедневные', icon: 'icon_quest_daily', color: 0x4caf50 },
  weekly: { title: 'Недельные', icon: 'icon_quest_weekly', color: 0x3f8fb0 },
  story: { title: 'Сюжет', icon: 'icon_quest_story', color: 0x8d7bb5 },
};

function reward(coins, experience, crystals = 0) {
  return { coins, experience, crystals };
}

export const DAILY_QUESTS = [
  {
    id: 'daily-treat-3',
    title: 'Примите 3 пациентов',
    description: 'Любой успешный приём, даже с одной звездой',
    event: 'patientTreated',
    target: 3,
    reward: reward(80, 10),
  },
  {
    id: 'daily-earn-200',
    title: 'Заработайте 200 монет',
    description: 'Монеты за лечение пациентов',
    event: 'coinsEarned',
    amountKey: 'amount',
    target: 200,
    reward: reward(100, 10),
  },
  {
    id: 'daily-buy-1',
    title: 'Купите предмет',
    description: 'Любая мебель или украшение для больницы',
    event: 'itemBought',
    target: 1,
    reward: reward(60, 5),
  },
];

export const WEEKLY_QUESTS = [
  {
    id: 'weekly-treat-20',
    title: 'Вылечите 20 пациентов',
    description: 'Недельная цель для всей больницы',
    event: 'patientTreated',
    target: 20,
    reward: reward(500, 100, 2),
  },
  {
    id: 'weekly-hire-2',
    title: 'Наймите 2 сотрудников',
    description: 'Регистратор, врач, медсестра, лаборант или уборщик',
    event: 'staffHired',
    target: 2,
    reward: reward(300, 50, 1),
  },
  {
    id: 'weekly-buy-5',
    title: 'Обновите больницу',
    description: 'Купите 5 предметов мебели за неделю',
    event: 'itemBought',
    target: 5,
    reward: reward(300, 50, 1),
  },
];

export const STORY_QUESTS = [
  {
    id: 'story-ward-bed',
    title: 'Койка в палате',
    description: 'Купите койку для палаты',
    event: 'itemBought',
    match: { type: 'ward_bed' },
    target: 1,
    reward: reward(150, 20),
  },
  {
    id: 'story-receptionist',
    title: 'Первый сотрудник',
    description: 'Наймите регистратора',
    event: 'staffHired',
    match: { roleId: 'receptionist' },
    target: 1,
    reward: reward(200, 25),
  },
  {
    id: 'story-treat-5',
    title: 'Поток пациентов',
    description: 'Вылечите 5 пациентов',
    event: 'patientTreated',
    target: 5,
    reward: reward(250, 30, 1),
  },
  {
    id: 'story-comfort',
    title: 'Уютная больница',
    description: 'Купите 3 предмета для уюта',
    event: 'itemBought',
    target: 3,
    reward: reward(200, 20, 1),
  },
  {
    id: 'story-treat-10',
    title: 'Опытный врач',
    description: 'Вылечите ещё 10 пациентов',
    event: 'patientTreated',
    target: 10,
    reward: reward(400, 50, 2),
  },
  {
    id: 'story-doctor',
    title: 'Врач в команде',
    description: 'Наймите врача',
    event: 'staffHired',
    match: { roleId: 'doctor' },
    target: 1,
    reward: reward(300, 40, 2),
  },
  {
    id: 'story-earn-1000',
    title: 'Стабильный доход',
    description: 'Заработайте 1000 монет за лечение',
    event: 'coinsEarned',
    amountKey: 'amount',
    target: 1000,
    reward: reward(600, 80, 3),
  },
];

export const ALL_QUESTS = [...DAILY_QUESTS, ...WEEKLY_QUESTS, ...STORY_QUESTS];

export function questById(id) {
  return ALL_QUESTS.find((quest) => quest.id === id) || null;
}

export function questsByCategory(category) {
  if (category === 'weekly') {
    return WEEKLY_QUESTS;
  }
  if (category === 'story') {
    return STORY_QUESTS;
  }
  return DAILY_QUESTS;
}

export default ALL_QUESTS;
