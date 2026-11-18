// Данные для HUD изометрии (этапы 15–17), вынесены из сцены.

import { locationName } from './locator.js';

export default function buildHudState(scene) {
  const pointer = scene.input.activePointer;
  const stats = scene.stats || null;
  const actor = scene.playerActor;
  return {
    coins: scene.coins,
    reputation: scene.reputation,
    crystals: stats ? stats.crystals : 0,
    experience: stats ? stats.experience : 0,
    level: stats ? stats.level : 1,
    levelProgress: stats && typeof stats.progress === 'function' ? stats.progress() : null,
    debt: stats ? stats.debt || 0 : 0,
    economy: scene.economy ? scene.economy.state() : null,
    patients: scene.patients ? scene.patients.count() : 0,
    waiting: scene.patients && typeof scene.patients.waitingCount === 'function'
      ? scene.patients.waitingCount()
      : 0,
    build: scene.build.state(),
    staff: scene.staff ? scene.staff.hudState() : null,
    rooms: scene.roomLocks ? scene.roomLocks.serialize() : [],
    quests: scene.quests ? scene.quests.state() : null,
    message: scene.messages.length ? scene.messages[scene.messages.length - 1].text : '',
    zoom: scene.cameras.main.zoom,
    location: actor && actor.pos && scene.world ? locationName(scene.world.layout, actor.pos.x, actor.pos.y) : '',
    tile: scene.pointerTile(pointer),
  };
}
