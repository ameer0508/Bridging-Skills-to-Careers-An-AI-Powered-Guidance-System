import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  FileText,
  Compass,
  Cpu,
  UserCheck,
  BookOpen
} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface CareerIdentityCompletenessProps {
  hasName: boolean;
  hasLocation: boolean;
  hasBio: boolean;
  hasTargetRole: boolean;
  hasDomain: boolean;
  hasResume: boolean;
  totalSkills: number;
  atsScore?: number;
  onNavigate: (route: string) => void;
  onOpenStoryEditor: () => void;
  onOpenDirectionEditor: () => void;
}

export const CareerIdentityCompleteness: React.FC<CareerIdentityCompletenessProps> = ({
  hasName,
  hasLocation,
  hasBio,
  hasTargetRole,
  hasDomain,
  hasResume,
  totalSkills,
  atsScore,
  onNavigate,
  onOpenStoryEditor,
  onOpenDirectionEditor,
}) => {
  const pillars = [
    {
      id: 'identity',
      title: 'Identity Foundation',
      description: hasName && hasLocation
        ? 'Name, email and location are filled in.'
        : 'Missing location or primary profile name.',
      isComplete: hasName && hasLocation,
      missingNote: !hasLocation ? 'Add location to enable regional job matching' : 'Add full name',
      actionLabel: 'Edit Identity',
      onClick: () => {
        const heroBtn = document.querySelector('button') as HTMLButtonElement;
        heroBtn?.click();
      },
      icon: UserCheck,
    },
    {
      id: 'direction',
      title: 'Career Direction',
      description: hasTargetRole && hasDomain
        ? 'Target role and primary career domain established.'
        : 'Missing target role or career domain classification.',
      isComplete: hasTargetRole && hasDomain,
      missingNote: 'Set target role to anchor AI career intelligence',
      actionLabel: 'Set Direction',
      onClick: onOpenDirectionEditor,
      icon: Compass,
    },
    {
      id: 'story',
      title: 'Professional Narrative',
      description: hasBio
        ? 'Narrative bio and background context defined.'
        : 'No professional narrative or biography provided yet.',
      isComplete: hasBio,
      missingNote: 'Add a summary to ground career trajectory reasoning',
      actionLabel: 'Write Story',
      onClick: onOpenStoryEditor,
      icon: BookOpen,
    },
    {
      id: 'resume',
      title: 'Resume Evidence Base',
      description: hasResume
        ? `Active resume uploaded and parsed (ATS Score: ${atsScore || 'Evaluated'}/100).`
        : 'No resume attached. Upload PDF/DOCX to extract experience.',
      isComplete: hasResume,
      missingNote: 'Upload resume to ground skills and work history',
      actionLabel: 'Upload Resume',
      onClick: () => onNavigate('/resume'),
      icon: FileText,
    },
    {
      id: 'skills',
      title: 'Capability Map',
      description: totalSkills > 0
        ? `${totalSkills} skills on your profile.`
        : '0 skills cataloged. Add or verify skills to evaluate readiness.',
      isComplete: totalSkills > 0,
      missingNote: 'Verify skills to power role alignment & gap analysis',
      actionLabel: 'Explore Skills',
      onClick: () => onNavigate('/skills'),
      icon: Cpu,
    },
  ];

  const completedCount = pillars.filter((p) => p.isComplete).length;

  return (
    <div className="w-full tabular-nums">
      <GlassPanel className="p-6 sm:p-8 space-y-6 border-aurora-violet/25">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-aurora-line">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-aurora-indigo flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-aurora-indigo" />
              Career Identity Grounding & Completeness
            </span>
            <p className="text-[11px] text-aurora-muted">
              Evidence-based audit of the 5 core pillars powering SkillBridge's AI recommendation and match engines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-aurora-canvas border border-aurora-line text-xs font-bold text-aurora-muted">
              <strong className="text-emerald-700">{completedCount}</strong> of {pillars.length} Pillars Grounded
            </span>
          </div>
        </div>

        {/* 5-Pillar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 ${
                  pillar.isComplete
                    ? 'bg-aurora-canvas/60 border-aurora-line hover:border-emerald-200'
                    : 'bg-aurora-canvas/60 border-amber-200 hover:border-amber-200'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                          pillar.isComplete
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-aurora-ink tracking-tight">
                        {pillar.title}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        pillar.isComplete
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {pillar.isComplete ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          GROUNDED
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          ACTION NEEDED
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-[11px] text-aurora-muted leading-relaxed">
                    {pillar.description}
                  </p>

                  {!pillar.isComplete && (
                    <p className="text-[10px] text-amber-800 font-medium pt-1">
                      → {pillar.missingNote}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-aurora-line flex items-center justify-between">
                  <span className="text-[9px] text-aurora-muted uppercase">
                    {pillar.isComplete ? 'Complete' : 'Incomplete Context'}
                  </span>
                  <button
                    onClick={pillar.onClick}
                    type="button"
                    className="text-[11px] font-semibold text-aurora-indigo hover:text-aurora-indigo flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>{pillar.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </GlassPanel>
    </div>
  );
};
