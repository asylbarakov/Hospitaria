// Нормализация наград заданий.

export function count(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function rewardsOf(quest) {
  const reward = (quest && quest.reward) || {};
  return {
    coins: count(reward.coins),
    experience: count(reward.experience),
    crystals: count(reward.crystals),
  };
}
