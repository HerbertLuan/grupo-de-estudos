import { useMemo, useState } from 'react';
import type { DailyStudy } from '../../types';
import type { SubjectSession, SubjectSetup } from '../../services/subjectService';
import { formatDate } from '../../utils/formatDate';
import { formatDuration } from '../../utils/formatTime';
import { subjectColor } from '../../utils/subjectColor';

interface HistoryListProps {
  history: DailyStudy[];
  sessions?: SubjectSession[];
  setup?: SubjectSetup | null;
  onEdit?: (session: SubjectSession) => void;
}

export function HistoryList({ history, sessions, setup, onEdit }: HistoryListProps) {
  const [expandedDate, setExpandedDate] = useState<string | null | undefined>(undefined);
  const activeDate = expandedDate === undefined ? history[0]?.date : expandedDate;
  const sessionsByDate = useMemo(() => {
    const grouped = new Map<string, SubjectSession[]>();
    for (const session of sessions || []) {
      const group = grouped.get(session.studyDate) || [];
      group.push(session);
      grouped.set(session.studyDate, group);
    }
    return grouped;
  }, [sessions]);
  const subjectNames = useMemo(() => new Map(setup?.subjects.map(subject => [subject.id, subject.name]) || []), [setup]);

  if (!history.length) {
    return <div className="rounded-xl border border-dashed border-border py-8 text-center text-text-secondary">Nenhum registro de estudo encontrado.</div>;
  }

  return <div className="overflow-hidden rounded-2xl border border-border bg-bg-secondary">
    {history.map((day, index) => {
      const expanded = sessions !== undefined && activeDate === day.date;
      const daySessions = sessionsByDate.get(day.date) || [];
      return <div key={day.date} className={index !== history.length - 1 ? 'border-b border-border' : ''}>
        {sessions === undefined ? <div className="flex items-center justify-between gap-3 p-4">
          <div><div className="font-medium text-text-primary">{formatDate(day.date)}</div><div className="mt-1 text-xs text-text-secondary">{day.totalSessions ?? day.sessionsCount ?? 0} sessões</div></div>
          <div className="flex items-center gap-3"><strong className="whitespace-nowrap text-sm">{formatDuration(day.totalSeconds)}</strong><span aria-label={day.pointEarned ? 'Ponto conquistado' : 'Sem ponto'} title={day.pointEarned ? 'Ponto conquistado' : 'Sem ponto'}>{day.pointEarned ? '✅' : '❌'}</span></div>
        </div> : <button type="button" aria-expanded={expanded} onClick={() => setExpandedDate(expanded ? null : day.date)} className="block w-full p-4 text-left hover:bg-bg-tertiary/50 focus-visible:outline-2 focus-visible:outline-accent-primary">
          <span className="flex items-center justify-between gap-3"><span className="font-medium text-text-primary">{formatDate(day.date)}</span><span className="flex shrink-0 items-center gap-3"><strong className="whitespace-nowrap text-sm">{formatDuration(day.totalSeconds)}</strong><span role="img" aria-label={day.pointEarned ? 'Ponto conquistado' : 'Sem ponto'} title={day.pointEarned ? 'Ponto conquistado' : 'Sem ponto'}>{day.pointEarned ? '✅' : '❌'}</span></span></span>
          <span className="mt-1 flex items-center justify-between gap-3"><span className="text-xs text-text-secondary">{day.totalSessions ?? day.sessionsCount ?? 0} sessões</span><span aria-hidden="true" className="text-xs font-medium text-accent-primary">{expanded ? 'Ocultar sessões' : 'Ver sessões'}</span></span>
        </button>}
        {expanded && <div className="space-y-2 border-t border-border bg-bg-primary/30 p-3">
          {daySessions.length ? daySessions.map(session => <div key={session.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-bg-secondary p-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium"><span aria-hidden="true" className="size-3 shrink-0 rounded-full" style={{ backgroundColor: subjectColor(session.subjectId, setup?.subjectColors || {}) }} /><span className="truncate">{subjectNames.get(session.subjectId || '') || 'Outros'}</span></p>
              <p className="mt-1 text-xs text-text-secondary">{formatDuration(session.totalSeconds)} · {session.didQuestions === true ? `${session.correctCount ?? 0}/${session.questionCount ?? 0} questões` : session.didQuestions === false ? 'Sem questões' : 'Questões não informadas'}</p>
            </div>
            {onEdit && <button type="button" onClick={() => onEdit(session)} className="shrink-0 text-sm text-accent-primary underline">Editar</button>}
          </div>) : <p className="px-1 py-2 text-sm text-text-secondary">Detalhes das sessões indisponíveis para este dia.</p>}
        </div>}
      </div>;
    })}
  </div>;
}
