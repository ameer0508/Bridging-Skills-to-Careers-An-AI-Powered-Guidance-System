import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

export interface SpatialCareerTrajectoryProps {
  hasTargetRole: boolean;
  targetRole: string;
  hasResume: boolean;
  totalSkills: number;
  readinessScore: number | null;
  roadmapProgress: number;
  savedOpportunitiesCount: number;
  interviewsCount: number;
  onNavigate: (route: string) => void;
  onHoverStage?: (domainId: string | null) => void;
}

export const SpatialCareerTrajectory: React.FC<SpatialCareerTrajectoryProps> = ({
  targetRole,
  hasResume,
  totalSkills,
  readinessScore,
  roadmapProgress,
  savedOpportunitiesCount,
  interviewsCount,
  onNavigate,
  onHoverStage,
}) => {
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);

  // Compute actual progression along the 6 trajectory stations
  const isStage1Complete = hasResume;
  const isStage2Complete = totalSkills > 0;
  const isStage3Complete = readinessScore !== null && readinessScore >= 60;
  const isStage4Complete = savedOpportunitiesCount > 0;
  const isStage5Complete = interviewsCount > 0;
  const isStage6Complete = readinessScore !== null && readinessScore >= 85 && isStage5Complete;

  // Determine current active focal stage
  let activeIndex: number;
  if (!isStage1Complete) activeIndex = 0;
  else if (!isStage2Complete) activeIndex = 1;
  else if (!isStage3Complete) activeIndex = 2;
  else if (!isStage4Complete) activeIndex = 3;
  else if (!isStage5Complete) activeIndex = 4;
  else activeIndex = 5;

  const stages = [
    {
      id: 'current',
      domainId: 'resume',
      index: 0,
      label: 'Profile Foundation',
      shortName: 'Foundation',
      status: isStage1Complete ? 'completed' : activeIndex === 0 ? 'current' : 'upcoming',
      metric: hasResume ? 'Resume Verified' : 'Awaiting Upload',
      route: '/resume',
      description: 'Baseline experience, career domain, and credentials parsed.',
    },
    {
      id: 'capability',
      domainId: 'skills',
      index: 1,
      label: 'Capability Building',
      shortName: 'Capabilities',
      status: isStage2Complete ? 'completed' : activeIndex === 1 ? 'current' : 'upcoming',
      metric: `${totalSkills} Verified Skills`,
      route: '/skills',
      description: 'Extracted competencies, taxonomy verification, and strengths.',
    },
    {
      id: 'readiness',
      domainId: 'readiness',
      index: 2,
      label: 'Readiness Alignment',
      shortName: 'Readiness',
      status: isStage3Complete ? 'completed' : activeIndex === 2 ? 'current' : 'upcoming',
      metric: readinessScore !== null ? `${Math.round(readinessScore)}% Benchmark` : 'Uncalculated',
      route: '/readiness',
      description: 'Competency gap analysis and role-fit benchmark scores.',
    },
    {
      id: 'market',
      domainId: 'opportunities',
      index: 3,
      label: 'Market Radar',
      shortName: 'Market',
      status: isStage4Complete ? 'completed' : activeIndex === 3 ? 'current' : 'upcoming',
      metric: `${savedOpportunitiesCount} Opportunities`,
      route: '/opportunities',
      description: 'Tailored openings mapped to verified capabilities.',
    },
    {
      id: 'interview',
      domainId: 'interview-agent',
      index: 4,
      label: 'Interview Coaching',
      shortName: 'Interviews',
      status: isStage5Complete ? 'completed' : activeIndex === 4 ? 'current' : 'upcoming',
      metric: `${interviewsCount} Rounds`,
      route: '/interview-agent',
      description: 'Interactive voice simulation and technical defense practice.',
    },
    {
      id: 'target',
      domainId: 'target',
      index: 5,
      label: targetRole || 'Target Career Summit',
      shortName: 'Career Summit',
      status: isStage6Complete ? 'completed' : activeIndex === 5 ? 'current' : 'upcoming',
      metric: `${Math.round(roadmapProgress)}% Trajectory`,
      route: '/roadmap',
      description: 'Offer acquisition and transition into your destination role.',
    },
  ];

  return (
    <div className="spatial-glass-blade p-6 sm:p-10 space-y-8 relative overflow-hidden">
      {/* Trajectory Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-white/[0.06] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-300 font-semibold">
              Continuous Trajectory
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Career Trajectory
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Luminous progression stream connecting your current foundation to your career destination.
          </p>
        </div>

        <MagneticButton
          onClick={() => onNavigate('/roadmap')}
          className="spatial-ghost-btn group text-xs py-2 px-4 self-start sm:self-center"
        >
          <span>View Full Roadmap</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </MagneticButton>
      </div>

      {/* Trajectory River Pathway */}
      <div className="relative pt-4 pb-2 z-10">
        {/* Continuous Connecting Vector Track */}
        <div className="hidden md:block absolute top-[52px] left-[8%] right-[8%] h-1 bg-white/[0.06] rounded-full overflow-hidden">
          {/* Animated Energy Beam */}
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${Math.min(100, Math.max(12, (activeIndex / 5) * 100))}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.8)] relative"
          >
            <span className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_12px_#ffffff] animate-ping" />
          </motion.div>
        </div>

        {/* Stations across the trajectory */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 sm:gap-3 relative">
          {stages.map((stage) => {
            const isCompleted = stage.status === 'completed';
            const isCurrent = stage.status === 'current';
            const isHovered = hoveredStageId === stage.id;

            return (
              <motion.div
                key={stage.id}
                whileHover={{ y: -4 }}
                onMouseEnter={() => {
                  setHoveredStageId(stage.id);
                  onHoverStage?.(stage.domainId);
                }}
                onMouseLeave={() => {
                  setHoveredStageId(null);
                  onHoverStage?.(null);
                }}
                onClick={() => onNavigate(stage.route)}
                className={`p-4 rounded-2xl border backdrop-blur-xl cursor-pointer transition-all flex flex-col justify-between space-y-3 relative group select-none ${
                  isCurrent
                    ? 'bg-gradient-to-b from-amber-500/15 to-black/60 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/30'
                    : isCompleted
                    ? 'bg-black/50 border-emerald-500/30 hover:border-emerald-400/60'
                    : 'bg-black/30 border-white/[0.06] hover:border-white/20 opacity-60 hover:opacity-90'
                }`}
              >
                {/* Station Node Badge */}
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs transition-transform group-hover:scale-110 ${
                      isCurrent
                        ? 'bg-amber-400 text-black shadow-[0_0_15px_#f59e0b]'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <span>0{stage.index + 1}</span>
                    )}
                  </div>

                  {isCurrent && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </div>

                {/* Station Meta */}
                <div className="space-y-1">
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider block ${
                      isCurrent
                        ? 'text-amber-300 font-bold'
                        : isCompleted
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {stage.shortName}
                  </span>
                  <h4 className="text-xs font-bold text-white tracking-tight leading-snug line-clamp-2">
                    {stage.label}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {stage.metric}
                  </p>
                </div>

                {/* Hover disclosure tooltip */}
                {isHovered && (
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-48 p-2 rounded-xl bg-slate-950 border border-white/20 text-[10px] text-slate-300 backdrop-blur-2xl shadow-2xl z-50 text-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                    {stage.description}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
