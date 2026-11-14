// Этап 14: маршруты пациентов без Phaser.
// 50 пациентов на ускоренных часах, занятость мест, пересадка после продажи кресла,
// уход из кабинета без мебели и подсказка «купите кушетку».
import assert from 'node:assert';
import * as layout from '../src/data/layout.js';
import { DISEASES } from '../src/data/diseases.js';
import {
  FLOW_STATES, PATIENT_FLOW, roomForDisease, roomHint,
} from '../src/data/patientFlow.js';
import { buildLayout } from '../src/iso/layoutBuilder.js';
import PatientFlow from '../src/iso/PatientFlow.js';
import {
  fallbackSlots, paySlots, receptionSlots, roomReady, treatmentSlots, waitingSlots,
} from '../src/iso/worldSlots.js';

const STEP = 100;
const FAST_WALK = 12; // тайлов в секунду: тест не ждёт реальную походку

function diseaseFrom(condition) {
  const disease = DISEASES.find((item) => item.room === condition);
  assert(disease, 'болезнь с комнатой ' + condition);
  return disease;
}

function createHarness(options = {}) {
  const L = buildLayout(layout);
  const grid = L.grid;
  let items = L.items.map((item) => ({ ...item }));
  const entrance = { x: layout.ENTRANCE.x + 0.5, y: layout.ENTRANCE.y + 0.5 };
  const pos = new WeakMap();
  const pending = [];
  const events = [];
  let clock = 0;
  let seed = options.seed || 11;

  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const world = {
    revision: () => grid.revision,
    entrance: () => ({ ...entrance }),
    waitingSlots: () => waitingSlots(grid, items),
    receptionSlots: () => receptionSlots(grid, items),
    paySlots: () => paySlots(grid, items),
    fallbackSlots: () => fallbackSlots(grid, [
      { x: 31, y: 30 }, { x: 35, y: 30 }, { x: 39, y: 30 },
      { x: 28, y: 33 }, { x: 32, y: 33 }, { x: 36, y: 33 },
      { x: 40, y: 33 }, { x: 43, y: 31 }, { x: 28, y: 30 },
    ]),
    treatmentSlots: (roomId) => treatmentSlots(grid, items, layout.ROOMS, roomId),
    roomReady: (roomId) => ({
      ok: roomReady(items, layout.ROOMS, roomId),
      hint: roomHint(roomId),
    }),
  };

  const flow = new PatientFlow({
    world,
    maxPatients: options.maxPatients || 4,
    maxSpawned: options.maxSpawned,
    random,
    timing: {
      ...PATIENT_FLOW,
      firstSpawnDelay: 0,
      spawnIntervalMin: 400,
      spawnIntervalMax: 400,
      registrationMs: 500,
      treatmentMs: 700,
      payMs: 300,
      patienceMin: 60000,
      patienceMax: 60000,
      ...(options.timing || {}),
    },
    navigate: (agent, point) => {
      const start = pos.get(agent) || entrance;
      const fromX = Math.floor(start.x);
      const fromY = Math.floor(start.y);
      const path = grid.findPath(fromX, fromY, point.x, point.y);
      const tiles = path === null ? 1 : Math.max(1, path.length);
      const token = (agent.navToken || 0) + 1;
      agent.navToken = token;
      pending.push({
        agent,
        point,
        token,
        at: clock + Math.max(STEP, (tiles / FAST_WALK) * 1000),
      });
    },
    onEvent: (event) => events.push(event),
  });

  const waitSince = new Map();
  const seatOwners = new Map();

  function checkSeats() {
    seatOwners.clear();
    flow.agents.forEach((agent) => {
      if (agent.state !== FLOW_STATES.WAITING || !agent.seat) {
        return;
      }
      assert(!seatOwners.has(agent.seat.key), 'место занято двумя: ' + agent.seat.key);
      seatOwners.set(agent.seat.key, agent);
      if (agent.seat.itemId !== undefined) {
        const item = items.find((entry) => entry.gridId === agent.seat.itemId);
        assert(item, 'место стоит на существующей мебели');
      }
    });
    flow.agents.forEach((agent) => {
      if ((agent.state === FLOW_STATES.LEAVING || agent.state === FLOW_STATES.LEFT_ANGRY) && agent.spot) {
        assert(grid.isWalkable(Math.floor(agent.spot.x), Math.floor(agent.spot.y)), 'выход проходим');
      }
    });
  }

  function autoPlay() {
    if (options.auto === false) {
      return;
    }
    flow.agents.forEach((agent) => {
      if (agent.state === FLOW_STATES.WAITING) {
        if (!waitSince.has(agent)) {
          waitSince.set(agent, clock);
        }
        if (clock - waitSince.get(agent) >= 400) {
          const result = flow.call(agent);
          if (result.ok) {
            waitSince.delete(agent);
          }
        }
      } else {
        waitSince.delete(agent);
      }
      if (agent.state === FLOW_STATES.IN_TREATMENT && !agent.diagnosed) {
        flow.diagnose(agent, true);
      }
    });
  }

  function advanceUntil(predicate, maxMs = 120000) {
    for (let elapsed = 0; elapsed < maxMs; elapsed += STEP) {
      clock += STEP;
      const due = pending.filter((item) => item.at <= clock);
      for (const item of due) {
        pending.splice(pending.indexOf(item), 1);
        if (item.token !== item.agent.navToken || item.agent.removed) {
          continue;
        }
        pos.set(item.agent, item.point);
        flow.arrived(item.agent);
      }
      flow.update(STEP);
      autoPlay();
      checkSeats();
      if (predicate()) {
        return true;
      }
    }
    return false;
  }

  return {
    L,
    grid,
    flow,
    events,
    items: () => items,
    advanceUntil,
    now: () => clock,
    removeItem(item) {
      grid.remove(item.gridId);
      items = items.filter((entry) => entry !== item);
    },
  };
}

