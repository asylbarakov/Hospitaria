// Работники на сцене (этап 15): спрайты, маршруты к постам и пятна на полу.

import { STAFF_STATES } from './StaffAgent.js';
import { tileToScreen } from './IsoMath.js';

const DIRT_DEPTH = 100.6;

export default class StaffRunner {
  /**
   * @param {Phaser.Scene} scene
   * @param {import('./StaffFlow.js').default} flow
   * @param {import('./ActorLayer.js').default} actors
   */
  constructor(scene, flow, actors) {
    this.scene = scene;
    this.flow = flow;
    this.actors = actors;
    this.views = new Map();
    this.dirtGraphics = scene.add.graphics().setDepth(DIRT_DEPTH);
    this.sync();
  }

  /** Создаёт спрайты для новых сотрудников и убирает уволенных. */
  sync() {
    const alive = new Set(this.flow.agents);
    this.views.forEach((view, agent) => {
      if (!alive.has(agent)) {
        this.actors.remove(view.actor);
        this.views.delete(agent);
      }
    });
    this.flow.agents.forEach((agent) => {
      if (this.views.has(agent)) {
        return;
      }
      const spot = agent.spot || this.flow.world.entrance();
      const actor = this.actors.spawn({
        kind: 'staff',
        x: spot.x + 0.5,
        y: spot.y + 0.5,
        sprite: agent.role.sprite,
        name: agent.name,
        icon: agent.role.icon,
        accent: agent.role.color,
        speed: agent.role.speed,
      });
      this.views.set(agent, { actor, moveToken: -1, arrived: false });
    });
  }

  update() {
    this.sync();
    this.views.forEach((view, agent) => {
      if (!agent.spot) {
        return;
      }
      if (agent.moveToken !== view.moveToken) {
        view.moveToken = agent.moveToken;
        view.arrived = false;
        this.actors.moveTo(view.actor, agent.spot.x, agent.spot.y);
      }
      if (view.arrived || !this.isTravelling(agent)) {
        return;
      }
      const actor = view.actor;
      const nearX = Math.abs(actor.pos.x - (agent.spot.x + 0.5)) < 0.08;
      const nearY = Math.abs(actor.pos.y - (agent.spot.y + 0.5)) < 0.08;
      if (nearX && nearY && !actor.moving && actor.path.length === 0) {
        view.arrived = true;
        this.flow.arrived(agent);
      }
    });
    this.drawDirt();
  }

  isTravelling(agent) {
    return agent.state === STAFF_STATES.GO_TO_POST || agent.state === STAFF_STATES.GO_TO_DIRT;
  }

  drawDirt() {
    const g = this.dirtGraphics;
    g.clear();
    this.flow.dirt.forEach((dirt) => {
      const p = tileToScreen(dirt.x + 0.5, dirt.y + 0.5);
      g.fillStyle(0x5a4632, 0.55);
      g.fillEllipse(p.x, p.y, 30, 13);
      g.fillStyle(0x3e2f22, 0.45);
      g.fillCircle(p.x - 7, p.y - 2, 5);
      g.fillCircle(p.x + 6, p.y + 1, 4);
      g.fillCircle(p.x + 1, p.y - 5, 3);
    });
  }

  destroy() {
    this.views.forEach((view) => this.actors.remove(view.actor));
    this.views.clear();
    if (this.dirtGraphics) {
      this.dirtGraphics.destroy();
      this.dirtGraphics = null;
    }
  }
}
