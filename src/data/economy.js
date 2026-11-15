// Экономика 2.0 (этап 17). Все суммы, длительности и пороги баланса — только здесь.
// Логика живёт в systems/GameState.js и systems/HospitalEconomy.js.

export const SCHEMA_VERSION = 2;

// Кристаллы за новый уровень (этап 17.5). Награда выдаётся один раз в GameState.
export const CRYSTALS_PER_LEVEL = 2;

export function crystalsForLevel(level) {
  return Math.max(0, Math.floor(Number(level) || 0)) >= 2 ? CRYSTALS_PER_LEVEL : 0;
}

export const ECONOMY = {
  // «День» длится ровно столько реального времени; часы на HUD идут от 08:00 к 20:00.
  dayLengthMs: 180000,
  clock: { startMinutes: 8 * 60, spanMinutes: 12 * 60 },

  startCoins: 200,
  // Даже самый простой пациент платит минимум: при нуле монет это «кредит доверия».
  minTreatmentIncome: 10,

  tips: {
    rate: 0.15,
    maxRate: 0.3,
    reputationFloor: 0.5, // при репутации 0 чаевые всё равно 50% ставки
    speedFloor: 0.6, // уставший пациент даёт 60% от полной ставки
  },

  suppliesPerTreatment: 2, // лекарства в аптеке, списываются в «Итогах дня»

  utilities: {
    base: 4,
    perRoom: 1.5,
    perItem: 0.2,
  },

  queueLimit: 4, // больше ожидающих — предупреждение и небольшой штраф в конце дня
  queuePenalty: 8,
  debtLimit: 200, // дальше расходы прощает «кредит доверия», игра не заканчивается
};

export const PENALTIES = {
  waiting: { title: 'Пациент ушёл из очереди', coins: 6 },
  diagnosis: { title: 'Ошибка в диагнозе', coins: 3 },
  dirt: { title: 'Грязная больница', coins: 4 },
  minigame: { title: 'Неудачная процедура', coins: 4 },
};

// Что открывается на уровне. Список используется только для подсказки игроку.
export const LEVEL_UNLOCKS = {
  2: { items: ['Малый диван', 'Койка', 'УЗИ', 'Стеллаж'], staff: ['Медсестра'] },
  3: { items: ['Рентген'], staff: ['Врач', 'Лаборант'] },
};

export function unlockText(level) {
  const entry = LEVEL_UNLOCKS[level];
  if (!entry) {
    return '';
  }
  const parts = [];
  if (entry.staff && entry.staff.length) {
    parts.push(`сотрудники: ${entry.staff.join(', ')}`);
  }
  if (entry.items && entry.items.length) {
    parts.push(`предметы: ${entry.items.join(', ')}`);
  }
  return parts.join(' · ');
}

export default ECONOMY;
