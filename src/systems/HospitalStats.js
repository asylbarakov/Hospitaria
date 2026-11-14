// Экономика v2 на этапе 14: монеты и репутация больницы.
// Опыт, уровень, расходы и зарплаты появятся на этапе 17; баланс хранится в data.

export const START_REPUTATION = 50;
export const MAX_REPUTATION = 100;

function clampReputation(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return START_REPUTATION;
  }
  return Math.max(0, Math.min(MAX_REPUTATION, n));
}

export default class HospitalStats {
  /**
   * @param {{coins?:number, reputation?:number, startCoins?:number,
   *   onChange?:Function}} options onChange вызывается после наград и штрафов
   */
  constructor(options = {}) {
    this.startCoins = Number.isFinite(options.startCoins) ? options.startCoins : 0;
    this.onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
    this._coins = 0;
    this._reputation = START_REPUTATION;
    this.coins = options.coins;
    this.reputation = options.reputation;
  }

  get coins() {
    return this._coins;
  }

  set coins(value) {
    this._coins = Math.max(0, Math.round(Number(value) || 0));
  }

  get reputation() {
    return this._reputation;
  }

  set reputation(value) {
    this._reputation = clampReputation(value);
  }

  addCoins(amount) {
    this.coins = this._coins + (Number(amount) || 0);
    return this._coins;
  }

  /** Изменение репутации с ограничением 0..100; сразу сохраняет через onChange. */
  changeReputation(delta) {
    this.reputation = this._reputation + (Number(delta) || 0);
    this.onChange();
    return this._reputation;
  }

  /** Награда за лечение: монеты и репутация одним сохранением. */
  applyReward(reward) {
    if (!reward) {
      return this._reputation;
    }
    this.addCoins(reward.coins);
    this.reputation = this._reputation + (Number(reward.reputation) || 0);
    this.onChange();
    return this._reputation;
  }

  /** Сброс больницы: стартовые монеты и репутация, без сохранения (его делает сцена). */
  reset() {
    this.coins = this.startCoins;
    this.reputation = START_REPUTATION;
  }
}
