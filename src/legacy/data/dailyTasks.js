export const DAILY_TASKS = [
  {
    id: 'heal',
    title: 'Примите 5 пациентов',
    description: 'Завершите 5 приёмов хотя бы с одной звездой',
    target: 5,
    reward: 120,
    color: 0x4caf50,
  },
  {
    id: 'stars',
    title: 'Соберите 9 звёзд',
    description: 'Звёзды за успешные приёмы идут в зачёт задания',
    target: 9,
    reward: 150,
    color: 0xf6c343,
  },
  {
    id: 'earn',
    title: 'Заработайте 250 монет',
    description: 'Учитываются монеты, полученные за лечение',
    target: 250,
    reward: 90,
    color: 0x3f8fb0,
  },
];

export function getDailyTask(id) {
  return DAILY_TASKS.find((task) => task.id === id) || null;
}

export default DAILY_TASKS;
