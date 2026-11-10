import { ACHIEVEMENTS } from '../data/achievements.js';
import Save from './Save.js';
import { playCoin } from './Sound.js';

const FONT = 'Arial, "Segoe UI", sans-serif';
let checking = false;

function toCount(value) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

export function createStats() {
  return {
    healed: 0,
    stars: 0,
    perfect: 0,
    coinsEarned: 0,
  };
}

export function ensureAchievements(saveData) {
  if (!saveData || typeof saveData !== 'object') {
    return null;
  }

  saveData.achievements = Array.isArray(saveData.achievements)
    ? saveData.achievements.filter((id) => typeof id === 'string')
    : [];

  saveData.collection = Array.isArray(saveData.collection)
    ? saveData.collection.filter((id) => typeof id === 'string')
    : [];

  const stats = saveData.stats && typeof saveData.stats === 'object'
    ? saveData.stats
    : {};

  saveData.stats = {
    healed: toCount(stats.healed),
    stars: toCount(stats.stars),
    perfect: toCount(stats.perfect),
    coinsEarned: toCount(stats.coinsEarned),
  };

  return saveData.stats;
}

export function achievementProgress(saveData, achievement) {
  if (!saveData || !achievement) {
    return 0;
  }

  const stats = ensureAchievements(saveData);
  if (!stats) {
    return 0;
  }

  switch (achievement.stat) {
    case 'level':
      return toCount(saveData.level);
    case 'reputation':
      return toCount(saveData.reputation);
    case 'collection':
      return saveData.collection.length;
    case 'wardrobe':
      return Array.isArray(saveData.ownedItems) ? saveData.ownedItems.length : 0;
    case 'furniture':
      return Array.isArray(saveData.furniture) ? saveData.furniture.length : 0;
    default:
      return toCount(stats[achievement.stat]);
  }
}

export function isAchievementUnlocked(saveData, achievementId) {
  return !!saveData
    && Array.isArray(saveData.achievements)
    && saveData.achievements.includes(achievementId);
}

export function recordTreatmentStats(saveData, disease, reward) {
  const stats = ensureAchievements(saveData);
  if (!stats) {
    return;
  }

  const stars = Math.max(0, Math.min(3, Math.floor(Number(reward && reward.stars) || 0)));
  if (stars <= 0) {
    return;
  }

  stats.healed += 1;
  stats.stars += stars;
  stats.coinsEarned += toCount(reward.coins);
  if (stars >= 3) {
    stats.perfect += 1;
  }

  const id = disease && disease.id;
  if (id && !saveData.collection.includes(id)) {
    saveData.collection.push(id);
  }
}

function showAchievementToast(scene, achievement, index) {
  if (!scene || !scene.add) {
    return;
  }

  const label = scene.add
    .text(
      640,
      110 + index * 56,
      `Достижение: ${achievement.title}   +${achievement.reward} монет`,
      {
        fontFamily: FONT,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#2e4a52',
        backgroundColor: '#fff4d6',
        padding: { x: 20, y: 12 },
      },
    )
    .setOrigin(0.5)
    .setDepth(90);

  label.setStroke('#efd48a', 3);

  scene.tweens.add({
    targets: label,
    alpha: 0,
    y: label.y - 36,
    delay: 1700,
    duration: 700,
    ease: 'Quad.easeOut',
    onComplete: () => label.destroy(),
  });
}

export function checkAchievements(scene, toastScene = scene, silent = false) {
  if (!scene || !scene.saveData || checking) {
    return [];
  }

  checking = true;
  const saveData = scene.saveData;
  ensureAchievements(saveData);

  const newly = [];
  ACHIEVEMENTS.forEach((achievement) => {
    if (saveData.achievements.includes(achievement.id)) {
      return;
    }
    if (achievementProgress(saveData, achievement) >= achievement.target) {
      saveData.achievements.push(achievement.id);
      newly.push(achievement);
    }
  });

  if (newly.length > 0) {
    const bonus = newly.reduce((sum, item) => sum + item.reward, 0);
    const coins = Math.max(0, Number(scene.registry.get('coins')) || 0) + bonus;

    scene.registry.set('coins', coins);
    saveData.coins = coins;
    Save.save(saveData);

    if (!silent) {
      playCoin();
      newly.forEach((achievement, index) => {
        showAchievementToast(toastScene, achievement, index);
      });
    }
  }

  checking = false;
  return newly;
}

export default checkAchievements;
