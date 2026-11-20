import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Category, Transaction } from '../types';
import { CategoryManager } from './CategoryManager';

const categories: Category[] = [
  { id: 'cat-food', name: 'Comida', type: 'expense', color: '#f97316', emoji: '🍔' },
  { id: 'cat-salary', name: 'Sueldo', type: 'income', color: '#22c55e', emoji: '💼' },
];

const transactions: Transaction[] = [
  {
    id: 't1',
    type: 'expense',
    amount: 1000,
    categoryId: 'cat-food',
    date: '2026-11-05',
    note: 'Uno',
  },
  {
    id: 't2',
    type: 'expense',
    amount: 2000,
    categoryId: 'cat-food',
    date: '2026-11-06',
    note: 'Dos',
  },
];

function renderManager() {
  const onAdd = vi.fn();
  const onUpdate = vi.fn();
  const onDelete = vi.fn();
  const onClose = vi.fn();
  render(
    <CategoryManager
      categories={categories}
      transactions={transactions}
      onAdd={onAdd}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onClose={onClose}
    />,
  );
  return { onAdd, onUpdate, onDelete, onClose, user: userEvent.setup() };
}

describe('CategoryManager', () => {
  it('crea una categoría con el color y emoji elegidos', async () => {
    const { onAdd, user } = renderManager();

    await user.type(screen.getByLabelText('Nombre'), 'Mascotas');
    await user.clear(screen.getByLabelText('Ícono'));
    await user.type(screen.getByLabelText('Ícono'), '🐶');
    await user.click(screen.getByRole('button', { name: 'Elegir color #0ea5e9' }));
    await user.click(screen.getByRole('button', { name: 'Agregar categoría' }));

    expect(onAdd).toHaveBeenCalledWith({
      name: 'Mascotas',
      emoji: '🐶',
      color: '#0ea5e9',
      type: 'expense',
    });
  });

  it('permite elegir un ícono de la paleta rápida', async () => {
    const { onAdd, user } = renderManager();

    await user.type(screen.getByLabelText('Nombre'), 'Mascotas');
    await user.click(screen.getByRole('button', { name: 'Elegir ícono 🐶' }));
    await user.click(screen.getByRole('button', { name: 'Agregar categoría' }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ emoji: '🐶' }));
  });

  it('valida nombres cortos y duplicados', async () => {
    const { onAdd, user } = renderManager();

    await user.type(screen.getByLabelText('Nombre'), 'a');
    await user.click(screen.getByRole('button', { name: 'Agregar categoría' }));
    expect(screen.getByRole('alert')).toHaveTextContent('al menos 2 caracteres');

    await user.clear(screen.getByLabelText('Nombre'));
    await user.type(screen.getByLabelText('Nombre'), 'comida');
    await user.click(screen.getByRole('button', { name: 'Agregar categoría' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Ya existe una categoría con ese nombre.');
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('edita una categoría existente', async () => {
    const { onUpdate, user } = renderManager();

    await user.click(screen.getByRole('button', { name: 'Editar Comida' }));
    expect(screen.getByLabelText('Nombre')).toHaveValue('Comida');

    await user.clear(screen.getByLabelText('Nombre'));
    await user.type(screen.getByLabelText('Nombre'), 'Alimentos');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onUpdate).toHaveBeenCalledWith({
      id: 'cat-food',
      name: 'Alimentos',
      emoji: '🍔',
      color: '#f97316',
      type: 'expense',
    });
  });

  it('confirma la eliminación e informa cuántos movimientos se pierden', async () => {
    const { onDelete, user } = renderManager();

    await user.click(screen.getByRole('button', { name: 'Eliminar Comida' }));

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Se eliminarán también 2 movimientos'),
    );
    expect(onDelete).toHaveBeenCalledWith('cat-food');
  });

  it('no elimina si el usuario cancela', async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const { onDelete, user } = renderManager();

    await user.click(screen.getByRole('button', { name: 'Eliminar Comida' }));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('permite crear categorías de ingreso', async () => {
    const { onAdd, user } = renderManager();

    await user.click(screen.getByRole('button', { name: 'Ingreso' }));
    await user.type(screen.getByLabelText('Nombre'), 'Alquiler cobrado');
    await user.click(screen.getByRole('button', { name: 'Agregar categoría' }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ type: 'income' }));
  });
});
