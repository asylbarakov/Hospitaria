// Игрок в изометрии (этап 14): спавн, смена облика и ходьба по тапу.
// Вынесено из IsoHospitalScene, чтобы сцена оставалась про сборку подсистем.

import { accentById, normalizePlayer, roleById } from '../data/playerSkins.js';

export default class PlayerControl {
  /**
   * @param {{world: object, actors: object, stats: object, player: object,
   *   onChange?: Function}} options
   */
  constructor(options = {}) {
    this.world = options.world;
    this.actors = options.actors;
    this.stats = options.stats;
    this.player = normalizePlayer(options.player);
    this.onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
    this.actor = null;
  }

  /** Создаёт актёра во входе больницы. */
  spawn() {
    const role = roleById(this.player.role);
    this.actor = this.actors.spawn({
      kind: 'player',
      x: this.world.entrance.x + 0.5,
      y: this.world.entrance.y + 0.5,
      sprite: this.player.skin,
      name: this.player.name,
      icon: role.icon,
      accent: accentById(this.player.accent).color,
    });
    return this.actor;
  }

  /** Применяет облик и имя к уже созданному актёру. */
  refresh() {
    if (!this.actor) {
      return;
    }
    const role = roleById(this.player.role);
    this.actor.setSkin(this.player.skin);
    this.actor.setName(this.player.name);
    this.actor.setIcon(role.icon);
    this.actor.setAccent(accentById(this.player.accent).color);
  }

  /** Вызывается из «Гардероба»: новый облик, монеты после покупки, сохранение. */
  apply(player, coins) {
    this.player = normalizePlayer(player);
    if (Number.isFinite(coins)) {
      this.stats.coins = coins;
    }
    this.refresh();
    this.onChange();
  }

  walkTo(tile) {
    if (!this.actor || !tile) {
      return Promise.resolve(false);
    }
    return this.actors.moveTo(this.actor, tile.x, tile.y);
  }
}
