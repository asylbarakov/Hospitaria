import { writeFileSync } from 'node:fs';
import { ECONOMY } from '../src/data/economy.js';
import { ROOM_UNLOCKS, STARTER_ROOMS } from '../src/data/roomUnlocks.js';
import buildReport, { goalsOf } from './balanceReport.mjs';

// Итоги симуляции баланса: сводка, цели, docs/balance.md и вывод в консоль.
export default function summarize(ctx) {
  const {
    MINUTES, SIM, state, dayLog, upgradeLog, minuteLog, hireLog, roomLog, staff, bought,
    unlockedRooms, firstHireAt, firstRoomAt, treated, angry, wrong,
    crystalsFromQuests, perfectCrystals,
  } = ctx;
  const avgDay = dayLog.length
    ? Math.round(dayLog.reduce((sum, day) => sum + day.net, 0) / dayLog.length)
    : 0;
  const avgOperating = dayLog.length
    ? Math.round(dayLog.reduce(
      (sum, day) => sum + day.income + day.sales - day.bills - day.penalties,
      0,
    ) / dayLog.length)
    : 0;
  const expansionTimes = upgradeLog
    .filter((entry) => entry.expansion)
    .map((entry) => entry.time / 60000);
  const firstHireMin = firstHireAt === null ? null : firstHireAt / 60000;
  const firstExpansionMin = expansionTimes.length ? expansionTimes[0] : null;
  const minCoins = Math.min(...minuteLog.map((row) => row.coins));
  const debtDays = dayLog.filter((day) => day.debt > 0).length;
  const firstRoomMin = firstRoomAt === null ? null : firstRoomAt / 60000;
  const roomsTotal = ROOM_UNLOCKS.filter((entry) => !STARTER_ROOMS.includes(entry.roomId)).length;
  const roomsOpened = unlockedRooms.size - STARTER_ROOMS.length;
  const allRoomsMin = roomsOpened >= roomsTotal && roomLog.length
    ? Math.max(...roomLog.map((entry) => entry.time)) / 60000
    : null;

  const goals = goalsOf({
    firstHireMin,
    expansionTimes,
    minCoins,
    debtDays,
    avgOperating,
    firstRoomMin,
    allRoomsMin,
    roomsOpened,
    roomsTotal,
  });

  const output = buildReport({
    minutes: MINUTES,
    dayLengthSec: Math.round(ECONOMY.dayLengthMs / 1000),
    reserve: SIM.reserve,
    firstHireMin,
    firstExpansionMin,
    firstRoomMin,
    allRoomsMin,
    roomsOpened,
    roomsTotal,
    treated,
    angry,
    wrong,
    dayCount: dayLog.length,
    avgDay,
    avgOperating,
    debtDays,
    coinsEnd: state.coins,
    crystalsEnd: state.crystals,
    crystalsFromQuests,
    perfectCrystals,
    minCoins,
    levelEnd: state.level,
    staffCount: staff.length,
    boughtCount: bought.length,
    totalRoomCrystals: ROOM_UNLOCKS
      .filter((entry) => !STARTER_ROOMS.includes(entry.roomId))
      .reduce((sum, entry) => sum + entry.crystals, 0),
    goals,
    minuteLog,
    hireLog,
    upgradeLog,
    roomLog,
  });
  writeFileSync(new URL('../docs/balance.md', import.meta.url), output, 'utf8');

  const firstRoomLabel = firstRoomMin === null ? '—' : `${firstRoomMin.toFixed(1)} min`;
  const allRoomsLabel = allRoomsMin === null ? `${roomsOpened}/${roomsTotal}` : `${allRoomsMin.toFixed(1)} min`;
  console.log(`balance sim: ${MINUTES} min, coins ${state.coins}, crystals ${state.crystals}, first hire ${firstHireMin === null ? '—' : `${firstHireMin.toFixed(1)} min`}, first room ${firstRoomLabel}, all rooms ${allRoomsLabel}, avg day ${avgDay}`);
  goals.forEach((goal) => {
    console.log(`${goal.ok ? 'OK  ' : 'WARN'} ${goal.title}: ${goal.detail}`);
  });
  console.log('written docs/balance.md');
}
