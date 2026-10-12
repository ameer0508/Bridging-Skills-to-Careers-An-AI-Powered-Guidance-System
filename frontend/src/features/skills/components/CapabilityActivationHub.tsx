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
      color: 'text-cyan-400',
      status: 'Awaiting Evidence',
    },
    {
      step: '02',
      title: 'Taxonomy Normalization',
      subtitle: 'AI canonicalizes skills and maps synonyms',
      icon: Brain,
      color: 'text-indigo-400',
      status: 'Engine Standby',
    },
    {
      step: '03',
      title: 'Multi-Source Weighting',
      subtitle: 'Deterministic points from experience & certs',
      icon: ShieldCheck,
      color: 'text-purple-400',
      status: 'Evidence Ready',
    },
    {
      step: '04',
      title: 'Living Capability Map',
      subtitle: 'Interactive ontology graph & gap scoring',
      icon: GitBranch,
      color: 'text-emerald-400',
      status: 'Auto-Constructs',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8">
      {/* Hero Activation Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950 to-indigo-950/40 p-8 md:p-12 backdrop-blur-xl shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-950/50">
          <Brain className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold">
            Skill Intelligence & Taxonomy Engine
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
            Your Capability Map is Waiting for Evidence
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            SkillBridge maps what you actually know by indexing verified evidence from your past experience,
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
                className="p-5 rounded-2xl bg-slate-950/70 border border-white/5 space-y-3 relative group hover:border-white/15 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    STAGE {stage.step}
                  </span>
                  <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded bg-white/5 text-slate-400">
                    {stage.status}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl bg-white/5 ${stage.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{stage.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{stage.subtitle}</p>
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
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Resume Evidence</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/careers')}
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-2 border border-white/10 cursor-pointer"
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
