import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { currentMonth, formatMonthLabel, shiftMonth } from './lib/date';

vi.mock('./components/Charts', () => ({
  Charts: () => <div data-testid="charts">Gráficos</div>,
}));

async function renderApp() {
  const result = render(<App />);
  await screen.findByTestId('charts');
  return result;
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('arranca vacía y permite registrar un movimiento', async () => {
    const user = userEvent.setup();
    await renderApp();

    expect(screen.getByText('Todavía no hay movimientos este mes')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute(
      'href',
      '#contenido',
    );

    await user.type(screen.getByLabelText('Monto'), '1500');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'cat-food');
    await user.type(screen.getByLabelText('Nota (opcional)'), 'Café');
    await user.click(screen.getByRole('button', { name: 'Agregar movimiento' }));

    expect(await screen.findByText('Café')).toBeInTheDocument();
    expect(screen.getByText(/1 movimiento/)).toBeInTheDocument();

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('gestor-gastos:v1') ?? '{}');
      expect(stored.transactions).toHaveLength(1);
      expect(stored.transactions[0].note).toBe('Café');
    });
  });

  it('navega entre meses y vuelve al actual', async () => {
    const user = userEvent.setup();
    await renderApp();

    const previousMonth = shiftMonth(currentMonth(), -1);
    await user.click(screen.getByRole('button', { name: 'Mes anterior' }));

    expect(screen.getByText(formatMonthLabel(previousMonth))).toBeInTheDocument();
    expect(screen.getByText('Todavía no hay movimientos este mes')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hoy' }));
    expect(screen.getByText(formatMonthLabel(currentMonth()))).toBeInTheDocument();
  });

  it('pide confirmación antes de reemplazar datos con el ejemplo', async () => {
    const user = userEvent.setup();
    const confirmMock = vi.mocked(window.confirm);
    await renderApp();

    await user.type(screen.getByLabelText('Monto'), '800');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'cat-food');
    await user.click(screen.getByRole('button', { name: 'Agregar movimiento' }));
    await screen.findByText(/1 movimiento/);

    await user.click(screen.getByLabelText('Abrir ajustes'));
    confirmMock.mockReturnValue(false);
    await user.click(screen.getByRole('button', { name: 'Cargar datos de ejemplo' }));

    expect(confirmMock).toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    confirmMock.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Cargar datos de ejemplo' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Alquiler')).toBeInTheDocument();
  });

  it('elimina movimientos respetando la confirmación', async () => {
    const user = userEvent.setup();
    const confirmMock = vi.mocked(window.confirm);
    await renderApp();

    await user.type(screen.getByLabelText('Monto'), '2000');
    await user.selectOptions(screen.getByLabelText('Categoría'), 'cat-food');
    await user.type(screen.getByLabelText('Nota (opcional)'), 'Cena');
    await user.click(screen.getByRole('button', { name: 'Agregar movimiento' }));
    await screen.findByText('Cena');

    confirmMock.mockReturnValue(false);
    await user.click(screen.getByRole('button', { name: 'Eliminar Cena' }));
    expect(screen.getByText('Cena')).toBeInTheDocument();

    confirmMock.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Eliminar Cena' }));
    await waitFor(() => expect(screen.queryByText('Cena')).not.toBeInTheDocument());
  });

  it('abre y cierra el gestor de categorías', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.click(screen.getByLabelText('Gestionar categorías'));
    expect(screen.getByRole('dialog', { name: 'Categorías' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
