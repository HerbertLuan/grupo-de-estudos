import { Icon } from './DesignSystem';
export interface StreakBadgeProps { streak:number; size?:'sm'|'md'; }
export function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
 return <span className={`ej-badge ${streak > 0 ? 'ej-tone-yellow' : 'ej-tone-neutral'} ${size === 'sm' ? 'text-xs' : 'text-sm'}`} aria-label={`${streak} ${streak === 1 ? 'dia' : 'dias'} de sequência`}><Icon name="bolt" size={14}/>{streak}</span>;
}
