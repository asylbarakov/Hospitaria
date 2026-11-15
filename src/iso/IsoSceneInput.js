// Обработка тапа по миру изометрии (этап 16): стройка, пациент, ходьба.
// Вынесено из сцены, чтобы IsoHospitalScene оставалась в пределах ~300 строк.

/** Esc закрывает верхний открытый слой: магазин, задания, персонал, диалог, стройку. */
export function handleSceneEscape(scene) {
  const hud = scene.hud;
  if (hud && hud.shopPanel && hud.shopPanel.visible) {
    hud.shopPanel.hide();
    return;
  }
  if (hud && hud.questPanel && hud.questPanel.visible) {
    hud.questPanel.hide();
    return;
  }
  if (hud && hud.staffPanel && hud.staffPanel.visible) {
    hud.staffPanel.hide();
    return;
  }
  if (scene.modalOpen && scene.patients) {
    scene.patients.closeDialog();
    return;
  }
  if (scene.build.active && scene.build.tool !== 'none') {
    scene.build.cancel();
  } else if (scene.build.active) {
    scene.build.setActive(false);
  } else {
    scene.exitToMenu();
  }
}

export default function handleSceneTap(scene, pointer) {
  if (scene.patientClickGuard) {
    scene.patientClickGuard = false;
    return;
  }
  if (scene.modalOpen || (scene.hud && scene.hud.isOverUi(pointer))) {
    return;
  }
  const tile = scene.pointerTile(pointer);
  if (scene.build.active) {
    scene.build.tap(tile, !!pointer.wasTouch);
    return;
  }
  if (scene.patients.tryTapTile(tile)) {
    return;
  }
  if (!scene.grid.isWalkable(tile.x, tile.y)) {
    scene.marker.flash(tile.x, tile.y, scene.time.now);
    return;
  }
  scene.playerCtl.walkTo(tile).then((ok) => {
    if (!ok) {
      scene.marker.flash(tile.x, tile.y, scene.time.now);
    }
  });
}
