import { useState, useEffect, useCallback, useRef } from 'react';
import * as studyService from '../services/studyService';
import type {
  ActiveSessionState,
  FinishSessionResult,
  TimerMode,
  TimerPhase,
  TimerSettings,
} from '../types';

// ── Tipos de status do timer ─────────────────────────────────────────────────

/**
 * Status completo do timer:
 * - 'idle'           → pronto para iniciar
 * - 'loading'        → carregando sessão existente do servidor
 * - 'active'         → sessão de foco ativa (backend aware)
 * - 'paused'         → sessão de foco pausada
 * - 'active_break'   → intervalo ativo (apenas frontend, sem sessão backend)
 * - 'phase_end_focus'  → fase de foco terminou e sessão backend já foi finalizada
 * - 'phase_end_break'  → intervalo terminou, aguarda decisão do usuário
 */
export type TimerStatus =
  | 'idle'
  | 'loading'
  | 'active'
  | 'paused'
  | 'active_break'
  | 'phase_end_focus'
  | 'phase_end_break';

export interface UseStudyTimerReturn {
  // Estado
  status: TimerStatus;
  elapsedSeconds: number;         // tempo decorrido (stopwatch ou foco acumulado)
  remainingSeconds: number;       // tempo restante (modo timer)
  timerPhase: TimerPhase;
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  /**
   * Resultado da última finalização automática (ao fim de um ciclo de foco no
   * modo Temporizador). Limpo ao iniciar um novo foco.
   */
  lastAutoFinishResult: FinishSessionResult | null;

  // Ações — sessão de foco (com backend)
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  finish: () => Promise<FinishSessionResult | null>;
  discard: () => Promise<void>;
  refresh: () => Promise<void>;

  // Ações — intervalo (apenas frontend)
  startBreak: () => void;
  skipBreak: () => void;
}

