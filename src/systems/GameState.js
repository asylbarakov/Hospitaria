// Единое состояние больницы (этап 17): монеты, долг, опыт, уровень, репутация,
// кристаллы и статистика. Вокруг него IsoSave хранит мебель, персонажа, персонал,
// задания и дневной цикл. Схема сохранения версионируется отдельным полем schema.

import HospitalStats from './HospitalStats.js';
import { levelFromExperience } from '../data/progression.js';
import { ECONOMY, SCHEMA_VERSION } from '../data/economy.js';

function count(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

export function normalizeStatistics(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  return {
    patientsTreated: count(data.patientsTreated),
    patientsAngry: count(data.patientsAngry),
    wrongDiagnosis: count(data.wrongDiagnosis),
    coinsEarned: count(data.coinsEarned),
    coinsSpent: count(data.coinsSpent),
    penalties: count(data.penalties),
    daysPlayed: count(data.daysPlayed),
  };
}

export default class GameState extends HospitalStats {
  /**
   * @param {{coins?:number, reputation?:number, experience?:number, crystals?:number,
   *   debt?:number, debtLimit?:number, statistics?:object, startCoins?:number,
   *   onChange?:Function, onLevelUp?:Function}} options
   */
  constructor(options = {}) {
    super(options);
    this.debt = count(options.debt);
    this.debtLimit = count(options.debtLimit, ECONOMY.debtLimit) || ECONOMY.debtLimit;
    this.statistics = normalizeStatistics(options.statistics);
    this.onLevelUp = typeof options.onLevelUp === 'function' ? options.onLevelUp : () => {};
  }

  get level() {
    return levelFromExperience(this.experience).level;
  }

  /** { level, into, need, ratio } для полоски опыта в HUD. */
  progress() {
    return levelFromExperience(this.experience);
  }

  /** Опыт с уведомлением о каждом новом уровне. */
  addExperience(amount) {
    const before = this.level;
    const result = super.addExperience(amount);
    const after = this.level;
    for (let level = before + 1; level <= after; level += 1) {
      this.onLevelUp(level);
    }
    return result;
  }

  /** Доход сначала закрывает долг, остаток идёт в монеты. */
  earn(amount) {
    const value = count(amount);
    if (!value) {
      return this._coins;
    }
    const toDebt = Math.min(this.debt, value);
    this.debt -= toDebt;
    const rest = value - toDebt;
    if (rest > 0) {
      this.coins = this._coins + rest;
    }
    this.statistics.coinsEarned += value;
    this.onChange();
    return this._coins;
  }

  /**
   * Расход. coins никогда не уходит ниже нуля: нехватка становится явным долгом
   * (если allowDebt) либо просто не списывается. За debtLimit отвечает кредит доверия.
   */
  spend(amount, options = {}) {
    const total = count(amount);
    if (!total) {
      return { paid: 0, debt: 0, forgiven: 0, total: 0 };
    }
    const paid = Math.min(this._coins, total);
    if (paid > 0) {
      this.coins = this._coins - paid;
    }
    let missing = total - paid;
    let addedDebt = 0;
    let forgiven = 0;
    if (missing > 0) {
      if (options.allowDebt) {
        const room = Math.max(0, this.debtLimit - this.debt);
        addedDebt = Math.min(room, missing);
        this.debt += addedDebt;
        forgiven = missing - addedDebt;
      } else {
        forgiven = missing;
      }
    }
    this.statistics.coinsSpent += paid + addedDebt;
    if (forgiven > 0) {
      this.statistics.forgiven = count(this.statistics.forgiven) + forgiven;
    }
    this.onChange();
    return { paid, debt: addedDebt, forgiven, total };
  }

  reset() {
    super.reset();
    this.debt = 0;
    this.statistics = normalizeStatistics();
  }

  serialize(extra = {}) {
    return {
      schema: SCHEMA_VERSION,
      coins: this.coins,
      debt: this.debt,
      reputation: this.reputation,
      experience: this.experience,
      crystals: this.crystals,
      statistics: { ...this.statistics },
      ...extra,
    };
  }

  /** Читает и старую схему 1, и текущую 2. Неизвестные поля просто игнорируются. */
  static deserialize(raw, options = {}) {
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    return new GameState({
      ...options,
      coins: Number.isFinite(raw.coins) ? raw.coins : options.coins,
      reputation: Number.isFinite(raw.reputation) ? raw.reputation : options.reputation,
      experience: Number.isFinite(raw.experience) ? raw.experience : options.experience,
      crystals: Number.isFinite(raw.crystals) ? raw.crystals : options.crystals,
      debt: Number.isFinite(raw.debt) ? raw.debt : options.debt,
      statistics: raw.statistics || options.statistics,
    });
  }
}

export { SCHEMA_VERSION };
