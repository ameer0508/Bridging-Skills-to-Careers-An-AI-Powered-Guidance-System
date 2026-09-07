import React from 'react';
import { TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { TiltCard } from '../../../features/landing/components/effects/TiltCard';
import { Counter } from '../../../features/landing/components/effects/Counter';

export interface PremiumMetricCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: string;
  isPositive?: boolean;
  confidence?: number;
  icon?: React.ElementType;
  sparklineData?: number[];
  className?: string;
}

export const PremiumMetricCard: React.FC<PremiumMetricCardProps> = ({
  title,
  value,
  prefix = '',
  suffix = '',
  trend,
  isPositive = true,
  confidence,
  icon: Icon,
  sparklineData = [30, 45, 60, 55, 75, 88, 94],
  className = '',
}) => {
  // Generate SVG path points for sparkline
  const maxVal = Math.max(...sparklineData);
  const minVal = Math.min(...sparklineData);
  const range = maxVal - minVal || 1;
  const width = 120;
  const height = 36;

  const points = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <TiltCard glowColor="rgba(99, 102, 241, 0.2)" className={`p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2 rounded-xl bg-slate-950/80 border border-white/10 text-indigo-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <div className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          <Counter from={0} to={value} prefix={prefix} suffix={suffix} duration={1.8} />
        </div>

        {/* Sparkline chart */}
        <div className="w-28 h-9 shrink-0">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke="#818cf8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>

      {/* Footer metadata */}
      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
        {trend && (
          <span
            className={`flex items-center gap-1 font-semibold ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </span>
        )}

        {confidence !== undefined && (
          <span className="text-slate-400 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
            {confidence}% AI Confidence
          </span>
        )}
      </div>
    </TiltCard>
  );
};
