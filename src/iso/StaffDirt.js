// Пятна в больнице (этап 15): появление, штраф за грязь и работа уборщика.
// Чистая логика без Phaser; StaffFlow подключает её к зарплате и агентам.

export default class StaffDirt {
  constructor(options = {}) {
    this.world = options.world;
    this.timing = options.timing;
    this.random = options.random || Math.random;
    this.notify = options.notify || (() => {});
    this.penalty = options.penalty || (() => {});
    this.onEvent = options.onEvent || (() => {});
    this.spots = [];
    this.nextId = 1;
    this.timer = this.timing.dirtIntervalMs;
  }

  get count() {
    return this.spots.length;
  }

  spawn() {
    if (this.spots.length >= this.timing.dirtMax) {
      return null;
    }
    const tiles = this.world.dirtTiles() || [];
    const free = tiles.filter((tile) => !this.spots.some((spot) => spot.x === tile.x && spot.y === tile.y));
    if (!free.length) {
      return null;
    }
    const tile = free[Math.floor(this.random() * free.length)];
    const dirt = {
      id: this.nextId++,
      x: tile.x,
      y: tile.y,
      age: 0,
      penaltyTimer: this.timing.dirtPenaltyMs,
    };
    this.spots.push(dirt);
    this.onEvent({ type: 'dirtSpawned', dirt });
    return dirt;
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.timing.dirtIntervalMs;
      this.spawn();
    }
    this.spots.forEach((dirt) => {
      dirt.age += dt;
      if (dirt.age < this.timing.dirtGraceMs) {
        return;
      }
      // Считаем только время после «льготного» периода, иначе большой кадр
      // списывал бы штраф раньше срока.
      const overdue = Math.min(dt, dirt.age - this.timing.dirtGraceMs);
      dirt.penaltyTimer -= overdue;
      if (dirt.penaltyTimer <= 0) {
        dirt.penaltyTimer += this.timing.dirtPenaltyMs;
        this.penalty(this.timing.dirtPenalty);
        this.notify(`Пятна в холле: −${this.timing.dirtPenalty} репутации`);
      }
    });
  }

  /** Назначить свободные пятна уборщикам, по одному на каждого. */
  assign(agents) {
    const janitors = agents.filter((agent) => agent.role.service === 'clean');
    if (!janitors.length) {
      return;
    }
    const claimed = new Set(janitors.filter((agent) => agent.dirt).map((agent) => agent.dirt.id));
    janitors.forEach((agent) => {
      if (agent.dirt && !this.spots.some((spot) => spot.id === agent.dirt.id)) {
        agent.cancelDirt();
      }
      if (agent.dirt) {
        return;
      }
      const target = this.spots.find((spot) => !claimed.has(spot.id));
      if (target) {
        agent.sendToDirt(target);
        claimed.add(target.id);
      }
    });
  }

  finish(agent, dirt) {
    this.spots = this.spots.filter((spot) => spot.id !== dirt.id);
    this.onEvent({ type: 'cleaned', agent, dirt });
  }

  clear() {
    this.spots = [];
  }
}
