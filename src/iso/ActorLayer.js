import IsoActor from './IsoActor.js';

// Слой персонажей: создаёт актёров, регистрирует их в общем сортировщике мира
// как dynamic и убирает вместе со спрайтами.
export default class ActorLayer {
  /**
   * @param {Phaser.Scene} scene
   * @param {{sorter: import('./IsoDepth.js').default}} world
   */
  constructor(scene, world) {
    this.scene = scene;
    this.world = world;
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

  update(dt) {
    for (let i = 0; i < this.actors.length; i += 1) {
      const actor = this.actors[i];
      if (actor.update(dt)) {
        this.world.sorter.updateBox(actor.root, actor.box());
      }
    }
  }

  /** Аргумент для IsoWorld.updateWallFade: позиции и основания всех актёров. */
  fadeTargets() {
    return this.fadeList;
  }
}
