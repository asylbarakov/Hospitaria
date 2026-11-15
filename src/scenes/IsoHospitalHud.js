import { createButton } from '../ui/Button.js';
import StaffPanel from '../iso/StaffPanel.js';
import QuestPanel from '../iso/QuestPanel.js';
import ShopPanel from '../iso/ShopPanel.js';
import TopStatus from '../iso/TopStatus.js';
import DaySummary from '../iso/DaySummary.js';
import BuildPanel, { PANEL_Y } from '../iso/BuildPanel.js';
import { staffRole, staffUnlockLevel } from '../data/staffCatalog.js';

const FONT = 'Arial, "Segoe UI", sans-serif';

// HUD изометрической больницы: статус, кнопки, стройка, магазин, персонал, задания.
export default class IsoHospitalHud extends Phaser.Scene {
  constructor() {
    super('IsoHospitalHud');
  }

  create() {
    this.buttons = [];
    this.resetArmedUntil = 0;
    this.rects = [];

    this.status = new TopStatus(this);
    this.message = this.add
      .text(640, 72, '', { fontFamily: FONT, fontSize: '24px', fontStyle: 'bold', color: '#ffffff', stroke: '#b3261e', strokeThickness: 6 })
      .setOrigin(0.5).setDepth(12);
    this.hint = this.add
      .text(640, PANEL_Y - 22, '', { fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#ffffff', stroke: '#10222e', strokeThickness: 5 })
      .setOrigin(0.5).setDepth(10);

    this.buildPanel = new BuildPanel(this, {
      onSelect: (type, lock) => {
        if (lock) {
          this.world().notify(`Откроется на уровне ${lock}`);
          return;
        }
        if (this.state && this.state.build.active) {
          this.world().build.selectType(type);
        }
      },
    });
    this.addButton(1180, 40, 180, 'Меню', () => this.world().exitToMenu(), 0x5b7f8c, 0x729aa8);
    this.buildToggle = this.addButton(1180, 100, 180, 'Строить (B)', () => this.world().toggleBuild(), 0xe08a1e, 0xf2a43f);
    this.addButton(1180, 160, 180, 'Зум 100%', () => this.world().iso.setZoom(1), 0x3f9b4a, 0x55b963);
    this.addButton(1180, 220, 180, 'Гардероб', () => this.world().openWardrobe(), 0x7b5bb8, 0x9273cf);
    this.resetButton = this.addButton(1180, 280, 180, 'Сброс', () => this.onReset(), 0x8a4a4a, 0xa96060);
    this.staffPanel = new StaffPanel(this, {
      onHire: (roleId) => this.hire(roleId),
      onFire: (id) => {
        const staff = this.world().staff;
        if (staff) {
          staff.fire(id);
        }
      },
      onClose: () => this.staffPanel.hide(),
    });
    this.addButton(1180, 340, 180, 'Персонал', () => this.toggleStaff(), 0x2f80c9, 0x4a9be0);
    this.questPanel = new QuestPanel(this, {
      onClaim: (category, id) => this.claimQuest(category, id),
      onClose: () => this.questPanel.hide(),
      onShow: () => this.status.setVisible(false),
      onHide: () => this.status.setVisible(true),
    });
    this.questButton = this.addButton(1180, 400, 180, 'Задания', () => this.toggleQuests(), 0x8d7bb5, 0xa695cc);
    this.shopPanel = new ShopPanel(this, {
      onHire: (roleId) => this.hire(roleId),
      onPlace: (type) => {
        this.shopPanel.hide();
        this.world().build.setActive(true);
        this.world().build.selectType(type);
      },
      onClose: () => this.shopPanel.hide(),
      onShow: () => this.status.setVisible(false),
      onHide: () => this.status.setVisible(true),
      notify: (text) => this.world().notify(text),
    });
    this.addButton(1180, 460, 180, 'Магазин', () => this.toggleShop(), 0xc9622f, 0xe07a45);
    this.daySummary = new DaySummary(this, {
      onClose: () => {
        this.daySummary.hide();
        this.status.setVisible(true);
      },
    });

    const inBuild = () => this.state && this.state.build.active;
    this.rotateButton = this.addButton(1020, PANEL_Y + 55, 150, 'Повернуть', () => this.world().build.rotate(), 0x2f80c9, 0x4a9be0, inBuild, true);
    this.sellButton = this.addButton(1180, PANEL_Y + 55, 150, 'Продать', () => this.world().build.toggleSell(), 0xc9622f, 0xe07a45, inBuild, true);
    this.okButton = this.addButton(1020, PANEL_Y + 115, 150, 'Готово', () => this.world().build.confirm(), 0x3f9b4a, 0x55b963, () => inBuild() && this.state.build.hasTarget, true);
    this.cancelButton = this.addButton(1180, PANEL_Y + 115, 150, 'Отмена', () => this.world().build.cancel(), 0x5b7f8c, 0x729aa8, () => inBuild() && this.state.build.tool !== 'none', true);

    this.addButton(44, PANEL_Y + 90, 56, '◀', () => this.buildPanel.turnPage(-1), 0x5b7f8c, 0x729aa8, inBuild, true, 24);
    this.addButton(916, PANEL_Y + 90, 56, '▶', () => this.buildPanel.turnPage(1), 0x5b7f8c, 0x729aa8, inBuild, true, 24);
  }

  world() {
    return this.scene.get('IsoHospitalScene');
  }

  /** Найм с проверкой уровня: и StaffPanel, и ShopPanel зовут этот метод. */
  hire(roleId) {
    const role = staffRole(roleId);
    const level = this.state ? this.state.level : 1;
    if (role && staffUnlockLevel(role) > level) {
      this.world().notify(`Откроется на уровне ${staffUnlockLevel(role)}`);
      return { ok: false, hint: 'Уровень ещё не открыт' };
    }
    const staff = this.world().staff;
    const result = staff ? staff.hire(roleId) : { ok: false, hint: 'Персонал недоступен' };
    if (result && !result.ok) {
      this.world().notify(result.hint);
    }
    return result;
  }

  closePanels() {
    this.staffPanel.hide();
    this.questPanel.hide();
    this.shopPanel.hide();
    if (this.state && this.state.build.active) {
      this.world().build.setActive(false);
    }
  }

  toggleStaff() {
    if (this.staffPanel.visible) {
      this.staffPanel.hide();
      return;
    }
    this.closePanels();
    this.staffPanel.show();
  }

  toggleQuests() {
    if (this.questPanel.visible) {
      this.questPanel.hide();
      return;
    }
    this.closePanels();
    this.questPanel.show();
  }

  toggleShop() {
    if (this.shopPanel.visible) {
      this.shopPanel.hide();
      return;
    }
    this.closePanels();
    this.shopPanel.show();
  }

  claimQuest(category, id) {
    const main = this.world();
    if (!main.quests) {
      return { ok: false, hint: 'Задания недоступны' };
    }
    const result = main.quests.claim(category, id);
    if (result.ok) {
      main.stats.applyQuestReward(result.reward);
      main.notify(`Награда за задание: +${result.reward.coins} монет`);
    }
    return result;
  }

  setTopStatsVisible(visible) {
    this.status.setVisible(visible);
  }

  /** @param {boolean} [panelOnly] кнопка живёт только когда открыта панель. */
  addButton(x, y, width, label, onClick, color, hoverColor, shown = null, inPanel = false, fontSize = 20) {
    const height = 46;
    const guard = () => {
      if (!shown || shown()) {
        onClick();
      }
    };
    const container = createButton(this, x, y, label, guard, { width, height, fontSize, color, hoverColor, depth: 11 });
    const entry = { container, shown, inPanel, label: container.list[1] };
    this.buttons.push(entry);
    if (!inPanel) {
      this.rects.push({ x: x - width / 2 - 6, y: y - height / 2 - 6, w: width + 12, h: height + 14 });
    }
    return entry;
  }

  onReset() {
    const now = this.time.now;
    if (this.resetArmedUntil > now) {
      this.world().resetHospital();
      return;
    }
    this.resetArmedUntil = now + 3000;
    this.world().notify('Нажмите «Сброс» ещё раз: вернуть больницу в исходный вид');
  }

  /** Лежит ли указатель на элементе HUD (тогда он не двигает камеру и персонажа). */
  isOverUi(pointer) {
    if (this.staffPanel && this.staffPanel.visible) {
      return true;
    }
    if (this.questPanel && this.questPanel.visible) {
      return true;
    }
    if (this.shopPanel && this.shopPanel.visible) {
      return true;
    }
    if (this.daySummary && this.daySummary.visible) {
      return true;
    }
    if (this.state && this.state.build.active && pointer.y >= PANEL_Y) {
      return true;
    }
    return this.rects.some((r) => pointer.x >= r.x && pointer.x <= r.x + r.w && pointer.y >= r.y && pointer.y <= r.y + r.h);
  }

  hintFor(b) {
    return this.buildPanel.hintFor(b);
  }

  /** Совместимость со старыми тестами HUD: страницы каталога живут в BuildPanel. */
  turnPage(dir) {
    this.buildPanel.turnPage(dir);
  }

  showDaySummary(summary) {
    this.daySummary.show(summary);
    this.status.setVisible(false);
  }

  update(time) {
    const scene = this.world();
    if (!scene || !scene.hudState) {
      return;
    }
    const state = scene.hudState();
    this.state = state;
    const b = state.build;

    this.status.update(state);
    this.message.setText(state.message);
    this.buildPanel.update(b, state.level || 1);
    this.hint.setVisible(b.active).setText(b.active ? this.buildPanel.hintFor(b) : '');

    this.buildToggle.label.setText(b.active ? 'Готово (B)' : 'Строить (B)');
    this.sellButton.label.setText(b.tool === 'sell' ? 'Продажа' : 'Продать');
    this.resetButton.label.setText(this.resetArmedUntil > time ? 'Точно?' : 'Сброс');
    this.staffPanel.update(state.staff, state.coins, state.level || 1);
    this.questButton.label.setText(state.quests && state.quests.claimable ? 'Задания!' : 'Задания');
    this.questPanel.update(state.quests, state.coins, state.crystals || 0);
    this.shopPanel.update(state, state.coins, state.level || 1);
    this.buttons.forEach((entry) => {
      entry.container.setVisible(!entry.shown || entry.shown());
    });
  }
}
