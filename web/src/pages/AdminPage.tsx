import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { SeasonManagement } from '../components/admin/SeasonManagement';
import { Badge, Button, Card, Icon, PageHeader } from '../components/ui/DesignSystem';
import './study-redesign.css';
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

  if (roleError) return <div className="ej-page"><Card className="p-6"><h1 className="text-xl font-bold">Acesso administrativo</h1><p role="alert" className="mt-3 text-sm text-accent-danger">Não foi possível verificar sua função no grupo: {roleError}</p><Link to="/" className="ej-button ej-button-secondary mt-5">Voltar ao estudo</Link></Card></div>;
  if (isAdmin === null) return <div className="ej-page"><Card className="p-6" role="status"><p className="text-sm text-text-secondary">Verificando seu acesso administrativo...</p><div className="ej-skeleton mt-5 h-36" /></Card></div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const input = 'ej-input w-full';
  const pending = setup?.requests.filter(request => request.status === 'pending') || [];

  return <div className="ej-page admin-workspace">
    <PageHeader eyebrow="CUIDANDO DA COMUNIDADE" title="Administração" description="Organize o conhecimento. Prepare a próxima conquista do grupo."
      actions={<Badge tone="purple"><Icon name="admin" size={14} />Administrador</Badge>} />
    {error && <p role="alert" className="rounded-xl border border-[var(--ej-danger-border)] bg-[var(--ej-danger-soft)] p-4 text-sm text-accent-danger">{error}</p>}
    {notice && <p role="status" className="flex items-center gap-2 rounded-xl border border-[var(--ej-success-border)] bg-[var(--ej-success-soft)] p-4 text-sm text-accent-success"><Icon name="check" size={18} />{notice}</p>}
    {!setup ? <Card className="p-6" role="status"><p className="text-sm text-text-secondary">Carregando o catálogo do grupo...</p><div className="ej-skeleton mt-5 h-36" /></Card> : <>
      <section aria-label="Visão geral do catálogo" className="admin-summary-grid">
        <Card className="admin-summary"><span className="study-shortcut-icon"><Icon name="subjects" /></span><div><strong>{setup.subjects.length}</strong><span>Matérias disponíveis</span></div></Card>
        <Card className="admin-summary"><span className="study-shortcut-icon"><Icon name="feed" /></span><div><strong>{pending.length}</strong><span>Sugestões pendentes</span></div>{pending.length > 0 && <Badge tone="yellow">Para revisar</Badge>}</Card>
      </section>
      <div className="admin-content-grid">
        <div className="space-y-5">
          <form className="ej-card space-y-4 p-5 sm:p-6" onSubmit={e => void submit(e)}>
            <div><p className="ej-eyebrow">CATÁLOGO DO GRUPO</p><h2 className="mt-2 text-lg font-semibold">Uma nova matéria</h2></div>
            <p className="text-sm leading-relaxed text-text-secondary">A matéria ficará disponível para todos os membros escolherem nas sessões de estudo.</p>
            <label className="block"><span className="mb-2 block text-xs font-medium text-text-secondary">Nome da matéria</span><input className={input} minLength={2} maxLength={80} required value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Matemática" /></label>
            <Button disabled={busy} type="submit">Cadastrar matéria <Icon name="arrow" size={17} /></Button>
          </form>
          <Card className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Sugestões da comunidade</h2><Badge tone={pending.length ? 'yellow' : 'neutral'}>{pending.length}</Badge></div>
            {!pending.length && <div className="subject-empty"><Icon name="check" size={28} /><h3>Tudo em dia por aqui.</h3><p>Novas sugestões de matérias aparecerão neste espaço para sua avaliação.</p></div>}
            {pending.map(request => <div key={request.id} className="space-y-4 rounded-xl border border-border bg-bg-primary p-4">
              <label className="block text-xs font-medium text-text-secondary">Nome proposto<input className={`${input} mt-2`} value={edits[request.id] ?? request.name} maxLength={80} onChange={e => setEdits(previous => ({ ...previous, [request.id]: e.target.value }))} /></label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" disabled={busy} onClick={() => void run(() => reviewSubject(request.id, 'approve', edits[request.id] ?? request.name), 'Matéria aprovada.')}><Icon name="check" size={16} />Aprovar</Button>
                <Button type="button" variant="secondary" disabled={busy} onClick={() => void run(() => reviewSubject(request.id, 'reject'), 'Sugestão rejeitada.')}>Rejeitar</Button>
              </div>
            </div>)}
          </Card>
        </div>
        <Card className="self-start p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Matérias do grupo</h2><Icon name="subjects" size={20} className="text-text-muted" /></div>
          {!setup.subjects.length && <div className="subject-empty"><h3>Um catálogo para construir.</h3><p>Cadastre a primeira matéria para começar.</p></div>}
          <div className="divide-y divide-border">{setup.subjects.map((subject, index) => <div key={subject.id} className="flex items-center gap-4 py-4"><span className="text-[10px] font-semibold tabular-nums text-text-muted">{String(index + 1).padStart(2, '0')}</span><span className="text-sm">{subject.name}</span></div>)}</div>
          <Link to="/subjects" className="study-text-link mt-5">Organizar minhas matérias <Icon name="arrow" size={16} /></Link>
        </Card>
      </div>
    </>}
    <SeasonManagement />
  </div>;
}
