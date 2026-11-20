const MONTH_KEY_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function todayISO(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function currentMonth(): string {
  return todayISO().slice(0, 7);
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function firstDayOfMonth(month: string): string {
  return `${month}-01`;
}

export function isMonthKey(value: unknown): value is string {
  return typeof value === 'string' && MONTH_KEY_RE.test(value);
}

export function parseMonthKey(month: string): { year: number; monthIndex: number } {
  const [year, monthNumber] = month.split('-').map(Number);
  return { year, monthIndex: monthNumber - 1 };
}

export function shiftMonth(month: string, delta: number): string {
  const { year, monthIndex } = parseMonthKey(month);
  const date = new Date(year, monthIndex + delta, 1);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatMonthLabel(month: string, variant: 'long' | 'short' = 'long'): string {
  const { year, monthIndex } = parseMonthKey(month);
  const name = new Intl.DateTimeFormat('es-AR', { month: variant })
    .format(new Date(year, monthIndex, 1))
    .replace('.', '');
  return variant === 'long' ? `${capitalize(name)} ${year}` : capitalize(name);
}

export function formatDayLabel(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' })
    .format(new Date(year, month - 1, day))
    .replace('.', '')
    .replace('-', ' ');
}

export function isISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
