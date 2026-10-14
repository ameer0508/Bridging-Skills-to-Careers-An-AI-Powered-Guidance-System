import React from 'react';
import {
  FileText,
  Brain,
  ShieldCheck,
  GitBranch,
  ArrowRight,
  UploadCloud,
  Compass,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CapabilityActivationHub: React.FC = () => {
  const navigate = useNavigate();

  const pipelineStages = [
    {
      step: '01',
      title: 'Evidence Ingestion',
      subtitle: 'Upload parsed resume & project portfolio',
      icon: FileText,
      color: 'text-aurora-violet',
      status: 'Awaiting Evidence',
    },
    {
      step: '02',
      title: 'Taxonomy Normalization',
      subtitle: 'AI canonicalizes skills and maps synonyms',
      icon: Brain,
      color: 'text-aurora-indigo',
      status: 'Engine Standby',
    },
    {
      step: '03',
      title: 'Multi-Source Weighting',
      subtitle: 'Deterministic points from experience & certs',
      icon: ShieldCheck,
      color: 'text-aurora-violet',
      status: 'Evidence Ready',
    },
    {
      step: '04',
      title: 'Living Capability Map',
      subtitle: 'Interactive ontology graph & gap scoring',
      icon: GitBranch,
      color: 'text-emerald-700',
      status: 'Auto-Constructs',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8">
      {/* Hero Activation Card */}
      <div className="relative overflow-hidden rounded-3xl border border-aurora-line bg-gradient-to-br from-white via-aurora-surface to-aurora-sidebar p-8 md:p-12 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo flex items-center justify-center mx-auto shadow-lg shadow-aurora-violet/10">
          <Brain className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <span className="text-xs uppercase tracking-widest text-aurora-indigo font-bold">
            Skill Intelligence & Taxonomy Engine
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-aurora-ink tracking-tight">
            Your Capability Map is Waiting for Evidence
          </h2>
          <p className="text-sm text-aurora-muted leading-relaxed">
            SkillBridge maps what you actually know by indexing the evidence from your past experience,
            projects, and credentials into an interactive capability ontology.
          </p>
        </div>

        {/* 4-Stage Architectural Pipeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-left">
          {pipelineStages.map((stage) => {
            const Icon = stage.icon;

            return (
              <div
                key={stage.step}
                className="p-5 rounded-2xl bg-aurora-canvas/60 border border-aurora-line space-y-3 relative group hover:border-aurora-line transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-aurora-muted">
                    STAGE {stage.step}
                  </span>
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-aurora-canvas text-aurora-muted">
                    {stage.status}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl bg-aurora-canvas ${stage.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-aurora-ink">{stage.title}</h4>
                    <p className="text-[11px] text-aurora-muted line-clamp-1">{stage.subtitle}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Direct Action Triggers */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/resume')}
            className="px-6 py-3 rounded-xl [background:var(--aurora-gradient-action)] hover:brightness-110 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Resume Evidence</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/careers')}
            className="px-6 py-3 rounded-xl bg-aurora-canvas hover:bg-aurora-line text-aurora-ink text-xs font-bold transition-all flex items-center gap-2 border border-aurora-line cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Explore Career Target Requirements</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CapabilityActivationHub;
