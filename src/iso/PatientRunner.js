// Пациенты на сцене изометрии (этап 14): PatientFlow, IsoActor, шкала и диалог.
import PatientFlow from './PatientFlow.js';
import PatientDialog from './PatientDialog.js';
import PatientPoints from './PatientPoints.js';
import PatientViews from './PatientViews.js';
import { PATIENT_SKINS } from '../data/actorConfig.js';
import { FLOW_STATES } from '../data/patientFlow.js';

const TALK_DISTANCE = 2.4;
const TAP_RADIUS = 1.4;
export default class PatientRunner {
  /**
   * @param {Phaser.Scene} scene
   * @param {import('./IsoWorld.js').default} world
   * @param {import('./ActorLayer.js').default} actors
   * @param {import('./IsoActor.js').default} playerActor
   * @param {{notify?:Function, reward?:Function, penalty?:Function,
   *   event?:Function}} hooks
   */
  constructor(scene, world, actors, playerActor, hooks = {}) {
    this.scene = scene;
    this.actors = actors;
    this.player = playerActor;
    this.points = new PatientPoints(world);
    this.hooks = {
      notify: hooks.notify || (() => {}),
      reward: hooks.reward || (() => {}),
      penalty: hooks.penalty || (() => {}),
      event: hooks.event || (() => {}),
      isRoomUnlocked: hooks.isRoomUnlocked || (() => true),
    };
    this.views = new PatientViews(scene, actors, (agent) => this.tapAgent(agent));
    this.dialog = new PatientDialog(scene, this.points);
    this.talkCooldownUntil = 0;

    this.flow = new PatientFlow({
      world: this.points,
      skinPool: PATIENT_SKINS,
      navigate: (agent, point) => this.sendMove(agent, point),
      onEvent: (event) => this.onEvent(event),
      isRoomUnlocked: (roomId) => this.hooks.isRoomUnlocked(roomId),
    });
  }

  // ---- события менеджера -------------------------------------------------------------

  onEvent(event) {
    switch (event.type) {
      case 'spawned':
        this.views.create(event.agent, this.points.entrance());
        break;
      case 'treated': {
        const payout = this.hooks.reward(event.reward, event.agent) || {};
        const total = Number.isFinite(payout.total) ? payout.total : event.reward.coins;
        const tip = Number.isFinite(payout.tip) ? payout.tip : 0;
        this.views.float(event.agent, `+${total}`, '#ffe082');
        this.hooks.notify(`Пациент ${event.agent.name} вылечен: +${total} монет${tip ? ` (чаевые ${tip})` : ''}`);
        this.hooks.event('patientTreated', {
          diseaseId: event.agent.disease ? event.agent.disease.id : null,
          stars: event.reward.stars,
          coins: total,
          tip,
          xp: event.reward.xp,
          auto: Number.isFinite(event.agent.autoStars),
        });
        this.hooks.event('coinsEarned', {
          amount: total,
          source: 'treatment',
        });
        break;
      }
      case 'angry': {
        const money = this.hooks.penalty(event.penalty, event.agent, 'waiting') || 0;
        this.hooks.event('patientLeftAngry', { reason: event.reason });
        this.views.float(event.agent, `−${event.penalty}`, '#ff8a80');
        this.hooks.notify(event.reason === 'room'
          ? `${event.agent.name} ушёл: в кабинете нет нужной мебели`
          : `${event.agent.name} ушёл недовольным: −${event.penalty} репутации${money ? `, −${money} монет` : ''}`);
        break;
      }
      case 'wrongDiagnosis': {
        const money = this.hooks.penalty(event.penalty, event.agent, 'diagnosis') || 0;
        this.hooks.notify(`Неверный диагноз: −${event.penalty} репутации${money ? `, −${money} монет` : ''}`);
        break;
      }
      case 'gone':
        this.closeDialogFor(event.agent);
        this.views.destroy(event.agent);
        break;
      default:
        break;
    }
  }

  closeDialogFor(agent) {
    if (this.dialog.agent === agent) {
      this.dialog.close();
    }
  }

  // ---- движение ----------------------------------------------------------------------

