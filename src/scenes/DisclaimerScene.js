import { createButton } from '../ui/Button.js';
import { HUD_FONT } from '../ui/hudDrawing.js';

const W = 1280;
const H = 720;
const PANEL_X = 290;
const PANEL_Y = 140;
const PANEL_W = 700;
const PANEL_H = 440;

export default class DisclaimerScene extends Phaser.Scene {
  constructor() {
    super('DisclaimerScene');
  }

  init(data = {}) {
    this.fromScene = data.from === 'MenuScene' ? 'MenuScene' : null;
    this.closed = false;
  }

  create() {
    const g = this.add.graphics();

    g.fillStyle(0x10222e, 0.62);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0x0b1e28, 0.28);
    g.fillRoundedRect(PANEL_X + 8, PANEL_Y + 10, PANEL_W, PANEL_H, 26);
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 26);
    g.fillStyle(0x3f8fb0, 1);
    g.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, 86, {
      tl: 26,
      tr: 26,
      bl: 0,
      br: 0,
    });
    g.fillStyle(0x0b1e28, 0.14);
    g.fillRoundedRect(PANEL_X, PANEL_Y, PANEL_W, 86, {
      tl: 26,
      tr: 26,
      bl: 0,
      br: 0,
    });
    g.lineStyle(3, 0x8fb7c7, 1);
    g.strokeRoundedRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 26);

    this.add
      .text(W / 2, PANEL_Y + 42, 'Об игре', {
        fontFamily: HUD_FONT,
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const body = [
      '«Больница» — дружелюбный симулятор для всей семьи.',
      'Вы принимаете пациентов, проводите простые приёмы,',
      'зарабатываете монеты и обустраиваете больницу.',
      '',
      'Все болезни, процедуры и лекарства здесь вымышленные и условные.',
      '',
      'Игра создана для развлечения и не является медицинским советом.',
      'При реальном недомогании обращайтесь к врачу.',
    ].join('\n');

    this.add
      .text(W / 2, PANEL_Y + 118, body, {
        fontFamily: HUD_FONT,
        fontSize: '19px',
        color: '#24444f',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5, 0);

    this.add
      .text(
        W / 2,
        PANEL_Y + 332,
        'Без крови, жестокости и страшных сцен.',
        {
          fontFamily: HUD_FONT,
          fontSize: '15px',
          color: '#8aa6b0',
        },
      )
      .setOrigin(0.5);

    createButton(this, W / 2, PANEL_Y + 386, 'Понятно', () => this.close(), {
      width: 260,
      height: 58,
      fontSize: 24,
      color: 0x3f9b4a,
      hoverColor: 0x55b963,
    });

    this.input.keyboard.on('keydown-ESC', () => this.close());
  }

  close() {
    if (this.closed) {
      return;
    }
    this.closed = true;

    if (this.fromScene && this.scene.isPaused(this.fromScene)) {
      this.scene.resume(this.fromScene);
    }
    this.scene.stop();
  }
}
