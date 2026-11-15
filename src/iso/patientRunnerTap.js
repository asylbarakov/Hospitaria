// Тапы по пациентам и подход игрока (этап 19). Вынесено из PatientRunner,
// чтобы файл с логикой приёма оставался короче 300 строк.

import { FLOW_STATES } from '../data/patientFlow.js';

const TAP_RADIUS = 1.4;

const patientRunnerTap = {
  /** Тап по тайлу: если рядом пациент, начинаем приём вместо ходьбы. */
  tryTapTile(tile) {
    const agent = this.agentNear(tile.x + 0.5, tile.y + 0.5, TAP_RADIUS);
    return agent ? this.tapAgent(agent) : false;
  },

  agentNear(x, y, radius) {
    let best = null;
    let bestDist = radius;
    this.flow.agents.forEach((agent) => {
      if (agent.state === FLOW_STATES.LEAVING || agent.state === FLOW_STATES.LEFT_ANGRY) {
        return;
      }
      const view = this.views.get(agent);
      if (!view) {
        return;
      }
      const dist = Math.hypot(x - view.actor.pos.x, y - view.actor.pos.y);
      if (dist < bestDist) {
        best = agent;
        bestDist = dist;
      }
    });
    return best;
  },

  tapAgent(agent) {
    if (agent.state === FLOW_STATES.WAITING) {
      const result = this.flow.call(agent);
      if (!result.ok) {
        this.hooks.notify(result.hint || 'Пациент пока не готов');
        return true;
      }
      this.hooks.event('patientGreeted', {
        name: agent.name,
        diseaseId: agent.disease ? agent.disease.id : null,
      });
      this.walkPlayerNear(result.slot);
      return true;
    }
    if (agent.state === FLOW_STATES.TO_ROOM || agent.state === FLOW_STATES.IN_TREATMENT) {
      this.walkPlayerNear(agent.spot);
      return true;
    }
    if (agent.state === FLOW_STATES.TO_RECEPTION || agent.state === FLOW_STATES.REGISTERING) {
      this.hooks.notify('Пациент идёт к регистратуре');
      return true;
    }
    return false;
  },

  walkPlayerNear(point) {
    if (!point) {
      return;
    }
    const tile = this.points.standNear(point.x, point.y);
    if (tile) {
      this.actors.moveTo(this.player, tile.x, tile.y);
    }
  },
};

export default patientRunnerTap;
