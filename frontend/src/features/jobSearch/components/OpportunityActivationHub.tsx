import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  ArrowRight,
  FileText,
  Cpu,
  RefreshCw,
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
    <div className="relative overflow-hidden rounded-3xl border border-aurora-violet/25 bg-white [background-image:linear-gradient(135deg,rgb(167_139_250/0.10),transparent_60%)] p-8 md:p-12 shadow-aurora-md backdrop-blur-xl space-y-8 text-center max-w-3xl mx-auto">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-aurora-violet/[0.06] blur-[140px]" />

      <div className="relative z-10 space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25">
          <Sparkles className="w-3.5 h-3.5 text-aurora-indigo" />
          Opportunity Discovery Calibration
        </span>

        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-aurora-ink">
          Refine Your Search Parameters
        </h3>

        <p className="text-sm text-aurora-muted max-w-xl mx-auto leading-relaxed">
          No live employer opportunities matched your exact combination of keyword and location filters. Broaden your search or reset to your primary career target: <strong className="text-aurora-indigo">{targetRoleTitle}</strong>.
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={onResetFilters}
            type="button"
            className="py-2.5 px-5 rounded-2xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-xs font-bold text-aurora-ink shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Search to {targetRoleTitle}</span>
          </button>
        </div>
      </div>

      {/* Profile Grounding Pathways */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-aurora-line relative z-10 text-left">
        <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-2">
          <div className="flex items-center justify-between text-xs text-aurora-muted">
            <span>RESUME VAULT</span>
            <FileText className="w-3.5 h-3.5 text-aurora-indigo" />
          </div>
          <p className="text-xs text-aurora-muted">
            {hasResume ? 'ATS Resume uploaded and indexed.' : 'Upload your resume to extract skills.'}
          </p>
          <button
            onClick={() => navigate('/resume')}
            className="text-[11px] text-aurora-indigo hover:text-aurora-indigo font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>{hasResume ? 'Inspect Resume' : 'Upload Resume'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-2">
          <div className="flex items-center justify-between text-xs text-aurora-muted">
            <span>SKILL ENGINE</span>
            <Cpu className="w-3.5 h-3.5 text-aurora-violet" />
          </div>
          <p className="text-xs text-aurora-muted">
            {totalSkills > 0 ? `${totalSkills} skills on your profile.` : 'Add skills to match live job requirements.'}
          </p>
          <button
            onClick={() => navigate('/skills')}
            className="text-[11px] text-aurora-violet hover:text-aurora-violet font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>Skill Matrix</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-2">
          <div className="flex items-center justify-between text-xs text-aurora-muted">
            <span>CAREER PATH</span>
            <Compass className="w-3.5 h-3.5 text-aurora-violet" />
          </div>
          <p className="text-xs text-aurora-muted">
            Targeting {targetRoleTitle}.
          </p>
          <button
            onClick={() => navigate('/careers')}
            className="text-[11px] text-aurora-violet hover:text-aurora-violet font-semibold flex items-center gap-1 cursor-pointer"
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
