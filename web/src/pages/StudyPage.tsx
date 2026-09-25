import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuthContext } from '../contexts/AuthContext';
import { useStudyTimer } from '../hooks/useStudyTimer';
import { useTimerSettings } from '../hooks/useTimerSettings';
import { useTimerNotification } from '../hooks/useTimerNotification';
import { useTodayStudy } from '../hooks/useTodayStudy';
import { useRanking } from '../hooks/useRanking';
import { StudyTimer } from '../components/study/StudyTimer';
import { TimerControls } from '../components/study/TimerControls';
import { TimerModeSelector } from '../components/study/TimerModeSelector';
import { DailyProgress } from '../components/study/DailyProgress';
import { PointCelebration } from '../components/study/PointCelebration';
import { MidnightModal } from '../components/study/MidnightModal';
import { PhaseTransitionModal } from '../components/study/PhaseTransitionModal';
import { SessionDetailsModal } from '../components/study/SessionDetailsModal';
import { LongStudySessionModal } from '../components/study/LongStudySessionModal';
import { StreakBadge } from '../components/ui/StreakBadge';
import { useToast } from '../components/ui/Toast';
import { mapFirebaseError } from '../utils/errors';
import { getTodayDateString } from '../utils/formatDate';
import { formatDuration } from '../utils/formatTime';
import { Badge, Card, Icon, PageHeader, StatCard } from '../components/ui/DesignSystem';
import { db } from '../firebase/config';
import type { FinishSessionResult, Season } from '../types';
import './study-redesign.css';

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Bom dia, ${name}.`;
  if (hour < 18) return `Boa tarde, ${name}.`;
  return `Boa noite, ${name}.`;
}

const completionKey = (uid: string) => `pending-study-completion:${uid}`;

function readPendingCompletion(uid?: string): { sessionId: string; celebration: FinishSessionResult | null } | null {
  if (!uid) return null;
  try {
    const saved = sessionStorage.getItem(completionKey(uid));
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return typeof parsed?.sessionId === 'string' && parsed.sessionId
      ? { sessionId: parsed.sessionId, celebration: parsed.celebration ?? null }
      : null;
  } catch {
    return null;
  }
}

export const StudyPage: React.FC = () => {
  const { profile, user } = useAuthContext();
  const { showToast } = useToast();

  // ── Configurações do timer ────────────────────────────────────────────────
  const { settings, updateSettings } = useTimerSettings();
  const { notifyFocusEnd, notifyBreakEnd, requestPermission } = useTimerNotification();

  // ── Hook do timer ─────────────────────────────────────────────────────────
  const timer = useStudyTimer(settings);

  const { totalSecondsToday, pointEarnedToday } = useTodayStudy();
  const ranking = useRanking(profile?.groupId ?? null);
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [seasonLoading, setSeasonLoading] = useState(true);
  const [seasonError, setSeasonError] = useState(false);

  const { fetchRanking } = ranking;
  useEffect(() => { void fetchRanking(); }, [fetchRanking]);
  useEffect(() => {
    if (!profile?.groupId) return;
    return onSnapshot(query(collection(db, 'seasons'), where('groupId', '==', profile.groupId)), snapshot => {
      const seasons = snapshot.docs.map(item => ({ ...item.data(), id: item.id } as Season));
      setActiveSeason(seasons.find(season => season.active) ?? null);
      setSeasonLoading(false);
      setSeasonError(false);
    }, () => { setSeasonLoading(false); setSeasonError(true); });
  }, [profile?.groupId]);

  const [celebrationData, setCelebrationData] = useState<FinishSessionResult | null>(() => readPendingCompletion(user?.uid)?.celebration ?? null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [detailsSessionId, setDetailsSessionId] = useState<string | null>(() => readPendingCompletion(user?.uid)?.sessionId ?? null);
  const lastAutoHandledId = useRef<string | null>(null);
  const [showMidnight, setShowMidnight] = useState(false);
  const [currentDate, setCurrentDate] = useState(getTodayDateString());

  const queueSessionDetails = useCallback((result: FinishSessionResult) => {
    const celebration = result.pointEarnedNow ? result : null;
    if (user) {
      try { sessionStorage.setItem(completionKey(user.uid), JSON.stringify({ sessionId: result.sessionId, celebration })); }
      catch { /* O modal continua aberto nesta navegação mesmo sem storage. */ }
    }
    setDetailsSessionId(result.sessionId);
    setCelebrationData(celebration);
  }, [user]);

  const closeSessionDetails = useCallback(() => {
    if (user) {
      try { sessionStorage.removeItem(completionKey(user.uid)); } catch { /* sem storage */ }
    }
    setDetailsSessionId(null);
    if (celebrationData) setShowCelebration(true);
  }, [user, celebrationData]);

  // ── Solicitar permissão de notificação na primeira interação ──────────────
  useEffect(() => {
    const handleFirstInteraction = () => {
      requestPermission();
      window.removeEventListener('pointerdown', handleFirstInteraction);
    };
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    return () => window.removeEventListener('pointerdown', handleFirstInteraction);
  }, [requestPermission]);

  // ── Celebração automática ao fim de ciclo de foco (modo Temporizador) ───────
  useEffect(() => {
    const result = timer.lastAutoFinishResult;
    if (!result || lastAutoHandledId.current === result.sessionId) return;
    lastAutoHandledId.current = result.sessionId;
    queueSessionDetails(result);
    if (!result.pointEarnedNow) {
      const minutes = Math.floor(result.sessionSeconds / 60);
      showToast(`Foco concluído! ${minutes}min de estudo salvos.`, 'success');
    }
  }, [timer.lastAutoFinishResult, showToast, queueSessionDetails]);

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
    // Se o ciclo de foco já foi auto-finalizado (modo Temporizador), o backend
    // não tem sessão ativa. Nesse caso, usamos o resultado já capturado.
    if (!timer.sessionId && timer.lastAutoFinishResult) {
      // O resultado já foi apresentado quando o foco terminou.
      timer.skipBreak();
      return;
    }
    const result = await timer.finish();
    if (result) {
      setShowMidnight(false);
      queueSessionDetails(result);
      if (!result.pointEarnedNow) {
        const minutes = Math.floor(result.sessionSeconds / 60);
        showToast(`Sessão finalizada! ${minutes}min estudados.`, 'success');
      }
    } else if (timer.error) {
      showToast(mapFirebaseError(timer.error), 'error');
    }
  }, [timer, showToast, queueSessionDetails]);

  const handleDiscard = useCallback(async () => {
    try {
      await timer.discard();
      showToast('Sessão descartada.', 'info');
    } catch {
      showToast(timer.error || 'Erro ao descartar', 'error');
    }
  }, [timer, showToast]);

  const handleResolveReview = useCallback(async (action: 'finish' | 'continue' | 'discard', reportedSeconds?: number) => {
    const outcome = await timer.resolveReview(action, reportedSeconds);
    if (!outcome.success) return;
    setShowMidnight(false);
    if (action === 'finish' && outcome.result) queueSessionDetails(outcome.result);
    if (action === 'discard') showToast('Sessão descartada.', 'info');
  }, [timer, queueSessionDetails, showToast]);

  const handleMidnightFinish = useCallback(async () => {
    setShowMidnight(false);
    await handleFinish();
  }, [handleFinish]);

  // Quando usuário clica "Iniciar Novo Foco" após intervalo — cria nova sessão no backend
  const handleStartFocusAfterBreak = useCallback(async () => {
    await handleStart();
  }, [handleStart]);

  // ── Sessão está em modo foco ou pausada (conta para DailyProgress) ────────
  const isFocusActive = timer.status === 'active';
  const focusElapsed = isFocusActive ? timer.elapsedSeconds : 0;
  const currentMode = timer.sessionMode || settings.mode;
  const currentFocusSeconds = timer.sessionFocusDurationSeconds || settings.focusDurationSeconds;

  // ── Seletor de modo desabilitado quando há sessão em andamento ────────────
  const selectorDisabled =
    timer.status !== 'idle' &&
    timer.status !== 'loading' &&
    (timer.status !== 'phase_end_focus' || !!timer.sessionId) &&
    timer.status !== 'phase_end_break';

  return (
    <div className={`ej-page study-workspace ${isFocusActive ? 'study-workspace--active' : ''}`}>
      <PageHeader eyebrow="SEU ESPAÇO DE FOCO" title={profile ? getGreeting(profile.name.split(' ')[0]) : 'Vamos estudar.'}
        description="Disciplina hoje. Conquistas amanhã. Um estudo de cada vez."
        actions={<StreakBadge streak={profile?.currentStreak ?? 0} size="md" />} />

      <div className="study-workspace-grid">
        <section className="study-focus-panel" aria-label="Sua sessão de estudo">
          <div className="study-focus-heading">
            <span className="study-kicker"><Icon name="study" size={17} /> Hora de fazer acontecer</span>
            <span className="study-focus-number" aria-hidden="true">01 / FOCO</span>
          </div>
          {!selectorDisabled && <TimerModeSelector settings={settings} onUpdate={updateSettings} disabled={selectorDisabled} />}
          <StudyTimer elapsedSeconds={timer.elapsedSeconds} remainingSeconds={timer.remainingSeconds}
            status={timer.status} timerMode={currentMode} timerPhase={timer.timerPhase}
            focusDurationSeconds={currentFocusSeconds} breakDurationSeconds={settings.breakDurationSeconds} />
          <TimerControls status={timer.status} timerMode={currentMode} isLoading={timer.isLoading}
            onStart={handleStart} onPause={handlePause} onResume={handleResume} onFinish={handleFinish}
            onDiscard={handleDiscard} onSkipBreak={timer.skipBreak} />
          {timer.error && timer.status === 'idle' && <p role="alert" className="study-timer-error">{mapFirebaseError(timer.error)}</p>}
          <div className="study-focus-footer"><span className="study-focus-line" />
            {timer.status === 'active' ? 'Seu próximo passo começa neste momento.' : timer.status === 'paused' ? 'Uma pausa também faz parte. Volte no seu ritmo.' : 'Menos distração. Mais direção.'}
          </div>
        </section>

        <aside className="study-context">
          <Card className="study-today-card">
            <div className="study-card-heading"><h2>Seu dia, em progresso</h2><Icon name="progress" size={18} /></div>
            <div className="study-today-value">{formatDuration(totalSecondsToday + focusElapsed)}<span>de estudo hoje</span></div>
            <DailyProgress totalSecondsToday={totalSecondsToday} pointEarned={pointEarnedToday} elapsedSeconds={focusElapsed} isActive={isFocusActive} />
            <Link to="/progress" className="study-text-link">Explorar meu progresso <Icon name="arrow" size={16} /></Link>
          </Card>
          <Card className="study-season-card">
            <div className="study-card-heading"><span className="study-kicker">Na mesma direção</span><Icon name="seasons" size={19} /></div>
            {seasonLoading ? <p role="status" className="text-sm text-text-muted">Carregando temporada...</p> : seasonError ? <p className="text-sm text-text-secondary">Não foi possível carregar a temporada.</p> : activeSeason ? <>
              <Badge tone="yellow">Temporada em andamento</Badge>
              <h2>{activeSeason.name}</h2>
              <p className="text-sm text-text-secondary">{activeSeason.startDate.split('-').reverse().join('/')} — {activeSeason.endDate.split('-').reverse().join('/')}</p>
            </> : <><h2>O próximo ciclo vem aí.</h2><p className="text-sm text-text-secondary">Ainda não há temporada ativa. Seu progresso continua contando.</p></>}
            <Link to="/seasons" className="study-text-link">Ver temporadas <Icon name="arrow" size={16} /></Link>
          </Card>
        </aside>
      </div>

      {profile && <section className="study-overview" aria-label="Resumo da sua jornada">
        <div className="study-section-heading"><h2>Cada esforço conta.</h2><Link to="/profile" className="study-text-link">Minha jornada <Icon name="arrow" size={16} /></Link></div>
        <div className="study-stats-grid">
          <StatCard label="Tempo total" value={formatDuration(profile.totalStudySeconds)} detail="Conhecimento acumulado" icon={<Icon name="study" />} />
          <StatCard label="Pontos conquistados" value={profile.totalPoints} detail="Um dia de cada vez" tone="yellow" icon={<Icon name="ranking" />} />
          <StatCard label="No ranking geral" value={ranking.loading ? '…' : ranking.error ? '—' : ranking.entries.find(entry => entry.uid === user?.uid)?.rank ? `${ranking.entries.find(entry => entry.uid === user?.uid)?.rank}º` : '—'} detail={ranking.error ? 'Ranking indisponível agora' : ranking.totalMembers ? `Entre ${ranking.totalMembers} estudantes` : 'Sua posição no grupo'} icon={<Icon name="ranking" />} />
        </div>
      </section>}

      <section className="study-next-steps" aria-label="Continue sua jornada">
        <Link to="/subjects"><span className="study-shortcut-icon"><Icon name="subjects" /></span><span><strong>Organize suas matérias</strong><small>Seu estudo, com direção.</small></span><Icon name="arrow" size={18} /></Link>
        <Link to="/feed"><span className="study-shortcut-icon"><Icon name="feed" /></span><span><strong>Evolua em comunidade</strong><small>Compartilhe cada conquista.</small></span><Icon name="arrow" size={18} /></Link>
      </section>

      {/* ── Modais ─────────────────────────────────────────────────────────── */}
      <SessionDetailsModal sessionId={detailsSessionId} onClose={closeSessionDetails} />
      {(timer.checkInDue || timer.reviewRequired) && <LongStudySessionModal
        key={`${timer.sessionId}-${timer.reviewCapSeconds}`} reviewRequired={timer.reviewRequired} checkInDue={timer.checkInDue}
        capSeconds={timer.reviewCapSeconds} busy={timer.isLoading} error={timer.error}
        onConfirm={() => void timer.confirmCheckIn()} onFinish={() => void handleFinish()}
        onResolve={(action, seconds) => void handleResolveReview(action, seconds)} />}
      <PointCelebration
        show={showCelebration}
        onClose={() => { setShowCelebration(false); setCelebrationData(null); }}
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
        status={showCelebration || !!detailsSessionId ? 'idle' : timer.status}
        onStartBreak={timer.startBreak}
        onSkipBreak={timer.skipBreak}
        onStartFocus={handleStartFocusAfterBreak}
        onFinish={handleFinish}
        requiresFinish={!!timer.sessionId}
        error={timer.error}
      />
    </div>
  );
};
