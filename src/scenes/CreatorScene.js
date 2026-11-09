import { createButton } from '../ui/Button.js';
import { createStepper } from '../ui/Stepper.js';
import Save from '../systems/Save.js';
import Avatar from '../systems/Avatar.js';
import {
  ROLES,
  SKIN_COLORS,
  HAIRSTYLES,
  HAIR_COLORS,
  COAT_COLORS,
  ACCESSORIES,
  DEFAULT_AVATAR,
  normalizeAvatar,
} from '../data/avatarOptions.js';

const W = 1280;
const H = 720;
const FONT = 'Arial, "Segoe UI", sans-serif';
const AVATAR_Y = 614;
const MAX_NAME = 14;
const CREATOR_COATS = COAT_COLORS.filter((item) => !item.premium);
const CREATOR_ACCESSORIES = ACCESSORIES.filter((item) => !item.premium);

export default class CreatorScene extends Phaser.Scene {
  constructor() {
    super('CreatorScene');
  }

  create() {
    this.config = normalizeAvatar(DEFAULT_AVATAR);
    this.playerName = '';
    this.caretOn = true;

    this.drawBackground();
    this.drawHeader();

    this.avatar = new Avatar(this, W / 2, AVATAR_Y, this.config, { scale: 1.25 });

    this.createSteppers();
    this.createNameField();
    this.createFooter();
    this.bindKeyboard();
  }

  drawBackground() {
    const g = this.add.graphics();

    g.fillGradientStyle(0xdff3fb, 0xdff3fb, 0xf9fdff, 0xf9fdff, 1);
    g.fillRect(0, 0, W, 600);

    // Мягкий круг-подсветка за персонажем.
    g.fillStyle(0xffffff, 0.22);
    g.fillCircle(W / 2, 430, 300);
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(W / 2, 430, 255);

    // Пол в клетку.
    g.fillStyle(0xf0e6d2, 1);
    g.fillRect(0, 600, W, H - 600);
    g.lineStyle(2, 0xdccfb4, 1);
    for (let x = 0; x <= W; x += 80) {
      g.lineBetween(x, 600, x, H);
    }
    for (let y = 632; y <= H; y += 40) {
      g.lineBetween(0, y, W, y);
    }

    // Подиум.
    g.fillStyle(0x000000, 0.08);
    g.fillEllipse(W / 2, 620, 270, 52);
    g.fillStyle(0xe6f4fa, 1);
    g.fillEllipse(W / 2, 610, 245, 44);
  }

  drawHeader() {
    this.add
      .text(W / 2, 50, 'Создание персонажа', {
        fontFamily: FONT,
        fontSize: '46px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#2f7f95',
        strokeThickness: 8,
        shadow: { offsetX: 0, offsetY: 4, color: '#1b4b5a', blur: 8, fill: true },
      })
      .setOrigin(0.5);

    this.add
      .text(W / 2, 98, 'Выберите роль и внешний вид', {
        fontFamily: FONT,
        fontSize: '21px',
        color: '#4d7b8a',
      })
      .setOrigin(0.5);

    createButton(this, 108, 56, 'Назад', () => this.goBack(), {
      width: 150,
      height: 50,
      fontSize: 20,
      color: 0x5b7f8c,
      hoverColor: 0x729aa8,
      depth: 20,
    });
  }

