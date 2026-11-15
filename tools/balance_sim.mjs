// Симуляция баланса экономики 2.0 (этап 17).
// Прогоняет 60 игровых минут с типичной стратегией: сначала обустройство холла,
// затем первый сотрудник, потом расширения примерно каждые 10–15 минут.
// Считает реальными модулями GameState и HospitalEconomy, а поток пациентов
// моделирует по данным patientConfig/diseases/treatmentConfig.
// Запуск: node tools/balance_sim.mjs
// Результат: docs/balance.md (таблица монет по минутам и проверка целей).

import { writeFileSync } from 'node:fs';
import GameState from '../src/systems/GameState.js';
import HospitalEconomy from '../src/systems/HospitalEconomy.js';
import RoomUnlocks from '../src/systems/RoomUnlocks.js';
import { ECONOMY } from '../src/data/economy.js';
import { DISEASES } from '../src/data/diseases.js';
import { CATALOG_BY_TYPE } from '../src/data/buildCatalog.js';
import { STAFF_ROLES, staffUnlockLevel } from '../src/data/staffCatalog.js';
import { PATIENT_CONFIG } from '../src/data/patientConfig.js';
import { STAR_REWARD_MULTIPLIER, PERFECT_TREATMENT_CRYSTAL_CHANCE, PERFECT_TREATMENT_CRYSTALS } from '../src/data/treatmentConfig.js';
import { ROOM_UNLOCKS, STARTER_ROOMS, roomUnlockOf } from '../src/data/roomUnlocks.js';
import { STORY_QUESTS, WEEKLY_QUESTS } from '../src/data/quests.js';
import {
  SIM, PLAN, seeded, pick,
} from './balancePlan.mjs';
import summarize from './balanceSummary.mjs';

const MINUTES = SIM.minutes; const HOUR_MS = MINUTES * 60000; const TICK_MS = SIM.tickMs;
const random = seeded();

const state = new GameState({
  coins: ECONOMY.startCoins,
  startCoins: ECONOMY.startCoins,
  reputation: 50,
});
const roomLocks = new RoomUnlocks({ state });
const unlockedRooms = new Set(roomLocks.serialize());
const roomLog = [];
const questCrystals = new Set();
const questProgress = new Map();
const questPool = [...WEEKLY_QUESTS, ...STORY_QUESTS];
let firstRoomAt = null;
let crystalsFromQuests = 0;
let perfectCrystals = 0;
const staff = [];
const bought = [];
const hireLog = [];
const upgradeLog = [];
const dayLog = [];
const minuteLog = [];
const queue = [];

let planIndex = 0;
let nextDirt = ECONOMY.dayLengthMs;
let spawnTimer = PATIENT_CONFIG.firstSpawnDelay;
let serviceTimer = 0;
let nextMinute = 0;
let firstHireAt = null;
let treated = 0; let angry = 0; let wrong = 0;

function staffBonus() {
  const has = (id) => staff.some((role) => role.id === id);
  return {
    speed: 1
      + (has('receptionist') ? 0.2 : 0)
      + (has('nurse') ? 0.3 : 0)
      + (has('doctor') ? 0.5 : 0)
      + (has('labtech') ? 0.1 : 0),
    arrivals: 1
      + (has('receptionist') ? 0.15 : 0)
      + (has('nurse') ? 0.15 : 0)
      + (has('doctor') ? 0.2 : 0)
      + (has('labtech') ? 0.1 : 0),
  };
}

const world = {
  items: () => new Array(SIM.startItems + bought.length).fill({}),
  layout: { ROOMS: new Array(SIM.startRooms).fill({}) },
};

const economy = new HospitalEconomy({
  getState: () => state,
  getStaff: () => ({
    totalSalary: () => staff.reduce((sum, role) => sum + role.salary, 0),
  }),
  getWorld: () => world,
  notify: () => {},
  onChange: () => {},
  onDayEnd: (summary) => dayLog.push(summary),
});

// Кристаллы заданий: берём реальные недельные и сюжетные задания, но начисляем
// только кристаллы. Монеты и опыт заданий не моделируем, чтобы оценка была строже.
function questMatches(quest, payload) {
  if (!quest.match) {
    return true;
  }
  return Object.entries(quest.match).every(([key, value]) => (
    payload && payload[key] === value
  ));
}

