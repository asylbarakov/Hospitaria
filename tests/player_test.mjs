// Этап 12: игрок, имя, покупка облика, совместимость сохранения.
import assert from 'node:assert';
import {
  DEFAULT_PLAYER, MAX_PLAYER_NAME, PLAYER_SKINS, buySkin, isSkinOwned, normalizePlayer, sanitizeName,
} from '../src/data/playerSkins.js';

const store = {};
globalThis.window = { localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } } };
const { loadIsoSave, saveIso, clearIsoSave } = await import('../src/systems/IsoSave.js');

// normalizePlayer на мусоре
for (const junk of [null, undefined, 5, 'x', [], { skin: 'nope', role: 'boss', accent: 'zzz', owned: 'a', name: 42 }]) {
  const p = normalizePlayer(junk);
  assert(['doctor', 'nurse'].includes(p.role));
  assert(PLAYER_SKINS.some((s) => s.id === p.skin));
  assert(Array.isArray(p.owned) && p.name === '');
}
assert.equal(normalizePlayer({ ...DEFAULT_PLAYER, name: ' '.repeat(3) + 'Ы'.repeat(30) }).name.length, MAX_PLAYER_NAME);
assert.deepEqual(normalizePlayer({ owned: ['staff_janitor', 'staff_janitor', 'bad'] }).owned, ['staff_janitor']);

// имя
assert.equal(sanitizeName('  Оля<b>  '), 'Оляb');
assert.equal(sanitizeName('Оля!!!'), 'Оля');
assert.equal(sanitizeName(null), '');
assert.equal(sanitizeName('А'.repeat(40)).length, MAX_PLAYER_NAME);
assert.equal(sanitizeName('Ив   ан'), 'Ив ан');

// покупка облика
const base = normalizePlayer({ ...DEFAULT_PLAYER, name: 'Тест' });
let r = buySkin(base, 1000, 'staff_nurse');
assert(r.ok && r.coins === 1000 && r.player.skin === 'staff_nurse', 'бесплатный облик');
const paid = PLAYER_SKINS.find((s) => s.price > 0);
r = buySkin(base, paid.price - 1, paid.id);
assert(!r.ok && r.reason === 'coins' && r.coins === paid.price - 1 && r.player.skin === base.skin, 'не хватает монет');
r = buySkin(base, paid.price + 5, paid.id);
assert(r.ok && r.coins === 5 && r.player.skin === paid.id && r.player.owned.includes(paid.id), 'покупка');
const again = buySkin(r.player, r.coins, paid.id);
assert(again.ok && again.coins === 5 && again.player.owned.length === 1, 'повторно не списывает');
assert(isSkinOwned(paid.id, r.player.owned));
assert(!buySkin(base, 999, 'nope').ok);

// сохранение
assert.equal(loadIsoSave(), null);
store['hospitaria.iso.layout.v1'] = JSON.stringify({ v: 1, coins: 77, items: [{ type: 'plant_big', x: 1, y: 1, rot: 0 }] });
let s = loadIsoSave();
assert(s && s.player === null && s.coins === 77 && s.items.length === 1, 'старое сохранение без player');
saveIso(null, null, { ...base, name: 'Аня' });
s = loadIsoSave();
assert(s.items === null && s.coins === null && s.player.name === 'Аня', 'игрок без мебели');
saveIso(10, [], r.player);
assert.deepEqual(loadIsoSave().player.owned, [paid.id]);
store['hospitaria.iso.layout.v1'] = '{bad json';
assert.equal(loadIsoSave(), null);
store['hospitaria.iso.layout.v1'] = JSON.stringify({ v: 2 });
assert.equal(loadIsoSave(), null);
clearIsoSave();
assert.equal(loadIsoSave(), null);
console.log('player tests ok');

// Ввод имени (creatorName): prompt, случайное имя, клавиатура
const { askName, randomName, bindKeyboard, updateNameField } = await import('../src/scenes/creatorName.js');
const label = () => ({ t: '', setText(v) { this.t = v; return this; }, setColor() { return this; }, setPosition() { return this; }, setVisible() { return this; }, width: 50 });
const mk = () => ({ nameValue: '', caretOn: true, nameText: label(), caret: label(), hintText: label(), finished: 0, finish() { this.finished += 1; }, goBack() {},
  input: { keyboard: { on(e, f) { this.f = f; }, off() {} } }, events: { once() {} } });
let sc = mk();
globalThis.window.prompt = () => '  Маша!  ';
askName(sc);
assert.equal(sc.nameValue, 'Маша');
assert.equal(sc.nameText.t, 'Маша');
globalThis.window.prompt = () => null;
askName(sc);
assert.equal(sc.nameValue, 'Маша', 'отмена не меняет имя');
globalThis.window.prompt = () => { throw new Error('blocked'); };
askName(sc);
assert.equal(sc.nameValue, 'Маша', 'prompt недоступен');
randomName(sc);
assert(sc.nameValue && sc.nameValue !== 'Маша');
sc = mk();
bindKeyboard(sc);
const key = (k) => sc.input.keyboard.f({ key: k });
['О', 'л', 'я', '!'].forEach(key);
assert.equal(sc.nameValue, 'Оля');
key('Backspace');
assert.equal(sc.nameValue, 'Ол');
key('Enter');
assert.equal(sc.finished, 1);
console.log('name entry ok');
