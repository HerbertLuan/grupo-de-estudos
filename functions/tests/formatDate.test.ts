import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatRelativeTime } from '../../web/src/utils/formatDate';

describe('Formatação relativa de timestamps do Feed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-14T15:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('interpreta o formato serializado seconds/nanoseconds das Callable Functions', () => {
    expect(formatRelativeTime({
      seconds: Date.parse('2026-09-14T14:55:00.000Z') / 1000,
      nanoseconds: 0,
    })).toBe('há 5min');
  });

  it('interpreta o formato legado _seconds/_nanoseconds', () => {
    expect(formatRelativeTime({
      _seconds: Date.parse('2026-09-14T13:00:00.000Z') / 1000,
      _nanoseconds: 0,
    })).toBe('há 2h');
  });

  it('não transforma uma data ausente no horário atual', () => {
    expect(formatRelativeTime(undefined)).toBe('');
  });
});
