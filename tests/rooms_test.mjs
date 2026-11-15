// Этап 17.5: открытие кабинетов, сохранение, фильтр пациентов и наряды за кристаллы.
import assert from 'node:assert';
import GameState from '../src/systems/GameState.js';
import RoomUnlocks from '../src/systems/RoomUnlocks.js';
import EventBus from '../src/systems/EventBus.js';
import PatientFlow from '../src/iso/PatientFlow.js';
import {
  ROOM_UNLOCKS, STARTER_ROOMS, roomUnlockOf, totalRoomCrystals,
} from '../src/data/roomUnlocks.js';
import { DISEASES } from '../src/data/diseases.js';
import { roomForDisease } from '../src/data/patientFlow.js';
import {
  DEFAULT_PLAYER, PLAYER_SKINS, buySkin, normalizePlayer,
} from '../src/data/playerSkins.js';

const store = {};
globalThis.window = {
  localStorage: {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  },
};
const { loadIsoSave, saveIso, clearIsoSave } = await import('../src/systems/IsoSave.js');

// ---- 1. Новая игра: открыты только три стартовых кабинета ------------------------
const state = new GameState({ coins: 500, crystals: 10, experience: 450 }); // уровень 4
const locks = new RoomUnlocks({ state });
STARTER_ROOMS.forEach((id) => assert(locks.isUnlocked(id), `стартовая комната ${id} открыта`));
['lab', 'xray', 'procedure', 'ward', 'pharmacy', 'cafeteria'].forEach((id) => {
  assert(!locks.isUnlocked(id), `новая игра: ${id} закрыта`);
});
assert.deepEqual(locks.serialize().sort(), [...STARTER_ROOMS].sort(), 'в сохранении только стартовые');

// ---- 2. Старое сохранение без rooms открывает все комнаты -----------------------
const legacy = new RoomUnlocks({ state, saved: { coins: 10 } });
ROOM_UNLOCKS.forEach((entry) => {
  assert(legacy.isUnlocked(entry.roomId), `legacy-сохранение: ${entry.roomId} открыта`);
});
const partial = new RoomUnlocks({ state, saved: { rooms: ['hall', 'reception', 'therapist', 'lab'] } });
assert(partial.isUnlocked('lab') && !partial.isUnlocked('xray'), 'список открытых комнат читается');

// ---- 3. Проверка причин и атомарность -------------------------------------------
const poorCoins = new GameState({ coins: 50, crystals: 10, experience: 250 }); // уровень 3
const locksPoor = new RoomUnlocks({ state: poorCoins });
let check = locksPoor.canUnlock('cafeteria', poorCoins);
assert.equal(check.ok, false);
assert.equal(check.reason, 'coins');
assert.equal(locksPoor.unlock('cafeteria', poorCoins).ok, false);
assert.equal(poorCoins.coins, 50, 'при нехватке монет ничего не списано');
assert.equal(poorCoins.crystals, 10, 'кристаллы тоже не тронуты');
assert(!locksPoor.isUnlocked('cafeteria'));

const poorCrystals = new GameState({ coins: 500, crystals: 4, experience: 250 });
const locksCrystals = new RoomUnlocks({ state: poorCrystals });
check = locksCrystals.canUnlock('cafeteria', poorCrystals);
assert.equal(check.reason, 'crystals');
assert.equal(locksCrystals.unlock('cafeteria', poorCrystals).ok, false);
assert.equal(poorCrystals.coins, 500);
assert.equal(poorCrystals.crystals, 4, 'при нехватке кристаллов ничего не списано');

const lowLevel = new GameState({ coins: 500, crystals: 10, experience: 0 });
const locksLevel = new RoomUnlocks({ state: lowLevel });
check = locksLevel.canUnlock('cafeteria', lowLevel);
assert.equal(check.reason, 'level');
assert.equal(locksLevel.unlock('cafeteria', lowLevel).ok, false);
assert.equal(lowLevel.coins, 500);
assert.equal(lowLevel.crystals, 10);

// ---- 4. Покупка списывает обе валюты ровно один раз и шлёт roomUnlocked ---------
const buyer = new GameState({ coins: 500, crystals: 10, experience: 250 });
const bus = new EventBus();
const events = [];
bus.on('roomUnlocked', (payload) => events.push(payload));
const lockShop = new RoomUnlocks({ state: buyer, bus });
const entry = roomUnlockOf('procedure');
const bought = lockShop.unlock('procedure', buyer);
assert.equal(bought.ok, true);
assert.equal(buyer.coins, 500 - entry.coins, 'монеты списаны по цене');
assert.equal(buyer.crystals, 10 - entry.crystals, 'кристаллы списаны по цене');
assert(lockShop.isUnlocked('procedure'));
assert.equal(events.length, 1, 'событие roomUnlocked отправлено');
assert.equal(events[0].roomId, 'procedure');
const again = lockShop.unlock('procedure', buyer);
assert.equal(again.ok, false);
assert.equal(again.reason, 'unlocked');
assert.equal(buyer.coins, 500 - entry.coins, 'повторно монеты не списаны');
assert.equal(buyer.crystals, 10 - entry.crystals, 'повторно кристаллы не списаны');
assert.equal(events.length, 1, 'повторного события нет');

