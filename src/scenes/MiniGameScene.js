import { createButton } from '../ui/Button.js';
import { createExam } from '../minigames/exam.js';
import { createThermometer } from '../minigames/thermometer.js';
import { createMedicine } from '../minigames/medicine.js';
import { createInjection } from '../minigames/injection.js';
import { createBreath } from '../minigames/breath.js';
import { createDrops } from '../minigames/drops.js';
import { createCompress } from '../minigames/compress.js';
import {
  MG_FONT,
  drawMiniGameBackground,
  drawMiniGameHeader,
} from '../ui/minigameDrawing.js';
import { showMiniGameResult } from '../ui/MiniGameResult.js';
import { MINIGAME_KEYS, MINIGAME_TIME_LIMIT } from '../data/treatmentConfig.js';
import { getTreatmentReward } from '../systems/treatmentRewards.js';

const GAME_TITLES = {
  exam: 'Осмотр',
  thermometer: 'Градусник',
  medicine: 'Подбор лекарства',
  injection: 'Укол / капельница',
  breath: 'Дыхание',
  drops: 'Капли',
  compress: 'Компресс',
};

const GAME_FACTORIES = {
  exam: createExam,
  thermometer: createThermometer,
  medicine: createMedicine,
  injection: createInjection,
  breath: createBreath,
  drops: createDrops,
  compress: createCompress,
};

export default class MiniGameScene extends Phaser.Scene {
  constructor() {
    super('MiniGameScene');
  }

  init(data = {}) {
    this.patient = data.patient || null;
    this.onFinish = typeof data.onFinish === 'function' ? data.onFinish : null;
    this.requestedGameKey = data.gameKey || null;
    this.currentGame = null;
    this.gameRoot = null;
    this.result = null;
    this.finished = false;
    this.timeLeft = MINIGAME_TIME_LIMIT;
  }

  create() {
    if (!this.patient) {
      this.scene.stop();
      return;
    }

    this.registry.set('uiModal', true);

    const background = this.add.graphics().setDepth(0);
    drawMiniGameBackground(background);

    const header = this.add.graphics().setDepth(1);
    drawMiniGameHeader(header);

    const disease = this.patient.disease;

    this.add
      .text(42, 32, `Пациент: ${this.patient.name}`, {
        fontFamily: MG_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#24444f',
      })
      .setDepth(2);

    this.add
      .text(42, 66, disease.symptoms.join('  •  '), {
        fontFamily: MG_FONT,
        fontSize: '15px',
        color: '#5b7f8c',
        wordWrap: { width: 470 },
      })
      .setDepth(2);

    const gameKey = MINIGAME_KEYS.includes(this.requestedGameKey)
      ? this.requestedGameKey
      : MINIGAME_KEYS[Math.floor(Math.random() * MINIGAME_KEYS.length)];
    this.gameKey = gameKey;

    this.add
      .text(640, 52, GAME_TITLES[gameKey], {
        fontFamily: MG_FONT,
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#2f5d6b',
      })
      .setOrigin(0.5)
      .setDepth(2);

    const timerPill = this.add.graphics().setDepth(2);
    timerPill.fillStyle(0xeaf3ff, 1);
    timerPill.fillRoundedRect(900, 26, 150, 50, 16);
    timerPill.lineStyle(2, 0xb9cdf0, 1);
    timerPill.strokeRoundedRect(900, 26, 150, 50, 16);

    this.timerText = this.add
      .text(975, 51, '00:25', {
        fontFamily: MG_FONT,
        fontSize: '23px',
        fontStyle: 'bold',
        color: '#2f5d6b',
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.skipButton = createButton(this, 1165, 52, 'Пропустить', () => this.skipGame(), {
      width: 160,
      height: 46,
      fontSize: 17,
      color: 0x8a6d5b,
      hoverColor: 0xa88a76,
      depth: 3,
    });

    this.gameRoot = this.add.container(0, 0).setDepth(4);

    const factory = GAME_FACTORIES[gameKey];
    this.currentGame = factory(this, this.gameRoot, {
      disease,
      patient: this.patient,
      finish: (stars, reason) => this.completeGame(stars, reason),
    });

    this.updateTimer();
  }

  update(time, delta) {
    if (!this.patient || this.result) {
      return;
    }

    if (!this.finished) {
      this.timeLeft -= delta;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.updateTimer();
        this.completeGame(0, 'timeout');
        return;
      }
      this.updateTimer();
    }

    if (this.currentGame && this.currentGame.update) {
      this.currentGame.update(delta);
    }
  }

  updateTimer() {
    const seconds = Math.max(0, Math.ceil(this.timeLeft / 1000));
    this.timerText.setText(`00:${String(seconds).padStart(2, '0')}`);
    this.timerText.setColor(seconds <= 5 ? '#c62828' : '#2f5d6b');
  }

  skipGame() {
    if (this.finished) {
      return;
    }
    this.completeGame(0, 'skip');
  }

  completeGame(stars, reason) {
    if (this.finished) {
      return;
    }

    this.finished = true;
    const skipped = reason === 'skip';
    this.result = {
      ...getTreatmentReward(this.patient.disease, stars, skipped),
      reason,
    };

    this.tweens.killAll();
    this.time.removeAllEvents();
    if (this.skipButton) {
      this.skipButton.setVisible(false);
    }
    if (this.currentGame && this.currentGame.destroy) {
      this.currentGame.destroy();
    }
    if (this.gameRoot) {
      this.gameRoot.destroy(true);
      this.gameRoot = null;
    }
    this.currentGame = null;

    showMiniGameResult(this, this.result, () => this.finishAndClose());
  }

  finishAndClose() {
    if (!this.result) {
      return;
    }

    const result = this.result;
    this.result = null;

    if (this.onFinish) {
      this.onFinish(result);
    }
    this.scene.stop();
  }
}
