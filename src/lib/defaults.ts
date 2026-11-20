import type { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Comida', type: 'expense', color: '#f97316', emoji: '🍔' },
  { id: 'cat-transport', name: 'Transporte', type: 'expense', color: '#0ea5e9', emoji: '🚌' },
  { id: 'cat-home', name: 'Vivienda', type: 'expense', color: '#8b5cf6', emoji: '🏠' },
  { id: 'cat-utilities', name: 'Servicios', type: 'expense', color: '#eab308', emoji: '💡' },
  { id: 'cat-leisure', name: 'Ocio', type: 'expense', color: '#ec4899', emoji: '🎬' },
  { id: 'cat-health', name: 'Salud', type: 'expense', color: '#10b981', emoji: '💊' },
  { id: 'cat-education', name: 'Educación', type: 'expense', color: '#6366f1', emoji: '📚' },
  { id: 'cat-other', name: 'Otros', type: 'expense', color: '#94a3b8', emoji: '🧾' },
  { id: 'cat-salary', name: 'Sueldo', type: 'income', color: '#22c55e', emoji: '💼' },
  { id: 'cat-freelance', name: 'Freelance', type: 'income', color: '#14b8a6', emoji: '💻' },
  { id: 'cat-investments', name: 'Inversiones', type: 'income', color: '#3b82f6', emoji: '📈' },
  { id: 'cat-gift', name: 'Otros ingresos', type: 'income', color: '#a855f7', emoji: '🎁' },
];
