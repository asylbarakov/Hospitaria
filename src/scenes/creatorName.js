import { PATIENT_NAMES } from '../data/patientConfig.js';
import { MAX_PLAYER_NAME, sanitizeName } from '../data/playerSkins.js';

const W = 1280;

// Ввод имени в IsoCreatorScene: тап по полю (prompt), случайное имя, клавиатура.
export function askName(scene) {
  let answer = null;
  try {
    answer = window.prompt('Имя персонажа (до 14 символов)', scene.nameValue);
  } catch (err) {
    answer = null;
  }
  if (answer !== null) {
    scene.nameValue = sanitizeName(answer);
    scene.hintText.setText('');
    updateNameField(scene);
  }
}

export function randomName(scene) {
  const pool = PATIENT_NAMES.filter((name) => name !== scene.nameValue);
  scene.nameValue = pool[Math.floor(Math.random() * pool.length)];
  scene.hintText.setText('');
  updateNameField(scene);
}

export function updateNameField(scene) {
  const hasName = scene.nameValue.length > 0;
  scene.nameText.setText(hasName ? scene.nameValue : 'Имя персонажа');
  scene.nameText.setColor(hasName ? '#24444f' : '#8aa6b0');
  if (hasName) {
    scene.caret.setPosition(W / 2 + scene.nameText.width / 2 + 4, 155);
    scene.caret.setVisible(scene.caretOn);
  } else {
    scene.caret.setVisible(false);
  }
}

export function bindKeyboard(scene) {
  scene.onKeyDown = (event) => {
    if (event.key === 'Enter') {
      scene.finish();
      return;
    }
    if (event.key === 'Escape') {
      scene.goBack();
      return;
    }
    if (event.key === 'Backspace') {
      scene.nameValue = scene.nameValue.slice(0, -1);
      scene.hintText.setText('');
      updateNameField(scene);
      return;
    }
    if (
      event.key.length === 1
      && scene.nameValue.length < MAX_PLAYER_NAME
      && /[A-Za-zА-Яа-яЁё0-9 \-]/.test(event.key)
    ) {
      scene.nameValue += event.key;
      scene.hintText.setText('');
      updateNameField(scene);
    }
  };
  scene.input.keyboard.on('keydown', scene.onKeyDown);
  scene.events.once('shutdown', () => scene.input.keyboard.off('keydown', scene.onKeyDown));
}
