// Облики игрока для изометрии (этап 12). Готовые PNG одноцветные, поэтому
// кастомизация v2 это выбор целого облика + цветной акцент роли над головой.
// Цены и списки меняются здесь, логика сцен их только читает.

export const PLAYER_ROLES = [
  { id: 'doctor', title: 'Врач', sprite: 'staff_doctor', icon: 'icon_role_doctor' },
  { id: 'nurse', title: 'Медсестра', sprite: 'staff_nurse', icon: 'icon_role_nurse' },
];

// sprite: ключ файла в assets/final (anchors.json). price = 0: доступен при создании.
export const PLAYER_SKINS = [
  { id: 'staff_doctor', title: 'Халат врача', price: 0 },
  { id: 'staff_nurse', title: 'Форма медсестры', price: 0 },
  { id: 'staff_receptionist', title: 'Костюм регистратора', price: 120 },
  { id: 'staff_labtech', title: 'Халат лаборанта', price: 160 },
  { id: 'staff_janitor', title: 'Костюм уборщика', price: 90 },
  { id: 'staff_admin', title: 'Костюм администратора', price: 200 },
];

// Цветная плашка под иконкой роли: не перекрашивает спрайт целиком.
export const ACCENTS = [
  { id: 'mint', title: 'Мята', color: 0x35c4a0 },
  { id: 'sky', title: 'Небо', color: 0x3f9bdf },
  { id: 'peach', title: 'Персик', color: 0xef8d5a },
  { id: 'violet', title: 'Сирень', color: 0x9b6ff0 },
  { id: 'sun', title: 'Солнце', color: 0xe0b020 },
];

export const DEFAULT_PLAYER = {
  name: '',
  role: 'doctor',
  skin: 'staff_doctor',
  accent: 'mint',
  owned: [],
};

export const MAX_PLAYER_NAME = 14;

export function roleById(id) {
  return PLAYER_ROLES.find((role) => role.id === id) || PLAYER_ROLES[0];
}

export function skinById(id) {
  return PLAYER_SKINS.find((skin) => skin.id === id) || PLAYER_SKINS[0];
}

export function accentById(id) {
  return ACCENTS.find((accent) => accent.id === id) || ACCENTS[0];
}

export function isSkinOwned(skinId, owned = []) {
  const skin = skinById(skinId);
  return skin.price === 0 || owned.includes(skin.id);
}

/** Безопасно приводит сохранение к известному набору полей. */
export function normalizePlayer(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  const role = roleById(data.role);
  const knownSkin = PLAYER_SKINS.some((skin) => skin.id === data.skin);
  const skin = knownSkin ? data.skin : role.sprite;
  const owned = Array.isArray(data.owned)
    ? data.owned.filter((id) => PLAYER_SKINS.some((item) => item.id === id))
    : [];
  const name = typeof data.name === 'string' ? data.name.trim().slice(0, MAX_PLAYER_NAME) : '';
  return {
    name,
    role: role.id,
    skin,
    accent: accentById(data.accent).id,
    owned: [...new Set(owned)],
  };
}

const NAME_CHARS = /[^A-Za-zА-Яа-яЁё0-9 \-]/g;

/** Оставляет допустимые символы и обрезает до MAX_PLAYER_NAME. */
export function sanitizeName(raw) {
  const text = typeof raw === 'string' ? raw : '';
  return text.replace(NAME_CHARS, '').replace(/\s+/g, ' ').trim().slice(0, MAX_PLAYER_NAME);
}

/**
 * Покупка или выбор облика без побочных эффектов.
 * @returns {{ok:boolean, reason?:'unknown'|'coins', player:object, coins:number}}
 */
export function buySkin(player, coins, skinId) {
  const skin = PLAYER_SKINS.find((item) => item.id === skinId);
  const current = normalizePlayer(player);
  if (!skin) {
    return { ok: false, reason: 'unknown', player: current, coins };
  }
  if (isSkinOwned(skin.id, current.owned)) {
    return { ok: true, player: { ...current, skin: skin.id }, coins };
  }
  if (coins < skin.price) {
    return { ok: false, reason: 'coins', player: current, coins };
  }
  return {
    ok: true,
    player: { ...current, skin: skin.id, owned: [...current.owned, skin.id] },
    coins: coins - skin.price,
  };
}
