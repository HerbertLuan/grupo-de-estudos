import { useEffect, useMemo, useState } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getSubjectChartData, type SubjectChartData } from '../../services/subjectService';
import { subjectColor } from '../../utils/subjectColor';
import { formatDuration } from '../../utils/formatTime';

type Kind = 'hours' | 'questions';
type Period = '7' | '30' | '90' | 'all' | 'custom';
type Grouping = 'day' | 'week' | 'month';
type Point = Record<string, string | number> & { label: string; range: string; correct: number; errors: number };

const dateLabel = (date: string) => format(parseISO(date), 'dd/MM');
const chartBox = 'bg-bg-secondary border border-border rounded-2xl p-4';

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
      : <><Bar dataKey="correct" name="Acertos" fill="#22c55e" stackId="questions" maxBarSize={44} /><Bar dataKey="errors" name="Erros" fill="#ef4444" stackId="questions" maxBarSize={44} /></>;
    return <div className={large ? 'h-80 w-full' : 'h-52 w-full'}><ResponsiveContainer width="100%" height="100%"><BarChart data={points} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A38" />
      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} interval="preserveStartEnd" />
      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} width={44} allowDecimals={kind === 'hours'} tickFormatter={value => kind === 'hours' ? `${Math.round(Number(value) / 3600 * 10) / 10}h` : String(value)} />
      <Tooltip content={({ active, payload, label }) => active && payload?.length ? <div className="bg-bg-tertiary border border-border p-3 rounded-lg shadow-xl text-sm"><p className="font-semibold mb-1">{label}</p>{payload.map(item => <p key={String(item.dataKey)} style={{ color: item.color }}>{item.name}: {kind === 'hours' ? formatDuration(Number(item.value)) : item.value}</p>)}</div> : null} />
      {bars}
    </BarChart></ResponsiveContainer></div>;
  }

  function legend(kind: Kind, categories: typeof compact.categories) {
    const items = kind === 'hours' ? categories.map(item => ({ name: item.name, color: item.color })) : [{ name: 'Acertos', color: '#22c55e' }, { name: 'Erros', color: '#ef4444' }];
    return <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-text-secondary">{items.map(item => <span key={item.name} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />{item.name}</span>)}</div>;
  }

  function card(kind: Kind) {
    const title = kind === 'hours' ? 'Horas estudadas' : 'Questões';
    return <div className={chartBox}><button type="button" onClick={() => open(kind)} className="w-full text-left" aria-label={`Ampliar gráfico de ${title.toLowerCase()}`}><div className="flex justify-between items-center mb-3"><h3 className="font-semibold">{title}</h3><span className="text-xs text-accent-primary">Últimos 7 dias · Ampliar ↗</span></div></button>
      <div role="button" tabIndex={0} aria-label={`Ampliar gráfico de ${title.toLowerCase()}`} onClick={() => open(kind)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(kind); } }}>{chart(kind, compact.points, compact.categories, false)}</div>
      {legend(kind, compact.categories)}</div>;
  }

  return <>
    {showSubjectFilter && <label className="block text-sm">Matéria<select aria-label="Filtrar matéria dos gráficos" className="block w-full mt-1 p-3 rounded-xl bg-bg-secondary border border-border" value={subjectId} onChange={e => (onSubjectChange || setLocalSubjectId)(e.target.value)}><option value="all">Todas</option><option value="others">Outros</option>{data?.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
    {error && <p role="alert" className="text-accent-danger">{error}</p>}
    {!data && !error ? <p className="text-text-secondary">Carregando gráficos...</p> : data && <div className="space-y-4">{card('hours')}{card('questions')}</div>}
    {modal && data && <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3" onMouseDown={event => { if (event.target === event.currentTarget) setModal(null); }}><div role="dialog" aria-modal="true" aria-label={`Gráfico de ${modal === 'hours' ? 'horas estudadas' : 'questões'}`} className="bg-bg-primary border border-border rounded-2xl p-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center gap-3 mb-4"><h2 className="text-xl font-bold">{modal === 'hours' ? 'Horas estudadas' : 'Questões'}</h2><button type="button" onClick={() => setModal(null)} aria-label="Fechar gráfico" className="text-2xl text-text-secondary">×</button></div>
      <div className="flex flex-wrap gap-2 mb-4" aria-label="Filtrar período">{([['7', '7 dias'], ['30', '30 dias'], ['90', '90 dias'], ['all', 'Todo o histórico'], ['custom', 'Intervalo personalizado']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => changePeriod(value)} aria-pressed={period === value} className={`px-3 py-2 rounded-lg text-sm border ${period === value ? 'bg-accent-primary text-white border-accent-primary' : 'border-border'}`}>{label}</button>)}</div>
      {period === 'custom' && <div className="flex flex-wrap gap-3 mb-4"><label className="text-sm">De<input type="date" value={start} max={end || today} onChange={e => setStart(e.target.value)} className="block mt-1 p-2 rounded-lg bg-bg-secondary border border-border" /></label><label className="text-sm">Até<input type="date" value={end} min={start} max={today} onChange={e => setEnd(e.target.value)} className="block mt-1 p-2 rounded-lg bg-bg-secondary border border-border" /></label></div>}
      {allowGrouping && <label className="block text-sm mb-4">Agrupar por<select aria-label="Agrupar dados" className="block mt-1 p-2 rounded-lg bg-bg-secondary border border-border" value={grouping} onChange={e => setGrouping(e.target.value as Grouping)}><option value="day">Dia</option><option value="week">Semana</option><option value="month">Mês</option></select></label>}
      {!validRange ? <p role="alert" className="text-accent-danger">Selecione um intervalo de datas válido.</p> : <>{chart(modal, detailed.points, detailed.categories, true)}{legend(modal, detailed.categories)}</>}
    </div></div>}
  </>;
}
