import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { SeasonManagement } from '../components/admin/SeasonManagement';
import { useGroupAdmin } from '../hooks/useGroupAdmin';
import { createSubject, getSubjectSetup, reviewSubject, type SubjectSetup } from '../services/subjectService';

export function AdminPage() {
  const { isAdmin, error: roleError } = useGroupAdmin();
  const [setup, setSetup] = useState<SubjectSetup | null>(null);
  const [name, setName] = useState('');
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => setSetup(await getSubjectSetup()), []);
  useEffect(() => {
    if (isAdmin) void load().catch(e => setError(e instanceof Error ? e.message : 'Erro ao carregar matérias.'));
  }, [isAdmin, load]);

  async function run(action: () => Promise<unknown>, message: string): Promise<boolean> {
    setBusy(true); setError(''); setNotice('');
    try { await action(); await load(); setNotice(message); return true; }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir.'); return false; }
    finally { setBusy(false); }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (await run(() => createSubject(name), 'Matéria criada para o grupo.')) setName('');
  }

  if (roleError) return <p role="alert" className="p-5 text-accent-danger">Não foi possível verificar sua função no grupo: {roleError}</p>;
  if (isAdmin === null) return <p className="p-5" role="status">Verificando acesso administrativo...</p>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const card = 'bg-bg-secondary border border-border rounded-2xl p-5 space-y-3';
  const input = 'w-full p-3 bg-bg-primary border border-border rounded-xl text-text-primary';
  const button = 'px-4 py-3 bg-accent-primary text-white rounded-xl font-semibold disabled:opacity-50';
  const pending = setup?.requests.filter(request => request.status === 'pending') || [];

  return <div className="p-4 pb-28 max-w-2xl mx-auto w-full space-y-5">
    <h1 className="text-2xl font-bold">Administração</h1>
    <p className="text-text-secondary">Gerencie as matérias e temporadas do grupo.</p>
    {error && <p role="alert" className="text-accent-danger">{error}</p>}
    {notice && <p role="status" className="text-accent-success">{notice}</p>}
    {!setup ? <p>Carregando matérias...</p> : <>
      <form className={card} onSubmit={e => void submit(e)}>
        <h2 className="font-bold text-lg">Cadastrar matéria</h2>
        <p className="text-sm text-text-secondary">A matéria ficará disponível para todos os membros do grupo.</p>
        <input aria-label="Nome da matéria" className={input} minLength={2} maxLength={80} required value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Matemática" />
        <button className={button} disabled={busy}>Cadastrar matéria</button>
      </form>
      <section className={card}>
        <h2 className="font-bold text-lg">Sugestões pendentes</h2>
        {!pending.length && <p className="text-text-secondary">Nenhuma sugestão pendente.</p>}
        {pending.map(request => <div key={request.id} className="p-3 bg-bg-tertiary rounded-xl space-y-2">
          <label className="block text-sm">Nome proposto
            <input className={`${input} mt-1`} value={edits[request.id] ?? request.name} maxLength={80} onChange={e => setEdits(previous => ({ ...previous, [request.id]: e.target.value }))} />
          </label>
          <div className="flex gap-2">
            <button type="button" disabled={busy} className={button} onClick={() => void run(() => reviewSubject(request.id, 'approve', edits[request.id] ?? request.name), 'Matéria aprovada.')}>Aprovar</button>
            <button type="button" disabled={busy} className="px-4 py-3 border border-border rounded-xl" onClick={() => void run(() => reviewSubject(request.id, 'reject'), 'Sugestão rejeitada.')}>Rejeitar</button>
          </div>
        </div>)}
      </section>
      <section className={card}>
        <h2 className="font-bold text-lg">Matérias do grupo</h2>
        {!setup.subjects.length && <p className="text-text-secondary">Ainda não há matérias cadastradas.</p>}
        {setup.subjects.map(subject => <p key={subject.id} className="p-3 bg-bg-tertiary rounded-xl">{subject.name}</p>)}
        <Link to="/subjects" className="inline-block text-sm text-accent-primary underline">Organizar minhas matérias</Link>
      </section>
    </>}
    <SeasonManagement />
  </div>;
}
