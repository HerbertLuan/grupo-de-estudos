import type { DailyStudy } from '../../types';
import { formatDuration } from '../../utils/formatTime';
import { dayState, fullDate } from './calendarDates';

export function StreakDayDetails({ date, today, record }: { date: string; today: string; record?: DailyStudy }) {
  const state = dayState(date, today, record);
  return <section className="streak-details" aria-live="polite" aria-label="Detalhes do dia selecionado">
    <h3>{fullDate(date)}{date === today ? ' · Hoje' : ''}</h3>
    <dl><div><dt>Tempo registrado</dt><dd>{record ? formatDuration(record.totalSeconds) : 'Nenhum'}</dd></div>
      <div><dt>Meta diária</dt><dd>{state === 'completed' ? 'Concluída · ponto diário recebido' : state === 'partial' ? 'Não concluída · estudo parcial' : 'Não concluída · sem estudo registrado'}</dd></div>
      {record && Number.isFinite(record.totalSessions ?? record.sessionsCount) && <div><dt>Sessões</dt><dd>{record.totalSessions ?? record.sessionsCount}</dd></div>}</dl>
  </section>;
}
