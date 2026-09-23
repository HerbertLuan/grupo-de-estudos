import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuthContext } from '../../contexts/AuthContext';
import { db, functions } from '../../firebase/config';
import type { Season } from '../../types';
import { Badge, Button, Card, Icon } from '../ui/DesignSystem';

export function SeasonManagement() {
  const { profile } = useAuthContext();
  const groupId = profile?.groupId;
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [confirmClose, setConfirmClose] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    return onSnapshot(
      query(collection(db, 'seasons'), where('groupId', '==', groupId)),
      snapshot => {
        setSeasons(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Season))
          .sort((a, b) => b.startDate.localeCompare(a.startDate)));
        setLoading(false);
      },
      e => { setError(e.message); setLoading(false); },
    );
  }, [groupId]);

  async function run(action: string, payload: object) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await httpsCallable(functions, action)(payload);
      if (action === 'create_season') {
        setName('');
        setStartDate('');
        setEndDate('');
        setNotice('Temporada criada.');
      } else if (action === 'start_season') {
        setNotice('Temporada iniciada.');
      } else {
        setNotice('Temporada encerrada.');
      }
      setConfirmClose(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível concluir. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  function createSeason(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (groupId) void run('create_season', { groupId, name, startDate, endDate });
  }

  const active = seasons.some(season => season.active);
  const openSeasons = seasons.filter(season => season.status !== 'closed');
  const input = 'ej-input mt-2 block w-full';

  return <section className="space-y-5 border-t border-border pt-7" aria-labelledby="season-management-title">
    <div className="flex items-center gap-4"><span className="study-shortcut-icon"><Icon name="seasons" /></span><div><h2 id="season-management-title" className="text-xl font-semibold">O próximo capítulo</h2><p className="mt-1 text-sm text-text-secondary">Crie, inicie e encerre as temporadas do grupo.</p></div></div>
    {error && <p role="alert" className="rounded-xl border border-accent-danger/30 bg-accent-danger/5 p-4 text-sm text-accent-danger">{error}</p>}
    {notice && <p role="status" className="rounded-xl border border-accent-success/30 bg-accent-success/5 p-4 text-sm text-accent-success">{notice}</p>}
    <div className="admin-content-grid">
      <form className="ej-card space-y-5 self-start p-5 sm:p-6" onSubmit={createSeason}>
        <div><p className="ej-eyebrow">NOVO CICLO</p><h3 className="mt-2 text-lg font-semibold">Criar temporada</h3></div>
        <label className="block text-xs font-medium text-text-secondary">Nome da temporada<input className={input} required maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Maratona de Setembro" /></label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="min-w-0 text-xs font-medium text-text-secondary">Data de início<input className={input} required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
          <label className="min-w-0 text-xs font-medium text-text-secondary">Data de encerramento<input className={input} required type="date" min={startDate} value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
        </div>
        <p className="rounded-lg border border-border bg-bg-primary p-3 text-xs leading-relaxed text-text-muted">O administrador inicia a competição dentro das datas previstas. O último dia é incluído, no fuso do grupo; o encerramento automático ocorre em até 5 minutos após seu fim.</p>
        <Button type="submit" disabled={busy}>Criar temporada <Icon name="arrow" size={17} /></Button>
      </form>
      <Card className="space-y-5 self-start p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Temporadas abertas</h3><Badge tone="blue">{openSeasons.length}</Badge></div>
        {loading ? <p role="status" className="text-sm text-text-muted">Carregando temporadas...</p> : !openSeasons.length ? <div className="subject-empty"><Icon name="seasons" size={28} /><h4>Prontos para um novo ciclo.</h4><p>Nenhuma temporada em preparação ou andamento.</p></div> : null}
        {openSeasons.map(season => <article key={season.id} className="admin-season-item">
          <Badge tone={season.active ? 'yellow' : 'blue'}>{season.active ? 'Em andamento' : 'Preparada'}</Badge>
          <h4 className="mt-3 break-words text-lg font-semibold">{season.name}</h4>
          <p className="mt-2 text-xs text-text-muted">{season.startDate.split('-').reverse().join('/')} — {season.endDate.split('-').reverse().join('/')}</p>
          <div className="mt-5">{season.active ? confirmClose === season.id ? <div className="space-y-3 rounded-lg border border-accent-warning/30 bg-accent-warning/5 p-4">
            <p className="text-sm leading-relaxed">Encerrar agora e oficializar o pódio? Esta ação é definitiva.</p>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="danger" disabled={busy} onClick={() => void run('close_season', { seasonId: season.id })}>Confirmar encerramento</Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={() => setConfirmClose(null)}>Cancelar</Button>
            </div>
          </div> : <Button type="button" variant="secondary" disabled={busy} onClick={() => setConfirmClose(season.id)}>Encerrar temporada</Button>
            : <><Button type="button" disabled={busy || active} onClick={() => void run('start_season', { seasonId: season.id })}>Iniciar temporada <Icon name="arrow" size={16} /></Button>{active && <p className="mt-2 text-xs text-text-muted">Encerre a temporada atual antes de iniciar outra.</p>}</>}</div>
        </article>)}
        <Link to="/seasons" className="study-text-link">Histórico e pódios <Icon name="arrow" size={16} /></Link>
      </Card>
    </div>
  </section>;
}
