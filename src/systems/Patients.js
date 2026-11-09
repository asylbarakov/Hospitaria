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
import { FLOOR_Y, ROOMS } from '../data/rooms.js';
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

    this.x = PATIENT_CONFIG.spawnX;
    this.targetX = PATIENT_CONFIG.waitingSpots[spotIndex];
    this.state = 'arriving';
    this.patienceMax = randomBetween(PATIENT_CONFIG.patienceMin, PATIENT_CONFIG.patienceMax);
    this.patience = this.patienceMax;
    this.walkPhase = 0;
    this.needsDialog = false;

    this.avatar = new Avatar(scene, this.x, FLOOR_Y, createPatientLook(), { scale: 1 });
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
      .text(this.x, FLOOR_Y - NAME_OFFSET_Y, this.name, {
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
    this.state = 'toRoom';
    this.targetX = PATIENT_CONFIG.roomTargets[this.roomId] || 1040;
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
    this.state = 'leaving';
    this.targetX = PATIENT_CONFIG.exitX;
    this.needsDialog = false;
    this.manager.releaseSpot(this);
    this.bubble.setVisible(false);
    this.bar.setVisible(false);
  }

  update(delta) {
    if (this.state === 'leaving') {
      this.moveTowardsTarget(delta);
      this.syncVisuals();
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

    if (this.state === 'atRoom') {
      this.avatar.stopWalking();
      this.avatar.setFacing(this.scene.playerX < this.x ? -1 : 1);
      this.tryOpenDialog();
    }
  }

  moveTowardsTarget(delta) {
    if (this.state !== 'arriving' && this.state !== 'toRoom' && this.state !== 'leaving') {
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
    } else if (this.state === 'toRoom') {
      this.state = 'atRoom';
      this.tryOpenDialog();
    } else if (this.state === 'leaving') {
      this.manager.removePatient(this);
    }
  }

  tryOpenDialog() {
    if (!this.needsDialog) {
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
    this.avatar.setPosition(this.x, FLOOR_Y);
    this.nameText.setX(this.x);
    this.bubble.setPosition(this.x, FLOOR_Y - BUBBLE_OFFSET_Y);
    this.bar.setPosition(this.x, FLOOR_Y - BAR_OFFSET_Y);
    drawPatienceBar(this.bar, this.patience / this.patienceMax);
  }

  destroy() {
    this.avatar.destroy();
    this.nameText.destroy();
    this.bubble.destroy();
    this.bar.destroy();
  }
}

export class PatientManager {
  constructor(scene) {
    this.scene = scene;
    this.patients = [];
    this.spots = PATIENT_CONFIG.waitingSpots.map(() => null);
    this.spawnTimer = PATIENT_CONFIG.firstSpawnDelay;
  }

  update(delta) {
    if (this.scene.registry.get('uiModal')) {
      return;
    }

    this.spawnTimer -= delta;
    const maxPatients = this.scene.getMaxPatients
      ? this.scene.getMaxPatients()
      : PATIENT_CONFIG.maxPatients;
    if (this.spawnTimer <= 0) {
      if (this.patients.length < maxPatients) {
        this.spawnPatient();
        this.spawnTimer = randomBetween(
          PATIENT_CONFIG.spawnIntervalMin,
          PATIENT_CONFIG.spawnIntervalMax,
        );
      } else {
        this.spawnTimer = 5000;
      }
    }

    this.patients.slice().forEach((patient) => patient.update(delta));
  }

  spawnPatient() {
    const spotIndex = this.spots.findIndex((value) => value === null);
    if (spotIndex === -1) {
      return;
    }
    const patient = new Patient(this.scene, this, spotIndex);
    this.spots[spotIndex] = patient;
    this.patients.push(patient);
  }

  releaseSpot(patient) {
    if (this.spots[patient.spotIndex] === patient) {
      this.spots[patient.spotIndex] = null;
    }
  }

  onPatientClicked(patient) {
    this.scene.patientClickGuard = true;

    if (patient.state === 'waiting' || patient.state === 'arriving') {
      this.releaseSpot(patient);
      patient.goToRoom();
      this.scene.walkPlayerTo(patient.targetX - PATIENT_CONFIG.followOffset);
      return;
    }

    if (patient.state === 'atRoom') {
      this.scene.walkPlayerTo(patient.x - PATIENT_CONFIG.followOffset);
      patient.requestDialog();
    }
  }

  onPatientTimeout(patient) {
    this.releaseSpot(patient);
    patient.leave();

    const penalty = PATIENT_CONFIG.leaveReputationPenalty;
    this.scene.changeReputation(-penalty);
    this.showPenalty(patient.x, penalty);
  }

  dismissPatient(patient) {
    if (!patient || patient.state === 'leaving') {
      return;
    }
    this.releaseSpot(patient);
    patient.leave();
  }

  showPenalty(x, penalty) {
    const text = this.scene.add
      .text(x, FLOOR_Y - 430, `−${penalty} репутации`, {
        fontFamily: FONT,
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#c62828',
        stroke: '#ffffff',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.scene.tweens.add({
      targets: text,
      y: text.y - 60,
      alpha: 0,
      duration: 1300,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  removePatient(patient) {
    this.releaseSpot(patient);
    const index = this.patients.indexOf(patient);
    if (index !== -1) {
      this.patients.splice(index, 1);
    }
    patient.destroy();
  }

  destroy() {
    this.patients.slice().forEach((patient) => patient.destroy());
    this.patients = [];
  }
}

export default PatientManager;
