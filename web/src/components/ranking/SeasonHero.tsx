import { Link } from 'react-router-dom';
import type { Season } from '../../types';
import { Badge, Icon } from '../ui/DesignSystem';

interface SeasonHeroProps {
  season: Season | null;
  upcomingSeason: Season | null;
  loading: boolean;
  timezone?: string;
}

function formatBrazilianDate(value: string): string {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}

function todayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function calendarDistance(targetDate: string, timezone: string): number {
  const today = todayInTimezone(timezone);
  const toUtc = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.ceil((toUtc(targetDate) - toUtc(today)) / 86_400_000);
}

function remainingLabel(endDate: string, timezone: string): string {
  const days = calendarDistance(endDate, timezone);
  if (days < 0) return 'Encerramento em processamento';
  if (days === 0) return 'Último dia';
  if (days === 1) return '1 dia restante';
  return `${days} dias restantes`;
}

export function SeasonHero({ season, upcomingSeason, loading, timezone = 'America/Sao_Paulo' }: SeasonHeroProps) {
  if (loading) {
    return (
      <section aria-label="Carregando temporada ativa" aria-busy="true" className="season-hero season-hero--loading">
        <div className="h-4 w-28 animate-pulse rounded bg-bg-tertiary" />
        <div className="mt-4 h-7 w-3/4 animate-pulse rounded bg-bg-tertiary" />
        <div className="mt-3 h-4 w-52 animate-pulse rounded bg-bg-tertiary" />
      </section>
    );
  }

  if (!season) {
    if (upcomingSeason) {
      const daysUntilStart = Math.max(0, calendarDistance(upcomingSeason.startDate, timezone));
      return (
        <section className="season-hero season-hero--upcoming">
          <div className="season-hero__content">
            <Badge tone="blue">Próxima temporada</Badge>
            <h2>{upcomingSeason.name}</h2>
            <p>Um novo ciclo para transformar dedicação em conquista.</p>
            <span className="season-hero__dates">{formatBrazilianDate(upcomingSeason.startDate)} <span>até</span> {formatBrazilianDate(upcomingSeason.endDate)}</span>
            <Link to="/seasons" className="season-hero__link">Conhecer a temporada <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="season-hero__countdown">
            <Icon name="seasons" size={23} />
            <strong>{daysUntilStart === 0 ? 'Hoje' : daysUntilStart}</strong>
            <span>{daysUntilStart === 0 ? 'é a largada' : daysUntilStart === 1 ? 'dia para iniciar' : 'dias para iniciar'}</span>
          </div>
        </section>
      );
    }
    return (
      <section className="season-hero season-hero--empty">
        <div className="season-hero__content">
          <span className="ranking-eyebrow">Entre um ciclo e outro</span>
          <h2>A próxima conquista começa agora.</h2>
          <p>Nenhuma temporada ativa no momento. Continue estudando: seus pontos gerais continuam sendo registrados.</p>
          <Link to="/seasons" className="season-hero__link">Explorar temporadas <Icon name="arrow" size={16} /></Link>
        </div>
        <span className="season-hero__emblem" aria-hidden="true"><Icon name="seasons" size={48} /></span>
      </section>
    );
  }

  const startDistance = calendarDistance(season.startDate, timezone);
  const endDistance = calendarDistance(season.endDate, timezone);
  const duration = endDistance - startDistance + 1;
  const progress = duration > 0 ? Math.max(0, Math.min(100, Math.round((1 - startDistance) / duration * 100))) : 0;

  return (
    <section className="season-hero season-hero--active">
      <div className="season-hero__content">
        <div className="season-hero__badges"><Badge tone="yellow">Temporada ativa</Badge><span>{remainingLabel(season.endDate, timezone)}</span></div>
        <h2>{season.name}</h2>
        <p>Seu esforço de hoje. A conquista de todo um ciclo.</p>
        <span className="season-hero__dates">{formatBrazilianDate(season.startDate)} <span>até</span> {formatBrazilianDate(season.endDate)}</span>
        <Link to="/seasons" className="season-hero__link">Histórico e detalhes <Icon name="arrow" size={16} /></Link>
      </div>
      <div className="season-hero__progress">
        <span className="season-hero__emblem" aria-hidden="true"><Icon name="ranking" size={40} /></span>
        <div className="season-hero__progress-label"><span>Período decorrido</span><strong>{progress}%</strong></div>
        <div className="season-hero__track" role="progressbar" aria-label="Período decorrido da temporada" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div>
        <span className="season-hero__progress-note">Finalize suas sessões antes do encerramento.</span>
      </div>
    </section>
  );
}
