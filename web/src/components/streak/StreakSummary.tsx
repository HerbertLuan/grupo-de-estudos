import { Icon } from '../ui/DesignSystem';

export function StreakSummary({ current, longest, completed }: { current: number; longest: number; completed: number }) {
  return <aside className="streak-summary" aria-label="Resumo da sequência">
    <div className="streak-summary-current"><Icon name="bolt" size={23}/><span><small>Sequência atual</small><strong>{current} {current === 1 ? 'dia' : 'dias'}</strong></span></div>
    <div className="streak-summary-secondary"><span><Icon name="bolt" size={17}/><small>Maior sequência</small><strong>{longest} {longest === 1 ? 'dia' : 'dias'}</strong></span><span><Icon name="check" size={17}/><small>Dias com meta concluída neste mês</small><strong>{completed}</strong></span></div>
    <p>Um dia conta para a sequência ao atingir a meta de 60 minutos e receber o ponto diário.</p>
  </aside>;
}
