import React from 'react';
import { X, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface ComparisonItem {
  id: string;
  title: string;
  type: string;
  readinessGain: number;
  matchGain: number;
  learningTime: string;
  difficulty: string;
  learningRoi: string;
}

export interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ComparisonItem[];
}

export const RecommendationComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  items
}) => {
  if (!isOpen || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Side-by-Side Recommendation Comparison</h3>
            <p className="text-xs text-slate-400">Evaluate impact, effort, and ROI tradeoffs between options</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(items.length, 3)} gap-4`}>
          {items.map(item => (
            <GlassPanel key={item.id} className="p-5 space-y-4 border-indigo-500/20">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20">
                  {item.type.replace(/_/g, ' ')}
                </span>
                <h4 className="font-bold text-sm text-white pt-1">{item.title}</h4>
              </div>

              <div className="space-y-2 text-xs font-mono pt-2 border-t border-white/5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Readiness Boost:</span>
                  <span className="font-bold text-emerald-400">+{item.readinessGain}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Match Gain:</span>
                  <span className="font-bold text-cyan-400">+{item.matchGain}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Learning Time:</span>
                  <span className="font-bold text-slate-200">{item.learningTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Difficulty:</span>
                  <span className="font-bold text-purple-300">{item.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Learning ROI:</span>
                  <span className="font-bold text-amber-300">{item.learningRoi}</span>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      </div>
    </div>
  );
};
