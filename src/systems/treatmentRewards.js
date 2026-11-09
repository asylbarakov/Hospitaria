import {
  STAR_REWARD_MULTIPLIER,
  STAR_REPUTATION,
  SKIP_REPUTATION_PENALTY,
  FAIL_REPUTATION_PENALTY,
} from '../data/treatmentConfig.js';

export function getTreatmentReward(disease, stars, skipped = false) {
  const safeStars = Math.max(0, Math.min(3, Math.floor(Number(stars) || 0)));

  if (skipped) {
    return {
      stars: 0,
      coins: 0,
      xp: 0,
      reputation: -SKIP_REPUTATION_PENALTY,
      skipped: true,
    };
  }

  if (safeStars === 0) {
    return {
      stars: 0,
      coins: 0,
      xp: 0,
      reputation: -FAIL_REPUTATION_PENALTY,
      skipped: false,
    };
  }

  const multiplier = STAR_REWARD_MULTIPLIER[safeStars] || 1;
  const base = disease && disease.reward ? disease.reward : { coins: 0, xp: 0 };

  return {
    stars: safeStars,
    coins: Math.round((base.coins || 0) * multiplier),
    xp: Math.round((base.xp || 0) * multiplier),
    reputation: STAR_REPUTATION[safeStars] || 0,
    skipped: false,
  };
}

export default getTreatmentReward;
