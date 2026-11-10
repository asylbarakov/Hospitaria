import { MINIGAME_KEYS } from '../data/treatmentConfig.js';
import { recordTreatment } from './DailyTasks.js';
import { playCoin, playSuccess, playError } from './Sound.js';
import { spawnRewardBurst } from '../ui/particles.js';

export function startMiniGame(scene, patient, forcedGameKey = null) {
  if (!patient) {
    return;
  }

  const gameKey = forcedGameKey && MINIGAME_KEYS.includes(forcedGameKey)
    ? forcedGameKey
    : MINIGAME_KEYS[scene.treatmentCount % MINIGAME_KEYS.length];
  scene.treatmentCount += 1;

  scene.targetX = scene.playerX;
  scene.avatar.stopWalking();
  scene.registry.set('uiModal', true);

  scene.scene.launch('MiniGameScene', {
    patient,
    gameKey,
    onFinish: (result) => finishMiniGame(scene, patient, result),
  });

  if (scene.scene.isActive('UIScene')) {
    scene.scene.pause('UIScene');
  }
  scene.scene.pause('HospitalScene');
}

export function finishMiniGame(scene, patient, result) {
  scene.scene.resume('HospitalScene');
  if (scene.scene.isPaused('UIScene')) {
    scene.scene.resume('UIScene');
  }
  scene.registry.set('uiModal', false);

  const reward = result || {};
  if (reward.coins) {
    scene.addCoins(reward.coins);
  }
  if (reward.xp) {
    scene.addXp(reward.xp);
  }
  if (reward.reputation) {
    scene.changeReputation(reward.reputation);
    if (reward.reputation < 0 && scene.patients) {
      scene.patients.showPenalty(patient.x, Math.abs(reward.reputation));
    }
  }

  recordTreatment(scene.saveData, reward);
  scene.persistStats();

  if (reward.coins > 0) {
    playCoin();
  }
  if (reward.stars >= 2) {
    playSuccess();
  } else if (reward.stars <= 0) {
    playError();
  }
  if (reward.stars > 0 && patient) {
    spawnRewardBurst(scene, patient.x, patient.avatar.baseY - 220, 18);
  }

  if (scene.patients) {
    scene.patients.dismissPatient(patient);
  }
}

export default startMiniGame;
