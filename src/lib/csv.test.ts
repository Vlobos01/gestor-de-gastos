import { describe, expect, it } from 'vitest';
import type { FinanceState } from '../types';
import { transactionsToCSV } from './csv';

const state: FinanceState = {
  version: 1,
  currency: 'ARS',
  categories: [
    { id: 'food', name: 'Comida', type: 'expense', color: '#f97316', emoji: '🍔' },
    { id: 'salary', name: 'Sueldo', type: 'income', color: '#22c55e', emoji: '💼' },
  ],
  transactions: [
    {
      id: 'b',
      type: 'income',
      amount: 100000,
      categoryId: 'salary',
      date: '2026-11-01',
      note: 'Sueldo de noviembre',
    },
    {
      id: 'a',
      type: 'expense',
      amount: 1500.5,
      categoryId: 'food',
      date: '2026-10-05',
      note: 'Cena, cine "especial"\nsegunda línea',
    },
    {
      id: 'c',
      type: 'expense',
      amount: 700,
      categoryId: 'borrada',
      date: '2026-10-20',
      note: '',
    },
  ],
  budgets: {},
};

describe('transactionsToCSV', () => {
  it('incluye encabezados y BOM para Excel', () => {
    const csv = transactionsToCSV(state);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('Fecha,Tipo,Categoría,Monto,Nota\r\n');
  });

  it('ordena cronológicamente y traduce el tipo', () => {
    const lines = transactionsToCSV(state).split('\r\n');
    expect(lines[1]).toContain('2026-10-05,Gasto,Comida,1500.5');
    expect(lines[3]).toContain('2026-11-01,Ingreso,Sueldo,100000');
  });

  it('escapa comas, comillas y saltos de línea', () => {
    expect(transactionsToCSV(state)).toContain(
      '"Cena, cine ""especial""\nsegunda línea"',
    );
  });

  it('usa la categoría desconocida si el id no existe', () => {
    expect(transactionsToCSV(state)).toContain('2026-10-20,Gasto,Sin categoría,700,');
  });

  it('termina la última fila con CRLF', () => {
    expect(transactionsToCSV(state).endsWith('\r\n')).toBe(true);
  });

  it('exporta solo encabezados si no hay movimientos', () => {
    const csv = transactionsToCSV({ ...state, transactions: [] });
    expect(csv).toBe('\uFEFFFecha,Tipo,Categoría,Monto,Nota\r\n');
  });
});
