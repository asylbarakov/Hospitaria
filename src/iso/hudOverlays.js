// Настройки, пауза и обучение в HUD (этап 19). Вынесено из IsoHospitalHud,
// чтобы сцена HUD оставалась короче 300 строк; this = сцена HUD.

import { tileToScreen } from './IsoMath.js';

const hudOverlays = {
  togglePause() {
    const paused = this.scene.isPaused('IsoHospitalScene');
    if (paused) {
      this.scene.resume('IsoHospitalScene');
    } else {
      this.closePanels();
      this.scene.pause('IsoHospitalScene');
    }
    this.world().notify(paused ? 'Игра продолжается' : 'Пауза: больница ждёт');
  },

  toggleSettings() {
    if (this.settingsPanel.visible) {
      this.settingsPanel.hide();
      return;
    }
    this.closePanels();
    this.settingsPanel.show();
  },

  /** Применяет настройки в больнице и сохраняет их. */
  applySettings(next) {
    const main = this.world();
    main.applySettings(next);
    return main.settings;
  },

  saveOnboarding(state) {
    const main = this.world();
    main.settings = { ...main.settings, ...state };
    main.applySettings(main.settings);
    if (this.onboardingOverlay) {
      this.onboardingOverlay.update();
    }
  },

  restartOnboarding() {
    if (!this.onboarding) {
      return;
    }
    this.onboarding.restart();
    this.onboardingOverlay.step = -1;
    this.onboardingOverlay.update();
    this.world().notify('Обучение включено заново');
  },

  /** Куда ставить кольцо подсказки: экранные координаты цели текущего шага. */
  onboardingTarget(step) {
    const main = this.world();
    if (!main || !step || !step.target) {
      return null;
    }
    const screenOf = (actor, lift = 30) => main.iso.worldToScreen(actor.screen.x, actor.screen.y - lift);
    if (step.target.kind === 'player' && main.playerActor) {
      return screenOf(main.playerActor, 46);
    }
    if (step.target.kind === 'patient' && main.patients) {
      const agents = main.patients.views.agents();
      const view = agents.length ? main.patients.views.get(agents[0]) : null;
      if (view) {
        return screenOf(view.actor, 46);
      }
      // Пациент ещё не появился: подсказываем вход, откуда он придёт.
      const tile = main.world && main.world.entrance;
      if (tile) {
        const point = tileToScreen(tile.x + 0.5, tile.y + 0.5);
        return main.iso.worldToScreen(point.x, point.y - 24);
      }
    }
    if (step.target.kind === 'hud') {
      const entry = step.id === 'staff' ? this.staffButton : this.buildToggle;
      return { x: entry.container.x, y: entry.container.y, rect: { w: 180, h: 64 } };
    }
    if (step.target.kind === 'screen') {
      return null; // окно диагноза само привлекает внимание, кольцо в пустоте не нужно
    }
    return { x: step.target.x || 640, y: step.target.y || 360 };
  },
};

export default hudOverlays;
