import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Category, Transaction } from '../types';
import { TransactionList } from './TransactionList';

const categories: Category[] = [
  { id: 'cat-food', name: 'Comida', type: 'expense', color: '#f97316', emoji: '🍔' },
  { id: 'cat-salary', name: 'Sueldo', type: 'income', color: '#22c55e', emoji: '💼' },
];

const transactions: Transaction[] = [
  {
    id: 'tx-1',
    type: 'expense',
    amount: 25000,
    categoryId: 'cat-food',
    date: '2026-11-05',
    note: 'Supermercado',
  },
  {
    id: 'tx-2',
    type: 'income',
    amount: 100000,
    categoryId: 'cat-salary',
    date: '2026-11-03',
    note: 'Sueldo',
  },
  {
    id: 'tx-3',
    type: 'expense',
    amount: 5000,
    categoryId: 'cat-food',
    date: '2026-11-10',
    note: 'Cine',
  },
  {
    id: 'tx-4',
    type: 'expense',
    amount: 7000,
    categoryId: 'cat-ghost',
    date: '2026-11-08',
    note: 'Varios',
  },
];

function renderList(overrides: Partial<Parameters<typeof TransactionList>[0]> = {}) {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <TransactionList
      transactions={transactions}
      categories={categories}
      currency="ARS"
      onEdit={onEdit}
      onDelete={onDelete}
      {...overrides}
    />,
  );
  return { onEdit, onDelete, user: userEvent.setup() };
}

describe('TransactionList', () => {
  it('lista los movimientos ordenados y muestra el neto', () => {
    renderList();

    expect(screen.getByText('Supermercado')).toBeInTheDocument();
    expect(screen.getByText('Sueldo')).toBeInTheDocument();
    expect(screen.getByText('Cine')).toBeInTheDocument();
    expect(screen.getByText('Varios')).toBeInTheDocument();
    expect(screen.getByText(/4 movimientos/)).toBeInTheDocument();
    expect(screen.getByText(/63\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Sin categoría/)).toBeInTheDocument();
  });

  it('filtra por tipo y por categoría', async () => {
    const { user } = renderList();

    await user.selectOptions(screen.getByLabelText('Filtrar por tipo'), 'income');
    expect(screen.getByText('Sueldo')).toBeInTheDocument();
    expect(screen.queryByText('Supermercado')).not.toBeInTheDocument();
    expect(screen.getByText(/1 movimiento/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Filtrar por tipo'), 'all');
    await user.selectOptions(screen.getByLabelText('Filtrar por categoría'), 'cat-food');
    expect(screen.getByText('Supermercado')).toBeInTheDocument();
    expect(screen.getByText('Cine')).toBeInTheDocument();
    expect(screen.queryByText('Sueldo')).not.toBeInTheDocument();
  });

  it('busca por nota y permite limpiar los filtros', async () => {
    const { user } = renderList();

    await user.type(screen.getByLabelText('Buscar movimientos'), 'cine');
    expect(screen.getByText('Cine')).toBeInTheDocument();
    expect(screen.queryByText('Sueldo')).not.toBeInTheDocument();
    expect(screen.queryByText('Supermercado')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(screen.getByLabelText('Buscar movimientos')).toHaveValue('');
    expect(screen.getByText('Supermercado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument();
  });

  it('muestra un estado vacío distinto si hay filtros', async () => {
    const { user } = renderList();

    await user.type(screen.getByLabelText('Buscar movimientos'), 'inexistente');
    expect(screen.getByText('No hay movimientos con esos filtros')).toBeInTheDocument();
  });

  it('muestra el estado vacío sin movimientos', () => {
    renderList({ transactions: [] });
    expect(screen.getByText('Todavía no hay movimientos este mes')).toBeInTheDocument();
  });

  it('dispara edición y eliminación', async () => {
    const { onEdit, onDelete, user } = renderList();

    await user.click(screen.getByRole('button', { name: 'Editar Supermercado' }));
    expect(onEdit).toHaveBeenCalledWith(transactions[0]);

    await user.click(screen.getByRole('button', { name: 'Eliminar Cine' }));
    expect(onDelete).toHaveBeenCalledWith('tx-3');
  });
});
