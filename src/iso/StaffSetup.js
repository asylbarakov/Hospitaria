// Сборка подсистемы персонала (этап 15), чтобы сцена не разрасталась.

import StaffFlow from './StaffFlow.js';
import StaffPoints from './StaffPoints.js';
import StaffRunner from './StaffRunner.js';

/**
 * @param {Phaser.Scene} scene
 * @param {import('./IsoWorld.js').default} world
 * @param {import('./PatientRunner.js').default} patients
 * @param {Array} savedStaff
 * @returns {{flow: StaffFlow, runner: StaffRunner}}
 */
export default function createStaff(scene, world, patients, savedStaff) {
  const flow = new StaffFlow({
    world: new StaffPoints(world),
    patients: patients.flow,
    saved: savedStaff,
    getCoins: () => scene.stats.coins,
    spend: (n) => scene.stats.addCoins(-n),
    penalty: (n) => scene.stats.changeReputation(-n),
    notify: (text) => scene.notify(text),
    onChange: () => scene.persist(),
  });
  const runner = new StaffRunner(scene, flow, scene.actors);
  return { flow, runner };
}
