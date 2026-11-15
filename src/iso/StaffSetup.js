// Сборка подсистемы персонала (этап 15), чтобы сцена не разрасталась.
// С этапа 17 зарплату платит общий дневной цикл HospitalEconomy, поэтому
// собственный таймер StaffFlow в игре отключён (в тестах он остаётся рабочим).

import StaffFlow from './StaffFlow.js';
import StaffPoints from './StaffPoints.js';
import StaffRunner from './StaffRunner.js';

/**
 * @param {Phaser.Scene} scene
 * @param {import('./IsoWorld.js').default} world
 * @param {import('./PatientRunner.js').default} patients
 * @param {Array} savedStaff
 * @param {object|null} bus шина событий для заданий
 * @returns {{flow: StaffFlow, runner: StaffRunner}}
 */
export default function createStaff(scene, world, patients, savedStaff, bus = null) {
  const flow = new StaffFlow({
    world: new StaffPoints(world),
    patients: patients.flow,
    saved: savedStaff,
    timing: { salaryDayMs: Number.MAX_SAFE_INTEGER },
    getCoins: () => scene.stats.coins,
    spend: (n) => {
      if (typeof scene.stats.spend === 'function') {
        scene.stats.spend(n);
      } else {
        scene.stats.addCoins(-n);
      }
      if (scene.economy) {
        scene.economy.recordPurchase(n);
      }
    },
    penalty: (n, reason) => {
      scene.stats.changeReputation(-n);
      if (scene.economy && reason === 'dirt') {
        scene.economy.penalize('dirt');
      }
    },
    notify: (text) => scene.notify(text),
    onChange: () => scene.persist(),
    onEvent: (event) => {
      if (bus && event.type === 'hired') {
        bus.emit('staffHired', { roleId: event.agent.roleId, name: event.agent.name });
      }
    },
  });
  const runner = new StaffRunner(scene, flow, scene.actors);
  return { flow, runner };
}
