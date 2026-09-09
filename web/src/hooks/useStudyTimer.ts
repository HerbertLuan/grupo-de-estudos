import { useState, useEffect, useCallback, useRef } from 'react';
import * as studyService from '../services/studyService';
import type { ActiveSessionState, FinishSessionResult } from '../types';

export interface UseStudyTimerReturn {
  // State
  status: 'idle' | 'active' | 'paused' | 'loading';
  elapsedSeconds: number;
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  finish: () => Promise<FinishSessionResult | null>;
  discard: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useStudyTimer(): UseStudyTimerReturn {
  const [status, setStatus] = useState<'idle' | 'active' | 'paused' | 'loading'>('loading');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baseElapsedRef = useRef(0);
  const resumedAtRef = useRef<number | null>(null);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    stopInterval();
    resumedAtRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (resumedAtRef.current || Date.now())) / 1000);
      setElapsedSeconds(baseElapsedRef.current + elapsed);
    }, 1000);
  }, [stopInterval]);

  const refresh = useCallback(async () => {
    try {
      const state: ActiveSessionState = await studyService.getCurrentSession();
      if (state.hasActiveSession && state.session) {
        setSessionId(state.session.id);
        baseElapsedRef.current = state.currentElapsedSeconds;
        setElapsedSeconds(state.currentElapsedSeconds);
        if (state.session.status === 'active') {
          setStatus('active');
          startInterval();
        } else if (state.session.status === 'paused') {
          setStatus('paused');
          stopInterval();
        }
      } else {
        setStatus('idle');
        setSessionId(null);
        setElapsedSeconds(0);
        baseElapsedRef.current = 0;
        stopInterval();
      }
    } catch (err: any) {
      setError(err?.message || 'Error fetching current session');
      setStatus('idle');
    }
  }, [startInterval, stopInterval]);

  useEffect(() => {
    refresh();
    return () => stopInterval();
  }, [refresh, stopInterval]);

  const start = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await studyService.startSession();
      setSessionId(session.id);
      setStatus('active');
      baseElapsedRef.current = 0;
      setElapsedSeconds(0);
      startInterval();
    } catch (err: any) {
      setError(err?.message || 'Error starting session');
    } finally {
      setIsLoading(false);
    }
  }, [startInterval]);

  const pause = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await studyService.pauseSession();
      stopInterval();
      baseElapsedRef.current = session.accumulatedSeconds;
      setElapsedSeconds(session.accumulatedSeconds);
      setStatus('paused');
    } catch (err: any) {
      setError(err?.message || 'Error pausing session');
    } finally {
      setIsLoading(false);
    }
  }, [stopInterval]);

  const resume = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await studyService.resumeSession();
      setStatus('active');
      startInterval();
    } catch (err: any) {
      setError(err?.message || 'Error resuming session');
    } finally {
      setIsLoading(false);
    }
  }, [startInterval]);

  const finish = useCallback(async (): Promise<FinishSessionResult | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await studyService.finishSession();
      stopInterval();
      setStatus('idle');
      setSessionId(null);
      setElapsedSeconds(0);
      baseElapsedRef.current = 0;
      return result;
    } catch (err: any) {
      setError(err?.message || 'Error finishing session');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [stopInterval]);

  const discard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await studyService.discardSession();
      stopInterval();
      setStatus('idle');
      setSessionId(null);
      setElapsedSeconds(0);
      baseElapsedRef.current = 0;
    } catch (err: any) {
      setError(err?.message || 'Error discarding session');
    } finally {
      setIsLoading(false);
    }
  }, [stopInterval]);

  return { status, elapsedSeconds, sessionId, isLoading, error, start, pause, resume, finish, discard, refresh };
}
