// Занятость мест пациентов (этап 14): регистратура, кресла, кабинеты, касса.
// Чистая логика без Phaser; движение выполняет переданная функция navigate.

import { FLOW_STATES } from '../data/patientFlow.js';

function freeSlot(slots, busy, owner = null) {
  return (slots || []).find((slot) => !busy.has(slot.key) || busy.get(slot.key) === owner) || null;
}

export default class PatientSlots {
  /** @param {object} world адаптер мира; @param {Function} navigate */
  constructor(world, navigate) {
    this.world = world;
    this.navigate = navigate;
    this.seat = new Map();
    this.stand = new Map();
    this.reception = new Map();
    this.pay = new Map();
    this.treatment = new Map();
  }

  move(agent, slot) {
    if (!slot) {
      return null;
    }
    agent.travel = slot;
    this.navigate(agent, slot);
    return slot;
  }

  /** Свободное место у регистратуры, иначе сразу в очередь ожидания. */
  sendReception(agent) {
    const slot = freeSlot(this.world.receptionSlots(), this.reception, agent);
    if (slot) {
      this.reception.set(slot.key, agent);
      agent.goToReception(slot);
      return this.move(agent, slot);
    }
    return this.assignSeat(agent);
  }

  /** Посадить на кресло/диван, иначе поставить в холле. */
  assignSeat(agent) {
    if (!agent || agent.removed) {
      return null;
    }
    this.releaseSeat(agent);
    const seat = freeSlot(this.world.waitingSlots(), this.seat, agent);
    if (seat) {
      this.seat.set(seat.key, agent);
      agent.sit(seat);
      return this.move(agent, seat);
    }
    const stand = freeSlot(this.world.fallbackSlots(), this.stand, agent);
    if (stand) {
      this.stand.set(stand.key, agent);
      agent.stand(stand);
      return this.move(agent, stand);
    }
    const entrance = this.world.entrance();
    agent.stand(entrance);
    return this.move(agent, entrance);
  }

  /** Свободный предмет лечения в комнате; бронирует его за пациентом. */
  treatmentFor(roomId, agent) {
    const slot = freeSlot(this.world.treatmentSlots(roomId), this.treatment, agent);
    if (!slot) {
      return null;
    }
    this.treatment.set(slot.key, agent);
    return slot;
  }

  /** Касса: false означает «кассы нет, идите к выходу». */
  sendPay(agent) {
    const slot = freeSlot(this.world.paySlots(), this.pay, agent);
    if (!slot) {
      return false;
    }
    this.pay.set(slot.key, agent);
    agent.goToPay(slot);
    this.move(agent, slot);
    return true;
  }

  releaseFrom(map, agent) {
    for (const [key, owner] of map) {
      if (owner === agent) {
        map.delete(key);
      }
    }
  }

  releaseSeat(agent) {
    this.releaseFrom(this.seat, agent);
    this.releaseFrom(this.stand, agent);
    if (agent) {
      agent.seat = null;
    }
  }

  releaseReception(agent) {
    this.releaseFrom(this.reception, agent);
  }

  releaseTreatment(agent) {
    this.releaseFrom(this.treatment, agent);
  }

  /** Освободить всё, кроме брони кабинета (вызывается в PatientFlow.call). */
  releaseWaiting(agent) {
    this.releaseSeat(agent);
    this.releaseReception(agent);
    this.releaseFrom(this.pay, agent);
  }

  releaseAll(agent) {
    this.releaseSeat(agent);
    this.releaseFrom(this.reception, agent);
    this.releaseFrom(this.pay, agent);
    this.releaseFrom(this.treatment, agent);
  }

  slotExists(slots, key) {
    return (slots || []).some((slot) => slot.key === key);
  }

  /**
   * Мебель продали или поставили:
   * ожидающих пересаживаем, пациентов из кабинета без мебели уводим.
   */
  applyWorldChange(agents, onLeaveAngry) {
    const waiting = this.world.waitingSlots();
    const reception = this.world.receptionSlots();
    const pay = this.world.paySlots();
    this.prune(this.seat, waiting);
    this.prune(this.stand, this.world.fallbackSlots());
    this.prune(this.reception, reception);
    this.prune(this.pay, pay);

    (agents || []).slice().forEach((agent) => {
      if (agent.state === FLOW_STATES.TO_ROOM || agent.state === FLOW_STATES.IN_TREATMENT) {
        const ready = this.world.roomReady(agent.roomId);
        const roomSlots = this.world.treatmentSlots(agent.roomId);
        const slotOk = !agent.spot || this.slotExists(roomSlots, agent.spot.key);
        if (!ready || !ready.ok || !slotOk) {
          onLeaveAngry(agent, 'room');
        }
        return;
      }

      if (agent.state === FLOW_STATES.WAITING) {
        const ready = this.world.roomReady(agent.roomId);
        if (!ready || !ready.ok) {
          onLeaveAngry(agent, 'room');
          return;
        }
        const seatOk = agent.seat && this.slotExists(waiting, agent.seat.key);
        if (!seatOk) {
          this.assignSeat(agent);
        }
        return;
      }

      if (agent.state === FLOW_STATES.TO_RECEPTION) {
        if (!agent.spot || !this.slotExists(reception, agent.spot.key)) {
          this.sendReception(agent);
        }
        return;
      }

    });
  }

  prune(map, slots) {
    const keys = new Set((slots || []).map((slot) => slot.key));
    for (const key of [...map.keys()]) {
      if (!keys.has(key)) {
        map.delete(key);
      }
    }
  }

  clear() {
    [this.seat, this.stand, this.reception, this.pay, this.treatment].forEach((map) => map.clear());
  }
}
