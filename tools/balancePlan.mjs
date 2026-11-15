// Стратегия и константы симуляции баланса (этапы 17 и 17.5).
// Цены и названия предметов не дублируются: здесь только порядок покупок.
// Шаг с room открывает кабинет за монеты и кристаллы (цена в data/roomUnlocks.js).

export const SIM = {
  minutes: 60,
  tickMs: 250,
  startItems: 51, // мебель планировки по умолчанию
  startRooms: 9,
  reserve: 120, // запас на ежедневные счета, который игрок не тратит
  serviceMs: 26000, // базовое время одного приёма без сотрудников
};

// Типичная стратегия: обустройство -> первый сотрудник -> кабинеты -> мебель.
// Кабинеты открываются по порядку, чтобы проверить темп «первый за 8–12 минут,
// все за 40–60 минут». Мебель дорогих кабинетов докупается после открытия.
export const PLAN = [
  { title: 'Уютный холл', items: ['waiting_chair', 'plant_big'] },
  { title: 'Диван в холле', items: ['hall_sofa'] },
  { title: 'Первый сотрудник', hire: 'janitor' },
  { title: 'Кулер в холле', items: ['water_cooler'] },
  { title: 'Процедурная', room: 'procedure' },
  { title: 'Регистратура', hire: 'receptionist', items: ['reception_desk', 'waiting_sofa'] },
  { title: 'Кабинет врача', items: ['exam_couch', 'doctor_chair', 'doctor_desk', 'microscope_table'] },
  { title: 'Палата', room: 'ward' },
  { title: 'Аптека', room: 'pharmacy' },
  { title: 'Кафетерий', room: 'cafeteria' },
  { title: 'Лаборатория', room: 'lab' },
  { title: 'Рентген', room: 'xray' },
  { title: 'Койка в палате', items: ['ward_bed'] },
  { title: 'Прилавок аптеки', items: ['pharmacy_counter'] },
  { title: 'Стол анализов', items: ['sample_table'] },
  { title: 'Рентген-аппарат', items: ['xray_machine'] },
  { title: 'Кафетерий у входа', items: ['cafe_table', 'vending_machine'] },
];

export function seeded(seed = 17) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

export function pick(list, random) {
  return list[Math.floor(random() * list.length)];
}
