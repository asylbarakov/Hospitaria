// Сборка docs/balance.md из результатов симуляции (этапы 17 и 17.5).

function signed(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function minutes(ms) {
  return (ms / 60000).toFixed(1);
}

/**
 * Проверка целей: темп найма, открытие кабинетов, отсутствие минуса и прибыль.
 * Кабинеты важнее «расширений каждые 10–15 минут»: именно они задают прогресс 17.5.
 */
export function goalsOf({
  firstHireMin, expansionTimes, minCoins, debtDays, avgOperating,
  firstRoomMin, allRoomsMin, roomsOpened, roomsTotal,
}) {
  const gaps = expansionTimes.slice(1).map((minute, index) => minute - expansionTimes[index]);
  const averageGap = gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0;
  return [
    {
      title: 'Первый сотрудник через 5–7 минут',
      ok: firstHireMin !== null && firstHireMin >= 5 && firstHireMin <= 7,
      detail: firstHireMin === null ? 'не нанят' : `${firstHireMin.toFixed(1)} мин`,
    },
    {
      title: 'Первый новый кабинет через 8–12 минут',
      ok: firstRoomMin !== null && firstRoomMin >= 8 && firstRoomMin <= 12,
      detail: firstRoomMin === null ? 'не открыт' : `${firstRoomMin.toFixed(1)} мин`,
    },
    {
      title: 'Все кабинеты открыты за 40–60 минут',
      ok: allRoomsMin !== null && allRoomsMin >= 40 && allRoomsMin <= 60,
      detail: allRoomsMin === null
        ? `${roomsOpened} из ${roomsTotal} за час`
        : `${allRoomsMin.toFixed(1)} мин (${roomsOpened} из ${roomsTotal})`,
    },
    {
      title: 'Баланс не уходит в минус без долга',
      ok: minCoins >= 0,
      detail: `минимум ${minCoins} монет, дней с долгом ${debtDays}`,
    },
    {
      title: 'Доходы покрывают зарплаты и содержание',
      ok: avgOperating >= 0,
      detail: `средняя операционная прибыль ${avgOperating >= 0 ? '+' : ''}${avgOperating} за день`,
    },
    {
      title: 'Без долгих пауз между покупками',
      ok: gaps.length > 0 && Math.max(...gaps) <= 15,
      detail: gaps.length
        ? `максимальная пауза ${Math.max(...gaps).toFixed(1)} мин (в среднем ${averageGap.toFixed(1)})`
        : 'расширений не было',
    },
  ];
}

/**
 * @param {{minutes:number, dayLengthSec:number, firstHireMin:number|null,
 *   firstExpansionMin:number|null, firstRoomMin:number|null, allRoomsMin:number|null,
 *   roomsOpened:number, roomsTotal:number, treated:number, angry:number, wrong:number,
 *   dayCount:number, avgDay:number, avgOperating:number, debtDays:number,
 *   coinsEnd:number, crystalsEnd:number, crystalsFromQuests:number, perfectCrystals:number,
 *   minCoins:number, levelEnd:number, staffCount:number, boughtCount:number,
 *   totalRoomCrystals:number, goals:Array, minuteLog:Array, hireLog:Array,
 *   upgradeLog:Array, roomLog:Array, reserve:number}} data
 */
export default function buildReport(data) {
  const lines = [];
  lines.push('# Баланс экономики 2.0 и открытия кабинетов');
  lines.push('');
  lines.push(`Симуляция \`tools/balance_sim.mjs\`: ${data.minutes} игровых минут, день = ${data.dayLengthSec} с.`);
  lines.push('Считаются реальными модулями `GameState`, `HospitalEconomy` и `RoomUnlocks`; поток пациентов');
  lines.push('смоделирован по `patientConfig`, `diseases` и `treatmentConfig`. Стратегия: обустройство холла,');
  lines.push(`первый сотрудник, затем открытие кабинетов и мебель для них (резерв ${data.reserve} монет).`);
  lines.push('Кристаллы приходят с уровней, за недельные и сюжетные задания и редкой наградой за идеальный приём.');
  lines.push('');
  lines.push('## Итоги');
  lines.push('');
  lines.push(`- Первый сотрудник: ${data.firstHireMin === null ? '—' : `${data.firstHireMin.toFixed(1)} мин`}`);
  lines.push(`- Первый новый кабинет: ${data.firstRoomMin === null ? '—' : `${data.firstRoomMin.toFixed(1)} мин`}`);
  lines.push(`- Все кабинеты: ${data.allRoomsMin === null ? `не все (${data.roomsOpened} из ${data.roomsTotal})` : `${data.allRoomsMin.toFixed(1)} мин`}`);
  lines.push(`- Кристаллов в конце: ${data.crystalsEnd}; из заданий: ${data.crystalsFromQuests}; за идеальный приём: ${data.perfectCrystals}; всего нужно на кабинеты: ${data.totalRoomCrystals}`);
  lines.push(`- Принято пациентов: ${data.treated}; ушли недовольными: ${data.angry}; ошибок диагноза: ${data.wrong}`);
  lines.push(`- Дней: ${data.dayCount}; средний итог дня: ${signed(data.avgDay)} монет (с покупками); операционная прибыль: ${signed(data.avgOperating)}; дней с долгом: ${data.debtDays}`);
  lines.push(`- Монет в конце: ${data.coinsEnd}; минимум за час: ${data.minCoins}`);
  lines.push(`- Уровень в конце: ${data.levelEnd}; нанято: ${data.staffCount}; куплено предметов: ${data.boughtCount}`);
  lines.push('');
  lines.push('## Проверка целей');
  lines.push('');
  data.goals.forEach((goal) => {
    lines.push(`- ${goal.ok ? '✅' : '⚠️'} ${goal.title}: ${goal.detail}`);
  });
  lines.push('');
  lines.push('## Монеты и кристаллы по минутам');
  lines.push('');
  lines.push('| Минута | Монеты | Кристаллы | Уровень | Кабинеты | Сотрудники | Пациенты | День |');
  lines.push('| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  data.minuteLog.forEach((row) => {
    lines.push(`| ${row.minute} | ${row.coins} | ${row.crystals} | ${row.level} | ${row.rooms} | ${row.staff} | ${row.treated} | ${row.day} |`);
  });
  lines.push('');
  lines.push('## Открытие кабинетов');
  lines.push('');
  lines.push('| Минута | Кабинет | Монеты | Кристаллы |');
  lines.push('| ---: | --- | ---: | ---: |');
  if (data.roomLog.length) {
    data.roomLog.forEach((entry) => {
      lines.push(`| ${minutes(entry.time)} | ${entry.title} | ${entry.coins} | ${entry.crystals} |`);
    });
  } else {
    lines.push('| — | ни один кабинет не открыт | 0 | 0 |');
  }
  lines.push('');
  lines.push('## События');
  lines.push('');
  lines.push('| Минута | Событие | Цена |');
  lines.push('| ---: | --- | ---: |');
  data.hireLog.forEach((entry) => {
    lines.push(`| ${minutes(entry.time)} | Нанят ${entry.title} | ${entry.price} |`);
  });
  data.upgradeLog.forEach((entry) => {
    const suffix = entry.room ? '' : (entry.expansion ? '' : ' (подготовка)');
    lines.push(`| ${minutes(entry.time)} | ${entry.title}${suffix} | ${entry.price} |`);
  });
  lines.push('');
  lines.push('## Допущения модели');
  lines.push('');
  lines.push('- Игрок успевает лечить пациентов; очередь растёт только при всплесках прихода.');
  lines.push('- Сотрудники ускоряют обслуживание и приток пациентов (регистратор, медсестра, врач, лаборант).');
  lines.push('- До найма уборщика раз в день начисляется штраф за грязь; 3% диагнозов ошибочны.');
  lines.push('- Из заданий начисляются только кристаллы (не монеты и не опыт), чтобы оценка была строже.');
  lines.push('- Сюжетные задания считаются выполненными по событию, без строгой очереди шагов.');
  lines.push('- Идеальный приём (3 звезды) даёт 1 кристалл с шансом 20%, как в `treatmentConfig`.');
  lines.push('- Цены, зарплаты, награды и цены кабинетов берутся из `src/data/*`, а не дублируются.');
  lines.push('- Симуляция не заменяет ручную игру: она проверяет темп и отсутствие минуса.');
  lines.push('');
  return lines.join('\n');
}
