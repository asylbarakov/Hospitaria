// Спрайты пациентов на сцене (этап 14): актёр, шкала терпения, всплывающие числа.
// Логика цикла живёт в PatientFlow, здесь только Phaser-объекты и тап по пациенту.

import { PATIENT_SKINS, diseaseIcon } from '../data/actorConfig.js';
import { iconKey } from './isoAssets.js';

const FONT = 'Arial, "Segoe UI", sans-serif';
const BAR_Y = -210;
const BAR_SCALE = 0.18;
const LOW_PATIENCE = 0.3;
const ICON_SCALE = 0.16;
// Ключи текстур из assets/final/ui (iso_<путь через _>).
const BAR_TEXTURE = 'iso_ui_ui_bar';
const BAR_FILL_TEXTURE = 'iso_ui_ui_bar_fill';

export default class PatientViews {
  /**
   * @param {Phaser.Scene} scene
   * @param {import('./ActorLayer.js').default} actors
   * @param {(agent:object)=>void} onTap
   */
  constructor(scene, actors, onTap) {
    this.scene = scene;
    this.actors = actors;
    this.onTap = typeof onTap === 'function' ? onTap : () => {};
    this.map = new Map();
  }

  get(agent) {
    return this.map.get(agent) || null;
  }

  count() {
    return this.map.size;
  }

  agents() {
    return [...this.map.keys()];
  }

  create(agent, entrance) {
    const actor = this.actors.spawn({
      kind: 'patient',
      x: entrance.x,
      y: entrance.y,
      sprite: agent.skin || PATIENT_SKINS[0],
      name: agent.name,
      icon: diseaseIcon(agent.disease.id),
      accent: agent.disease.color,
    });
    actor.sprite.setInteractive({ useHandCursor: true });
    actor.sprite.on('pointerdown', () => {
      this.scene.patientClickGuard = true;
      this.onTap(agent);
    });

    const frame = this.scene.add.image(0, BAR_Y, BAR_TEXTURE).setScale(BAR_SCALE);
    const fill = this.scene.add.image(0, BAR_Y, BAR_FILL_TEXTURE).setScale(BAR_SCALE);
    const patience = this.scene.add
      .image(-68, BAR_Y, iconKey('icon_patience'))
      .setScale(ICON_SCALE);
    actor.root.add([frame, fill, patience]);
    this.map.set(agent, {
      actor, frame, fill, patience, low: false,
    });
  }

  destroy(agent) {
    const view = this.map.get(agent);
    if (!view) {
      return false;
    }
    this.map.delete(agent);
    this.actors.remove(view.actor);
    return true;
  }

  clear() {
    this.agents().forEach((agent) => this.destroy(agent));
  }

  /** Шкала терпения: заполнение слева направо и красный цвет при малом запасе. */
  updateBar(agent) {
    const view = this.get(agent);
    if (!view) {
      return;
    }
    const ratio = agent.patienceRatio();
    view.fill.setScale(BAR_SCALE * ratio, BAR_SCALE);
    const low = ratio < LOW_PATIENCE;
    if (low !== view.low) {
      view.low = low;
      view.fill.setTint(low ? 0xff8a80 : 0xffffff);
    }
    const show = !agent.diagnosed;
    view.frame.setVisible(show);
    view.fill.setVisible(show);
    view.patience.setVisible(show);
  }

  /** Короткая надпись над головой: награда или штраф. */
  float(agent, text, color) {
    const view = this.get(agent);
    if (!view) {
      return;
    }
    const label = this.scene.add
      .text(view.actor.root.x, view.actor.root.y - 190, text, {
        fontFamily: FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        color,
        stroke: '#10222e',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(9500);
    this.scene.tweens.add({
      targets: label,
      y: label.y - 70,
      alpha: 0,
      duration: 1300,
      ease: 'Quad.easeOut',
      onComplete: () => label.destroy(),
    });
  }
}
