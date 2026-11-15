// Сборка экономики 2.0 (этап 17) вокруг сцены: GameState + HospitalEconomy.
// Здесь же хуки лечения и штрафов, чтобы IsoHospitalScene не разрасталась.

import GameState from '../systems/GameState.js';
import HospitalEconomy from '../systems/HospitalEconomy.js';
import { START_COINS } from '../data/buildCatalog.js';
import { crystalsForLevel, unlockText } from '../data/economy.js';

/**
 * @param {Phaser.Scene} scene
 * @param {object|null} saved результат loadIsoSave
 * @returns {{stats:GameState, economy:HospitalEconomy, reward:Function, penalty:Function}}
 */
export default function createEconomy(scene, saved) {
  const stats = new GameState({
    coins: saved && saved.coins !== null ? saved.coins : START_COINS,
    reputation: saved && Number.isFinite(saved.reputation) ? saved.reputation : undefined,
    experience: saved && Number.isFinite(saved.experience) ? saved.experience : undefined,
    crystals: saved && Number.isFinite(saved.crystals) ? saved.crystals : undefined,
    debt: saved && Number.isFinite(saved.debt) ? saved.debt : undefined,
    statistics: saved ? saved.statistics : undefined,
    startCoins: START_COINS,
    onChange: () => scene.persist(),
    onLevelUp: (level, reward) => {
      const bonus = unlockText(level);
      const crystals = reward && reward.crystals ? ` +${reward.crystals} кристалла.` : '';
      scene.notify(`Уровень ${level}!${crystals}${bonus ? ` Открыто: ${bonus}` : ' Новые товары в магазине.'}`);
      if (scene.bus) {
        scene.bus.emit('levelUp', { level, crystals: reward ? reward.crystals : 0 });
      }
      scene.persist();
    },
  });

  const economy = new HospitalEconomy({
    saved: saved ? saved.economy : null,
    getState: () => stats,
    getStaff: () => scene.staff,
    getWorld: () => scene.world,
    notify: (text) => scene.notify(text),
    onChange: () => scene.persist(),
    onDayEnd: (summary) => {
      const net = summary.net >= 0 ? `+${summary.net}` : `${summary.net}`;
      scene.notify(`Итоги дня ${summary.day}: ${net} монет`);
      if (scene.hud && typeof scene.hud.showDaySummary === 'function') {
        scene.hud.showDaySummary(summary);
      }
      scene.persist();
    },
  });

  // Лечение: опыт и репутацию начисляет GameState, монеты и чаевые — экономика.
  const reward = (rewardData, agent) => {
    stats.applyReward({
      coins: 0,
      xp: rewardData ? rewardData.xp : 0,
      crystals: rewardData ? rewardData.crystals : 0,
      reputation: rewardData ? rewardData.reputation : 0,
    });
    return economy.collectTreatment(rewardData, agent);
  };

  // Уход пациента и ошибка диагноза: репутация в сцене, небольшой штраф в экономике.
  const penalty = (amount, agent, kind) => {
    stats.changeReputation(-(Number(amount) || 0));
    return economy.penalize(kind === 'diagnosis' ? 'diagnosis' : 'waiting', agent);
  };

  return { stats, economy, reward, penalty };
}
