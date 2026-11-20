import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTheme } from './useTheme';

describe('useTheme', () => {
  it('arranca en claro sin preferencia del sistema', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('alterna el tema, lo aplica al documento y lo persiste', () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleTheme());

    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('gestor-gastos:theme')).toBe('dark');

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('light');
    expect(localStorage.getItem('gestor-gastos:theme')).toBe('light');
  });
});
