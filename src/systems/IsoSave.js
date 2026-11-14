// Сохранение изометрической больницы (v2): монеты и расстановка мебели.
// Отдельный ключ, чтобы не мешать сохранению v0.1; миграция в этапе 20.

const KEY = 'hospitaria.iso.layout.v1';

export function loadIsoSave() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    const data = JSON.parse(raw);
    if (!data || data.v !== 1 || !Array.isArray(data.items)) {
      return null;
    }
    return { coins: Number.isFinite(data.coins) ? data.coins : null, items: data.items };
  } catch (err) {
    return null;
  }
}

export function saveIso(coins, items) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ v: 1, coins, items }));
  } catch (err) {
    // localStorage может быть недоступен (приватный режим): игра работает без сохранения.
  }
}

export function clearIsoSave() {
  try {
    window.localStorage.removeItem(KEY);
  } catch (err) {
    // ничего не делаем
  }
}
