import { PATIENT_CONFIG } from '../data/patientConfig.js';
import { Patient } from './Patient.js';
import { playError } from './Sound.js';

const FONT = 'Arial, "Segoe UI", sans-serif';

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
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
      const roomX = PATIENT_CONFIG.roomTargets[patient.roomId] || 1040;
      this.scene.walkPlayerTo(roomX - PATIENT_CONFIG.followOffset, patient.roomFloor);
      return;
    }

    if (patient.state === 'atRoom') {
      this.scene.walkPlayerTo(
        patient.x - PATIENT_CONFIG.followOffset,
        patient.floor,
      );
      patient.requestDialog();
    }
  }

  onPatientTimeout(patient) {
    this.releaseSpot(patient);
    patient.leave();

    playError();
    const penalty = PATIENT_CONFIG.leaveReputationPenalty;
    this.scene.changeReputation(-penalty);
    this.showPenalty(patient, penalty);
  }

  dismissPatient(patient) {
    if (!patient || patient.state === 'leaving') {
      return;
    }
    this.releaseSpot(patient);
    patient.leave();
  }

  showPenalty(patient, penalty) {
    const text = this.scene.add
      .text(patient.x, patient.baseY - 430, `−${penalty} репутации`, {
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
