import { BadgeConfig, LevelConfig } from '../types';

export const DEFAULT_TIMEZONE = 'America/Sao_Paulo';
export const POINTS_THRESHOLD_SECONDS = 3600; // 60 minutos
export const MAX_POINTS_PER_DAY = 1;

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

export const DEFAULT_BADGES: BadgeConfig[] = [
  {
    id: 'first_point',
    name: 'Primeiro Ponto',
    description: 'Conquistou o seu primeiro ponto diário ao estudar 60 minutos.',
    icon: '🌟',
    ruleType: 'first_point',
    requirement: 1,
    active: true,
  },
  {
    id: 'streak_7',
    name: 'Semana de Ouro',
    description: 'Alcançou uma sequência ininterrupta de 7 dias com pelo menos 60 minutos de estudo.',
    icon: '🔥',
    ruleType: 'streak',
    requirement: 7,
    active: true,
  },
  {
    id: 'streak_30',
    name: 'Hábito de Ferro',
    description: 'Manteve uma sequência impressionante de 30 dias consecutivos de estudo.',
    icon: '💎',
    ruleType: 'streak',
    requirement: 30,
    active: true,
  },
  {
    id: 'hours_50',
    name: 'Foco Profundo',
    description: 'Acumulou 50 horas líquidas de estudo na plataforma.',
    icon: '⏳',
    ruleType: 'total_hours',
    requirement: 50 * 3600,
    active: true,
  },
  {
    id: 'hours_100',
    name: 'Centenário',
    description: 'Ultrapassou a marca de 100 horas líquidas de estudo.',
    icon: '💯',
    ruleType: 'total_hours',
    requirement: 100 * 3600,
    active: true,
  },
  {
    id: 'points_100',
    name: 'Clube dos 100',
    description: 'Conquistou 100 pontos acumulados ao longo dos seus estudos.',
    icon: '🎖️',
    ruleType: 'total_points',
    requirement: 100,
    active: true,
  },
  {
    id: 'rank_first',
    name: 'No Topo',
    description: 'Assumiu a liderança em 1º lugar no ranking de pontos do grupo.',
    icon: '🥇',
    ruleType: 'rank_first',
    requirement: 1,
    active: true,
  },
];
