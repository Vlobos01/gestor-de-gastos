import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowDown,
  faArrowTrendUp,
  faArrowUp,
  faPiggyBank,
  faReceipt,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';
import type { CurrencyCode } from '../types';
import type { MonthSummary } from '../lib/calculations';
import { formatCurrency, formatPercent } from '../lib/format';

interface SummaryCardsProps {
  summary: MonthSummary;
  previous: MonthSummary;
  currency: CurrencyCode;
}

interface DeltaProps {
  current: number;
  previous: number;
  higherIsBetter: boolean;
}

function Delta({ current, previous, higherIsBetter }: DeltaProps) {
  if (previous === 0) {
    return <span className="delta delta--neutral">Sin datos del mes anterior</span>;
  }

  const change = (current - previous) / previous;
  const isUp = change >= 0;
  const isGood = isUp === higherIsBetter;

  return (
    <span className={`delta ${isGood ? 'delta--good' : 'delta--bad'}`}>
      <FontAwesomeIcon icon={isUp ? faArrowUp : faArrowDown} />
      {formatPercent(Math.abs(change))} vs. mes anterior
    </span>
  );
}

export function SummaryCards({ summary, previous, currency }: SummaryCardsProps) {
  const savings = summary.savingsRate;

  return (
    <section className="summary-grid" aria-label="Resumen del mes">
      <article className="summary-card summary-card--income">
        <div className="summary-card__head">
          <span className="summary-card__label">Ingresos</span>
          <span className="summary-card__icon" aria-hidden="true">
            <FontAwesomeIcon icon={faArrowTrendUp} />
          </span>
        </div>
        <span className="summary-card__value summary-card__value--positive">
          {formatCurrency(summary.income, currency)}
        </span>
        <Delta current={summary.income} previous={previous.income} higherIsBetter />
      </article>

      <article className="summary-card summary-card--expense">
        <div className="summary-card__head">
          <span className="summary-card__label">Gastos</span>
          <span className="summary-card__icon" aria-hidden="true">
            <FontAwesomeIcon icon={faReceipt} />
          </span>
        </div>
        <span className="summary-card__value">{formatCurrency(summary.expense, currency)}</span>
        <Delta current={summary.expense} previous={previous.expense} higherIsBetter={false} />
      </article>

      <article className={`summary-card summary-card--balance ${summary.balance < 0 ? 'is-negative' : ''}`}>
        <div className="summary-card__head">
          <span className="summary-card__label">Balance</span>
          <span className="summary-card__icon" aria-hidden="true">
            <FontAwesomeIcon icon={faWallet} />
          </span>
        </div>
        <span className="summary-card__value">{formatCurrency(summary.balance, currency)}</span>
        <Delta current={summary.balance} previous={previous.balance} higherIsBetter />
      </article>

      <article className="summary-card summary-card--savings">
        <div className="summary-card__head">
          <span className="summary-card__label">Ahorro</span>
          <span className="summary-card__icon" aria-hidden="true">
            <FontAwesomeIcon icon={faPiggyBank} />
          </span>
        </div>
        <span className="summary-card__value">{savings === null ? '—' : formatPercent(savings)}</span>
        <span className="delta delta--neutral">
          {savings === null ? 'Sin ingresos registrados' : 'de tus ingresos del mes'}
        </span>
      </article>
    </section>
  );
}
