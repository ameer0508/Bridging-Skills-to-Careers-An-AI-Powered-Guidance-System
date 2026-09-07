import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, CheckCircle2, Target, ArrowRight, Award, Zap } from 'lucide-react';
import { GlassCard } from '../cards/GlassCard';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface JourneyStep {
  id: string;
  title: string;
  subtitle: string;
  status: 'completed' | 'active' | 'upcoming';
  category: string;
}

export interface CareerJourneyMapProps {
  steps?: JourneyStep[];
  targetRoleTitle?: string;
  className?: string;
}

export const CareerJourneyMap: React.FC<CareerJourneyMapProps> = ({
  steps,
  targetRoleTitle = 'Target Career Role',
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const defaultSteps: JourneyStep[] = steps || [
    {
      id: 'step-1',
      title: 'Current Position',
      subtitle: 'Verified Skill Foundations',
      status: 'completed',
      category: 'Baseline',
    },
    {
      id: 'step-2',
      title: "Today's Priority Mission",
      subtitle: 'Active Milestone Execution',
      status: 'active',
      category: 'Current Focus',
    },
    {
      id: 'step-3',
      title: 'Phase 2: Advanced Topics',
      subtitle: 'Architecture & Scalability',
      status: 'upcoming',
      category: 'Next Phase',
    },
    {
      id: 'step-4',
      title: targetRoleTitle,
      subtitle: 'Career Mastery Destination',
      status: 'upcoming',
      category: 'Target Destination',
    },
  ];

  const selectedStep = defaultSteps.find((s) => s.id === selectedStepId) || defaultSteps[1];

  return (
    <GlassCard className={`p-6 space-y-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Career Journey Map</h3>
            <p className="text-xs text-neutral-400">
              Interactive trajectory from current competencies to target destination
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          Destination Guided
        </span>
      </div>

      {/* Visual Journey Track */}
      <div className="p-6 rounded-xl bg-black/40 border border-white/5 overflow-x-auto">
        <div className="flex items-center justify-between min-w-162.5 gap-4 relative">
          {/* Connecting Track Line */}
          <div className="absolute top-1/2 left-12 right-12 h-1 bg-linear-to-r from-emerald-500 via-indigo-500 to-amber-500 -translate-y-1/2 opacity-30 pointer-events-none" />

          {defaultSteps.map((step, index) => {
            const isSelected = selectedStep.id === step.id;

            return (
              <React.Fragment key={step.id}>
                {/* Node Box */}
                <motion.div
                  onClick={() => setSelectedStepId(step.id)}
                  whileHover={!prefersReducedMotion ? { y: -4, scale: 1.03 } : undefined}
                  className={`relative z-10 p-4 rounded-xl border transition-all cursor-pointer min-w-37.5 ${

                    step.status === 'completed'
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : step.status === 'active'
                      ? 'bg-indigo-950/50 border-indigo-500/80 text-white shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-500/50'
                      : 'bg-neutral-900/60 border-white/10 text-neutral-400'
                  } ${isSelected ? 'ring-2 ring-white' : ''}`}
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      0{index + 1}. {step.category}
                    </span>
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : step.status === 'active' ? (
                      <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                    ) : (
                      <Award className="w-4 h-4 text-neutral-500 shrink-0" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white leading-tight">{step.title}</h4>
                  <p className="text-[10px] text-neutral-400 mt-1 truncate">{step.subtitle}</p>
                </motion.div>

                {/* Arrow Step Connector */}
                {index < defaultSteps.length - 1 && (
                  <div className="z-10 text-neutral-500 shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Step Inspector */}
      {selectedStep && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-neutral-300">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">{selectedStep.title}</span>
              <span>{selectedStep.subtitle}</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {selectedStep.status}
          </span>
        </div>
      )}
    </GlassCard>
  );
};

export default CareerJourneyMap;
