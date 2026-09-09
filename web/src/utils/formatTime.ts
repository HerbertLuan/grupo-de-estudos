/**
 * Utilitários de formatação de tempo para a aplicação
 */

/**
 * Formata um total de segundos no formato digital padrão "HH:MM:SS"
 * Exemplo: 3661 -> "01:01:01", 65 -> "00:01:05", 0 -> "00:00:00"
 */
export function formatSeconds(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00:00';
  }
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

/**
 * Formata segundos no formato "Xh Ymin"
 * Exemplo: 5400 -> "1h 30min", 3600 -> "1h 0min", 1500 -> "0h 25min"
 */
export function formatMinutes(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '0h 0min';
  }
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);

  return `${hours}h ${minutes}min`;
}

/**
 * Formata segundos em horas com representação decimal "X.Xh"
 * Exemplo: 5400 -> "1.5h", 3600 -> "1.0h", 0 -> "0.0h"
 */
export function formatHoursDecimal(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '0.0h';
  }
  const hours = seconds / 3600;
  return `${hours.toFixed(1)}h`;
}

/**
 * Formata segundos em texto legível para humanos
 * Exemplo: 5400 -> "1h 30min", 3600 -> "1h", 1800 -> "30min", 45 -> "45s", 0 -> "0min"
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) {
    return '0min';
  }
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}min`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}min`;
  }
  if (secs > 0) {
    return `${secs}s`;
  }
  return '0min';
}

export { formatRelativeTime } from './formatDate';
