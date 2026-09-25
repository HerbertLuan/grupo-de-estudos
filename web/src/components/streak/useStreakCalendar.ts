import { useCallback, useEffect, useState } from 'react';
import { getUserHistory, getUserStats } from '../../services/statsService';
import type { DailyStudy, UserStatsResponse } from '../../types';

type CalendarData = { history: DailyStudy[]; stats: UserStatsResponse };
const cache = new Map<string, CalendarData>();
const inflight = new Map<string, Promise<CalendarData>>();

export function invalidateStreakCalendar(uid: string): void {
  cache.delete(uid);
  inflight.delete(uid);
  window.dispatchEvent(new CustomEvent('streak-calendar:invalidated', { detail: uid }));
}

function load(uid: string): Promise<CalendarData> {
  const saved = cache.get(uid);
  if (saved) return Promise.resolve(saved);
  const pending = inflight.get(uid);
  if (pending) return pending;
  const request = Promise.all([getUserHistory(uid, undefined, true), getUserStats(uid)])
    .then(([history, stats]) => {
      const result = { history, stats };
      if (inflight.get(uid) === request) cache.set(uid, result);
      return result;
    }).finally(() => { if (inflight.get(uid) === request) inflight.delete(uid); });
  inflight.set(uid, request);
  return request;
}

export function useStreakCalendar(uid: string, open: boolean) {
  const [result, setResult] = useState<{ key: string; data?: CalendarData; error?: string } | null>(null);
  const [revision, setRevision] = useState(0);
  const resultKey = `${uid}:${revision}`;
  const retry = useCallback(() => { cache.delete(uid); inflight.delete(uid); setRevision(value => value + 1); }, [uid]);

  useEffect(() => {
    const onInvalidated = (event: Event) => {
      if ((event as CustomEvent<string>).detail === uid) setRevision(value => value + 1);
    };
    window.addEventListener('streak-calendar:invalidated', onInvalidated);
    return () => window.removeEventListener('streak-calendar:invalidated', onInvalidated);
  }, [uid]);

  useEffect(() => {
    if (!open || !uid) return;
    let active = true;
    void load(uid).then(data => { if (active) setResult({ key: resultKey, data }); })
      .catch(cause => { if (active) setResult({ key: resultKey, error: cause instanceof Error ? cause.message : 'Não foi possível carregar o calendário.' }); });
    return () => { active = false; };
  }, [uid, open, revision, resultKey]);

  const current = result?.key === resultKey ? result : null;
  const data = open ? cache.get(uid) ?? current?.data ?? null : null;
  const error = current?.error ?? '';
  return { data, loading: open && !data && !error, error, retry };
}
