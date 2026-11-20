import type { CurrencyCode } from '../types';

export const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: 'ARS', label: 'Peso argentino (ARS)' },
  { code: 'USD', label: 'Dólar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'MXN', label: 'Peso mexicano (MXN)' },
  { code: 'CLP', label: 'Peso chileno (CLP)' },
  { code: 'COP', label: 'Peso colombiano (COP)' },
];

export const CURRENCY_CODES = CURRENCIES.map((item) => item.code);

export const CATEGORY_COLORS = [
  '#f97316',
  '#0ea5e9',
  '#8b5cf6',
  '#eab308',
  '#ec4899',
  '#10b981',
  '#6366f1',
  '#94a3b8',
  '#22c55e',
  '#14b8a6',
];

const formatterCache = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: CurrencyCode, decimals: boolean): Intl.NumberFormat {
  const key = `${currency}:${decimals ? 2 : 0}`;
  const cached = formatterCache.get(key);
  if (cached) return cached;

  const formatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
  formatterCache.set(key, formatter);
  return formatter;
}

export function formatCurrency(value: number, currency: CurrencyCode): string {
  const decimals = Math.abs(value - Math.round(value)) > 0.005;
  return currencyFormatter(currency, decimals).format(value);
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function compactNumber(value: number): string {
  return new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
