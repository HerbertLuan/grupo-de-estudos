import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Icon } from '../ui/DesignSystem';
import { useDialogA11y } from '../ui/Dialog';
import { getTodayDateString } from '../../utils/formatDate';
import { countCompleted, monthKey } from './calendarDates';
import { useStreakCalendar } from './useStreakCalendar';
import { StreakCalendar } from './StreakCalendar';
import { StreakSummary } from './StreakSummary';
import { StreakDayDetails } from './StreakDayDetails';
import './streak-calendar.css';

export function StreakCalendarModal({ uid, onClose, onPresented }: { uid: string; onClose: () => void; onPresented?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [today] = useState(getTodayDateString);
  const [month, setMonth] = useState(() => monthKey(today));
  const [selected, setSelected] = useState(today);
  const { data, loading, error, retry } = useStreakCalendar(uid, true);
  useDialogA11y(ref, true, onClose);
  useEffect(() => { if (ref.current) onPresented?.(); }, [onPresented]);
  const records = new Map(data?.history.map(item => [item.date, item]) ?? []);
  const complete = data ? countCompleted(month, data.history) : 0;

  return <div className="streak-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={ref} className="streak-modal" role="dialog" aria-modal="true" aria-labelledby="streak-title" aria-describedby="streak-description">
      <header className="streak-modal-header"><div><p className="ej-eyebrow">Consistência</p><h2 id="streak-title">Sua sequência de estudos</h2><p id="streak-description">Acompanhe os dias com meta concluída e o tempo registrado.</p></div><button type="button" className="ej-icon-button streak-close" aria-label="Fechar calendário" onClick={onClose}><Icon name="close"/></button></header>
      {loading ? <div className="streak-status" role="status">Carregando seu calendário…</div> : error ? <div className="streak-status" role="alert"><p>{navigator.onLine ? error : 'Sem conexão. Verifique sua internet e tente novamente.'}</p><Button variant="secondary" onClick={retry}>Tentar novamente</Button></div> : data ? <div className="streak-modal-body"><StreakCalendar month={month} today={today} selected={selected} records={records} onMonth={setMonth} onSelect={setSelected}/><StreakSummary current={data.stats.summary.currentStreak} longest={data.stats.summary.longestStreak} completed={complete}/><StreakDayDetails date={selected} today={today} record={records.get(selected)}/></div> : null}
      <footer className="streak-modal-footer"><Button variant="secondary" onClick={onClose}>Fechar</Button><Link className="ej-button ej-button-primary" to="/" onClick={onClose}>Ir estudar <Icon name="arrow" size={16}/></Link></footer>
    </div>
  </div>;
}