  createSteppers() {
    this.addStepper(240, 300, 'Роль', ROLES, {
      get: () => ROLES.findIndex((item) => item.id === this.config.role),
      set: (index) => {
        this.config.role = ROLES[index].id;
      },
    });

    this.addStepper(240, 400, 'Цвет кожи', SKIN_COLORS, {
      get: () => this.config.skin,
      set: (index) => {
        this.config.skin = index;
      },
    });

    this.addStepper(240, 500, 'Причёска', HAIRSTYLES, {
      get: () => this.config.hairstyle,
      set: (index) => {
        this.config.hairstyle = index;
      },
    });

    this.addStepper(1040, 300, 'Цвет волос', HAIR_COLORS, {
      get: () => this.config.hairColor,
      set: (index) => {
        this.config.hairColor = index;
      },
    });

    this.addStepper(1040, 400, 'Цвет халата', CREATOR_COATS, {
      get: () => this.config.coat,
      set: (index) => {
        this.config.coat = index;
      },
    });

    this.addStepper(1040, 500, 'Аксессуар', CREATOR_ACCESSORIES, {
      get: () => this.config.accessory,
      set: (index) => {
        this.config.accessory = index;
      },
    });
  }

  addStepper(x, y, title, options, accessors) {
    createStepper(this, x, y, title, options, accessors, () => {
      this.avatar.setConfig(this.config);
    });
  }

  createNameField() {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.92);
    g.fillRoundedRect(410, 128, 460, 64, 16);
    g.lineStyle(3, 0x8fb7c7, 1);
    g.strokeRoundedRect(410, 128, 460, 64, 16);

    this.nameText = this.add
      .text(W / 2, 160, 'Имя персонажа', {
        fontFamily: FONT,
        fontSize: '28px',
        color: '#8aa6b0',
      })
      .setOrigin(0.5);

    this.caret = this.add
      .text(W / 2, 160, '|', {
        fontFamily: FONT,
        fontSize: '30px',
        color: '#2f5d6b',
      })
      .setOrigin(0, 0.5)
      .setVisible(false);

    this.hintText = this.add
      .text(W / 2, 212, 'Начните печатать на клавиатуре', {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#8aa6b0',
      })
      .setOrigin(0.5);

    this.time.addEvent({
      delay: 520,
      loop: true,
      callback: () => {
        this.caretOn = !this.caretOn;
        this.updateNameField();
      },
    });
  }

  updateNameField() {
    const hasName = this.playerName.length > 0;

    this.nameText.setText(hasName ? this.playerName : 'Имя персонажа');
    this.nameText.setColor(hasName ? '#24444f' : '#8aa6b0');

    if (hasName) {
      this.caret.setPosition(W / 2 + this.nameText.width / 2 + 4, 160);
      this.caret.setVisible(this.caretOn);
    } else {
      this.caret.setVisible(false);
    }
  }

  bindKeyboard() {
    this.input.keyboard.on('keydown', (event) => {
      if (event.key === 'Enter') {
        this.finish();
        return;
      }
      if (event.key === 'Escape') {
        this.goBack();
        return;
      }
      if (event.key === 'Backspace') {
        this.playerName = this.playerName.slice(0, -1);
        this.hintText.setText('');
        this.updateNameField();
        return;
      }
      if (
        event.key.length === 1
        && this.playerName.length < MAX_NAME
        && /[A-Za-zА-Яа-яЁё0-9 \-]/.test(event.key)
      ) {
        this.playerName += event.key;
        this.hintText.setText('');
        this.updateNameField();
      }
    });
  }

  createFooter() {
    createButton(this, W / 2, 665, 'Готово', () => this.finish(), {
      width: 320,
      height: 70,
      fontSize: 30,
      color: 0x3f9b4a,
      hoverColor: 0x55b963,
      depth: 20,
    });
  }

  finish() {
    const name = this.playerName.trim();

    if (!name) {
      this.hintText.setColor('#d05c5c');
      this.hintText.setText('Введите имя персонажа');
      return;
    }

    const data = Save.load() || {
      version: 1,
      createdAt: Date.now(),
      coins: 0,
      xp: 0,
      level: 1,
      reputation: 50,
      ownedItems: [],
      furniture: [],
    };

    data.version = 1;
    data.player = { name, ...this.config };
    Save.save(data);
    this.scene.start('HospitalScene');
  }

  goBack() {
    const data = Save.load();
    if (!data || !data.player) {
      Save.clear();
    }
    this.scene.start('MenuScene');
  }
}
