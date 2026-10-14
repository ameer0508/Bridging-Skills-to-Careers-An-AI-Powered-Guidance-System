import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  Cpu,
  Target,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export interface ProgressStoryActivationHubProps {
  hasResume: boolean;
  totalSkills: number;
  hasTargetRole: boolean;
  targetRoleTitle: string;
  roadmapProgress: number;
  hasRoadmap: boolean;
}

export const ProgressStoryActivationHub: React.FC<ProgressStoryActivationHubProps> = ({
  hasResume,
  totalSkills,
  hasTargetRole,
  targetRoleTitle,
  roadmapProgress,
  hasRoadmap,
}) => {
  const navigate = useNavigate();

  const stages = [
    {
      step: '01',
      title: 'Evidence Ingestion',
      desc: 'ATS resume parsing extracts skills and experience history.',
      icon: FileText,
      active: hasResume,
      statusLabel: hasResume ? 'Evidence Active' : 'Resume Needed',
      actionLabel: hasResume ? 'View Resume' : 'Upload Resume',
      route: '/resume',
      color: 'indigo',
    },
    {
      step: '02',
      title: 'Capability Mapping',
      desc: 'Your skills form your multidimensional technical competency matrix.',
      icon: Cpu,
      active: totalSkills > 0,
      statusLabel: totalSkills > 0 ? `${totalSkills} Skills Indexed` : 'Add Skills',
      actionLabel: 'Skill Intelligence',
      route: '/skills',
      color: 'cyan',
    },
    {
      step: '03',
      title: 'Readiness Diagnostic',
      desc: 'Evaluates your empirical qualification fit for your targeted career path.',
      icon: Target,
      active: hasTargetRole,
      statusLabel: hasTargetRole ? targetRoleTitle : 'Select Role',
      actionLabel: 'Career Readiness',
      route: '/readiness',
      color: 'purple',
    },
    {
      step: '04',
      title: 'Curriculum Velocity',
      desc: 'Sequenced roadmap milestones track your learning trajectory over time.',
      icon: Layers,
      active: hasRoadmap && roadmapProgress > 0,
      statusLabel: hasRoadmap ? `${roadmapProgress}% Complete` : 'Start Roadmap',
      actionLabel: 'Learning Journey',
      route: '/roadmap',
      color: 'emerald',
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-aurora-violet/25 bg-white [background-image:linear-gradient(135deg,rgb(167_139_250/0.10),transparent_60%)] p-6 md:p-8 lg:p-10 shadow-2xl space-y-8">
      {/* Background ambient light */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-aurora-violet/[0.06] blur-[140px]" />

      <div className="relative z-10 space-y-4 text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25">
          <Sparkles className="w-3.5 h-3.5 text-aurora-indigo" />
          The Telemetry Calibration Pipeline
        </span>

        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-aurora-ink">
          Your Progress Story Starts Here
        </h3>

        <p className="text-sm text-aurora-muted leading-relaxed">
          Progress analytics is not a static score—it is a living temporal observation engine. As you advance through each stage below, SkillBridge captures daily telemetry to plot your trajectory toward <span className="text-aurora-indigo font-semibold">{targetRoleTitle}</span>.
        </p>
      </div>

      {/* 4 Pipeline Stages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {stages.map((stg) => {
          const IconComp = stg.icon;
          return (
            <div
              key={stg.step}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                stg.active
                  ? 'border-aurora-line bg-aurora-canvas/60 shadow-md'
                  : 'border-aurora-line bg-aurora-canvas/60 opacity-80 hover:opacity-100 hover:border-aurora-line'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-aurora-muted">
                    STAGE {stg.step}
                  </span>
                  {stg.active ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-aurora-canvas text-aurora-muted">
                      Pending
                    </span>
                  )}
                </div>

                <div className="w-10 h-10 rounded-xl bg-aurora-canvas border border-aurora-line flex items-center justify-center text-aurora-ink">
                  <IconComp className="w-5 h-5" />
                </div>

                <h4 className="text-sm font-bold text-aurora-ink tracking-tight">
                  {stg.title}
                </h4>

                <p className="text-xs text-aurora-muted leading-relaxed">
                  {stg.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-aurora-line space-y-2">
                <div className="text-[11px] text-aurora-muted truncate">
                  Status: <span className="text-aurora-ink font-semibold">{stg.statusLabel}</span>
                </div>

                <button
                  onClick={() => navigate(stg.route)}
                  type="button"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-aurora-canvas hover:bg-violet-50 hover:border-aurora-violet/25 text-xs font-medium text-aurora-ink hover:text-aurora-indigo border border-aurora-line transition cursor-pointer"
                >
                  <span>{stg.actionLabel}</span>
                  <ArrowRight className="w-3 h-3 text-aurora-muted" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

ProgressStoryActivationHub.displayName = 'ProgressStoryActivationHub';
