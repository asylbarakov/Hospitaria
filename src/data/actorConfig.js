// Баланс и настройки изометрических персонажей (этап 12).
// Скорости, размеры, отступы подписей и иконки меняются здесь, без правки IsoActor.

export const ACTOR_MOTION = {
  walkSpeed: 3.4, // тайлов в секунду
  radius: 0.2, // половина основания для сортировки и проверки стен
  bobHeight: 4, // подпрыгивание при ходьбе, px
  walkAnimRate: 5,
  tilt: 0.04, // лёгкий наклон корпуса при ходьбе, радиан
  idleRate: 2.2,
  breatheAmount: 0.015, // дыхание в покое: масштаб спрайта ±1.5%
  bobReturn: 12,
};

export const ACTOR_VIEW = {
  shadowWidth: 46,
  shadowHeight: 20,
  shadowAlpha: 0.28,
  shadowDepth: 1,
  nameOffsetY: -124,
  iconOffsetY: -164,
  iconScale: 0.3, // иконки 192x192 -> ~58 px
  plateSize: 62,
  plateAlpha: 0.92,
  nameFontSize: 17,
};

export const PATIENT_SKINS = [
  'patient_01', 'patient_02', 'patient_03', 'patient_04',
  'patient_05', 'patient_06', 'patient_07', 'patient_08',
];

// Иконки статуса и симптомов: имена файлов без .png из assets/final/icons.
export const ACTOR_ICONS = [
  'icon_coin',
  'icon_waiting',
  'icon_patience',
  'icon_role_doctor',
  'icon_role_nurse',
  'icon_runny_nose',
  'icon_sore_throat',
  'icon_fever',
  'icon_rash',
  'icon_fracture',
  'icon_cough',
  'icon_stomach',
  'icon_headache',
  'icon_sprain',
];

export const DISEASE_ICONS = {
  'runny-nose': 'icon_runny_nose',
  angina: 'icon_sore_throat',
  cold: 'icon_fever',
  allergy: 'icon_rash',
  bruise: 'icon_fracture',
  cough: 'icon_cough',
  stomach: 'icon_stomach',
  earache: 'icon_headache',
  sunburn: 'icon_rash',
  fatigue: 'icon_waiting',
  sinusitis: 'icon_headache',
  bronchitis: 'icon_cough',
  'food-poisoning': 'icon_stomach',
  dehydration: 'icon_fever',
  sprain: 'icon_sprain',
  'insect-bite': 'icon_rash',
  migraine: 'icon_headache',
  'vitamin-deficiency': 'icon_waiting',
};

export const DEFAULT_DISEASE_ICON = 'icon_waiting';

export function diseaseIcon(diseaseId) {
  return DISEASE_ICONS[diseaseId] || DEFAULT_DISEASE_ICON;
}

// Заглушки пациентов на этапе 12: места в холле проверены на проходимость.
// Первое место за диваном, второе у двери кафетерия, третье перед диваном.
export const DUMMY_PATIENTS = [
  { x: 30.5, y: 27.5 },
  { x: 30.5, y: 24.5 },
  { x: 38.5, y: 29.5 },
];
