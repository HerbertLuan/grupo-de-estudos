import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useAuthContext } from '../../contexts/AuthContext';
import { db, functions } from '../../firebase/config';
import type { Season } from '../../types';

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
  const card = 'bg-bg-secondary border border-border rounded-2xl p-5 space-y-3';
  const input = 'block w-full mt-1 p-3 rounded-xl border border-border bg-bg-primary text-text-primary';
  const button = 'px-4 py-3 bg-accent-primary text-white rounded-xl font-semibold disabled:opacity-50';

  return <section className="space-y-4" aria-labelledby="season-management-title">
    <div>
      <h2 id="season-management-title" className="font-bold text-xl">Gestão de temporadas</h2>
      <p className="text-sm text-text-secondary">Crie, inicie e encerre as temporadas do grupo.</p>
    </div>
    {error && <p role="alert" className="text-accent-danger">{error}</p>}
    {notice && <p role="status" className="text-accent-success">{notice}</p>}
    <form className={card} onSubmit={createSeason}>
      <h3 className="font-bold text-lg">Criar temporada</h3>
      <label className="block">Nome<input className={input} required maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Maratona de Inverno" /></label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label>Início<input className={input} required type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
        <label>Fim<input className={input} required type="date" min={startDate} value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
      </div>
      <p className="text-sm text-text-secondary">O administrador inicia a competição dentro das datas previstas. O último dia é incluído, no fuso do grupo; o encerramento automático ocorre em até 5 minutos após seu fim.</p>
      <button className={button} disabled={busy}>Criar temporada</button>
    </form>
    <div className={card}>
      <h3 className="font-bold text-lg">Temporadas em preparação ou andamento</h3>
      {loading ? <p role="status">Carregando temporadas...</p> : !openSeasons.length ? <p className="text-text-secondary">Nenhuma temporada em preparação ou andamento.</p> : null}
      {openSeasons.map(season => <article key={season.id} className="p-3 rounded-xl bg-bg-tertiary space-y-2">
        <div className="flex justify-between gap-3">
          <h4 className="font-bold break-words">{season.name}</h4>
          <span>{season.active ? 'Em andamento' : 'Preparada'}</span>
        </div>
        <p className="text-sm text-text-secondary">{season.startDate.split('-').reverse().join('/')} — {season.endDate.split('-').reverse().join('/')}</p>
        {season.active ? confirmClose === season.id ? <div className="space-y-3">
          <p>Encerrar agora e oficializar o pódio? Esta ação é definitiva.</p>
          <div className="flex gap-3 flex-wrap">
            <button type="button" className={button} disabled={busy} onClick={() => void run('close_season', { seasonId: season.id })}>Confirmar encerramento</button>
            <button type="button" disabled={busy} onClick={() => setConfirmClose(null)}>Cancelar</button>
          </div>
        </div> : <button type="button" className={button} disabled={busy} onClick={() => setConfirmClose(season.id)}>Encerrar temporada</button>
          : <button type="button" className={button} disabled={busy || active} onClick={() => void run('start_season', { seasonId: season.id })}>Iniciar temporada</button>}
      </article>)}
      <Link to="/seasons" className="inline-block text-sm text-accent-primary underline">Ver histórico e pódios</Link>
    </div>
  </section>;
}
