import React from 'react';
import {
  Compass,
  Target,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
  Award,
  Briefcase,
  Edit3
} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface CareerDirectionDeckProps {
  targetRole: string;
  primaryCareerDomain: string;
  secondaryCareerDomains: string[];
  topMatchScore?: number | null;
  onNavigate: (route: string) => void;
  onEditDirection: () => void;
}

export const CareerDirectionDeck: React.FC<CareerDirectionDeckProps> = ({
  targetRole,
  primaryCareerDomain,
  secondaryCareerDomains,
  topMatchScore,
  onNavigate,
  onEditDirection,
}) => {
  return (
    <div className="w-full font-mono">
      <GlassPanel className="p-6 sm:p-8 space-y-6 border-indigo-500/30">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              Where I'm Headed • Career Direction
            </span>
            <p className="text-[11px] text-slate-400">
              The primary north star guiding SkillBridge's skill gap extraction, roadmap generation, and live job matching.
            </p>
          </div>

          <button
            onClick={onEditDirection}
            type="button"
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 hover:border-indigo-500/40 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Modify Direction</span>
          </button>
        </div>

        {/* Primary Role Spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Direction Hero (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Active Career Objective
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {targetRole || 'Undetermined Target Role'}
              </h2>
              <p className="text-xs text-indigo-300 font-semibold">
                Domain: {primaryCareerDomain || 'General Software Engineering & Systems'}
              </p>

              {/* Specialization Tags */}
              {secondaryCareerDomains && secondaryCareerDomains.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Specialized Competency Focus Areas:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {secondaryCareerDomains.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold"
                      >
                        # {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alignment Telemetry & Quick Subsystem Links (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Real Match Score if Evaluated */}
            {typeof topMatchScore === 'number' && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                    Current Verified Capability Fit
                  </span>
                  <span className="text-2xl font-bold text-emerald-400">
                    {topMatchScore}% Alignment
                  </span>
                </div>
                <Award className="w-8 h-8 text-emerald-400/80" />
              </div>
            )}

            {/* Quick Cross-System Directives */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                Connected Career Systems:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigate('/careers')}
                  type="button"
                  className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/30 text-left transition cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <strong className="text-xs text-white block group-hover:text-indigo-300 transition">
                      Career Intelligence
                    </strong>
                    <span className="text-[10px] text-slate-400">Evaluate match fit</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
                </button>

                <button
                  onClick={() => onNavigate('/job-agent')}
                  type="button"
                  className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/30 text-left transition cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <strong className="text-xs text-white block group-hover:text-cyan-300 transition">
                      Live Opportunities
                    </strong>
                    <span className="text-[10px] text-slate-400">Discover matching jobs</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
                </button>

                <button
                  onClick={() => onNavigate('/roadmap')}
                  type="button"
                  className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/30 text-left transition cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <strong className="text-xs text-white block group-hover:text-purple-300 transition">
                      Learning Roadmap
                    </strong>
                    <span className="text-[10px] text-slate-400">Bridge critical gaps</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition" />
                </button>

                <button
                  onClick={() => onNavigate('/interview-agent')}
                  type="button"
                  className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/5 hover:border-indigo-500/30 text-left transition cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <strong className="text-xs text-white block group-hover:text-emerald-300 transition">
                      Interview Studio
                    </strong>
                    <span className="text-[10px] text-slate-400">Simulate role scenarios</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};
