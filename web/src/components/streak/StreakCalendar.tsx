import { useRef, type KeyboardEvent } from 'react';
import type { DailyStudy } from '../../types';
import { dayState, fullDate, monthDays, monthKey, monthTitle, shiftMonth } from './calendarDates';

const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const stateName = { completed: 'meta diária concluída, contou para a sequência', partial: 'estudo registrado, meta não concluída', empty: 'sem estudo registrado', future: 'dia futuro' };

interface Props { month: string; today: string; selected: string; records: Map<string, DailyStudy>; onMonth: (month: string) => void; onSelect: (date: string) => void }

export function StreakCalendar({ month, today, selected, records, onMonth, onSelect }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const days = monthDays(month);
  const thisMonth = monthKey(today);
  const move = (date: string) => {
    if (date > today) return;
    onMonth(monthKey(date));
    onSelect(date);
    requestAnimationFrame(() => gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)?.focus());
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const date = target.dataset.date;
    if (!date) return;
    const index = days.indexOf(date);
    const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 };
    if (event.key in offsets) {
      event.preventDefault();
      const [y, m, d] = date.split('-').map(Number);
      const next = new Date(Date.UTC(y, m - 1, d + offsets[event.key]));
      move(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}-${String(next.getUTCDate()).padStart(2, '0')}`);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const delta = event.key === 'Home' ? -index % 7 : 6 - index % 7;
      const candidate = days[index + delta];
      if (candidate) move(candidate);
    }
  };

  return <section className="streak-calendar" aria-label="Calendário mensal">
    <div className="streak-month-nav">
      <button type="button" aria-label="Mês anterior" onClick={() => onMonth(shiftMonth(month, -1))}>‹</button>
      <h3 aria-live="polite">{monthTitle(month)}</h3>
      <button type="button" aria-label="Mês seguinte" disabled={month >= thisMonth} onClick={() => onMonth(shiftMonth(month, 1))}>›</button>
      {month !== thisMonth && <button type="button" className="streak-today-action" onClick={() => { onMonth(thisMonth); onSelect(today); }}>Hoje</button>}
    </div>
    <div className="streak-weekdays" aria-hidden="true">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
    <div ref={gridRef} className="streak-grid" onKeyDown={onKeyDown} role="group" aria-label={monthTitle(month)}>
      {days.map((date, index) => date ? (() => {
        const state = dayState(date, today, records.get(date));
        const isToday = date === today;
        const isSelected = date === selected;
        return <button type="button" key={date} data-date={date} disabled={state === 'future'}
          className={`streak-day streak-day--${state}${isToday ? ' streak-day--today' : ''}${isSelected ? ' streak-day--selected' : ''}`}
          aria-label={`${fullDate(date)}; ${isToday ? 'Hoje; ' : ''}${stateName[state]}${isSelected ? '; selecionado' : ''}`}
          aria-pressed={isSelected} aria-current={isToday ? 'date' : undefined}
          onClick={() => onSelect(date)}><span>{Number(date.slice(-2))}</span>{state === 'completed' ? <span aria-hidden="true" className="streak-day-mark">✓</span> : state === 'partial' ? <span aria-hidden="true" className="streak-day-mark">•</span> : null}{isToday && <span aria-hidden="true" className="streak-today-label">Hoje</span>}</button>;
      })() : <span key={`blank-${index}`} aria-hidden="true" />)}
    </div>
    <div className="streak-legend"><span><i className="streak-legend-completed"/>Meta concluída ✓</span><span><i className="streak-legend-partial"/>Estudo parcial •</span></div>
    {records.size === 0 && <p className="streak-no-history">Ainda não há estudos registrados. Seus registros aparecerão aqui após a primeira sessão salva.</p>}
  </section>;
}
