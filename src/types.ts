export type TxType = 'income' | 'expense';

export type CurrencyCode = 'ARS' | 'USD' | 'EUR' | 'MXN' | 'CLP' | 'COP';

export interface Category {
  id: string;
  name: string;
  type: TxType;
  color: string;
  emoji: string;
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  categoryId: string;
  /** Fecha en formato YYYY-MM-DD */
  date: string;
  note: string;
}

/**
 * Presupuestos por mes y categoría:
 * { "2026-11": { "cat-food": 180000 } }
 */
export type BudgetMap = Record<string, Record<string, number>>;

export interface FinanceState {
  version: 1;
  currency: CurrencyCode;
  categories: Category[];
  transactions: Transaction[];
  budgets: BudgetMap;
}
