import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { currentMonth, shiftMonth } from '../lib/date';
import { MonthNavigator } from './MonthNavigator';

describe('MonthNavigator', () => {
  it('navega al mes anterior y al siguiente', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<MonthNavigator month="2026-11" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Mes anterior' }));
    expect(onChange).toHaveBeenLastCalledWith('2026-10');

    await user.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    expect(onChange).toHaveBeenLastCalledWith('2026-12');
  });

  it('no muestra "Hoy" cuando ya estás en el mes actual', () => {
    render(<MonthNavigator month={currentMonth()} onChange={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Hoy' })).not.toBeInTheDocument();
  });

  it('vuelve al mes actual desde otro mes', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<MonthNavigator month={shiftMonth(currentMonth(), -2)} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Hoy' }));
    expect(onChange).toHaveBeenCalledWith(currentMonth());
  });
});
