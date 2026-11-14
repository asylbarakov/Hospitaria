// Данные для HUD изометрии (этап 15), вынесены из сцены.

export default function buildHudState(scene) {
  const pointer = scene.input.activePointer;
  return {
    coins: scene.coins,
    reputation: scene.reputation,
    crystals: scene.stats ? scene.stats.crystals : 0,
    experience: scene.stats ? scene.stats.experience : 0,
    patients: scene.patients ? scene.patients.count() : 0,
    build: scene.build.state(),
    staff: scene.staff ? scene.staff.hudState() : null,
    quests: scene.quests ? scene.quests.state() : null,
    message: scene.messages.length ? scene.messages[scene.messages.length - 1].text : '',
    zoom: scene.cameras.main.zoom,
    fps: Math.round(scene.game.loop.actualFps),
    tile: scene.pointerTile(pointer),
  };
}
