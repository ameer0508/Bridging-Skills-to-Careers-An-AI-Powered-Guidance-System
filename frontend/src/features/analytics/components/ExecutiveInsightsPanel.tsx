import React from 'react';
import { Brain, AlertCircle, Zap, TrendingUp, CheckCircle2 } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface ExecutiveInsightsProps {
  currentPosition?: string;
  primaryRisks?: string[];
  highestImpactNextAction?: string;
  longTermOutlook?: string;
}

export const ExecutiveInsightsPanel: React.FC<ExecutiveInsightsProps> = ({
  currentPosition = 'Solid technical foundation aligned with Senior AI Engineer requirements.',
  primaryRisks = [
    'System architecture metrics require additional portfolio capstone proof.'
  ],
  highestImpactNextAction = 'Build production Milvus vector retrieval backend capstone.',
  longTermOutlook = 'Exceptional (+38% projected compensation growth potential over 12 months).'
}) => {
  return (
    <GlassPanel className="p-6 space-y-6 border-aurora-violet/25">
      <div className="flex items-center justify-between border-b border-aurora-line pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-aurora-violet/[0.06] text-aurora-indigo rounded-xl">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-aurora-ink">AI Executive Insights & Diagnostic Audit</h3>
            <p className="text-xs text-aurora-muted">Synthesized multi-source predictive analysis and strategic recommendations</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo text-xs font-bold">
          Executive AI v2.4
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-xs">
        {/* CURRENT POSITION */}
        <div className="p-4 bg-aurora-canvas/60 border border-emerald-200 rounded-2xl space-y-2">
          <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Current Position & Market Standing
          </h4>
          <p className="text-aurora-muted leading-relaxed">{currentPosition}</p>
        </div>

        {/* PRIMARY RISKS */}
        <div className="p-4 bg-aurora-canvas/60 border border-amber-200 rounded-2xl space-y-2">
          <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            Primary Gap Risks to Address
          </h4>
          <ul className="space-y-1.5">
            {primaryRisks.map((risk, idx) => (
              <li key={idx} className="text-aurora-muted flex items-start gap-2 tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans text-xs pt-2 border-t border-aurora-line">
        {/* HIGHEST IMPACT NEXT ACTION */}
        <div className="p-4 bg-aurora-canvas/60 border border-aurora-violet/25 rounded-2xl space-y-2">
          <h4 className="text-xs font-bold text-aurora-indigo uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            Highest Impact Next Action
          </h4>
          <p className="text-aurora-ink font-semibold">⚡ {highestImpactNextAction}</p>
        </div>

        {/* LONG TERM OUTLOOK */}
        <div className="p-4 bg-aurora-canvas/60 border border-purple-500/20 rounded-2xl space-y-2">
          <h4 className="text-xs font-bold text-aurora-violet uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            12-Month Long Term Outlook
          </h4>
          <p className="text-aurora-ink font-semibold">🚀 {longTermOutlook}</p>
        </div>
      </div>
    </GlassPanel>
  );
};
