// Сохранение состояния изометрической сцены (этап 16), чтобы сцена не разрасталась.

import { clearIsoSave, saveIso } from '../systems/IsoSave.js';

export function persistScene(scene) {
  saveIso(scene.stats.coins, scene.world.serialize(), scene.playerCtl.player, {
    reputation: scene.stats.reputation,
    experience: scene.stats.experience,
    crystals: scene.stats.crystals,
    staff: scene.staff ? scene.staff.exportStaff() : undefined,
    quests: scene.quests ? scene.quests.serialize() : undefined,
  });
}

export function resetSceneSave(scene) {
  clearIsoSave();
  scene.stats.reset();
  if (scene.quests) {
    scene.quests.reset();
  }
  saveIso(null, null, scene.playerCtl.player, {
    reputation: scene.stats.reputation,
    experience: 0,
    crystals: 0,
    staff: [],
    quests: scene.quests ? scene.quests.serialize() : null,
  });
}
