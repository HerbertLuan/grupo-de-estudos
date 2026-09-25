import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { motion, useReducedMotion } from 'framer-motion';
import { db } from '../firebase/config';
import { useAuthContext } from '../contexts/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Badge, Button, Card, Icon, PageHeader } from '../components/ui/DesignSystem';
import { useDialogA11y } from '../components/ui/Dialog';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingState } from '../components/ui/LoadingState';
import type { Season } from '../types';
import './ranking-redesign.css';

function SeasonCard({ season, onCelebrate }: { season: Season; onCelebrate: (id: string) => void }) {
  const closed = season.status === 'closed';
  return (
    <article className={`season-card ${closed ? 'season-card--closed' : season.active ? 'season-card--active' : ''}`}>
      <div className="season-card__top"><span className="season-card__symbol" aria-hidden="true"><Icon name={closed ? 'ranking' : 'seasons'} size={22} /></span><Badge tone={closed ? 'neutral' : season.active ? 'yellow' : 'blue'}>{closed ? 'Encerrada' : season.active ? 'Em andamento' : 'Preparada'}</Badge></div>
      <span className="ranking-eyebrow">{closed ? 'Uma conquista registrada' : season.active ? 'Seu ciclo atual' : 'Um novo começo'}</span>
      <h3>{season.name}</h3>
      <p className="season-card__dates"><Icon name="seasons" size={15} /><time dateTime={season.startDate}>{season.startDate.split('-').reverse().join('/')}</time><span aria-hidden="true">—</span><time dateTime={season.endDate}>{season.endDate.split('-').reverse().join('/')}</time></p>
      {closed ? (
        <div className="season-card__results">
          <h4>Pódio oficial</h4>
          {season.podium?.length ? (
            <ol className="season-winners">
              {season.podium.map(winner => (
                <li key={winner.uid}>
                  <span className="season-winners__rank" data-rank={winner.rank}>{winner.rank}º</span>
                  <Avatar src={winner.avatarUrl} name={winner.name || winner.nickname} size="sm" />
                  <span className="season-winners__identity"><strong>@{winner.nickname}</strong><span>{(winner.studySeconds / 3600).toFixed(1)}h estudadas</span></span>
                  <span className="season-winners__points">{winner.points.toLocaleString('pt-BR')}<small>pontos</small></span>
                </li>
              ))}
            </ol>
          ) : <p className="season-card__empty">Este ciclo foi encerrado sem participantes com estudo registrado.</p>}
          {!!season.podium?.length && <Button variant="secondary" onClick={() => onCelebrate(season.id)}><Icon name="ranking" size={17} />Celebrar campeões</Button>}
        </div>
      ) : (
        <div className="season-card__footer">
          <p>{season.active ? 'Cada sessão concluída é um passo à frente.' : 'Prepare sua rotina para o próximo ciclo.'}</p>
          {season.active && <Link to="/ranking">Acompanhar ranking<Icon name="arrow" size={17} /></Link>}
        </div>
      )}
    </article>
  );
}

