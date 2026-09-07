import React from 'react';

interface PasswordStrengthBarProps {
  score: number; // 0 to 4
  passwordValue: string;
}

export const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = ({ score, passwordValue }) => {
  if (!passwordValue) return null;

  const getLabel = () => {
    if (score >= 3) return { text: 'Strong', color: 'text-emerald-400 font-bold' };
    if (score === 2) return { text: 'Medium', color: 'text-amber-400 font-semibold' };
    return { text: 'Weak', color: 'text-rose-400 font-semibold' };
  };

  const labelInfo = getLabel();

  return (
    <div className="space-y-1 pt-1">
      <div className="flex justify-between text-[10px] font-mono text-slate-400">
        <span>Password Strength</span>
        <span className={labelInfo.color}>{labelInfo.text}</span>
      </div>

      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex gap-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full flex-1 rounded-full transition-all duration-300 ${
              score >= step
                ? score >= 3
                  ? 'bg-emerald-400'
                  : score === 2
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
                : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
