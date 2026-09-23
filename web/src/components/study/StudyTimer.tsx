import { formatSeconds } from '../../utils/formatTime';
import type { TimerMode, TimerPhase } from '../../types';
import type { TimerStatus } from '../../hooks/useStudyTimer';

export interface StudyTimerProps {
  elapsedSeconds: number;
  remainingSeconds: number;
  status: TimerStatus;
  timerMode: TimerMode;
  timerPhase: TimerPhase;
  focusDurationSeconds: number;
  breakDurationSeconds: number;
}

function getStatusLabel(status: TimerStatus, timerMode: TimerMode): string {
  switch (status) {
    case 'active': return timerMode === 'timer' ? 'Foco em andamento' : 'Você está focado';
    case 'active_break': return 'Tempo para respirar';
    case 'paused': return 'Sessão pausada';
    case 'phase_end_focus': return 'Foco concluído';
    case 'phase_end_break': return 'Intervalo concluído';
    case 'loading': return 'Recuperando sua sessão';
    default: return 'Pronto para começar';
  }
}

export function StudyTimer(props: StudyTimerProps) {
  const { elapsedSeconds, remainingSeconds, status, timerMode, timerPhase, focusDurationSeconds, breakDurationSeconds } = props;
  const displaySeconds = timerMode === 'timer' ? remainingSeconds : elapsedSeconds;
  const total = timerPhase === 'focus' ? focusDurationSeconds : breakDurationSeconds;
  const progress = timerMode === 'timer' && total > 0 ? Math.min(100, Math.max(0, ((total - remainingSeconds) / total) * 100)) : null;
  const isActive = status === 'active' || status === 'active_break';

  return <div className={`study-timer study-timer--${status}`}>
    <div className="study-timer-status" role="status"><span className={isActive ? 'study-status-dot is-active' : 'study-status-dot'} />{getStatusLabel(status, timerMode)}</div>
    <div className="study-timer-display" role="timer" aria-label={`Tempo ${timerMode === 'timer' ? 'restante' : 'de estudo'}`} aria-live="off">{formatSeconds(displaySeconds)}</div>
    <div className="study-timer-units" aria-hidden="true"><span>HORAS</span><span>MINUTOS</span><span>SEGUNDOS</span></div>
    {progress !== null ? <div className="study-timer-cycle">
      <div className="study-timer-track" role="progressbar" aria-label="Progresso do ciclo" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div>
      <p>{timerPhase === 'focus' ? `${Math.floor(focusDurationSeconds / 60)} minutos de foco` : `${Math.floor(breakDurationSeconds / 60)} minutos de intervalo`}</p>
    </div> : <p className="study-timer-hint">Seu tempo. Seu ritmo. Sua evolução.</p>}
  </div>;
}
