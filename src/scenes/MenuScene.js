import { createButton } from '../ui/Button.js';
import { buildMenuScenery } from '../ui/menuScenery.js';
import { MENU_TEXTURES as T } from '../ui/menuTextures.js';
import Save from '../systems/Save.js';

const W = 1280;
const H = 720;
const FONT = 'Arial, "Segoe UI", sans-serif';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    buildMenuScenery(this);
    this.drawPanel();
    this.drawTitle();
    this.drawButtons();
    this.drawFooter();
    this.cameras.main.fadeIn(350, 16, 34, 46);
  }

  drawPanel() {
    // Полупрозрачная «карточка» под кнопками: текст не теряется на фоне здания.
    const g = this.add.graphics().setDepth(8);
    g.fillStyle(0x0b1e28, 0.16);
    g.fillRoundedRect(428, 400, 440, 244, 30);
    g.fillStyle(0xffffff, 0.66);
    g.fillRoundedRect(420, 388, 440, 244, 30);
    g.lineStyle(3, 0xffffff, 0.9);
    g.strokeRoundedRect(420, 388, 440, 244, 30);
  }

  drawTitle() {
    const shadow = this.add
      .text(W / 2 + 4, 124, 'Больница', {
        fontFamily: FONT,
        fontSize: '92px',
        fontStyle: 'bold',
        color: '#1b4b5a',
      })
      .setOrigin(0.5)
      .setAlpha(0.18)
      .setDepth(9);

    const title = this.add
      .text(W / 2, 120, 'Больница', {
        fontFamily: FONT,
        fontSize: '92px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#2f7f95',
        strokeThickness: 10,
        shadow: { offsetX: 0, offsetY: 6, color: '#1b4b5a', blur: 12, fill: true },
      })
      .setOrigin(0.5)
      .setDepth(9);

    this.add
      .text(W / 2, 205, 'симулятор больницы', {
        fontFamily: FONT,
        fontSize: '30px',
        color: '#2f6274',
      })
      .setOrigin(0.5)
      .setDepth(9);

    this.tweens.add({
      targets: [title, shadow],
      scale: { from: 1, to: 1.03 },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Красные значки по бокам заголовка и «кардиограмма» под ним.
    [[W / 2 - 300, -6], [W / 2 + 300, 6]].forEach(([x, angle], index) => {
      const badge = this.add.image(x, 120, T.badge).setDepth(9).setAngle(angle);
      this.tweens.add({
        targets: badge,
        angle: angle * -1,
        y: 126,
        duration: 1800 + index * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    const ecg = this.add.image(W / 2, 248, T.ecg).setDepth(9).setAlpha(0.85);
    this.tweens.add({
      targets: ecg,
      alpha: 0.4,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  drawButtons() {
    const hasSave = Save.exists();

    createButton(this, W / 2, 445, 'Новая игра', () => this.startNewGame(), {
      width: 380,
      height: 78,
      fontSize: 34,
      color: 0x3f9b4a,
      hoverColor: 0x55b963,
      depth: 10,
    });

    createButton(this, W / 2, 550, 'Продолжить', () => this.continueGame(), {
      width: 380,
      height: 78,
      fontSize: 34,
      color: 0x2f80c9,
      hoverColor: 0x4a9be0,
      disabled: !hasSave,
      depth: 10,
    });

    if (!hasSave) {
      this.add
        .text(W / 2, 606, 'Сохранения пока нет — начните новую игру', {
          fontFamily: FONT,
          fontSize: '19px',
          color: '#4d7381',
        })
        .setOrigin(0.5)
        .setDepth(10);
    }
  }

  startNewGame() {
    Save.save({
      version: 1,
      createdAt: Date.now(),
      player: null,
      coins: 0,
      xp: 0,
      level: 1,
      reputation: 50,
      ownedItems: [],
      furniture: [],
    });
    this.scene.start('CreatorScene');
  }

  drawFooter() {
    this.add
      .text(520, 690, 'Игра для развлечения, не медицинский совет', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#2f5d36',
        stroke: '#ffffff',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10);

    createButton(this, 160, 688, 'Изометрия v2 (тест)', () => this.scene.start('IsoTestScene'), {
      width: 270,
      height: 48,
      fontSize: 19,
      color: 0x2f80c9,
      hoverColor: 0x4a9be0,
      depth: 10,
    });

    createButton(this, 1120, 688, 'Об игре', () => this.openDisclaimer(), {
      width: 200,
      height: 48,
      fontSize: 19,
      color: 0x5b7f8c,
      hoverColor: 0x729aa8,
      depth: 10,
    });
  }

  openDisclaimer() {
    this.scene.launch('DisclaimerScene', { from: 'MenuScene' });
    this.scene.pause();
  }

  continueGame() {
    const data = Save.load();
    if (data && data.player) {
      this.scene.start('HospitalScene');
    } else {
      this.scene.start('CreatorScene');
    }
  }
}

export { W, H };
