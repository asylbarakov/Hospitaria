import Avatar from './Avatar.js';
import { getRandomDisease } from '../data/diseases.js';
import { PATIENT_NAMES, PATIENT_CONFIG } from '../data/patientConfig.js';
import {
  drawSymptomBubble,
  drawPatienceBar,
  BUBBLE_OFFSET_Y,
  NAME_OFFSET_Y,
  BAR_OFFSET_Y,
} from './patientDrawing.js';
import { FLOOR_Y, ROOMS, LIFT_X, floorBaseY } from '../data/rooms.js';
import {
  PATIENT_ROLE,
  PATIENT_CLOTHES,
  SKIN_COLORS,
  HAIRSTYLES,
  HAIR_COLORS,
} from '../data/avatarOptions.js';

const FONT = 'Arial, "Segoe UI", sans-serif';

function randomIndex(list) {
  return Math.floor(Math.random() * list.length);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createPatientLook() {
  return {
    role: PATIENT_ROLE,
    skin: randomIndex(SKIN_COLORS),
    hairstyle: randomIndex(HAIRSTYLES),
    hairColor: randomIndex(HAIR_COLORS),
    coat: randomIndex(PATIENT_CLOTHES),
    accessory: randomIndex(3),
  };
}

export class Patient {
  constructor(scene, manager, spotIndex) {
    this.scene = scene;
    this.manager = manager;
    this.spotIndex = spotIndex;
    this.name = PATIENT_NAMES[randomIndex(PATIENT_NAMES)];
    this.disease = getRandomDisease();
    this.roomId = this.disease.room;

    const room = ROOMS.find((item) => item.id === this.roomId);
    this.roomTitle = room ? room.title : 'Кабинет врача';
    this.roomFloor = room ? room.floor : 1;
    this.floor = 1;
    this.baseY = FLOOR_Y;

    this.x = PATIENT_CONFIG.spawnX;
    this.targetX = PATIENT_CONFIG.waitingSpots[spotIndex];
    this.state = 'arriving';
    this.patienceMax = randomBetween(PATIENT_CONFIG.patienceMin, PATIENT_CONFIG.patienceMax);
    this.patience = this.patienceMax;
    this.walkPhase = 0;
    this.idleTime = Math.random() * 2000;
    this.needsDialog = false;

    this.avatar = new Avatar(scene, this.x, this.baseY, createPatientLook(), { scale: 1 });
    this.avatar.container.setDepth(9);
    this.avatar.container.setInteractive(
      new Phaser.Geom.Rectangle(-60, -310, 120, 315),
      Phaser.Geom.Rectangle.Contains,
    );
    if (this.avatar.container.input) {
      this.avatar.container.input.cursor = 'pointer';
    }
    this.avatar.container.on('pointerdown', () => this.manager.onPatientClicked(this));

    this.nameText = scene.add
      .text(this.x, this.baseY - NAME_OFFSET_Y, this.name, {
        fontFamily: FONT,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#2f5d6b',
        stroke: '#ffffff',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(12);

    this.bubble = scene.add.graphics().setDepth(13);
    drawSymptomBubble(this.bubble, this.disease);

    this.bar = scene.add.graphics().setDepth(13);
    drawPatienceBar(this.bar, 1);

    this.syncVisuals();
  }

  goToRoom() {
    const sameFloor = this.roomFloor === this.floor;
    this.state = sameFloor ? 'toRoom' : 'toLift';
    this.targetX = sameFloor
      ? (PATIENT_CONFIG.roomTargets[this.roomId] || 1040)
      : LIFT_X;
    this.needsDialog = true;
    this.bar.setVisible(true);
    this.bubble.setVisible(true);
  }

  requestDialog() {
    if (this.state !== 'atRoom') {
      return;
    }
    this.needsDialog = true;
    this.tryOpenDialog();
  }

  leave() {
    this.needsDialog = false;
    this.manager.releaseSpot(this);
    this.bubble.setVisible(false);
    this.bar.setVisible(false);

    if (this.floor === 1) {
      this.state = 'leaving';
      this.targetX = PATIENT_CONFIG.exitX;
      return;
    }

    this.state = 'toLiftExit';
    this.targetX = LIFT_X;
  }

  update(delta) {
    this.avatar.updateIdle(delta);

    if (this.state === 'lift') {
      this.syncVisuals();
      return;
    }

    if (this.state === 'leaving' || this.state === 'toLiftExit') {
      this.moveTowardsTarget(delta);
      this.syncVisuals();
      this.applyIdleSway(delta, false);
      return;
    }

    if (this.state !== 'atRoom') {
      this.patience -= delta;
      if (this.patience <= 0) {
        this.patience = 0;
        this.syncVisuals();
        this.manager.onPatientTimeout(this);
        return;
      }
    }

    this.moveTowardsTarget(delta);
    this.syncVisuals();
    this.applyIdleSway(delta, this.state === 'waiting' || this.state === 'atRoom');

    if (this.state === 'atRoom') {
      this.avatar.stopWalking();
      this.avatar.setFacing(this.scene.playerX < this.x ? -1 : 1);
      this.tryOpenDialog();
    }
  }

  applyIdleSway(delta, idle) {
    if (!idle) {
      this.avatar.container.setAngle(0);
      return;
    }

    this.idleTime += delta;
    const angle = Math.sin(this.idleTime * 0.0022) * 1.5;
    this.avatar.container.setAngle(angle);
  }

  moveTowardsTarget(delta) {
    if (
      this.state !== 'arriving'
      && this.state !== 'toRoom'
      && this.state !== 'toLift'
      && this.state !== 'toLiftExit'
      && this.state !== 'leaving'
    ) {
      this.avatar.stopWalking();
      return;
    }

    const dx = this.targetX - this.x;
    if (Math.abs(dx) <= 1) {
      this.x = this.targetX;
      this.avatar.stopWalking();
      this.arrive();
      return;
    }

    const step = (PATIENT_CONFIG.walkSpeed * Math.min(delta, 50)) / 1000;
    const direction = Math.sign(dx);
    this.x += Math.abs(dx) <= step ? dx : direction * step;
    this.avatar.setFacing(direction);
    this.walkPhase += delta * 0.016;
    this.avatar.setWalking(this.walkPhase);
  }

  arrive() {
    if (this.state === 'arriving') {
      this.state = 'waiting';
    } else if (this.state === 'toLift') {
      this.beginFloorTransition(this.roomFloor);
    } else if (this.state === 'toLiftExit') {
      this.beginFloorTransition(1, () => {
        this.state = 'leaving';
        this.targetX = PATIENT_CONFIG.exitX;
      });
    } else if (this.state === 'toRoom') {
      this.state = 'atRoom';
      this.tryOpenDialog();
    } else if (this.state === 'leaving') {
      this.manager.removePatient(this);
    }
  }

  beginFloorTransition(targetFloor, after = null) {
    this.state = 'lift';
    this.avatar.stopWalking();

    const targets = [this.avatar.container, this.nameText, this.bubble, this.bar];

    this.scene.tweens.add({
      targets,
      alpha: 0,
      duration: 170,
      onComplete: () => {
        this.floor = targetFloor;
        this.baseY = floorBaseY(targetFloor);
        this.x = LIFT_X;
        this.avatar.setPosition(this.x, this.baseY);
        this.syncVisuals();

        this.scene.tweens.add({
          targets,
          alpha: 1,
          duration: 170,
          onComplete: () => {
            if (after) {
              after();
              return;
            }
            this.state = 'toRoom';
            this.targetX = PATIENT_CONFIG.roomTargets[this.roomId] || 1040;
          },
        });
      },
    });
  }

  tryOpenDialog() {
    if (!this.needsDialog || this.floor !== this.scene.playerFloor) {
      return;
    }
    const distance = Math.abs(this.scene.playerX - this.x);
    if (distance > PATIENT_CONFIG.dialogueDistance) {
      return;
    }
    this.needsDialog = false;
    this.scene.showPatientDialog(this);
  }

  syncVisuals() {
    this.avatar.setPosition(this.x, this.baseY);
    this.nameText.setX(this.x);
    this.nameText.setY(this.baseY - NAME_OFFSET_Y);
    this.bubble.setPosition(this.x, this.baseY - BUBBLE_OFFSET_Y);
    this.bar.setPosition(this.x, this.baseY - BAR_OFFSET_Y);
    drawPatienceBar(this.bar, this.patience / this.patienceMax);
  }

  destroy() {
    this.avatar.destroy();
    this.nameText.destroy();
    this.bubble.destroy();
    this.bar.destroy();
  }
}

export default Patient;
