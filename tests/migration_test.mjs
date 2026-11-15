// Этап 20: миграция сохранений v0.1 (hospital_save_v1) в изометрию v0.2.
import assert from 'node:assert';

const store = {};
globalThis.window = {
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  },
};
const { migrateV1, migrateLegacyOnce, totalExperience } = await import('../src/systems/migrateV1.js');
const { loadIsoSave, saveIso, clearIsoSave } = await import('../src/systems/IsoSave.js');
const { LEGACY_SHOP, LEGACY_SAVE_KEY } = await import('../src/data/legacyMigration.js');
const { SHOP_ITEMS } = await import('../src/legacy/data/shopItems.js');
const { CATALOG_BY_TYPE } = await import('../src/data/buildCatalog.js');
const { levelFromExperience } = await import('../src/data/progression.js');

// Таблица переноса совпадает с магазином v0.1 и каталогом v2.
assert.equal(Object.keys(LEGACY_SHOP).length, SHOP_ITEMS.length);
SHOP_ITEMS.forEach((item) => {
  assert.equal(LEGACY_SHOP[item.id].price, item.price, item.id);
  const type = LEGACY_SHOP[item.id].type;
  assert(type === null || CATALOG_BY_TYPE[type], `type ${item.id}`);
});

// Три формы реального сохранения v0.1.
const forms = {
  // 1. Только что созданный персонаж (CreatorScene.finish)
  fresh: {
    version: 1, createdAt: 1, coins: 0, xp: 0, level: 1, reputation: 50, ownedItems: [], furniture: [],
    player: { name: 'Аня', skin: 2, hair: 'bob' },
  },
  // 2. Середина игры: покупки, достижения, ежедневные задания
  mid: {
    version: 1, coins: 340, xp: 60, level: 3, reputation: 72, ownedItems: ['coat-mint', 'furn-sofa'],
    furniture: [{ room: 'ward', type: 'sofa', x: 120 }], player: { name: 'Борис' },
    achievements: ['first-patient'], collection: ['a'], stats: { healed: 14, stars: 30 },
    tasks: { date: '2026-10-01', progress: {}, claimed: {} },
  },
  // 3. Поздняя игра, дубликаты, неизвестные предметы и мусор в полях
  late: {
    version: 1, coins: '1200', xp: 10, level: 8, reputation: 130,
    ownedItems: ['furn-scanner', 'furn-scanner', 'mystery', 'hat-cap'], furniture: [],
    player: { name: 'Ж'.repeat(40) }, stats: { healed: 'много' },
  },
};

const fresh = migrateV1(forms.fresh);
assert.equal(fresh.coins, 0);
assert.equal(fresh.stats.experience, 0);
assert.equal(fresh.stats.crystals, 0);
assert.equal(fresh.player.name, 'Аня');

const mid = migrateV1(forms.mid);
assert.equal(mid.coins, 340 + 120 + 260, 'возврат цены покупок');
assert.equal(mid.stats.reputation, 72);
assert.equal(levelFromExperience(mid.stats.experience).level, 3, 'уровень сохраняется');
assert.equal(mid.stats.experience, totalExperience(3, 60));
assert.equal(mid.stats.crystals, 4, 'по 2 кристалла за уровень 2 и 3');
assert.equal(mid.stats.statistics.patientsTreated, 14);
assert.deepEqual(mid.stats.migration.furnitureTypes, ['hall_sofa']);
assert.deepEqual(mid.stats.migration.achievements, ['first-patient']);
assert.deepEqual(mid.stats.rooms, ['hall', 'reception', 'therapist']);

const late = migrateV1(forms.late);
assert.equal(late.coins, 1200 + 320 + 150, 'дубликаты и неизвестные не считаются');
assert.equal(late.stats.reputation, 100);
assert.equal(levelFromExperience(late.stats.experience).level, 8);
assert.equal(late.stats.statistics.patientsTreated, 0);
assert(late.player.name.length <= 14);

// Нет игрока или мусор: миграции нет.
[null, undefined, 5, 'x', {}, { player: null }, { coins: 5 }].forEach((junk) => {
  assert.equal(migrateV1(junk), null);
});

// Сквозной запуск через localStorage.
assert.equal(migrateLegacyOnce().migrated, false, 'старого сохранения нет');
store[LEGACY_SAVE_KEY] = JSON.stringify(forms.mid);
const backup = store[LEGACY_SAVE_KEY];
let run = migrateLegacyOnce();
assert.equal(run.migrated, true);
const iso = loadIsoSave();
assert.equal(iso.coins, 720);
assert.equal(iso.player.name, 'Борис');
assert.equal(iso.migration.from, LEGACY_SAVE_KEY);
assert.equal(iso.items, null, 'планировка по умолчанию');
assert.equal(store[LEGACY_SAVE_KEY], backup, 'старый ключ не тронут');

// Повторно не перезаписывает прогресс v0.2.
saveIso(999, null, loadIsoSave().player, { experience: 5 });
run = migrateLegacyOnce();
assert.equal(run.migrated, false);
assert.equal(loadIsoSave().coins, 999);
assert.equal(loadIsoSave().migration.refunded, 380, 'метка миграции сохраняется при записях');

// Битый JSON старого сохранения не ломает меню.
clearIsoSave();
store[LEGACY_SAVE_KEY] = '{oops';
assert.equal(migrateLegacyOnce().migrated, false);
store[LEGACY_SAVE_KEY] = JSON.stringify(forms.fresh);
assert.equal(migrateLegacyOnce().migrated, true);

console.log('migration tests ok; 3 forms, refund, backup key kept, idempotent');
