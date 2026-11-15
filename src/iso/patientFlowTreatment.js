import { FLOW_STATES } from '../data/patientFlow.js';
import { getTreatmentReward } from '../systems/treatmentRewards.js';
import { playerRewardFromResult } from '../systems/treatmentRooms.js';

// Диагноз и завершение лечения PatientFlow. Подмешивается в класс (Object.assign), this = PatientFlow.

const patientFlowTreatment = {
  /** Общая проверка ответа на диагноз. Неверный можно повторить. */
  resolveDiagnosis(agent, correct) {
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
    return { ok: true };
  },

  /** Верный диагноз сотрудника: лечение идёт по таймеру, без мини-игры. */
  diagnose(agent, correct, autoStars = null) {
    const result = this.resolveDiagnosis(agent, correct);
    if (!result.ok) {
      return result;
    }
    if (Number.isFinite(autoStars)) {
      agent.autoStars = autoStars;
    }
    agent.startTreatment();
    return { ok: true, auto: Number.isFinite(autoStars) };
  },

  /** Верный диагноз игрока: MiniGameScene запускается снаружи, таймер ждёт. */
  diagnoseForPlayer(agent, correct) {
    const result = this.resolveDiagnosis(agent, correct);
    if (!result.ok) {
      return result;
    }
    agent.markDiagnosed();
    return { ok: true, needsGame: true };
  },

  /**
   * Итог мини-игры игрока. reward уже посчитан MiniGameScene, чтобы экран
   * результата и реальное начисление совпадали (включая редкий кристалл).
   */
  finishPlayerTreatment(agent, result) {
    if (!agent || agent.removed || agent.state !== FLOW_STATES.IN_TREATMENT || !agent.diagnosed) {
      return { ok: false, hint: 'Приём уже завершён' };
    }
    if (Number.isFinite(agent.playerStars)) {
      return { ok: false, hint: 'Результат уже учтён' };
    }
    const stars = Math.max(0, Math.min(3, Math.floor(Number(result && result.stars) || 0)));
    agent.playerStars = stars;
    this.completeTreatment(agent, stars, playerRewardFromResult(result));
    return { ok: true, stars };
  },

  /** Общий финал приёма: освободить место, начислить награду, отправить к кассе. */
  completeTreatment(agent, stars, reward = null) {
    this.slots.releaseTreatment(agent);
    const safeStars = Math.max(0, Math.min(3, Math.floor(Number(stars) || 0)));
    const payout = reward || getTreatmentReward(agent.disease, safeStars, false, this.random);
    this.emit({ type: 'treated', agent, reward: payout });
    if (!this.slots.sendPay(agent)) {
      this.sendExit(agent);
    }
  },
};

export default patientFlowTreatment;
