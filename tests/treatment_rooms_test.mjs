// Этап 18: контракт «болезнь -> комната -> мини-игра -> награда»,
// приоритет игрока в сложных болезнях и запуск/финиш в mock-сцене.

import assert from 'node:assert';
import { DISEASES } from '../src/data/diseases.js';
import { ROOMS } from '../src/data/layout.js';
import { roomForDisease } from '../src/data/patientFlow.js';
import {
  MINIGAME_KEYS, MINIGAME_TITLES, PLAYER_PRIORITY_DISEASES, ROOM_MINIGAMES,
} from '../src/data/treatmentConfig.js';
import {
  canAutoTreat, gamesForRoom, isPlayerPriorityDisease, minigameForRoom,
  playerRewardFromResult, roomName, treatmentPlanFor, validateTreatmentContract,
} from '../src/systems/treatmentRooms.js';
import TreatmentSession from '../src/systems/TreatmentSession.js';

// 1. Контракт: каждая болезнь имеет комнату, допустимую игру и награду.
const contract = validateTreatmentContract();
assert.equal(contract.ok, true, contract.issues.join('; '));
const diseaseIds = new Set(DISEASES.map((disease) => disease.id));
PLAYER_PRIORITY_DISEASES.forEach((id) => {
  assert(diseaseIds.has(id), `приоритетная болезнь ${id} существует`);
});

DISEASES.forEach((disease) => {
  const roomId = roomForDisease(disease);
  const plan = treatmentPlanFor(disease);
  assert(plan, `${disease.id}: есть план приёма`);
  assert.equal(plan.roomId, roomId, `${disease.id}: комната из patientFlow`);
  assert(ROOM_MINIGAMES[roomId].includes(plan.game), `${disease.id}: игра допустима для комнаты`);
  assert(MINIGAME_KEYS.includes(plan.game), `${disease.id}: игра существует`);
  assert.equal(plan.title, MINIGAME_TITLES[plan.game], `${disease.id}: название игры`);
  assert(plan.roomName && plan.roomName !== 'Кабинет', `${disease.id}: название комнаты`);
  assert(disease.reward.coins > 0 && disease.reward.xp > 0, `${disease.id}: награда положительная`);
});

// 2. У каждой комнаты есть список игр; у рабочих кабинетов — непустой.
assert.equal(gamesForRoom('therapist').length > 0, true);
assert.equal(gamesForRoom('procedure').includes('injection'), true);
assert.equal(gamesForRoom('ward').includes('breath'), true);
assert.equal(gamesForRoom('lab').length > 0, true);
ROOMS.filter((room) => !['hall', 'reception'].includes(room.id)).forEach((room) => {
  assert(gamesForRoom(room.id).length > 0, `${room.id}: есть мини-игра`);
});

// 3. Неподходящая игра заменяется на первую допустимую, а не ломает приём.
assert.equal(minigameForRoom('ward', 'injection'), 'breath');
assert.equal(minigameForRoom('ward', 'drops'), 'drops');
assert.equal(minigameForRoom('hall', 'exam'), null);

// 4. Сложные болезни остаются игроку, простые врач может лечить сам.
const bronchitis = DISEASES.find((disease) => disease.id === 'bronchitis');
const runnyNose = DISEASES.find((disease) => disease.id === 'runny-nose');
assert.equal(isPlayerPriorityDisease(bronchitis), true);
assert.equal(canAutoTreat(bronchitis), false, 'сложную болезнь врач не лечит сам');
assert.equal(isPlayerPriorityDisease(runnyNose), false);
assert.equal(canAutoTreat(runnyNose), true, 'простую болезнь врач лечит сам');

// 5. Награда мини-игры переносится без повторного random.
const shown = {
  stars: 3, coins: 42, xp: 27, crystals: 1, reputation: 3, reason: 'done',
};
assert.deepEqual(playerRewardFromResult(shown), {
  stars: 3, coins: 42, xp: 27, crystals: 1, reputation: 3, skipped: false,
});
assert.equal(playerRewardFromResult(null), null);

// 6. Mock-сцена: игра запускается, ставит больницу и HUD на паузу,
//    затем завершается, возвращает камеру и отдаёт результат.
const calls = [];
let launched = null;
const mockScene = {
  modalOpen: false,
  scene: {
    launch: (key, data) => {
      calls.push(['launch', key]);
      launched = { key, data };
    },
    pause: (key) => calls.push(['pause', key || 'self']),
    resume: (key) => calls.push(['resume', key || 'self']),
  },
};
let finished = null;
let restored = 0;
const session = new TreatmentSession({
  scene: mockScene,
  focus: (roomId, done) => {
    calls.push(['focus', roomId]);
    done();
  },
  restore: () => {
    restored += 1;
    calls.push(['restore']);
  },
  onFinish: (agent, result) => {
    finished = { agent, result };
    calls.push(['finish', result.stars]);
  },
});

const agent = {
  name: 'Тест',
  disease: bronchitis,
  roomId: 'procedure',
  avatar: { config: {} },
};
const started = session.start(agent);
assert.equal(started.ok, true, 'приём запущен');
assert.equal(started.plan.game, 'breath', 'для бронхита выбрано дыхание');
assert.equal(session.isActive, true);
assert.deepEqual(calls.slice(0, 4), [
  ['focus', 'procedure'],
  ['launch', 'MiniGameScene'],
  ['pause', 'IsoHospitalHud'],
  ['pause', 'self'],
]);
assert.equal(mockScene.modalOpen, true, 'на время игры мир закрыт от тапов');
assert.equal(launched.data.patient.disease.id, 'bronchitis');
assert.equal(launched.data.roomId, 'procedure');
assert.equal(launched.data.roomName, 'Процедурная');
assert.equal(launched.data.gameKey, 'breath');
assert.equal(session.start(agent).ok, false, 'второй приём одновременно нельзя');

launched.data.onFinish(shown);
assert.equal(session.isActive, false, 'после результата сессия свободна');
assert.equal(finished.result, shown, 'результат передан без изменений');
assert.equal(restored, 1, 'камера вернулась');
assert.equal(mockScene.modalOpen, false, 'тапы снова работают');
assert.deepEqual(calls.slice(-4), [
  ['resume', 'IsoHospitalHud'],
  ['resume', 'self'],
  ['restore'],
  ['finish', 3],
]);

console.log('treatment rooms tests ok; contract, player priority, mock minigame');
