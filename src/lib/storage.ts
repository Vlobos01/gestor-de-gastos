import type { BudgetMap, Category, CurrencyCode, FinanceState, Transaction } from '../types';
import { DEFAULT_CATEGORIES } from './defaults';
import { isISODate, isMonthKey } from './date';
import { CURRENCY_CODES } from './format';

const STORAGE_KEY = 'gestor-gastos:v1';

export function createInitialState(currency: CurrencyCode = 'ARS'): FinanceState {
  return {
    version: 1,
    currency,
    categories: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
    transactions: [],
    budgets: {},
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCurrency(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && (CURRENCY_CODES as string[]).includes(value);
}

function isCategory(value: unknown): value is Category {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (value.type === 'income' || value.type === 'expense') &&
    typeof value.color === 'string' &&
    typeof value.emoji === 'string'
  );
}

function isTransaction(value: unknown): value is Transaction {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    (value.type === 'income' || value.type === 'expense') &&
    typeof value.amount === 'number' &&
    Number.isFinite(value.amount) &&
    value.amount > 0 &&
    typeof value.categoryId === 'string' &&
    isISODate(value.date) &&
    typeof value.note === 'string'
  );
}

function sanitizeBudgets(value: unknown): BudgetMap {
  if (!isRecord(value)) return {};
  const result: BudgetMap = {};

  for (const [month, entries] of Object.entries(value)) {
    if (!isMonthKey(month) || !isRecord(entries)) continue;
    const inner: Record<string, number> = {};
    for (const [categoryId, amount] of Object.entries(entries)) {
      if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) {
        inner[categoryId] = amount;
      }
    }
    if (Object.keys(inner).length > 0) result[month] = inner;
  }

  return result;
}

export function sanitizeState(value: unknown): FinanceState | null {
  if (!isRecord(value)) return null;
  if (value.version !== 1) return null;
  if (!Array.isArray(value.categories) || !Array.isArray(value.transactions)) return null;

  const categories = value.categories.filter(isCategory);
  const transactions = value.transactions.filter(isTransaction);
  if (categories.length === 0) return null;

  return {
    version: 1,
    currency: isCurrency(value.currency) ? value.currency : 'ARS',
    categories,
    transactions,
    budgets: sanitizeBudgets(value.budgets),
  };
}

export function loadState(): FinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = sanitizeState(JSON.parse(raw) as unknown);
    return parsed ?? createInitialState();
  } catch {
    return createInitialState();
  }
}

export function saveState(state: FinanceState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Almacenamiento lleno o bloqueado: la app sigue funcionando en memoria.
  }
}

export function parseImportedState(text: string): FinanceState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }

  const state = sanitizeState(parsed);
  if (!state) throw new Error('El archivo no tiene el formato de respaldo esperado.');
  return state;
}
