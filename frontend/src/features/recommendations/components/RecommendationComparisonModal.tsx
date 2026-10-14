import React from 'react';
import { X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-aurora-canvas/60 flex items-center justify-center p-4">
      <div className="bg-aurora-canvas border border-aurora-violet/25 rounded-2xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-aurora-line pb-4">
          <div>
            <h3 className="text-lg font-bold text-aurora-ink">Side-by-Side Recommendation Comparison</h3>
            <p className="text-xs text-aurora-muted">Evaluate impact, effort, and ROI tradeoffs between options</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-aurora-canvas rounded-lg text-aurora-muted hover:text-aurora-indigo transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(items.length, 3)} gap-4`}>
          {items.map(item => (
            <GlassPanel key={item.id} className="p-5 space-y-4 border-aurora-violet/25">
              <div className="space-y-1">
                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-aurora-violet/[0.06] text-aurora-indigo font-bold border border-aurora-violet/25">
                  {item.type.replace(/_/g, ' ')}
                </span>
                <h4 className="font-bold text-sm text-aurora-ink pt-1">{item.title}</h4>
              </div>

              <div className="space-y-2 text-xs pt-2 border-t border-aurora-line">
                <div className="flex justify-between">
                  <span className="text-aurora-muted">Gap impact:</span>
                  <span className="font-bold text-emerald-700">{item.readinessGain}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-aurora-muted">Match Gain:</span>
                  <span className="font-bold text-aurora-violet">+{item.matchGain}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-aurora-muted">Learning Time:</span>
                  <span className="font-bold text-aurora-ink">{item.learningTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-aurora-muted">Difficulty:</span>
                  <span className="font-bold text-aurora-violet">{item.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-aurora-muted">Learning ROI:</span>
                  <span className="font-bold text-amber-700">{item.learningRoi}</span>
                </div>
              </div>
            </GlassPanel>
          ))}
        </div>
      </div>
    </div>
  );
};
