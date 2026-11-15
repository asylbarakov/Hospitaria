// Данные для HUD изометрии (этапы 15–17), вынесены из сцены.

export default function buildHudState(scene) {
  const pointer = scene.input.activePointer;
  const stats = scene.stats || null;
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
    quests: scene.quests ? scene.quests.state() : null,
    message: scene.messages.length ? scene.messages[scene.messages.length - 1].text : '',
    zoom: scene.cameras.main.zoom,
    fps: Math.round(scene.game.loop.actualFps),
    tile: scene.pointerTile(pointer),
  };
}
