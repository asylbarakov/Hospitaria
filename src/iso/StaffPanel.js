// Экран найма персонала (этап 15): карточки ролей, нанятые и увольнение.
// Живёт внутри IsoHospitalHud отдельным слоем, чтобы HUD оставался коротким.

import { STAFF_ROLES } from '../data/staffCatalog.js';
import { isoKey } from './isoAssets.js';
import { createButton } from '../ui/Button.js';

const FONT = 'Arial, "Segoe UI", sans-serif';
const CARD_W = 220;
const CARD_H = 150;
const ROWS = 6;

export default class StaffPanel {
  /**
   * @param {Phaser.Scene} scene
   * @param {{onHire:Function, onFire:Function, onClose:Function}} hooks
   */
  constructor(scene, hooks) {
    this.scene = scene;
    this.hooks = hooks;
    this.hired = [];
    this.root = scene.add.container(0, 0).setDepth(20).setVisible(false);

    const bg = scene.add.graphics();
    bg.fillStyle(0x0b1a24, 0.97);
    bg.fillRect(0, 0, 1280, 720);
    bg.lineStyle(4, 0x4fb3a5, 1);
    bg.strokeRect(8, 8, 1264, 704);
    this.root.add(bg);

    this.root.add(scene.add.text(40, 28, 'Персонал', {
      fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: '#ffffff',
    }));
    this.root.add(scene.add.text(40, 72, 'Нанятые сотрудники работают сами: лечат, регистрируют и убирают.', {
      fontFamily: FONT, fontSize: '17px', color: '#b9e6df',
    }));
    this.root.add(scene.add.text(830, 96, 'Наняты', {
      fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#ffe082',
    }));

    this.cards = STAFF_ROLES.map((role, index) => this.makeCard(role, index));
    this.rows = [];
    for (let i = 0; i < ROWS; i += 1) {
      this.root.add(this.makeRow(i));
    }
    this.footer = scene.add.text(40, 646, '', {
      fontFamily: FONT, fontSize: '17px', color: '#dff3ff',
    });
    this.root.add(this.footer);

    const close = createButton(scene, 1180, 44, 'Закрыть', () => this.hide(), {
      width: 160, height: 44, fontSize: 18, color: 0x5b7f8c, hoverColor: 0x729aa8,
    });
    this.root.add(close);
  }

  makeCard(role, index) {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const card = this.scene.add.container(130 + col * 232, 226 + row * 172);
    card.role = role;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x14303f, 1);
    bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 14);
    bg.lineStyle(2, 0x4fb3a5, 1);
    bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 14);
    card.add(bg);

    const img = this.scene.add.image(-68, -20, isoKey(role.sprite));
    img.setScale(Math.min(64 / img.width, 92 / img.height));
    card.add(img);
    card.add(this.scene.add.text(4, -58, role.title, {
      fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#ffffff',
    }));
    card.add(this.scene.add.text(4, -30, `Найм ${role.price}`, {
      fontFamily: FONT, fontSize: '15px', fontStyle: 'bold', color: '#ffe082',
    }));
    card.add(this.scene.add.text(4, -8, `Зарплата ${role.salary}/день`, {
      fontFamily: FONT, fontSize: '12px', color: '#b9e6df',
    }));
    card.add(this.scene.add.text(-CARD_W / 2 + 8, 18, role.hint, {
      fontFamily: FONT, fontSize: '12px', color: '#dff3ff', wordWrap: { width: CARD_W - 16 },
    }));

    card.hireButton = createButton(this.scene, 0, CARD_H / 2 - 18, 'Нанять', () => {
      this.hooks.onHire(role.id);
    }, { width: 124, height: 32, fontSize: 15, color: 0x3f9b4a, hoverColor: 0x55b963 });
    card.add(card.hireButton);
    this.root.add(card);
    return card;
  }

  makeRow(index) {
    const row = this.scene.add.container(1020, 145 + index * 70);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x14303f, 1);
    bg.fillRoundedRect(-210, -29, 420, 58, 12);
    row.add(bg);
    row.name = this.scene.add.text(-194, -12, '', {
      fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#ffffff',
    });
    row.status = this.scene.add.text(-194, 12, '', {
      fontFamily: FONT, fontSize: '13px', color: '#b9e6df',
    });
    row.add(row.name);
    row.add(row.status);
    row.fire = createButton(this.scene, 158, 0, 'Уволить', () => {
      const hired = this.hired[index];
      if (hired) {
        this.hooks.onFire(hired.id);
      }
    }, { width: 90, height: 34, fontSize: 14, color: 0x8a4a4a, hoverColor: 0xa96060 });
    row.add(row.fire);
    row.setVisible(false);
    this.rows.push(row);
    this.root.add(row);
    return row;
  }

  get visible() {
    return this.root.visible;
  }

  show() {
    this.root.setVisible(true);
  }

  hide() {
    this.root.setVisible(false);
  }

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  update(state, coins) {
    if (!this.root.visible || !state) {
      return;
    }
    this.hired = state.hired || [];
    this.cards.forEach((card) => {
      card.hireButton.setAlpha(coins >= card.role.price ? 1 : 0.55);
    });
    const count = this.hired.length;
    this.footer.setText(`Нанято ${count} из ${state.max}  •  Зарплата за день: ${state.salary}  •  Пятен: ${state.dirt}`);
    this.rows.forEach((row, index) => {
      const hired = this.hired[index];
      row.setVisible(!!hired);
      if (!hired) {
        return;
      }
      row.name.setText(`${hired.name} — ${hired.title}`);
      row.status.setText(hired.postTitle ? `${hired.status} • ${hired.postTitle}` : hired.status);
    });
  }
}
