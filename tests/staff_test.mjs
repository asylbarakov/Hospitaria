// Этап 15: персонал без Phaser. Посты, переназначение, зарплата и уборка.
import assert from 'node:assert';
import StaffFlow from '../src/iso/StaffFlow.js';
import { FLOW_STATES } from '../src/data/patientFlow.js';

function seeded(seed = 7) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

function createHarness(options = {}) {
  let posts = (options.posts || []).map((post) => ({ ...post }));
  let revision = 1;
  let coins = Number.isFinite(options.coins) ? options.coins : 1000;
  const events = [];
  const penalties = [];
  const world = {
    revision: () => revision,
    entrance: () => ({ x: 0.5, y: 0.5 }),
    posts: (types) => posts.filter((post) => types.includes(post.type)),
    idleSpots: () => [{ x: 28, y: 30 }, { x: 31, y: 30 }],
    dirtTiles: () => [{ x: 10, y: 10 }, { x: 11, y: 10 }],
  };
  const flow = new StaffFlow({
    world,
    patients: options.patients || null,
    getCoins: () => coins,
    spend: (n) => { coins -= n; },
    penalty: (n) => penalties.push(n),
    notify: () => {},
    onChange: () => {},
    onEvent: (event) => events.push(event),
    random: seeded(),
    timing: {
      salaryDayMs: 1000,
      dirtIntervalMs: 100000,
      autoDelayMs: 100,
      cleanMs: 200,
      ...(options.timing || {}),
    },
  });
  return {
    flow,
    events,
    penalties,
    coins: () => coins,
    addPost(post) {
      posts.push({ ...post });
      revision += 1;
    },
    removePost(itemId) {
      posts = posts.filter((post) => post.itemId !== itemId);
      revision += 1;
    },
  };
}

// 1. Без поста работник стоит в холле.
const noPost = createHarness({ posts: [] });
const receptionist = noPost.flow.hire('receptionist').agent;
assert(receptionist, 'регистратор нанят');
assert.equal(receptionist.state, 'idle', 'без поста работник ждёт');
assert.equal(receptionist.post, null, 'поста нет');
assert(receptionist.spot, 'есть место ожидания в холле');
assert.equal(noPost.coins(), 650, 'цена найма списана');

// 2. Появился пост: работник идёт туда и начинает работать.
noPost.addPost({ key: 'post:1', itemId: 1, type: 'reception_desk', x: 12, y: 12, roomId: null });
assert(noPost.flow.refreshPosts(), 'посты пересобраны');
assert.equal(receptionist.state, 'goToPost', 'работник идёт на пост');
assert.equal(receptionist.post.itemId, 1);
noPost.flow.arrived(receptionist);
assert.equal(receptionist.state, 'working', 'работник на посту');

// 3. Пост продали: работник переназначается на свободный.
noPost.addPost({ key: 'post:2', itemId: 2, type: 'reception_desk', x: 14, y: 12, roomId: null });
noPost.removePost(1);
assert(noPost.flow.refreshPosts(), 'посты пересобраны после продажи');
assert.equal(receptionist.post.itemId, 2, 'пост переназначен');
assert.equal(receptionist.state, 'goToPost', 'работник идёт на новый пост');

// 4. Зарплата списывается ровно раз за день.
const salary = createHarness({ posts: [] });
salary.flow.hire('janitor');
const afterHire = salary.coins();
salary.flow.update(999);
assert.equal(salary.coins(), afterHire, 'до конца дня зарплата не списывается');
salary.flow.update(1);
assert.equal(salary.coins(), afterHire - 25, 'зарплата списана один раз');
salary.flow.update(500);
assert.equal(salary.coins(), afterHire - 25, 'в середине дня повторно не списывается');
salary.flow.update(500);
assert.equal(salary.coins(), afterHire - 50, 'новый день — новая зарплата');

// 5. Уборщик идёт к пятну и убирает его.
const clean = createHarness({ posts: [] });
const janitor = clean.flow.hire('janitor').agent;
const dirt = clean.flow.spawnDirt();
assert(dirt, 'пятно появилось');
clean.flow.update(1);
assert.equal(janitor.state, 'goToDirt', 'уборщик идёт к пятну');
clean.flow.arrived(janitor);
assert.equal(janitor.state, 'cleaning', 'уборщик начал уборку');
clean.flow.update(201);
assert.equal(clean.flow.dirt.length, 0, 'пятно убрано');
assert(janitor.state !== 'cleaning', 'уборка завершена');
assert.equal(clean.penalties.length, 0, 'за быстро убранное пятно штрафа нет');

// 6. Грязь без уборщика штрафует репутацию.
const dirty = createHarness({
  posts: [],
  timing: { dirtIntervalMs: 100000, dirtGraceMs: 100, dirtPenaltyMs: 100 },
});
dirty.flow.spawnDirt();
dirty.flow.update(150);
assert.equal(dirty.penalties.length, 0, 'до истечения срока штрафа нет');
dirty.flow.update(100);
assert.equal(dirty.penalties.length, 1, 'за грязью следит репутация');

// 7. Регистратор ускоряет регистрацию, врач сам ведёт приём.
const patient = {
  state: FLOW_STATES.REGISTERING,
  timer: 1000,
  roomId: 'therapist',
  diagnosed: false,
};
const patients = {
  agents: [patient],
  call: () => ({ ok: true }),
  diagnose: (target, correct, stars) => {
    target.diagnosed = correct;
    target.autoStars = stars;
    return { ok: correct };
  },
};
const auto = createHarness({
  posts: [
    { key: 'post:3', itemId: 3, type: 'reception_desk', x: 12, y: 12, roomId: null },
    { key: 'post:4', itemId: 4, type: 'doctor_desk', x: 3, y: 5, roomId: 'therapist' },
  ],
  patients,
});
const registrar = auto.flow.hire('receptionist').agent;
auto.flow.arrived(registrar);
auto.flow.update(100);
assert(patient.timer < 1000, 'регистратор ускорил регистрацию');
const doctor = auto.flow.hire('doctor').agent;
auto.flow.arrived(doctor);
patient.state = FLOW_STATES.IN_TREATMENT;
patient.diagnosed = false;
auto.flow.update(101);
assert.equal(patient.diagnosed, true, 'врач поставил диагноз сам');
assert.equal(patient.autoStars, 1, 'награда врача ниже, чем у игрока');

console.log('staff tests ok; roles, posts, salary, dirt, automation');
