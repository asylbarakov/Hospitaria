import { findShopItem } from '../data/shopItems.js';
import { ROOMS, FLOOR_Y } from '../data/rooms.js';
import { drawFurniture } from './furniturePainter.js';
import { isItemUnlocked } from './Economy.js';

export function ownsItem(scene, itemId) {
  const owned = scene.saveData && Array.isArray(scene.saveData.ownedItems)
    ? scene.saveData.ownedItems
    : [];
  return owned.includes(itemId);
}

export function isItemEquipped(scene, item) {
  const effect = item && item.effect;
  const player = scene.saveData && scene.saveData.player;
  if (!effect || effect.kind !== 'avatar' || !player) {
    return false;
  }
  return player[effect.field] === effect.value;
}

function applyItem(scene, item) {
  const effect = item.effect || {};

  if (effect.kind === 'avatar') {
    const player = scene.saveData.player || {};
    player[effect.field] = effect.value;
    scene.saveData.player = player;
    if (scene.avatar) {
      scene.avatar.setConfig(player);
    }
    return;
  }

  if (effect.kind === 'furniture') {
    const list = Array.isArray(scene.saveData.furniture) ? scene.saveData.furniture : [];
    if (!list.includes(item.id)) {
      scene.saveData.furniture = [...list, item.id];
    }
    if (scene.refreshFurniture) {
      scene.refreshFurniture();
    }
  }
}

export function purchaseItem(scene, item) {
  if (!scene || !scene.saveData || !item) {
    return { ok: false, reason: 'error' };
  }

  const level = Number(scene.registry.get('level')) || 1;
  if (!isItemUnlocked(item, level)) {
    return { ok: false, reason: 'level' };
  }

  if (ownsItem(scene, item.id)) {
    applyItem(scene, item);
    scene.persistStats();
    return { ok: true, owned: true };
  }

  const coins = Number(scene.registry.get('coins')) || 0;
  if (coins < item.price) {
    return { ok: false, reason: 'coins' };
  }

  scene.registry.set('coins', coins - item.price);
  scene.saveData.ownedItems = [...(scene.saveData.ownedItems || []), item.id];
  applyItem(scene, item);
  scene.persistStats();

  return { ok: true };
}

export function equipItem(scene, item) {
  if (!scene || !scene.saveData || !item || !ownsItem(scene, item.id)) {
    return false;
  }
  applyItem(scene, item);
  scene.persistStats();
  return true;
}

export function refreshFurniture(scene) {
  if (!scene) {
    return;
  }

  if (scene.furnitureLayer) {
    scene.furnitureLayer.destroy();
    scene.furnitureLayer = null;
  }

  const ids = scene.saveData && Array.isArray(scene.saveData.furniture)
    ? scene.saveData.furniture
    : [];
  if (ids.length === 0) {
    return;
  }

  const g = scene.add.graphics().setDepth(1);
  ids.forEach((id) => {
    const item = findShopItem(id);
    const effect = item && item.effect;
    if (!effect || effect.kind !== 'furniture') {
      return;
    }
    const room = ROOMS.find((entry) => entry.id === effect.room);
    if (!room) {
      return;
    }
    drawFurniture(g, effect.type, room.x + effect.x, FLOOR_Y);
  });

  scene.furnitureLayer = g;
}

export default purchaseItem;
