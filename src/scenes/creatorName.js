import { PATIENT_NAMES } from '../data/patientConfig.js';
import { MAX_PLAYER_NAME, sanitizeName } from '../data/playerSkins.js';

const W = 1280;

// Ввод имени в IsoCreatorScene: тап по полю открывает настоящее поле ввода поверх игры
// (работает с экранной клавиатурой телефона), запасной вариант window.prompt.
// Также доступны случайное имя и ввод с физической клавиатуры.
export function askName(scene) {
  if (scene.domInput || openDomInput(scene)) {
    return;
  }
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

function removeDomInput(scene) {
  const input = scene.domInput;
  scene.domInput = null;
  scene.domInputOpen = false;
  if (input && input.parentNode) {
    input.parentNode.removeChild(input);
  }
}

function closeDomInput(scene) {
  removeDomInput(scene);
  // Сцена могла уже закрываться (тап «Готово» снимает фокус): тексты тогда уничтожены.
  if (scene.nameText && scene.nameText.active) {
    scene.nameText.setVisible(true);
    updateNameField(scene);
  }
}

/** Поле <input> точно поверх нарисованного поля имени (410..870 x 124..186 в координатах игры). */
function openDomInput(scene) {
  try {
    const canvas = scene.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const k = rect.width / W;
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = MAX_PLAYER_NAME;
    input.value = scene.nameValue;
    input.placeholder = 'Имя персонажа';
    input.autocomplete = 'off';
    input.setAttribute('enterkeyhint', 'done');
    Object.assign(input.style, {
      position: 'fixed',
      left: `${rect.left + 410 * k}px`,
      top: `${rect.top + 124 * k}px`,
      width: `${460 * k}px`,
      height: `${62 * k}px`,
      boxSizing: 'border-box',
      font: `${28 * k}px Arial, "Segoe UI", sans-serif`,
      textAlign: 'center',
      color: '#24444f',
      background: '#ffffff',
      border: `${3 * k}px solid #2f80c9`,
      borderRadius: `${16 * k}px`,
      outline: 'none',
      zIndex: '10',
    });
    input.addEventListener('input', () => {
      scene.nameValue = sanitizeName(input.value);
      if (input.value !== scene.nameValue) {
        input.value = scene.nameValue;
      }
      scene.hintText.setText('');
    });
    input.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Enter') {
        input.blur();
      }
    });
    input.addEventListener('blur', () => closeDomInput(scene));
    document.body.appendChild(input);
    scene.domInput = input;
    scene.domInputOpen = true;
    scene.nameText.setVisible(false);
    scene.caret.setVisible(false);
    scene.events.once('shutdown', () => removeDomInput(scene));
    input.focus();
    return true;
  } catch (err) {
    return false;
  }
}

export function randomName(scene) {
  const pool = PATIENT_NAMES.filter((name) => name !== scene.nameValue);
  scene.nameValue = pool[Math.floor(Math.random() * pool.length)];
  scene.hintText.setText('');
  updateNameField(scene);
}

export function updateNameField(scene) {
  if (scene.domInputOpen) {
    return;
  }
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
    if (scene.domInputOpen) {
      return;
    }
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
