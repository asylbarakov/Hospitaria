// Экран найма персонала (этап 15): карточки ролей, нанятые и увольнение.
// Живёт внутри IsoHospitalHud отдельным слоем, чтобы HUD оставался коротким.

import { STAFF_ROLES, staffUnlockLevel } from '../data/staffCatalog.js';
import { isoKey } from './isoAssets.js';
import { button as uiButton, plate, windowFrame } from '../ui/IsoUi.js';

const FONT = 'Arial, "Segoe UI", sans-serif';
const CARD_W = 220;
const CARD_H = 196;
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

    const shade = scene.add.rectangle(640, 360, 1280, 720, 0x06141d, 0.78).setInteractive();
    this.root.add(shade);
    this.root.add(windowFrame(scene, 640, 360, 1216, 664));

    this.root.add(plate(scene, 208, 100, 250, 56, { tint: 0x123240 }));
    this.root.add(scene.add.text(104, 100, 'Персонал', {
      fontFamily: FONT, fontSize: '32px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0, 0.5));
    this.root.add(scene.add.text(76, 204, 'Нанятые сотрудники работают сами: лечат, регистрируют и убирают.', {
      fontFamily: FONT, fontSize: '17px', color: '#4d7b8a',
    }));
    this.root.add(scene.add.text(772, 204, 'Наняты', {
      fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#1b4b5a',
    }));

    this.cards = STAFF_ROLES.map((role, index) => this.makeCard(role, index));
    this.rows = [];
    for (let i = 0; i < ROWS; i += 1) {
      this.root.add(this.makeRow(i));
    }
    this.footer = scene.add.text(72, 655, '', {
      fontFamily: FONT, fontSize: '17px', color: '#1b4b5a',
    }).setOrigin(0, 0.5);
    this.root.add(this.footer);
    this.empty = scene.add.text(1000, 262, 'Пока никого не наняли', {
      fontFamily: FONT, fontSize: '17px', color: '#4d7b8a',
    }).setOrigin(0.5, 0);
    this.root.add(this.empty);

    const close = uiButton(scene, 1010, 100, 'Закрыть', () => this.hide(), {
      width: 160, height: 56, fontSize: 18, variant: 'gray',
    });
    this.root.add(close);
  }

  makeCard(role, index) {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const card = this.scene.add.container(158 + col * 240, 330 + row * 210);
    card.role = role;
    card.unlockLevel = staffUnlockLevel(role);
    card.add(plate(this.scene, 0, 0, CARD_W, CARD_H, { tint: 0x14303f }));

    const img = this.scene.add.image(-82, -30, isoKey(role.sprite));
    img.setScale(Math.min(52 / img.width, 70 / img.height));
    card.add(img);
    card.add(this.scene.add.text(-48, -84, role.title, {
      fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#ffffff',
    }));
    card.add(this.scene.add.text(-48, -60, `Найм ${role.price}`, {
      fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffe082',
    }));
    card.add(this.scene.add.text(-48, -38, `Зарплата ${role.salary}/день`, {
      fontFamily: FONT, fontSize: '16px', color: '#b9e6df',
    }));
    card.add(this.scene.add.text(-CARD_W / 2 + 10, 4, role.hint, {
      fontFamily: FONT, fontSize: '16px', color: '#dff3ff', wordWrap: { width: CARD_W - 20 },
    }));

    card.hireButton = uiButton(this.scene, 0, CARD_H / 2 - 22, 'Нанять', () => {
      this.hooks.onHire(role.id);
    }, { width: 150, height: 40, fontSize: 16, variant: 'green' });
    card.add(card.hireButton);
    // Бейдж уровня слева сверху: справа он наезжает на длинные названия ролей.
    card.lock = this.scene.add.text(-CARD_W / 2 + 10, -CARD_H / 2 + 8, `Ур. ${card.unlockLevel}`, {
      fontFamily: FONT, fontSize: '16px', fontStyle: 'bold', color: '#ffcc80',
    });
    card.add(card.lock);
    this.root.add(card);
    return card;
  }

  makeRow(index) {
    const row = this.scene.add.container(1000, 240 + index * 70);
    row.add(plate(this.scene, 0, 0, 450, 62, { tint: 0x14303f }));
    row.name = this.scene.add.text(-212, -14, '', {
      fontFamily: FONT, fontSize: '17px', fontStyle: 'bold', color: '#ffffff',
    });
    row.status = this.scene.add.text(-212, 8, '', {
      fontFamily: FONT, fontSize: '16px', color: '#b9e6df',
    });
    row.add(row.name);
    row.add(row.status);
    row.fire = uiButton(this.scene, 168, 0, 'Уволить', () => {
      const hired = this.hired[index];
      if (hired) {
        this.hooks.onFire(hired.id);
      }
    }, { width: 96, height: 44, fontSize: 16, variant: 'red' });
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

  update(state, coins, level = 1) {
    if (!this.root.visible || !state) {
      return;
    }
    this.hired = state.hired || [];
    this.cards.forEach((card) => {
      const locked = card.unlockLevel > level;
      // Не гасим всю карточку: текст должен оставаться контрастным.
      card.setAlpha(locked ? 0.9 : 1);
      card.lock.setVisible(locked);
      card.hireButton.setAlpha(locked ? 0.8 : (coins >= card.role.price ? 1 : 0.84));
    });
    const count = this.hired.length;
    this.empty.setVisible(count === 0);
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
