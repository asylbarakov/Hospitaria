// Сворачиваемая боковая панель кнопок: состояние без Phaser, чтобы проверять в node.
// Вид (ручка, прозрачность) живёт в SideDock.js.

/** Боковые кнопки полупрозрачны, чтобы меньше закрывать игру. */
export const SIDE_BUTTON_ALPHA = 0.5;

export class DockModel {
  /** @param {{collapsed?:boolean, onChange?:(collapsed:boolean)=>void}} options */
  constructor(options = {}) {
    this.collapsed = !!options.collapsed;
    this.onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
    this.tutorialOpened = false; // панель раскрыта обучением, а не игроком
  }

  buttonsShown() {
    return !this.collapsed;
  }

  /** Ручное переключение игроком: сохраняется в настройках. */
  toggle() {
    this.collapsed = !this.collapsed;
    this.tutorialOpened = false;
    this.onChange(this.collapsed);
    return this.collapsed;
  }

  /**
   * Шаг обучения указывает на боковую кнопку: раскрываем панель на время шага и не сохраняем.
   * Когда шаг кончился, возвращаем как было, если игрок сам ничего не менял.
   * @returns {boolean} изменилось ли состояние
   */
  expandForTutorial(needsButtons) {
    if (needsButtons && this.collapsed) {
      this.collapsed = false;
      this.tutorialOpened = true;
      return true;
    }
    if (!needsButtons && this.tutorialOpened) {
      this.collapsed = true;
      this.tutorialOpened = false;
      return true;
    }
    return false;
  }

  /** Прямоугольники, на которых указатель не двигает камеру и персонажа. */
  rects(sideRects, handleRect) {
    return this.collapsed ? [handleRect] : [...sideRects, handleRect];
  }
}

export default DockModel;
