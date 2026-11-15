// Экономика 2.0 (этап 17): часы, доход с чаевыми, расходы, штрафы и «Итоги дня».
// Чистая логика без Phaser. Суммы и пороги приходят из data/economy.js.
// Состояние читается через getState() (GameState), персонал — через getStaff(),
// мебель и комнаты — через getWorld(). Так модуль можно гонять в balance_sim.

import { ECONOMY, PENALTIES } from '../data/economy.js';
import {
  emptyDay, finishDay, normalizeDay, summaryOf, utilitiesOf,
} from './economyDay.js';

function count(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

export default class HospitalEconomy {
  /**
   * @param {{getState?:Function, getStaff?:Function, getWorld?:Function,
   *   notify?:Function, onChange?:Function, onDayEnd?:Function,
   *   timing?:object, saved?:object|null}} options
   */
  constructor(options = {}) {
    this.timing = { ...ECONOMY, ...(options.timing || {}) };
    this.timing.dayLengthMs = Math.max(1000, count(this.timing.dayLengthMs, ECONOMY.dayLengthMs));
    this.getState = options.getState || (() => null);
    this.getStaff = options.getStaff || (() => null);
    this.getWorld = options.getWorld || (() => null);
    this.notify = options.notify || (() => {});
    this.onChange = options.onChange || (() => {});
    this.onDayEnd = options.onDayEnd || (() => {});
    this.reset(options.saved || null);
  }

  reset(saved = null) {
    const data = saved && typeof saved === 'object' ? saved : {};
    this.day = Math.max(1, count(data.day, 1));
    this.dayTime = Math.min(
      this.timing.dayLengthMs - 1,
      count(data.dayTime),
    );
    this.today = normalizeDay(data.today, this.day);
    this.history = Array.isArray(data.history)
      ? data.history.slice(-7).map((entry) => ({ ...entry }))
      : [];
    this.lastSummary = this.history.length ? this.history[this.history.length - 1] : null;
  }

  serialize() {
    return {
      day: this.day,
      dayTime: this.dayTime,
      today: { ...this.today },
      history: this.history.slice(-7).map((entry) => ({ ...entry })),
    };
  }

  get dayLengthMs() {
    return this.timing.dayLengthMs;
  }

  timeLabel() {
    const progress = Math.max(0, Math.min(1, this.dayTime / this.dayLengthMs));
    const start = count(this.timing.clock.startMinutes, 8 * 60);
    const span = count(this.timing.clock.spanMinutes, 12 * 60);
    const total = start + progress * span;
    const hours = Math.floor(total / 60) % 24;
    const minutes = Math.floor(total % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  clock() {
    return {
      day: this.day,
      time: this.timeLabel(),
      label: `День ${this.day} · ${this.timeLabel()}`,
      ratio: Math.max(0, Math.min(1, this.dayTime / this.dayLengthMs)),
    };
  }

  state() {
    const state = this.getState();
    return {
      ...this.clock(),
      today: { ...this.today },
      debt: state ? count(state.debt) : 0,
      coins: state ? count(state.coins) : 0,
      history: this.history.slice(-3),
    };
  }

  /** @param {number} dt миллисекунды */
  update(dt) {
    const step = count(dt);
    if (!step) {
      return;
    }
    this.dayTime += step;
    while (this.dayTime >= this.dayLengthMs) {
      this.dayTime -= this.dayLengthMs;
      this.endDay();
    }
  }

  /** Следит за очередью: один штраф за день и дружелюбное предупреждение заранее. */
  noteQueue(amount) {
    const queue = count(amount);
    this.today.maxQueue = Math.max(this.today.maxQueue, queue);
    if (queue > this.timing.queueLimit && !this.today.overcrowded) {
      this.today.overcrowded = true;
      this.notify(`Очередь переполнена: в конце дня будет небольшой штраф (${this.timing.queuePenalty})`);
    }
  }

  reputationFactor() {
    const state = this.getState();
    const reputation = state ? Math.max(0, Math.min(100, Number(state.reputation) || 0)) : 50;
    const floor = Number(this.timing.tips.reputationFloor) || 0.5;
    return floor + (reputation / 100) * (1 - floor);
  }

  tipFor(base, agent) {
    const ratio = agent && typeof agent.patienceRatio === 'function'
      ? agent.patienceRatio()
      : 0.75;
    const floor = Number(this.timing.tips.speedFloor) || 0.6;
    const speed = floor + Math.max(0, Math.min(1, ratio)) * (1 - floor);
    const rate = Math.min(
      Number(this.timing.tips.maxRate) || 0.3,
      (Number(this.timing.tips.rate) || 0.15) * this.reputationFactor() * speed,
    );
    return Math.max(0, Math.round(base * rate));
  }

  /** Оплата лечения: базовая сумма + чаевые. Возвращает разбивку для всплывашки. */
  collectTreatment(reward, agent = null) {
    const state = this.getState();
    if (!state) {
      return { base: 0, tip: 0, total: 0 };
    }
    const base = Math.max(
      count(this.timing.minTreatmentIncome, 10),
      count(reward && reward.coins),
    );
    const tip = this.tipFor(base, agent);
    const total = base + tip;
    if (typeof state.earn === 'function') {
      state.earn(total);
    } else {
      state.addCoins(total);
    }
    this.today.income += total;
    this.today.treatmentIncome += base;
    this.today.tips += tip;
    this.today.treated += 1;
    this.today.supplies += Number(this.timing.suppliesPerTreatment) || 0;
    if (state.statistics) {
      state.statistics.patientsTreated += 1;
    }
    this.onChange();
    return { base, tip, total };
  }

  /** Штраф: деньги списываются мягко, основной удар по репутации делает сцена. */
  penalize(kind, agent = null) {
    const definition = PENALTIES[kind] || PENALTIES.waiting;
    const amount = count(definition.coins);
    const state = this.getState();
    if (state) {
      if (typeof state.spend === 'function') {
        state.spend(amount, { allowDebt: true });
      } else {
        state.addCoins(-amount);
      }
      if (state.statistics) {
        state.statistics.penalties += amount;
        if (kind === 'waiting') state.statistics.patientsAngry += 1;
        if (kind === 'diagnosis') state.statistics.wrongDiagnosis += 1;
      }
    }
    this.today.penalties += amount;
    this.today.penaltyCount += 1;
    if (kind === 'waiting') this.today.angry += 1;
    if (kind === 'diagnosis') this.today.wrongDiagnosis += 1;
    this.onChange();
    return amount;
  }

  /** Покупка мебели/найм: уже оплачена сценой, здесь только статистика дня. */
  recordPurchase(amount) {
    const value = count(amount);
    if (!value) {
      return 0;
    }
    this.today.purchases += value;
    this.onChange();
    return value;
  }

  recordSale(amount) {
    const value = count(amount);
    if (!value) {
      return 0;
    }
    this.today.sales += value;
    this.onChange();
    return value;
  }

  utilities() {
    return utilitiesOf(this);
  }

  summary() {
    return summaryOf(this);
  }

  /** Закрыть день: зарплаты, коммунальные, лекарства, штраф за очередь. */
  endDay() {
    return finishDay(this);
  }
}
