import React from 'react';

export interface LearningROIProps {
  itemType: string;
  roiLevel: 'Exceptional' | 'Very High' | 'High' | 'Moderate';
  learningTime: string;
  difficulty: string;
}

export const LearningROICard: React.FC<LearningROIProps> = ({
  roiLevel = 'Exceptional',
  learningTime = '2-3 weeks',
  difficulty = 'Intermediate'
}) => {
  const getRoiColor = (roi: string) => {
    switch (roi) {
      case 'Exceptional':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Very High':
        return 'text-aurora-violet bg-aurora-violet/[0.06] border-aurora-violet/25';
      case 'High':
        return 'text-aurora-indigo bg-aurora-violet/[0.06] border-aurora-violet/25';
      default:
        return 'text-aurora-muted bg-aurora-canvas border-aurora-line';
    }
  };

  return (
    <div className="p-3.5 bg-aurora-canvas/60 border border-aurora-line rounded-xl space-y-2 text-xs tabular-nums">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-aurora-muted uppercase font-bold">Learning ROI:</span>
        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getRoiColor(roiLevel)}`}>
          {roiLevel} ROI
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
        <div>
          <span className="text-aurora-muted block text-[10px]">Estimated Time:</span>
          <span className="text-aurora-ink font-bold">{learningTime}</span>
        </div>
        <div>
          <span className="text-aurora-muted block text-[10px]">Difficulty Level:</span>
          <span className="text-aurora-violet font-bold">{difficulty}</span>
        </div>
      </div>
    </div>
  );
};
