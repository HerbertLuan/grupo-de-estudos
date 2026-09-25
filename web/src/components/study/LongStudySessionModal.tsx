import { useRef, useState } from 'react';
import { Badge, Button } from '../ui/DesignSystem';
import { useDialogA11y } from '../ui/Dialog';

interface Props {
  reviewRequired: boolean;
  checkInDue: boolean;
  capSeconds: number | null;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onFinish: () => void;
  onResolve: (action: 'finish' | 'continue' | 'discard', reportedSeconds?: number) => void;
}

export function LongStudySessionModal({ reviewRequired, checkInDue, capSeconds, busy, error,
  onConfirm, onFinish, onResolve }: Props) {
  const [minutes, setMinutes] = useState(() => String(Math.max(0, Math.floor(((capSeconds || 3 * 3600 + 30 * 60) - 30 * 60) / 60))));
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogA11y(dialogRef, reviewRequired || checkInDue);
  if (!reviewRequired && !checkInDue) return null;
  const maxMinutes = Math.floor((capSeconds || 3 * 3600 + 30 * 60) / 60);
  const parsedMinutes = Number(minutes);
  const valid = Number.isSafeInteger(parsedMinutes) && parsedMinutes >= 0 && parsedMinutes <= maxMinutes;

  return <div className="ej-dialog-backdrop z-[70]">
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="long-session-title" tabIndex={-1} className="ej-dialog study-modal-surface max-w-md space-y-4">
      <Badge tone="yellow">{reviewRequired ? 'Revisão da sessão' : 'Check-in de foco'}</Badge>
      <div><h2 id="long-session-title" className="text-xl font-bold">Você ainda está estudando?</h2>
        <p className="mt-2 text-sm text-text-secondary">{reviewRequired
          ? 'A sessão passou 30 minutos sem confirmação após o aviso de 3 horas. O tempo parou de contar. Informe quanto você estudou de fato antes de continuar.'
          : 'Você chegou a 3 horas de estudo. Confirme para continuar contando o tempo ou finalize a sessão.'}</p>
      </div>
      {reviewRequired ? <>
        <label className="block text-sm font-medium">Tempo real estudado (minutos)
          <input type="number" min="0" max={maxMinutes} step="1" value={minutes} onChange={event => setMinutes(event.target.value)}
            className="ej-input mt-2 w-full" />
        </label>
        <p className="text-xs text-text-secondary">Máximo para esta sessão: {maxMinutes} minutos. O intervalo depois desse limite não será contabilizado.</p>
        <Button type="button" disabled={busy || !valid} onClick={() => onResolve('finish', parsedMinutes * 60)} className="w-full">Finalizar com esse tempo</Button>
        <Button type="button" variant="secondary" disabled={busy || !valid} onClick={() => onResolve('continue', parsedMinutes * 60)} className="w-full">Continuar a partir de agora</Button>
        <Button type="button" variant="danger" disabled={busy} onClick={() => { if (window.confirm('Descartar esta sessão sem salvar tempo?')) onResolve('discard'); }} className="w-full">Descartar sessão</Button>
      </> : <>
        <Button type="button" disabled={busy} onClick={onConfirm} className="w-full">Sim, continuar estudando</Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={onFinish} className="w-full">Finalizar sessão</Button>
      </>}
      {error && <p role="alert" className="text-sm text-accent-danger">{error}</p>}
    </div>
  </div>;
}
