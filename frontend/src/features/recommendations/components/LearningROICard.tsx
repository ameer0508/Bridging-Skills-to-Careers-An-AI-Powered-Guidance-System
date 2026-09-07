import React from 'react';
import { Clock, ShieldCheck, Zap } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface LearningROIProps {
  itemType: string;
  roiLevel: 'Exceptional' | 'Very High' | 'High' | 'Moderate';
  learningTime: string;
  difficulty: string;
}

export const LearningROICard: React.FC<LearningROIProps> = ({
  itemType,
  roiLevel = 'Exceptional',
  learningTime = '2-3 weeks',
  difficulty = 'Intermediate'
}) => {
  const getRoiColor = (roi: string) => {
    switch (roi) {
      case 'Exceptional':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Very High':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'High':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-white/10';
    }
  };

  return (
    <div className="p-3.5 bg-slate-950/60 border border-white/5 rounded-xl space-y-2 text-xs font-mono">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-slate-500 uppercase font-bold">Learning ROI:</span>
        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getRoiColor(roiLevel)}`}>
          {roiLevel} ROI
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
        <div>
          <span className="text-slate-500 block text-[10px]">Estimated Time:</span>
          <span className="text-slate-200 font-bold">{learningTime}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">Difficulty Level:</span>
          <span className="text-purple-300 font-bold">{difficulty}</span>
        </div>
      </div>
    </div>
  );
};
