import { ProgressBar, Badge } from '../ui/DesignSystem';

export interface DailyProgressProps {
  totalSecondsToday: number;
  pointEarned: boolean;
  elapsedSeconds: number;
  isActive: boolean;
}

export function DailyProgress({ totalSecondsToday, pointEarned, elapsedSeconds, isActive }: DailyProgressProps) {
  const targetSeconds = 60 * 60;
  const currentTotal = totalSecondsToday + (isActive ? elapsedSeconds : 0);
  const progressPercentage = Math.min(100, Math.max(0, (currentTotal / targetSeconds) * 100));
  const minutesTotal = Math.floor(currentTotal / 60);
  const isPointEarnedNow = pointEarned || currentTotal >= targetSeconds;
  return <div className="study-daily-progress">
    <div className="study-goal-heading"><span>Meta diária</span><strong>{Math.min(minutesTotal, 60)} <span>/ 60 min</span></strong></div>
    <ProgressBar value={progressPercentage} label="Meta diária de estudo" />
    {isPointEarnedNow ? <div className="study-goal-complete"><Badge tone="yellow">+1 ponto conquistado</Badge><p>Você fez a diferença hoje.</p></div> : <p>Mais <strong>{60 - minutesTotal} minutos</strong> para conquistar seu ponto do dia.</p>}
  </div>;
}
