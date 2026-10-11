import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  Cpu,
  Target,
  Layers,
  Compass,
  ArrowRight,
  ShieldCheck,
  Activity,
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
      desc: 'ATS resume parsing extracts verified skills and experience history.',
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
      desc: 'Verified skills form your multidimensional technical competency matrix.',
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
    <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-indigo-950/20 via-slate-900/80 to-slate-950/90 p-6 md:p-8 lg:p-10 shadow-2xl backdrop-blur-xl space-y-8">
      {/* Background ambient light */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-indigo-500/10 blur-[140px]" />

      <div className="relative z-10 space-y-4 text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          The Telemetry Calibration Pipeline
        </span>

        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Your Progress Story Starts Here
        </h3>

        <p className="text-sm text-slate-300 leading-relaxed">
          Progress analytics is not a static score—it is a living temporal observation engine. As you advance through each stage below, SkillBridge captures daily telemetry to plot your trajectory toward <span className="text-indigo-300 font-semibold">{targetRoleTitle}</span>.
        </p>
      </div>

      {/* 4 Pipeline Stages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {stages.map((stg, idx) => {
          const IconComp = stg.icon;
          return (
            <div
              key={stg.step}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                stg.active
                  ? 'border-white/15 bg-slate-900/80 shadow-md'
                  : 'border-white/5 bg-slate-950/40 opacity-80 hover:opacity-100 hover:border-white/10'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-500">
                    STAGE {stg.step}
                  </span>
                  {stg.active ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                      Pending
                    </span>
                  )}
                </div>

                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200">
                  <IconComp className="w-5 h-5" />
                </div>

                <h4 className="text-sm font-bold text-white tracking-tight">
                  {stg.title}
                </h4>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {stg.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 space-y-2">
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  Status: <span className="text-slate-200 font-semibold">{stg.statusLabel}</span>
                </div>

                <button
                  onClick={() => navigate(stg.route)}
                  type="button"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-indigo-600/20 hover:border-indigo-500/40 text-xs font-medium text-slate-200 hover:text-white border border-white/10 transition cursor-pointer"
                >
                  <span>{stg.actionLabel}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
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
