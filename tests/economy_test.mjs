// Этап 17: экономика 2.0 без Phaser.
// Проверяем: монеты не уходят в минус без явного долга, продажа возвращает 60%,
// доходы/зарплаты/расходы суммируются в «Итогах дня», сохранение читает схему 1 и 2.

import assert from 'node:assert';
import GameState, { SCHEMA_VERSION, normalizeStatistics } from '../src/systems/GameState.js';
import HospitalEconomy from '../src/systems/HospitalEconomy.js';
import { PENALTIES } from '../src/data/economy.js';
import { CATALOG_BY_TYPE, SELL_REFUND } from '../src/data/buildCatalog.js';
import { levelFromExperience } from '../src/data/progression.js';
import BuildMode from '../src/iso/BuildMode.js';

// ---- 1. Баланс не уходит в минус без явного долга -------------------------------
const state = new GameState({ coins: 10 });
const purchase = state.spend(50);
assert.equal(state.coins, 0, 'монеты не ушли в минус');
assert.equal(state.debt, 0, 'без allowDebt долг не появляется');
assert.equal(purchase.paid, 10);
assert.equal(purchase.forgiven, 40, 'нехватка прощается кредитом доверия');
assert.equal(state.statistics.coinsSpent, 10);

const debtor = new GameState({ coins: 0 });
const borrowed = debtor.spend(50, { allowDebt: true });
assert.equal(debtor.coins, 0);
assert.equal(debtor.debt, 50, 'явный долг записан');
assert.equal(borrowed.debt, 50);
assert.equal(debtor.statistics.coinsSpent, 50);

const overLimit = new GameState({ coins: 0, debtLimit: 30 });
const tooMuch = overLimit.spend(100, { allowDebt: true });
assert.equal(overLimit.debt, 30, 'кредит доверия ограничен debtLimit');
assert.equal(tooMuch.forgiven, 70);
assert.equal(overLimit.coins, 0);

debtor.earn(80);
assert.equal(debtor.debt, 0, 'доход сначала закрывает долг');
assert.equal(debtor.coins, 30, 'остаток дохода попал в монеты');

// ---- 2. Уровень из опыта ---------------------------------------------------------
assert.equal(levelFromExperience(0).level, 1);
assert.equal(levelFromExperience(100).level, 2);
assert.equal(levelFromExperience(250).level, 3);

const levels = [];
const hero = new GameState({ experience: 90, onLevelUp: (level) => levels.push(level) });
hero.applyReward({ coins: 0, xp: 20 });
assert.deepEqual(levels, [2], 'повышение уровня замечено один раз');
assert.equal(hero.level, 2);

// ---- 3. Продажа возвращает 60% ---------------------------------------------------
assert.equal(SELL_REFUND, 0.6, 'доля возврата при продаже');
const stub = {
  setDepth() { return this; },
  setVisible() { return this; },
  setAlpha() { return this; },
  setTexture() { return this; },
  setOrigin() { return this; },
  setScale() { return this; },
  clear() {},
};
const fakeScene = {
  add: { graphics: () => ({ ...stub }), image: () => ({ ...stub }) },
  cache: { json: { get: () => ({}) } },
};
const build = new BuildMode(fakeScene, {}, {});
const plant = CATALOG_BY_TYPE.plant_big;
const refund = build.refundOf({ item: { type: plant.type } });
assert.equal(refund, Math.floor(plant.price * 0.6), 'возврат 60% от цены');

// ---- 4. Доходы, зарплаты и расходы суммируются ------------------------------------
const wallet = new GameState({ coins: 1000 });
const staff = { totalSalary: () => 35 };
const world = {
  items: () => new Array(10).fill({}),
  layout: { ROOMS: new Array(3).fill({}) },
};
const dayEvents = [];
const economy = new HospitalEconomy({
  getState: () => wallet,
  getStaff: () => staff,
  getWorld: () => world,
  onDayEnd: (summary) => dayEvents.push(summary),
});

const patience = { patienceRatio: () => 1 };
const first = economy.collectTreatment({ coins: 30 }, patience);
assert.equal(first.base, 30, 'базовая оплата из болезни');
assert.equal(first.tip, 3, 'чаевые от репутации и скорости');
assert.equal(first.total, 33);
economy.collectTreatment({ coins: 30 }, patience);
economy.collectTreatment({ coins: 30 }, patience);
assert.equal(wallet.coins, 1099, 'три лечения добавили 99 монет');
assert.equal(economy.today.treatmentIncome, 90);
assert.equal(economy.today.tips, 9);
assert.equal(economy.today.treated, 3);
assert.equal(economy.today.supplies, 6, 'лекарства списаны за каждого пациента');

