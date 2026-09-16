import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { TimeSeriesPoint } from '../../types';

interface StudyChartProps {
  data: TimeSeriesPoint[];
  title: string;
}

const formatDateLabel = (dateStr: string): string => {
  // dateStr vem como YYYY-MM-DD, formata para dd/MM
  const [, month, day] = dateStr.split('-');
  return `${day}/${month}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0].payload as TimeSeriesPoint;
    return (
      <div className="bg-bg-tertiary border border-border p-3 rounded-lg shadow-xl">
        <p className="font-semibold text-text-primary mb-1">{formatDateLabel(entry.date)}</p>
        <p className="text-accent-primary text-sm">{`${payload[0].value.toFixed(1)} horas`}</p>
        {entry.pointEarned && (
          <p className="text-accent-success text-xs mt-1">✓ Ponto conquistado</p>
        )}
      </div>
    );
  }
  return null;
};

export const StudyChart: React.FC<StudyChartProps> = ({ data, title }) => {
  return (
    <div className="bg-bg-secondary p-4 rounded-2xl border border-border w-full h-[300px] flex flex-col">
      <h3 className="font-semibold text-text-primary mb-4">{title}</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2A2A38" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              dy={10}
              tickFormatter={formatDateLabel}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(v) => `${v}h`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#252530' }} />
            <Bar dataKey="studyHours" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.pointEarned ? '#22C55E' : '#6366F1'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
