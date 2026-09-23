import { useRef } from 'react';
import { Badge, Button, Icon } from '../ui/DesignSystem';
import { useDialogA11y } from '../ui/Dialog';

export interface PointCelebrationProps { show: boolean; onClose: () => void; streak: number; totalPoints: number; newBadgesCount: number; }

export function PointCelebration({ show, onClose, streak, totalPoints, newBadgesCount }: PointCelebrationProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogA11y(dialogRef, show, onClose);
  if (!show) return null;
  return <div className="ej-dialog-backdrop">
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="point-celebration-title" tabIndex={-1} className="ej-dialog study-modal-surface max-w-sm text-center">
      <div className="study-modal-symbol" style={{ color: '#f4c415', borderColor: '#f4c41555', background: '#f4c41512' }}><Icon name="ranking" size={31} /></div>
      <Badge tone="yellow">+1 ponto na sua jornada</Badge>
      <h2 id="point-celebration-title" className="mt-4 text-2xl font-bold">Disciplina que conquista.</h2>
      <p className="mt-3 mb-6 text-sm leading-relaxed text-text-secondary">Você completou 60 minutos de estudo hoje. Mais um passo em direção ao que importa.</p>
      <dl className="mb-6 divide-y divide-border rounded-xl border border-border px-4 text-sm">
        <div className="flex items-center justify-between py-4"><dt className="text-text-secondary">Pontos totais</dt><dd className="text-xl font-bold">{totalPoints}</dd></div>
        {streak > 1 && <div className="flex items-center justify-between py-4"><dt className="text-text-secondary">Sequência</dt><dd className="font-semibold text-accent-warning">{streak} dias seguidos</dd></div>}
        {newBadgesCount > 0 && <div className="flex items-center justify-between py-4"><dt className="text-text-secondary">Novas conquistas</dt><dd className="font-semibold text-accent-primary-hover">{newBadgesCount}</dd></div>}
      </dl>
      <Button className="w-full" onClick={onClose}>Continuar <Icon name="arrow" size={18} /></Button>
    </div>
  </div>;
}
