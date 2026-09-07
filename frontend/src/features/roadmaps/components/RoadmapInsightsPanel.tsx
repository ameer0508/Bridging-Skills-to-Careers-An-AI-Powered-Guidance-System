import React from 'react';
import { HelpCircle, CheckCircle2, ShieldCheck, Zap, ArrowUpRight } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface PhaseInsight {
  phaseTitle: string;
  whyIncluded: string;
  prerequisites: string[];
  skillsGained: string[];
  careerImpact: string;
  expectedOutcome: string;
}

export const defaultPhaseInsights: PhaseInsight[] = [
  {
    phaseTitle: 'Foundational Core & API Architecture',
    whyIncluded: 'Establishes core programming, mathematical logic, and API backend foundations.',
    prerequisites: ['Programming Fundamentals'],
    skillsGained: ['Python', 'Async FastAPI', 'Data Structures'],
    careerImpact: '+18% Match Increase',
    expectedOutcome: 'Functional Python API service with automated test coverage.'
  },
  {
    phaseTitle: 'LLMs, RAG Pipelines & Vector Databases',
    whyIncluded: 'Production Generative AI stack including vector similarity search and RAG.',
    prerequisites: ['Deep Learning', 'Async FastAPI'],
    skillsGained: ['LLMs', 'RAG Pipelines', 'Vector Databases (Milvus)'],
    careerImpact: '+25% Match Increase',
    expectedOutcome: 'Production RAG knowledge retrieval backend with vector similarity index.'
  }
];

export const RoadmapInsightsPanel: React.FC<{ insights?: PhaseInsight[] }> = ({
  insights = defaultPhaseInsights
}) => {
  return (
    <GlassPanel className="p-6 space-y-5 border-purple-500/30">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">AI Roadmap Explainability & Prerequisite Rationale</h3>
            <p className="text-xs text-slate-400">Detailed justification for phase inclusion, skills gained, and capstone outcomes</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
          Explainability Engine
        </span>
      </div>

      <div className="space-y-4">
        {insights.map((item, idx) => (
          <div key={idx} className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-white">{item.phaseTitle}</h4>
              <span className="text-xs font-mono font-bold text-emerald-400">{item.careerImpact}</span>
            </div>

            <p className="text-xs text-slate-300 font-mono">💡 <strong>Why Included:</strong> {item.whyIncluded}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
              <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">Prerequisites</span>
                <span className="text-slate-300 font-bold">{item.prerequisites.join(', ')}</span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">Expected Capstone Outcome</span>
                <span className="text-purple-300 font-bold">{item.expectedOutcome}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
};
