import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { motion, useReducedMotion } from 'framer-motion';
import { db, functions } from '../firebase/config';
import { useAuthContext } from '../contexts/AuthContext';
import type { Season } from '../types';

export function SeasonsPage() {
  const { profile, user } = useAuthContext();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isAdmin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [startDate, setStart] = useState('');
  const [endDate, setEnd] = useState('');
  const [confirmClose, setConfirmClose] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!profile?.groupId || !user) return;
    const unsubscribe = onSnapshot(query(collection(db, 'seasons'), where('groupId', '==', profile.groupId)), snap => {
      setSeasons(snap.docs.map(d => ({ ...d.data(), id: d.id } as Season)).sort((a, b) => b.startDate.localeCompare(a.startDate)));
      setLoading(false);
    }, e => { setError(e.message); setLoading(false); });
    const member = onSnapshot(doc(db, 'groups', profile.groupId, 'members', user.uid), snap => setAdmin(snap.data()?.role === 'admin'), e => setError(e.message));
    return () => { unsubscribe(); member(); };
  }, [profile?.groupId, user]);

  async function run(action: string, payload: object) {
    setBusy(true); setError('');
    try {
      await httpsCallable(functions, action)(payload);
      if (action === 'create_season') { setName(''); setStart(''); setEnd(''); }
      setConfirmClose(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir. Tente novamente.'); }
    finally { setBusy(false); }
  }
  const active = seasons.some(s => s.active);
  const card = 'p-5 rounded-2xl border border-border bg-bg-secondary space-y-3';
  const button = 'px-4 py-2 rounded-xl bg-accent-primary text-white disabled:opacity-50';
  const input = 'block w-full mt-1 p-3 rounded-xl border border-border bg-bg-primary text-text-primary';
  return <div className="p-4 pb-28 max-w-2xl mx-auto w-full space-y-5">
    <Link to="/ranking" className="text-accent-primary">← Ranking</Link>
    <h1 className="text-2xl font-bold">Temporadas 🏆</h1>
    <p className="text-text-secondary">Novos ciclos, novas conquistas. Seu histórico geral permanece com você.</p>
    {error && <p role="alert" className="text-red-400">{error}</p>}
    {isAdmin && <form className={card} onSubmit={e => { e.preventDefault(); void run('create_season', { groupId: profile?.groupId, name, startDate, endDate }); }}>
      <h2 className="font-bold text-lg">Criar temporada</h2>
      <label className="block">Nome<input className={input} required maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Maratona de Inverno" /></label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label>Início<input className={input} required type="date" value={startDate} onChange={e => setStart(e.target.value)} /></label>
        <label>Fim<input className={input} required type="date" min={startDate} value={endDate} onChange={e => setEnd(e.target.value)} /></label>
      </div>
      <p className="text-sm text-text-secondary">O administrador inicia a competição dentro das datas previstas. O último dia é incluído, no fuso do grupo; o encerramento automático ocorre em até 5 minutos após seu fim.</p>
      <button className={button} disabled={busy}>Criar temporada</button>
    </form>}
    <p className="text-sm text-text-secondary">Contam sessões iniciadas e finalizadas durante a temporada ativa. Finalize seu cronômetro antes do encerramento. Desempate: tempo estudado, entrada no grupo e identificador do membro.</p>
    {loading ? <p role="status">Carregando temporadas...</p> : !seasons.length ? <p>Ainda não há temporadas neste grupo.</p> : null}
    {['open', 'closed'].map(section => <section key={section} className="space-y-4">
      <h2 className="font-bold text-lg">{section === 'open' ? 'Próximas e em andamento' : 'Histórico de campeões'}</h2>
      {seasons.filter(s => section === 'closed' ? s.status === 'closed' : s.status !== 'closed').map(s => <article key={s.id} className={card}>
        <div className="flex justify-between gap-3"><h3 className="font-bold break-words">{s.name}</h3><span>{s.status === 'closed' ? 'Encerrada' : s.active ? 'Em andamento' : 'Preparada'}</span></div>
        <p className="text-sm text-text-secondary">{s.startDate.split('-').reverse().join('/')} — {s.endDate.split('-').reverse().join('/')}</p>
        {isAdmin && s.status !== 'closed' && (s.active ? <>
          {confirmClose === s.id ? <div className="space-y-3"><p>Encerrar agora e oficializar o pódio? Esta ação é definitiva.</p><button className={button} disabled={busy} onClick={() => void run('close_season', { seasonId: s.id })}>Confirmar encerramento</button> <button disabled={busy} onClick={() => setConfirmClose(null)}>Cancelar</button></div> : <button className={button} disabled={busy} onClick={() => setConfirmClose(s.id)}>Encerrar temporada</button>}
        </> : <button className={button} disabled={busy || active} onClick={() => void run('start_season', { seasonId: s.id })}>Iniciar temporada</button>)}
        {s.status === 'closed' && <>
          <h4 className="font-bold">Pódio oficial</h4>
          {s.podium?.length ? <ol className="space-y-2">{s.podium.map(w => <li key={w.uid} className="p-3 rounded-xl bg-bg-primary">{['🥇', '🥈', '🥉'][w.rank - 1]} {w.rank}º · {w.nickname} <span className="text-text-secondary">— {w.points} pontos · {(w.studySeconds / 3600).toFixed(1)}h</span></li>)}</ol> : <p>Sem participantes com estudo registrado.</p>}
          {!!s.podium?.length && <button className={button} onClick={() => setCelebrate(s.id)}>🎉 Celebrar campeões</button>}
        </>}
      </article>)}
    </section>)}
    {celebrate && <div role="dialog" aria-modal="true" aria-label="Celebração dos campeões" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onKeyDown={e => { if (e.key === 'Escape') setCelebrate(null); }}>
      {!reducedMotion && Array.from({ length: 30 }, (_, i) => <motion.span aria-hidden key={i} className="absolute top-0 w-2 h-3 pointer-events-none" style={{ left: `${(i * 37) % 100}%`, background: ['#6366f1', '#22c55e', '#f59e0b'][i % 3] }} animate={{ y: ['0vh', '95vh'], rotate: [0, 360], opacity: [1, 1, 0] }} transition={{ duration: 2 + i % 3, delay: (i % 5) / 10 }} />)}
      <div className={`${card} relative text-center max-w-md`}><h2 className="text-2xl font-bold">🏆 Parabéns aos campeões!</h2><p>{seasons.find(s => s.id === celebrate)?.name}</p>{seasons.find(s => s.id === celebrate)?.podium?.map(w => <p key={w.uid}>{['🥇', '🥈', '🥉'][w.rank - 1]} {w.nickname}</p>)}<button autoFocus className={button} onClick={() => setCelebrate(null)}>Continuar</button></div>
    </div>}
  </div>;
}
