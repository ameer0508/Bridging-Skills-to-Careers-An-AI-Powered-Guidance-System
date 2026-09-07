import React from 'react';

export interface ProgressRingProps extends React.SVGAttributes<SVGSVGElement> {
  value?: number; // 0 to 100
  size?: number; // width/height in px
  strokeWidth?: number;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'ai';
  showValueLabel?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const strokeColorMap = {
  primary: 'var(--color-interactive-primary)',
  success: 'var(--color-status-success-text)',
  warning: 'var(--color-status-warning-text)',
  error: 'var(--color-status-error-text)',
  ai: 'var(--color-ai-accent)',
};

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value = 0,
  size = 64,
  strokeWidth = 6,
  variant = 'primary',
  showValueLabel = true,
  children,
  className = '',
  ...props
}) => {
  const percentage = Math.min(Math.max(0, value), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 transform"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        {...props}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-border-subtle)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColorMap[variant]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-[var(--duration-slow)] ease-[var(--ease-default)]"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[var(--color-text-primary)]">
        {children ? children : showValueLabel ? `${Math.round(percentage)}%` : null}
      </div>
    </div>
  );
};

ProgressRing.displayName = 'ProgressRing';
