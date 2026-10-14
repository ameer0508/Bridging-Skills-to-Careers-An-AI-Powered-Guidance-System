import React from 'react';
import { Layers, Zap, Award } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface MatrixItem {
  id: string;
  title: string;
  type: string;
  quadrant: 'Quick Win' | 'Major Capstone' | 'Filler' | 'Low Priority';
  impactBoost: number;
}

const defaultMatrixItems: MatrixItem[] = [
  { id: '1', title: 'Add Milvus Vector DB Terminology to Resume', type: 'resume_improvement', quadrant: 'Quick Win', impactBoost: 15.0 },
  { id: '2', title: 'Build Enterprise AI Microservices Capstone', type: 'project', quadrant: 'Major Capstone', impactBoost: 22.0 },
  { id: '3', title: 'AWS Certified Solutions Architect', type: 'certification', quadrant: 'Major Capstone', impactBoost: 18.0 },
  { id: '4', title: 'Clean Up Public GitHub Repositories', type: 'github_improvement', quadrant: 'Quick Win', impactBoost: 12.0 },
  { id: '5', title: 'Connect with 5 Lead AI Engineers on LinkedIn', type: 'networking', quadrant: 'Filler', impactBoost: 8.0 }
];

export const PriorityMatrix: React.FC<{ items?: MatrixItem[] }> = ({
  items = defaultMatrixItems
}) => {
  const quickWins = items.filter(i => i.quadrant === 'Quick Win');
  const majorCapstones = items.filter(i => i.quadrant === 'Major Capstone');

  return (
    <GlassPanel className="p-6 space-y-6 border-aurora-violet/25">
      <div className="flex items-center justify-between border-b border-aurora-line pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-aurora-violet/[0.06] text-aurora-violet rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-aurora-ink">Impact vs. Effort Priority Matrix</h3>
            <p className="text-xs text-aurora-muted">Visual quadrant plotting career impact against time investment</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-violet text-xs font-bold">
          4-Quadrant Matrix
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* QUADRANT 1: QUICK WINS */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Zap className="w-4 h-4" />
              ⚡ Quick Wins (High Impact / Low Time)
            </h4>
            <span className="text-[10px] text-emerald-700 font-bold">{quickWins.length} Items</span>
          </div>
          <div className="space-y-2">
            {quickWins.map(item => (
              <div key={item.id} className="p-3 bg-aurora-canvas/60 border border-emerald-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-aurora-ink truncate max-w-[200px]">{item.title}</span>
                  <span className="text-[10px] text-emerald-700 font-bold">+{item.impactBoost}% Gain</span>
                </div>
                <span className="text-[10px] text-aurora-muted uppercase">{item.type.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* QUADRANT 2: MAJOR CAPSTONES */}
        <div className="p-4 bg-aurora-violet/[0.06] border border-aurora-violet/25 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-aurora-indigo uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Award className="w-4 h-4" />
              🎯 Major Capstones (High Impact / High Time)
            </h4>
            <span className="text-[10px] text-aurora-indigo font-bold">{majorCapstones.length} Items</span>
          </div>
          <div className="space-y-2">
            {majorCapstones.map(item => (
              <div key={item.id} className="p-3 bg-aurora-canvas/60 border border-aurora-violet/25 rounded-xl text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-aurora-ink truncate max-w-[200px]">{item.title}</span>
                  <span className="text-[10px] text-aurora-violet font-bold">+{item.impactBoost}% Gain</span>
                </div>
                <span className="text-[10px] text-aurora-muted uppercase">{item.type.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};
