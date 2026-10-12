import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch,
  CheckCircle2,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useReducedMotion } from '../../../components/experience/hooks/useReducedMotion';

export interface DependencyItem {
  id: string;
  title: string;
  targetSkill?: string;
  prerequisites?: string[];
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  phaseOrder: number;
  category?: string;
  estimatedDuration?: string;
  careerRelevance?: string;
}

export interface DependencyTreeEngineProps {
  items: DependencyItem[];
  targetRoleTitle?: string | null;
  onSelectTask?: (taskId: string) => void;
  className?: string;
}

export const DependencyTreeEngine: React.FC<DependencyTreeEngineProps> = ({
  items,
  targetRoleTitle = 'Target Role',
  onSelectTask,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(items[0]?.id || null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  if (!items || items.length === 0) {
    return null;
  }

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];

  // Group items by phase order
  const phasesMap = new Map<number, DependencyItem[]>();
  items.forEach((item) => {
    const list = phasesMap.get(item.phaseOrder) || [];
    list.push(item);
    phasesMap.set(item.phaseOrder, list);
  });
  const phaseOrders = Array.from(phasesMap.keys()).sort((a, b) => a - b);

  // Find prerequisites & downstream dependents of selected/hovered item
  const activeFocusItem = items.find((i) => i.id === (hoveredItemId || selectedItemId)) || selectedItem;
  const activePrereqs = activeFocusItem?.prerequisites || [];
  const downstreamDependents = items.filter((i) =>
    i.prerequisites?.some((p) =>
      p.toLowerCase().includes(activeFocusItem?.title?.toLowerCase() || '') ||
      p.toLowerCase().includes(activeFocusItem?.targetSkill?.toLowerCase() || '')
    )
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Title & Concept Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <GitBranch className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Topological Dependency Tree Engine
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            A strictly-ordered execution plan. Answering: <strong className="text-cyan-400">“Why am I learning this now?”</strong>
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span>Upcoming</span>
          </div>
        </div>
      </div>

      {/* Main Graph Grid: Left DAG Canvas (8 cols), Right Dependency Inspector (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sequenced Stage Columns */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-slate-950/80 border border-white/10 backdrop-blur-xl shadow-xl overflow-x-auto space-y-6">
          <div className="flex items-start gap-6 min-w-[580px]">
            {phaseOrders.map((order) => {
              const phaseItems = phasesMap.get(order) || [];

              return (
                <div key={order} className="flex-1 space-y-3 min-w-[170px]">
                  {/* Column Header */}
                  <div className="pb-2 border-b border-white/10">
                    <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 tracking-wider block">
                      Phase {order} Tier
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {phaseItems.length} Milestones
                    </span>
                  </div>

                  {/* Nodes in this Phase */}
                  <div className="space-y-2.5">
                    {phaseItems.map((item) => {
                      const isSelected = item.id === selectedItemId;
                      const isCompleted = item.status === 'completed';
                      const isInProgress = item.status === 'in_progress';

                      // Determine if highlighted by active focus
                      const isPrerequisiteOfFocus = activePrereqs.some((p) =>
                        p.toLowerCase().includes(item.title.toLowerCase()) ||
                        p.toLowerCase().includes(item.targetSkill?.toLowerCase() || '')
                      );
                      const isDependentOfFocus = downstreamDependents.some((d) => d.id === item.id);

                      let nodeBorderColor = 'border-white/10';
                      if (isSelected) nodeBorderColor = 'border-indigo-400 ring-2 ring-indigo-500/40';
                      else if (isPrerequisiteOfFocus) nodeBorderColor = 'border-amber-400/80 ring-1 ring-amber-400/30';
                      else if (isDependentOfFocus) nodeBorderColor = 'border-cyan-400/80 ring-1 ring-cyan-400/30';
                      else if (isCompleted) nodeBorderColor = 'border-emerald-500/40';

                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedItemId(item.id);
                            if (onSelectTask) onSelectTask(item.id);
                          }}
                          onMouseEnter={() => setHoveredItemId(item.id)}
                          onMouseLeave={() => setHoveredItemId(null)}
                          whileHover={!prefersReducedMotion ? { y: -2, scale: 1.02 } : undefined}
                          className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${nodeBorderColor} ${
                            isSelected
                              ? 'bg-indigo-950/70 shadow-lg shadow-indigo-950/50'
                              : isCompleted
                              ? 'bg-emerald-950/20'
                              : isInProgress
                              ? 'bg-cyan-950/30'
                              : 'bg-black/40 hover:bg-slate-900/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5 mb-1.5">
                            <span
                              className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                                isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : isInProgress
                                  ? 'bg-cyan-500/20 text-cyan-300'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {item.status.replace('_', ' ')}
                            </span>
                            {item.prerequisites && item.prerequisites.length > 0 && (
                              <span className="text-[9px] font-mono text-amber-400/90 font-semibold">
                                {item.prerequisites.length} Req
                              </span>
                            )}
                          </div>

                          <h5 className="text-xs font-bold text-white line-clamp-2 mb-1">
                            {item.title}
                          </h5>

                          {item.targetSkill && (
                            <span className="text-[10px] text-slate-400 font-mono block truncate">
                              Skill: {item.targetSkill}
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Dependency Inspector */}
        <div className="lg:col-span-4 p-5 rounded-3xl bg-slate-900/90 border border-white/10 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Dependency Context
            </span>
            <span className="text-xs font-mono text-slate-400">
              Phase {activeFocusItem?.phaseOrder}
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">{activeFocusItem?.title}</h4>
            <p className="text-xs text-slate-400">
              Target Competency: <strong className="text-indigo-300">{activeFocusItem?.targetSkill || 'Core Knowledge'}</strong>
            </p>
          </div>

          {/* Why now explanation */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
            <strong className="text-cyan-400 block text-[11px] font-mono uppercase">
              Why Am I Learning This Now?
            </strong>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {activeFocusItem?.careerRelevance ||
                `Sequenced in Phase ${activeFocusItem?.phaseOrder} based on topological resolution of required competencies for ${targetRoleTitle}.`}
            </p>
          </div>

          {/* Prerequisites Chain */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase text-amber-400 font-bold block">
              Direct Prerequisites ({activePrereqs.length})
            </span>
            {activePrereqs.length > 0 ? (
              <div className="space-y-1.5">
                {activePrereqs.map((prereq, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{prereq}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Foundational Module (Zero Prerequisites)</span>
              </div>
            )}
          </div>

          {/* Enables Downstream Dependents */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <span className="text-[11px] font-mono uppercase text-indigo-400 font-bold block">
              Enables Next Stages
            </span>
            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>
                Unlocks {targetRoleTitle} readiness & downstream phase competencies.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DependencyTreeEngine;
