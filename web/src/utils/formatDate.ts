/**
 * Utilitários de manipulação e formatação de datas e fusos horários
 */

export const SAO_PAULO_TIMEZONE = 'America/Sao_Paulo';

const PT_BR_MONTHS_SHORT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

type SerializedTimestamp = {
  seconds?: number | string;
  nanoseconds?: number | string;
  _seconds?: number | string;
  _nanoseconds?: number | string;
};

type DateInput = Date | { toDate: () => Date } | SerializedTimestamp | number | string | null | undefined;

/**
 * Converte entradas flexíveis para instância de Date
 */
function toJsDate(value: DateInput): Date {
  if (value instanceof Date) {
    return value;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'object' && value !== null) {
    const timestamp = value as SerializedTimestamp;
    const seconds = Number(timestamp.seconds ?? timestamp._seconds);
    const nanoseconds = Number(timestamp.nanoseconds ?? timestamp._nanoseconds ?? 0);
    if (Number.isFinite(seconds) && Number.isFinite(nanoseconds)) {
      return new Date(seconds * 1000 + nanoseconds / 1_000_000);
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  return new Date(Number.NaN);
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD considerando o fuso horário America/Sao_Paulo
 */
export function getTodayDateString(referenceDate: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(referenceDate);
}

/**
 * Retorna a data de ontem no formato YYYY-MM-DD considerando o fuso horário America/Sao_Paulo
 */
export function getYesterdayDateString(referenceDate: Date = new Date()): string {
  const todayStr = getTodayDateString(referenceDate);
  const [y, m, d] = todayStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d));
  utcDate.setUTCDate(utcDate.getUTCDate() - 1);
  const yStr = utcDate.getUTCFullYear();
  const mStr = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const dStr = String(utcDate.getUTCDate()).padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
}

/**
 * Verifica se a data informada (YYYY-MM-DD) corresponde ao dia de hoje em America/Sao_Paulo
 */
export function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const cleanStr = dateStr.split('T')[0];
  return cleanStr === getTodayDateString();
}

/**
 * Verifica se a data informada (YYYY-MM-DD) corresponde ao dia de ontem em America/Sao_Paulo
 */
export function isYesterday(dateStr: string): boolean {
  if (!dateStr) return false;
  const cleanStr = dateStr.split('T')[0];
  return cleanStr === getYesterdayDateString();
}

/**
 * Formata data no formato curto 'DD/MM'
 * Exemplo: "2026-09-08" -> "08/09"
 */
export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const cleanStr = dateStr.split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length < 3) return dateStr;
  const [, month, day] = parts;
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}`;
}

/**
 * Formata data no formato completo 'DD de MMM de YYYY'
 * Exemplo: "2026-09-08" -> "08 de set de 2026"
 */
export function formatDateFull(dateStr: string): string {
  if (!dateStr) return '';
  const cleanStr = dateStr.split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length < 3) return dateStr;
  const [year, month, day] = parts;
  const monthIdx = parseInt(month, 10) - 1;
  const monthName = PT_BR_MONTHS_SHORT[monthIdx] || month;
  return `${day.padStart(2, '0')} de ${monthName} de ${year}`;
}

export const formatDate = formatDateFull;

/**
 * Retorna o tempo relativo amigável em português
 * Exemplos de retorno: 'agora', 'há 5min', 'há 2h', 'ontem', '3 set'
 */
export function formatRelativeTime(date: DateInput): string {
  const jsDate = toJsDate(date);
  if (isNaN(jsDate.getTime())) {
    return '';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - jsDate.getTime()) / 1000);

  // Menos de 1 minuto ou datas ligeiramente no futuro devido a assincronia
  if (diffInSeconds < 60) {
    return 'agora';
  }

  // Menos de 1 hora
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `há ${minutes}min`;
  }

  const dateStr = getTodayDateString(jsDate);
  const todayStr = getTodayDateString(now);

  // Ocorreu hoje
  if (dateStr === todayStr) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `há ${hours}h`;
  }

  // Ocorreu ontem
  const yesterdayStr = getYesterdayDateString(now);
  if (dateStr === yesterdayStr) {
    return 'ontem';
  }

  // Dias anteriores: formato "D mmm" (ex: "3 set")
  const day = jsDate.toLocaleDateString('pt-BR', {
    timeZone: SAO_PAULO_TIMEZONE,
    day: 'numeric',
  });
  const monthIdx =
    parseInt(
      jsDate.toLocaleDateString('en-CA', {
        timeZone: SAO_PAULO_TIMEZONE,
        month: '2-digit',
      }),
      10
    ) - 1;
  const monthName = PT_BR_MONTHS_SHORT[monthIdx] || '';

  const currentYear = now.toLocaleDateString('en-CA', {
    timeZone: SAO_PAULO_TIMEZONE,
    year: 'numeric',
  });
  const dateYear = jsDate.toLocaleDateString('en-CA', {
    timeZone: SAO_PAULO_TIMEZONE,
    year: 'numeric',
  });

  if (currentYear !== dateYear) {
    return `${day} ${monthName} ${dateYear}`;
  }

  return `${day} ${monthName}`;
}
