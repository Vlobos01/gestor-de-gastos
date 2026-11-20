import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CATEGORIES } from '../lib/defaults';
import type { Transaction } from '../types';
import { TransactionForm } from './TransactionForm';

function renderForm(overrides: Partial<Parameters<typeof TransactionForm>[0]> = {}) {
  const onSave = vi.fn();
  const onCancelEdit = vi.fn();
  const onManageCategories = vi.fn();
  render(
    <TransactionForm
      categories={DEFAULT_CATEGORIES}
      editing={null}
      defaultDate="2026-11-05"
      onSave={onSave}
      onCancelEdit={onCancelEdit}
      onManageCategories={onManageCategories}
      {...overrides}
    />,
  );
  return { onSave, onCancelEdit, onManageCategories, user: userEvent.setup() };
}

describe('TransactionForm', () => {
  it('registra un gasto válido y normaliza la coma decimal', async () => {
    const { onSave, user } = renderForm();

    await user.type(screen.getByLabelText('Monto'), '1234,56');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'cat-food');
    await user.type(screen.getByLabelText('Nota (opcional)'), '  Supermercado  ');
    await user.click(screen.getByRole('button', { name: 'Agregar movimiento' }));

    expect(onSave).toHaveBeenCalledWith({
      type: 'expense',
      amount: 1234.56,
      categoryId: 'cat-food',
      date: '2026-11-05',
      note: 'Supermercado',
    });
    expect(screen.getByLabelText('Monto')).toHaveValue('');
  });

  it('valida monto y categoría antes de guardar', async () => {
    const { onSave, user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Agregar movimiento' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Ingresá un monto mayor a cero.');

    await user.type(screen.getByLabelText('Monto'), '0');
    await user.click(screen.getByRole('button', { name: 'Agregar movimiento' }));
    expect(onSave).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('Monto'));
    await user.type(screen.getByLabelText('Monto'), '500');
    await user.click(screen.getByRole('button', { name: 'Agregar movimiento' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Elegí una categoría.');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('carga los datos del movimiento en edición', async () => {
    const editing: Transaction = {
      id: 'tx-1',
      type: 'income',
      amount: 50000,
      categoryId: 'cat-salary',
      date: '2026-11-02',
      note: 'Sueldo',
    };
    const { onSave, user } = renderForm({ editing });

    expect(screen.getByLabelText('Monto')).toHaveValue('50000');
    expect(screen.getByLabelText('Categoría')).toHaveValue('cat-salary');
    expect(screen.getByLabelText('Nota (opcional)')).toHaveValue('Sueldo');

    await user.clear(screen.getByLabelText('Monto'));
    await user.type(screen.getByLabelText('Monto'), '52000');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onSave).toHaveBeenCalledWith({
      type: 'income',
      amount: 52000,
      categoryId: 'cat-salary',
      date: '2026-11-02',
      note: 'Sueldo',
    });
  });

  it('al cambiar de tipo limpia la categoría y filtra las opciones', async () => {
    const { user } = renderForm();

    await user.selectOptions(screen.getByLabelText('Categoría'), 'cat-food');
    await user.click(screen.getByRole('button', { name: 'Ingreso' }));

    expect(screen.getByLabelText('Categoría')).toHaveValue('');
    expect(screen.getByRole('option', { name: /Sueldo/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Comida/ })).not.toBeInTheDocument();
  });

  it('invita a crear una categoría si no hay del tipo elegido', async () => {
    const expenseOnly = DEFAULT_CATEGORIES.filter((category) => category.type === 'expense');
    const { onManageCategories, user } = renderForm({ categories: expenseOnly });

    await user.click(screen.getByRole('button', { name: 'Ingreso' }));
    expect(screen.getByText(/No hay categorías de ingreso/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Crear una' }));
    expect(onManageCategories).toHaveBeenCalledTimes(1);
  });

  it('cancela la edición y limpia los campos', async () => {
    const editing: Transaction = {
      id: 'tx-1',
      type: 'expense',
      amount: 900,
      categoryId: 'cat-food',
      date: '2026-11-03',
      note: 'Cena',
    };
    const { onCancelEdit, user } = renderForm({ editing });

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancelEdit).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Monto')).toHaveValue('');
  });
});
