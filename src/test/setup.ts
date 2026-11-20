import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// jsdom no implementa matchMedia ni confirm; los stubs permiten probar tema y borrados.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

Object.defineProperty(window, 'confirm', {
  writable: true,
  value: vi.fn(() => true),
});

beforeEach(() => {
  vi.mocked(window.confirm).mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
