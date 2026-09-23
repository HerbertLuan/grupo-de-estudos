import type { ReactNode } from 'react';
import { CommunityDialog } from '../feed/CommunityDialog';

export function ListModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <CommunityDialog open title={title} onClose={onClose}><div className="p-5 sm:p-6">{children}</div></CommunityDialog>;
}
