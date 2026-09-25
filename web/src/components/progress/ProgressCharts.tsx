import { useEffect, useMemo, useState } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getSubjectChartData, type SubjectChartData } from '../../services/subjectService';
import { subjectColor } from '../../utils/subjectColor';
import { formatDuration } from '../../utils/formatTime';
import { CommunityDialog } from '../feed/CommunityDialog';
import { Icon } from '../ui/DesignSystem';
import './progress.css';

type Kind = 'hours' | 'questions';
type Period = '7' | '30' | '90' | 'all' | 'custom';
type Grouping = 'day' | 'week' | 'month';
type Point = Record<string, string | number> & { label: string; range: string; correct: number; errors: number };

const dateLabel = (date: string) => format(parseISO(date), 'dd/MM');
const chartBox = 'progress-chart-card bg-bg-secondary border border-border rounded-xl';

export function ProgressCharts({ uid, subjectId: controlledSubjectId, onSubjectChange, showSubjectFilter = true }: {
  uid?: string;
  subjectId?: string;
  onSubjectChange?: (id: string) => void;
  showSubjectFilter?: boolean;
}) {
  const [data, setData] = useState<SubjectChartData | null>(null);
  const [error, setError] = useState('');
  const [localSubjectId, setLocalSubjectId] = useState('all');
  const [modal, setModal] = useState<Kind | null>(null);
  const [period, setPeriod] = useState<Period>('7');
  const [grouping, setGrouping] = useState<Grouping>('day');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const subjectId = controlledSubjectId ?? localSubjectId;

  useEffect(() => {
    let active = true;
    setData(null);
    getSubjectChartData(uid).then(result => { if (active) { setData(result); setError(''); } })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Não foi possível carregar os gráficos.'); });
    return () => { active = false; };
  }, [uid]);

  useEffect(() => {
    if (!modal) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setModal(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  const today = data?.today || format(new Date(), 'yyyy-MM-dd');
  const earliest = data?.days[0]?.date || today;
  const selectedStart = period === 'all' ? earliest : period === 'custom' ? start : format(subDays(parseISO(today), Number(period) - 1), 'yyyy-MM-dd');
  const selectedEnd = period === 'custom' ? end : today;
  const validRange = Boolean(selectedStart && selectedEnd && selectedStart <= selectedEnd);
  const rangeDays = validRange ? differenceInCalendarDays(parseISO(selectedEnd), parseISO(selectedStart)) + 1 : 0;
  const allowGrouping = rangeDays > 30;
  const effectiveGrouping = allowGrouping ? grouping : 'day';

  const colors = useMemo(() => Object.fromEntries((data?.subjects || []).map(s => [s.id, s.color || subjectColor(s.id, {})])), [data]);
  const names = useMemo(() => new Map((data?.subjects || []).map(s => [s.id, s.name])), [data]);

  function changePeriod(next: Period) {
    setPeriod(next);
    if (next === '90') setGrouping('week');
    else if (next === 'all') setGrouping('month');
    else if (next === 'custom') { setStart(format(subDays(parseISO(today), 6), 'yyyy-MM-dd')); setEnd(today); setGrouping('day'); }
    else setGrouping('day');
  }

  function open(kind: Kind) { setModal(kind); changePeriod('7'); }

  function makeSeries(from: string, to: string, group: Grouping) {
    if (!data || !from || !to || from > to) return { points: [] as Point[], categories: [] as { id: string; name: string; color: string; key: string }[] };
    const rows = data.days.filter(row => row.date >= from && row.date <= to && (subjectId === 'all' || (subjectId === 'others' ? !row.subjectId : row.subjectId === subjectId)));
    const ids = subjectId === 'all' ? [...new Set(rows.map(row => row.subjectId || 'others'))] : [subjectId];
    const categories = ids.sort((a, b) => (names.get(a) || a).localeCompare(names.get(b) || b, 'pt-BR'))
      .map((id, index) => ({ id, name: id === 'others' ? 'Outros' : names.get(id) || id, color: id === 'others' ? subjectColor(null, {}) : colors[id] || subjectColor(id, {}), key: `h${index}` }));
    const buckets = new Map<string, Point>();
    const bucket = (date: string) => group === 'week' ? format(startOfWeek(parseISO(date), { weekStartsOn: 1 }), 'yyyy-MM-dd') : group === 'month' ? date.slice(0, 7) : date;
    for (let day = parseISO(from); day <= parseISO(to); day = addDays(day, 1)) {
      const key = bucket(format(day, 'yyyy-MM-dd'));
      if (!buckets.has(key)) buckets.set(key, { label: group === 'month' ? format(day, 'MMM/yy', { locale: ptBR }) : dateLabel(key), range: key, correct: 0, errors: 0 });
    }
    for (const row of rows) {
      const point = buckets.get(bucket(row.date));
      if (!point) continue;
      const category = categories.find(item => item.id === (row.subjectId || 'others'));
      if (category) point[category.key] = (Number(point[category.key]) || 0) + row.seconds;
      point.correct += row.correct;
      point.errors += Math.max(0, row.questions - row.correct);
    }
    return { points: [...buckets.values()], categories };
  }

  const compactFrom = format(subDays(parseISO(today), 6), 'yyyy-MM-dd');
  const compact = makeSeries(compactFrom, today, 'day');
  const detailed = validRange ? makeSeries(selectedStart, selectedEnd, effectiveGrouping) : { points: [] as Point[], categories: [] as { id: string; name: string; color: string; key: string }[] };

  function chart(kind: Kind, points: Point[], categories: typeof compact.categories, large: boolean) {
    const bars = kind === 'hours' ? categories.map(category =>
      <Bar key={category.id} dataKey={category.key} name={category.name} fill={category.color} stackId="hours" maxBarSize={44} />)
      : <><Bar dataKey="correct" name="Acertos" fill="var(--ej-chart-blue)" stackId="questions" maxBarSize={44} /><Bar dataKey="errors" name="Erros" fill="var(--ej-chart-error)" stackId="questions" maxBarSize={44} /></>;
    return <div className={large ? 'h-80 w-full' : 'h-52 w-full'}><ResponsiveContainer width="100%" height="100%"><BarChart data={points} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ej-chart-grid)" />
      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} interval="preserveStartEnd" />
      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} width={44} allowDecimals={kind === 'hours'} tickFormatter={value => kind === 'hours' ? `${Math.round(Number(value) / 3600 * 10) / 10}h` : String(value)} />
      <Tooltip cursor={{ fill: 'var(--ej-neutral-soft)' }} content={({ active, payload, label }) => active && payload?.length ? <div className="progress-chart-tooltip"><p className="font-semibold mb-1">{label}</p>{payload.map(item => <p key={String(item.dataKey)} className="progress-chart-tooltip__row"><span className="progress-chart-swatch" aria-hidden="true" style={{ backgroundColor: item.color }} /><span>{item.name}: {kind === 'hours' ? formatDuration(Number(item.value)) : item.value}</span></p>)}</div> : null} />
      {bars}
    </BarChart></ResponsiveContainer></div>;
  }

  function legend(kind: Kind, categories: typeof compact.categories) {
    const items = kind === 'hours' ? categories.map(item => ({ name: item.name, color: item.color })) : [{ name: 'Acertos', color: 'var(--ej-chart-blue)' }, { name: 'Erros', color: 'var(--ej-chart-error)' }];
    return <div className="progress-chart-legend">{items.map(item => <span key={item.name}><span className="progress-chart-swatch" aria-hidden="true" style={{ backgroundColor: item.color }} />{item.name}</span>)}</div>;
  }

  function card(kind: Kind) {
    const title = kind === 'hours' ? 'Horas estudadas' : 'Questões';
    return <div className={chartBox}><button type="button" onClick={() => open(kind)} className="w-full text-left" aria-label={`Ampliar gráfico de ${title.toLowerCase()}`}><div className="progress-chart-heading"><div><h3>{title}</h3><span>Últimos 7 dias</span></div><Icon name="arrow" size={18} /></div></button>
      <div role="button" tabIndex={0} aria-label={`Ampliar gráfico de ${title.toLowerCase()}`} onClick={() => open(kind)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(kind); } }}>{chart(kind, compact.points, compact.categories, false)}</div>
      {legend(kind, compact.categories)}</div>;
  }

  return <>
    {showSubjectFilter && <label className="block text-sm">Matéria<select aria-label="Filtrar matéria dos gráficos" className="progress-control w-full" value={subjectId} onChange={e => (onSubjectChange || setLocalSubjectId)(e.target.value)}><option value="all">Todas</option><option value="others">Outros</option>{data?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
    {error && <p role="alert" className="text-accent-danger">{error}</p>}
    {!data && !error ? <p className="text-text-secondary">Carregando gráficos...</p> : data && <div className="progress-charts-grid">{card('hours')}{card('questions')}</div>}
    {modal && data && <CommunityDialog open title={modal === 'hours' ? 'Horas estudadas' : 'Questões'} onClose={() => setModal(null)} wide><div className="p-5 sm:p-6">
      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filtrar período">{([['7', '7 dias'], ['30', '30 dias'], ['90', '90 dias'], ['all', 'Todo o histórico'], ['custom', 'Intervalo personalizado']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => changePeriod(value)} aria-pressed={period === value} className="progress-period-button">{label}</button>)}</div>
      {period === 'custom' && <div className="flex flex-wrap gap-3 mb-4"><label className="text-sm">De<input type="date" value={start} max={end || today} onChange={e => setStart(e.target.value)} className="progress-control" /></label><label className="text-sm">Até<input type="date" value={end} min={start} max={today} onChange={e => setEnd(e.target.value)} className="progress-control" /></label></div>}
      {allowGrouping && <label className="block text-sm mb-4">Agrupar por<select aria-label="Agrupar dados" className="progress-control" value={grouping} onChange={e => setGrouping(e.target.value as Grouping)}><option value="day">Dia</option><option value="week">Semana</option><option value="month">Mês</option></select></label>}
      {!validRange ? <p role="alert" className="text-accent-danger">Selecione um intervalo de datas válido.</p> : <>{chart(modal, detailed.points, detailed.categories, true)}{legend(modal, detailed.categories)}</>}
    </div></CommunityDialog>}
  </>;
}
