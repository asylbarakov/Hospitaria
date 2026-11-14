import * as layout from '../data/layout.js';
import { START_COINS } from '../data/buildCatalog.js';
import { ACTOR_ICONS } from '../data/actorConfig.js';
import { DEFAULT_PLAYER } from '../data/playerSkins.js';
import IsoWorld from '../iso/IsoWorld.js';
import IsoCamera from '../iso/IsoCamera.js';
import BuildMode from '../iso/BuildMode.js';
import ActorLayer from '../iso/ActorLayer.js';
import Pathfinder from '../iso/Pathfinder.js';
import PatientRunner from '../iso/PatientRunner.js';
import PlayerControl from '../iso/PlayerControl.js';
import TapMarker from '../iso/TapMarker.js';
import { queueIsoAssets, queueWallAssets } from '../iso/isoAssets.js';
import {
  screenToTileIndex, tileCenter, worldBounds,
} from '../iso/IsoMath.js';
import HospitalStats, { START_REPUTATION } from '../systems/HospitalStats.js';
import { clearIsoSave, loadIsoSave, saveIso } from '../systems/IsoSave.js';

// Этап 13: изометрическая больница. Мир из layout.js, режим строительства,
// игрок и пациенты через IsoActor/ActorLayer, поиск пути Pathfinder (EasyStar/BFS).

const ICON_FILES = ACTOR_ICONS.map((name) => `icons/${name}.png`);
const UI_FILES = ['ui/ui_bar.png', 'ui/ui_bar_fill.png'];

export default class IsoHospitalScene extends Phaser.Scene {
  constructor() {
    super('IsoHospitalScene');
  }

