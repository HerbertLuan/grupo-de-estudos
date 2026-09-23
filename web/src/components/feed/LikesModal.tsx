import React from 'react';
import { FeedLikeUser } from '../../types';
import { Avatar } from '../ui/Avatar';
import { LoadingState } from '../ui/LoadingState';
import { CommunityDialog } from './CommunityDialog';

interface LikesModalProps { isOpen: boolean; onClose: () => void; likes: FeedLikeUser[]; isLoading: boolean; }

export const LikesModal: React.FC<LikesModalProps> = ({ isOpen, onClose, likes, isLoading }) => (
  <CommunityDialog open={isOpen} title={`Curtidas${!isLoading && likes.length ? ` · ${likes.length}` : ''}`} onClose={onClose}>
    <div className="p-6">{isLoading ? <LoadingState message="Carregando curtidas..." /> : likes.length === 0 ? <div className="py-10 text-center"><p className="font-semibold">O primeiro incentivo pode ser seu.</p><p className="mt-2 text-sm text-text-secondary">Ninguém curtiu ainda.</p></div> : <ul className="divide-y divide-border">{likes.map(user => { const displayName = user.nickname || user.name || 'Usuário'; return <li key={user.uid} className="flex items-center gap-3 py-4"><Avatar src={user.avatarUrl} name={displayName} /><div><p className="font-semibold text-sm">{displayName}</p>{user.name && user.name !== user.nickname && <p className="mt-1 text-xs text-text-secondary">{user.name}</p>}</div></li>; })}</ul>}</div>
  </CommunityDialog>
);