function questEvent(type, payload = {}) {
  questPool.forEach((quest) => {
    if (quest.event !== type || questCrystals.has(quest.id) || !questMatches(quest, payload)) {
      return;
    }
    const step = quest.amountKey ? (Number(payload[quest.amountKey]) || 0) : 1;
    const value = Math.min(quest.target, (questProgress.get(quest.id) || 0) + step);
    questProgress.set(quest.id, value);
    if (value < quest.target) {
      return;
    }
    questCrystals.add(quest.id);
    const crystals = quest.reward && quest.reward.crystals ? quest.reward.crystals : 0;
    if (crystals > 0) {
      state.addCrystals(crystals);
      crystalsFromQuests += crystals;
    }
  });
}

function roleOf(entry) {
  return entry.hire ? STAFF_ROLES.find((item) => item.id === entry.hire) : null;
}

function planCost(entry) {
  const role = roleOf(entry);
  const room = entry.room ? roomUnlockOf(entry.room) : null;
  const hireCost = role ? role.price : 0;
  const roomCost = room ? room.coins : 0;
  const itemsCost = (entry.items || []).reduce(
    (sum, type) => sum + (CATALOG_BY_TYPE[type] ? CATALOG_BY_TYPE[type].price : 0),
    0,
  );
  return hireCost + roomCost + itemsCost;
}

function planAvailable(entry) {
  const room = entry.room ? roomUnlockOf(entry.room) : null;
  if (room && !unlockedRooms.has(room.roomId) && state.level < room.minLevel) {
    return false;
  }
  const role = roleOf(entry);
  if (role && staff.some((item) => item.id === role.id)) {
    return false;
  }
  if (role && state.level < staffUnlockLevel(role)) {
    return false;
  }
  return (entry.items || []).every((type) => {
    const def = CATALOG_BY_TYPE[type];
    return def && state.level >= (Number(def.unlockLevel) || 1);
  });
}

function unlockRoomStep(entry, room, time) {
  if (state.level < room.minLevel) {
    return false;
  }
  if (state.coins < room.coins + SIM.reserve) {
    return false;
  }
  if (state.crystals < room.crystals) {
    return false;
  }
  const result = roomLocks.unlock(room.roomId, state);
  if (!result.ok) {
    return false;
  }
  unlockedRooms.add(room.roomId);
  if (firstRoomAt === null) {
    firstRoomAt = time;
  }
  roomLog.push({
    time, title: room.title, coins: room.coins, crystals: room.crystals,
  });
  upgradeLog.push({
    time, title: `Кабинет «${room.title}»`, price: room.coins, expansion: true, room: true,
  });
  economy.recordPurchase(room.coins);
  questEvent('roomUnlocked', { roomId: room.roomId });
  return true;
}

function buyNext(time) {
  while (planIndex < PLAN.length) {
    const entry = PLAN[planIndex];
    if (entry.room) {
      const room = roomUnlockOf(entry.room);
      if (!room || unlockedRooms.has(room.roomId)) {
        planIndex += 1;
        continue;
      }
      if (!planAvailable(entry) || !unlockRoomStep(entry, room, time)) {
        return;
      }
      planIndex += 1;
      continue;
    }
    if (!planAvailable(entry)) {
      // Закрыто по уровню: ждём, не перескакивая через важные покупки.
      return;
    }
    const cost = planCost(entry);
    if (state.coins < cost + SIM.reserve) {
      return;
    }
    state.spend(cost);
    economy.recordPurchase(cost);
    const role = roleOf(entry);
    if (role) {
      staff.push(role);
      questEvent('staffHired', { roleId: role.id });
    }
    (entry.items || []).forEach((type) => {
      bought.push(type);
      questEvent('itemBought', { type });
    });
    if (firstHireAt === null && role) {
      firstHireAt = time;
      hireLog.push({
        time, title: role.title, price: role.price, salary: role.salary,
      });
    } else {
      const expansion = firstHireAt !== null;
      upgradeLog.push({
        time,
        title: role ? `${entry.title} (+ ${role.title.toLowerCase()})` : entry.title,
        price: cost,
        expansion,
      });
    }
    planIndex += 1;
  }
}

