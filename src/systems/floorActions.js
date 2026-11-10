import { todayKey } from './DailyTasks.js';
import { ROOMS } from '../data/rooms.js';
import { checkAchievements } from './Achievements.js';
import { playCoin } from './Sound.js';
import { spawnRewardBurst } from '../ui/particles.js';

const FONT = 'Arial, "Segoe UI", sans-serif';

const ROOM_ACTIONS = {
  lab: { label: 'Анализы', color: 0x4f9c94 },
  pharmacy: { label: 'Магазин', color: 0x7c9c3f },
  rest: { label: 'Отдохнуть', color: 0xc98a4b },
  archive: { label: 'Успехи', color: 0x8d7bb5 },
  staff: { label: 'Как играть', color: 0x5b7f8c },
};

function ensureDaily(saveData) {
  if (!saveData.daily || typeof saveData.daily !== 'object') {
    saveData.daily = {};
  }
  return saveData.daily;
}

function canClaim(saveData, key) {
  return ensureDaily(saveData)[key] !== todayKey();
}

function markClaimed(saveData, key) {
  ensureDaily(saveData)[key] = todayKey();
}

export function showFloorToast(scene, text, color = '#2e7d32') {
  const camera = scene.cameras.main;
  const x = camera.scrollX + 640;
  const y = camera.scrollY + 300;

  const label = scene.add
    .text(x, y, text, {
      fontFamily: FONT,
      fontSize: '21px',
      fontStyle: 'bold',
      color,
      backgroundColor: '#ffffff',
      padding: { x: 18, y: 10 },
    })
    .setOrigin(0.5)
    .setDepth(60);

  scene.tweens.add({
    targets: label,
    y: y - 56,
    alpha: 0,
    duration: 1700,
    ease: 'Quad.easeOut',
    onComplete: () => label.destroy(),
  });
}

function claimLab(scene) {
  if (!canClaim(scene.saveData, 'lab')) {
    showFloorToast(scene, 'Анализы на сегодня уже готовы', '#5b7f8c');
    return;
  }

  markClaimed(scene.saveData, 'lab');
  scene.addCoins(45);
  scene.addXp(12);
  scene.persistStats();
  checkAchievements(scene);
  playCoin();
  spawnRewardBurst(scene, scene.playerX, scene.playerY - 220, 14);
  showFloorToast(scene, 'Анализы готовы: +45 монет, +12 опыта');
}

function claimRest(scene) {
  if (!canClaim(scene.saveData, 'rest')) {
    showFloorToast(scene, 'Вы уже отдохнули сегодня', '#5b7f8c');
    return;
  }

  markClaimed(scene.saveData, 'rest');
  scene.changeReputation(6);
  scene.persistStats();
  checkAchievements(scene);
  playCoin();
  showFloorToast(scene, 'Отдых помог: +6 репутации');
}

export function handleRoomAction(scene, roomId) {
  if (!scene || scene.registry.get('uiModal')) {
    return;
  }

  const ui = scene.scene.get('UIScene');

  if (roomId === 'lab') {
    claimLab(scene);
    return;
  }

  if (roomId === 'rest') {
    claimRest(scene);
    return;
  }

  if (!ui) {
    return;
  }

  if (roomId === 'pharmacy' && ui.openShop) {
    ui.openShop();
  } else if (roomId === 'archive' && ui.openAchievements) {
    ui.openAchievements();
  } else if (roomId === 'staff' && ui.openHelp) {
    ui.openHelp();
  }
}

export function createRoomActionZones(scene) {
  ROOMS.forEach((room) => {
    const action = ROOM_ACTIONS[room.id];
    if (!action || room.floor !== 2) {
      return;
    }

    const x = room.x + room.width - 120;
    const y = room.y + 235;

    const pill = scene.add.graphics().setDepth(5);
    pill.fillStyle(0x0b1e28, 0.18);
    pill.fillRoundedRect(x - 94, y - 25, 188, 58, 18);
    pill.fillStyle(action.color, 0.96);
    pill.fillRoundedRect(x - 94, y - 29, 188, 58, 18);
    pill.lineStyle(3, 0xffffff, 0.7);
    pill.strokeRoundedRect(x - 94, y - 29, 188, 58, 18);

    scene.add
      .text(x, y, action.label, {
        fontFamily: FONT,
        fontSize: '19px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(6);

    const zone = scene.add
      .zone(x, y, 190, 62)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerdown', () => {
      scene.objectClickGuard = true;
      handleRoomAction(scene, room.id);
    });
  });
}

export default createRoomActionZones;
