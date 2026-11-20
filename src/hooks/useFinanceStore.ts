import { useEffect, useReducer } from 'react';
import type { Category, CurrencyCode, FinanceState, Transaction } from '../types';
import { buildDemoState } from '../lib/seed';
import { createInitialState, loadState, saveState } from '../lib/storage';

export type FinanceAction =
  | { type: 'add-transaction'; payload: Omit<Transaction, 'id'> }
  | { type: 'update-transaction'; payload: Transaction }
  | { type: 'delete-transaction'; payload: { id: string } }
  | { type: 'add-category'; payload: Omit<Category, 'id'> }
  | { type: 'update-category'; payload: Category }
  | { type: 'delete-category'; payload: { id: string } }
  | { type: 'set-budget'; payload: { month: string; categoryId: string; amount: number } }
  | { type: 'copy-budgets'; payload: { from: string; to: string } }
  | { type: 'set-currency'; payload: CurrencyCode }
  | { type: 'replace-state'; payload: FinanceState }
  | { type: 'load-demo' }
  | { type: 'reset' };

function uid(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}-${random}`;
}

function withoutEmptyBudgets(entries: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(entries)) {
    if (value > 0) result[key] = value;
  }
  return result;
}

export function financeReducer(state: FinanceState, action: FinanceAction): FinanceState {
  switch (action.type) {
    case 'add-transaction':
      return {
        ...state,
        transactions: [{ ...action.payload, id: uid('tx') }, ...state.transactions],
      };

    case 'update-transaction':
      return {
        ...state,
        transactions: state.transactions.map((tx) =>
          tx.id === action.payload.id ? action.payload : tx,
        ),
      };

    case 'delete-transaction':
      return {
        ...state,
        transactions: state.transactions.filter((tx) => tx.id !== action.payload.id),
      };

    case 'add-category':
      return {
        ...state,
        categories: [...state.categories, { ...action.payload, id: uid('cat') }],
      };

    case 'update-category':
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === action.payload.id ? action.payload : category,
        ),
      };

    case 'delete-category': {
      const budgets: FinanceState['budgets'] = {};
      for (const [month, entries] of Object.entries(state.budgets)) {
        const next = { ...entries };
        delete next[action.payload.id];
        if (Object.keys(next).length > 0) budgets[month] = next;
      }
      return {
        ...state,
        categories: state.categories.filter((category) => category.id !== action.payload.id),
        transactions: state.transactions.filter((tx) => tx.categoryId !== action.payload.id),
        budgets,
      };
    }

    case 'set-budget': {
      const { month, categoryId, amount } = action.payload;
      const monthBudgets = withoutEmptyBudgets({
        ...(state.budgets[month] ?? {}),
        [categoryId]: amount,
      });
      const budgets = { ...state.budgets };
      if (Object.keys(monthBudgets).length > 0) budgets[month] = monthBudgets;
      else delete budgets[month];
      return { ...state, budgets };
    }

    case 'copy-budgets': {
      const source = state.budgets[action.payload.from];
      if (!source || Object.keys(source).length === 0) return state;
      return {
        ...state,
        budgets: { ...state.budgets, [action.payload.to]: { ...source } },
      };
    }

    case 'set-currency':
      return { ...state, currency: action.payload };

    case 'replace-state':
      return action.payload;

    case 'load-demo':
      return buildDemoState(state.currency);

    case 'reset':
      return createInitialState(state.currency);

    default:
      return state;
  }
}

export function useFinanceStore() {
  const [state, dispatch] = useReducer(financeReducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  return { state, dispatch };
}
