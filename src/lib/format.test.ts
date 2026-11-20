import { describe, expect, it } from 'vitest';
import { CURRENCIES, CURRENCY_CODES, formatCurrency, formatPercent } from './format';

describe('formatCurrency', () => {
  it('formatea pesos argentinos con separadores locales', () => {
    const result = formatCurrency(1234567.5, 'ARS');
    expect(result).toContain('1.234.567,50');
    expect(result).toContain('$');
  });

  it('omite decimales cuando el monto es entero', () => {
    const result = formatCurrency(1234, 'ARS');
    expect(result).toContain('1.234');
    expect(result).not.toContain(',00');
  });

  it('agrega decimales solo si el monto los tiene', () => {
    expect(formatCurrency(10.25, 'USD')).toContain(',25');
    expect(formatCurrency(10, 'USD')).not.toContain(',00');
  });

  it('formatea montos negativos', () => {
    const result = formatCurrency(-5000, 'ARS');
    expect(result).toContain('5.000');
    expect(result).toContain('-');
  });
});

describe('formatPercent', () => {
  it('convierte fracciones a porcentaje', () => {
    expect(formatPercent(0.256)).toBe('26%');
    expect(formatPercent(0.5)).toBe('50%');
    expect(formatPercent(1.2)).toBe('120%');
    expect(formatPercent(0.1234, 1)).toBe('12.3%');
  });
});

describe('catálogo de monedas', () => {
  it('incluye las seis monedas soportadas', () => {
    expect(CURRENCY_CODES).toEqual(['ARS', 'USD', 'EUR', 'MXN', 'CLP', 'COP']);
    expect(CURRENCIES).toHaveLength(6);
  });
});
