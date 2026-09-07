import React from 'react';
import { Activity } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface ExtractionQualityProps {
  layoutType?: string;
  pageCount?: number;
  transformerModel?: string;
  extractionQualityScore?: number;
  isMultiColumn?: boolean;
  hasTables?: boolean;
}

export const ExtractionQualityMetrics: React.FC<ExtractionQualityProps> = ({
  layoutType = 'single_column_standard',
  pageCount = 1,
  transformerModel = 'all-MiniLM-L6-v2',
  extractionQualityScore = 98.4,
  isMultiColumn = false,
  hasTables: _hasTables = false
}) => {
  return (
    <GlassPanel className="p-5 border-cyan-500/30 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Transformer Layout & Extraction Quality</h4>
        </div>
        <span className="text-xs font-mono text-cyan-300 font-bold">Quality Index: {extractionQualityScore}%</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">Layout Detector</span>
          <span className="font-bold text-slate-200 capitalize">{layoutType.replace(/_/g, ' ')}</span>
        </div>

        <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">Doc Metrics</span>
          <span className="font-bold text-slate-200">{pageCount} Page • {isMultiColumn ? 'Multi-Col' : 'Single-Col'}</span>
        </div>

        <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">Active Model</span>
          <span className="font-bold text-emerald-400 truncate block">{transformerModel}</span>
        </div>

        <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-1">
          <span className="text-[10px] text-slate-500 block uppercase">Fallback Guard</span>
          <span className="font-bold text-indigo-300">Safeguard Ready</span>
        </div>
      </div>
    </GlassPanel>
  );
};
