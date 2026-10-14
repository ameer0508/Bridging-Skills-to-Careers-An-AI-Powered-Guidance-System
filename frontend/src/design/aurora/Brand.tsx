import React, { useId } from 'react';

/** The SkillBridge mark: a peak with the journey path rising over it. */
export const BrandMark: React.FC<{ className?: string }> = ({ className = 'h-9 w-9' }) => {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`bm-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6e4bff" />
          <stop offset="100%" stopColor="#4631ec" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill={`url(#bm-${uid})`} />
      <path d="M7 29 L15.5 17.5 L20 23 L25 15 L33 29 Z" fill="#ffffff" opacity="0.28" />
      <path d="M9 31 C 14 27, 17 28, 20 24 C 23 20, 26 19, 31 12" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="31" cy="12" r="2.6" fill="#ffffff" />
    </svg>
  );
};

export const BrandLockup: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <BrandMark />
    <span className="font-heading text-lg font-extrabold tracking-tight text-aurora-ink">SkillBridge</span>
  </span>
);