  sendMove(agent, point) {
    const view = this.views.get(agent);
    if (!view || !point) {
      return;
    }
    agent.travelReady = false;
    agent.navRetryAt = 0;
    const token = (agent.navToken || 0) + 1;
    agent.navToken = token;

    // Маршрут может не построиться (мебель перекрыла проход). Повторяем пару раз,
    // затем пропускаем шаг, чтобы пациент не завис навсегда.
    const failed = () => {
      if (agent.removed || agent.navToken !== token) {
        return;
      }
      agent.navTries = (agent.navTries || 0) + 1;
      if (agent.navTries >= 3) {
        agent.navTries = 0;
        agent.travelReady = true;
        return;
      }
      agent.navRetryAt = this.now() + 900;
    };

    this.actors.moveTo(view.actor, point.x, point.y)
      .then((ok) => {
        if (agent.removed || agent.navToken !== token) {
          return;
        }
        if (ok) {
          agent.navTries = 0;
          agent.travelReady = true;
          return;
        }
        failed();
      })
      .catch(failed);
  }

  // ---- цикл --------------------------------------------------------------------------

  update(dt, time) {
    this.flow.update(dt);
    const now = Number.isFinite(time) ? time : this.now();

    this.flow.agents.slice().forEach((agent) => {
      const view = this.views.get(agent);
      if (!view) {
        return;
      }
      if (agent.travel && !agent.travelReady && agent.navRetryAt && now >= agent.navRetryAt) {
        this.sendMove(agent, agent.travel);
      }
      if (agent.travel && agent.travelReady && view.actor.path.length === 0 && !view.actor.moving) {
        agent.travel = null;
        agent.travelReady = false;
        this.flow.arrived(agent);
      }
      this.views.updateBar(agent);
    });

    this.maybeTalk(now);
  }

  /** Диалог открывается, когда игрок подошёл к пациенту в кабинете. */
  maybeTalk(time) {
    if (this.dialog.isOpen || time < this.talkCooldownUntil) {
      return;
    }
    const player = this.player.pos;
    let best = null;
    let bestDist = TALK_DISTANCE;
    this.flow.agents.forEach((agent) => {
      if (agent.state !== FLOW_STATES.IN_TREATMENT || agent.diagnosed) {
        return;
      }
      const view = this.views.get(agent);
      if (!view) {
        return;
      }
      const dist = Math.hypot(player.x - view.actor.pos.x, player.y - view.actor.pos.y);
      if (dist < bestDist) {
        best = agent;
        bestDist = dist;
      }
    });
    if (best) {
      this.openDiagnosis(best, time);
    }
  }

  openDiagnosis(agent, time) {
    if (this.dialog.isOpen || agent.diagnosed) {
      return;
    }
    this.talkCooldownUntil = time + 2200;
    this.dialog.open(
      agent,
      (disease) => this.chooseDiagnosis(agent, disease),
      () => { this.talkCooldownUntil = this.now() + 1200; },
    );
  }

  chooseDiagnosis(agent, disease) {
    const result = this.flow.diagnose(agent, disease.id === agent.disease.id);
    if (!result.ok && result.hint) {
      this.hooks.notify(result.hint);
    }
  }

  closeDialog() {
    this.dialog.close();
  }

  // ---- ввод --------------------------------------------------------------------------

  /** Тап по тайлу: если рядом пациент, начинаем приём вместо ходьбы. */
  tryTapTile(tile) {
    const agent = this.agentNear(tile.x + 0.5, tile.y + 0.5, TAP_RADIUS);
    return agent ? this.tapAgent(agent) : false;
  }

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
  }

  tapAgent(agent) {
    if (agent.state === FLOW_STATES.WAITING) {
      const result = this.flow.call(agent);
      if (!result.ok) {
        this.hooks.notify(result.hint || 'Пациент пока не готов');
        return true;
      }
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
  }

  walkPlayerNear(point) {
    if (!point) {
      return;
    }
    const tile = this.points.standNear(point.x, point.y);
    if (tile) {
      this.actors.moveTo(this.player, tile.x, tile.y);
    }
  }

  // ---- служебное ---------------------------------------------------------------------

  now() {
    return this.scene.time && Number.isFinite(this.scene.time.now) ? this.scene.time.now : 0;
  }

  changed() {
    this.flow.applyWorldChange();
  }

  count() {
    return this.flow.count();
  }

  waitingCount() {
    return this.flow.agents.filter((agent) => agent.state === FLOW_STATES.WAITING).length;
  }

  destroy() {
    this.closeDialog();
    this.views.clear();
    this.flow.destroy();
  }
}
