// Этап 18: запуск мини-игры из изометрии без знания о Phaser-сцене.
// Сцена передаёт focus/restore камеры и получает готовый результат приёма.
// В тесте вместо Phaser подставляется mock-сцена с launch/pause/resume.

import { treatmentPlanFor } from './treatmentRooms.js';

/** Приводит изометрического пациента к виду, который ждёт MiniGameScene. */
export function gamePatient(agent) {
  if (!agent) {
    return null;
  }
  const avatar = agent.avatar && agent.avatar.config ? agent.avatar : { config: {} };
  return {
    name: agent.name,
    disease: agent.disease,
    avatar,
  };
}

export default class TreatmentSession {
  /**
   * @param {{scene:object, focus?:Function, restore?:Function,
   *   onFinish?:Function, notify?:Function}} options
   *   focus(roomId, done) — наезд камеры; done() запускает игру.
   */
  constructor(options = {}) {
    this.scene = options.scene;
    this.focus = typeof options.focus === 'function'
      ? options.focus
      : (roomId, done) => done();
    this.restore = typeof options.restore === 'function' ? options.restore : () => {};
    this.onFinish = typeof options.onFinish === 'function' ? options.onFinish : () => {};
    this.notify = typeof options.notify === 'function' ? options.notify : () => {};
    this.active = null;
  }

  get isActive() {
    return !!this.active;
  }

  /** Начать приём: камера на комнату, затем MiniGameScene поверх больницы. */
  start(agent) {
    if (this.active) {
      return { ok: false, hint: 'Сначала завершите текущий приём' };
    }
    const plan = treatmentPlanFor(agent && agent.disease, agent && agent.roomId);
    if (!plan) {
      return { ok: false, hint: 'Для этой болезни пока нет мини-игры' };
    }
    this.active = { agent, plan };
    this.scene.modalOpen = true;
    this.focus(plan.roomId, () => this.launch());
    return { ok: true, plan };
  }

  launch() {
    if (!this.active) {
      return;
    }
    const { agent, plan } = this.active;
    this.scene.scene.launch('MiniGameScene', {
      patient: gamePatient(agent),
      gameKey: plan.game,
      roomId: plan.roomId,
      roomName: plan.roomName,
      onFinish: (result) => this.finish(result),
    });
    if (typeof this.scene.scene.bringToTop === 'function') {
      this.scene.scene.bringToTop('MiniGameScene');
    }
    this.scene.scene.pause('IsoHospitalHud');
    this.scene.scene.pause();
  }

  finish(result) {
    if (!this.active) {
      return;
    }
    const { agent } = this.active;
    this.active = null;
    this.scene.scene.resume('IsoHospitalHud');
    this.scene.scene.resume();
    this.restore();
    this.scene.modalOpen = false;
    this.onFinish(agent, result || { stars: 0 });
  }
}