// Минимальная оплата: даже «пустая» награда не оставляет игрока без дохода.
const minimum = economy.collectTreatment({ coins: 0 }, patience);
assert.equal(minimum.base, 10, 'минимальный заработок от простого пациента');
assert.equal(minimum.total >= 10, true);

const summary = economy.endDay();
assert.equal(summary.salaries, 35, 'зарплата из StaffFlow');
assert.equal(summary.utilities, 11, 'коммунальные: база + комнаты + мебель');
assert.equal(summary.supplies, 8, 'лекарства за четырёх пациентов');
assert.equal(summary.bills, 35 + 11 + 8);
assert.equal(summary.income, summary.treatmentIncome + summary.tips);
assert.equal(summary.penalties, 0);
assert.equal(dayEvents.length, 1);
assert.equal(dayEvents[0].day, 1);
assert.equal(wallet.coins, 1099 + minimum.total - summary.bills, 'расходы списаны один раз');
assert.equal(economy.day, 2, 'после итогов начался новый день');
assert.equal(economy.today.treated, 0, 'дневная статистика обнулилась');

// ---- 5. Штрафы и переполненная очередь -------------------------------------------
const fined = new HospitalEconomy({ getState: () => wallet, notify: () => {} });
const before = wallet.coins;
const dirt = fined.penalize('dirt');
assert.equal(dirt, PENALTIES.dirt.coins);
assert.equal(fined.today.penalties, PENALTIES.dirt.coins);
assert.equal(fined.today.penaltyCount, 1);
assert.equal(wallet.coins, before - PENALTIES.dirt.coins, 'штраф списан с монет');

fined.noteQueue(5);
assert.equal(fined.today.overcrowded, true, 'очередь сверх порога отмечена');
const queueDay = fined.endDay();
assert.equal(queueDay.overcrowded, true);
assert(queueDay.penalties >= PENALTIES.dirt.coins + 8, 'штраф за очередь вошёл в итоги');

// ---- 6. Сохранение переживает версию схемы ---------------------------------------
const store = {};
globalThis.window = {
  localStorage: {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
  },
};
const { loadIsoSave, saveIso } = await import('../src/systems/IsoSave.js');

saveIso(777, null, null, {
  reputation: 70,
  experience: 240,
  crystals: 4,
  debt: 25,
  statistics: normalizeStatistics({ patientsTreated: 6, daysPlayed: 2 }),
  economy: { day: 3, dayTime: 5000, today: { treated: 2 }, history: [] },
});
const saved = loadIsoSave();
assert.equal(saved.schema, SCHEMA_VERSION, 'в сохранении новая схема');
assert.equal(saved.coins, 777);
assert.equal(saved.debt, 25);
assert.equal(saved.experience, 240);
assert.equal(saved.crystals, 4);
assert.equal(saved.statistics.patientsTreated, 6);
assert.equal(saved.economy.day, 3);
assert.equal(saved.economy.today.treated, 2);
const rawEnvelope = JSON.parse(store['hospitaria.iso.layout.v1']);
assert.equal(rawEnvelope.v, 1, 'ключ и конверт v1 остаются совместимыми');
assert.equal(rawEnvelope.schema, 2);

// Старое сохранение без schema/debt/statistics читается как схема 1.
store['hospitaria.iso.layout.v1'] = JSON.stringify({
  v: 1, coins: 120, reputation: 40, experience: 30, crystals: 1, items: null,
});
const legacy = loadIsoSave();
assert.equal(legacy.schema, 1);
assert.equal(legacy.coins, 120);
assert.equal(legacy.debt, null);
assert.equal(legacy.statistics, null);

// GameState.deserialize принимает и старую, и новую схему.
const oldState = GameState.deserialize({ coins: 60, reputation: 30, experience: 100 });
assert(oldState instanceof GameState);
assert.equal(oldState.coins, 60);
assert.equal(oldState.level, 2, 'опыт старой схемы даёт уровень');
assert.equal(oldState.debt, 0);
const newState = GameState.deserialize(JSON.parse(JSON.stringify({
  schema: SCHEMA_VERSION, coins: 90, debt: 10, reputation: 55,
  experience: 120, crystals: 2, statistics: { patientsTreated: 3 },
})));
assert.equal(newState.debt, 10);
assert.equal(newState.statistics.patientsTreated, 3);

// Долг переживает сохранение и загрузку.
const debtSaved = GameState.deserialize(JSON.parse(JSON.stringify(
  new GameState({ coins: 0, debt: 15 }).serialize(),
)));
assert.equal(debtSaved.coins, 0);
assert.equal(debtSaved.debt, 15);

console.log('economy tests ok; debt, min income, 60% sale, day sums, schema 1/2');
