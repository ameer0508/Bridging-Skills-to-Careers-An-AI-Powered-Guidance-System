import React from 'react';
import { AlertTriangle, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface IGapItem {
  skillName: string;
  impactScore: number;
  reason: string;
}

interface CriticalGapActionDrawerProps {
  criticalGaps?: IGapItem[];
  weakAreas?: IGapItem[];
  strengthAreas?: IGapItem[];
}

export const CriticalGapActionDrawer: React.FC<CriticalGapActionDrawerProps> = ({
  criticalGaps = [],
  weakAreas = [],
  strengthAreas = [],
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* CRITICAL SKILL GAPS & WEAK AREAS */}
      <div className="p-6 rounded-3xl bg-slate-950/70 border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              Critical Skill Gaps & Action Priorities
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[9px] font-bold border border-rose-500/30">
            {criticalGaps.length + weakAreas.length} Gaps
          </span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
          {criticalGaps.length > 0 ? (
            criticalGaps.map((gap, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                  <span>{gap.skillName}</span>
                  <span className="text-[10px] font-mono text-rose-400">Impact: -{gap.impactScore || 30}%</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{gap.reason || 'Required for target role readiness threshold.'}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No critical missing skill gaps detected!</p>
          )}

          {weakAreas.map((weak, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span>{weak.skillName} (Weak Area)</span>
                <span className="text-[10px] font-mono text-amber-400">Impact: -{weak.impactScore || 15}%</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{weak.reason || 'Evidence score is below 50% threshold.'}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/roadmap')}
          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <span>Generate Adaptive Roadmap for Missing Gaps</span>
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* STRENGTH AREAS */}
      <div className="p-6 rounded-3xl bg-slate-950/70 border border-white/10 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              Verified Core Strengths
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/30">
            {strengthAreas.length} Strengths
          </span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
          {strengthAreas.length > 0 ? (
            strengthAreas.map((strength, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                  <span>{strength.skillName}</span>
                  <span className="text-[10px] font-mono text-emerald-400">Optimal Evidence</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{strength.reason || 'Strong evidence found across work experience and projects.'}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">Upload your resume to index core skill strengths.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CriticalGapActionDrawer;
