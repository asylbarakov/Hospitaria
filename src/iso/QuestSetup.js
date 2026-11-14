// Сборка заданий (этап 16): шина событий, Quests и уведомление о выполнении.

import EventBus from '../systems/EventBus.js';
import Quests from '../systems/Quests.js';

/**
 * @param {Phaser.Scene} scene
 * @param {{quests?:object}|null} saved
 * @returns {{bus: EventBus, quests: Quests}}
 */
export default function createQuests(scene, saved) {
  const bus = new EventBus();
  const quests = new Quests({
    bus,
    saved: saved ? saved.quests : null,
    onChange: () => scene.persist(),
  });
  bus.on('questCompleted', ({ quest }) => {
    scene.notify(`Задание выполнено: ${quest.title}. Заберите награду!`);
  });
  return { bus, quests };
}
