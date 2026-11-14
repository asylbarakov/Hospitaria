// Менеджер цикла пациентов (этап 14): спавн, очередь, лечение и оплата.
// Чистая логика без Phaser: мир передаётся адаптером, движение — функцией navigate.
// Адаптер мира: revision(), entrance(), waitingSlots(), receptionSlots(),
// paySlots(), fallbackSlots(), treatmentSlots(roomId), roomReady(roomId).

import PatientAgent from './PatientAgent.js';
import PatientSlots from './PatientSlots.js';
import { getRandomDisease } from '../data/diseases.js';
import { PATIENT_NAMES } from '../data/patientConfig.js';
import { FLOW_STATES, PATIENT_FLOW, roomHint } from '../data/patientFlow.js';
import { getTreatmentReward } from '../systems/treatmentRewards.js';

function pick(list, random) {
  return list[Math.floor(random() * list.length)];
}

export default class PatientFlow {
  /**
   * @param {{world:object, navigate?:Function, onEvent?:Function,
   *   random?:Function, timing?:object, maxPatients?:number,
   *   maxSpawned?:number, skinPool?:string[]}} options
   */
  constructor(options = {}) {
    this.world = options.world;
    this.navigate = typeof options.navigate === 'function' ? options.navigate : () => {};
    this.onEvent = typeof options.onEvent === 'function' ? options.onEvent : () => {};
    this.random = typeof options.random === 'function' ? options.random : Math.random;
    this.timing = { ...PATIENT_FLOW, ...(options.timing || {}) };
    this.maxPatients = Number.isFinite(options.maxPatients)
      ? options.maxPatients
      : this.timing.maxPatients;
    // Предел на весь прогон: нужен тестам и будущим сменам; в игре не ограничен.
    this.maxSpawned = Number.isFinite(options.maxSpawned) ? options.maxSpawned : Infinity;
    this.skinPool = Array.isArray(options.skinPool) && options.skinPool.length
      ? options.skinPool
      : [null];

    this.agents = [];
    this.spawned = 0;
    this.nextId = 1;
    this.spawnTimer = this.timing.firstSpawnDelay;
    this.revision = -1;
    this.slots = new PatientSlots(this.world, (agent, point) => this.move(agent, point));
  }

  emit(event) {
    this.onEvent(event);
  }

  move(agent, point) {
    if (!point) {
      return;
    }
    agent.travel = point;
    this.navigate(agent, point);
  }

  /** Продажа/постановка мебели: пересадить ожидающих, увести из пустых кабинетов. */
  applyWorldChange() {
    this.revision = this.world.revision();
    this.slots.applyWorldChange(this.agents, (agent, reason) => this.leaveAngry(agent, reason));
  }

  /** @param {number} dt миллисекунды */
  update(dt) {
    if (this.world.revision() !== this.revision) {
      this.applyWorldChange();
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      if (this.agents.length < this.maxPatients && this.spawned < this.maxSpawned) {
        this.spawn();
        this.spawnTimer = this.timing.spawnIntervalMin
          + this.random() * (this.timing.spawnIntervalMax - this.timing.spawnIntervalMin);
      } else {
        this.spawnTimer = 2000;
      }
    }

    this.agents.slice().forEach((agent) => {
      const events = agent.update(dt);
      events.forEach((event) => this.handleAgentEvent(agent, event));
    });
  }

  spawn(forcedDisease = null) {
    if (this.agents.length >= this.maxPatients || this.spawned >= this.maxSpawned) {
      return null;
    }
    const disease = forcedDisease || getRandomDisease(this.random);
    const agent = new PatientAgent({
      id: this.nextId,
      name: pick(PATIENT_NAMES, this.random),
      disease,
      skin: pick(this.skinPool, this.random),
      entrance: this.world.entrance(),
      random: this.random,
      timing: this.timing,
    });
    this.nextId += 1;
    this.spawned += 1;
    this.agents.push(agent);
    this.emit({ type: 'spawned', agent });
    this.slots.sendReception(agent);
    return agent;
  }

