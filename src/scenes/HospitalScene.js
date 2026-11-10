import Save from '../systems/Save.js';
import Avatar from '../systems/Avatar.js';
import { DEFAULT_AVATAR, normalizeAvatar } from '../data/avatarOptions.js';
import { createHospitalWorld } from '../systems/roomPainter.js';
import { PatientManager } from '../systems/Patients.js';
import { startMiniGame } from '../systems/treatmentFlow.js';
import { ensureSaveData, maxPatientsForLevel } from '../systems/Economy.js';
import { ensureDailyTasks } from '../systems/DailyTasks.js';
import { ensureAchievements } from '../systems/Achievements.js';
import {
  addSceneCoins,
  addSceneXp,
  persistSceneStats,
  buyItem,
  equipPlayerItem,
  redrawSceneFurniture,
  claimDailyReward,
} from '../systems/playerActions.js';
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  FLOOR_Y,
  FLOOR_HEIGHT,
  LIFT_X,
} from '../data/rooms.js';
import { createRoomActionZones } from '../systems/floorActions.js';
import { createPlayerControls, spawnPlayerRipple } from '../systems/playerControls.js';
import {
  syncRoomTitle,
  movePlayerTo,
  requestPlayerFloor,
  performFloorChange,
} from '../systems/playerFloorTravel.js';

const FONT = 'Arial, "Segoe UI", sans-serif';
const START_X = 400;
const MIN_X = 70;
const MAX_X = WORLD_WIDTH - 70;
const WALK_SPEED = 380;
const NAME_OFFSET_Y = -350;

export default class HospitalScene extends Phaser.Scene {
  constructor() {
    super('HospitalScene');
  }

  create() {
    this.saveData = ensureSaveData(Save.load());
    ensureDailyTasks(this.saveData);
    ensureAchievements(this.saveData);
    const player = this.saveData && this.saveData.player ? this.saveData.player : null;
    this.playerName = player && player.name ? player.name : 'Игрок';

    this.playerX = START_X;
    this.playerY = FLOOR_Y;
    this.playerFloor = 1;
    this.targetX = START_X;
    this.destinationX = START_X;
    this.targetFloor = 1;
    this.movingFloor = false;
    this.walkPhase = 0;
    this.patientClickGuard = false;
    this.objectClickGuard = false;
    this.treatmentCount = 0;

    this.world = createHospitalWorld(this);
    this.furnitureLayer = null;
    this.refreshFurniture();
    this.createPlayer(player);
    this.createCamera();
    this.createControls();
    this.initHud(player);
    this.updateRoomTitle();
    this.patients = new PatientManager(this);
    createRoomActionZones(this);

    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }

