import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { getSubjectSetup, requestSubject, setPreferredSubjects, setSubjectColor, type SubjectSetup } from '../services/subjectService';
import { subjectColor } from '../utils/subjectColor';

export function SubjectsPage() {
  const [setup, setSetup] = useState<SubjectSetup | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => { setSetup(await getSubjectSetup()); }, []);
  useEffect(() => { void load().catch(e => setError(e instanceof Error ? e.message : 'Erro ao carregar matérias.')); }, [load]);

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); await load(); setNotice(message); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir.'); }
    finally { setBusy(false); }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !setup) return;
    void run(() => requestSubject(name), 'Sugestão enviada ao administrador.');
  }

  async function toggle(id: string) {
    if (!setup) return;
    const ids = setup.preferredSubjectIds.includes(id) ? setup.preferredSubjectIds.filter(item => item !== id) : [...setup.preferredSubjectIds, id];
    await run(() => setPreferredSubjects(ids), 'Sua lista foi atualizada.');
  }

  async function changeColor(id: string, color: string) {
    await run(() => setSubjectColor(id, color), 'Cor da matéria atualizada.');
  }

  const card = 'bg-bg-secondary border border-border rounded-2xl p-5 space-y-3';
  const input = 'w-full p-3 bg-bg-primary border border-border rounded-xl text-text-primary';
  const button = 'px-4 py-3 bg-accent-primary text-white rounded-xl font-semibold disabled:opacity-50';
  return <div className="p-4 pb-28 max-w-2xl mx-auto w-full space-y-5">
    <Link to="/" className="text-accent-primary">← Estudar</Link>
    <div><h1 className="text-2xl font-bold">Minhas matérias</h1><p className="text-text-secondary mt-1">Escolha quais matérias aparecem ao concluir suas sessões e defina uma cor pessoal para cada uma.</p></div>
    {error && <p role="alert" className="text-accent-danger">{error}</p>}{notice && <p role="status" className="text-accent-success">{notice}</p>}
    {!setup ? <p>Carregando matérias...</p> : <>
      <section className={card}><h2 className="font-bold text-lg">Catálogo do grupo</h2>
        {!setup.subjects.length && <p className="text-text-secondary">Ainda não há matérias aprovadas.</p>}
        {setup.subjects.map(subject => {
          const color = subjectColor(subject.id, setup.subjectColors);
          return <div key={subject.id} className="flex gap-3 items-center p-3 rounded-xl border" style={{ backgroundColor: `${color}22`, borderColor: `${color}88` }}>
            <label className="flex gap-3 items-center flex-1 min-w-0"><input type="checkbox" checked={setup.preferredSubjectIds.includes(subject.id)} disabled={busy} onChange={() => void toggle(subject.id)} /><span className="truncate">{subject.name}</span></label>
            <input type="color" aria-label={`Cor de ${subject.name}`} title={`Escolher cor de ${subject.name}`} value={color} disabled={busy} onChange={e => void changeColor(subject.id, e.target.value)} className="w-10 h-9 p-0 border-0 bg-transparent cursor-pointer disabled:opacity-50" />
          </div>;
        })}
      </section>
      {setup.isAdmin ? <p className="text-sm text-text-secondary">Para cadastrar matérias e avaliar sugestões, acesse a <Link to="/admin" className="text-accent-primary underline">aba Admin</Link>.</p> : <form className={card} onSubmit={submit}><h2 className="font-bold text-lg">Sugerir matéria</h2><p className="text-sm text-text-secondary">O administrador pode aprovar, ajustar o nome ou rejeitar a sugestão.</p><input aria-label="Nome da matéria" className={input} minLength={2} maxLength={80} required value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Matemática" /><button className={button} disabled={busy}>Enviar sugestão</button></form>}
      {!setup.isAdmin && setup.requests.some(r => r.status === 'pending') && <section className={card}><h2 className="font-bold">Minhas sugestões pendentes</h2>{setup.requests.filter(r => r.status === 'pending').map(r => <p key={r.id}>{r.name}</p>)}</section>}
    </>}
  </div>;
}
