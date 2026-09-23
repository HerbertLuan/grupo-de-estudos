import type { TimerMode } from '../../types';
import type { TimerStatus } from '../../hooks/useStudyTimer';
import { Icon } from '../ui/DesignSystem';

export interface TimerControlsProps {
  status: TimerStatus;
  timerMode: TimerMode;
  isLoading: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onDiscard: () => void;
  onSkipBreak: () => void;
}

export function TimerControls({ status, timerMode, isLoading, onStart, onPause, onResume, onFinish, onDiscard, onSkipBreak }: TimerControlsProps) {
  return <div className="study-timer-controls" aria-label="Controles da sessão" aria-busy={isLoading}>
    {status === 'idle' && <button id="btn-start-study" type="button" disabled={isLoading} onClick={onStart} className="study-control-primary"><span className="study-play-icon" aria-hidden="true" />{isLoading ? 'Iniciando…' : timerMode === 'timer' ? 'Iniciar foco' : 'Começar a estudar'}<Icon name="arrow" size={19} /></button>}
    {(status === 'active' || status === 'paused') && <>
      <div className="study-control-pair">
        {status === 'active' ? <button id="btn-pause" type="button" disabled={isLoading} onClick={onPause} className="study-control-secondary"><span className="study-pause-icon" aria-hidden="true" />Pausar</button> : <button id="btn-resume" type="button" disabled={isLoading} onClick={onResume} className="study-control-primary"><span className="study-play-icon" aria-hidden="true" />Continuar</button>}
        <button id={status === 'active' ? 'btn-finish-from-active' : 'btn-finish-from-paused'} type="button" disabled={isLoading} onClick={onFinish} className={status === 'active' ? 'study-control-primary' : 'study-control-secondary'}><Icon name="check" size={19} />Finalizar sessão</button>
      </div>
      {status === 'paused' && <button id="btn-discard" type="button" disabled={isLoading} onClick={() => { if (window.confirm('Tem certeza que deseja descartar esta sessão? O tempo não será salvo.')) onDiscard(); }} className="study-control-discard">Descartar sessão</button>}
    </>}
    {status === 'active_break' && <button id="btn-skip-break" type="button" onClick={onSkipBreak} className="study-control-secondary">Pular intervalo <Icon name="arrow" size={18} /></button>}
    {status === 'loading' && <div className="study-control-loading" role="status">Preparando seu espaço de foco…</div>}
  </div>;
}
