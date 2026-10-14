import React from 'react';
import {
  X,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Database
} from 'lucide-react';
import { DialogFrame } from '../../../design/aurora/DialogFrame';

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
    <DialogFrame onClose={onClose} label="Evidence source">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-t-3xl sm:rounded-3xl bg-white border border-aurora-line shadow-aurora-lg space-y-6 text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-aurora-line pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25">
                EVIDENCE SOURCE INSPECTOR
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {source.status}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-aurora-ink tracking-tight">
              {source.name}
            </h3>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl hover:bg-aurora-canvas text-aurora-muted hover:text-aurora-indigo transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Freshness & Telemetry Bar */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-aurora-canvas border border-aurora-line">
          <div className="space-y-0.5">
            <span className="text-[9px] text-aurora-muted uppercase block">Data Records</span>
            <strong className="text-aurora-ink text-xs block">{source.itemsCount} Records</strong>
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] text-aurora-muted uppercase block">Last Synced / Updated</span>
            <span className="text-aurora-violet text-xs font-semibold block flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {source.updatedAt ? new Date(source.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Live Verified'}
            </span>
          </div>
        </div>

        {/* What SkillBridge Uses */}
        <div className="space-y-2">
          <span className="text-[10px] text-aurora-muted uppercase font-bold tracking-wider block flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-aurora-indigo" />
            What SkillBridge Extracts & Uses:
          </span>
          <div className="space-y-1.5">
            {source.whatSkillBridgeUses.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex items-start gap-2 text-aurora-muted text-[11px]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Why It Matters for AI Personalization */}
        <div className="p-4 rounded-2xl bg-violet-50 border border-aurora-violet/25 space-y-1.5">
          <span className="text-[10px] text-aurora-indigo uppercase font-bold tracking-wider block flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-aurora-indigo" />
            Why This Grounding Matters:
          </span>
          <p className="text-aurora-muted text-[11px] leading-relaxed">
            {source.whyItMatters}
          </p>
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-aurora-line flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-aurora-canvas hover:bg-aurora-line text-aurora-muted text-xs transition cursor-pointer"
          >
            Close Inspector
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigate(source.targetRoute);
            }}
            className="px-4 py-2 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <span>{source.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </DialogFrame>
  );
};
