import type { Category, Transaction } from '../types';
import { formatMonthLabel, monthOf, shiftMonth } from './date';

export interface MonthSummary {
  income: number;
  expense: number;
  balance: number;
  /** Porcentaje del ingreso que queda como ahorro. null si no hubo ingresos. */
  savingsRate: number | null;
}

export interface CategoryTotal {
  category: Category;
  amount: number;
  share: number;
}

export interface BudgetRow {
  category: Category;
  budget: number;
  spent: number;
  remaining: number;
  /** Gasto dividido presupuesto. 0 cuando no hay presupuesto definido. */
  ratio: number;
}

export interface MonthPoint {
  month: string;
  label: string;
  income: number;
  expense: number;
  balance: number;
}

export const UNKNOWN_CATEGORY: Category = {
  id: 'unknown',
  name: 'Sin categoría',
  type: 'expense',
  color: '#94a3b8',
  emoji: '🏷️',
};

export function summarize(transactions: Transaction[]): MonthSummary {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (tx.type === 'income') income += tx.amount;
    else expense += tx.amount;
  }
  return {
    income,
    expense,
    balance: income - expense,
    savingsRate: income > 0 ? (income - expense) / income : null,
  };
}

export function transactionsInMonth(transactions: Transaction[], month: string): Transaction[] {
  return transactions.filter((tx) => monthOf(tx.date) === month);
}

export function categoryByIdMap(categories: Category[]): Map<string, Category> {
  return new Map(categories.map((category) => [category.id, category]));
}

export function expensesByCategory(transactions: Transaction[], categories: Category[]): CategoryTotal[] {
  const categoriesById = categoryByIdMap(categories);
  const totals = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount);
  }

  const total = [...totals.values()].reduce((sum, value) => sum + value, 0);

  return [...totals.entries()]
    .map(([categoryId, amount]) => ({
      category: categoriesById.get(categoryId) ?? UNKNOWN_CATEGORY,
      amount,
      share: total > 0 ? amount / total : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function recentMonthSeries(transactions: Transaction[], month: string, count = 6): MonthPoint[] {
  const points: MonthPoint[] = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const key = shiftMonth(month, -offset);
    const summary = summarize(transactionsInMonth(transactions, key));
    points.push({
      month: key,
      label: formatMonthLabel(key, 'short'),
      income: summary.income,
      expense: summary.expense,
      balance: summary.balance,
    });
  }
  return points;
}

export function buildBudgetRows(
  categories: Category[],
  transactions: Transaction[],
  budgets: Record<string, number>,
): BudgetRow[] {
  const spending = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    spending.set(tx.categoryId, (spending.get(tx.categoryId) ?? 0) + tx.amount);
  }

  return categories
    .filter((category) => category.type === 'expense')
    .map((category) => {
      const budget = budgets[category.id] ?? 0;
      const spent = spending.get(category.id) ?? 0;
      return {
        category,
        budget,
        spent,
        remaining: budget - spent,
        ratio: budget > 0 ? spent / budget : 0,
      };
    });
}
