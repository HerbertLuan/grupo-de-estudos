import React from 'react';
import { LevelConfig } from '../../types';
import { Badge, Card, ProgressBar } from '../ui/DesignSystem';
import '../../styles/social-redesign.css';

interface LevelProgressProps { currentLevel: LevelConfig; nextLevel: LevelConfig | null; currentSeconds: number; requiredSecondsForNext: number; progressPercentage: number; }

export const LevelProgress: React.FC<LevelProgressProps> = ({ currentLevel, nextLevel, currentSeconds, requiredSecondsForNext, progressPercentage }) => (
  <Card className="student-level">
    <div className="student-level__heading">
      <div><p className="social-eyebrow">Sua evolução</p><h2><span aria-hidden="true">{currentLevel.icon}</span> {currentLevel.name}</h2></div>
      <Badge tone={nextLevel ? 'blue' : 'yellow'}>{nextLevel ? `${Math.min(100, Math.max(0, progressPercentage))}%` : 'Nível máximo'}</Badge>
    </div>
    <ProgressBar value={progressPercentage} label={`Progresso no nível ${currentLevel.name}`} />
    {nextLevel ? <div className="student-level__next"><span>Próximo: <strong>{nextLevel.name}</strong></span><span>Faltam {Math.ceil((requiredSecondsForNext - currentSeconds) / 3600)}h</span></div> : <p className="mt-3 text-sm text-text-secondary">Você chegou ao último nível. Continue construindo sua história.</p>}
  </Card>
);
