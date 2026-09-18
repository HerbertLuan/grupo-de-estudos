import { useCallback, useEffect, useState } from 'react';
import { getUserHistory } from '../../services/statsService';
import type { DailyStudy } from '../../types';
import { HistoryList } from './HistoryList';
import { ListModal } from './ListModal';

export function HistorySection({ uid }: { uid: string }) {
  const [preview, setPreview] = useState<DailyStudy[]>([]);
  const [allHistory, setAllHistory] = useState<DailyStudy[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getUserHistory(uid, 5).then(result => { if (active) setPreview(result); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Não foi possível carregar o histórico.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [uid]);

  const loadAll = useCallback(async () => {
    setModalLoading(true); setError('');
    try { setAllHistory(await getUserHistory(uid, undefined, true)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível carregar o histórico completo.'); }
    finally { setModalLoading(false); }
  }, [uid]);

  function showAll() { setOpen(true); if (!allHistory) void loadAll(); }

  return <section className="space-y-3">
    <div className="flex justify-between items-center gap-3"><h2 className="text-lg font-bold text-text-primary">Histórico Detalhado</h2>{preview.length > 4 && <button type="button" onClick={showAll} className="text-sm text-accent-primary underline">Ver mais</button>}</div>
    {loading ? <p className="text-text-secondary">Carregando histórico...</p> : error && !open ? <p role="alert" className="text-accent-danger">{error}</p> : <HistoryList history={preview.slice(0, 4)} />}
    {open && <ListModal title="Histórico detalhado" onClose={() => setOpen(false)}>{modalLoading ? <p className="text-text-secondary">Carregando histórico completo...</p> : error ? <div><p role="alert" className="text-accent-danger mb-3">{error}</p><button type="button" onClick={() => void loadAll()} className="text-accent-primary underline">Tentar novamente</button></div> : <HistoryList history={allHistory || []} />}</ListModal>}
  </section>;
}
