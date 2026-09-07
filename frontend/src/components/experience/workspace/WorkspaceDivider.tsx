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
        <div className="w-full border-t border-white/10" />
      </div>

      {/* Center Label or Glowing Node */}
      {label ? (
        <div className="relative bg-slate-950 px-4 text-xs font-mono font-semibold uppercase tracking-widest text-indigo-400 flex items-center gap-2 border border-white/10 rounded-full py-1 backdrop-blur-md">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>{label}</span>
        </div>
      ) : showNode ? (
        <div className="relative bg-slate-950 px-3 flex items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-linear-to-tr from-indigo-500 to-cyan-400 shadow-md shadow-indigo-500/50" />
        </div>
      ) : null}
    </div>
  );
};
