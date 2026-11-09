import Save from '../systems/Save.js';
import Avatar from '../systems/Avatar.js';
import { DEFAULT_AVATAR, normalizeAvatar } from '../data/avatarOptions.js';
import { createHospitalWorld } from '../systems/roomPainter.js';
import { PatientManager } from '../systems/Patients.js';
import { startMiniGame } from '../systems/treatmentFlow.js';
import {
  ROOMS,
  ROOM_WIDTH,
  VIEW_HEIGHT,
  WORLD_WIDTH,
  FLOOR_Y,
} from '../data/rooms.js';

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
    this.saveData = Save.load();
    const player = this.saveData && this.saveData.player ? this.saveData.player : null;
    this.playerName = player && player.name ? player.name : 'Игрок';

    this.playerX = START_X;
    this.targetX = START_X;
    this.walkPhase = 0;
    this.patientClickGuard = false;
    this.treatmentCount = 0;

    this.world = createHospitalWorld(this);
    this.createPlayer(player);
    this.createCamera();
    this.createControls();
    this.initHud(player);
    this.updateRoomTitle();
    this.patients = new PatientManager(this);

    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }

    this.events.once('shutdown', () => this.handleShutdown());
  }

  createPlayer(player) {
    const config = normalizeAvatar(player || DEFAULT_AVATAR);

    this.avatar = new Avatar(this, START_X, FLOOR_Y, config, { scale: 1.15 });
    this.avatar.container.setDepth(10);

    this.nameText = this.add
      .text(START_X, FLOOR_Y + NAME_OFFSET_Y, this.playerName, {
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
    camera.setBounds(0, 0, WORLD_WIDTH, VIEW_HEIGHT);
    camera.startFollow(this.avatar.container, true, 0.09, 0.09);
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
    const index = Phaser.Math.Clamp(
      Math.floor(this.playerX / ROOM_WIDTH),
      0,
      ROOMS.length - 1,
    );
    const title = ROOMS[index].title;

    if (title !== this.currentRoom) {
      this.currentRoom = title;
      this.registry.set('currentRoom', title);
    }
  }

  walkPlayerTo(x) {
    this.targetX = Phaser.Math.Clamp(x, MIN_X, MAX_X);
  }

  showPatientDialog(patient) {
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

  addCoins(amount) {
    const value = Math.max(0, Math.round(Number(amount) || 0));
    const next = Math.max(0, (Number(this.registry.get('coins')) || 0) + value);
    this.registry.set('coins', next);
    this.persistStats();
    return next;
  }

  addXp(amount) {
    const value = Math.max(0, Math.round(Number(amount) || 0));
    const next = Math.max(0, (Number(this.registry.get('xp')) || 0) + value);
    this.registry.set('xp', next);
    this.persistStats();
    return next;
  }

  persistStats() {
    if (!this.saveData) {
      return;
    }

    this.saveData.coins = Number(this.registry.get('coins')) || 0;
    this.saveData.xp = Number(this.registry.get('xp')) || 0;
    this.saveData.level = Number(this.registry.get('level')) || 1;
    this.saveData.reputation = Number(this.registry.get('reputation')) || 0;
    Save.save(this.saveData);
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

  handleShutdown() {
    this.registry.set('uiModal', false);
    if (this.scene.isActive('UIScene')) {
      this.scene.stop('UIScene');
    }
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.extraKeys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.input.on('pointerdown', (pointer) => {
      const patientClicked = this.patientClickGuard;
      this.patientClickGuard = false;

      if (patientClicked) {
        return;
      }

      if (this.registry.get('uiModal')) {
        return;
      }

      // Клики по кнопкам и окнам интерфейса не должны двигать персонажа.
      const ui = this.scene.get('UIScene');
      if (ui && ui.input && ui.input.hitTestPointer(pointer).length > 0) {
        return;
      }

      // Работаем только с кликами по полу, а не по верхнему интерфейсу.
      if (pointer.worldY < FLOOR_Y - 40) {
        return;
      }

      const targetX = Phaser.Math.Clamp(pointer.worldX, MIN_X, MAX_X);
      this.targetX = targetX;
      this.spawnRipple(targetX);
    });

    this.input.keyboard.on('keydown-ESC', () => {
      if (this.registry.get('uiModal')) {
        const ui = this.scene.get('UIScene');
        if (ui && ui.closeModal) {
          ui.closeModal();
        }
        return;
      }
      this.leaveToMenu();
    });
  }

  spawnRipple(x) {
    const ripple = this.add
      .ellipse(x, FLOOR_Y - 6, 38, 16, 0x3f8fb0, 0.4)
      .setDepth(9);

    this.tweens.add({
      targets: ripple,
      scaleX: 1.9,
      scaleY: 1.9,
      alpha: 0,
      duration: 430,
      ease: 'Quad.easeOut',
      onComplete: () => ripple.destroy(),
    });
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
      // Стрелки и A/D двигают персонажа напрямую.
      direction = leftDown ? -1 : 1;
      this.playerX = Phaser.Math.Clamp(
        this.playerX + direction * step,
        MIN_X,
        MAX_X,
      );
      this.targetX = this.playerX;
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

    if (moving) {
      this.avatar.setFacing(direction);
      this.walkPhase += delta * 0.016;
    }

    this.avatar.setPosition(this.playerX, FLOOR_Y);
    if (moving) {
      this.avatar.setWalking(this.walkPhase);
    } else {
      this.avatar.stopWalking();
    }

    this.nameText.setX(this.playerX);
    this.updateRoomTitle();

    if (this.patients) {
      this.patients.update(delta);
    }
  }
}
