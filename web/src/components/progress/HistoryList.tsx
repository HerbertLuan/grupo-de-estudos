import React from 'react';
import { DailyStudy } from '../../types';
import { formatDate } from '../../utils/formatDate';
import { formatDuration } from '../../utils/formatTime';

interface HistoryListProps {
  history: DailyStudy[];
}

export const HistoryList: React.FC<HistoryListProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary border border-dashed border-border rounded-xl">
        Nenhum registro de estudo encontrado.
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary rounded-2xl border border-border overflow-hidden">
      {history.map((day, index) => (
        <div 
          key={day.date} 
          className={`flex items-center justify-between p-4 ${index !== history.length - 1 ? 'border-b border-border' : ''} ${index % 2 === 0 ? 'bg-bg-secondary' : 'bg-bg-tertiary/50'}`}
        >
          <div>
            <div className="font-medium text-text-primary">{formatDate(day.date)}</div>
            <div className="text-xs text-text-secondary mt-1">{day.totalSessions ?? day.sessionsCount ?? 0} sessões</div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-bold text-text-primary">{formatDuration(day.totalSeconds)}</div>
            </div>
            <div className="w-8 flex justify-end">
              {day.pointEarned ? (
                <span className="text-accent-success" title="Ponto conquistado">✅</span>
              ) : (
                <span className="text-text-muted opacity-50" title="Sem ponto">❌</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