    this.events.once('shutdown', () => this.handleShutdown());
  }

  createPlayer(player) {
    const config = normalizeAvatar(player || DEFAULT_AVATAR);

    this.avatar = new Avatar(this, START_X, this.playerY, config, { scale: 1.15 });
    this.avatar.container.setDepth(10);

    this.nameText = this.add
      .text(START_X, this.playerY + NAME_OFFSET_Y, this.playerName, {
        fontFamily: FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#2f5d6b',
        stroke: '#ffffff',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(11);
  }

  createCamera() {
    const camera = this.cameras.main;
    camera.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    camera.setScroll(0, 0);
  }

  initHud(player) {
    const data = this.saveData || {};

    this.registry.set('playerName', this.playerName);
    this.registry.set('playerRole', player && player.role ? player.role : 'doctor');
    this.registry.set('coins', Number(data.coins) || 0);
    this.registry.set('xp', Number(data.xp) || 0);
    this.registry.set('level', Number(data.level) || 1);
    this.registry.set('reputation', Number(data.reputation) || 50);
    this.registry.set('uiModal', false);
  }

  updateRoomTitle() {
    syncRoomTitle(this);
  }

  walkPlayerTo(x, floor = this.playerFloor) {
    movePlayerTo(this, x, floor);
  }

  requestFloor(floor) {
    requestPlayerFloor(this, floor);
  }

  changeFloor(floor) {
    performFloorChange(this, floor);
  }

  showPatientDialog(patient) {
    this.movingFloor = false;
    this.targetX = this.playerX;
    this.avatar.stopWalking();
    this.avatar.setFacing(patient.x < this.playerX ? -1 : 1);

    const ui = this.scene.get('UIScene');
    if (ui && ui.showPatientDialog) {
      ui.showPatientDialog(patient);
    }
  }

  startTreatment(patient, forcedGameKey = null) {
    startMiniGame(this, patient, forcedGameKey);
  }

  getMaxPatients() {
    return maxPatientsForLevel(this.registry.get('level'));
  }

  addCoins(amount) {
    return addSceneCoins(this, amount);
  }

  addXp(amount) {
    return addSceneXp(this, amount);
  }

  purchaseItem(item) {
    return buyItem(this, item);
  }

  equipItem(item) {
    return equipPlayerItem(this, item);
  }

  refreshFurniture() {
    redrawSceneFurniture(this);
  }

  claimTask(taskId) {
    return claimDailyReward(this, taskId);
  }

  persistStats() {
    persistSceneStats(this);
  }

  changeReputation(amount) {
    const current = Number(this.registry.get('reputation')) || 0;
    const next = Phaser.Math.Clamp(current + amount, 0, 100);
    this.registry.set('reputation', next);
    this.persistStats();
    return next;
  }

  leaveToMenu() {
    this.scene.start('MenuScene');
  }

  openPauseMenu() {
    if (this.scene.isActive('PauseScene')) {
      return;
    }

    this.targetX = this.playerX;
    this.movingFloor = false;
    this.avatar.stopWalking();
    this.registry.set('uiModal', true);
    this.scene.launch('PauseScene');
    if (this.scene.isActive('UIScene')) {
      this.scene.pause('UIScene');
    }
    this.scene.pause('HospitalScene');
  }

  handleShutdown() {
    this.registry.set('uiModal', false);
    if (this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
    }
  }

  createControls() {
    createPlayerControls(this);
  }

  spawnRipple(x, baseY = FLOOR_Y) {
    spawnPlayerRipple(this, x, baseY);
  }

  update(time, delta) {
    if (!this.avatar) {
      return;
    }

    if (this.registry.get('uiModal')) {
      this.targetX = this.playerX;
      this.avatar.stopWalking();
      return;
    }

    const dt = Math.min(delta, 50) / 1000;
    const step = WALK_SPEED * dt;
    const leftDown = this.cursors.left.isDown || this.extraKeys.left.isDown;
    const rightDown = this.cursors.right.isDown || this.extraKeys.right.isDown;

    let direction = 0;
    let moving = false;

    if (leftDown !== rightDown) {
      // Стрелки и A/D двигают персонажа напрямую и отменяют путь к лифту.
      if (this.movingFloor) {
        this.movingFloor = false;
        this.targetFloor = this.playerFloor;
        this.destinationX = this.playerX;
      }

      direction = leftDown ? -1 : 1;
      this.playerX = Phaser.Math.Clamp(
        this.playerX + direction * step,
        MIN_X,
        MAX_X,
      );
      this.targetX = this.playerX;
      this.destinationX = this.playerX;
      moving = true;
    } else {
      const dx = this.targetX - this.playerX;
      if (Math.abs(dx) > 0.5) {
        direction = Math.sign(dx);
        this.playerX = Math.abs(dx) <= step
          ? this.targetX
          : this.playerX + direction * step;
        moving = true;
      }
    }

    if (
      this.movingFloor
      && !this.floorTransition
      && Math.abs(this.playerX - LIFT_X) <= 2
    ) {
      this.playerX = LIFT_X;
      this.targetX = LIFT_X;
      this.changeFloor(this.targetFloor);
    }

    if (moving) {
      this.avatar.setFacing(direction);
      this.walkPhase += delta * 0.016;
    }

    this.avatar.setPosition(this.playerX, this.playerY);
    this.avatar.updateIdle(delta);
    if (moving) {
      this.avatar.setWalking(this.walkPhase);
    } else {
      this.avatar.stopWalking();
    }

    this.nameText.setX(this.playerX);
    this.nameText.setY(this.playerY + NAME_OFFSET_Y);
    this.updateRoomTitle();

    const camera = this.cameras.main;
    const targetScrollX = Phaser.Math.Clamp(
      this.playerX - camera.width / 2,
      0,
      WORLD_WIDTH - camera.width,
    );
    camera.scrollX += (targetScrollX - camera.scrollX) * 0.12;
    camera.scrollY = (this.playerFloor - 1) * FLOOR_HEIGHT;

    if (this.patients) {
      this.patients.update(delta);
    }
  }
}
