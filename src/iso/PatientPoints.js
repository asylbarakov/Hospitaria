// Точки интереса пациентов поверх изометрического мира (этап 14).
// Отдельный адаптер, чтобы IsoWorld не разрастался и не знал о логике пациентов.

import { FALLBACK_WAIT_TILES, roomHint } from '../data/patientFlow.js';
import {
  fallbackSlots, paySlots, receptionSlots, roomById, roomReady, standNear,
  treatmentSlots, waitingSlots,
} from './worldSlots.js';

export default class PatientPoints {
  /** @param {import('./IsoWorld.js').default} world */
  constructor(world) {
    this.world = world;
  }

  get grid() {
    return this.world.grid;
  }

  get rooms() {
    return this.world.layout.ROOMS;
  }

  items() {
    return this.world.items();
  }

  revision() {
    return this.grid.revision;
  }

  /** Центр тайла входа в непрерывных координатах. */
  entrance() {
    const tile = this.world.entrance;
    return { x: tile.x + 0.5, y: tile.y + 0.5 };
  }

  waitingSlots() {
    return waitingSlots(this.grid, this.items());
  }

  receptionSlots() {
    return receptionSlots(this.grid, this.items());
  }

  paySlots() {
    return paySlots(this.grid, this.items());
  }

  fallbackSlots() {
    return fallbackSlots(this.grid, FALLBACK_WAIT_TILES);
  }

  treatmentSlots(roomId) {
    return treatmentSlots(this.grid, this.items(), this.rooms, roomId);
  }

  /** {ok, hint}: есть ли в комнате мебель для лечения. */
  roomReady(roomId) {
    return {
      ok: roomReady(this.items(), this.rooms, roomId),
      hint: roomHint(roomId),
    };
  }

  roomName(roomId) {
    const room = roomById(this.rooms, roomId);
    return room ? room.name : 'Кабинет';
  }

  standNear(x, y) {
    return standNear(this.grid, x, y);
  }
}
