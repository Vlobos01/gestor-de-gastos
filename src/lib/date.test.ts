import { describe, expect, it } from 'vitest';
import {
  firstDayOfMonth,
  formatDayLabel,
  formatMonthLabel,
  isISODate,
  isMonthKey,
  monthOf,
  pad2,
  parseMonthKey,
  shiftMonth,
  todayISO,
} from './date';

describe('pad2', () => {
  it('rellena con cero a la izquierda', () => {
    expect(pad2(1)).toBe('01');
    expect(pad2(12)).toBe('12');
  });
});

describe('todayISO', () => {
  it('usa la fecha local en formato YYYY-MM-DD', () => {
    expect(todayISO(new Date(2026, 10, 9))).toBe('2026-11-09');
    expect(todayISO(new Date(2026, 0, 31))).toBe('2026-01-31');
  });
});

describe('shiftMonth', () => {
  it('cruza el año hacia atrás y adelante', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-11', 0)).toBe('2026-11');
    expect(shiftMonth('2026-11', -12)).toBe('2025-11');
    expect(shiftMonth('2026-11', 14)).toBe('2028-01');
  });
});

describe('monthOf y firstDayOfMonth', () => {
  it('extrae el mes y arma el primer día', () => {
    expect(monthOf('2026-11-19')).toBe('2026-11');
    expect(firstDayOfMonth('2026-11')).toBe('2026-11-01');
  });
});

describe('isMonthKey', () => {
  it('acepta solo claves YYYY-MM válidas', () => {
    expect(isMonthKey('2026-01')).toBe(true);
    expect(isMonthKey('2026-12')).toBe(true);
    expect(isMonthKey('2026-13')).toBe(false);
    expect(isMonthKey('2026-00')).toBe(false);
    expect(isMonthKey('2026-1')).toBe(false);
    expect(isMonthKey(202611)).toBe(false);
  });
});

describe('parseMonthKey', () => {
  it('separa año e índice de mes', () => {
    expect(parseMonthKey('2026-11')).toEqual({ year: 2026, monthIndex: 10 });
  });
});

describe('formatMonthLabel', () => {
  it('arma la etiqueta larga en español', () => {
    expect(formatMonthLabel('2026-11')).toBe('Noviembre 2026');
    expect(formatMonthLabel('2026-01')).toBe('Enero 2026');
  });

  it('la variante corta no incluye el año', () => {
    expect(formatMonthLabel('2026-11', 'short')).toBe('Nov');
  });
});

describe('formatDayLabel', () => {
  it('formatea el día con mes corto', () => {
    expect(formatDayLabel('2026-11-05')).toBe('05 nov');
  });
});

describe('isISODate', () => {
  it('acepta fechas ISO reales', () => {
    expect(isISODate('2026-11-19')).toBe(true);
    expect(isISODate('2024-02-29')).toBe(true);
  });

  it('rechaza formatos y fechas inexistentes', () => {
    expect(isISODate('2026-11-31')).toBe(false);
    expect(isISODate('2026-02-30')).toBe(false);
    expect(isISODate('2025-02-29')).toBe(false);
    expect(isISODate('19-11-2026')).toBe(false);
    expect(isISODate('2026-1-5')).toBe(false);
    expect(isISODate(20261119)).toBe(false);
  });
});
