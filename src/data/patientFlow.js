// Данные цикла пациента в изометрии (этап 14).
// Здесь только баланс и таблицы: состояния, тайминги, комнаты, требования к мебели
// и подсказки. Логика живёт в src/iso/PatientAgent.js и src/iso/PatientFlow.js.

import { PATIENT_CONFIG } from './patientConfig.js';

export const FLOW_STATES = {
  ENTERING: 'entering',
  TO_RECEPTION: 'toReception',
  REGISTERING: 'registering',
  WAITING: 'waiting',
  TO_ROOM: 'toRoom',
  IN_TREATMENT: 'inTreatment',
  TO_PAY: 'toPay',
  LEAVING: 'leaving',
  LEFT_ANGRY: 'leftAngry',
  GONE: 'gone',
};

export const PATIENT_FLOW = {
  maxPatients: PATIENT_CONFIG.maxPatients,
  firstSpawnDelay: PATIENT_CONFIG.firstSpawnDelay,
  spawnIntervalMin: PATIENT_CONFIG.spawnIntervalMin,
  spawnIntervalMax: PATIENT_CONFIG.spawnIntervalMax,
  patienceMin: 55000,
  patienceMax: 80000,
  registrationMs: 1400,
  treatmentMs: 3200,
  payMs: 900,
  treatmentStars: 2, // награда как за две звезды до появления мини-игр (этап 18)
  patiencePenalty: PATIENT_CONFIG.leaveReputationPenalty,
  wrongDiagnosisPenalty: 3,
  walkSpeed: 3.4, // тайлов в секунду, как ACTOR_MOTION.walkSpeed
};

// Старые обозначения комнат в diseases.js -> id комнат из layout.js.
export const ROOM_BY_CONDITION = {
  doctor: 'therapist',
  procedure: 'procedure',
  ward: 'ward',
  lab: 'lab',
  pharmacy: 'pharmacy',
  rest: 'cafeteria',
  xray: 'xray',
};

// Какая мебель делает комнату пригодной для лечения. Достаточно одного предмета.
export const TREATMENT_ITEMS = {
  therapist: ['exam_couch'],
  procedure: ['iv_chair', 'exam_couch'],
  ward: ['ward_bed'],
  lab: ['microscope_table', 'sample_table'],
  pharmacy: ['pharmacy_counter'],
  cafeteria: ['cafe_table'],
  xray: ['xray_machine'],
};

export const ROOM_HINTS = {
  therapist: 'Купите кушетку в кабинет терапевта',
  procedure: 'Купите кресло для капельницы или кушетку в процедурную',
  ward: 'Купите койку в палату',
  lab: 'Купите стол с микроскопом в лабораторию',
  pharmacy: 'Купите прилавок в аптеку',
  cafeteria: 'Поставьте столик в кафетерий',
  xray: 'Купите рентген в кабинет рентгена',
};

export const WAITING_ITEM_TYPES = ['waiting_chair', 'waiting_sofa', 'hall_sofa'];
export const RECEPTION_ITEM_TYPES = ['reception_desk'];
export const PAY_ITEM_TYPES = ['cash_desk'];

// Места, где пациент ждёт стоя, если все кресла заняты или проданы.
// Проверены на проходимость в тестах layout.
export const FALLBACK_WAIT_TILES = [
  { x: 31, y: 30 }, { x: 35, y: 30 }, { x: 39, y: 30 },
  { x: 28, y: 33 }, { x: 32, y: 33 }, { x: 36, y: 33 },
  { x: 40, y: 33 }, { x: 43, y: 31 }, { x: 28, y: 30 },
  { x: 42, y: 33 }, { x: 44, y: 32 }, { x: 27, y: 29 },
  { x: 45, y: 31 }, { x: 31, y: 26 }, { x: 35, y: 26 },
];

export function roomForDisease(disease) {
  if (!disease) {
    return 'therapist';
  }
  return ROOM_BY_CONDITION[disease.room] || 'therapist';
}

export function roomHint(roomId) {
  return ROOM_HINTS[roomId] || 'Поставьте в комнату нужную мебель';
}

export function treatmentItems(roomId) {
  return TREATMENT_ITEMS[roomId] || [];
}
