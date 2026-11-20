import { describe, expect, it } from 'vitest';
import type { Category, Transaction } from '../types';
import {
  buildBudgetRows,
  categoryByIdMap,
  expensesByCategory,
  recentMonthSeries,
  summarize,
  transactionsInMonth,
  UNKNOWN_CATEGORY,
} from './calculations';

const food: Category = { id: 'food', name: 'Comida', type: 'expense', color: '#f97316', emoji: '🍔' };
const salary: Category = { id: 'salary', name: 'Sueldo', type: 'income', color: '#22c55e', emoji: '💼' };
const leisure: Category = { id: 'leisure', name: 'Ocio', type: 'expense', color: '#ec4899', emoji: '🎬' };
const categories = [food, salary, leisure];

function tx(partial: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    type: 'expense',
    amount: 1000,
    categoryId: 'food',
    date: '2026-11-05',
    note: '',
    ...partial,
  };
}

describe('summarize', () => {
  it('suma ingresos y gastos y calcula balance y ahorro', () => {
    const summary = summarize([
      tx({ id: 'a', type: 'income', amount: 100000 }),
      tx({ id: 'b', amount: 25000 }),
      tx({ id: 'c', amount: 15000, categoryId: 'leisure' }),
    ]);

    expect(summary).toEqual({
      income: 100000,
      expense: 40000,
      balance: 60000,
      savingsRate: 0.6,
    });
  });

  it('devuelve ahorro null cuando no hay ingresos', () => {
    expect(summarize([tx({ amount: 500 })]).savingsRate).toBeNull();
  });

  it('con lista vacía devuelve todo en cero', () => {
    expect(summarize([])).toEqual({ income: 0, expense: 0, balance: 0, savingsRate: null });
  });
});

describe('transactionsInMonth', () => {
  it('filtra por mes sin mezclar días de otros meses', () => {
    const items = [
      tx({ id: 'a', date: '2026-11-01' }),
      tx({ id: 'b', date: '2026-11-30' }),
      tx({ id: 'c', date: '2026-12-01' }),
      tx({ id: 'd', date: '2025-11-15' }),
    ];

    expect(transactionsInMonth(items, '2026-11').map((item) => item.id)).toEqual(['a', 'b']);
  });
});

describe('expensesByCategory', () => {
  it('agrupa gastos, ignora ingresos y ordena de mayor a menor', () => {
    const totals = expensesByCategory(
      [
        tx({ id: 'a', amount: 300, categoryId: 'food' }),
        tx({ id: 'b', amount: 100, categoryId: 'food' }),
        tx({ id: 'c', amount: 600, categoryId: 'leisure' }),
        tx({ id: 'd', type: 'income', amount: 9999, categoryId: 'salary' }),
      ],
      categories,
    );

    expect(totals.map((item) => item.category.id)).toEqual(['leisure', 'food']);
    expect(totals[0]).toMatchObject({ amount: 600, share: 0.6 });
    expect(totals[1]).toMatchObject({ amount: 400, share: 0.4 });
    expect(totals.reduce((sum, item) => sum + item.share, 0)).toBeCloseTo(1);
  });

  it('usa la categoría desconocida si el id no existe', () => {
    const totals = expensesByCategory([tx({ categoryId: 'borrada', amount: 50 })], categories);
    expect(totals[0].category).toEqual(UNKNOWN_CATEGORY);
  });

  it('devuelve lista vacía si no hay gastos', () => {
    expect(expensesByCategory([tx({ type: 'income' })], categories)).toEqual([]);
  });
});

describe('recentMonthSeries', () => {
  it('devuelve los últimos N meses terminando en el mes pedido', () => {
    const series = recentMonthSeries(
      [
        tx({ id: 'a', type: 'income', amount: 500, date: '2026-01-10' }),
        tx({ id: 'b', amount: 200, date: '2026-02-10' }),
        tx({ id: 'c', amount: 300, date: '2026-02-20' }),
      ],
      '2026-03',
      3,
    );

    expect(series.map((point) => point.month)).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(series[0]).toMatchObject({ income: 500, expense: 0, balance: 500 });
    expect(series[1]).toMatchObject({ income: 0, expense: 500, balance: -500 });
    expect(series[2]).toMatchObject({ income: 0, expense: 0, balance: 0 });
    expect(series.every((point) => point.label.length > 0)).toBe(true);
  });
});

describe('buildBudgetRows', () => {
  it('solo incluye categorías de gasto y calcula el avance', () => {
    const rows = buildBudgetRows(
      categories,
      [
        tx({ id: 'a', amount: 2000, categoryId: 'food' }),
        tx({ id: 'b', amount: 500, categoryId: 'leisure' }),
        tx({ id: 'c', type: 'income', amount: 8000, categoryId: 'salary' }),
      ],
      { food: 5000, salary: 99999 },
    );

    expect(rows.map((row) => row.category.id)).toEqual(['food', 'leisure']);

    const foodRow = rows[0];
    expect(foodRow).toMatchObject({ budget: 5000, spent: 2000, remaining: 3000 });
    expect(foodRow.ratio).toBeCloseTo(0.4);

    const leisureRow = rows[1];
    expect(leisureRow).toMatchObject({ budget: 0, spent: 500, remaining: -500, ratio: 0 });
  });

  it('marca excedido cuando el gasto supera el presupuesto', () => {
    const [row] = buildBudgetRows(categories, [tx({ amount: 12000 })], { food: 10000 });
    expect(row.ratio).toBeCloseTo(1.2);
    expect(row.remaining).toBe(-2000);
  });
});

describe('categoryByIdMap', () => {
  it('indexa las categorías por id', () => {
    const map = categoryByIdMap(categories);
    expect(map.get('food')).toEqual(food);
    expect(map.get('nope')).toBeUndefined();
  });
});
