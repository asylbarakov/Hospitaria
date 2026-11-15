// Сохранение состояния изометрической сцены (этапы 16–17), чтобы сцена не разрасталась.
// Единое состояние (GameState) + мебель, игрок, персонал, задания и дневной цикл.

import { clearIsoSave, saveIso } from '../systems/IsoSave.js';

export function persistScene(scene) {
  const stats = scene.stats;
  saveIso(stats.coins, scene.world.serialize(), scene.playerCtl.player, {
    reputation: stats.reputation,
    experience: stats.experience,
    crystals: stats.crystals,
    debt: stats.debt,
    statistics: stats.statistics,
    rooms: scene.roomLocks ? scene.roomLocks.serialize() : undefined,
    economy: scene.economy ? scene.economy.serialize() : undefined,
    staff: scene.staff ? scene.staff.exportStaff() : undefined,
    quests: scene.quests ? scene.quests.serialize() : undefined,
    settings: scene.settings || undefined,
  });
}

export function resetSceneSave(scene) {
  clearIsoSave();
  scene.stats.reset();
  if (scene.economy) {
    scene.economy.reset();
  }
  if (scene.quests) {
    scene.quests.reset();
  }
  if (scene.roomLocks) {
    scene.roomLocks.reset();
  }
  saveIso(null, null, scene.playerCtl.player, {
    reputation: scene.stats.reputation,
    experience: 0,
    crystals: 0,
    debt: 0,
    statistics: scene.stats.statistics,
    economy: scene.economy ? scene.economy.serialize() : null,
    staff: [],
    quests: scene.quests ? scene.quests.serialize() : null,
    rooms: scene.roomLocks ? scene.roomLocks.serialize() : undefined,
    settings: scene.settings ? { ...scene.settings, onboardingDone: false, onboardingStep: 0 } : undefined,
  });
}