  /** Игрок позвал пациента: комната готова и есть свободное место лечения. */
  call(agent) {
    if (!agent || agent.removed) {
      return { ok: false, hint: 'Пациент уже ушёл' };
    }
    if (agent.state !== FLOW_STATES.WAITING) {
      return {
        ok: false,
        hint: agent.state === FLOW_STATES.IN_TREATMENT
          ? 'Пациент уже в кабинете'
          : 'Пациент ещё не готов к приёму',
      };
    }

    const ready = this.world.roomReady(agent.roomId);
    if (!ready || !ready.ok) {
      return { ok: false, hint: (ready && ready.hint) || roomHint(agent.roomId) };
    }
    const slot = this.slots.treatmentFor(agent.roomId, agent);
    if (!slot) {
      return { ok: false, hint: 'В кабинете сейчас занято, подождите' };
    }

    this.slots.releaseWaiting(agent);
    agent.goToRoom(slot);
    this.move(agent, slot);
    return { ok: true, slot };
  }

  /** Ответ на диагноз. Неверный можно повторить: пациент остаётся в кабинете. */
  diagnose(agent, correct) {
    if (!agent || agent.state !== FLOW_STATES.IN_TREATMENT) {
      return { ok: false, hint: 'Пациент ещё не в кабинете' };
    }
    if (agent.diagnosed) {
      return { ok: false, hint: 'Приём уже идёт' };
    }
    if (!correct) {
      agent.misses += 1;
      this.emit({
        type: 'wrongDiagnosis',
        agent,
        penalty: this.timing.wrongDiagnosisPenalty,
      });
      return { ok: false, hint: 'Неверный диагноз, попробуйте ещё раз' };
    }
    agent.startTreatment();
    return { ok: true };
  }

  arrived(agent) {
    const event = agent.arrived();
    if (!event) {
      return;
    }
    if (event.type === 'atTreatment') {
      this.emit({ type: 'atTreatment', agent });
    } else if (event.type === 'gone') {
      this.finish(agent);
    }
  }

  handleAgentEvent(agent, event) {
    switch (event.type) {
      case 'timeout':
        this.leaveAngry(agent, 'patience');
        break;
      case 'registered':
        this.slots.releaseReception(agent);
        this.slots.assignSeat(agent);
        break;
      case 'treated': {
        this.slots.releaseTreatment(agent);
        const reward = getTreatmentReward(agent.disease, this.timing.treatmentStars);
        this.emit({ type: 'treated', agent, reward });
        if (!this.slots.sendPay(agent)) {
          this.sendExit(agent);
        }
        break;
      }
      case 'paid':
        this.sendExit(agent);
        break;
      default:
        break;
    }
  }

  sendExit(agent) {
    this.slots.releaseAll(agent);
    agent.startLeaving(agent.state === FLOW_STATES.LEFT_ANGRY);
    this.move(agent, agent.spot);
  }

  leaveAngry(agent, reason = 'patience') {
    if (!agent || agent.removed) {
      return;
    }
    if ([FLOW_STATES.LEAVING, FLOW_STATES.LEFT_ANGRY, FLOW_STATES.GONE].includes(agent.state)) {
      return;
    }
    this.slots.releaseAll(agent);
    agent.startLeaving(true);
    this.move(agent, agent.spot);
    this.emit({
      type: 'angry',
      agent,
      reason,
      penalty: this.timing.patiencePenalty,
    });
  }

  finish(agent) {
    if (agent.removed) {
      return;
    }
    this.slots.releaseAll(agent);
    agent.removed = true;
    const index = this.agents.indexOf(agent);
    if (index !== -1) {
      this.agents.splice(index, 1);
    }
    this.emit({ type: 'gone', agent });
  }

  count() {
    return this.agents.length;
  }

  destroy() {
    this.agents.forEach((agent) => {
      agent.removed = true;
    });
    this.agents = [];
    this.slots.clear();
  }
}