// 1. 50 пациентов: все доходят до gone, никто не застревает, места не дублируются.
const h = createHarness({ maxSpawned: 50 });
const target = 50;
for (let chunk = 0; chunk < 1000 && h.flow.spawned < target; chunk += 1) {
  h.advanceUntil(() => false, STEP * 4);
}
const spawnedTotal = h.flow.spawned;
assert(spawnedTotal >= target, `создано ${spawnedTotal} пациентов`);
const finished = h.advanceUntil(() => h.flow.agents.length === 0, 120000);
assert(finished, `пациенты зависли: создано ${spawnedTotal}, осталось ${h.flow.agents.length}`);
const treated = h.events.filter((event) => event.type === 'treated');
assert.equal(treated.length, spawnedTotal, `вылечено ${treated.length} из ${spawnedTotal}`);
assert.equal(h.events.filter((event) => event.type === 'angry').length, 0, 'никто не ушёл зря');
assert(treated.every((event) => event.reward.coins > 0 && event.reward.reputation > 0), 'награда начислена');

// Все комнаты болезней имеют мебель, иначе тест выше был бы невозможен.
DISEASES.forEach((disease) => {
  const roomId = roomForDisease(disease);
  assert(roomReady(h.items(), layout.ROOMS, roomId), `комната ${roomId} готова для ${disease.id}`);
});

// 2. Продажа кресла: ожидающий пересаживается на другое место.
const seatCase = createHarness({ auto: false, maxSpawned: 1 });
const seated = seatCase.flow.spawn(diseaseFrom('doctor'));
assert(seatCase.advanceUntil(() => seated.state === FLOW_STATES.WAITING && !!seated.seat, 30000));
const oldSeat = seated.seat;
const chair = seatCase.items().find((item) => item.gridId === oldSeat.itemId);
assert(chair && ['waiting_chair', 'waiting_sofa', 'hall_sofa'].includes(chair.type));
seatCase.removeItem(chair);
seatCase.flow.applyWorldChange();
assert(seated.seat && seated.seat.key !== oldSeat.key, 'пациент пересел на другое место');
assert(seatCase.items().some((item) => item.gridId === seated.seat.itemId), 'новое место существует');
seatCase.advanceUntil(() => false, 2000);
assert.equal(seated.state, FLOW_STATES.WAITING, 'после пересадки пациент ждёт');

// 3. Удалили койки, пока пациент в палате: он уходит недовольным.
const roomCase = createHarness({ auto: false, maxSpawned: 1 });
const patient = roomCase.flow.spawn(diseaseFrom('ward'));
assert(roomCase.advanceUntil(() => patient.state === FLOW_STATES.WAITING && !!patient.seat, 30000));
const called = roomCase.flow.call(patient);
assert(called.ok, 'пациента позвали в палату');
assert(roomCase.advanceUntil(() => patient.state === FLOW_STATES.IN_TREATMENT, 30000));
const beds = roomCase.items().filter((item) => item.type === 'ward_bed');
assert(beds.length > 0);
beds.forEach((bed) => roomCase.removeItem(bed));
roomCase.flow.applyWorldChange();
assert.equal(patient.state, FLOW_STATES.LEFT_ANGRY, 'пациент уходит недовольным');
const angry = roomCase.events.filter((event) => event.type === 'angry').pop();
assert(angry && angry.reason === 'room' && angry.penalty > 0, 'штраф за уход');
assert(roomCase.advanceUntil(() => patient.state === FLOW_STATES.GONE, 30000), 'ушёл к входу');
assert.equal(roomCase.flow.agents.length, 0, 'пациент снят с карты');

// 4. Нет кушетки в терапевте: подсказка вместо маршрута.
const hintCase = createHarness({ auto: false, maxSpawned: 1 });
hintCase.items()
  .filter((item) => item.type === 'exam_couch' && item.x < 12)
  .forEach((item) => hintCase.removeItem(item));
const noRoom = hintCase.flow.spawn(diseaseFrom('doctor'));
assert(hintCase.advanceUntil(() => noRoom.state === FLOW_STATES.WAITING, 30000));
const refused = hintCase.flow.call(noRoom);
assert.equal(refused.ok, false, 'без кушетки приём не начинается');
assert(refused.hint.includes('кушетку'), 'подсказка про кушетку: ' + refused.hint);
assert.equal(noRoom.state, FLOW_STATES.WAITING, 'пациент остаётся ждать');

// 5. Терпение кончилось: уходит недовольным, штраф один раз, с карты снимается.
const angryCase = createHarness({
  auto: false,
  maxSpawned: 1,
  timing: { patienceMin: 900, patienceMax: 900 },
});
const tired = angryCase.flow.spawn(diseaseFrom('doctor'));
assert(angryCase.advanceUntil(
  () => tired.state === FLOW_STATES.LEFT_ANGRY, 30000,
), 'по таймеру терпения пациент уходит');
const timeoutAngry = angryCase.events.filter((event) => event.type === 'angry');
assert.equal(timeoutAngry.length, 1, 'штраф за терпение начислен один раз');
assert.equal(timeoutAngry[0].reason, 'patience');
assert(timeoutAngry[0].penalty > 0, 'штраф больше нуля');
assert(angryCase.advanceUntil(() => tired.state === FLOW_STATES.GONE, 30000), 'ушёл к входу');
assert.equal(angryCase.flow.agents.length, 0, 'пациент снят с карты');
assert.equal(angryCase.events.filter((event) => event.type === 'treated').length, 0, 'без лечения');

console.log(`patient flow tests ok; 50 patients, treated ${treated.length}, seats ${seatCase.flow.count()}`);
