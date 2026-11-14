// Этап 16: задания без Phaser. События двигают прогресс, награды не повторяются,
// ежедневные/недельные сбрасываются по дате, сюжет идёт строго по шагам, сохранение работает.
import assert from 'node:assert';
import EventBus from '../src/systems/EventBus.js';
import Quests, { dateKey, weekKey } from '../src/systems/Quests.js';

function createHarness(start = new Date(2026, 10, 9, 12, 0, 0)) {
  let clock = start;
  const bus = new EventBus();
  const completed = [];
  const claimedEvents = [];
  let changes = 0;
  bus.on('questCompleted', (event) => completed.push(event));
  bus.on('questClaimed', (event) => claimedEvents.push(event));
  const quests = new Quests({
    bus,
    now: () => clock,
    onChange: () => { changes += 1; },
  });
  return {
    bus,
    quests,
    completed,
    claimedEvents,
    changes: () => changes,
    setDate(date) { clock = date; },
    addDays(days) { clock = new Date(clock.getTime() + days * 86400000); },
  };
}

function entryOf(quests, category, id) {
  const state = quests.state();
  return state[category].quests.find((quest) => quest.id === id);
}

// 1. Ежедневное задание: события двигают прогресс, награда выдаётся один раз.
const daily = createHarness();
daily.bus.emit('patientTreated', { stars: 2 });
daily.bus.emit('patientTreated', { stars: 1 });
let entry = entryOf(daily.quests, 'daily', 'daily-treat-3');
assert.equal(entry.progress, 2, 'два приёма учтены');
assert.equal(entry.complete, false, 'цель ещё не достигнута');
assert.equal(daily.quests.claim('daily', 'daily-treat-3').ok, false, 'рано забирать');
daily.bus.emit('patientTreated', { stars: 3 });
entry = entryOf(daily.quests, 'daily', 'daily-treat-3');
assert.equal(entry.progress, 3, 'третий приём завершил задание');
assert.equal(entry.complete, true, 'задание готово');
assert.equal(daily.completed.length, 1, 'уведомление о выполнении отправлено');
assert.equal(daily.completed[0].quest.id, 'daily-treat-3');

const claimed = daily.quests.claim('daily', 'daily-treat-3');
assert.equal(claimed.ok, true, 'награда забрана');
assert.deepEqual(claimed.reward, { coins: 80, experience: 10, crystals: 0 });
assert.equal(daily.quests.claim('daily', 'daily-treat-3').ok, false, 'повторно забрать нельзя');
assert.equal(daily.claimedEvents.length, 1, 'событие получения награды одно');

// 2. Событие с суммой: монеты складываются, но прогресс не превышает цель.
daily.bus.emit('coinsEarned', { amount: 120 });
daily.bus.emit('coinsEarned', { amount: 500 });
entry = entryOf(daily.quests, 'daily', 'daily-earn-200');
assert.equal(entry.progress, 200, 'прогресс ограничен целью');
assert.equal(daily.quests.claim('daily', 'daily-earn-200').ok, true, 'награда за монеты');
assert.equal(daily.quests.claim('daily', 'daily-earn-200').ok, false, 'награда за монеты не повторяется');

// 3. Покупка предмета двигает ежедневное задание.
daily.bus.emit('itemBought', { type: 'plant_big', price: 90 });
assert.equal(entryOf(daily.quests, 'daily', 'daily-buy-1').complete, true, 'покупка учтена');
assert.equal(daily.quests.claim('daily', 'daily-buy-1').ok, true, 'награда за покупку');

// 4. Сохранение и загрузка: прогресс и забранные награды переживают JSON.
const saved = JSON.parse(JSON.stringify(daily.quests.serialize()));
daily.quests.destroy();
const loadedBus = new EventBus();
const loaded = new Quests({ bus: loadedBus, saved, now: () => new Date(2026, 10, 9, 18, 0, 0) });
assert.equal(entryOf(loaded, 'daily', 'daily-treat-3').claimed, true, 'награда осталась полученной');
assert.equal(entryOf(loaded, 'daily', 'daily-treat-3').progress, 3, 'прогресс сохранился');
assert.equal(loaded.claim('daily', 'daily-treat-3').ok, false, 'после загрузки повторно нельзя');
assert.equal(loaded.serialize().daily.claimed.length, 3, 'в сохранении три забранных задания');

