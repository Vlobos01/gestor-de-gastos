import type { CurrencyCode, FinanceState, Transaction, TxType } from '../types';
import { currentMonth, pad2, shiftMonth } from './date';
import { DEFAULT_CATEGORIES } from './defaults';

/** Valores base pensados en pesos argentinos, convertidos según la moneda elegida. */
const CURRENCY_RATE: Record<CurrencyCode, number> = {
  ARS: 1,
  USD: 0.0011,
  EUR: 0.001,
  MXN: 0.019,
  CLP: 1.1,
  COP: 4.4,
};

interface ExpensePlan {
  categoryId: string;
  note: string;
  day: number;
  base: number;
  offsets?: number[];
}

const FIXED_EXPENSES: ExpensePlan[] = [
  { categoryId: 'cat-home', note: 'Alquiler', day: 5, base: 380000 },
  { categoryId: 'cat-utilities', note: 'Luz y agua', day: 12, base: 48000 },
  { categoryId: 'cat-utilities', note: 'Internet', day: 15, base: 32000 },
  { categoryId: 'cat-food', note: 'Supermercado', day: 7, base: 96000 },
  { categoryId: 'cat-food', note: 'Verdulería', day: 18, base: 33000 },
  { categoryId: 'cat-food', note: 'Delivery', day: 24, base: 24500 },
  { categoryId: 'cat-transport', note: 'Transporte público', day: 9, base: 26000 },
  { categoryId: 'cat-transport', note: 'Nafta', day: 21, base: 55000 },
  { categoryId: 'cat-leisure', note: 'Cine', day: 22, base: 18000 },
  { categoryId: 'cat-education', note: 'Curso online', day: 10, base: 35000 },
];

const OCCASIONAL_EXPENSES: ExpensePlan[] = [
  { categoryId: 'cat-leisure', note: 'Salida con amigos', day: 27, base: 42000, offsets: [0, 1, 3] },
  { categoryId: 'cat-health', note: 'Farmacia', day: 14, base: 27500, offsets: [0, 2] },
  { categoryId: 'cat-other', note: 'Regalo', day: 23, base: 30000, offsets: [0, 2] },
  { categoryId: 'cat-food', note: 'Cumpleaños', day: 19, base: 38000, offsets: [1, 3] },
];

const DEMO_BUDGETS: Record<string, number> = {
  'cat-home': 400000,
  'cat-utilities': 100000,
  'cat-food': 180000,
  'cat-transport': 90000,
  'cat-leisure': 80000,
  'cat-health': 50000,
  'cat-education': 50000,
  'cat-other': 40000,
};

export function buildDemoState(currency: CurrencyCode): FinanceState {
  const rate = CURRENCY_RATE[currency];
  const convert = (base: number) => Math.round(base * rate * 100) / 100;
  const transactions: Transaction[] = [];
  const budgets: Record<string, Record<string, number>> = {};
  let counter = 0;

  function add(type: TxType, categoryId: string, date: string, note: string, base: number) {
    counter += 1;
    transactions.push({ id: `demo-${counter}`, type, categoryId, date, note, amount: convert(base) });
  }

  for (let offset = 0; offset < 4; offset += 1) {
    const month = shiftMonth(currentMonth(), -offset);
    const drift = 1 + offset * 0.045;
    const dayOf = (day: number) => `${month}-${pad2(day)}`;

    add('income', 'cat-salary', dayOf(3), 'Sueldo', 1350000 * (1 - offset * 0.02));
    if (offset === 0 || offset === 2) {
      add('income', 'cat-freelance', dayOf(16), 'Proyecto freelance', 240000);
    }
    if (offset === 1) {
      add('income', 'cat-investments', dayOf(20), 'Rendimientos', 38000);
    }

    for (const plan of FIXED_EXPENSES) {
      add('expense', plan.categoryId, dayOf(plan.day), plan.note, plan.base * drift);
    }

    for (const plan of OCCASIONAL_EXPENSES) {
      if (plan.offsets?.includes(offset)) {
        add('expense', plan.categoryId, dayOf(plan.day), plan.note, plan.base * drift);
      }
    }

    budgets[month] = Object.fromEntries(
      Object.entries(DEMO_BUDGETS).map(([categoryId, base]) => [categoryId, convert(base)]),
    );
  }

  transactions.sort((a, b) => b.date.localeCompare(a.date));

  return {
    version: 1,
    currency,
    categories: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
    transactions,
    budgets,
  };
}
