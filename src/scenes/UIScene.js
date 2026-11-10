import { createButton } from '../ui/Button.js';
import { createBottomBar } from '../ui/BottomBar.js';
import { openHelpPanel } from '../ui/HelpPanel.js';
import { openDialog } from '../ui/Dialog.js';
import { ensureVignette } from '../ui/textures.js';
import { ROLES } from '../data/avatarOptions.js';
import { xpToNextLevel } from '../data/progression.js';
import {
  HUD_FONT,
  drawTopBar,
  drawPill,
  drawCoinIcon,
  drawHeartIcon,
  drawCrossIcon,
  drawXpBar,
} from '../ui/hudDrawing.js';

const W = 1280;

function formatNumber(value) {
  return String(Math.max(0, Math.floor(Number(value) || 0)))
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  create() {
    this.helpRoot = null;
    this.activeDialog = null;

    this.buildHud();
    this.buildBottomBar();
    this.bindRegistry();
    this.refresh();
  }

  buildHud() {
    // Лёгкая виньетка по краям кадра: одна готовая текстура, без затрат в кадре.
    ensureVignette(this, 'ui-vignette', W, 720);
    this.add.image(W / 2, 360, 'ui-vignette').setDepth(-1);

    const g = this.add.graphics().setDepth(0);

    drawTopBar(g, W);
    drawPill(g, 174, 20, 240, 58, 0xe9f6fb, 0xbfdde9);
    drawPill(g, 428, 20, 296, 58, 0xf2fafc, 0xbfdde9);
    drawPill(g, 738, 22, 140, 54, 0xfff4d6, 0xefd48a);
    drawPill(g, 892, 22, 130, 54, 0xffe8ee, 0xefb9c9);
    drawPill(g, 1036, 20, 220, 58, 0xeaf3ff, 0xb9cdf0);

    createButton(this, 90, 48, 'Меню', () => this.openMenu(), {
      width: 140,
      height: 48,
      fontSize: 19,
      color: 0x5b7f8c,
      hoverColor: 0x729aa8,
      depth: 2,
    });

    this.portrait = this.add.graphics().setDepth(1);

    this.playerNameText = this.add
      .text(246, 37, '', {
        fontFamily: HUD_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#24444f',
      })
      .setOrigin(0, 0.5)
      .setDepth(2);

    this.playerRoleText = this.add
      .text(246, 59, '', {
        fontFamily: HUD_FONT,
        fontSize: '13px',
        color: '#5b7f8c',
      })
      .setOrigin(0, 0.5)
      .setDepth(2);

    this.add
      .text(576, 35, 'КОМНАТА', {
        fontFamily: HUD_FONT,
        fontSize: '11px',
        color: '#6b8e99',
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.roomText = this.add
      .text(576, 57, '', {
        fontFamily: HUD_FONT,
        fontSize: '19px',
        fontStyle: 'bold',
        color: '#2f5d6b',
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.coinIcon = this.add.graphics().setDepth(1);
    drawCoinIcon(this.coinIcon, 762, 48, 13);

    this.coinText = this.add
      .text(784, 48, '0', {
        fontFamily: HUD_FONT,
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#8a5a00',
      })
      .setOrigin(0, 0.5)
      .setDepth(2);

    this.heartIcon = this.add.graphics().setDepth(1);
    drawHeartIcon(this.heartIcon, 916, 47, 13, 0xe05c7a);

    this.repText = this.add
      .text(938, 48, '50', {
        fontFamily: HUD_FONT,
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#b23b5e',
      })
      .setOrigin(0, 0.5)
      .setDepth(2);

    this.levelText = this.add
      .text(1052, 36, 'Ур. 1', {
        fontFamily: HUD_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#2f5d6b',
      })
      .setOrigin(0, 0.5)
      .setDepth(2);

    this.xpText = this.add
      .text(1244, 36, '0 / 100 XP', {
        fontFamily: HUD_FONT,
        fontSize: '12px',
        color: '#5b7f8c',
      })
      .setOrigin(1, 0.5)
      .setDepth(2);

    this.xpBar = this.add.graphics().setDepth(1);
  }

  buildBottomBar() {
    createBottomBar(this, {
      onHelp: () => this.toggleHelp(),
      onShop: () => this.openShop(),
      onTasks: () => this.openTasks(),
      onAchievements: () => this.openAchievements(),
    });
  }

  bindRegistry() {
    this.onRegistryChange = () => this.refresh();
    this.registry.events.on('changedata', this.onRegistryChange);

    this.events.once('shutdown', () => {
      this.registry.events.off('changedata', this.onRegistryChange);
      this.registry.set('uiModal', false);
      this.helpRoot = null;
      this.activeDialog = null;
    });
  }

  refresh() {
    const level = Math.max(1, Math.floor(Number(this.registry.get('level')) || 1));
    const xp = Math.max(0, Number(this.registry.get('xp')) || 0);
    const need = xpToNextLevel(level);
    const progress = need > 0 ? xp / need : 0;
    const roleId = this.registry.get('playerRole') || 'doctor';
    const role = ROLES.find((item) => item.id === roleId);

    this.playerNameText.setText(this.registry.get('playerName') || 'Игрок');
    this.playerRoleText.setText(role ? role.label : 'Врач');
    this.coinText.setText(formatNumber(this.registry.get('coins')));
    this.repText.setText(formatNumber(this.registry.get('reputation')));
    this.levelText.setText(`Ур. ${level}`);
    this.xpText.setText(`${formatNumber(Math.min(xp, need))} / ${formatNumber(need)} XP`);
    this.roomText.setText(this.registry.get('currentRoom') || 'Больница');

    this.portrait.clear();
    drawCrossIcon(this.portrait, 216, 49, 21, roleId === 'nurse' ? 0x4f9c94 : 0x4a6b8a);

    drawXpBar(this.xpBar, 1052, 52, 192, 12, progress);
  }

  showPatientDialog(patient) {
    if (!patient || !patient.disease) {
      return;
    }

    if (this.activeDialog) {
      this.closeDialog();
    }
    if (this.helpRoot) {
      this.closeHelp();
    }

    this.registry.set('uiModal', true);

    const symptoms = patient.disease.symptoms.map((item) => `• ${item}`).join('\n');
    const text = [
      '«Здравствуйте! Мне нездоровится. Помогите, пожалуйста.»',
      '',
      'Жалобы:',
      symptoms,
      '',
      `Пациент направлен в комнату «${patient.roomTitle}».`,
    ].join('\n');

    this.activeDialog = openDialog(this, {
      title: `Пациент ${patient.name}`,
      subtitle: 'Жалобы пациента',
      text,
      accent: patient.disease.color,
      buttons: [{
        label: 'Начать приём',
        onClick: () => this.startPatientTreatment(patient),
      }],
      onClose: () => {
        this.activeDialog = null;
        this.registry.set('uiModal', false);
      },
    });
  }

  closeDialog() {
    if (this.activeDialog) {
      this.activeDialog.close();
    }
  }

  startPatientTreatment(patient) {
    const hospital = this.scene.get('HospitalScene');
    if (hospital && hospital.startTreatment) {
      hospital.startTreatment(patient);
    }
  }

  closeModal() {
    if (this.activeDialog) {
      this.closeDialog();
      return;
    }
    if (this.helpRoot) {
      this.closeHelp();
      return;
    }
    this.registry.set('uiModal', false);
  }

  openMenu() {
    const hospital = this.scene.get('HospitalScene');
    if (hospital && hospital.openPauseMenu) {
      hospital.openPauseMenu();
    } else if (hospital && hospital.leaveToMenu) {
      hospital.leaveToMenu();
    }
  }

  openShop() {
    if (this.activeDialog || this.helpRoot || this.scene.isActive('ShopScene')) {
      return;
    }
    this.registry.set('uiModal', true);
    this.scene.launch('ShopScene', { tab: 'clothes' });
  }

  openTasks() {
    if (this.activeDialog || this.helpRoot || this.scene.isActive('TasksScene')) {
      return;
    }
    this.registry.set('uiModal', true);
    this.scene.launch('TasksScene');
  }

  openAchievements() {
    if (
      this.activeDialog
      || this.helpRoot
      || this.scene.isActive('AchievementsScene')
      || this.scene.isActive('ShopScene')
      || this.scene.isActive('TasksScene')
    ) {
      return;
    }
    this.registry.set('uiModal', true);
    this.scene.launch('AchievementsScene');
  }

  toggleHelp() {
    if (this.activeDialog) {
      return;
    }
    if (this.helpRoot) {
      this.closeHelp();
    } else {
      this.openHelp();
    }
  }

  openHelp() {
    if (this.helpRoot || this.activeDialog) {
      return;
    }

    this.registry.set('uiModal', true);
    this.helpRoot = openHelpPanel(this, () => this.closeHelp());
  }

  closeHelp() {
    if (this.helpRoot) {
      this.helpRoot.destroy(true);
      this.helpRoot = null;
    }
    this.registry.set('uiModal', false);
  }
}
