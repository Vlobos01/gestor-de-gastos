import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Category, Transaction } from '../types';
import { BudgetPanel } from './BudgetPanel';

const categories: Category[] = [
  { id: 'cat-food', name: 'Comida', type: 'expense', color: '#f97316', emoji: '🍔' },
  { id: 'cat-leisure', name: 'Ocio', type: 'expense', color: '#ec4899', emoji: '🎬' },
  { id: 'cat-health', name: 'Salud', type: 'expense', color: '#10b981', emoji: '💊' },
  { id: 'cat-other', name: 'Otros', type: 'expense', color: '#94a3b8', emoji: '🧾' },
  { id: 'cat-salary', name: 'Sueldo', type: 'income', color: '#22c55e', emoji: '💼' },
];

const transactions: Transaction[] = [
  {
    id: 't1',
    type: 'expense',
    amount: 25000,
    categoryId: 'cat-food',
    date: '2026-11-05',
    note: 'Supermercado',
  },
  {
    id: 't2',
    type: 'expense',
    amount: 9000,
    categoryId: 'cat-leisure',
    date: '2026-11-06',
    note: 'Cine',
  },
  {
    id: 't3',
    type: 'expense',
    amount: 500,
    categoryId: 'cat-health',
    date: '2026-11-07',
    note: 'Farmacia',
  },
  {
    id: 't4',
    type: 'income',
    amount: 200000,
    categoryId: 'cat-salary',
    date: '2026-11-01',
    note: 'Sueldo',
  },
];

const budgets = { 'cat-food': 50000, 'cat-leisure': 10000 };

function renderPanel(overrides: Partial<Parameters<typeof BudgetPanel>[0]> = {}) {
  const onSetBudget = vi.fn();
  const onCopyPrevious = vi.fn();
  const result = render(
    <BudgetPanel
      categories={categories}
      transactions={transactions}
      month="2026-11"
      budgets={budgets}
      currency="ARS"
      canCopyPrevious={false}
      onSetBudget={onSetBudget}
      onCopyPrevious={onCopyPrevious}
      {...overrides}
    />,
  );
  return { ...result, onSetBudget, onCopyPrevious, user: userEvent.setup() };
}

describe('BudgetPanel', () => {
  it('calcula totales y solo lista categorías de gasto', () => {
    renderPanel();

    expect(screen.getByText('Presupuestado')).toBeInTheDocument();
    expect(screen.getAllByText(/60\.000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/34\.500/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/25\.500/).length).toBeGreaterThan(0);
    expect(screen.queryByText('Sueldo')).not.toBeInTheDocument();
  });

  it('muestra el porcentaje y el estado de cada barra', () => {
    const { container } = renderPanel();

    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();

    const bars = container.querySelectorAll('.progress__bar');
    expect(bars).toHaveLength(2);
    expect(bars[0]).toHaveAttribute('data-state', 'ok');
    expect(bars[1]).toHaveAttribute('data-state', 'warn');
  });

  it('marca excedido cuando el gasto supera el presupuesto', () => {
    const { container } = renderPanel({ budgets: { 'cat-food': 10000 } });

    expect(screen.getByText('250%')).toBeInTheDocument();
    expect(container.querySelector('.progress__bar')).toHaveAttribute('data-state', 'over');
    expect(container.querySelector('.badge--over')).toBeInTheDocument();
  });

  it('permite editar el presupuesto de una categoría', () => {
    const { onSetBudget } = renderPanel();

    fireEvent.change(screen.getByLabelText('Presupuesto de Comida para 2026-11'), {
      target: { value: '60000' },
    });

    expect(onSetBudget).toHaveBeenCalledWith('cat-food', 60000);
  });

  it('indica las categorías sin presupuesto', () => {
    renderPanel();

    expect(screen.getByText(/gastado · sin presupuesto/)).toBeInTheDocument();
    expect(screen.getByText('Sin presupuesto definido')).toBeInTheDocument();
  });

  it('deshabilita copiar si el mes anterior no tiene presupuestos', () => {
    renderPanel({ canCopyPrevious: false });
    expect(screen.getByRole('button', { name: /Copiar mes anterior/ })).toBeDisabled();
  });

  it('copia los presupuestos del mes anterior', async () => {
    const { onCopyPrevious, user } = renderPanel({ canCopyPrevious: true });
    const button = screen.getByRole('button', { name: /Copiar mes anterior/ });

    expect(button).toBeEnabled();
    await user.click(button);
    expect(onCopyPrevious).toHaveBeenCalledTimes(1);
  });
});
