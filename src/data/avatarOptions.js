export const ROLES = [
  { id: 'doctor', label: 'Врач' },
  { id: 'nurse', label: 'Медсестра' },
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
];

export const ACCESSORIES = [
  { id: 'none', label: 'Нет' },
  { id: 'glasses', label: 'Очки' },
  { id: 'mask', label: 'Маска' },
  { id: 'stethoscope', label: 'Стетоскоп' },
];

export const DEFAULT_AVATAR = {
  role: 'doctor',
  skin: 0,
  hairstyle: 0,
  hairColor: 0,
  coat: 0,
  accessory: 0,
};

function pickIndex(value, list) {
  if (!Number.isInteger(value)) {
    return 0;
  }
  return Math.max(0, Math.min(list.length - 1, value));
}

export function normalizeAvatar(config = {}) {
  const role = ROLES.some((item) => item.id === config.role)
    ? config.role
    : DEFAULT_AVATAR.role;

  return {
    role,
    skin: pickIndex(config.skin, SKIN_COLORS),
    hairstyle: pickIndex(config.hairstyle, HAIRSTYLES),
    hairColor: pickIndex(config.hairColor, HAIR_COLORS),
    coat: pickIndex(config.coat, COAT_COLORS),
    accessory: pickIndex(config.accessory, ACCESSORIES),
  };
}
