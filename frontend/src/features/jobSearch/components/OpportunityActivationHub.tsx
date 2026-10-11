import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  Sparkles,
  ArrowRight,
  FileText,
  Cpu,
  Target,
  Briefcase,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

export interface OpportunityActivationHubProps {
  onResetFilters: () => void;
  targetRoleTitle: string;
  hasResume: boolean;
  totalSkills: number;
}

export const OpportunityActivationHub: React.FC<OpportunityActivationHubProps> = ({
  onResetFilters,
  targetRoleTitle,
  hasResume,
  totalSkills,
}) => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 via-slate-900/80 to-slate-950/90 p-8 md:p-12 shadow-2xl backdrop-blur-xl space-y-8 text-center max-w-3xl mx-auto">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-indigo-500/10 blur-[140px]" />

      <div className="relative z-10 space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Opportunity Discovery Calibration
        </span>

        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Refine Your Search Parameters
        </h3>

        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          No live employer opportunities matched your exact combination of keyword and location filters. Broaden your search or reset to your primary career target: <strong className="text-indigo-300">{targetRoleTitle}</strong>.
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onResetFilters}
            type="button"
            className="py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Search to {targetRoleTitle}</span>
          </button>
        </div>
      </div>

      {/* Profile Grounding Pathways */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5 relative z-10 text-left">
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>RESUME VAULT</span>
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="text-xs text-slate-300">
            {hasResume ? 'ATS Resume uploaded and indexed.' : 'Upload your resume to extract skills.'}
          </p>
          <button
            onClick={() => navigate('/resume')}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>{hasResume ? 'Inspect Resume' : 'Upload Resume'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>SKILL ENGINE</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-xs text-slate-300">
            {totalSkills > 0 ? `${totalSkills} verified skills recorded.` : 'Add skills to match live job requirements.'}
          </p>
          <button
            onClick={() => navigate('/skills')}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Skill Matrix</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>CAREER PATH</span>
            <Compass className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-xs text-slate-300">
            Targeting {targetRoleTitle}.
          </p>
          <button
            onClick={() => navigate('/careers')}
            className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Career Targets</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

OpportunityActivationHub.displayName = 'OpportunityActivationHub';
