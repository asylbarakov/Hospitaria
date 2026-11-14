// Автоматизация персонала (этап 15): регистратор ускоряет очередь,
// врач/лаборант лечат, медсестра зовёт пациентов и помогает с приёмом.

import { FLOW_STATES } from '../data/patientFlow.js';

export default function automateStaff(flow, dt) {
  if (!flow.patients) {
    return;
  }
  const working = flow.agents.filter((agent) => agent.state === 'working');
  const reception = working.some((agent) => agent.role.service === 'reception');
  if (reception) {
    const boost = Math.max(1, flow.timing.receptionBoost) - 1;
    flow.patients.agents.forEach((patient) => {
      if (patient.state === FLOW_STATES.REGISTERING) {
        patient.timer = Math.max(0, patient.timer - dt * boost);
      }
    });
  }

  working.forEach((agent) => {
    if (!agent.post || (agent.role.service !== 'treat' && agent.role.service !== 'assist')) {
      return;
    }
    agent.autoTimer = Math.max(0, agent.autoTimer - dt);
    if (agent.autoTimer > 0) {
      return;
    }
    agent.autoTimer = flow.timing.autoDelayMs;
    if (agent.role.service === 'assist') {
      callPatient(flow, agent);
    }
    treatPatient(flow, agent);
  });
}

function callPatient(flow, agent) {
  const roomId = agent.post.roomId;
  if (!roomId) {
    return false;
  }
  const patient = flow.patients.agents.find((item) => item.state === FLOW_STATES.WAITING
    && item.roomId === roomId);
  return patient ? flow.patients.call(patient).ok : false;
}

function treatPatient(flow, agent) {
  const roomId = agent.post.roomId;
  if (!roomId) {
    return false;
  }
  const patient = flow.patients.agents.find((item) => item.state === FLOW_STATES.IN_TREATMENT
    && !item.diagnosed && item.roomId === roomId);
  if (!patient) {
    return false;
  }
  return flow.patients.diagnose(patient, true, agent.role.autoStars).ok;
}
