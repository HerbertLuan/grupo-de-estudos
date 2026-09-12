import { Link } from 'react-router-dom';
import type { Season } from '../../types';

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
      <section aria-label="Carregando temporada ativa" className="relative overflow-hidden rounded-2xl border border-border bg-bg-secondary p-5 sm:p-6">
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
        <section className="relative overflow-hidden rounded-2xl border border-accent-primary/30 bg-gradient-to-br from-accent-primary/15 via-bg-secondary to-bg-secondary p-5 shadow-lg shadow-black/10 sm:p-6">
          <div aria-hidden="true" className="absolute -right-7 -top-9 text-8xl opacity-[0.07] sm:text-9xl">🚀</div>
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-primary-hover">Próxima temporada</span>
              <h2 className="mt-3 text-xl font-extrabold text-text-primary sm:text-2xl">{upcomingSeason.name}</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {formatBrazilianDate(upcomingSeason.startDate)} <span className="mx-1 text-text-muted">até</span> {formatBrazilianDate(upcomingSeason.endDate)}
              </p>
              <Link to="/seasons" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-primary-hover hover:text-text-primary">
                Ver detalhes <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="min-w-36 self-start rounded-2xl border border-accent-primary/25 bg-bg-primary/55 px-5 py-4 text-center sm:self-center">
              {daysUntilStart === 0 ? (
                <><div className="text-2xl font-black text-accent-primary-hover">Hoje</div><div className="mt-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">é a largada</div></>
              ) : (
                <><div className="text-4xl font-black leading-none text-accent-primary-hover">{daysUntilStart}</div><div className="mt-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">{daysUntilStart === 1 ? 'dia para iniciar' : 'dias para iniciar'}</div></>
              )}
            </div>
          </div>
        </section>
      );
    }
    return (
      <section className="rounded-2xl border border-dashed border-border bg-bg-secondary p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-3xl" aria-hidden="true">🏁</span>
            <h2 className="mt-2 text-xl font-bold text-text-primary">Nenhuma temporada ativa</h2>
            <p className="mt-1 max-w-lg text-sm text-text-secondary">Ainda não há um novo ciclo programado. Enquanto isso, seus pontos gerais continuam sendo registrados.</p>
          </div>
          <Link to="/seasons" className="shrink-0 rounded-xl border border-border bg-bg-tertiary px-4 py-2.5 text-center text-sm font-semibold text-text-primary transition-colors hover:border-accent-primary">
            Ver temporadas
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-accent-warning/30 bg-gradient-to-br from-accent-warning/15 via-bg-secondary to-accent-primary/10 p-5 shadow-lg shadow-black/10 sm:p-6">
      <div aria-hidden="true" className="absolute -right-7 -top-9 text-8xl opacity-[0.08] sm:text-9xl">🏆</div>
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent-success/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-success">
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-accent-success" />
            Temporada ativa
          </span>
          <span className="rounded-full border border-accent-warning/25 bg-bg-primary/40 px-3 py-1 text-xs font-semibold text-accent-warning">
            {remainingLabel(season.endDate, timezone)}
          </span>
        </div>
        <h2 className="mt-4 max-w-xl text-2xl font-extrabold leading-tight text-text-primary sm:text-3xl">{season.name}</h2>
        <p className="mt-2 text-sm font-medium text-text-secondary sm:text-base">
          {formatBrazilianDate(season.startDate)} <span className="mx-1 text-text-muted">até</span> {formatBrazilianDate(season.endDate)}
        </p>
        <Link to="/seasons" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent-primary-hover hover:text-text-primary">
          Histórico e detalhes <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
