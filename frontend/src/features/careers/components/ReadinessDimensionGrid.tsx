import React from 'react';
import { Cpu, Briefcase, FolderGit2, GraduationCap } from 'lucide-react';

interface IDimension {
  name: string;
  score: number;
  weight: number;
}

interface ReadinessDimensionGridProps {
  dimensions: IDimension[];
  selectedDimension?: string | null;
  onSelectDimension?: (name: string | null) => void;
}

export const ReadinessDimensionGrid: React.FC<ReadinessDimensionGridProps> = ({
  dimensions,
  selectedDimension,
  onSelectDimension,
}) => {
  const getIcon = (name: string) => {
    if (name.includes('Technical')) return <Cpu className="w-5 h-5 text-indigo-400" />;
    if (name.includes('Experience')) return <Briefcase className="w-5 h-5 text-cyan-400" />;
    if (name.includes('Project')) return <FolderGit2 className="w-5 h-5 text-emerald-400" />;
    return <GraduationCap className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {dimensions.map((dim, idx) => {
        const isSelected = selectedDimension === dim.name;

        return (
          <div
            key={idx}
            onClick={() => onSelectDimension && onSelectDimension(isSelected ? null : dim.name)}
            className={`p-5 rounded-2xl border space-y-3 shadow-xl transition-all cursor-pointer ${
              isSelected
                ? 'bg-slate-900/95 border-cyan-500/60 shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                : 'bg-slate-950/70 border-white/10 hover:border-indigo-500/30 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
                {getIcon(dim.name)}
              </div>
              <div className="flex items-center gap-1">
                {isSelected && (
                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-500/30">
                    Focused
                  </span>
                )}
                <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono text-[9px] border border-white/10">
                  Weight: {(dim.weight * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-300">{dim.name}</h4>
              <div className="flex items-center justify-between text-lg font-extrabold text-white">
                <span>{dim.score}%</span>
                <span
                  className={`text-xs font-mono font-bold ${
                    dim.score >= 75
                      ? 'text-emerald-400'
                      : dim.score >= 50
                      ? 'text-cyan-400'
                      : 'text-amber-400'
                  }`}
                >
                  {dim.score >= 75 ? 'Optimal' : dim.score >= 50 ? 'Moderate' : 'Needs Action'}
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-linear-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-1.5 rounded-full"
                style={{ width: `${dim.score}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReadinessDimensionGrid;
