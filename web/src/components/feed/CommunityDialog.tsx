import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useDialogA11y } from '../ui/Dialog';
import { Icon } from '../ui/DesignSystem';
import '../../styles/social-redesign.css';

export function CommunityDialog({ open, title, onClose, children, footer, wide = false }: { open: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogA11y(dialogRef, open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="community-dialog-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={`community-dialog ${wide ? 'community-dialog--wide' : ''}`}>
        <header className="community-dialog__header"><h2 id={titleId}>{title}</h2><button type="button" onClick={onClose} aria-label={`Fechar ${title.toLowerCase()}`}><Icon name="close" size={20} /></button></header>
        <div className="community-dialog__body">{children}</div>
        {footer}
      </div>
    </div>, document.body,
  );
}
