import { DAILY_TASKS, getDailyTask } from '../data/dailyTasks.js';

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createTasksState() {
  return {
    date: todayKey(),
    progress: {},
    claimed: {},
  };
}

export function ensureDailyTasks(saveData) {
  if (!saveData) {
    return null;
  }

  const key = todayKey();
  if (!saveData.tasks || saveData.tasks.date !== key) {
    saveData.tasks = createTasksState();
  }

  const tasks = saveData.tasks;
  tasks.progress = tasks.progress || {};
  tasks.claimed = tasks.claimed || {};

  DAILY_TASKS.forEach((task) => {
    if (!Number.isFinite(Number(tasks.progress[task.id]))) {
      tasks.progress[task.id] = 0;
    }
    if (typeof tasks.claimed[task.id] !== 'boolean') {
      tasks.claimed[task.id] = false;
    }
  });

  return tasks;
}

export function recordTreatment(saveData, result) {
  const tasks = ensureDailyTasks(saveData);
  if (!tasks || !result) {
    return;
  }

  const stars = Math.max(0, Number(result.stars) || 0);
  const coins = Math.max(0, Number(result.coins) || 0);

  if (stars > 0) {
    tasks.progress.heal = (tasks.progress.heal || 0) + 1;
  }
  tasks.progress.stars = (tasks.progress.stars || 0) + stars;
  tasks.progress.earn = (tasks.progress.earn || 0) + coins;
}

export function getTaskProgress(saveData, taskId) {
  const tasks = ensureDailyTasks(saveData);
  return tasks ? Number(tasks.progress[taskId]) || 0 : 0;
}

export function isTaskComplete(saveData, taskId) {
  const task = getDailyTask(taskId);
  if (!task) {
    return false;
  }
  return getTaskProgress(saveData, taskId) >= task.target;
}

export function isTaskClaimed(saveData, taskId) {
  const tasks = ensureDailyTasks(saveData);
  return !!(tasks && tasks.claimed[taskId]);
}

export function claimTask(saveData, taskId) {
  const task = getDailyTask(taskId);
  const tasks = ensureDailyTasks(saveData);

  if (!task || !tasks || tasks.claimed[taskId]) {
    return 0;
  }
  if ((Number(tasks.progress[taskId]) || 0) < task.target) {
    return 0;
  }

  tasks.claimed[taskId] = true;
  return task.reward;
}

export default { ensureDailyTasks, recordTreatment, claimTask };
