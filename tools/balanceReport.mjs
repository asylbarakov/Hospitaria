// Сборка docs/balance.md из результатов симуляции (этап 17).

function signed(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function minutes(ms) {
  return (ms / 60000).toFixed(1);
}

/** Проверка целей этапа 17: темп найма, расширения, отсутствие минуса и прибыль. */
export function goalsOf({
  firstHireMin, expansionTimes, minCoins, debtDays, avgOperating,
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
      title: 'Расширения каждые 10–15 минут',
      ok: gaps.length > 0 && gaps.every((gap) => gap >= 9.5 && gap <= 15.5),
      detail: gaps.length
        ? `интервалы ${gaps.map((gap) => gap.toFixed(0)).join(', ')} мин (в среднем ${averageGap.toFixed(1)})`
        : 'расширений не было',
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
  ];
}

/**
 * @param {{minutes:number, dayLengthSec:number, firstHireMin:number|null,
 *   firstExpansionMin:number|null, treated:number, angry:number, wrong:number,
 *   dayCount:number, avgDay:number, avgOperating:number, debtDays:number,
 *   coinsEnd:number, minCoins:number, levelEnd:number, staffCount:number,
 *   boughtCount:number, goals:Array, minuteLog:Array, hireLog:Array,
 *   upgradeLog:Array, reserve:number}} data
 */
export default function buildReport(data) {
  const lines = [];
  lines.push('# Баланс экономики 2.0');
  lines.push('');
  lines.push(`Симуляция \`tools/balance_sim.mjs\`: ${data.minutes} игровых минут, день = ${data.dayLengthSec} с.`);
  lines.push('Считаются реальными модулями `GameState` и `HospitalEconomy`; поток пациентов смоделирован');
  lines.push('по `patientConfig`, `diseases` и `treatmentConfig`. Стратегия: обустройство холла, затем');
  lines.push(`первый сотрудник, затем расширения по мере накопления монет (резерв ${data.reserve}).`);
  lines.push('');
  lines.push('## Итоги');
  lines.push('');
  lines.push(`- Первый сотрудник: ${data.firstHireMin === null ? '—' : `${data.firstHireMin.toFixed(1)} мин`}`);
  lines.push(`- Первое расширение после найма: ${data.firstExpansionMin === null ? '—' : `${data.firstExpansionMin.toFixed(1)} мин`}`);
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
  lines.push('## Монеты по минутам');
  lines.push('');
  lines.push('| Минута | Монеты | Уровень | Сотрудники | Пациенты | День |');
  lines.push('| ---: | ---: | ---: | ---: | ---: | ---: |');
  data.minuteLog.forEach((row) => {
    lines.push(`| ${row.minute} | ${row.coins} | ${row.level} | ${row.staff} | ${row.treated} | ${row.day} |`);
  });
  lines.push('');
  lines.push('## События');
  lines.push('');
  lines.push('| Минута | Событие | Цена |');
  lines.push('| ---: | --- | ---: |');
  data.hireLog.forEach((entry) => {
    lines.push(`| ${minutes(entry.time)} | Нанят ${entry.title} | ${entry.price} |`);
  });
  data.upgradeLog.forEach((entry) => {
    lines.push(`| ${minutes(entry.time)} | ${entry.title}${entry.expansion ? '' : ' (подготовка)'} | ${entry.price} |`);
  });
  lines.push('');
  lines.push('## Допущения модели');
  lines.push('');
  lines.push('- Игрок успевает лечить пациентов; очередь растёт только при всплесках прихода.');
  lines.push('- Сотрудники ускоряют обслуживание и приток пациентов (регистратор, медсестра, врач, лаборант).');
  lines.push('- До найма уборщика раз в день начисляется штраф за грязь; 3% диагнозов ошибочны.');
  lines.push('- Цены, зарплаты и награды берутся из `src/data/*`, а не дублируются в симуляции.');
  lines.push('- Симуляция не заменяет ручную игру: она проверяет темп и отсутствие минуса.');
  lines.push('');
  return lines.join('\n');
}
