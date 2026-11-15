import { DAILY_QUESTS, QUEST_CATEGORIES, STORY_QUESTS, WEEKLY_QUESTS } from '../data/quests.js';
import { rewardsOf } from './questRewards.js';

// Данные для экрана заданий. Подмешивается в Quests (Object.assign), this = Quests.

const questsView = {
  /** Данные для экрана заданий. */
  state() {
    this.ensure();
    const entries = (category, quests) => {
      const story = category === 'story';
      const current = story ? this.currentStory() : null;
      return quests.map((quest) => {
        const claimed = this.claimed(category, quest.id);
        const progress = claimed
          ? quest.target
          : Math.min(quest.target, this.progressOf(category, quest.id));
        const complete = progress >= quest.target;
        const active = !story || claimed || (current && current.id === quest.id);
        return {
          id: quest.id,
          title: quest.title,
          description: quest.description,
          target: quest.target,
          progress: active ? progress : 0,
          complete: active && complete,
          claimed,
          locked: !active,
          reward: rewardsOf(quest),
        };
      });
    };
    const daily = entries('daily', DAILY_QUESTS);
    const weekly = entries('weekly', WEEKLY_QUESTS);
    const story = entries('story', STORY_QUESTS);
    const claimable = (list) => list.filter((item) => item.complete && !item.claimed).length;
    this.claimable = claimable(daily) + claimable(weekly) + claimable(story);
    return {
      revision: this.revision,
      daily: { ...QUEST_CATEGORIES.daily, resetKey: this.daily.key, quests: daily },
      weekly: { ...QUEST_CATEGORIES.weekly, resetKey: this.weekly.key, quests: weekly },
      story: {
        ...QUEST_CATEGORIES.story,
        quests: story,
        done: story.filter((item) => item.claimed).length,
        total: story.length,
        currentId: this.currentStory() ? this.currentStory().id : null,
      },
      claimable: this.claimable,
    };
  },

  hasClaimable() {
    if (!Number.isFinite(this.claimable) || this.claimable === 0) {
      this.state();
    }
    return this.claimable > 0;
  },
};

export default questsView;