  preload() {
    const label = this.add
      .text(640, 360, 'Загрузка больницы…', { fontFamily: 'Arial, sans-serif', fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5);
    this.onLoadProgress = (v) => label.setText(`Загрузка больницы… ${Math.round(v * 100)}%`);
    this.load.on('progress', this.onLoadProgress);
    queueIsoAssets(this, ICON_FILES.concat(UI_FILES));
    queueWallAssets(this);
  }

  create() {
    this.children.list.filter((o) => o.type === 'Text').forEach((o) => o.destroy());
    this.cameras.main.setBackgroundColor('#10222e');

    const saved = loadIsoSave();
    this.stats = new HospitalStats({
      coins: saved && saved.coins !== null ? saved.coins : START_COINS,
      reputation: saved && Number.isFinite(saved.reputation) ? saved.reputation : START_REPUTATION,
      startCoins: START_COINS,
      onChange: () => this.persist(),
    });
    const rawPlayer = saved && saved.player ? saved.player : { ...DEFAULT_PLAYER, name: 'Доктор' };
    this.wardrobeOpen = false;
    this.modalOpen = false;
    this.patientClickGuard = false;

    this.world = new IsoWorld(this, layout, saved ? saved.items : null);
    this.grid = this.world.grid;
    this.messages = [];
    this.pathfinder = new Pathfinder(this.grid);
    this.actors = new ActorLayer(this, this.world, this.pathfinder);

    this.playerCtl = new PlayerControl({
      world: this.world,
      actors: this.actors,
      stats: this.stats,
      player: rawPlayer,
      onChange: () => this.persist(),
    });
    this.playerCtl.spawn();
    this.patients = new PatientRunner(this, this.world, this.actors, this.playerCtl.actor, {
      notify: (text) => this.notify(text),
      reward: (reward) => this.stats.applyReward(reward),
      penalty: (amount) => this.stats.changeReputation(-amount),
    });
    this.marker = new TapMarker(this);

    this.build = new BuildMode(this, this.world, {
      getCoins: () => this.stats.coins,
      spend: (n) => this.stats.addCoins(-n),
      earn: (n) => this.stats.addCoins(n),
      onChange: () => { this.persist(); this.patients.changed(); },
      notify: (text) => this.notify(text),
    });

    this.iso = new IsoCamera(this, {
      bounds: worldBounds(layout.MAP.cols, layout.MAP.rows, 420),
      minZoom: 0.3,
      maxZoom: 2,
      margin: 160,
      onTap: (pointer) => this.handleTap(pointer),
      canStartDrag: (pointer) => !this.hud || !this.hud.isOverUi(pointer),
    });
    const start = tileCenter(layout.ENTRANCE.x, layout.ENTRANCE.y - 8);
    this.iso.setZoom(0.75);
    this.iso.centerOn(start.x, start.y);

    this.input.keyboard.on('keydown-R', () => this.build.rotate());
    this.input.keyboard.on('keydown-B', () => this.toggleBuild());
    this.input.keyboard.on('keydown-G', () => this.openWardrobe());
    this.input.keyboard.on('keydown-ESC', () => this.onEscape());

    this.scene.launch('IsoHospitalHud');
    this.hud = this.scene.get('IsoHospitalHud');
    this.events.once('shutdown', () => this.cleanup());
  }

  // ---- игрок и экономика -------------------------------------------------------------

  get coins() {
    return this.stats.coins;
  }

  set coins(value) {
    this.stats.coins = value;
  }

  get reputation() {
    return this.stats.reputation;
  }

  get player() {
    return this.playerCtl ? this.playerCtl.player : null;
  }

  get playerActor() {
    return this.playerCtl ? this.playerCtl.actor : null;
  }

  /** Вызывается из «Гардероба»: применяет новый облик и монеты, затем сохраняет. */
  applyPlayer(player, coins) {
    this.playerCtl.apply(player, coins);
  }

  openWardrobe() {
    if (this.wardrobeOpen) {
      return;
    }
    this.wardrobeOpen = true;
    this.scene.launch('IsoWardrobeScene');
    this.scene.pause('IsoHospitalHud');
    this.scene.pause();
  }

  closeWardrobe() {
    this.wardrobeOpen = false;
    this.scene.resume('IsoHospitalHud');
    this.scene.resume();
  }

  // ---- ввод --------------------------------------------------------------------------

  pointerTile(pointer) {
    const w = this.iso.screenToWorld(pointer.x, pointer.y);
    return screenToTileIndex(w.x, w.y);
  }

  handleTap(pointer) {
    if (this.patientClickGuard) {
      this.patientClickGuard = false;
      return;
    }
    if (this.modalOpen || (this.hud && this.hud.isOverUi(pointer))) {
      return;
    }
    const tile = this.pointerTile(pointer);
    if (this.build.active) {
      this.build.tap(tile, !!pointer.wasTouch);
      return;
    }
    if (this.patients.tryTapTile(tile)) {
      return;
    }
    if (!this.grid.isWalkable(tile.x, tile.y)) {
      this.marker.flash(tile.x, tile.y, this.time.now);
      return;
    }
    this.playerCtl.walkTo(tile).then((ok) => {
      if (!ok) {
        this.marker.flash(tile.x, tile.y, this.time.now);
      }
    });
  }

  toggleBuild() {
    this.build.setActive(!this.build.active);
  }

  onEscape() {
    if (this.modalOpen && this.patients) {
      this.patients.closeDialog();
      return;
    }
    if (this.build.active && this.build.tool !== 'none') {
      this.build.cancel();
    } else if (this.build.active) {
      this.build.setActive(false);
    } else {
      this.exitToMenu();
    }
  }

  // ---- служебное ---------------------------------------------------------------------

  notify(text) {
    this.messages.push({ text, until: this.time.now + 2200 });
  }

  persist() {
    saveIso(this.stats.coins, this.world.serialize(), this.playerCtl.player, {
      reputation: this.stats.reputation,
    });
  }

  resetHospital() {
    clearIsoSave();
    this.stats.reset();
    saveIso(null, null, this.playerCtl.player, { reputation: this.stats.reputation });
    this.scene.stop('IsoHospitalHud');
    this.scene.restart();
  }

  exitToMenu() {
    this.scene.stop('IsoHospitalHud');
    this.scene.start('MenuScene');
  }

  cleanup() {
    if (this.pathfinder) {
      this.pathfinder.dispose();
    }
    if (this.patients) {
      this.patients.destroy();
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
  }

  // ---- цикл --------------------------------------------------------------------------

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.pathfinder.update();
    if (this.patients) {
      this.patients.update(dt * 1000, time);
    }
    this.actors.update(dt, time);

    const pointer = this.input.activePointer;
    const inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= this.scale.width && pointer.y <= this.scale.height;
    const overUi = this.hud && this.hud.isOverUi(pointer);
    const tile = this.pointerTile(pointer);
    if (this.build.active && inside && !overUi && !pointer.wasTouch) {
      this.build.hover(tile);
    }
    this.build.update();
    this.marker.update(time);

    this.world.sorter.sort();
    this.world.updateWallFade(this.actors.fadeTargets());
    if (this.messages.length && this.messages[0].until <= time) {
      this.messages = this.messages.filter((m) => m.until > time);
    }
  }

  /** Данные для HUD. */
  hudState() {
    const pointer = this.input.activePointer;
    return {
      coins: this.coins,
      reputation: this.reputation,
      patients: this.patients ? this.patients.count() : 0,
      build: this.build.state(),
      message: this.messages.length ? this.messages[this.messages.length - 1].text : '',
      zoom: this.cameras.main.zoom,
      fps: Math.round(this.game.loop.actualFps),
      tile: this.pointerTile(pointer),
    };
  }
}
