// Каталог предметов для режима строительства. name: ключ спрайта из assets/final,
// w x d: основание в тайлах (при повороте меняются местами), price: цена, refund: доля при продаже.

export const SELL_REFUND = 0.6;
export const START_COINS = 5000;

export const CATALOG = [
  { type: 'reception_desk', title: 'Стойка регистратуры', w: 3, d: 1, price: 300, group: 'Холл' },
  { type: 'cash_desk', title: 'Касса', w: 2, d: 1, price: 220, group: 'Холл' },
  { type: 'hall_sofa', title: 'Диван', w: 2, d: 1, price: 150, group: 'Холл' },
  { type: 'waiting_sofa', title: 'Малый диван', w: 2, d: 1, price: 120, group: 'Холл' },
  { type: 'waiting_chair', title: 'Кресло ожидания', w: 1, d: 1, price: 40, group: 'Холл' },
  { type: 'plant_big', title: 'Растение', w: 1, d: 1, price: 35, group: 'Холл' },
  { type: 'water_cooler', title: 'Кулер', w: 1, d: 1, price: 60, group: 'Холл' },
  { type: 'doctor_desk', title: 'Стол врача', w: 2, d: 1, price: 200, group: 'Кабинет' },
  { type: 'doctor_chair', title: 'Кресло врача', w: 1, d: 1, price: 40, group: 'Кабинет' },
  { type: 'exam_couch', title: 'Кушетка', w: 2, d: 1, price: 180, group: 'Кабинет' },
  { type: 'microscope_table', title: 'Стол с микроскопом', w: 2, d: 1, price: 260, group: 'Лаборатория' },
  { type: 'sample_table', title: 'Стол с пробирками', w: 2, d: 1, price: 200, group: 'Лаборатория' },
  { type: 'xray_machine', title: 'Рентген', w: 2, d: 2, price: 900, group: 'Оборудование' },
  { type: 'ultrasound_machine', title: 'УЗИ', w: 1, d: 1, price: 500, group: 'Оборудование' },
  { type: 'iv_chair', title: 'Кресло для капельницы', w: 1, d: 1, price: 150, group: 'Оборудование' },
  { type: 'iv_stand', title: 'Стойка капельницы', w: 1, d: 1, price: 50, group: 'Оборудование' },
  { type: 'ward_bed', title: 'Койка', w: 2, d: 1, price: 250, group: 'Палата' },
  { type: 'pharmacy_counter', title: 'Прилавок аптеки', w: 3, d: 1, price: 300, group: 'Аптека' },
  { type: 'pharmacy_shelf', title: 'Стеллаж', w: 2, d: 1, price: 180, group: 'Аптека' },
  { type: 'cafe_table', title: 'Столик', w: 1, d: 1, price: 90, group: 'Кафетерий' },
  { type: 'vending_machine', title: 'Автомат', w: 1, d: 1, price: 200, group: 'Кафетерий' },
];

export const CATALOG_BY_TYPE = Object.fromEntries(CATALOG.map((item) => [item.type, item]));
