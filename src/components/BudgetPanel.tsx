import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { useMemo, type CSSProperties } from 'react';
import type { Category, CurrencyCode, Transaction } from '../types';
import { buildBudgetRows } from '../lib/calculations';
import { formatCurrency, formatPercent } from '../lib/format';

interface BudgetPanelProps {
  categories: Category[];
  transactions: Transaction[];
  month: string;
  budgets: Record<string, number>;
  currency: CurrencyCode;
  canCopyPrevious: boolean;
  onSetBudget: (categoryId: string, amount: number) => void;
  onCopyPrevious: () => void;
}

function progressState(ratio: number): 'ok' | 'warn' | 'over' {
  if (ratio > 1) return 'over';
  if (ratio >= 0.8) return 'warn';
  return 'ok';
}

export function BudgetPanel({
  categories,
  transactions,
  month,
  budgets,
  currency,
  canCopyPrevious,
  onSetBudget,
  onCopyPrevious,
}: BudgetPanelProps) {
  const rows = useMemo(
    () => buildBudgetRows(categories, transactions, budgets),
    [categories, transactions, budgets],
  );

  const totalBudget = rows.reduce((total, row) => total + row.budget, 0);
  const totalSpent = rows.reduce((total, row) => total + row.spent, 0);
  const available = totalBudget - totalSpent;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Presupuestos del mes</h2>
          <p className="panel-subtitle">Definí un límite por categoría y seguí el avance.</p>
        </div>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onCopyPrevious}
          disabled={!canCopyPrevious}
          title={
            canCopyPrevious
              ? 'Copia los presupuestos del mes anterior'
              : 'El mes anterior no tiene presupuestos'
          }
        >
          <FontAwesomeIcon icon={faCopy} />
          Copiar mes anterior
        </button>
      </div>

      <div className="budget-summary">
        <div className="budget-summary__item">
          <span className="budget-summary__label">Presupuestado</span>
          <span className="budget-summary__value">{formatCurrency(totalBudget, currency)}</span>
        </div>
        <div className="budget-summary__item">
          <span className="budget-summary__label">Gastado</span>
          <span className="budget-summary__value">{formatCurrency(totalSpent, currency)}</span>
        </div>
        <div className="budget-summary__item">
          <span className="budget-summary__label">Disponible</span>
          <span className={`budget-summary__value ${available < 0 ? 'is-negative' : ''}`}>
            {formatCurrency(available, currency)}
          </span>
        </div>
      </div>

      <div className="budget-list">
        {rows.map((row) => {
          const state = progressState(row.ratio);
          return (
            <div className="budget-row" key={row.category.id}>
              <div className="budget-row__head">
                <span className="budget-row__name">
                  <span
                    className="budget-row__emoji"
                    style={{ '--cat-color': row.category.color } as CSSProperties}
                    aria-hidden="true"
                  >
                    {row.category.emoji}
                  </span>
                  {row.category.name}
                </span>
                <input
                  className="budget-input"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="Presupuesto"
                  value={row.budget > 0 ? row.budget : ''}
                  onChange={(event) => onSetBudget(row.category.id, Number(event.target.value) || 0)}
                  aria-label={`Presupuesto de ${row.category.name} para ${month}`}
                />
              </div>

              {row.budget > 0 ? (
                <>
                  <div className="progress">
                    <div
                      className="progress__bar"
                      data-state={state}
                      style={{ width: `${Math.min(row.ratio, 1) * 100}%` }}
                    />
                  </div>
                  <div className="budget-row__foot">
                    <span>
                      {formatCurrency(row.spent, currency)} de {formatCurrency(row.budget, currency)}
                    </span>
                    <span className={`badge badge--${state}`}>{formatPercent(row.ratio)}</span>
                  </div>
                </>
              ) : (
                <div className="budget-row__foot budget-row__foot--muted">
                  <span>
                    {row.spent > 0
                      ? `${formatCurrency(row.spent, currency)} gastado · sin presupuesto`
                      : 'Sin presupuesto definido'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
