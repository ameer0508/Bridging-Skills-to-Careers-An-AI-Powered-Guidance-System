import React from 'react';
import { Sparkles } from 'lucide-react';

export interface WorkspaceDividerProps {
  label?: string;
  showNode?: boolean;
  className?: string;
}

export const WorkspaceDivider: React.FC<WorkspaceDividerProps> = ({
  label,
  showNode = true,
  className = '',
}) => {
  return (
    <div className={`relative flex items-center justify-center my-8 ${className}`}>
      {/* Background Gradient Line */}
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-aurora-line" />
      </div>

      {/* Center Label or Glowing Node */}
      {label ? (
        <div className="relative bg-aurora-canvas px-4 text-xs font-semibold uppercase tracking-widest text-aurora-indigo flex items-center gap-2 border border-aurora-line rounded-full py-1">
          <Sparkles className="w-3 h-3 text-aurora-violet" />
          <span>{label}</span>
        </div>
      ) : showNode ? (
        <div className="relative bg-aurora-canvas px-3 flex items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-linear-to-tr from-indigo-500 to-cyan-400 shadow-md shadow-indigo-500/50" />
        </div>
      ) : null}
    </div>
  );
};
