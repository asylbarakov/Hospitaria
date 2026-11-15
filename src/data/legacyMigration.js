// Таблица переноса покупок v0.1 (hospital_save_v1) в изометрию v0.2.
// Боковые комнаты не совпадают с планировкой v2, поэтому купленное не переставляется,
// а возвращается монетами по цене v0.1. type: ближайший тип из buildCatalog (для отчёта).

export const LEGACY_SHOP = Object.freeze({
  'coat-mint': { price: 120, type: null },
  'coat-coral': { price: 180, type: null },
  'coat-gold': { price: 300, type: null },
  'hat-beret': { price: 90, type: null },
  'hat-cap': { price: 150, type: null },
  'shoes-white': { price: 80, type: null },
  'shoes-mint': { price: 140, type: null },
  'acc-headmirror': { price: 220, type: null },
  'furn-aquarium': { price: 180, type: 'water_cooler' },
  'furn-sofa': { price: 260, type: 'hall_sofa' },
  'furn-scanner': { price: 320, type: 'ultrasound_machine' },
  'furn-armchair': { price: 150, type: 'waiting_chair' },
  'furn-lamp': { price: 100, type: 'plant_big' },
  'furn-rug': { price: 120, type: 'plant_big' },
  'furn-lab-scanner': { price: 360, type: 'ultrasound_machine' },
  'furn-pharmacy-cabinet': { price: 280, type: 'pharmacy_shelf' },
  'furn-archive-lamp': { price: 190, type: 'plant_big' },
  'furn-staff-aquarium': { price: 340, type: 'water_cooler' },
});

export const LEGACY_SAVE_KEY = 'hospital_save_v1';
