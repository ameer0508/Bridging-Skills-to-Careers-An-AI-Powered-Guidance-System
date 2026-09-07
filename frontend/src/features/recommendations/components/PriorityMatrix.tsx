import React from 'react';
import { Layers, Zap, Clock, Award } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface MatrixItem {
  id: string;
  title: string;
  type: string;
  quadrant: 'Quick Win' | 'Major Capstone' | 'Filler' | 'Low Priority';
  impactBoost: number;
}

export const defaultMatrixItems: MatrixItem[] = [
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
  const fillers = items.filter(i => i.quadrant === 'Filler' || i.quadrant === 'Low Priority');

  return (
    <GlassPanel className="p-6 space-y-6 border-cyan-500/30">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Impact vs. Effort Priority Matrix</h3>
            <p className="text-xs text-slate-400">Visual quadrant plotting career impact against time investment</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
          4-Quadrant Matrix
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* QUADRANT 1: QUICK WINS */}
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Zap className="w-4 h-4" />
              ⚡ Quick Wins (High Impact / Low Time)
            </h4>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">{quickWins.length} Items</span>
          </div>
          <div className="space-y-2">
            {quickWins.map(item => (
              <div key={item.id} className="p-3 bg-slate-950/80 border border-emerald-500/20 rounded-xl text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white truncate max-w-[200px]">{item.title}</span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">+{item.impactBoost}% Gain</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">{item.type.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* QUADRANT 2: MAJOR CAPSTONES */}
        <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Award className="w-4 h-4" />
              🎯 Major Capstones (High Impact / High Time)
            </h4>
            <span className="text-[10px] font-mono text-indigo-400 font-bold">{majorCapstones.length} Items</span>
          </div>
          <div className="space-y-2">
            {majorCapstones.map(item => (
              <div key={item.id} className="p-3 bg-slate-950/80 border border-indigo-500/20 rounded-xl text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white truncate max-w-[200px]">{item.title}</span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">+{item.impactBoost}% Gain</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">{item.type.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};
