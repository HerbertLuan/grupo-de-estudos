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
  const mySubjects = setup?.subjects.filter(s =>
    setup.preferredSubjectIds.includes(s.id) || s.id === initial?.subjectId || s.id === subjectId
  ) || [];

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

  const optionCard = 'flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors focus-within:outline-2 focus-within:outline-accent-primary';
  const selectedCard = 'border-accent-primary bg-accent-primary/10';
  const unselectedCard = 'border-border bg-bg-secondary hover:border-accent-primary/60';
  return <div role="dialog" aria-modal="true" aria-labelledby="session-details-title" className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-bg-primary/85 p-4 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget && !busy) close(); }}>
    <form onSubmit={save} className="max-h-[min(90dvh,800px)] w-full max-w-lg space-y-6 overflow-y-auto rounded-2xl border border-border bg-bg-primary p-5 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div><h2 id="session-details-title" className="text-2xl font-bold">{initial ? 'Editar sessão' : 'Como foi seu estudo?'}</h2><p className="mt-1 text-sm text-text-secondary">{initial ? 'Corrija a matéria ou as questões registradas.' : 'Sessão salva. Complete os detalhes para acompanhar seu progresso.'}</p></div>
        <button type="button" aria-label="Fechar" onClick={close} disabled={busy} className="rounded-lg px-2 text-2xl leading-none text-text-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent-primary">×</button>
      </div>

      <fieldset className="space-y-3"><legend className="mb-3 font-semibold">Matéria estudada</legend>
        <label className={`${optionCard} ${subjectId === null ? selectedCard : unselectedCard}`}>
          <input type="radio" name="subject" checked={subjectId === null} onChange={() => setSubjectId(null)} className="sr-only" />
          <span aria-hidden="true" className="size-5 shrink-0 rounded-full border border-white/20 bg-text-muted" />
          <span className="min-w-0 flex-1">Outros</span>
          {subjectId === null && <span aria-hidden="true" className="text-accent-primary">✓</span>}
        </label>
        {mySubjects.map(subject => {
          const color = subjectColor(subject.id, setup?.subjectColors || {});
          const selected = subjectId === subject.id;
          const previousSubject = initial?.subjectId === subject.id && !setup?.preferredSubjectIds.includes(subject.id);
          return <label key={subject.id} className={`${optionCard} ${selected ? selectedCard : unselectedCard}`}>
            <input type="radio" name="subject" checked={selected} onChange={() => setSubjectId(subject.id)} className="sr-only" />
            <span aria-hidden="true" className="size-5 shrink-0 rounded-full border border-white/20" style={{ backgroundColor: color }} />
            <span className="min-w-0 flex-1"><span className="block truncate">{subject.name}</span>{previousSubject && <span className="block text-xs text-text-secondary">Registrada nesta sessão</span>}</span>
            {selected && <span aria-hidden="true" className="text-accent-primary">✓</span>}
          </label>;
        })}
        {!mySubjects.length && <p className="text-sm text-text-secondary">Sua lista está vazia. Escolha matérias do grupo para vê-las aqui.</p>}
        {!initial && <Link to="/subjects" className="inline-block text-sm font-medium text-accent-primary underline underline-offset-2">Gerenciar minhas matérias</Link>}
      </fieldset>

      <fieldset className="space-y-3"><legend className="mb-3 font-semibold">Fez questões neste estudo?</legend>
        <div className="grid grid-cols-2 gap-3">
          {[{ value: true, label: 'Sim' }, { value: false, label: 'Não' }].map(option => <label key={option.label} className={`${optionCard} justify-center ${didQuestions === option.value ? selectedCard : unselectedCard}`}>
            <input type="radio" name="questions" checked={didQuestions === option.value} onChange={() => setDidQuestions(option.value)} className="sr-only" />
            <span>{option.label}</span>
            {didQuestions === option.value && <span aria-hidden="true" className="text-accent-primary">✓</span>}
          </label>)}
        </div>
      </fieldset>
      {didQuestions && <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Questões feitas<input aria-label="Questões feitas" required type="number" min="1" step="1" value={questionCount} onChange={e => setQuestionCount(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-bg-secondary p-3 focus-visible:outline-2 focus-visible:outline-accent-primary" /></label><label className="text-sm font-medium">Acertos<input aria-label="Acertos" required type="number" min="0" max={questionCount || undefined} step="1" value={correctCount} onChange={e => setCorrectCount(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-bg-secondary p-3 focus-visible:outline-2 focus-visible:outline-accent-primary" /></label></div>}
      {error && <p role="alert" className="rounded-xl border border-accent-danger/50 p-3 text-sm text-accent-danger">{error}</p>}
      <div className="space-y-3">
        <button type="submit" disabled={busy || didQuestions === null} className="w-full rounded-xl bg-accent-primary p-3 font-semibold text-white disabled:opacity-50">{busy ? 'Salvando...' : 'Salvar detalhes →'}</button>
        <button type="button" disabled={busy} onClick={close} className="w-full rounded-xl py-2 text-sm text-text-secondary underline underline-offset-2 hover:text-text-primary">{initial ? 'Cancelar' : 'Deixar em Outros por enquanto'}</button>
      </div>
    </form>
  </div>;
}
