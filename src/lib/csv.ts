import type { FinanceState } from '../types';
import { UNKNOWN_CATEGORY, categoryByIdMap } from './calculations';

export const CSV_HEADERS = ['Fecha', 'Tipo', 'Categoría', 'Monto', 'Nota'] as const;

/** Escapa un campo según RFC 4180: comillas dobles, comas y saltos de línea. */
function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Exporta los movimientos en orden cronológico.
 * Incluye BOM para que Excel reconozca UTF-8 y usa CRLF entre filas.
 */
export function transactionsToCSV(state: FinanceState): string {
  const categoriesById = categoryByIdMap(state.categories);

  const rows = [...state.transactions]
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .map((tx) => [
      tx.date,
      tx.type === 'income' ? 'Ingreso' : 'Gasto',
      (categoriesById.get(tx.categoryId) ?? UNKNOWN_CATEGORY).name,
      String(tx.amount),
      tx.note,
    ]);

  const lines = [CSV_HEADERS.join(','), ...rows.map((row) => row.map(escapeCell).join(','))];
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
