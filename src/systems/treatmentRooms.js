// Этап 18: связь болезней, комнат и мини-игр без Phaser.
// Все проверки чистые, чтобы контракт можно было прогнать в node.

import { DISEASES } from '../data/diseases.js';
import { ROOMS } from '../data/layout.js';
import { roomForDisease } from '../data/patientFlow.js';
import {
  MINIGAME_KEYS,
  MINIGAME_TITLES,
  PLAYER_PRIORITY_DISEASES,
  ROOM_MINIGAMES,
} from '../data/treatmentConfig.js';

const ROOM_TITLES = Object.fromEntries(ROOMS.map((room) => [room.id, room.name]));

export function roomName(roomId) {
  return ROOM_TITLES[roomId] || 'Кабинет';
}

export function gamesForRoom(roomId) {
  const list = ROOM_MINIGAMES[roomId];
  return Array.isArray(list) ? list : [];
}

/** Игра для комнаты: сначала просимая болезнью, иначе первая допустимая. */
export function minigameForRoom(roomId, preferred = null) {
  const games = gamesForRoom(roomId);
  if (preferred && games.includes(preferred)) {
    return preferred;
  }
  return games[0] || null;
}

/** План приёма: комната, игра и подписи для экрана мини-игры. */
export function treatmentPlanFor(disease, roomId = null) {
  if (!disease) {
    return null;
  }
  const room = roomId || roomForDisease(disease);
  const game = minigameForRoom(room, disease.game);
  if (!game) {
    return null;
  }
  return {
    diseaseId: disease.id,
    roomId: room,
    roomName: roomName(room),
    game,
    title: MINIGAME_TITLES[game] || game,
  };
}

export function isPlayerPriorityDisease(disease) {
  return !!disease && PLAYER_PRIORITY_DISEASES.includes(disease.id);
}

/** Награда из результата MiniGameScene: экран и начисление должны совпадать. */
export function playerRewardFromResult(result) {
  if (!result || !Number.isFinite(result.coins)) {
    return null;
  }
  return {
    stars: Math.max(0, Math.min(3, Math.floor(Number(result.stars) || 0))),
    coins: Math.max(0, Math.floor(result.coins)),
    xp: Math.max(0, Math.floor(result.xp || 0)),
    crystals: Math.max(0, Math.floor(result.crystals || 0)),
    reputation: Number(result.reputation) || 0,
    skipped: !!result.skipped,
  };
}

/** Автоматически врач лечит только простые болезни: сложные остаются игроку. */
export function canAutoTreat(disease) {
  return !!treatmentPlanFor(disease) && !isPlayerPriorityDisease(disease);
}

/**
 * Контракт этапа 18: у каждой болезни есть комната, допустимая игра и награда.
 * @returns {{ok:boolean, issues:string[]}}
 */
export function validateTreatmentContract() {
  const issues = [];
  DISEASES.forEach((disease) => {
    const roomId = roomForDisease(disease);
    const games = gamesForRoom(roomId);
    if (!ROOM_TITLES[roomId]) {
      issues.push(`${disease.id}: неизвестная комната ${roomId}`);
    }
    if (!games.length) {
      issues.push(`${disease.id}: для комнаты ${roomId} нет мини-игр`);
    }
    const plan = treatmentPlanFor(disease);
    if (!plan || !MINIGAME_KEYS.includes(plan.game)) {
      issues.push(`${disease.id}: нет допустимой мини-игры`);
    } else if (disease.game && plan.game !== disease.game) {
      issues.push(`${disease.id}: игра ${disease.game} заменена на ${plan.game}`);
    }
    if (!disease.reward || !(disease.reward.coins > 0) || !(disease.reward.xp > 0)) {
      issues.push(`${disease.id}: нет награды`);
    }
  });
  PLAYER_PRIORITY_DISEASES.forEach((id) => {
    if (!DISEASES.some((disease) => disease.id === id)) {
      issues.push(`${id}: приоритетная болезнь не найдена`);
    }
  });
  ROOMS.forEach((room) => {
    if (!Array.isArray(ROOM_MINIGAMES[room.id])) {
      issues.push(`${room.id}: нет записи в ROOM_MINIGAMES`);
    }
  });
  return { ok: issues.length === 0, issues };
}

export default treatmentPlanFor;