// ---- 5. Сохранение и загрузка списка комнат -------------------------------------
clearIsoSave();
saveIso(123, null, null, { crystals: 6, rooms: ['hall', 'reception', 'therapist', 'procedure'] });
let loaded = loadIsoSave();
assert.deepEqual(loaded.rooms.sort(), ['hall', 'procedure', 'reception', 'therapist']);
assert.equal(new RoomUnlocks({ saved: loaded }).isUnlocked('procedure'), true);
assert.equal(new RoomUnlocks({ saved: loaded }).isUnlocked('lab'), false);

store['hospitaria.iso.layout.v1'] = JSON.stringify({ v: 1, coins: 20, crystals: 3 });
loaded = loadIsoSave();
assert.equal(loaded.rooms, null, 'старое сохранение помечено отсутствием rooms');
const migrated = new RoomUnlocks({ saved: loaded });
assert(migrated.isUnlocked('xray'), 'старый прогресс не блокирует комнаты');
clearIsoSave();

// ---- 6. Пациенты не идут в закрытые комнаты -------------------------------------
const world = {
  revision: () => 1,
  entrance: () => ({ x: 1.5, y: 1.5 }),
  waitingSlots: () => [],
  receptionSlots: () => [],
  paySlots: () => [],
  fallbackSlots: () => [],
  treatmentSlots: () => [],
  roomReady: () => ({ ok: true }),
};
const flow = new PatientFlow({
  world,
  isRoomUnlocked: (roomId) => roomId === 'therapist',
  random: () => 0.37,
});
for (let i = 0; i < 200; i += 1) {
  const disease = flow.pickDisease();
  assert.equal(roomForDisease(disease), 'therapist', 'болезни только из открытого кабинета');
}
const wardDisease = DISEASES.find((disease) => disease.room === 'ward');
assert(flow.spawn(wardDisease) === null, 'в закрытую палату пациент не появился');
const therapistDisease = DISEASES.find((disease) => roomForDisease(disease) === 'therapist');
const agent = flow.spawn(therapistDisease);
assert(agent && agent.roomId === 'therapist', 'в открытый кабинет пациент появляется');
flow.destroy();

// ---- 7. Наряд за кристаллы ------------------------------------------------------
const base = normalizePlayer({ ...DEFAULT_PLAYER, name: 'Тест' });
const crystalSkin = PLAYER_SKINS.find((skin) => skin.currency === 'crystals');
assert(crystalSkin && crystalSkin.crystals > 0, 'есть наряд за кристаллы');
const skinCost = crystalSkin.crystals;
let outfit = buySkin(base, 300, crystalSkin.id, skinCost - 1);
assert.equal(outfit.ok, false);
assert.equal(outfit.reason, 'crystals');
assert.equal(outfit.coins, 300, 'монеты не списаны');
assert.equal(outfit.crystals, skinCost - 1, 'нехватка кристаллов ничего не меняет');
outfit = buySkin(base, 300, crystalSkin.id, skinCost);
assert.equal(outfit.ok, true);
assert.equal(outfit.coins, 300, 'монеты не участвуют в цене');
assert.equal(outfit.crystals, 0, 'кристаллы списаны');
assert(outfit.player.owned.includes(crystalSkin.id));
const outfitAgain = buySkin(outfit.player, outfit.coins, crystalSkin.id, outfit.crystals);
assert.equal(outfitAgain.ok, true);
assert.equal(outfitAgain.crystals, 0, 'повторная покупка не списывает кристаллы');
assert.equal(outfitAgain.player.owned.filter((id) => id === crystalSkin.id).length, 1);

// ---- 8. Кристаллы за уровень ----------------------------------------------------
const hero = new GameState({ experience: 90, crystals: 0 });
hero.applyReward({ coins: 0, xp: 20 });
assert.equal(hero.level, 2);
assert.equal(hero.crystals, 2, 'за второй уровень начислены кристаллы');

// ---- 9. Общая цена комнат соответствует задуманному балансу ---------------------
const total = totalRoomCrystals();
assert(total >= 35 && total <= 40, `кристаллов на все комнаты: ${total}`);
assert.equal(ROOM_UNLOCKS.length, 9, 'все комнаты планировки описаны');

console.log(`rooms tests ok; total room crystals ${total}; crystal skins ${PLAYER_SKINS.filter((s) => s.currency === 'crystals').length}`);
