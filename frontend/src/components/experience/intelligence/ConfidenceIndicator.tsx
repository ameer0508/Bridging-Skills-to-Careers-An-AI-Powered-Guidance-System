import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export interface ConfidenceIndicatorProps {
  score?: number;
  tier?: 'High Confidence' | 'Medium Confidence' | 'Evaluating' | string;
  evidenceCount?: number;
  className?: string;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  score = 85,
  tier = 'High Confidence',
  evidenceCount = 3,
  className = '',
}) => {
  const getBadgeStyle = () => {
    if (score >= 75 || tier.includes('High')) {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    }
    if (score >= 45 || tier.includes('Medium')) {
      return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    }
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle()} ${className}`}
      title={`Derived from ${evidenceCount} backend verification data points`}
    >
      <ShieldCheck className="w-3.5 h-3.5" />
      <span>{tier}</span>
      <Info className="w-3 h-3 opacity-60 ml-0.5" />
    </div>
  );
};

export default ConfidenceIndicator;
