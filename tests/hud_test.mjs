// HUD изометрии: где стоит игрок (верхняя панель), сворачивание боковых кнопок, настройка.
import assert from 'node:assert';
import * as layout from '../src/data/layout.js';
import { locationName } from '../src/iso/locator.js';
import { DockModel, SIDE_BUTTON_ALPHA } from '../src/iso/sideDockModel.js';
import { DEFAULT_SETTINGS, normalizeSettings, toggleBoolean, afterProgressReset } from '../src/systems/Settings.js';

// ---- 1. Название места по тайлу --------------------------------------------------
assert.equal(locationName(layout, 5, 6), 'Терапевт', 'внутри кабинета');
assert.equal(locationName(layout, 5.7, 6.2), 'Терапевт', 'дробные координаты округляются вниз');
assert.equal(locationName(layout, 5, 10), 'Терапевт', 'дверной проём относится к кабинету');
assert.equal(locationName(layout, 30, 30), 'Холл', 'зона холла');
assert.equal(locationName(layout, 15, 28), 'Регистратура', 'зона регистратуры');
assert.equal(locationName(layout, 10, 13), 'Коридор', 'в здании, но вне кабинетов и зон');
assert.equal(locationName(layout, 0, 0), 'Улица', 'за границей здания');
assert.equal(locationName(layout, Number.NaN, 3), '', 'мусорные координаты не ломают панель');
assert.equal(locationName(null, 1, 1), '');
layout.ROOMS.filter((r) => r.kind === 'room').forEach((room) => {
  assert.equal(locationName(layout, room.x + 1, room.y + 1), room.name, `центр кабинета ${room.id}`);
});

// ---- 2. Модель сворачивания боковых кнопок ---------------------------------------
assert.equal(SIDE_BUTTON_ALPHA, 0.5, 'боковые кнопки прозрачны на 50%');
const changes = [];
const dock = new DockModel({ collapsed: false, onChange: (v) => changes.push(v) });
assert.equal(dock.collapsed, false);
assert.equal(dock.buttonsShown(), true);
dock.toggle();
assert.equal(dock.collapsed, true);
assert.equal(dock.buttonsShown(), false, 'свёрнуто: кнопки скрыты');
assert.deepEqual(changes, [true], 'изменение уходит в onChange (сохранение настройки)');
dock.toggle();
assert.deepEqual(changes, [true, false]);

const side = [{ x: 1074, y: 12, w: 192, h: 78 }, { x: 1074, y: 78, w: 192, h: 78 }];
const handle = { x: 1240, y: 300, w: 40, h: 90 };
assert.deepEqual(dock.rects(side, handle), [...side, handle], 'развёрнуто: UI занимает кнопки и ручку');
dock.toggle();
assert.deepEqual(dock.rects(side, handle), [handle], 'свёрнуто: игру перекрывает только ручка');

// Обучение указывает на кнопки: на время такого шага панель раскрывается сама и не сохраняется.
const tut = [];
const dock2 = new DockModel({ collapsed: true, onChange: (v) => tut.push(v) });
assert.equal(dock2.expandForTutorial(true), true, 'шаг с кнопкой раскрыл панель');
assert.equal(dock2.collapsed, false);
assert.deepEqual(tut, [], 'временное раскрытие не пишет в настройки');
assert.equal(dock2.expandForTutorial(false), true, 'шаг закончился: панель вернулась свёрнутой');
assert.equal(dock2.collapsed, true);
dock2.toggle();
dock2.expandForTutorial(true);
dock2.expandForTutorial(false);
assert.equal(dock2.collapsed, false, 'ручное раскрытие во время обучения не откатывается');
assert.equal(new DockModel({}).collapsed, false, 'по умолчанию развёрнуто');

// ---- 3. Настройка hudCollapsed -----------------------------------------------------
assert.equal(DEFAULT_SETTINGS.hudCollapsed, false);
assert.equal(normalizeSettings({ hudCollapsed: true }).hudCollapsed, true);
assert.equal(normalizeSettings({ hudCollapsed: 'yes' }).hudCollapsed, false, 'не булево значение отбрасывается');
assert.equal(normalizeSettings(null).hudCollapsed, false);
assert.equal(toggleBoolean({}, 'hudCollapsed').hudCollapsed, true);
assert.equal(afterProgressReset({ hudCollapsed: true }).hudCollapsed, true, 'сброс прогресса хранит оформление');

console.log('hud tests ok; location names, side dock model, hudCollapsed setting');
