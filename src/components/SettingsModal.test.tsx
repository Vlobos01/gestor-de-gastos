import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsModal } from './SettingsModal';

function renderSettings(overrides: Partial<Parameters<typeof SettingsModal>[0]> = {}) {
  const onCurrencyChange = vi.fn();
  const onExport = vi.fn();
  const onExportCsv = vi.fn();
  const onImport = vi.fn(async (_file: File): Promise<string | null> => null);
  const onLoadDemo = vi.fn();
  const onReset = vi.fn();
  const onClose = vi.fn();
  const result = render(
    <SettingsModal
      currency="ARS"
      onCurrencyChange={onCurrencyChange}
      onExport={onExport}
      onExportCsv={onExportCsv}
      onImport={onImport}
      onLoadDemo={onLoadDemo}
      onReset={onReset}
      onClose={onClose}
      {...overrides}
    />,
  );
  return {
    ...result,
    onCurrencyChange,
    onExport,
    onExportCsv,
    onImport,
    onLoadDemo,
    onReset,
    onClose,
    user: userEvent.setup(),
  };
}

describe('SettingsModal', () => {
  it('cambia la moneda', async () => {
    const { onCurrencyChange, user } = renderSettings();

    await user.selectOptions(screen.getByLabelText('Moneda'), 'EUR');
    expect(onCurrencyChange).toHaveBeenCalledWith('EUR');
  });

  it('ofrece exportar JSON y CSV', async () => {
    const { onExport, onExportCsv, user } = renderSettings();

    await user.click(screen.getByRole('button', { name: 'Exportar JSON' }));
    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }));

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onExportCsv).toHaveBeenCalledTimes(1);
  });

  it('importa un archivo JSON', async () => {
    const { container, onImport, user } = renderSettings();
    const file = new File(['{"version":1}'], 'respaldo.json', { type: 'application/json' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => expect(onImport).toHaveBeenCalledWith(file));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('muestra el error que devuelve la importación', async () => {
    const { container, user } = renderSettings({
      onImport: vi.fn(async (_file: File) => 'El archivo no es un JSON válido.'),
    });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, new File(['{roto'], 'roto.json', { type: 'application/json' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El archivo no es un JSON válido.');
  });

  it('carga los datos de ejemplo', async () => {
    const { onLoadDemo, user } = renderSettings();

    await user.click(screen.getByRole('button', { name: 'Cargar datos de ejemplo' }));
    expect(onLoadDemo).toHaveBeenCalledTimes(1);
  });

  it('pide confirmación antes de borrar todos los datos', async () => {
    const { onReset, onClose, user } = renderSettings();

    await user.click(screen.getByRole('button', { name: 'Borrar todos los datos' }));
    expect(onReset).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Confirmar borrado' }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
