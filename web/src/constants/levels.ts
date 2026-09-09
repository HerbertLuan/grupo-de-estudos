import type { LevelConfig } from '../types';

export const DEFAULT_LEVELS: LevelConfig[] = [
  { id: 'iniciante', name: 'Iniciante', requiredSeconds: 0, order: 1, icon: '🌱' },
  { id: 'aprendiz', name: 'Aprendiz', requiredSeconds: 10 * 3600, order: 2, icon: '📖' },
  { id: 'dedicado', name: 'Dedicado', requiredSeconds: 25 * 3600, order: 3, icon: '🔥' },
  { id: 'disciplinado', name: 'Disciplinado', requiredSeconds: 50 * 3600, order: 4, icon: '⚡' },
  { id: 'estudioso', name: 'Estudioso', requiredSeconds: 100 * 3600, order: 5, icon: '🎯' },
  { id: 'veterano', name: 'Veterano', requiredSeconds: 250 * 3600, order: 6, icon: '🛡️' },
  { id: 'mestre', name: 'Mestre', requiredSeconds: 500 * 3600, order: 7, icon: '👑' },
  { id: 'lendario', name: 'Lendário', requiredSeconds: 1000 * 3600, order: 8, icon: '🏆' },
];
