import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShieldCheck, Award } from 'lucide-react';
import { CountUpNumber } from '../typography/CountUpNumber';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface MorphingProgressRingProps {
  score: number;
  tier?: string;
  size?: number;
  strokeWidth?: number;
  trendLabel?: string;
  className?: string;
}

export const MorphingProgressRing: React.FC<MorphingProgressRingProps> = ({
  score,
  tier = 'Evaluating',
  size = 140,
  strokeWidth = 10,
  trendLabel = '+4% this week',
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getGradientColors = () => {
    if (score >= 80) return ['#10b981', '#34d399']; // Emerald
    if (score >= 50) return ['#6366f1', '#a855f7']; // Indigo/Purple
    return ['#f59e0b', '#fbbf24']; // Amber
  };

  const colors = getGradientColors();

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors[0]} />
              <stop offset="100%" stopColor={colors[1]} />
            </linearGradient>
          </defs>
          {/* Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-neutral-200 dark:text-neutral-800"
          />
          {/* Animated Progress Circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#ringGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            initial={prefersReducedMotion ? { strokeDashoffset } : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline text-3xl font-extrabold text-neutral-900 dark:text-white">
            <CountUpNumber value={score} duration={1200} />
            <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 ml-0.5">%</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mt-0.5">
            Readiness
          </span>
        </div>
      </div>

      {/* Meta Indicators */}
      <div className="mt-3 flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{trendLabel}</span>
        </div>
        <span className="text-neutral-300 dark:text-neutral-700">•</span>
        <div className="flex items-center gap-1 font-medium text-neutral-600 dark:text-neutral-400">
          {score >= 80 ? (
            <Award className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          )}
          <span>{tier}</span>
        </div>
      </div>
    </div>
  );
};

export default MorphingProgressRing;
