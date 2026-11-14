import { createButton } from '../ui/Button.js';
import { queueIsoAssets, isoKey } from '../iso/isoAssets.js';
import { loadIsoSave, saveIso } from '../systems/IsoSave.js';
import {
  askName, bindKeyboard, randomName, updateNameField,
} from './creatorName.js';
import {
  ACCENTS, DEFAULT_PLAYER, PLAYER_ROLES, PLAYER_SKINS,
  accentById, normalizePlayer, skinById,
} from '../data/playerSkins.js';

const W = 1280;
const H = 720;
const FONT = 'Arial, "Segoe UI", sans-serif';
const FREE_SKINS = PLAYER_SKINS.filter((skin) => skin.price === 0);

// Этап 12: создание персонажа для изометрии. Отдельная сцена, чтобы не менять
// создание персонажа v0.1 (CreatorScene). Облик выбирается из готовых PNG.
export default class IsoCreatorScene extends Phaser.Scene {
  constructor() {
    super('IsoCreatorScene');
  }

  preload() {
    queueIsoAssets(this);
  }

  create() {
    this.player = normalizePlayer(DEFAULT_PLAYER);
    this.nameValue = '';
    this.caretOn = true;
    this.skinCards = [];
    this.accentDots = [];
    this.roleMarks = [];

    this.drawBackground();
    this.drawHeader();
    this.createPreview();
    this.createNameField();
    this.createRoles();
    this.createSkins();
    this.createAccents();
    this.createFooter();
    bindKeyboard(this);
    this.refresh();
  }

  drawBackground() {
    const g = this.add.graphics();
    g.fillGradientStyle(0xdff3fb, 0xdff3fb, 0xf9fdff, 0xf9fdff, 1);
    g.fillRect(0, 0, W, 600);
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(620, 440, 320);
    g.fillStyle(0xffffff, 0.45);
    g.fillCircle(620, 440, 260);
    g.fillStyle(0xf0e6d2, 1);
    g.fillRect(0, 600, W, H - 600);
    g.lineStyle(2, 0xdccfb4, 1);
    for (let x = 0; x <= W; x += 80) {
      g.lineBetween(x, 600, x, H);
    }
    for (let y = 632; y <= H; y += 40) {
      g.lineBetween(0, y, W, y);
    }
  }

  drawHeader() {
    this.add
      .text(W / 2, 50, 'Создание персонажа', {
        fontFamily: FONT,
        fontSize: '44px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#2f7f95',
        strokeThickness: 8,
        shadow: { offsetX: 0, offsetY: 4, color: '#1b4b5a', blur: 8, fill: true },
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 98, 'Имя, роль и облик. Акцент — цветная плашка роли над головой', {
        fontFamily: FONT, fontSize: '20px', color: '#4d7b8a',
      })
      .setOrigin(0.5);
    createButton(this, 108, 56, 'Назад', () => this.goBack(), {
      width: 150, height: 50, fontSize: 20, color: 0x5b7f8c, hoverColor: 0x729aa8, depth: 20,
    });
  }

  createPreview() {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.08);
    g.fillEllipse(600, 612, 250, 46);
    g.fillStyle(0xe6f4fa, 1);
    g.fillEllipse(600, 602, 226, 40);
    this.preview = this.add.image(600, 600, isoKey(this.player.skin)).setOrigin(0.5, 1);
    this.previewName = this.add
      .text(600, 630, '', { fontFamily: FONT, fontSize: '20px', fontStyle: 'bold', color: '#24444f' })
      .setOrigin(0.5);
  }

