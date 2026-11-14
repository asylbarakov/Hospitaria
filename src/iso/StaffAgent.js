// Конечный автомат работника (этап 15). Без Phaser: пост, маршрут и уборка.
// Движением управляет StaffRunner, сюда приходят только arrived() и update().

export const STAFF_STATES = {
  IDLE: 'idle',
  GO_TO_POST: 'goToPost',
  WORKING: 'working',
  GO_TO_DIRT: 'goToDirt',
  CLEANING: 'cleaning',
};

export default class StaffAgent {
  /**
   * @param {{id:number, role:object, name:string, entrance:{x:number,y:number}}} options
   */
  constructor(options = {}) {
    this.id = options.id;
    this.role = options.role;
    this.roleId = options.role.id;
    this.name = options.name || 'Сотрудник';
    this.entrance = options.entrance || { x: 0, y: 0 };
    this.state = STAFF_STATES.IDLE;
    this.post = null;
    this.desiredPostId = Number.isFinite(options.postItemId) ? options.postItemId : null;
    this.dirt = null;
    this.spot = null;
    this.moveToken = 0;
    this.cleanMs = 0;
    this.cleanTimer = 0;
    this.autoTimer = 0;
    this.removed = false;
  }

  /** Пост найден или потерян. Смена поста перезапускает маршрут. */
  assignPost(post) {
    const same = this.post && post && this.post.key === post.key;
    this.post = post || null;
    this.desiredPostId = post && Number.isFinite(post.itemId) ? post.itemId : null;
    if (same) {
      return false;
    }
    if (this.dirt) {
      return false;
    }
    this.state = post ? STAFF_STATES.GO_TO_POST : STAFF_STATES.IDLE;
    this.spot = post ? { x: post.x, y: post.y } : this.spot;
    this.moveToken += 1;
    return true;
  }

  /** Работник без поста ждёт в свободном месте холла. */
  assignIdle(spot) {
    if (this.post || !spot || this.dirt) {
      return false;
    }
    if (this.spot && this.spot.x === spot.x && this.spot.y === spot.y) {
      return false;
    }
    this.state = STAFF_STATES.IDLE;
    this.spot = { x: spot.x, y: spot.y };
    this.moveToken += 1;
    return true;
  }

  sendToDirt(dirt) {
    this.dirt = dirt;
    this.state = STAFF_STATES.GO_TO_DIRT;
    this.spot = { x: dirt.x, y: dirt.y };
    this.moveToken += 1;
  }

  cancelDirt() {
    this.dirt = null;
    this.cleanTimer = 0;
    this.state = this.post ? STAFF_STATES.GO_TO_POST : STAFF_STATES.IDLE;
    this.spot = this.post ? { x: this.post.x, y: this.post.y } : this.spot;
    this.moveToken += 1;
  }

  /** Прибытие к посту или пятну. */
  arrived(cleanMs = 1200) {
    if (this.state === STAFF_STATES.GO_TO_POST) {
      this.state = STAFF_STATES.WORKING;
      this.autoTimer = 0;
      return { type: 'working' };
    }
    if (this.state === STAFF_STATES.GO_TO_DIRT) {
      this.state = STAFF_STATES.CLEANING;
      this.cleanMs = cleanMs;
      this.cleanTimer = cleanMs;
      return { type: 'cleaning' };
    }
    return null;
  }

  /** @param {number} dt миллисекунды @returns {object|null} вычищенное пятно */
  update(dt) {
    if (this.removed) {
      return null;
    }
    if (this.state === STAFF_STATES.CLEANING) {
      this.cleanTimer -= dt;
      if (this.cleanTimer <= 0) {
        const dirt = this.dirt;
        this.finishCleaning();
        return dirt;
      }
    }
    return null;
  }

  finishCleaning() {
    this.dirt = null;
    this.cleanTimer = 0;
    this.state = this.post ? STAFF_STATES.GO_TO_POST : STAFF_STATES.IDLE;
    this.spot = this.post ? { x: this.post.x, y: this.post.y } : this.spot;
    this.moveToken += 1;
  }

  isBusy() {
    return this.state === STAFF_STATES.GO_TO_POST
      || this.state === STAFF_STATES.GO_TO_DIRT
      || this.state === STAFF_STATES.CLEANING;
  }
}
