import React from 'react';
import {
  X,
  FileText,
  Cpu,
  Code2,
  Award,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Database
} from 'lucide-react';

export interface SourceEvidenceDetail {
  id: string;
  name: string;
  category: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'PARTIAL';
  updatedAt?: string | null;
  itemsCount: number;
  whatSkillBridgeUses: string[];
  whyItMatters: string;
  targetRoute: string;
  actionLabel: string;
}

export interface SourceEvidenceInspectorModalProps {
  source: SourceEvidenceDetail | null;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const SourceEvidenceInspectorModal: React.FC<SourceEvidenceInspectorModalProps> = ({
  source,
  onClose,
  onNavigate,
}) => {
  if (!source) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-mono">
      <div className="relative w-full max-w-xl p-6 sm:p-8 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl space-y-6 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                EVIDENCE SOURCE INSPECTOR
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {source.status}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {source.name}
            </h3>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Freshness & Telemetry Bar */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-white/5">
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-500 uppercase block">Data Records</span>
            <strong className="text-white text-xs block">{source.itemsCount} Verified Records</strong>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-500 uppercase block">Last Synced / Updated</span>
            <span className="text-cyan-300 text-xs font-semibold block flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {source.updatedAt ? new Date(source.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Live Verified'}
            </span>
          </div>
        </div>

        {/* What SkillBridge Uses */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            What SkillBridge Extracts & Uses:
          </span>
          <div className="space-y-1.5">
            {source.whatSkillBridgeUses.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-start gap-2 text-slate-300 text-[11px]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Why It Matters for AI Personalization */}
        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-1.5">
          <span className="text-[10px] text-indigo-300 uppercase font-bold tracking-wider block flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Why This Grounding Matters:
          </span>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {source.whyItMatters}
          </p>
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer"
          >
            Close Inspector
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigate(source.targetRoute);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <span>{source.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
