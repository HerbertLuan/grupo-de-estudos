import { useState } from 'react';

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
  if (!reviewRequired && !checkInDue) return null;
  const maxMinutes = Math.floor((capSeconds || 3 * 3600 + 30 * 60) / 60);
  const parsedMinutes = Number(minutes);
  const valid = Number.isSafeInteger(parsedMinutes) && parsedMinutes >= 0 && parsedMinutes <= maxMinutes;

  return <div role="dialog" aria-modal="true" aria-labelledby="long-session-title" className="fixed inset-0 z-[70] flex items-center justify-center bg-bg-primary/90 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-bg-secondary p-5 shadow-2xl">
      <div><h2 id="long-session-title" className="text-xl font-bold">Você ainda está estudando?</h2>
        <p className="mt-2 text-sm text-text-secondary">{reviewRequired
          ? 'A sessão passou 30 minutos sem confirmação após o aviso de 3 horas. O tempo parou de contar. Informe quanto você estudou de fato antes de continuar.'
          : 'Você chegou a 3 horas de estudo. Confirme para continuar contando o tempo ou finalize a sessão.'}</p>
      </div>
      {reviewRequired ? <>
        <label className="block text-sm font-medium">Tempo real estudado (minutos)
          <input type="number" min="0" max={maxMinutes} step="1" value={minutes} onChange={event => setMinutes(event.target.value)}
            className="mt-2 w-full rounded-xl border border-border bg-bg-primary p-3 focus-visible:outline-2 focus-visible:outline-accent-primary" />
        </label>
        <p className="text-xs text-text-secondary">Máximo para esta sessão: {maxMinutes} minutos. O intervalo depois desse limite não será contabilizado.</p>
        <button type="button" disabled={busy || !valid} onClick={() => onResolve('finish', parsedMinutes * 60)} className="w-full rounded-xl bg-accent-primary p-3 font-semibold text-white disabled:opacity-50">Finalizar com esse tempo</button>
        <button type="button" disabled={busy || !valid} onClick={() => onResolve('continue', parsedMinutes * 60)} className="w-full rounded-xl border border-accent-primary p-3 font-medium text-accent-primary disabled:opacity-50">Continuar a partir de agora</button>
        <button type="button" disabled={busy} onClick={() => { if (window.confirm('Descartar esta sessão sem salvar tempo?')) onResolve('discard'); }} className="w-full py-2 text-sm text-accent-danger underline disabled:opacity-50">Descartar sessão</button>
      </> : <>
        <button type="button" disabled={busy} onClick={onConfirm} className="w-full rounded-xl bg-accent-primary p-3 font-semibold text-white disabled:opacity-50">Sim, continuar estudando</button>
        <button type="button" disabled={busy} onClick={onFinish} className="w-full rounded-xl border border-accent-primary p-3 font-medium text-accent-primary disabled:opacity-50">Finalizar sessão</button>
      </>}
      {error && <p role="alert" className="text-sm text-accent-danger">{error}</p>}
    </div>
  </div>;
}
