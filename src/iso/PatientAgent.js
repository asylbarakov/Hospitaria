// Конечный автомат пациента (этап 14). Без Phaser: состояние, терпение и таймеры.
// Движением управляет PatientFlow через навигатор, сюда приходит только событие arrived().

import {
  FLOW_STATES, PATIENT_FLOW, roomForDisease,
} from '../data/patientFlow.js';

const BEFORE_TREATMENT = new Set([
  FLOW_STATES.ENTERING,
  FLOW_STATES.TO_RECEPTION,
  FLOW_STATES.REGISTERING,
  FLOW_STATES.WAITING,
  FLOW_STATES.TO_ROOM,
]);

export default class PatientAgent {
  /**
   * @param {{id:number, name:string, disease:object, skin?:string,
   *   patience?:number, entrance:{x:number,y:number}, random?:Function}} options
   */
  constructor(options = {}) {
    this.id = options.id;
    this.name = options.name || 'Пациент';
    this.disease = options.disease || null;
    this.roomId = roomForDisease(this.disease);
    this.skin = options.skin || null;
    this.entrance = options.entrance || { x: 0, y: 0 };
    this.timing = { ...PATIENT_FLOW, ...(options.timing || {}) };

    const random = typeof options.random === 'function' ? options.random : Math.random;
    const min = this.timing.patienceMin;
    const max = this.timing.patienceMax;
    this.patienceMax = Number.isFinite(options.patience)
      ? options.patience
      : min + random() * (max - min);
    this.patience = this.patienceMax;

    this.state = FLOW_STATES.ENTERING;
    this.timer = 0;
    this.spot = null;
    this.seat = null;
    this.diagnosed = false;
    this.treating = false;
    this.paying = false;
    this.timeoutSent = false;
    this.misses = 0;
    this.removed = false;
  }

  /** Начать движение в точку; слот запоминается для освобождения. */
  goToReception(spot) {
    this.state = FLOW_STATES.TO_RECEPTION;
    this.spot = spot;
  }

  sit(spot) {
    this.state = FLOW_STATES.WAITING;
    this.seat = spot;
    this.spot = spot;
  }

  stand(spot) {
    this.state = FLOW_STATES.WAITING;
    this.seat = null;
    this.spot = spot;
  }

  goToRoom(spot) {
    this.state = FLOW_STATES.TO_ROOM;
    this.spot = spot;
  }

  goToPay(spot) {
    this.state = FLOW_STATES.TO_PAY;
    this.spot = spot;
    this.timer = 0;
    this.paying = false;
  }

  /** Уход к входу. angry=true сохраняет состояние leftAngry до исчезновения. */
  startLeaving(angry = false) {
    if (this.state === FLOW_STATES.GONE) {
      return;
    }
    this.state = angry ? FLOW_STATES.LEFT_ANGRY : FLOW_STATES.LEAVING;
    // entrance уже в непрерывных координатах (центр тайла входа).
    this.spot = {
      x: this.entrance.x,
      y: this.entrance.y,
    };
  }

  isWaiting() {
    return this.state === FLOW_STATES.WAITING;
  }

  isBeforeTreatment() {
    return BEFORE_TREATMENT.has(this.state);
  }

  /** Правильный диагноз запускает лечение. */
  startTreatment() {
    if (this.state !== FLOW_STATES.IN_TREATMENT || this.diagnosed) {
      return false;
    }
    this.diagnosed = true;
    this.treating = true;
    this.timer = this.timing.treatmentMs;
    return true;
  }

  /**
   * Прибытие к текущему слоту.
   * @returns {{type:string}|null} событие для PatientFlow
   */
  arrived() {
    switch (this.state) {
      case FLOW_STATES.TO_RECEPTION:
        this.state = FLOW_STATES.REGISTERING;
        this.timer = this.timing.registrationMs;
        return { type: 'registering' };
      case FLOW_STATES.TO_ROOM:
        this.state = FLOW_STATES.IN_TREATMENT;
        return { type: 'atTreatment' };
      case FLOW_STATES.TO_PAY:
        this.timer = this.timing.payMs;
        this.paying = true;
        return { type: 'atPay' };
      case FLOW_STATES.LEAVING:
      case FLOW_STATES.LEFT_ANGRY:
        this.state = FLOW_STATES.GONE;
        return { type: 'gone' };
      default:
        return null;
    }
  }

  /**
   * @param {number} dt миллисекунды
   * @returns {Array<{type:string}>} timeout | registered | treated | paid
   */
  update(dt) {
    const events = [];
    if (this.removed || this.state === FLOW_STATES.GONE) {
      return events;
    }

    if (this.isBeforeTreatment() && !this.timeoutSent) {
      this.patience -= dt;
      if (this.patience <= 0) {
        this.patience = 0;
        this.timeoutSent = true;
        events.push({ type: 'timeout' });
      }
    }

    if (this.state === FLOW_STATES.REGISTERING) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.state = FLOW_STATES.WAITING;
        events.push({ type: 'registered' });
      }
    } else if (this.state === FLOW_STATES.IN_TREATMENT && this.treating) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.treating = false;
        events.push({ type: 'treated' });
      }
    } else if (this.state === FLOW_STATES.TO_PAY && this.paying) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.paying = false;
        events.push({ type: 'paid' });
      }
    }

    return events;
  }

  patienceRatio() {
    if (this.patienceMax <= 0) {
      return 0;
    }
    return Math.max(0, Math.min(1, this.patience / this.patienceMax));
  }
}
