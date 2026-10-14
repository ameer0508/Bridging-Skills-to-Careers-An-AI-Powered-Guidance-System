import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Cpu, BarChart2, AlertCircle, Award } from 'lucide-react';

interface StageNode {
  id: string;
  step: string;
  title: string;
  category: string;
  detail: string;
  evidenceSource: string;
  icon: React.ElementType;
  accentColor: string;
  badgeBg: string;
  borderColor: string;
}

const DIAGNOSTIC_STAGES: StageNode[] = [
  {
    id: 'stage-1',
    step: '01',
    title: 'Resume Evidence',
    category: 'Ingestion Layer',
    detail: 'Ingests candidate work history, project repositories, and academic certifications.',
    evidenceSource: 'PDF / DOCX Raw Stream',
    icon: FileText,
    accentColor: 'text-aurora-indigo',
    badgeBg: 'bg-aurora-violet/[0.06] text-aurora-indigo border-aurora-violet/25',
    borderColor: 'border-aurora-violet/25',
  },
  {
    id: 'stage-2',
    step: '02',
    title: 'Evidence Extraction',
    category: 'Normalization',
    detail: 'Isolates verified skill entities, role tenures, and hands-on capstone implementations.',
    evidenceSource: 'Entity Extraction Engine',
    icon: Cpu,
    accentColor: 'text-aurora-violet',
    badgeBg: 'bg-aurora-violet/[0.06] text-aurora-violet border-aurora-violet/25',
    borderColor: 'border-aurora-violet/25',
  },
  {
    id: 'stage-3',
    step: '03',
    title: '4-Dimension Audit',
    category: 'Weighted Matrix',
    detail: 'Evaluates Technical (50%), Experience (25%), Projects (15%), and Certifications (10%).',
    evidenceSource: 'ReadinessCalculator.ts',
    icon: BarChart2,
    accentColor: 'text-emerald-700',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    borderColor: 'border-emerald-200',
  },
  {
    id: 'stage-4',
    step: '04',
    title: 'Gap & Penalty Audit',
    category: 'Risk Mitigation',
    detail: 'Audits missing required skills and applies deterministic penalty reduction (up to -40%).',
    evidenceSource: 'GapPrioritizer.ts',
    icon: AlertCircle,
    accentColor: 'text-amber-700',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    borderColor: 'border-amber-200',
  },
  {
    id: 'stage-5',
    step: '05',
    title: 'Preparedness Profile',
    category: 'Diagnostic Output',
    detail: 'Generates composite readiness score and classifies candidate into Senior, Mid, or Entry tiers.',
    evidenceSource: 'Deterministic Classification',
    icon: Award,
    accentColor: 'text-aurora-violet',
    badgeBg: 'bg-purple-500/10 text-aurora-violet border-purple-500/20',
    borderColor: 'border-purple-500/30',
  },
];

export const ReadinessDiagnosticPipelineVisual: React.FC = () => {
  const [activeStage, setActiveStage] = React.useState<string>('stage-3');

  return (
    <div className="relative rounded-3xl border border-aurora-line bg-aurora-canvas/60 backdrop-blur-xl p-6 sm:p-8 overflow-hidden shadow-2xl">
      {/* Background Ambience */}
      <div className="pointer-events-none absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-aurora-violet/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 w-96 h-96 rounded-full bg-aurora-violet/[0.06] blur-3xl" />

      {/* Header telemetry ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-aurora-line pb-5 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-aurora-violet/25 bg-aurora-violet/[0.06] text-[10px] font-bold text-aurora-violet uppercase tracking-widest">
            <span>Diagnostic Audit Architecture</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-aurora-ink tracking-tight mt-1.5">
            5-Stage Evidence & Preparedness Progression
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-aurora-line bg-aurora-canvas/60 text-aurora-muted">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>STATE: AWAITING EVIDENCE</span>
          </div>
        </div>
      </div>

      {/* 5-Stage Diagram Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative z-10">
        {DIAGNOSTIC_STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isSelected = activeStage === stage.id;

          return (
            <motion.div
              key={stage.id}
              whileHover={{ y: -3 }}
              onClick={() => setActiveStage(stage.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative ${
                isSelected
                  ? 'bg-aurora-canvas/60 border-aurora-violet/25 shadow-lg shadow-cyan-500/10'
                  : 'bg-aurora-canvas/60 border-aurora-line hover:border-aurora-line hover:bg-aurora-canvas/60'
              }`}
            >
              {/* Step indicator & connector */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-aurora-muted">
                    STAGE {stage.step}
                  </span>
                  {idx < 4 && (
                    <span className="hidden md:inline text-aurora-muted text-xs">→</span>
                  )}
                </div>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
                    isSelected
                      ? `${stage.borderColor} bg-aurora-canvas`
                      : 'border-aurora-line bg-aurora-canvas/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${stage.accentColor}`} />
                </div>
              </div>

              {/* Title & Category */}
              <div className="space-y-1 my-1">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border inline-block ${stage.badgeBg}`}>
                  {stage.category}
                </span>
                <h4 className="text-xs font-bold text-aurora-ink leading-snug">
                  {stage.title}
                </h4>
                <p className="text-[11px] text-aurora-muted leading-relaxed line-clamp-2">
                  {stage.detail}
                </p>
              </div>

              {/* Evidence source tag */}
              <div className="mt-3 pt-2.5 border-t border-aurora-line flex items-center justify-between text-[9px] text-aurora-muted">
                <span>SOURCE:</span>
                <span className="text-aurora-muted font-bold truncate max-w-[120px]">{stage.evidenceSource}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Trajectory connection line (Desktop) */}
      <div className="hidden md:block relative h-1.5 bg-aurora-canvas/80 rounded-full mt-4 overflow-hidden border border-aurora-line">
        <motion.div
          className="absolute top-0 bottom-0 left-0 bg-linear-to-r from-aurora-violet via-aurora-sky to-aurora-mint rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
};

export default ReadinessDiagnosticPipelineVisual;
