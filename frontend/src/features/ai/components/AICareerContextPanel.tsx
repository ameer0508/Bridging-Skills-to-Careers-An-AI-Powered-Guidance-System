import React from 'react';
import { motion } from 'framer-motion';
import { User, Target, ShieldCheck, AlertTriangle, Layers, Sparkles, Cpu } from 'lucide-react';

interface AICareerContextPanelProps {
  userName?: string;
  targetRole?: string;
  readinessScore?: number;
  totalSkills?: number;
  criticalGaps?: string[];
  activePhaseTitle?: string;
  topRecommendationTitle?: string;
}

export const AICareerContextPanel: React.FC<AICareerContextPanelProps> = ({
  userName = 'User',
  targetRole = 'Target Career Path',
  readinessScore,
  totalSkills = 0,
  criticalGaps = [],
  activePhaseTitle,
  topRecommendationTitle,
}) => {
  return (
    <aside aria-label="Your Career Context" className="w-80 bg-slate-950/80 border-r border-white/10 backdrop-blur-xl flex flex-col h-full overflow-y-auto custom-scrollbar p-4 space-y-5 select-none">
      {/* HEADER */}
      <div className="flex items-center gap-2 pb-3 border-b border-white/10">
        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
        <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest">
          Your Career Context
        </h3>
      </div>

      {/* SECTION 1: PROFILE & TARGET ROLE */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <User className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate">{userName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Target className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-semibold text-white truncate">{targetRole}</span>
        </div>
      </div>

      {/* CAREER CORE MINI NODE DIAGRAM */}
      <div className="relative p-4 rounded-2xl bg-linear-to-b from-indigo-950/40 via-slate-950/60 to-slate-950 border border-indigo-500/20 text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 to-cyan-400 p-[1px] mx-auto shadow-lg">
          <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-cyan-300 font-bold font-mono text-[10px]">
            CORE
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-400 block truncate">
          {targetRole.length > 22 ? targetRole.slice(0, 20) + '...' : targetRole}
        </span>

        <div className="pt-2 grid grid-cols-2 gap-1.5 text-[9px] font-mono">
          <span className="px-2 py-1 rounded bg-slate-900 border border-white/5 text-cyan-300">
            {totalSkills} Skills
          </span>
          <span className="px-2 py-1 rounded bg-slate-900 border border-white/5 text-emerald-300">
            {readinessScore !== undefined ? `${readinessScore}% Score` : 'Pending'}
          </span>
        </div>
      </div>

      {/* SECTION 2: READINESS & SKILLS */}
      <div className="space-y-3">
        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
          Platform Metrics
        </span>

        {readinessScore !== undefined && (
          <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-300 font-medium">Readiness Rating</span>
            </div>
            <span className="font-display font-bold text-xs text-emerald-400">
              {readinessScore}%
            </span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-300 font-medium">Verified Skill Nodes</span>
          </div>
          <span className="font-display font-bold text-xs text-cyan-400">
            {totalSkills}
          </span>
        </div>
      </div>

      {/* SECTION 3: SKILL GAPS */}
      {criticalGaps.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
            Critical Skill Gaps
          </span>
          <div className="space-y-1.5">
            {criticalGaps.slice(0, 3).map((gap, i) => (
              <div key={i} className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs text-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{gap}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: ROADMAP & RECOMMENDATION */}
      {(activePhaseTitle || topRecommendationTitle) && (
        <div className="space-y-3 pt-2 border-t border-white/10">
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
            Active Blueprint
          </span>

          {activePhaseTitle && (
            <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-400 font-bold">
                <Layers className="w-3.5 h-3.5" />
                <span>ACTIVE PHASE</span>
              </div>
              <p className="text-xs text-slate-200 font-semibold truncate">
                {activePhaseTitle}
              </p>
            </div>
          )}

          {topRecommendationTitle && (
            <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>TOP AI RECOMMENDATION</span>
              </div>
              <p className="text-xs text-slate-300 leading-tight line-clamp-2">
                {topRecommendationTitle}
              </p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default AICareerContextPanel;
