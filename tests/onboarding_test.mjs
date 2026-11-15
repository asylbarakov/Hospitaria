// Этап 19: обучение и настройки без Phaser.
// Проверяем порядок шагов, пропуск, повтор, сохранение флага и нормализацию настроек.
import assert from 'node:assert';
import EventBus from '../src/systems/EventBus.js';
import Onboarding, { ONBOARDING_STEPS } from '../src/systems/Onboarding.js';
import {
  DEFAULT_SETTINGS,
  afterProgressReset,
  normalizeSettings,
  resetOnboarding,
  toggleBoolean,
  withVolume,
} from '../src/systems/Settings.js';

function harness(settings = {}) {
  const bus = new EventBus();
  const changes = [];
  const onboarding = new Onboarding({
    bus,
    settings,
    onChange: (state) => changes.push(state),
  });
  return { bus, onboarding, changes };
}

// 1. Новый игрок начинает с первого шага, чужое событие не двигает обучение.
const first = harness();
assert.equal(first.onboarding.active, true, 'обучение активно по умолчанию');
assert.equal(first.onboarding.total, 6, 'шесть шагов');
assert.equal(first.onboarding.current.id, 'walk', 'первый шаг — ходьба');
assert.equal(first.onboarding.index, 0);
first.bus.emit('staffHired', { roleId: 'doctor' });
assert.equal(first.onboarding.current.id, 'walk', 'найм не завершает шаг ходьбы');
assert.equal(first.changes.length, 0, 'без действия нет сохранений');

// 2. Шаги проходят строго по порядку: ходьба, приветствие, диагноз, лечение, покупка, найм.
first.bus.emit('playerWalked', {});
assert.equal(first.onboarding.current.id, 'greet', 'после ходьбы — приветствие');
first.bus.emit('patientGreeted', { patientId: 'p1' });
assert.equal(first.onboarding.current.id, 'diagnose', 'после приветствия — диагноз');
first.bus.emit('diagnosisMade', { correct: true });
assert.equal(first.onboarding.current.id, 'treat', 'после диагноза — лечение');

// Автолечение (сотрудником) не засчитывается игроку.
first.bus.emit('patientTreated', { auto: true });
assert.equal(first.onboarding.current.id, 'treat', 'автолечение не закрывает шаг');
first.bus.emit('patientTreated', { auto: false, stars: 2 });
assert.equal(first.onboarding.current.id, 'build', 'после лечения — стройка');
first.bus.emit('itemBought', { type: 'chair' });
assert.equal(first.onboarding.current.id, 'staff', 'после покупки — персонал');
first.bus.emit('staffHired', { roleId: 'receptionist' });
assert.equal(first.onboarding.active, false, 'обучение завершено');
assert.equal(first.onboarding.current, null, 'текущего шага нет');
assert.equal(first.onboarding.index, ONBOARDING_STEPS.length, 'индекс за последним шагом');
assert.equal(first.changes.length, 6, 'каждый шаг сохраняется');
assert.deepEqual(first.changes[5], { onboardingDone: true, onboardingStep: 6 }, 'флаг сохраняется');

// 3. Завершённое обучение не показывается снова при загрузке сохранения.
const loaded = harness({ onboardingDone: true, onboardingStep: 6 });
assert.equal(loaded.onboarding.active, false, 'флаг из сохранения уважается');
assert.equal(loaded.onboarding.current, null);
loaded.bus.emit('playerWalked', {});
assert.equal(loaded.onboarding.active, false, 'события не включают обучение');

// 4. Повтор из настроек сбрасывает шаг, а сохранённый шаг продолжает обучение.
const resumed = harness({ onboardingDone: false, onboardingStep: 3 });
assert.equal(resumed.onboarding.active, true, 'незавершённое обучение продолжается');
assert.equal(resumed.onboarding.current.id, 'treat', 'шаг восстановлен из сохранения');
resumed.onboarding.restart();
assert.equal(resumed.onboarding.current.id, 'walk', 'повтор начинает с первого шага');
assert.equal(resumed.changes.length, 1, 'повтор сохраняется');

// 5. Пропуск закрывает обучение и сохраняет это.
const skipped = harness();
assert.equal(skipped.onboarding.skip(), true, 'пропуск сработал');
assert.equal(skipped.onboarding.active, false, 'после пропуска обучение неактивно');
assert.deepEqual(skipped.changes[0], { onboardingDone: true, onboardingStep: 6 }, 'пропуск сохранён');
assert.equal(skipped.onboarding.skip(), false, 'повторный пропуск ничего не делает');

// 6. Отписка от шины: после destroy события не трогают обучение.
const detached = harness();
detached.onboarding.destroy();
detached.bus.emit('playerWalked', {});
assert.equal(detached.onboarding.current.id, 'walk', 'после destroy шаг не меняется');

// 7. Настройки: значения приводятся к безопасному диапазону.
assert.deepEqual(normalizeSettings(null), { ...DEFAULT_SETTINGS }, 'пустые настройки — значения по умолчанию');
const fixed = normalizeSettings({ volume: 5, onboardingStep: 9.8, grid: 'yes', simpleGraphics: true });
assert.equal(fixed.volume, 1, 'громкость сверху ограничена');
assert.equal(fixed.onboardingStep, 9, 'шаг округлён вниз');
assert.equal(fixed.grid, false, 'не булево значение игнорируется');
assert.equal(fixed.simpleGraphics, true, 'булево значение сохраняется');
assert.equal(normalizeSettings({ volume: -2 }).volume, 0, 'громкость снизу ограничена');
assert.equal(normalizeSettings({ volume: 'abc' }).volume, DEFAULT_SETTINGS.volume, 'мусор даёт громкость по умолчанию');
assert.equal(withVolume({ volume: 0.5 }, 0.25).volume, 0.25, 'withVolume меняет громкость');
assert.equal(withVolume({ volume: 0.5 }, 9).volume, 1, 'withVolume ограничивает сверху');
assert.equal(toggleBoolean({ grid: false }, 'grid').grid, true, 'grid переключается');
assert.equal(toggleBoolean({ grid: true }, 'grid').grid, false, 'grid переключается обратно');
assert.equal(toggleBoolean({ grid: true }, 'unknown').grid, true, 'неизвестное поле не ломает настройки');

// 8. Сброс прогресса и повтор обучения сохраняют звук и оформление.
const custom = { volume: 0.4, grid: true, simpleGraphics: true, onboardingDone: true, onboardingStep: 6 };
const reset = resetOnboarding(custom);
assert.equal(reset.onboardingDone, false, 'обучение снова активно');
assert.equal(reset.onboardingStep, 0, 'шаг сброшен');
assert.equal(reset.volume, 0.4, 'громкость сохранена');
assert.equal(reset.grid, true, 'сетка сохранена');
const afterReset = afterProgressReset(custom);
assert.equal(afterReset.onboardingDone, false, 'после сброса обучение показывается');
assert.equal(afterReset.simpleGraphics, true, 'упрощённая графика сохранена');

console.log('onboarding tests ok; steps, skip, restart, save flag, settings');
