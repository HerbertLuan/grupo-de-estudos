import React, { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useStudyTimer } from '../hooks/useStudyTimer';
import { useTimerSettings } from '../hooks/useTimerSettings';
import { useTimerNotification } from '../hooks/useTimerNotification';
import { useTodayStudy } from '../hooks/useTodayStudy';
import { StudyTimer } from '../components/study/StudyTimer';
import { TimerControls } from '../components/study/TimerControls';
import { TimerModeSelector } from '../components/study/TimerModeSelector';
import { DailyProgress } from '../components/study/DailyProgress';
import { PointCelebration } from '../components/study/PointCelebration';
import { MidnightModal } from '../components/study/MidnightModal';
import { PhaseTransitionModal } from '../components/study/PhaseTransitionModal';
import { StreakBadge } from '../components/ui/StreakBadge';
import { useToast } from '../components/ui/Toast';
import { mapFirebaseError } from '../utils/errors';
import { getTodayDateString } from '../utils/formatDate';
import type { FinishSessionResult } from '../types';

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Bom dia, ${name}! 🌅`;
  if (hour < 18) return `Boa tarde, ${name}! ☀️`;
  return `Boa noite, ${name}! 🌙`;
}

export const StudyPage: React.FC = () => {
  const { profile } = useAuthContext();
  const { showToast } = useToast();

  // ── Configurações do timer ────────────────────────────────────────────────
  const { settings, updateSettings } = useTimerSettings();
  const { notifyFocusEnd, notifyBreakEnd, requestPermission } = useTimerNotification();

  // ── Hook do timer ─────────────────────────────────────────────────────────
  const timer = useStudyTimer(settings);

  const { totalSecondsToday, pointEarnedToday } = useTodayStudy();

  const [celebrationData, setCelebrationData] = useState<FinishSessionResult | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showMidnight, setShowMidnight] = useState(false);
  const [currentDate, setCurrentDate] = useState(getTodayDateString());

  // ── Solicitar permissão de notificação na primeira interação ──────────────
  useEffect(() => {
    const handleFirstInteraction = () => {
      requestPermission();
      window.removeEventListener('pointerdown', handleFirstInteraction);
    };
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    return () => window.removeEventListener('pointerdown', handleFirstInteraction);
  }, [requestPermission]);

  // ── Detectar mudança de fase e emitir notificações ────────────────────────
  useEffect(() => {
    if (timer.status === 'phase_end_focus') {
      notifyFocusEnd();
    } else if (timer.status === 'phase_end_break') {
      notifyBreakEnd();
    }
  }, [timer.status, notifyFocusEnd, notifyBreakEnd]);

  // ── Detectar virada de meia-noite ─────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const today = getTodayDateString();
      if (today !== currentDate && (timer.status === 'active' || timer.status === 'paused')) {
        setCurrentDate(today);
        setShowMidnight(true);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentDate, timer.status]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStart = useCallback(async () => {
    try {
      await timer.start();
    } catch {
      showToast(timer.error || 'Erro ao iniciar sessão', 'error');
    }
  }, [timer, showToast]);

  const handlePause = useCallback(async () => {
    try {
      await timer.pause();
    } catch {
      showToast(timer.error || 'Erro ao pausar', 'error');
    }
  }, [timer, showToast]);

  const handleResume = useCallback(async () => {
    try {
      await timer.resume();
    } catch {
      showToast(timer.error || 'Erro ao retomar', 'error');
    }
  }, [timer, showToast]);

  const handleFinish = useCallback(async () => {
    const result = await timer.finish();
    if (result) {
      if (result.pointEarnedNow) {
        setCelebrationData(result);
        setShowCelebration(true);
      } else {
        const minutes = Math.floor(result.sessionSeconds / 60);
        showToast(`Sessão finalizada! ${minutes}min estudados.`, 'success');
      }
    } else if (timer.error) {
      showToast(mapFirebaseError(timer.error), 'error');
    }
  }, [timer, showToast]);

  const handleDiscard = useCallback(async () => {
    try {
      await timer.discard();
      showToast('Sessão descartada.', 'info');
    } catch {
      showToast(timer.error || 'Erro ao descartar', 'error');
    }
  }, [timer, showToast]);

  const handleMidnightFinish = useCallback(async () => {
    setShowMidnight(false);
    await handleFinish();
  }, [handleFinish]);

  // Quando usuário clica "Iniciar Novo Foco" após intervalo
  const handleStartFocusAfterBreak = useCallback(async () => {
    await handleStart();
  }, [handleStart]);

  // ── Sessão está em modo foco ou pausada (conta para DailyProgress) ────────
  const isFocusActive = timer.status === 'active';
  const focusElapsed = isFocusActive ? timer.elapsedSeconds : 0;

  // ── Seletor de modo desabilitado quando há sessão em andamento ────────────
  const selectorDisabled =
    timer.status !== 'idle' &&
    timer.status !== 'loading' &&
    timer.status !== 'phase_end_focus' &&
    timer.status !== 'phase_end_break';

  return (
    <div className="flex flex-col items-center justify-start min-h-full p-4 pb-28 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6 mt-2">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            {profile ? getGreeting(profile.name.split(' ')[0]) : 'Olá! 👋'}
          </h1>
          {profile?.nickname && (
            <p className="text-sm text-text-muted">@{profile.nickname}</p>
          )}
        </div>
        <StreakBadge streak={profile?.currentStreak ?? 0} size="md" />
      </div>

      {/* Seletor de modo — visível apenas quando idle/phase_end */}
      {!selectorDisabled && (
        <div className="w-full mb-4">
          <TimerModeSelector
            settings={settings}
            onUpdate={updateSettings}
            disabled={selectorDisabled}
          />
        </div>
      )}

      {/* Timer Card */}
      <div className="w-full bg-bg-secondary rounded-3xl border border-border flex flex-col items-center justify-center mb-4 overflow-hidden">
        <StudyTimer
          elapsedSeconds={timer.elapsedSeconds}
          remainingSeconds={timer.remainingSeconds}
          status={timer.status}
          timerMode={settings.mode}
          timerPhase={timer.timerPhase}
          focusDurationSeconds={settings.focusDurationSeconds}
          breakDurationSeconds={settings.breakDurationSeconds}
        />
        <div className="w-full px-4 pb-4">
          <DailyProgress
            totalSecondsToday={totalSecondsToday}
            pointEarned={pointEarnedToday}
            elapsedSeconds={focusElapsed}
            isActive={isFocusActive}
          />
        </div>
      </div>

      {/* Controles */}
      <div className="w-full">
        <TimerControls
          status={timer.status}
          timerMode={settings.mode}
          isLoading={timer.isLoading}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onFinish={handleFinish}
          onDiscard={handleDiscard}
          onStartBreak={timer.startBreak}
          onSkipBreak={timer.skipBreak}
        />
      </div>

      {/* Erro */}
      {timer.error && timer.status === 'idle' && (
        <p className="mt-4 text-sm text-accent-danger text-center px-4">
          {mapFirebaseError(timer.error)}
        </p>
      )}

      {/* Quick stats */}
      {profile && (
        <div className="w-full mt-6 grid grid-cols-2 gap-3">
          <div className="bg-bg-secondary rounded-2xl p-4 border border-border text-center">
            <p className="text-2xl font-bold text-text-primary">{profile.totalPoints}</p>
            <p className="text-xs text-text-muted mt-1">Pontos totais</p>
          </div>
          <div className="bg-bg-secondary rounded-2xl p-4 border border-border text-center">
            <p className="text-2xl font-bold text-text-primary">
              {Math.floor(profile.totalStudySeconds / 3600)}h
            </p>
            <p className="text-xs text-text-muted mt-1">Horas de estudo</p>
          </div>
        </div>
      )}

      {/* ── Modais ─────────────────────────────────────────────────────────── */}
      <PointCelebration
        show={showCelebration}
        onClose={() => setShowCelebration(false)}
        streak={celebrationData?.currentStreak ?? 0}
        totalPoints={celebrationData?.totalPoints ?? 0}
        newBadgesCount={celebrationData?.newBadgesCount ?? 0}
      />

      <MidnightModal
        show={showMidnight}
        onFinish={handleMidnightFinish}
      />

      {/* Modal de transição de fase (apenas modo timer) */}
      <PhaseTransitionModal
        status={timer.status}
        onStartBreak={timer.startBreak}
        onSkipBreak={timer.skipBreak}
        onStartFocus={handleStartFocusAfterBreak}
        onFinish={handleFinish}
      />
    </div>
  );
};
