// Обучение новичка (этап 19): шесть шагов, каждый завершается действием игрока.
// Чистая логика без Phaser: события приходят с шины, HUD рисует подсказку и стрелку.
// Прогресс хранится в настройках сохранения, поэтому обучение показывается один раз.

export const ONBOARDING_STEPS = Object.freeze([
  {
    id: 'walk',
    title: 'Шаг 1 из 6',
    text: 'Нажмите на пол — врач подойдёт к этому месту.',
    target: { kind: 'player' },
  },
  {
    id: 'greet',
    title: 'Шаг 2 из 6',
    text: 'Нажмите на пациента в холле и пригласите его в кабинет.',
    target: { kind: 'patient' },
  },
  {
    id: 'diagnose',
    title: 'Шаг 3 из 6',
    text: 'Прочитайте жалобы и выберите правильный диагноз.',
    target: { kind: 'screen', x: 640, y: 360 },
  },
  {
    id: 'treat',
    title: 'Шаг 4 из 6',
    text: 'Вылечите пациента в мини-игре. Больше звёзд — больше награда.',
    target: { kind: 'screen', x: 640, y: 360 },
  },
  {
    id: 'build',
    title: 'Шаг 5 из 6',
    text: 'Откройте «Строить» и поставьте кресло в холле.',
    target: { kind: 'hud', x: 1180, y: 102 },
  },
  {
    id: 'staff',
    title: 'Шаг 6 из 6',
    text: 'Наймите первого сотрудника: он будет помогать в больнице.',
    target: { kind: 'hud', x: 1180, y: 164 },
  },
]);

const EVENT_STEPS = {
  playerWalked: 'walk',
  patientGreeted: 'greet',
  diagnosisMade: 'diagnose',
  patientTreated: 'treat',
  itemBought: 'build',
  staffHired: 'staff',
};

export default class Onboarding {
  /**
   * @param {{bus?:object, settings?:object, onChange?:Function}} options
   */
  constructor(options = {}) {
    this.bus = options.bus || null;
    this.onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
    this.off = [];
    const settings = options.settings || {};
    this.done = !!settings.onboardingDone;
    const savedStep = Math.floor(Number(settings.onboardingStep) || 0);
    this.step = this.done ? ONBOARDING_STEPS.length : Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, savedStep));
    if (this.bus) {
      Object.keys(EVENT_STEPS).forEach((type) => {
        this.off.push(this.bus.on(type, (payload) => this.handle(type, payload)));
      });
    }
  }

  get total() {
    return ONBOARDING_STEPS.length;
  }

  get active() {
    return !this.done;
  }

  get current() {
    return this.done ? null : ONBOARDING_STEPS[this.step] || null;
  }

  get index() {
    return this.done ? this.total : this.step;
  }

  /** Событие шины: двигает шаг только если оно относится к текущему заданию. */
  handle(type, payload = null) {
    if (this.done) {
      return false;
    }
    if (type === 'patientTreated') {
      if (payload && payload.auto) {
        return false;
      }
      return this.complete('treat');
    }
    const stepId = EVENT_STEPS[type];
    if (!stepId) {
      return false;
    }
    return this.complete(stepId);
  }

  /** Действие игрока: завершает шаг, если совпадает с текущим. */
  complete(stepId) {
    if (this.done || !this.current || this.current.id !== stepId) {
      return false;
    }
    this.step += 1;
    if (this.step >= ONBOARDING_STEPS.length) {
      this.done = true;
    }
    this.onChange(this.serialize());
    return true;
  }

  skip() {
    if (this.done) {
      return false;
    }
    this.done = true;
    this.step = ONBOARDING_STEPS.length;
    this.onChange(this.serialize());
    return true;
  }

  restart() {
    this.done = false;
    this.step = 0;
    this.onChange(this.serialize());
  }

  serialize() {
    return {
      onboardingDone: this.done,
      onboardingStep: this.step,
    };
  }

  destroy() {
    this.off.forEach((unsubscribe) => unsubscribe());
    this.off = [];
    this.bus = null;
  }
}
