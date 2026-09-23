import type { IconName } from '../ui/DesignSystem';

export const navigationItems: { path: string; label: string; icon: IconName; section: 'routine' | 'community'; admin?: boolean }[] = [
  { path: '/', label: 'Meu estudo', icon: 'study', section: 'routine' },
  { path: '/progress', label: 'Meu progresso', icon: 'progress', section: 'routine' },
  { path: '/subjects', label: 'Disciplinas', icon: 'subjects', section: 'routine' },
  { path: '/ranking', label: 'Ranking', icon: 'ranking', section: 'community' },
  { path: '/seasons', label: 'Temporadas', icon: 'seasons', section: 'community' },
  { path: '/feed', label: 'Comunidade', icon: 'feed', section: 'community' },
  { path: '/admin', label: 'Administração', icon: 'admin', section: 'community', admin: true },
];
