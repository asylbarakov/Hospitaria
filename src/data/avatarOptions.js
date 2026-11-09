export const ROLES = [
  { id: 'doctor', label: 'Врач' },
  { id: 'nurse', label: 'Медсестра' },
];

export const PATIENT_ROLE = 'patient';

export const PATIENT_CLOTHES = [
  { color: 0xef9a9a, label: 'Красный' },
  { color: 0x90caf9, label: 'Синий' },
  { color: 0xa5d6a7, label: 'Зелёный' },
  { color: 0xffcc80, label: 'Оранжевый' },
  { color: 0xce93d8, label: 'Сиреневый' },
  { color: 0x80cbc4, label: 'Бирюзовый' },
  { color: 0xfff59d, label: 'Жёлтый' },
  { color: 0xbcaaa4, label: 'Коричневый' },
];

export const SKIN_COLORS = [
  { color: 0xffe0c2, label: 'Светлая' },
  { color: 0xf1c27d, label: 'Бежевая' },
  { color: 0xd99a62, label: 'Смуглая' },
  { color: 0xa8693b, label: 'Тёмная' },
  { color: 0x6b4127, label: 'Очень тёмная' },
];

export const HAIRSTYLES = [
  { id: 'short', label: 'Короткая' },
  { id: 'bob', label: 'Каре' },
  { id: 'long', label: 'Длинные' },
  { id: 'ponytail', label: 'Хвостик' },
  { id: 'bun', label: 'Пучок' },
];

export const HAIR_COLORS = [
  { color: 0x2b1b12, label: 'Чёрный' },
  { color: 0x5a3825, label: 'Каштановый' },
  { color: 0x8b5a2b, label: 'Русый' },
  { color: 0xd7b26b, label: 'Блонд' },
  { color: 0xc0562e, label: 'Рыжий' },
  { color: 0xd9d9d9, label: 'Седой' },
];

export const COAT_COLORS = [
  { color: 0xffffff, label: 'Белый' },
  { color: 0x9fd8ef, label: 'Голубой' },
  { color: 0xa8d9a3, label: 'Зелёный' },
  { color: 0xf6b8c9, label: 'Розовый' },
  { color: 0xc3b2e6, label: 'Лавандовый' },
  // Премиальные халаты продаются только в магазине.
  { color: 0x9fe0d6, label: 'Мятный', premium: true },
  { color: 0xf2a6a0, label: 'Коралловый', premium: true },
  { color: 0xf0d18a, label: 'Золотой', premium: true },
];

export const ACCESSORIES = [
  { id: 'none', label: 'Нет' },
  { id: 'glasses', label: 'Очки' },
  { id: 'mask', label: 'Маска' },
  { id: 'stethoscope', label: 'Стетоскоп' },
  { id: 'headmirror', label: 'Налобное зеркало', premium: true },
];

export const HATS = [
  { id: 'none', label: 'Без шапочки' },
  { id: 'beret', label: 'Берет', color: 0xc3b2e6 },
  { id: 'cap', label: 'Шапочка', color: 0xffffff },
];

export const SHOES = [
  { id: 'classic', label: 'Классические', color: 0x455a64, sole: 0xcfd8dc },
  { id: 'white', label: 'Белые', color: 0xf5f5f5, sole: 0xb0bec5 },
  { id: 'mint', label: 'Мятные', color: 0x80cbc4, sole: 0xe0f2f1 },
];

export const DEFAULT_AVATAR = {
  role: 'doctor',
  skin: 0,
  hairstyle: 0,
  hairColor: 0,
  coat: 0,
  accessory: 0,
  hat: 0,
  shoes: 0,
};

function pickIndex(value, list) {
  if (!Number.isInteger(value)) {
    return 0;
  }
  return Math.max(0, Math.min(list.length - 1, value));
}

export function normalizeAvatar(config = {}) {
  const role = ROLES.some((item) => item.id === config.role) || config.role === PATIENT_ROLE
    ? config.role
    : DEFAULT_AVATAR.role;
  const coatList = role === PATIENT_ROLE ? PATIENT_CLOTHES : COAT_COLORS;

  return {
    role,
    skin: pickIndex(config.skin, SKIN_COLORS),
    hairstyle: pickIndex(config.hairstyle, HAIRSTYLES),
    hairColor: pickIndex(config.hairColor, HAIR_COLORS),
    coat: pickIndex(config.coat, coatList),
    accessory: pickIndex(config.accessory, ACCESSORIES),
    hat: pickIndex(config.hat, HATS),
    shoes: pickIndex(config.shoes, SHOES),
  };
}
