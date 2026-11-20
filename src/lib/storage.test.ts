import { describe, expect, it } from 'vitest';
import type { FinanceState } from '../types';
import { DEFAULT_CATEGORIES } from './defaults';
import {
  createInitialState,
  loadState,
  parseImportedState,
  sanitizeState,
  saveState,
} from './storage';

function validState(overrides: Partial<FinanceState> = {}): FinanceState {
  return {
    version: 1,
    currency: 'ARS',
    categories: [{ ...DEFAULT_CATEGORIES[0] }],
    transactions: [
      {
        id: 't1',
        type: 'expense',
        amount: 1500,
        categoryId: 'cat-food',
        date: '2026-11-05',
        note: 'Supermercado',
      },
    ],
    budgets: { '2026-11': { 'cat-food': 50000 } },
    ...overrides,
  };
}

describe('createInitialState', () => {
  it('arranca vacío con las categorías por defecto y la moneda pedida', () => {
    const state = createInitialState('USD');
    expect(state.version).toBe(1);
    expect(state.currency).toBe('USD');
    expect(state.transactions).toEqual([]);
    expect(state.budgets).toEqual({});
    expect(state.categories).toHaveLength(DEFAULT_CATEGORIES.length);
  });

  it('clona las categorías para no mutar las originales', () => {
    const state = createInitialState();
    state.categories[0].name = 'Cambiada';
    expect(DEFAULT_CATEGORIES[0].name).toBe('Comida');
  });
});

describe('sanitizeState', () => {
  it('acepta un estado válido', () => {
    const state = sanitizeState(validState());
    expect(state).not.toBeNull();
    expect(state?.transactions).toHaveLength(1);
    expect(state?.budgets['2026-11']['cat-food']).toBe(50000);
  });

  it('rechaza valores que no son objetos o tienen otra versión', () => {
    expect(sanitizeState(null)).toBeNull();
    expect(sanitizeState('texto')).toBeNull();
    expect(sanitizeState([])).toBeNull();
    expect(sanitizeState({ ...validState(), version: 2 })).toBeNull();
  });

  it('rechaza estados sin categorías válidas', () => {
    expect(sanitizeState({ ...validState(), categories: [] })).toBeNull();
    expect(
      sanitizeState({ ...validState(), categories: [{ id: 'x', name: 'Rota' }] }),
    ).toBeNull();
  });

  it('descarta movimientos inválidos y conserva los válidos', () => {
    const state = sanitizeState({
      ...validState(),
      transactions: [
        ...validState().transactions,
        { id: 't2', type: 'expense', amount: 0, categoryId: 'cat-food', date: '2026-11-05', note: '' },
        { id: 't3', type: 'expense', amount: 10, categoryId: 'cat-food', date: '2026-02-30', note: '' },
        { id: 't4', type: 'otro', amount: 10, categoryId: 'cat-food', date: '2026-11-05', note: '' },
      ],
    });

    expect(state?.transactions.map((tx) => tx.id)).toEqual(['t1']);
  });

  it('limpia presupuestos con meses o montos inválidos', () => {
    const state = sanitizeState({
      ...validState(),
      budgets: {
        '2026-11': { 'cat-food': 0, 'cat-home': 1000 },
        '2026-13': { 'cat-food': 500 },
        'noviembre': { 'cat-food': 500 },
        '2026-12': { 'cat-food': -10 },
      },
    });

    expect(state?.budgets).toEqual({ '2026-11': { 'cat-home': 1000 } });
  });

  it('usa ARS si la moneda no es válida', () => {
    expect(sanitizeState({ ...validState(), currency: 'GBP' })?.currency).toBe('ARS');
  });
});

describe('loadState y saveState', () => {
  it('guarda y recupera el estado desde localStorage', () => {
    const state = validState();
    saveState(state);
    expect(loadState()).toEqual(state);
  });

  it('devuelve el estado inicial si no hay datos guardados', () => {
    expect(loadState()).toEqual(createInitialState());
  });

  it('ignora un JSON corrupto y arranca limpio', () => {
    localStorage.setItem('gestor-gastos:v1', '{ roto');
    expect(loadState()).toEqual(createInitialState());
  });

  it('ignora un estado con formato inválido', () => {
    localStorage.setItem('gestor-gastos:v1', JSON.stringify({ hola: true }));
    expect(loadState()).toEqual(createInitialState());
  });
});

describe('parseImportedState', () => {
  it('lee un respaldo JSON válido', () => {
    expect(parseImportedState(JSON.stringify(validState()))).toEqual(validState());
  });

  it('lanza un error claro si el JSON está roto', () => {
    expect(() => parseImportedState('{ roto')).toThrow('El archivo no es un JSON válido.');
  });

  it('lanza un error claro si el formato no es el esperado', () => {
    expect(() => parseImportedState(JSON.stringify({ hola: true }))).toThrow(
      'El archivo no tiene el formato de respaldo esperado.',
    );
  });
});
