import { useEffect, useId, type ReactNode } from 'react';

export function ListModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId();
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="bg-bg-primary border border-border rounded-2xl p-4 w-full max-w-2xl max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center gap-3 mb-4"><h2 id={titleId} className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} aria-label={`Fechar ${title.toLowerCase()}`} className="text-2xl text-text-secondary">×</button></div>
      <div className="overflow-y-auto min-h-0">{children}</div>
    </div>
  </div>;
}
