// Дневной цикл экономики (этап 17): итоги дня, коммунальные и закрытие дня.
// Вынесено из HospitalEconomy, чтобы модуль оставался читаемым и коротким.

function count(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

export function emptyDay(day = 1) {
  return {
    day,
    income: 0,
    treatmentIncome: 0,
    tips: 0,
    sales: 0,
    purchases: 0,
    expenses: 0,
    salaries: 0,
    utilities: 0,
    supplies: 0,
    penalties: 0,
    penaltyCount: 0,
    treated: 0,
    angry: 0,
    wrongDiagnosis: 0,
    maxQueue: 0,
    overcrowded: false,
  };
}

export function normalizeDay(raw, day) {
  const base = emptyDay(day);
  if (!raw || typeof raw !== 'object') {
    return base;
  }
  Object.keys(base).forEach((key) => {
    if (key === 'overcrowded') {
      base[key] = !!raw[key];
    } else if (key !== 'day') {
      base[key] = count(raw[key], base[key]);
    }
  });
  base.day = day;
  return base;
}

export function utilitiesOf(economy) {
  const world = economy.getWorld();
  const items = world && typeof world.items === 'function' ? world.items().length : 0;
  const rooms = world && world.layout && Array.isArray(world.layout.ROOMS)
    ? world.layout.ROOMS.length
    : 0;
  const rules = economy.timing.utilities || {};
  return Math.max(0, Math.round(
    (Number(rules.base) || 0)
    + rooms * (Number(rules.perRoom) || 0)
    + items * (Number(rules.perItem) || 0),
  ));
}

export function summaryOf(economy) {
  const today = economy.today;
  const state = economy.getState();
  const bills = today.salaries + today.utilities + today.supplies;
  const income = today.treatmentIncome + today.tips;
  // queuePenalty входит в penalties, а не в bills, чтобы не посчитать его дважды.
  const net = income + today.sales - bills - today.penalties - today.purchases;
  return {
    day: today.day,
    treatmentIncome: today.treatmentIncome,
    tips: today.tips,
    income,
    sales: today.sales,
    purchases: today.purchases,
    salaries: today.salaries,
    utilities: today.utilities,
    supplies: today.supplies,
    bills,
    expenses: bills + today.purchases,
    penalties: today.penalties,
    penaltyCount: today.penaltyCount,
    treated: today.treated,
    angry: today.angry,
    wrongDiagnosis: today.wrongDiagnosis,
    maxQueue: today.maxQueue,
    overcrowded: today.overcrowded,
    net,
    coins: state ? state.coins : 0,
    debt: state ? count(state.debt) : 0,
  };
}

/** Зарплаты, коммунальные, лекарства и штраф за очередь; день начинается заново. */
export function finishDay(economy) {
  const state = economy.getState();
  const staff = economy.getStaff();
  const salaries = staff && typeof staff.totalSalary === 'function'
    ? Math.max(0, Math.round(staff.totalSalary()))
    : 0;
  const utilities = utilitiesOf(economy);
  const supplies = Math.round(economy.today.supplies);
  const queuePenalty = economy.today.overcrowded ? count(economy.timing.queuePenalty) : 0;
  const bills = salaries + utilities + supplies + queuePenalty;

  economy.today.salaries = salaries;
  economy.today.utilities = utilities;
  economy.today.supplies = supplies;
  economy.today.expenses = salaries + utilities + supplies;
  economy.today.penalties += queuePenalty;
  if (queuePenalty > 0) {
    economy.today.penaltyCount += 1;
  }

  if (state) {
    if (typeof state.spend === 'function') {
      state.spend(bills, { allowDebt: true });
    } else {
      state.addCoins(-bills);
    }
    if (state.statistics) {
      state.statistics.daysPlayed += 1;
      state.statistics.penalties += queuePenalty;
    }
  }

  const summary = summaryOf(economy);
  economy.lastSummary = summary;
  economy.history.push(summary);
  if (economy.history.length > 7) {
    economy.history.shift();
  }
  economy.onDayEnd(summary);
  economy.day += 1;
  economy.today = emptyDay(economy.day);
  economy.onChange();
  return summary;
}