function spawnPatient() {
  const disease = pick(DISEASES, random);
  const patience = PATIENT_CONFIG.patienceMin
    + random() * (PATIENT_CONFIG.patienceMax - PATIENT_CONFIG.patienceMin);
  queue.push({
    disease,
    patience,
    waited: 0,
  });
}

function servePatient() {
  const agent = queue.shift();
  if (!agent) {
    return;
  }
  const stars = 3 - Math.floor(random() * 3); // обычно 2–3 звезды
  const mult = STAR_REWARD_MULTIPLIER[stars] || 1;
  const base = Math.round(agent.disease.reward.coins * mult);
  const xp = Math.round(agent.disease.reward.xp * mult);
  state.applyReward({ coins: 0, xp, reputation: stars });
  if (stars === 3 && random() < PERFECT_TREATMENT_CRYSTAL_CHANCE) {
    state.addCrystals(PERFECT_TREATMENT_CRYSTALS);
    perfectCrystals += PERFECT_TREATMENT_CRYSTALS;
  }
  economy.collectTreatment({ coins: base }, {
    patienceRatio: () => 0.75 + random() * 0.25,
  });
  treated += 1;
  questEvent('patientTreated', { diseaseId: agent.disease.id, stars });
  questEvent('coinsEarned', { amount: base });
  if (random() < 0.03) {
    economy.penalize('diagnosis');
    wrong += 1;
  }
}

function estimatedArrival() {
  const { arrivals } = staffBonus();
  const min = PATIENT_CONFIG.spawnIntervalMin / arrivals;
  const max = PATIENT_CONFIG.spawnIntervalMax / arrivals;
  return (min + random() * (max - min)) * (1.15 - state.reputation / 200);
}

function estimatedService() {
  const { speed } = staffBonus();
  const base = SIM.serviceMs / speed;
  return base * (0.85 + random() * 0.3);
}

function snapshot(time) {
  minuteLog.push({
    minute: Math.floor(time / 60000),
    coins: state.coins,
    crystals: state.crystals,
    level: state.level,
    rooms: unlockedRooms.size - STARTER_ROOMS.length,
    staff: staff.length,
    treated,
    day: economy.day,
  });
}

snapshot(0);
for (let time = 0; time < HOUR_MS; time += TICK_MS) {
  const dt = Math.min(TICK_MS, HOUR_MS - time);

  // Один штраф за грязь в день, пока не нанят уборщик.
  if (!staff.some((role) => role.id === 'janitor') && time >= nextDirt) {
    economy.penalize('dirt');
    nextDirt += ECONOMY.dayLengthMs;
  }

  // Приход пациентов и лечение. Игрок обслуживает по одному.
  spawnTimer -= dt;
  const active = queue.length + (serviceTimer > 0 ? 1 : 0);
  if (spawnTimer <= 0) {
    if (active < PATIENT_CONFIG.maxPatients) {
      spawnPatient();
    }
    spawnTimer = estimatedArrival();
  }

  queue.forEach((agent) => {
    agent.waited += dt;
  });
  for (let i = queue.length - 1; i >= 0; i -= 1) {
    if (queue[i].waited > queue[i].patience) {
      queue.splice(i, 1);
      angry += 1;
      economy.penalize('waiting');
    }
  }
  economy.noteQueue(queue.length);

  serviceTimer -= dt;
  if (serviceTimer <= 0 && queue.length) {
    servePatient();
    serviceTimer = estimatedService();
  }

  economy.update(dt);
  buyNext(time);

  while ((nextMinute + 1) * 60000 <= time + dt && nextMinute < MINUTES - 1) {
    nextMinute += 1;
    snapshot(nextMinute * 60000);
  }
}

summarize({
  MINUTES, SIM, state, dayLog, upgradeLog, minuteLog, hireLog, roomLog, staff, bought,
  unlockedRooms, firstHireAt, firstRoomAt, treated, angry, wrong,
  crystalsFromQuests, perfectCrystals,
});
