import * as layout from '../data/layout.js';
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
import buildHudState from '../iso/hudState.js';
import RoomUnlocks from '../systems/RoomUnlocks.js';
import createStaff from '../iso/StaffSetup.js';
import createQuests from '../iso/QuestSetup.js';
import createEconomy from '../iso/EconomySetup.js';
import handleSceneTap, { handleSceneEscape } from '../iso/IsoSceneInput.js';
import { persistScene, resetSceneSave } from '../iso/IsoPersistence.js';
import createTreatment from '../iso/TreatmentRunner.js';
import { queueIsoAssets, queueWallAssets } from '../iso/isoAssets.js';
import {
  screenToTileIndex, tileCenter, worldBounds,
} from '../iso/IsoMath.js';
import { loadIsoSave } from '../systems/IsoSave.js';
import sceneMethods from '../iso/sceneMethods.js';

// Этап 13: изометрическая больница. Мир из layout.js, режим строительства,
// игрок и пациенты через IsoActor/ActorLayer, поиск пути Pathfinder (EasyStar/BFS).

const ICON_FILES = ACTOR_ICONS.map((name) => `icons/${name}.png`);
const UI_FILES = [
  'ui/ui_bar.png', 'ui/ui_bar_fill.png', 'ui/ui_window.png', 'ui/ui_panel.png',
];

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
    const economySystem = createEconomy(this, saved);
    this.stats = economySystem.stats;
    this.economy = economySystem.economy;
    const questSystem = createQuests(this, saved);
    this.bus = questSystem.bus;
    this.quests = questSystem.quests;
    this.roomLocks = new RoomUnlocks({
      state: this.stats,
      saved,
      bus: this.bus,
      onChange: () => this.persist(),
    });
    const rawPlayer = saved && saved.player ? saved.player : { ...DEFAULT_PLAYER, name: 'Доктор' };
    this.wardrobeOpen = false;
    this.modalOpen = false;
    this.patientClickGuard = false;
    this.world = new IsoWorld(this, layout, saved ? saved.items : null, {
      roomLocks: this.roomLocks,
    });
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
      reward: (reward, agent) => economySystem.reward(reward, agent),
      penalty: (amount, agent, kind) => economySystem.penalty(amount, agent, kind),
      event: (type, payload) => this.bus.emit(type, payload),
      isRoomUnlocked: (roomId) => this.roomLocks.isUnlocked(roomId),
      playTreatment: (agent) => this.treatment.start(agent),
    });
    const staff = createStaff(
      this,
      this.world,
      this.patients,
      saved && Array.isArray(saved.staff) ? saved.staff : [],
      this.bus,
    );
    this.staff = staff.flow;
    this.staffRunner = staff.runner;
    this.marker = new TapMarker(this);
    this.build = new BuildMode(this, this.world, {
      getCoins: () => this.stats.coins,
      getLevel: () => this.stats.level,
      spend: (n) => {
        this.stats.spend(n);
        this.economy.recordPurchase(n);
      },
      earn: (n) => {
        this.stats.earn(n);
        this.economy.recordSale(n);
      },
      onChange: () => {
        this.persist();
        this.patients.changed();
        this.staff.refreshPosts(true);
      },
      onEvent: (type, payload) => this.bus.emit(type, payload),
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
    this.treatment = createTreatment(this, {
      iso: this.iso,
      world: this.world,
      patients: this.patients,
      notify: (text) => this.notify(text),
    });

    this.input.keyboard.on('keydown-R', () => this.build.rotate());
    this.input.keyboard.on('keydown-B', () => this.toggleBuild());
    this.input.keyboard.on('keydown-G', () => this.openWardrobe());
    this.input.keyboard.on('keydown-ESC', () => handleSceneEscape(this));

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

  get crystals() {
    return this.stats.crystals;
  }

  get player() {
    return this.playerCtl ? this.playerCtl.player : null;
  }

  get playerActor() {
    return this.playerCtl ? this.playerCtl.actor : null;
  }

  /** Вызывается из «Гардероба»: применяет новый облик, монеты и кристаллы. */
  applyPlayer(player, coins, crystals) {
    if (Number.isFinite(crystals)) {
      this.stats.crystals = crystals;
    }
    this.playerCtl.apply(player, coins);
  }

  // ---- ввод --------------------------------------------------------------------------

  pointerTile(pointer) {
    const w = this.iso.screenToWorld(pointer.x, pointer.y);
    return screenToTileIndex(w.x, w.y);
  }

  handleTap(pointer) {
    handleSceneTap(this, pointer);
  }

  toggleBuild() {
    this.build.setActive(!this.build.active);
  }

  // ---- служебное ---------------------------------------------------------------------

  notify(text) {
    this.messages.push({ text, until: this.time.now + 2200 });
  }

  persist() {
    persistScene(this);
  }

  resetHospital() {
    resetSceneSave(this);
    this.scene.stop('IsoHospitalHud');
    this.scene.restart();
  }

  exitToMenu() {
    this.scene.stop('IsoHospitalHud');
    this.scene.start('MenuScene');
  }

  // ---- цикл --------------------------------------------------------------------------

  update(time, delta) {
    const dt = Math.min(delta, 50) / 1000;
    this.pathfinder.update();
    if (this.patients) {
      this.patients.update(dt * 1000, time);
    }
    if (this.staff) {
      this.staff.update(dt * 1000);
    }
    if (this.economy) {
      this.economy.noteQueue(this.patients ? this.patients.waitingCount() : 0);
      this.economy.update(dt * 1000);
    }
    this.actors.update(dt, time);
    if (this.staffRunner) {
      this.staffRunner.update();
    }

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
    return buildHudState(this);
  }
}

Object.assign(IsoHospitalScene.prototype, sceneMethods);
