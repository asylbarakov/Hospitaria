// Экономика v2: монеты, репутация, опыт и кристаллы больницы.
// Уровни, расходы и зарплаты появятся на этапе 17; баланс хранится в data.

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
   * @param {{coins?:number, reputation?:number, experience?:number, crystals?:number,
   *   startCoins?:number, onChange?:Function}} options onChange вызывается после наград и штрафов
   */
  constructor(options = {}) {
    this.startCoins = Number.isFinite(options.startCoins) ? options.startCoins : 0;
    this.onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
    this._coins = 0;
    this._reputation = START_REPUTATION;
    this._experience = 0;
    this._crystals = 0;
    this.coins = options.coins;
    this.reputation = options.reputation;
    this.experience = options.experience;
    this.crystals = options.crystals;
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

  get experience() {
    return this._experience;
  }

  set experience(value) {
    this._experience = Math.max(0, Math.round(Number(value) || 0));
  }

  get crystals() {
    return this._crystals;
  }

  set crystals(value) {
    this._crystals = Math.max(0, Math.round(Number(value) || 0));
  }

  addCoins(amount) {
    this.coins = this._coins + (Number(amount) || 0);
    return this._coins;
  }

  addExperience(amount) {
    this.experience = this._experience + (Number(amount) || 0);
    return this._experience;
  }

  addCrystals(amount) {
    this.crystals = this._crystals + (Number(amount) || 0);
    return this._crystals;
  }

  /** Награда задания: монеты, опыт и кристаллы одним сохранением. */
  applyQuestReward(reward) {
    if (!reward) {
      return this.crystals;
    }
    this.addCoins(reward.coins);
    this.addExperience(reward.experience);
    this.addCrystals(reward.crystals);
    this.onChange();
    return this._crystals;
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
    this.experience = 0;
    this.crystals = 0;
  }
}
