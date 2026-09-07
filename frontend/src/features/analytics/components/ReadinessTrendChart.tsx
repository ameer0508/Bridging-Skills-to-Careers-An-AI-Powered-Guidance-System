import React from 'react';
import { Card, CardHeader, CardBody } from '../../../components/base/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface ReadinessSnapshot {
  date: string | number | Date;
  averageReadinessScore: number;
  totalSkills: number;
}

export interface ReadinessTrendChartProps {
  snapshots: ReadinessSnapshot[];
}

export const ReadinessTrendChart: React.FC<ReadinessTrendChartProps> = ({ snapshots }) => {
  const chartData = snapshots.map(s => ({
    date: new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    readiness: s.averageReadinessScore,
    skills: s.totalSkills,
  }));

  return (
    <Card variant="default">
      <CardHeader>
        <h3 className="text-base font-bold font-display text-[var(--color-text-primary)]">
          Career Readiness & Skill Trajectory
        </h3>
      </CardHeader>

      <CardBody>
        <div className="h-72 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[var(--color-text-tertiary)] italic">
              Insufficient historical snapshots to plot trend line.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(226, 84%, 57%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(226, 84%, 57%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--color-text-tertiary)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-text-tertiary)" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-surface-raised)',
                    borderColor: 'var(--color-border-default)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: 'var(--color-interactive-primary)' }}
                />
                <Area
                  type="monotone"
                  dataKey="readiness"
                  name="Readiness %"
                  stroke="var(--color-interactive-primary)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#readinessGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

ReadinessTrendChart.displayName = 'ReadinessTrendChart';
