import { useRef } from 'react';
import type { TimerStatus } from '../../hooks/useStudyTimer';
import { Button, Icon } from '../ui/DesignSystem';
import { useDialogA11y } from '../ui/Dialog';

export interface PhaseTransitionModalProps {
  status: TimerStatus;
  onStartBreak: () => void;
  onSkipBreak: () => void;
  onStartFocus: () => void;
  onFinish: () => void;
  requiresFinish: boolean;
  error: string | null;
}

export function PhaseTransitionModal({ status, onStartBreak, onSkipBreak, onStartFocus, onFinish, requiresFinish, error }: PhaseTransitionModalProps) {
  const isFocusEnd = status === 'phase_end_focus';
  const isBreakEnd = status === 'phase_end_break';
  const show = isFocusEnd || isBreakEnd;
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogA11y(dialogRef, show);
  if (!show) return null;
  return <div className="ej-dialog-backdrop">
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="phase-transition-title" tabIndex={-1} className="ej-dialog study-modal-surface max-w-sm text-center">
      <div className="study-modal-symbol"><Icon name={isFocusEnd ? 'check' : 'study'} size={30} /></div>
      <span className="study-kicker">{isFocusEnd ? 'Um passo a mais' : 'Energia renovada'}</span>
      <h2 id="phase-transition-title" className="mt-2 text-2xl font-bold">{isFocusEnd ? 'Foco concluído.' : 'De volta ao foco.'}</h2>
      <p className="mt-3 mb-6 text-sm leading-relaxed text-text-secondary">{isFocusEnd ? requiresFinish ? 'Não foi possível salvar o foco. Tente finalizar a sessão novamente.' : 'Ótimo trabalho. Reserve um momento para descansar antes do próximo passo.' : 'Seu intervalo terminou. Vamos continuar sua jornada?'}</p>
      {isFocusEnd && requiresFinish && error && <p role="alert" className="mb-4 text-sm text-accent-danger">{error}</p>}
      <div className="grid gap-3">
        {isFocusEnd && <>
          {!requiresFinish && <Button id="btn-start-break" onClick={onStartBreak}>Iniciar intervalo</Button>}
          <Button id="btn-finish-after-focus" variant={requiresFinish ? 'primary' : 'secondary'} onClick={onFinish}>{requiresFinish ? 'Tentar finalizar novamente' : 'Finalizar sessão'}</Button>
          {!requiresFinish && <Button id="btn-skip-break-after-focus" variant="ghost" onClick={onSkipBreak}>Pular intervalo e continuar</Button>}
        </>}
        {isBreakEnd && <>
          <Button id="btn-start-focus-again" onClick={onStartFocus}>Iniciar novo foco <Icon name="arrow" size={18} /></Button>
          <Button id="btn-finish-after-break" variant="secondary" onClick={onFinish}>Finalizar sessão</Button>
        </>}
      </div>
    </div>
  </div>;
}