  createNameField() {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.92);
    g.fillRoundedRect(410, 124, 460, 62, 16);
    g.lineStyle(3, 0x8fb7c7, 1);
    g.strokeRoundedRect(410, 124, 460, 62, 16);
    this.nameText = this.add
      .text(W / 2, 155, 'Имя персонажа', { fontFamily: FONT, fontSize: '28px', color: '#8aa6b0' })
      .setOrigin(0.5);
    this.caret = this.add
      .text(W / 2, 155, '|', { fontFamily: FONT, fontSize: '30px', color: '#2f5d6b' })
      .setOrigin(0, 0.5)
      .setVisible(false);
    this.hintText = this.add
      .text(W / 2, 204, 'Нажмите на поле, чтобы ввести имя, или выберите случайное', { fontFamily: FONT, fontSize: '18px', color: '#8aa6b0' })
      .setOrigin(0.5);
    // Телефон без клавиатуры: тап по полю открывает системное окно ввода.
    this.add.zone(640, 155, 460, 62).setInteractive({ useHandCursor: true })
      .on('pointerup', () => askName(this));
    createButton(this, 985, 155, 'Случайное', () => randomName(this), {
      width: 170, height: 52, fontSize: 20, color: 0x2f80c9, hoverColor: 0x4a9be0, depth: 20,
    });
    this.time.addEvent({
      delay: 520,
      loop: true,
      callback: () => {
        this.caretOn = !this.caretOn;
        updateNameField(this);
      },
    });
  }

  createRoles() {
    this.add
      .text(235, 250, 'Роль', { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#2f5d6b' })
      .setOrigin(0.5);
    PLAYER_ROLES.forEach((role, index) => {
      const y = 310 + index * 62;
      createButton(this, 235, y, role.title, () => {
        this.player.role = role.id;
        this.player.skin = role.sprite;
        this.refresh();
      }, {
        width: 220, height: 52, fontSize: 22, color: 0x3f7fae, hoverColor: 0x5494c4, depth: 10,
      });
      const mark = this.add
        .text(356, y, '✓', { fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#2f7f4f' })
        .setOrigin(0.5)
        .setVisible(false);
      this.roleMarks.push({ role: role.id, mark });
    });
    this.add
      .text(235, 440, 'Роль задаёт иконку над головой', {
        fontFamily: FONT, fontSize: '15px', color: '#4d7b8a', align: 'center', wordWrap: { width: 220 },
      })
      .setOrigin(0.5);
  }

  createSkins() {
    this.add
      .text(980, 232, 'Облик (бесплатно)', { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#2f5d6b' })
      .setOrigin(0.5);
    FREE_SKINS.forEach((skin, index) => {
      const x = 900 + index * 160;
      const y = 352;
      const card = this.add.container(x, y).setDepth(10);
      const bg = this.add.graphics();
      const img = this.add.image(0, -34, isoKey(skin.id));
      const fit = Math.min(110 / img.height, 84 / img.width);
      img.setScale(fit);
      const title = this.add
        .text(0, 46, skin.title, {
          fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#24444f', align: 'center', wordWrap: { width: 140 },
        })
        .setOrigin(0.5, 0);
      const zone = this.add.zone(0, 0, 150, 190).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        this.player.skin = skin.id;
        this.refresh();
      });
      card.add([bg, img, title, zone]);
      this.skinCards.push({ id: skin.id, bg, title, card });
    });
  }

  paintSkinCards() {
    this.skinCards.forEach((entry) => {
      const on = entry.id === this.player.skin;
      entry.bg.clear();
      entry.bg.fillStyle(on ? 0xdff4ea : 0xffffff, 0.94);
      entry.bg.fillRoundedRect(-75, -95, 150, 190, 16);
      entry.bg.lineStyle(on ? 4 : 2, on ? 0x2f7f4f : 0x8fb7c7, 1);
      entry.bg.strokeRoundedRect(-75, -95, 150, 190, 16);
    });
  }

  createAccents() {
    this.add
      .text(980, 492, 'Акцент роли', { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#2f5d6b' })
      .setOrigin(0.5);
    ACCENTS.forEach((accent, index) => {
      const x = 860 + index * 60;
      const dot = this.add.circle(x, 532, 20, accent.color).setDepth(10);
      dot.setInteractive({ useHandCursor: true });
      dot.on('pointerup', () => {
        this.player.accent = accent.id;
        this.refresh();
      });
      this.accentDots.push({ id: accent.id, dot });
    });
    this.add
      .text(980, 568, 'Цвет плашки и имени', { fontFamily: FONT, fontSize: '15px', color: '#4d7b8a' })
      .setOrigin(0.5);
  }

  paintAccents() {
    this.accentDots.forEach((entry) => {
      const on = entry.id === this.player.accent;
      entry.dot.setStrokeStyle(on ? 5 : 2, on ? 0x24444f : 0xffffff, on ? 1 : 0.8);
    });
  }

  createFooter() {
    createButton(this, W / 2, 675, 'Готово', () => this.finish(), {
      width: 280, height: 56, fontSize: 26, color: 0x3f9b4a, hoverColor: 0x55b963, depth: 20,
    });
  }

  refresh() {
    const skin = skinById(this.player.skin);
    const accent = accentById(this.player.accent);
    this.preview.setTexture(isoKey(skin.id));
    this.preview.setScale(310 / this.preview.height);
    this.previewName.setText(skin.title).setColor(`#${accent.color.toString(16).padStart(6, '0')}`);
    this.roleMarks.forEach((entry) => entry.mark.setVisible(entry.role === this.player.role));
    this.paintSkinCards();
    this.paintAccents();
  }

  finish() {
    const name = this.nameValue.trim();
    if (!name) {
      this.hintText.setColor('#d05c5c').setText('Введите имя персонажа');
      return;
    }
    const player = normalizePlayer({ ...this.player, name });
    const saved = loadIsoSave();
    saveIso(saved ? saved.coins : null, saved ? saved.items : null, player);
    this.scene.start('IsoHospitalScene');
  }

  goBack() {
    this.scene.start('MenuScene');
  }
}
