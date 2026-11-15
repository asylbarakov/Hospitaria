// Стратегия и константы симуляции баланса (этап 17).
// Цены и названия предметов не дублируются: здесь только порядок покупок.

export const SIM = {
  minutes: 60,
  tickMs: 250,
  startItems: 51, // мебель планировки по умолчанию
  startRooms: 9,
  reserve: 120, // запас на ежедневные счета, который игрок не тратит
  serviceMs: 26000, // базовое время одного приёма без сотрудников
};

// Типичная стратегия: обустройство -> первый сотрудник -> расширения.
// Каждый шаг — «пакет» мебели и/или найм.
export const PLAN = [
  { title: 'Уютный холл', items: ['waiting_chair', 'plant_big'] },
  { title: 'Диван в холле', items: ['hall_sofa'] },
  { title: 'Первый сотрудник', hire: 'janitor' },
  { title: 'Регистратура', hire: 'receptionist', items: ['reception_desk', 'waiting_sofa', 'water_cooler', 'cafe_table'] },
  { title: 'Процедурная', items: ['iv_chair', 'iv_stand', 'ward_bed', 'pharmacy_shelf', 'cash_desk'] },
  { title: 'Кабинет врача', items: ['exam_couch', 'doctor_chair', 'doctor_desk', 'microscope_table'] },
  { title: 'УЗИ и анализы', items: ['ultrasound_machine', 'sample_table', 'vending_machine'] },
  { title: 'Аптека и кафетерий', hire: 'nurse', items: ['pharmacy_counter', 'cafe_table'] },
  { title: 'Рентген', items: ['xray_machine'] },
  { title: 'Лаборатория 2', items: ['cash_desk', 'sample_table'] },
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
