// Облики игрока для изометрии (этап 12). Готовые PNG одноцветные, поэтому
// кастомизация v2 это выбор целого облика + цветной акцент роли над головой.
// Цены и списки меняются здесь, логика сцен их только читает.

export const PLAYER_ROLES = [
  { id: 'doctor', title: 'Врач', sprite: 'staff_doctor', icon: 'icon_role_doctor' },
  { id: 'nurse', title: 'Медсестра', sprite: 'staff_nurse', icon: 'icon_role_nurse' },
];

// sprite: ключ файла в assets/final (anchors.json). price = 0: доступен при создании.
// currency: 'crystals' вместе с полем crystals — наряд покупается за кристаллы.
export const PLAYER_SKINS = [
  { id: 'staff_doctor', title: 'Халат врача', price: 0 },
  { id: 'staff_nurse', title: 'Форма медсестры', price: 0 },
  { id: 'staff_receptionist', title: 'Костюм регистратора', price: 120 },
  { id: 'staff_janitor', title: 'Костюм уборщика', price: 0, crystals: 3, currency: 'crystals' },
  { id: 'staff_labtech', title: 'Халат лаборанта', price: 0, crystals: 4, currency: 'crystals' },
  { id: 'staff_admin', title: 'Костюм администратора', price: 0, crystals: 6, currency: 'crystals' },
];

// Цветная плашка под иконкой роли: не перекрашивает спрайт целиком.
export const ACCENTS = [
  { id: 'mint', title: 'Мята', color: 0x35c4a0 },
  { id: 'sky', title: 'Небо', color: 0x3f9bdf },
  { id: 'peach', title: 'Персик', color: 0xef8d5a },
  { id: 'violet', title: 'Сирень', color: 0x9b6ff0 },
  { id: 'sun', title: 'Солнце', color: 0xe0b020 },
  { id: 'gold', title: 'Золото', color: 0xd9b13b, crystals: 2, currency: 'crystals' },
  { id: 'rose', title: 'Роза', color: 0xe06090, crystals: 3, currency: 'crystals' },
  { id: 'ocean', title: 'Океан', color: 0x1fa9b8, crystals: 4, currency: 'crystals' },
];

export const DEFAULT_PLAYER = {
  name: '',
  role: 'doctor',
  skin: 'staff_doctor',
  accent: 'mint',
  owned: [],
  ownedAccents: [],
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

export function skinCurrency(skin) {
  return skin && skin.currency === 'crystals' ? 'crystals' : 'coins';
}

export function skinCost(skin) {
  if (!skin) {
    return 0;
  }
  return skinCurrency(skin) === 'crystals'
    ? Math.max(0, Math.round(skin.crystals || 0))
    : Math.max(0, Math.round(skin.price || 0));
}

export function isSkinOwned(skinId, owned = []) {
  const skin = skinById(skinId);
  return skinCost(skin) === 0 || owned.includes(skin.id);
}

export function accentCost(accent) {
  return accent && accent.currency === 'crystals'
    ? Math.max(0, Math.round(accent.crystals || 0))
    : 0;
}

export function isAccentOwned(accentId, owned = []) {
  const accent = accentById(accentId);
  return accentCost(accent) === 0 || owned.includes(accent.id);
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
  const ownedAccents = Array.isArray(data.ownedAccents)
    ? data.ownedAccents.filter((id) => ACCENTS.some((item) => item.id === id))
    : [];
  const accent = accentById(data.accent);
  const name = typeof data.name === 'string' ? data.name.trim().slice(0, MAX_PLAYER_NAME) : '';
  return {
    name,
    role: role.id,
    skin,
    accent: isAccentOwned(accent.id, ownedAccents) ? accent.id : 'mint',
    owned: [...new Set(owned)],
    ownedAccents: [...new Set(ownedAccents)],
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
 * Кошелёк: coins и необязательные crystals (для нарядов за кристаллы).
 * @returns {{ok:boolean, reason?:'unknown'|'coins'|'crystals',
 *   player:object, coins:number, crystals:number}}
 */
export function buySkin(player, coins, skinId, crystals = 0) {
  const skin = PLAYER_SKINS.find((item) => item.id === skinId);
  const current = normalizePlayer(player);
  const wallet = {
    coins: Math.max(0, Math.round(Number(coins) || 0)),
    crystals: Math.max(0, Math.round(Number(crystals) || 0)),
  };
  if (!skin) {
    return { ok: false, reason: 'unknown', player: current, ...wallet };
  }
  if (isSkinOwned(skin.id, current.owned)) {
    return { ok: true, player: { ...current, skin: skin.id }, ...wallet };
  }
  const currency = skinCurrency(skin);
  const cost = skinCost(skin);
  if (wallet[currency] < cost) {
    return { ok: false, reason: currency, player: current, ...wallet };
  }
  wallet[currency] -= cost;
  return {
    ok: true,
    player: { ...current, skin: skin.id, owned: [...current.owned, skin.id] },
    ...wallet,
  };
}

/**
 * Покупка/выбор акцента. Бесплатные акценты доступны сразу,
 * кристальные списывают crystals и запоминаются в ownedAccents.
 */
export function buyAccent(player, crystals, accentId) {
  const accent = ACCENTS.find((item) => item.id === accentId);
  const current = normalizePlayer(player);
  const wallet = Math.max(0, Math.round(Number(crystals) || 0));
  if (!accent) {
    return { ok: false, reason: 'unknown', player: current, crystals: wallet };
  }
  if (isAccentOwned(accent.id, current.ownedAccents)) {
    return { ok: true, player: { ...current, accent: accent.id }, crystals: wallet };
  }
  const cost = accentCost(accent);
  if (wallet < cost) {
    return { ok: false, reason: 'crystals', player: current, crystals: wallet };
  }
  return {
    ok: true,
    player: {
      ...current,
      accent: accent.id,
      ownedAccents: [...current.ownedAccents, accent.id],
    },
    crystals: wallet - cost,
  };
}
