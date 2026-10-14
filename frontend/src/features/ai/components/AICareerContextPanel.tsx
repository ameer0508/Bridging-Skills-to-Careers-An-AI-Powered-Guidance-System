import React from 'react';
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
    <aside aria-label="Your Career Context" className="w-80 bg-aurora-canvas/60 border-r border-aurora-line backdrop-blur-xl flex flex-col h-full overflow-y-auto custom-scrollbar p-4 space-y-5 select-none">
      {/* HEADER */}
      <div className="flex items-center gap-2 pb-3 border-b border-aurora-line">
        <Sparkles className="w-4 h-4 text-aurora-violet shrink-0" />
        <h3 className="text-xs font-bold text-aurora-ink uppercase tracking-widest">
          Your Career Context
        </h3>
      </div>

      {/* SECTION 1: PROFILE & TARGET ROLE */}
      <div className="p-3.5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-aurora-muted">
          <User className="w-4 h-4 text-aurora-indigo shrink-0" />
          <span className="truncate">{userName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-aurora-muted">
          <Target className="w-4 h-4 text-aurora-violet shrink-0" />
          <span className="font-semibold text-aurora-ink truncate">{targetRole}</span>
        </div>
      </div>

      {/* CAREER CORE MINI NODE DIAGRAM */}
      <div className="relative p-4 rounded-2xl bg-linear-to-b from-aurora-sidebar via-white to-white border border-aurora-violet/25 text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-indigo-600 to-cyan-400 p-[1px] mx-auto shadow-lg">
          <div className="w-full h-full bg-aurora-canvas rounded-[15px] flex items-center justify-center text-aurora-violet font-bold text-[10px]">
            CORE
          </div>
        </div>
        <span className="text-[10px] text-aurora-muted block truncate">
          {targetRole.length > 22 ? targetRole.slice(0, 20) + '...' : targetRole}
        </span>

        <div className="pt-2 grid grid-cols-2 gap-1.5 text-[9px] font-mono">
          <span className="px-2 py-1 rounded bg-aurora-canvas border border-aurora-line text-aurora-violet">
            {totalSkills} Skills
          </span>
          <span className="px-2 py-1 rounded bg-aurora-canvas border border-aurora-line text-emerald-700">
            {readinessScore !== undefined ? `${readinessScore}% Score` : 'Pending'}
          </span>
        </div>
      </div>

      {/* SECTION 2: READINESS & SKILLS */}
      <div className="space-y-3">
        <span className="text-[10px] font-bold text-aurora-muted uppercase tracking-widest block">
          Platform Metrics
        </span>

        {readinessScore !== undefined && (
          <div className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-xs text-aurora-muted font-medium">Readiness Rating</span>
            </div>
            <span className="font-display font-bold text-xs text-emerald-700">
              {readinessScore}%
            </span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-aurora-violet" />
            <span className="text-xs text-aurora-muted font-medium">Verified Skill Nodes</span>
          </div>
          <span className="font-display font-bold text-xs text-aurora-violet">
            {totalSkills}
          </span>
        </div>
      </div>

      {/* SECTION 3: SKILL GAPS */}
      {criticalGaps.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-aurora-muted uppercase tracking-widest block">
            Critical Skill Gaps
          </span>
          <div className="space-y-1.5">
            {criticalGaps.slice(0, 3).map((gap, i) => (
              <div key={i} className="p-2 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{gap}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: ROADMAP & RECOMMENDATION */}
      {(activePhaseTitle || topRecommendationTitle) && (
        <div className="space-y-3 pt-2 border-t border-aurora-line">
          <span className="text-[10px] font-bold text-aurora-muted uppercase tracking-widest block">
            Active Blueprint
          </span>

          {activePhaseTitle && (
            <div className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-aurora-indigo font-bold">
                <Layers className="w-3.5 h-3.5" />
                <span>ACTIVE PHASE</span>
              </div>
              <p className="text-xs text-aurora-ink font-semibold truncate">
                {activePhaseTitle}
              </p>
            </div>
          )}

          {topRecommendationTitle && (
            <div className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-line space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>TOP AI RECOMMENDATION</span>
              </div>
              <p className="text-xs text-aurora-muted leading-tight line-clamp-2">
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
