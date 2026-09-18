import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSubjectSessions, getSubjectSetup, type SubjectSession, type SubjectSetup } from '../../services/subjectService';
import { SessionDetailsModal } from '../study/SessionDetailsModal';
import { ProgressCharts } from './ProgressCharts';
import { HistorySection } from './HistorySection';
import { formatDuration } from '../../utils/formatTime';

type Period = '7' | '30' | '90' | 'all';

export function SubjectProgress({ uid }: { uid: string }) {
  const [setup, setSetup] = useState<SubjectSetup | null>(null);
  const [sessions, setSessions] = useState<SubjectSession[]>([]);
  const [subjectId, setSubjectId] = useState('all');
  const [period, setPeriod] = useState<Period>('30');
  const [editing, setEditing] = useState<SubjectSession | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [chartsRevision, setChartsRevision] = useState(0);

  const load = useCallback(async () => {
    try {
      const [nextSetup, nextSessions] = await Promise.all([getSubjectSetup(), getSubjectSessions()]);
      setSetup(nextSetup); setSessions(nextSessions); setError(''); setChartsRevision(value => value + 1);
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível carregar o progresso por matéria.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const cutoff = new Date();
    if (period !== 'all') cutoff.setDate(cutoff.getDate() - (Number(period) - 1));
    const from = period === 'all' ? '' : `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
    return sessions.filter(s => (subjectId === 'all' || (subjectId === 'others' ? !s.subjectId : s.subjectId === subjectId)) && (!from || s.studyDate >= from));
  }, [sessions, subjectId, period]);
  const totals = useMemo(() => filtered.reduce((acc, s) => ({ seconds: acc.seconds + s.totalSeconds, questions: acc.questions + (s.questionCount || 0), correct: acc.correct + (s.correctCount || 0) }), { seconds: 0, questions: 0, correct: 0 }), [filtered]);

  return <section className="space-y-4">
    <div className="flex justify-between items-center gap-3"><h2 className="text-lg font-bold">Progresso por matéria</h2><Link to="/subjects" className="text-sm text-accent-primary underline">Minhas matérias</Link></div>
    {error && <p role="alert" className="text-accent-danger">{error}</p>}
    {loading ? <p>Carregando matérias...</p> : <>
      <div className="grid grid-cols-2 gap-3"><label className="text-sm">Matéria<select aria-label="Filtrar matéria" className="block w-full mt-1 p-3 rounded-xl bg-bg-secondary border border-border" value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="all">Todas</option><option value="others">Outros</option>{setup?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label className="text-sm">Período dos indicadores<select aria-label="Filtrar período dos indicadores" className="block w-full mt-1 p-3 rounded-xl bg-bg-secondary border border-border" value={period} onChange={e => setPeriod(e.target.value as Period)}><option value="7">7 dias</option><option value="30">30 dias</option><option value="90">90 dias</option><option value="all">Todo o histórico</option></select></label></div>
      <div className="grid grid-cols-3 gap-2"><div className="bg-bg-secondary rounded-xl p-3 border border-border"><p className="text-xs text-text-secondary">Tempo</p><strong>{formatDuration(totals.seconds)}</strong></div><div className="bg-bg-secondary rounded-xl p-3 border border-border"><p className="text-xs text-text-secondary">Questões</p><strong>{totals.questions}</strong></div><div className="bg-bg-secondary rounded-xl p-3 border border-border"><p className="text-xs text-text-secondary">Acertos</p><strong>{totals.questions ? `${Math.round(totals.correct / totals.questions * 100)}%` : 'Sem dados'}</strong></div></div>
      <ProgressCharts key={chartsRevision} subjectId={subjectId} showSubjectFilter={false} />
    </>}
    <HistorySection uid={uid} sessions={loading ? undefined : sessions} setup={setup} onEdit={setEditing} />
    <SessionDetailsModal sessionId={editing?.id || null} initial={editing} onClose={() => { setEditing(null); void load(); }} />
  </section>;
}