// 5. Сюжет: шаги только по порядку и с проверкой условия.
const story = createHarness();
story.bus.emit('staffHired', { roleId: 'doctor' });
assert.equal(entryOf(story.quests, 'story', 'story-ward-bed').progress, 0, 'чужое событие не двигает сюжет');
assert.equal(entryOf(story.quests, 'story', 'story-ward-bed').locked, false, 'первый шаг активен');
assert.equal(entryOf(story.quests, 'story', 'story-receptionist').locked, true, 'второй шаг закрыт');

story.bus.emit('itemBought', { type: 'plant_big' });
assert.equal(entryOf(story.quests, 'story', 'story-ward-bed').progress, 0, 'не та мебель не считается');
story.bus.emit('itemBought', { type: 'ward_bed' });
assert.equal(entryOf(story.quests, 'story', 'story-ward-bed').complete, true, 'койка в палате учтена');
assert.equal(story.quests.claim('story', 'story-receptionist').ok, false, 'нельзя перескочить шаг');
const first = story.quests.claim('story', 'story-ward-bed');
assert.equal(first.ok, true, 'первый сюжетный шаг забран');
assert.deepEqual(first.reward, { coins: 150, experience: 20, crystals: 0 });
assert.equal(entryOf(story.quests, 'story', 'story-receptionist').locked, false, 'второй шаг открылся');

story.bus.emit('staffHired', { roleId: 'doctor' });
assert.equal(entryOf(story.quests, 'story', 'story-receptionist').progress, 0, 'нужен именно регистратор');
story.bus.emit('staffHired', { roleId: 'receptionist' });
assert.equal(entryOf(story.quests, 'story', 'story-receptionist').complete, true, 'регистратор нанят');
assert.equal(story.quests.claim('story', 'story-receptionist').ok, true, 'второй шаг забран');

for (let i = 0; i < 5; i += 1) story.bus.emit('patientTreated', { stars: 2 });
assert.equal(entryOf(story.quests, 'story', 'story-treat-5').complete, true, 'пять пациентов учтены');
assert.equal(entryOf(story.quests, 'story', 'story-treat-10').locked, true, 'следующий шаг ещё закрыт');

// 6. Смена даты сбрасывает ежедневные, но не сюжет и не недельные в тот же день.
const beforeKey = dateKey(new Date(2026, 10, 9, 12, 0, 0));
assert.equal(story.quests.serialize().daily.key, beforeKey);
assert.equal(entryOf(story.quests, 'daily', 'daily-treat-3').progress, 3, 'дневной прогресс есть');
const storyDone = story.quests.serialize().story.claimed.length;
story.setDate(new Date(2026, 10, 10, 9, 0, 0));
const nextDay = story.quests.state();
assert.equal(nextDay.daily.quests.find((q) => q.id === 'daily-treat-3').progress, 0, 'новый день — чистый прогресс');
assert.equal(nextDay.daily.quests.find((q) => q.id === 'daily-treat-3').claimed, false, 'награды дня сброшены');
assert.equal(story.quests.serialize().story.claimed.length, storyDone, 'сюжет не сбрасывается');

// 7. Недельный сброс: через 7 дней прогресс недели начинается заново.
const weekly = createHarness(new Date(2026, 10, 9, 12, 0, 0));
const firstWeek = weekKey(new Date(2026, 10, 9, 12, 0, 0));
weekly.bus.emit('staffHired', { roleId: 'receptionist' });
assert.equal(entryOf(weekly.quests, 'weekly', 'weekly-hire-2').progress, 1, 'недельный прогресс идёт');
assert.equal(weekly.quests.serialize().weekly.key, firstWeek);
weekly.setDate(new Date(2026, 10, 16, 12, 0, 0));
assert.notEqual(weekKey(new Date(2026, 10, 16, 12, 0, 0)), firstWeek, 'неделя сменилась');
assert.equal(entryOf(weekly.quests, 'weekly', 'weekly-hire-2').progress, 0, 'новая неделя — чистый прогресс');

// 8. Неизвестное событие не ломает систему.
weekly.bus.emit('roomUnlocked', { roomId: 'lab' });
weekly.bus.emit('unknownEvent', {});
assert.equal(weekly.quests.state().weekly.quests.length, 3, 'состояние осталось целым');

console.log('quests tests ok; events, resets, story, rewards, save/load');
