import Save from './Save.js';
import { addExperience, maxPatientsForLevel } from './Economy.js';
import { claimTask } from './DailyTasks.js';
import {
  purchaseItem,
  equipItem,
  refreshFurniture,
} from './ShopActions.js';

const FONT = 'Arial, "Segoe UI", sans-serif';

export function addSceneCoins(scene, amount) {
  const value = Math.max(0, Math.round(Number(amount) || 0));
  const next = Math.max(0, (Number(scene.registry.get('coins')) || 0) + value);
  scene.registry.set('coins', next);
  persistSceneStats(scene);
  return next;
}

export function addSceneXp(scene, amount) {
  const state = {
    xp: Number(scene.registry.get('xp')) || 0,
    level: Number(scene.registry.get('level')) || 1,
  };
  const next = addExperience(state, amount);

  scene.registry.set('xp', next.xp);
  scene.registry.set('level', next.level);
  persistSceneStats(scene);

  if (next.levelsGained > 0) {
    showLevelUp(scene, next.level);
  }
  return next;
}

export function showLevelUp(scene, level) {
  const text = scene.add
    .text(
      scene.playerX,
      scene.avatar.baseY - 430,
      `Уровень ${level}! Пациентов: ${maxPatientsForLevel(level)}`,
      {
        fontFamily: FONT,
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#2e7d32',
        stroke: '#ffffff',
        strokeThickness: 6,
      },
    )
    .setOrigin(0.5)
    .setDepth(30);

  scene.tweens.add({
    targets: text,
    y: text.y - 60,
    alpha: 0,
    duration: 1700,
    ease: 'Quad.easeOut',
    onComplete: () => text.destroy(),
  });
}

export function persistSceneStats(scene) {
  if (!scene.saveData) {
    return;
  }

  scene.saveData.coins = Number(scene.registry.get('coins')) || 0;
  scene.saveData.xp = Number(scene.registry.get('xp')) || 0;
  scene.saveData.level = Number(scene.registry.get('level')) || 1;
  scene.saveData.reputation = Number(scene.registry.get('reputation')) || 0;
  scene.saveData.ownedItems = scene.saveData.ownedItems || [];
  scene.saveData.furniture = scene.saveData.furniture || [];
  Save.save(scene.saveData);
}

export function buyItem(scene, item) {
  return purchaseItem(scene, item);
}

export function equipPlayerItem(scene, item) {
  return equipItem(scene, item);
}

export function redrawSceneFurniture(scene) {
  refreshFurniture(scene);
}

export function claimDailyReward(scene, taskId) {
  const reward = claimTask(scene.saveData, taskId);
  if (reward > 0) {
    addSceneCoins(scene, reward);
    persistSceneStats(scene);
  }
  return reward;
}
