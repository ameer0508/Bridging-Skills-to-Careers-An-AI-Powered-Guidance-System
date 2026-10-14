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
        <h3 className="text-base font-bold font-display text-aurora-ink">
          Career Readiness & Skill Trajectory
        </h3>
      </CardHeader>

      <CardBody>
        <div className="h-72 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-aurora-muted italic">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e6eaf6" vertical={false} />
                <XAxis dataKey="date" stroke="#515b80" fontSize={11} tickLine={false} />
                <YAxis stroke="#515b80" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e6eaf6',
                    borderRadius: 'var(--radius-md)',
                    color: '#10153b',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#5540f5' }}
                />
                <Area
                  type="monotone"
                  dataKey="readiness"
                  name="Readiness %"
                  stroke="#5540f5"
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
