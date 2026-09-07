import React from 'react';
import { Target, ShieldCheck, AlertTriangle, ChevronRight, Sparkles } from 'lucide-react';

interface ICareerMatch {
  id: string;
  careerId: {
    _id: string;
    title: string;
    category: string;
    description: string;
  };
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  confidence: number;
}

interface CareerObservatoryGridProps {
  matches: ICareerMatch[];
  onSelectMatch: (match: ICareerMatch) => void;
}

export const CareerObservatoryGrid: React.FC<CareerObservatoryGridProps> = ({
  matches,
  onSelectMatch,
}) => {
  if (matches.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-slate-950/70 border border-white/10 text-center space-y-2">
        <Target className="w-8 h-8 text-slate-500 mx-auto" />
        <h4 className="text-sm font-bold text-white">No Career Matches Found</h4>
        <p className="text-xs text-slate-400">Ensure your resume is parsed and skills are mapped.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {matches.map((match) => {
        const isHighFit = match.matchScore >= 80;
        const isMedFit = match.matchScore >= 60 && match.matchScore < 80;

        return (
          <div
            key={match.id}
            onClick={() => onSelectMatch(match)}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-6 hover:border-indigo-500/40 hover:bg-slate-900/80 transition-all cursor-pointer space-y-5 shadow-xl flex flex-col justify-between"
          >
            {/* Top Accent Gauge Bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r ${
                isHighFit
                  ? 'from-emerald-500 to-cyan-400'
                  : isMedFit
                  ? 'from-indigo-500 to-purple-500'
                  : 'from-amber-500 to-rose-500'
              }`}
            />

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold border border-indigo-500/30 uppercase">
                    {match.careerId.category}
                  </span>
                  <h3 className="font-display text-lg font-bold text-white group-hover:text-cyan-300 transition-colors mt-1">
                    {match.careerId.title}
                  </h3>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-display text-2xl font-extrabold block ${
                      isHighFit
                        ? 'text-emerald-400'
                        : isMedFit
                        ? 'text-cyan-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {match.matchScore}%
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">
                    Fit Score
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {match.careerId.description}
              </p>
            </div>

            {/* Skill Alignment Summary */}
            <div className="space-y-2 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {match.matchingSkills?.length || 0} Matched
                </span>
                <span className="flex items-center gap-1 text-rose-400 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {match.missingSkills?.length || 0} Gaps
                </span>
              </div>

              <div className="flex flex-wrap gap-1">
                {match.matchingSkills?.slice(0, 3).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono"
                  >
                    {skill}
                  </span>
                ))}
                {match.missingSkills?.slice(0, 2).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-mono"
                  >
                    -{skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer Action Trigger */}
            <div className="pt-2 flex items-center justify-between text-xs font-mono text-cyan-400 group-hover:text-cyan-300">
              <span className="font-bold">Inspect Deep-Dive Analysis</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CareerObservatoryGrid;
