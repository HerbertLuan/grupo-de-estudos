import { format, subDays, parseISO, differenceInCalendarDays, eachDayOfInterval } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { DEFAULT_TIMEZONE } from '../config/constants';

/**
 * Retorna a data no formato YYYY-MM-DD de acordo com o fuso horário configurado
 */
export function getZonedDateString(date: Date = new Date(), timezone: string = DEFAULT_TIMEZONE): string {
  const zonedDate = toZonedTime(date, timezone);
  return format(zonedDate, 'yyyy-MM-dd');
}

/**
 * Retorna a data de ontem no formato YYYY-MM-DD
 */
export function getYesterdayDateString(referenceDate: Date = new Date(), timezone: string = DEFAULT_TIMEZONE): string {
  const zonedDate = toZonedTime(referenceDate, timezone);
  const yesterday = subDays(zonedDate, 1);
  return format(yesterday, 'yyyy-MM-dd');
}

/**
 * Retorna o identificador da semana ISO atual no formato YYYY-Www (ex: 2026-W37)
 */
export function getCurrentWeekId(date: Date = new Date(), timezone: string = DEFAULT_TIMEZONE): string {
  const zonedDate = toZonedTime(date, timezone);
  return format(zonedDate, "yyyy-'W'II");
}

/**
 * Retorna o identificador do mês atual no formato YYYY-MM
 */
export function getCurrentMonthId(date: Date = new Date(), timezone: string = DEFAULT_TIMEZONE): string {
  const zonedDate = toZonedTime(date, timezone);
  return format(zonedDate, 'yyyy-MM');
}

/**
 * Calcula a diferença em dias corridos entre duas datas no formato YYYY-MM-DD (d2 - d1)
 */
export function diffCalendarDays(dateStr1: string, dateStr2: string): number {
  const d1 = parseISO(dateStr1);
  const d2 = parseISO(dateStr2);
  return differenceInCalendarDays(d2, d1);
}

/**
 * Verifica se dateStrB é exatamente o dia seguinte a dateStrA (dateStrB - dateStrA == 1)
 */
export function isConsecutiveDay(dateStrA: string, dateStrB: string): boolean {
  return diffCalendarDays(dateStrA, dateStrB) === 1;
}

/**
 * Gera um array de strings YYYY-MM-DD entre duas datas (inclusive)
 */
export function getDateRange(startDateStr: string, endDateStr: string): string[] {
  const start = parseISO(startDateStr);
  const end = parseISO(endDateStr);
  if (start > end) return [];
  const interval = eachDayOfInterval({ start, end });
  return interval.map((d) => format(d, 'yyyy-MM-dd'));
}
