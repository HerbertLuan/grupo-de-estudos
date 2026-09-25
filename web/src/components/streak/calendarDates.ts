import type { DailyStudy } from '../../types';

export type DayState = 'completed' | 'partial' | 'empty' | 'future';

export function monthKey(date: string): string { return date.slice(0, 7); }

export function shiftMonth(month: string, offset: number): string {
  const [year, number] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, number - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function monthDays(month: string): (string | null)[] {
  const [year, number] = month.split('-').map(Number);
  const firstWeekday = new Date(Date.UTC(year, number - 1, 1)).getUTCDay();
  const length = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const cells: (string | null)[] = Array(firstWeekday).fill(null);
  for (let day = 1; day <= length; day++) cells.push(`${month}-${String(day).padStart(2, '0')}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

export function dayState(date: string, today: string, record?: DailyStudy): DayState {
  if (date > today) return 'future';
  if (record?.pointEarned) return 'completed';
  if (record && record.totalSeconds > 0) return 'partial';
  return 'empty';
}

export function fullDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, day)));
}

export function monthTitle(month: string): string {
  return fullDate(`${month}-01`).replace(/^1 de /, '').replace(' de ', ' ');
}

export function countCompleted(month: string, records: DailyStudy[]): number {
  return records.filter(record => record.date.startsWith(`${month}-`) && record.pointEarned).length;
}
