import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MonthSummary } from '../lib/calculations';
import { SummaryCards } from './SummaryCards';

const summary: MonthSummary = { income: 100000, expense: 40000, balance: 60000, savingsRate: 0.6 };
const previous: MonthSummary = { income: 80000, expense: 50000, balance: 30000, savingsRate: 0.375 };

describe('SummaryCards', () => {
  it('muestra los montos, el ahorro y las comparaciones', () => {
    const { container } = render(
      <SummaryCards summary={summary} previous={previous} currency="ARS" />,
    );

    expect(screen.getByText('Ingresos')).toBeInTheDocument();
    expect(screen.getByText('Gastos')).toBeInTheDocument();
    expect(screen.getByText('Balance')).toBeInTheDocument();
    expect(screen.getByText('Ahorro')).toBeInTheDocument();
    expect(screen.getAllByText(/100\.000/).length).toBeGreaterThan(0);
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getAllByText(/vs\. mes anterior/)).toHaveLength(3);
    expect(container.querySelectorAll('.delta--good')).toHaveLength(3);
    expect(container.querySelectorAll('.delta--bad')).toHaveLength(0);
  });

  it('marca en rojo las variaciones desfavorables', () => {
    const worse: MonthSummary = {
      income: 50000,
      expense: 70000,
      balance: -20000,
      savingsRate: -0.4,
    };
    const better: MonthSummary = { income: 60000, expense: 50000, balance: 10000, savingsRate: 0.166 };

    const { container } = render(<SummaryCards summary={worse} previous={better} currency="ARS" />);

    expect(container.querySelectorAll('.delta--bad')).toHaveLength(3);
    expect(screen.getByText('-40%')).toBeInTheDocument();
  });

  it('avisa cuando no hay datos del mes anterior', () => {
    render(
      <SummaryCards
        summary={summary}
        previous={{ income: 0, expense: 0, balance: 0, savingsRate: null }}
        currency="ARS"
      />,
    );

    expect(screen.getAllByText('Sin datos del mes anterior')).toHaveLength(3);
  });

  it('muestra un guion cuando no hay ingresos para calcular el ahorro', () => {
    render(
      <SummaryCards
        summary={{ income: 0, expense: 1000, balance: -1000, savingsRate: null }}
        previous={{ income: 0, expense: 0, balance: 0, savingsRate: null }}
        currency="USD"
      />,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Sin ingresos registrados')).toBeInTheDocument();
  });
});
