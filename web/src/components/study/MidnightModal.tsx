import { useRef } from 'react';
import { Button, Icon } from '../ui/DesignSystem';
import { useDialogA11y } from '../ui/Dialog';

export interface MidnightModalProps { show: boolean; onFinish: () => void; }

export function MidnightModal({ show, onFinish }: MidnightModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogA11y(dialogRef, show);
  if (!show) return null;
  return <div className="ej-dialog-backdrop">
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="midnight-title" tabIndex={-1} className="ej-dialog study-modal-surface max-w-sm text-center">
      <div className="study-modal-symbol"><Icon name="study" size={29} /></div>
      <span className="study-kicker">Um novo dia</span>
      <h2 id="midnight-title" className="mt-2 text-xl font-bold">Passamos da meia-noite.</h2>
      <p className="mt-3 mb-6 text-sm leading-relaxed text-text-secondary">Sua sessão será registrada no dia anterior. Finalize o estudo para registrar seu tempo.</p>
      <Button className="w-full" onClick={onFinish}>Finalizar estudo <Icon name="check" size={18} /></Button>
    </div>
  </div>;
}