export function useStudyTimer(settings: TimerSettings): UseStudyTimerReturn {
  const { mode, focusDurationSeconds, breakDurationSeconds } = settings;

  const [status, setStatus] = useState<TimerStatus>('loading');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(focusDurationSeconds);
  const [timerPhase, setTimerPhase] = useState<TimerPhase>('focus');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Resultado da última finalização automática (modo temporizador)
  const [lastAutoFinishResult, setLastAutoFinishResult] = useState<FinishSessionResult | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const finishPromiseRef = useRef<Promise<FinishSessionResult> | null>(null);
  const manualFinishRequestedRef = useRef(false);

  // Refs para o intervalo
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baseElapsedRef = useRef(0);
  const resumedAtRef = useRef<number | null>(null);
  // Para o modo timer: timestamp alvo do fim da fase
  const targetEndTimeRef = useRef<number | null>(null);
  // Fase para uso dentro do interval callback sem stale closure
  const phaseRef = useRef<TimerPhase>('focus');
  const modeRef = useRef<TimerMode>(mode);
  const focusDurRef = useRef(focusDurationSeconds);
  const breakDurRef = useRef(breakDurationSeconds);

  // Sincronizar refs com props
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { focusDurRef.current = focusDurationSeconds; }, [focusDurationSeconds]);
  useEffect(() => { breakDurRef.current = breakDurationSeconds; }, [breakDurationSeconds]);

  // ── Interval helpers ───────────────────────────────────────────────────────

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const requestFinish = useCallback((): Promise<FinishSessionResult> => {
    if (finishPromiseRef.current) return finishPromiseRef.current;
    const id = sessionIdRef.current;
    if (!id) return Promise.reject(new Error('Nenhuma sessão em andamento para finalizar.'));
    const promise = studyService.finishSession(id);
    finishPromiseRef.current = promise;
    void promise.finally(() => {
      if (finishPromiseRef.current === promise) finishPromiseRef.current = null;
    }).catch(() => { /* O chamador apresenta o erro. */ });
    return promise;
  }, []);

  /**
   * Inicia o intervalo de tick.
   * - mode 'stopwatch' → conta para cima usando baseElapsedRef + delta desde resumedAt
   * - mode 'timer'     → conta para baixo usando targetEndTime
   * @param onPhaseEnd  callback chamado quando o countdown chegar a zero (modo timer)
   */
  const startInterval = useCallback(
    (onPhaseEnd?: () => void) => {
      stopInterval();
      resumedAtRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        const now = Date.now();

        if (modeRef.current === 'stopwatch') {
          const delta = Math.floor((now - (resumedAtRef.current ?? now)) / 1000);
          setElapsedSeconds(baseElapsedRef.current + delta);
        } else {
          // Modo timer — calcular restante com base no targetEndTime
          const target = targetEndTimeRef.current;
          if (target === null) return;
          const remaining = Math.max(0, Math.ceil((target - now) / 1000));
          setRemainingSeconds(remaining);

          // Também acumula elapsed para foco (para fins de contabilização)
          if (phaseRef.current === 'focus') {
            const delta = Math.floor((now - (resumedAtRef.current ?? now)) / 1000);
            setElapsedSeconds(baseElapsedRef.current + delta);
          }

          if (remaining <= 0) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            onPhaseEnd?.();
          }
        }
      }, 1000);
    },
    [stopInterval]
  );

  // ── Fase de Foco encerrou — finaliza automaticamente a sessão no backend ────

  const handleFocusPhaseEnd = useCallback(async () => {
    // Para o intervalo local antes de qualquer await
    stopInterval();
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestFinish();
      if (manualFinishRequestedRef.current) return;
      setLastAutoFinishResult(result);
      setSessionId(null);
      sessionIdRef.current = null;
      baseElapsedRef.current = 0;
      setElapsedSeconds(0);
      setTimerPhase('focus');
      phaseRef.current = 'focus';
      targetEndTimeRef.current = null;
    } catch (err: any) {
      if (manualFinishRequestedRef.current) return;
      setError(err?.message || 'Erro ao finalizar sessão');
    } finally {
      setIsLoading(false);
    }
    setStatus('phase_end_focus');
  }, [stopInterval, requestFinish]);

  // ── Fase de Intervalo encerrou ─────────────────────────────────────────────

  const handleBreakPhaseEnd = useCallback(() => {
    setStatus('phase_end_break');
  }, []);

  // ── Refresh: carregar sessão existente do servidor ─────────────────────────

  const refresh = useCallback(async () => {
    try {
      const state: ActiveSessionState = await studyService.getCurrentSession();
      if (state.hasActiveSession && state.session) {
        setSessionId(state.session.id);
        sessionIdRef.current = state.session.id;
        baseElapsedRef.current = state.currentElapsedSeconds;
        setElapsedSeconds(state.currentElapsedSeconds);

        if (state.session.status === 'active') {
          setStatus('active');
          setTimerPhase('focus');
          phaseRef.current = 'focus';

          if (modeRef.current === 'timer') {
            const already = state.currentElapsedSeconds;
            const remaining = Math.max(0, focusDurRef.current - already);
            setRemainingSeconds(remaining);
            targetEndTimeRef.current = Date.now() + remaining * 1000;
          }

          startInterval(modeRef.current === 'timer' ? handleFocusPhaseEnd : undefined);
        } else if (state.session.status === 'paused') {
          setStatus('paused');
          stopInterval();

          if (modeRef.current === 'timer') {
            const already = state.currentElapsedSeconds;
            const remaining = Math.max(0, focusDurRef.current - already);
            setRemainingSeconds(remaining);
          }
        }
      } else {
        setStatus('idle');
        setSessionId(null);
        sessionIdRef.current = null;
        setElapsedSeconds(0);
        baseElapsedRef.current = 0;
        setRemainingSeconds(modeRef.current === 'timer' ? focusDurRef.current : 0);
        stopInterval();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao buscar sessão atual');
      setStatus('idle');
    }
  }, [startInterval, stopInterval, handleFocusPhaseEnd]);

  useEffect(() => {
    refresh();
    return () => stopInterval();
  }, [refresh, stopInterval]);

  // Resetar remaining quando settings mudam e timer está idle
  useEffect(() => {
    if (status === 'idle' || status === 'loading') {
      setRemainingSeconds(focusDurationSeconds);
    }
  }, [focusDurationSeconds, mode, status]);

  // ── Ações de sessão de Foco (com backend) ─────────────────────────────────

  const start = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setLastAutoFinishResult(null); // limpa resultado de ciclo anterior
    try {
      const session = await studyService.startSession();
      setSessionId(session.id);
      sessionIdRef.current = session.id;
      setStatus('active');
      setTimerPhase('focus');
      phaseRef.current = 'focus';
      baseElapsedRef.current = 0;
      setElapsedSeconds(0);

      if (modeRef.current === 'timer') {
        setRemainingSeconds(focusDurRef.current);
        targetEndTimeRef.current = Date.now() + focusDurRef.current * 1000;
        startInterval(handleFocusPhaseEnd);
      } else {
        startInterval();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao iniciar sessão');
    } finally {
      setIsLoading(false);
    }
  }, [startInterval, handleFocusPhaseEnd]);

  const pause = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const session = await studyService.pauseSession();
      stopInterval();
      baseElapsedRef.current = session.accumulatedSeconds;
      setElapsedSeconds(session.accumulatedSeconds);

      if (modeRef.current === 'timer') {
        const remaining = Math.max(0, focusDurRef.current - session.accumulatedSeconds);
        setRemainingSeconds(remaining);
        targetEndTimeRef.current = null;
      }

      setStatus('paused');
    } catch (err: any) {
      setError(err?.message || 'Erro ao pausar sessão');
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

      if (modeRef.current === 'timer') {
        targetEndTimeRef.current = Date.now() + remainingSeconds * 1000;
        startInterval(handleFocusPhaseEnd);
      } else {
        startInterval();
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao retomar sessão');
    } finally {
      setIsLoading(false);
    }
  }, [startInterval, handleFocusPhaseEnd, remainingSeconds]);

  const finish = useCallback(async (): Promise<FinishSessionResult | null> => {
    manualFinishRequestedRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const result = await requestFinish();
      setStatus('idle');
      setSessionId(null);
      sessionIdRef.current = null;
      setElapsedSeconds(0);
      baseElapsedRef.current = 0;
      setTimerPhase('focus');
      phaseRef.current = 'focus';
      setRemainingSeconds(focusDurRef.current);
      targetEndTimeRef.current = null;
      return result;
    } catch (err: any) {
      setError(err?.message || 'Erro ao finalizar sessão');
      if (modeRef.current === 'timer' && targetEndTimeRef.current !== null && targetEndTimeRef.current <= Date.now()) {
        setStatus('phase_end_focus');
      }
      return null;
    } finally {
      manualFinishRequestedRef.current = false;
      setIsLoading(false);
    }
  }, [stopInterval, requestFinish]);

  const discard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await studyService.discardSession();
      stopInterval();
      setStatus('idle');
      setSessionId(null);
      sessionIdRef.current = null;
      setElapsedSeconds(0);
      baseElapsedRef.current = 0;
      setTimerPhase('focus');
      phaseRef.current = 'focus';
      setRemainingSeconds(focusDurRef.current);
      targetEndTimeRef.current = null;
    } catch (err: any) {
      setError(err?.message || 'Erro ao descartar sessão');
    } finally {
      setIsLoading(false);
    }
  }, [stopInterval]);

  // ── Ações de Intervalo (puramente frontend — sessão já fechada no backend) ──

  const startBreak = useCallback(() => {
    // A sessão de foco já foi finalizada automaticamente em handleFocusPhaseEnd.
    // O intervalo é apenas um timer visual sem envolver o backend.
    stopInterval();
    setStatus('active_break');
    setTimerPhase('break');
    phaseRef.current = 'break';
    setRemainingSeconds(breakDurRef.current);
    targetEndTimeRef.current = Date.now() + breakDurRef.current * 1000;
    startInterval(handleBreakPhaseEnd);
  }, [stopInterval, startInterval, handleBreakPhaseEnd]);

  const skipBreak = useCallback(() => {
    stopInterval();
    setStatus('idle');
    setTimerPhase('focus');
    phaseRef.current = 'focus';
    setElapsedSeconds(0);
    baseElapsedRef.current = 0;
    setSessionId(null);
    sessionIdRef.current = null;
    setRemainingSeconds(focusDurRef.current);
    targetEndTimeRef.current = null;
  }, [stopInterval]);

  return {
    status,
    elapsedSeconds,
    remainingSeconds,
    timerPhase,
    sessionId,
    isLoading,
    error,
    lastAutoFinishResult,
    start,
    pause,
    resume,
    finish,
    discard,
    refresh,
    startBreak,
    skipBreak,
  };
}
