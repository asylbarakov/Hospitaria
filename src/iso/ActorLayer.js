import IsoActor from './IsoActor.js';
import { PATH_CONFIG } from '../data/pathConfig.js';

// Слой персонажей: спавн, маршруты через Pathfinder, проход дверей по брони.
// Позиция актёра живёт в IsoActor, здесь только маршрут и ожидание на узком месте.

export default class ActorLayer {
  /**
   * @param {Phaser.Scene} scene
   * @param {{sorter: import('./IsoDepth.js').default, grid: object,
   *   isDoorTile:Function, isTileFree:Function, reserveTile:Function,
   *   releaseTile:Function, releaseActorTiles:Function, nowMs:Function}} world
   * @param {import('./Pathfinder.js').default|null} pathfinder
   */
  constructor(scene, world, pathfinder = null) {
    this.scene = scene;
    this.world = world;
    this.pathfinder = pathfinder;
    this.actors = [];
    this.fadeList = [];
  }

  spawn(options) {
    const actor = new IsoActor(this.scene, options);
    actor.depthItem = this.world.sorter.add(actor.root, actor.box(), { dynamic: true });
    const entry = { pos: actor.pos, box: actor.box(), screen: actor.screen };
    actor.fadeEntry = entry;
    this.actors.push(actor);
    this.fadeList.push(entry);
    return actor;
  }

  remove(actor) {
    const index = this.actors.indexOf(actor);
    if (index === -1) {
      return false;
    }
    actor.removed = true;
    actor.moveToken = (actor.moveToken || 0) + 1;
    this.releaseDoor(actor);
    if (this.world.releaseActorTiles) {
      this.world.releaseActorTiles(actor);
    }
    this.world.sorter.remove(actor.root);
    this.actors.splice(index, 1);
    const fadeIndex = this.fadeList.indexOf(actor.fadeEntry);
    if (fadeIndex !== -1) {
      this.fadeList.splice(fadeIndex, 1);
    }
    actor.destroy();
    return true;
  }

  clear() {
    while (this.actors.length) {
      this.remove(this.actors[this.actors.length - 1]);
    }
  }

  /**
   * Прокладывает маршрут и применяет его, если актёр не получил новую цель.
   * @returns {Promise<boolean>} дошёл ли маршрут до построения
   */
  moveTo(actor, x, y) {
    actor.goal = { x, y };
    actor.waitMs = 0;
    const token = (actor.moveToken || 0) + 1;
    actor.moveToken = token;
    const sx = Math.floor(actor.pos.x);
    const sy = Math.floor(actor.pos.y);
    if (!this.pathfinder) {
      const path = this.world.grid.findPath(sx, sy, x, y);
      if (path === null) {
        actor.goal = null;
        return Promise.resolve(false);
      }
      actor.setPath(path);
      return Promise.resolve(true);
    }
    return this.pathfinder.findPath(sx, sy, x, y).then((path) => {
      if (actor.removed || actor.moveToken !== token) {
        return true;
      }
      if (!path) {
        actor.goal = null;
        return false;
      }
      actor.setPath(path);
      return true;
    });
  }

  /** Перепрокладка к последней цели (после продажи/постановки мебели или ожидания). */
  replan(actor, now) {
    if (!actor.goal || actor.replanning || now < (actor.repathAt || 0)) {
      return;
    }
    actor.repathAt = now + PATH_CONFIG.repathDelayMs;
    actor.replanning = true;
    this.moveTo(actor, actor.goal.x, actor.goal.y)
      .catch(() => false)
      .then(() => { actor.replanning = false; });
  }

  releaseDoor(actor) {
    if (!actor.reservedTile) {
      return;
    }
    if (this.world.releaseTile) {
      this.world.releaseTile(actor.reservedTile.x, actor.reservedTile.y, actor);
    }
    actor.reservedTile = null;
  }

  now() {
    return this.world.nowMs ? this.world.nowMs() : 0;
  }

  isDoorTile(x, y) {
    return !!(this.world.isDoorTile && this.world.isDoorTile(x, y));
  }

  isTileFree(x, y, actor, now) {
    return !this.world.isTileFree || this.world.isTileFree(x, y, actor, now);
  }

  reserveTile(x, y, actor, now) {
    if (this.world.reserveTile) {
      this.world.reserveTile(x, y, actor, now);
    }
  }

  /** Проверяет следующий тайл: стена/мебель и чужая бронь двери. */
  checkStep(actor, now, dt) {
    const next = actor.path[0];
    if (!next) {
      this.releaseDoor(actor);
      return true;
    }
    if (this.world.grid && !this.world.grid.isWalkable(next.x, next.y)) {
      this.releaseDoor(actor);
      this.replan(actor, now);
      return false;
    }
    if (!this.isDoorTile(next.x, next.y)) {
      const door = actor.reservedTile;
      const onDoor = door && Math.floor(actor.pos.x) === door.x && Math.floor(actor.pos.y) === door.y;
      if (!onDoor) {
        this.releaseDoor(actor);
      }
      return true;
    }
    if (!this.isTileFree(next.x, next.y, actor, now)) {
      actor.waitMs = (actor.waitMs || 0) + dt * 1000;
      if (actor.waitMs < PATH_CONFIG.doorWaitMs) {
        return false;
      }
      actor.waitMs = 0;
      this.replan(actor, now);
      return false;
    }
    if (!actor.reservedTile || actor.reservedTile.x !== next.x || actor.reservedTile.y !== next.y) {
      this.releaseDoor(actor);
      this.reserveTile(next.x, next.y, actor, now);
      actor.reservedTile = { x: next.x, y: next.y, entered: false };
    }
    return true;
  }

  /** Отпускает бронь, когда актёр прошёл дверной тайл насквозь. */
  afterMove(actor) {
    const door = actor.reservedTile;
    if (!door) {
      return;
    }
    const onTile = Math.floor(actor.pos.x) === door.x && Math.floor(actor.pos.y) === door.y;
    if (onTile) {
      door.entered = true;
    }
    if (door.entered && !onTile) {
      this.releaseDoor(actor);
    }
  }

  update(dt, now = this.now()) {
    for (let i = 0; i < this.actors.length; i += 1) {
      const actor = this.actors[i];
      if (!this.checkStep(actor, now, dt) || !actor.update(dt)) {
        this.afterMove(actor);
        continue;
      }
      this.world.sorter.updateBox(actor.root, actor.box());
      this.afterMove(actor);
    }
  }

  /** Аргумент для IsoWorld.updateWallFade: позиции и основания всех актёров. */
  fadeTargets() {
    return this.fadeList;
  }
}