export function SeasonsPage() {
  const { profile } = useAuthContext();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const celebrationRef = useRef<HTMLDivElement>(null);
  const closeCelebration = useCallback(() => setCelebrate(null), []);
  useDialogA11y(celebrationRef, !!celebrate, closeCelebration);

  useEffect(() => {
    if (!profile?.groupId) return;
    const unsubscribe = onSnapshot(query(collection(db, 'seasons'), where('groupId', '==', profile.groupId)), snap => {
      setSeasons(snap.docs.map(d => ({ ...d.data(), id: d.id } as Season)).sort((a, b) => b.startDate.localeCompare(a.startDate)));
      setLoading(false);
    }, e => { setError(e.message); setLoading(false); });
    return unsubscribe;
  }, [profile?.groupId]);

  const openSeasons = seasons.filter(season => season.status !== 'closed');
  const closedSeasons = seasons.filter(season => season.status === 'closed');
  const celebratedSeason = seasons.find(season => season.id === celebrate);

  return (
    <div className="ej-page seasons-page">
      <PageHeader
        eyebrow="Disciplina se constrói em ciclos"
        title="Temporadas"
        description="Novos desafios. Conquistas que ficam. Seu histórico geral acompanha cada etapa."
        actions={<Link to="/ranking" className="ranking-history-link"><Icon name="ranking" size={18} />Ver ranking<Icon name="arrow" size={16} /></Link>}
      />

      <div className="season-rules"><span className="season-rules__icon" aria-hidden="true"><Icon name="check" size={19} /></span><div><strong>Comece. Mantenha o ritmo. Conclua.</strong><p>Contam as sessões iniciadas e finalizadas durante a temporada ativa. Finalize seu cronômetro antes do encerramento.</p></div></div>

      {error && <ErrorState message={error} />}
      {loading ? <Card><LoadingState message="Carregando seus ciclos de evolução..." /></Card> : !seasons.length && !error ? (
        <Card><EmptyState icon="🏆" title="Seu próximo ciclo está por vir" description="Ainda não há temporadas neste grupo. Continue estudando e acompanhe suas conquistas no ranking geral." /><Link to="/ranking" className="seasons-empty-link">Ir para o ranking<Icon name="arrow" size={16} /></Link></Card>
      ) : null}

      {!loading && seasons.length > 0 && (
        <>
          <section aria-labelledby="seasons-open-title">
            <div className="ranking-section-heading"><div><span className="ranking-eyebrow">Olhe para a frente</span><h2 id="seasons-open-title">Próximas e em andamento</h2></div><Badge tone="blue">{openSeasons.length} {openSeasons.length === 1 ? 'ciclo' : 'ciclos'}</Badge></div>
            {openSeasons.length ? <div className="season-grid">{openSeasons.map(season => <SeasonCard key={season.id} season={season} onCelebrate={setCelebrate} />)}</div> : <Card className="seasons-section-empty"><Icon name="seasons" size={24} /><div><strong>Um intervalo entre conquistas</strong><p>A próxima temporada aparecerá aqui quando for preparada.</p></div></Card>}
          </section>
          <section aria-labelledby="seasons-history-title">
            <div className="ranking-section-heading"><div><span className="ranking-eyebrow">Dedicação que fez história</span><h2 id="seasons-history-title">Histórico de campeões</h2></div><Badge tone="neutral">{closedSeasons.length} {closedSeasons.length === 1 ? 'temporada' : 'temporadas'}</Badge></div>
            {closedSeasons.length ? <div className="season-grid">{closedSeasons.map(season => <SeasonCard key={season.id} season={season} onCelebrate={setCelebrate} />)}</div> : <Card className="seasons-section-empty"><Icon name="ranking" size={24} /><div><strong>A história está sendo escrita</strong><p>Os resultados oficiais aparecem após o encerramento de cada temporada.</p></div></Card>}
          </section>
          <p className="ranking-footnote">Critérios de desempate: tempo estudado, entrada no grupo e identificador do membro.</p>
        </>
      )}

      {celebrate && (
        <div className="season-celebration" onClick={event => { if (event.target === event.currentTarget) closeCelebration(); }}>
          {!reducedMotion && Array.from({ length: 18 }, (_, index) => <motion.span aria-hidden key={index} className="season-celebration__confetti" style={{ left: `${(index * 37) % 100}%`, background: ['var(--color-accent-primary)', 'var(--ej-purple)', 'var(--color-brand-yellow)'][index % 3] }} animate={{ y: ['0vh', '95vh'], rotate: [0, 180], opacity: [1, 1, 0] }} transition={{ duration: 2 + index % 3, delay: (index % 5) / 10 }} />)}
          <div ref={celebrationRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="celebration-title" aria-describedby="celebration-season" className="season-celebration__dialog">
            <button type="button" aria-label="Fechar celebração" className="season-celebration__close" onClick={closeCelebration}><Icon name="close" size={20} /></button>
            <div className="season-celebration__trophy"><Icon name="ranking" size={36} /></div>
            <span className="ranking-eyebrow">Disciplina hoje. Conquistas amanhã.</span>
            <h2 id="celebration-title">O esforço merece aplausos.</h2>
            <p id="celebration-season">Campeões de {celebratedSeason?.name}</p>
            <ol className="season-winners season-winners--celebration">{celebratedSeason?.podium?.map(winner => <li key={winner.uid}><span className="season-winners__rank" data-rank={winner.rank}>{winner.rank}º</span><Avatar src={winner.avatarUrl} name={winner.name || winner.nickname} size="md" /><span className="season-winners__identity"><strong>@{winner.nickname}</strong><span>{winner.points.toLocaleString('pt-BR')} pontos · {(winner.studySeconds / 3600).toFixed(1)}h estudadas</span></span></li>)}</ol>
            <Button onClick={closeCelebration}>Continuar evoluindo<Icon name="arrow" size={17} /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
