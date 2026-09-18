import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getSubjectSetup, saveSessionDetails, type SubjectSession, type SubjectSetup } from '../../services/subjectService';
import { subjectColor } from '../../utils/subjectColor';

interface Props { sessionId: string | null; onClose: () => void; initial?: SubjectSession | null }

export function SessionDetailsModal({ sessionId, onClose, initial }: Props) {
  const [setup, setSetup] = useState<SubjectSetup | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [didQuestions, setDidQuestions] = useState<boolean | null>(null);
  const [questionCount, setQuestionCount] = useState('');
  const [correctCount, setCorrectCount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [readySessionId, setReadySessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    let draft: { subjectId?: string | null; didQuestions?: boolean | null; questionCount?: string; correctCount?: string } | null = null;
    if (!initial) {
      try { draft = JSON.parse(sessionStorage.getItem(`session-details-draft:${sessionId}`) || 'null'); }
      catch { draft = null; }
    }
    setSetup(null);
    setSubjectId(draft?.subjectId ?? initial?.subjectId ?? null);
    setDidQuestions(draft?.didQuestions ?? initial?.didQuestions ?? null);
    setQuestionCount(draft?.questionCount ?? (initial?.questionCount == null ? '' : String(initial.questionCount)));
    setCorrectCount(draft?.correctCount ?? (initial?.correctCount == null ? '' : String(initial.correctCount)));
    setError('');
    setReadySessionId(sessionId);
    getSubjectSetup().then(data => { if (active) setSetup(data); }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Não foi possível carregar as matérias.'); });
    return () => { active = false; };
  }, [sessionId, initial]);

  useEffect(() => {
    if (!sessionId || initial || readySessionId !== sessionId) return;
    try { sessionStorage.setItem(`session-details-draft:${sessionId}`, JSON.stringify({ subjectId, didQuestions, questionCount, correctCount })); }
    catch { /* O formulário permanece utilizável sem storage. */ }
  }, [sessionId, initial, readySessionId, subjectId, didQuestions, questionCount, correctCount]);

  if (!sessionId) return null;
  const mySubjects = setup?.subjects.filter(s => initial || setup.preferredSubjectIds.includes(s.id) || s.id === subjectId) || [];

  function close() {
    if (!initial) {
      try { sessionStorage.removeItem(`session-details-draft:${sessionId}`); } catch { /* sem storage */ }
    }
    onClose();
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!sessionId || didQuestions === null) return;
    setBusy(true); setError('');
    try {
      await saveSessionDetails({ sessionId, subjectId, didQuestions, questionCount: didQuestions ? Number(questionCount) : 0, correctCount: didQuestions ? Number(correctCount) : 0 });
      close();
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar.'); }
    finally { setBusy(false); }
  }

  return <div role="dialog" aria-modal="true" aria-labelledby="session-details-title" className="fixed inset-0 z-[60] bg-bg-primary/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget && !busy) close(); }}>
    <form onSubmit={save} className="bg-bg-secondary border border-border rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
      <div className="flex justify-between gap-3"><div><h2 id="session-details-title" className="text-xl font-bold">{initial ? 'Editar sessão' : 'Como foi seu estudo?'}</h2><p className="text-sm text-text-secondary mt-1">{initial ? 'Corrija a matéria ou as questões registradas.' : 'Sessão salva. Complete os detalhes para acompanhar seu progresso.'}</p></div><button type="button" aria-label="Fechar" onClick={close} disabled={busy} className="text-text-secondary text-xl">×</button></div>
      <fieldset className="space-y-2"><legend className="font-semibold mb-2">Matéria estudada</legend>
        <label className="flex gap-2 items-center p-3 bg-bg-tertiary rounded-xl"><input type="radio" name="subject" checked={subjectId === null} onChange={() => setSubjectId(null)} />Outros</label>
        {mySubjects.map(subject => {
          const color = subjectColor(subject.id, setup?.subjectColors || {});
          return <label key={subject.id} className="flex gap-2 items-center p-3 rounded-xl border" style={{ backgroundColor: `${color}${subjectId === subject.id ? '38' : '20'}`, borderColor: `${color}99` }}><input type="radio" name="subject" checked={subjectId === subject.id} onChange={() => setSubjectId(subject.id)} /><span className="w-3 h-3 rounded-full flex-none" style={{ backgroundColor: color }} />{subject.name}</label>;
        })}
        {!mySubjects.length && <p className="text-sm text-text-secondary">Sua lista está vazia. Escolha matérias do grupo para vê-las aqui.</p>}
        {!initial && <Link to="/subjects" className="inline-block text-sm text-accent-primary underline">Gerenciar minhas matérias</Link>}
      </fieldset>
      <fieldset className="space-y-2"><legend className="font-semibold mb-2">Fez questões neste estudo?</legend><div className="flex gap-4"><label className="flex gap-2 items-center"><input type="radio" name="questions" checked={didQuestions === true} onChange={() => setDidQuestions(true)} />Sim</label><label className="flex gap-2 items-center"><input type="radio" name="questions" checked={didQuestions === false} onChange={() => setDidQuestions(false)} />Não</label></div></fieldset>
      {didQuestions && <div className="grid grid-cols-2 gap-3"><label className="text-sm">Questões feitas<input aria-label="Questões feitas" required type="number" min="1" step="1" value={questionCount} onChange={e => setQuestionCount(e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-bg-primary border border-border" /></label><label className="text-sm">Acertos<input aria-label="Acertos" required type="number" min="0" max={questionCount || undefined} step="1" value={correctCount} onChange={e => setCorrectCount(e.target.value)} className="w-full mt-1 p-3 rounded-xl bg-bg-primary border border-border" /></label></div>}
      {error && <p role="alert" className="text-accent-danger text-sm">{error}</p>}
      <button type="submit" disabled={busy || didQuestions === null} className="w-full p-3 rounded-xl bg-accent-primary text-white font-bold disabled:opacity-50">{busy ? 'Salvando...' : 'Salvar detalhes'}</button>
      <button type="button" disabled={busy} onClick={close} className="w-full text-sm text-text-secondary underline">{initial ? 'Cancelar' : 'Deixar em Outros por enquanto'}</button>
    </form>
  </div>;
}
