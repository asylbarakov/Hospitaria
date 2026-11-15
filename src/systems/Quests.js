// Задания v2 (этап 16): ежедневные, недельные и сюжетная цепочка.
// Чистая логика без Phaser: подписывается на EventBus и хранит прогресс в обычном объекте.
// Награды не начисляет само — сцена забирает reward и добавляет монеты/опыт/кристаллы.

import {
  DAILY_QUESTS, QUEST_EVENTS, STORY_QUESTS, WEEKLY_QUESTS,
  questsByCategory,
} from '../data/quests.js';
import { count, rewardsOf } from './questRewards.js';
import questsView from './questsView.js';

export function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** ISO-неделя: 2026-W46. Понедельник — первый день. */
export function weekKey(date = new Date()) {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((copy - yearStart) / 86400000) + 1) / 7);
  return `${copy.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function matches(quest, payload) {
  if (!quest.match) {
    return true;
  }
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  return Object.entries(quest.match).every(([key, value]) => payload[key] === value);
}

function emptySection(key) {
  return { key, progress: {}, claimed: [] };
}

function normalizeSection(saved, quests, key) {
  const section = {
    key,
    progress: {},
    claimed: Array.isArray(saved && saved.claimed) ? saved.claimed : [],
  };
  const ids = new Set(quests.map((quest) => quest.id));
  section.claimed = section.claimed.filter((id) => ids.has(id));
  quests.forEach((quest) => {
    section.progress[quest.id] = Math.min(
      quest.target,
      count(saved && saved.progress ? saved.progress[quest.id] : 0),
    );
  });
  return section;
}

export default class Quests {
  /**
   * @param {{bus?:object, saved?:object, now?:Function, onChange?:Function}} options
   */
  constructor(options = {}) {
    this.bus = options.bus || null;
    this.now = typeof options.now === 'function' ? options.now : () => new Date();
    this.onChange = typeof options.onChange === 'function' ? options.onChange : () => {};
    this.revision = 0;
    this.unsubs = [];
    this.load(options.saved || null);
    if (this.bus && typeof this.bus.on === 'function') {
      QUEST_EVENTS.forEach((type) => {
        this.unsubs.push(this.bus.on(type, (payload) => this.handle(type, payload)));
      });
    }
  }

  currentDate() {
    const value = this.now();
    return value instanceof Date && !Number.isNaN(value.getTime()) ? value : new Date();
  }

  load(saved) {
    const day = dateKey(this.currentDate());
    const week = weekKey(this.currentDate());
    const dailySaved = saved && saved.daily && saved.daily.key === day ? saved.daily : null;
    const weeklySaved = saved && saved.weekly && saved.weekly.key === week ? saved.weekly : null;
    this.daily = normalizeSection(dailySaved, DAILY_QUESTS, day);
    this.weekly = normalizeSection(weeklySaved, WEEKLY_QUESTS, week);
    this.story = normalizeSection(saved && saved.story, STORY_QUESTS, 'story');
  }

  /** Сбросить дневные/недельные задания, если сменились дата или неделя. */
  ensure() {
    let changed = false;
    const day = dateKey(this.currentDate());
    const week = weekKey(this.currentDate());
    if (this.daily.key !== day) {
      this.daily = normalizeSection(null, DAILY_QUESTS, day);
      changed = true;
    }
    if (this.weekly.key !== week) {
      this.weekly = normalizeSection(null, WEEKLY_QUESTS, week);
      changed = true;
    }
    if (changed) {
      this.revision += 1;
    }
    return changed;
  }

  section(category) {
    if (category === 'weekly') {
      return this.weekly;
    }
    if (category === 'story') {
      return this.story;
    }
    return this.daily;
  }

  claimed(category, id) {
    return this.section(category).claimed.includes(id);
  }

  progressOf(category, id) {
    return count(this.section(category).progress[id]);
  }

  currentStory() {
    return STORY_QUESTS.find((quest) => !this.claimed('story', quest.id)) || null;
  }

  /**
   * Подписка на событие: двигает ежедневные, недельные и сюжетные шаги.
   * Сюжетный прогресс считается у всех незабранных шагов, даже если шаг ещё закрыт:
   * иначе действие, сделанное заранее (например, открытая лаборатория), терялось бы,
   * когда этот шаг станет текущим. Забрать награду всё равно можно только по порядку.
   */
  handle(type, payload) {
    this.ensure();
    const touched = [];
    const lists = [
      { category: 'daily', quests: DAILY_QUESTS },
      { category: 'weekly', quests: WEEKLY_QUESTS },
    ];
    lists.forEach(({ category, quests }) => {
      quests.forEach((quest) => {
        if (quest.event === type && this.advance(category, quest, payload)) {
          touched.push(quest);
        }
      });
    });
    STORY_QUESTS.forEach((quest) => {
      if (quest.event === type && this.advance('story', quest, payload)) {
        touched.push(quest);
      }
    });
    if (touched.length) {
      this.revision += 1;
      this.onChange();
    }
    return touched;
  }

  advance(category, quest, payload) {
    if (this.claimed(category, quest.id) || !matches(quest, payload)) {
      return false;
    }
    const raw = quest.amountKey && payload ? Number(payload[quest.amountKey]) : 1;
    const amount = Number.isFinite(raw) ? Math.max(0, raw) : 0;
    if (amount <= 0) {
      return false;
    }
    const section = this.section(category);
    const before = this.progressOf(category, quest.id);
    if (before >= quest.target) {
      return false;
    }
    const after = Math.min(quest.target, before + amount);
    section.progress[quest.id] = after;
    if (before < quest.target && after >= quest.target && this.bus) {
      this.bus.emit('questCompleted', { category, quest });
    }
    return true;
  }

  isComplete(category, quest) {
    return this.progressOf(category, quest.id) >= quest.target;
  }

  /** Забрать награду. Возвращает { ok, quest, reward } или { ok:false, hint }. */
  claim(category, id) {
    this.ensure();
    const list = questsByCategory(category);
    const quest = list.find((item) => item.id === id) || null;
    if (!quest) {
      return { ok: false, hint: 'Задание не найдено' };
    }
    if (category === 'story' && (!this.currentStory() || this.currentStory().id !== id)) {
      return { ok: false, hint: 'Сначала завершите предыдущий шаг' };
    }
    if (this.claimed(category, id)) {
      return { ok: false, hint: 'Награда уже получена' };
    }
    if (!this.isComplete(category, quest)) {
      return { ok: false, hint: 'Задание ещё не выполнено' };
    }
    this.section(category).claimed.push(id);
    this.revision += 1;
    if (this.bus) {
      this.bus.emit('questClaimed', { category, quest });
    }
    this.onChange();
    return { ok: true, quest, reward: rewardsOf(quest) };
  }

  serialize() {
    return {
      daily: { key: this.daily.key, progress: { ...this.daily.progress }, claimed: [...this.daily.claimed] },
      weekly: { key: this.weekly.key, progress: { ...this.weekly.progress }, claimed: [...this.weekly.claimed] },
      story: { progress: { ...this.story.progress }, claimed: [...this.story.claimed] },
    };
  }

  reset() {
    const day = dateKey(this.currentDate());
    const week = weekKey(this.currentDate());
    this.daily = normalizeSection(null, DAILY_QUESTS, day);
    this.weekly = normalizeSection(null, WEEKLY_QUESTS, week);
    this.story = normalizeSection(null, STORY_QUESTS, 'story');
    this.revision += 1;
    this.onChange();
  }

  destroy() {
    this.unsubs.forEach((unsubscribe) => unsubscribe());
    this.unsubs = [];
  }
}

Object.assign(Quests.prototype, questsView);
