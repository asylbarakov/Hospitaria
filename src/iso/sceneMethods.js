// Кабинеты, гардероб и очистка сцены IsoHospitalScene. Подмешивается в класс
// (Object.assign в сцене), this = сцена.

import { normalizeSettings } from '../systems/Settings.js';
import { setVolume } from '../systems/Sound.js';

const sceneMethods = {
  isRoomUnlocked(roomId) {
    return this.roomLocks.isUnlocked(roomId);
  },

  /** Настройки из окна HUD: звук, сетка и упрощённая графика применяются сразу. */
  applySettings(next) {
    this.settings = normalizeSettings(next);
    setVolume(this.settings.volume);
    if (this.world) {
      this.world.setGridVisible(this.settings.grid);
      this.world.setWallFadeEnabled(!this.settings.simpleGraphics);
    }
    this.persist();
    return this.settings;
  },

  roomAtTile(tile) {
    return tile ? this.world.roomForTile(tile.x, tile.y) : null;
  },

  /** Открывает кабинет: списывает валюты, снимает замок и сообщает заданиям. */
  unlockRoom(roomId) {
    const result = this.roomLocks.unlock(roomId, this.stats);
    if (!result.ok) {
      return result;
    }
    this.world.setRoomUnlocked(roomId);
    this.patients.changed();
    if (this.staff) {
      this.staff.refreshPosts(true);
    }
    this.notify(`Кабинет «${result.entry.title}» открыт`);
    this.persist();
    return result;
  },

  openWardrobe() {
    if (this.wardrobeOpen) {
      return;
    }
    this.wardrobeOpen = true;
    this.scene.launch('IsoWardrobeScene');
    this.scene.pause('IsoHospitalHud');
    this.scene.pause();
  },

  closeWardrobe() {
    this.wardrobeOpen = false;
    this.scene.resume('IsoHospitalHud');
    this.scene.resume();
  },

  cleanup() {
    if (this.pathfinder) {
      this.pathfinder.dispose();
    }
    if (this.patients) {
      this.patients.destroy();
    }
    if (this.staffRunner) {
      this.staffRunner.destroy();
    }
    if (this.staff) {
      this.staff.destroy();
    }
    if (this.quests) {
      this.quests.destroy();
    }
    if (this.bus) {
      this.bus.clear();
    }
    if (this.actors) {
      this.actors.clear();
    }
    if (this.iso) {
      this.iso.destroy();
    }
    if (this.load && this.onLoadProgress) this.load.off('progress', this.onLoadProgress);
    for (const key of ['R', 'B', 'G', 'ESC']) this.input.keyboard.off(`keydown-${key}`);
    this.scene.stop('IsoHospitalHud');
  },
};

export default sceneMethods;
