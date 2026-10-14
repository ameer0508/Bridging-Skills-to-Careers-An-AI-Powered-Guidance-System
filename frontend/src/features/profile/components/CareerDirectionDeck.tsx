import React from 'react';
import {
  Compass,
  ArrowRight,
  Award,
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
      <GlassPanel className="p-6 sm:p-8 space-y-6 border-aurora-violet/25">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-aurora-line">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-aurora-indigo flex items-center gap-2">
              <Compass className="w-4 h-4 text-aurora-indigo" />
              Where I'm Headed • Career Direction
            </span>
            <p className="text-[11px] text-aurora-muted">
              The primary north star guiding SkillBridge's skill gap extraction, roadmap generation, and live job matching.
            </p>
          </div>

          <button
            onClick={onEditDirection}
            type="button"
            className="px-3.5 py-1.5 rounded-xl bg-aurora-canvas hover:bg-aurora-canvas border border-aurora-line hover:border-aurora-violet/25 text-aurora-ink hover:text-aurora-indigo text-xs font-semibold flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
          >
            <Edit3 className="w-3.5 h-3.5 text-aurora-indigo" />
            <span>Modify Direction</span>
          </button>
        </div>

        {/* Primary Role Spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Direction Hero (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-3">
              <span className="text-[10px] uppercase font-bold text-aurora-muted block tracking-wider">
                Active Career Objective
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-aurora-ink tracking-tight">
                {targetRole || 'Undetermined Target Role'}
              </h2>
              <p className="text-xs text-aurora-indigo font-semibold">
                Domain: {primaryCareerDomain || 'General Software Engineering & Systems'}
              </p>

              {/* Specialization Tags */}
              {secondaryCareerDomains && secondaryCareerDomains.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] text-aurora-muted uppercase block font-semibold">
                    Specialized Competency Focus Areas:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {secondaryCareerDomains.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-xl bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo text-[10px] font-bold"
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
              <div className="p-4 rounded-2xl bg-aurora-canvas/60 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-aurora-muted block font-semibold">
                    Current Verified Capability Fit
                  </span>
                  <span className="text-2xl font-bold text-emerald-700">
                    {topMatchScore}% Alignment
                  </span>
                </div>
                <Award className="w-8 h-8 text-emerald-700/80" />
              </div>
            )}

            {/* Quick Cross-System Directives */}
            <div className="space-y-2">
              <span className="text-[10px] text-aurora-muted uppercase block font-semibold">
                Connected Career Systems:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => onNavigate('/careers')}
                  type="button"
                  className="p-3 rounded-xl bg-aurora-canvas/60 hover:bg-aurora-canvas border border-aurora-line hover:border-aurora-violet/25 text-left transition cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <strong className="text-xs text-aurora-ink block group-hover:text-aurora-indigo transition">
                      Career Intelligence
                    </strong>
                    <span className="text-[10px] text-aurora-muted">Evaluate match fit</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-aurora-muted group-hover:text-aurora-indigo transition" />
                </button>

                <button
                  onClick={() => onNavigate('/job-agent')}
                  type="button"
                  className="p-3 rounded-xl bg-aurora-canvas/60 hover:bg-aurora-canvas border border-aurora-line hover:border-aurora-violet/25 text-left transition cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <strong className="text-xs text-aurora-ink block group-hover:text-aurora-violet transition">
                      Live Opportunities
                    </strong>
                    <span className="text-[10px] text-aurora-muted">Discover matching jobs</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-aurora-muted group-hover:text-aurora-violet transition" />
                </button>

                <button
                  onClick={() => onNavigate('/roadmap')}
                  type="button"
                  className="p-3 rounded-xl bg-aurora-canvas/60 hover:bg-aurora-canvas border border-aurora-line hover:border-aurora-violet/25 text-left transition cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <strong className="text-xs text-aurora-ink block group-hover:text-aurora-violet transition">
                      Learning Roadmap
                    </strong>
                    <span className="text-[10px] text-aurora-muted">Bridge critical gaps</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-aurora-muted group-hover:text-aurora-violet transition" />
                </button>

                <button
                  onClick={() => onNavigate('/interview-agent')}
                  type="button"
                  className="p-3 rounded-xl bg-aurora-canvas/60 hover:bg-aurora-canvas border border-aurora-line hover:border-aurora-violet/25 text-left transition cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <strong className="text-xs text-aurora-ink block group-hover:text-emerald-700 transition">
                      Interview Studio
                    </strong>
                    <span className="text-[10px] text-aurora-muted">Simulate role scenarios</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-aurora-muted group-hover:text-emerald-700 transition" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};
