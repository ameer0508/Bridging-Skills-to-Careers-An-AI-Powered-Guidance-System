import React from 'react';
import { CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

interface RoadmapPhaseItem {
  title: string;
  status: string;
}

interface RoadmapPhase {
  title: string;
  description?: string;
  items?: RoadmapPhaseItem[];
}

interface CareerOSRoadmapBlueprintProps {
  progressPercentage?: number;
  phases?: RoadmapPhase[];
  onViewFullRoadmap: () => void;
}

export const CareerOSRoadmapBlueprint: React.FC<CareerOSRoadmapBlueprintProps> = ({
  progressPercentage = 0,
  phases = [],
  onViewFullRoadmap,
}) => {
  if (phases.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-white">Active Milestone Roadmap</h3>
            <p className="text-xs text-slate-400">Week-by-week progress blueprint</p>
          </div>
          <button
            onClick={onViewFullRoadmap}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Generate Roadmap</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <GlassPanel className="p-8 text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
            <Layers className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white">No Active Roadmap Blueprint</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Select a target career match to generate your customized 7-week learning milestone plan.
          </p>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-white">Active Milestone Roadmap</h3>
          <p className="text-xs text-slate-400">Week-by-week progress blueprint ({progressPercentage}% Complete)</p>
        </div>
        <button
          onClick={onViewFullRoadmap}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View Full Roadmap</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {phases.slice(0, 3).map((item, idx) => {
          const completedCount = item.items?.filter((i) => i.status === 'completed').length || 0;
          const totalItems = item.items?.length || 0;

          return (
            <GlassPanel key={idx} className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-white/5 text-slate-400">
                  Phase {idx + 1}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {completedCount}/{totalItems} Items
                </span>
              </div>

              <h4 className="text-sm font-bold text-white">{item.title}</h4>
              {item.description && <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>}

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-white/5 pt-3">
                <span className="flex items-center gap-1 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  {totalItems} Modules
                </span>
              </div>
            </GlassPanel>
          );
        })}
      </div>
    </div>
  );
};

export default CareerOSRoadmapBlueprint;
