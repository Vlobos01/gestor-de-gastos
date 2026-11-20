import { describe, expect, it } from 'vitest';
import type { Category, FinanceState, Transaction } from '../types';
import { createInitialState } from '../lib/storage';
import { financeReducer } from './useFinanceStore';

function baseState(overrides: Partial<FinanceState> = {}): FinanceState {
  return { ...createInitialState('ARS'), ...overrides };
}

function expense(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    type: 'expense',
    amount: 1500,
    categoryId: 'cat-food',
    date: '2026-11-05',
    note: 'Supermercado',
    ...overrides,
  };
}

const customCategory: Category = {
  id: 'cat-pets',
  name: 'Mascotas',
  type: 'expense',
  color: '#f97316',
  emoji: '🐶',
};

describe('movimientos', () => {
  it('agrega un movimiento con id generado al principio', () => {
    const result = financeReducer(baseState(), {
      type: 'add-transaction',
      payload: { type: 'expense', amount: 250, categoryId: 'cat-food', date: '2026-11-05', note: '' },
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].id).toMatch(/^tx-/);
    expect(result.transactions[0].amount).toBe(250);
  });

  it('actualiza solo el movimiento indicado', () => {
    const state = baseState({ transactions: [expense(), expense({ id: 'tx-2', amount: 99 })] });
    const result = financeReducer(state, {
      type: 'update-transaction',
      payload: { ...expense(), amount: 3000, note: 'Actualizado' },
    });

    expect(result.transactions[0]).toMatchObject({ amount: 3000, note: 'Actualizado' });
    expect(result.transactions[1].amount).toBe(99);
  });

  it('elimina por id sin tocar el resto', () => {
    const state = baseState({ transactions: [expense(), expense({ id: 'tx-2' })] });
    const result = financeReducer(state, {
      type: 'delete-transaction',
      payload: { id: 'tx-1' },
    });

    expect(result.transactions.map((tx) => tx.id)).toEqual(['tx-2']);
  });

  it('no modifica el estado si el id a eliminar no existe', () => {
    const state = baseState({ transactions: [expense()] });
    expect(
      financeReducer(state, { type: 'delete-transaction', payload: { id: 'fantasma' } }),
    ).toEqual(state);
  });
});

describe('categorías', () => {
  it('agrega una categoría con id generado', () => {
    const result = financeReducer(baseState(), {
      type: 'add-category',
      payload: { name: 'Mascotas', type: 'expense', color: '#f97316', emoji: '🐶' },
    });

    expect(result.categories).toHaveLength(13);
    expect(result.categories[12].id).toMatch(/^cat-/);
    expect(result.categories[12].name).toBe('Mascotas');
  });

  it('actualiza una categoría existente', () => {
    const state = baseState({ categories: [...createInitialState().categories, customCategory] });
    const result = financeReducer(state, {
      type: 'update-category',
      payload: { ...customCategory, name: 'Animales' },
    });

    expect(result.categories.find((item) => item.id === 'cat-pets')?.name).toBe('Animales');
  });

  it('elimina la categoría junto con sus movimientos y presupuestos', () => {
    const state = baseState({
      categories: [...createInitialState().categories, customCategory],
      transactions: [
        expense({ id: 'tx-food' }),
        expense({ id: 'tx-pets', categoryId: 'cat-pets' }),
      ],
      budgets: {
        '2026-10': { 'cat-pets': 5000, 'cat-food': 40000 },
        '2026-11': { 'cat-pets': 6000 },
      },
    });

    const result = financeReducer(state, { type: 'delete-category', payload: { id: 'cat-pets' } });

    expect(result.categories.some((item) => item.id === 'cat-pets')).toBe(false);
    expect(result.transactions.map((tx) => tx.id)).toEqual(['tx-food']);
    expect(result.budgets).toEqual({ '2026-10': { 'cat-food': 40000 } });
  });
});

describe('presupuestos', () => {
  it('define un presupuesto para el mes', () => {
    const result = financeReducer(baseState(), {
      type: 'set-budget',
      payload: { month: '2026-11', categoryId: 'cat-food', amount: 50000 },
    });

    expect(result.budgets['2026-11']).toEqual({ 'cat-food': 50000 });
  });

  it('borra la entrada al poner 0 y elimina el mes vacío', () => {
    const state = baseState({ budgets: { '2026-11': { 'cat-food': 50000, 'cat-home': 90000 } } });

    const conCero = financeReducer(state, {
      type: 'set-budget',
      payload: { month: '2026-11', categoryId: 'cat-food', amount: 0 },
    });
    expect(conCero.budgets['2026-11']).toEqual({ 'cat-home': 90000 });

    const vacio = financeReducer(conCero, {
      type: 'set-budget',
      payload: { month: '2026-11', categoryId: 'cat-home', amount: 0 },
    });
    expect(vacio.budgets).toEqual({});
  });

  it('copia los presupuestos del mes anterior sin compartir la referencia', () => {
    const state = baseState({ budgets: { '2026-10': { 'cat-food': 50000 } } });
    const result = financeReducer(state, {
      type: 'copy-budgets',
      payload: { from: '2026-10', to: '2026-11' },
    });

    expect(result.budgets['2026-11']).toEqual({ 'cat-food': 50000 });
    expect(result.budgets['2026-11']).not.toBe(result.budgets['2026-10']);
  });

  it('no hace nada si el mes origen no tiene presupuestos', () => {
    const state = baseState();
    const result = financeReducer(state, {
      type: 'copy-budgets',
      payload: { from: '2026-10', to: '2026-11' },
    });

    expect(result).toBe(state);
  });
});

describe('acciones globales', () => {
  it('cambia la moneda', () => {
    expect(
      financeReducer(baseState(), { type: 'set-currency', payload: 'USD' }).currency,
    ).toBe('USD');
  });

  it('reemplaza el estado completo al importar', () => {
    const imported = baseState({ currency: 'EUR', transactions: [expense()] });
    const result = financeReducer(baseState(), { type: 'replace-state', payload: imported });
    expect(result).toBe(imported);
  });

  it('carga los datos de ejemplo conservando la moneda', () => {
    const result = financeReducer(baseState({ currency: 'USD' }), { type: 'load-demo' });

    expect(result.currency).toBe('USD');
    expect(result.transactions.length).toBeGreaterThan(20);
    expect(Object.keys(result.budgets)).toHaveLength(4);
    expect(result.categories).toHaveLength(12);
  });

  it('reinicia todo conservando la moneda', () => {
    const state = baseState({
      currency: 'CLP',
      transactions: [expense()],
      budgets: { '2026-11': { 'cat-food': 1000 } },
    });
    const result = financeReducer(state, { type: 'reset' });

    expect(result.currency).toBe('CLP');
    expect(result.transactions).toEqual([]);
    expect(result.budgets).toEqual({});
    expect(result.categories).toHaveLength(12);
  });
});
