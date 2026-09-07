import React from 'react';
import { Target, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface RelevanceMetric {
  skillName: string;
  relevanceScore: number;
  industryDemand: string;
  learningPriority: string;
  growthPotential: string;
  recommendedAction: string;
}

export const defaultRelevanceMetrics: RelevanceMetric[] = [
  {
    skillName: 'Python & Async FastAPI',
    relevanceScore: 96.5,
    industryDemand: 'Very High',
    learningPriority: 'High (Core Foundation)',
    growthPotential: 'Very High (+38% Salary Impact)',
    recommendedAction: 'Master distributed caching and async task queues.'
  },
  {
    skillName: 'Generative AI & RAG Pipelines',
    relevanceScore: 98.0,
    industryDemand: 'Very High',
    learningPriority: 'High (Top Priority)',
    growthPotential: 'Exceptional (+50% Salary Impact)',
    recommendedAction: 'Build production vector search pipelines with Milvus.'
  },
  {
    skillName: 'Docker & Kubernetes',
    relevanceScore: 92.0,
    industryDemand: 'High',
    learningPriority: 'Medium (Secondary)',
    growthPotential: 'High (+25% Salary Impact)',
    recommendedAction: 'Configure automated CI/CD deployment pipelines.'
  }
];

export const CareerRelevancePanel: React.FC<{ metrics?: RelevanceMetric[] }> = ({
  metrics = defaultRelevanceMetrics
}) => {
  return (
    <GlassPanel className="p-6 space-y-5 border-emerald-500/30">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Career Relevance & Market Demand Panel</h3>
            <p className="text-xs text-slate-400">Scored against live industry hiring indices and recruiter search volumes</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
          Demand Index Synced
        </span>
      </div>

      <div className="space-y-4">
        {metrics.map((item, idx) => (
          <div key={idx} className="p-4 bg-slate-950/80 border border-white/5 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>{item.skillName}</span>
              </h4>
              <span className="text-xs font-mono font-bold text-emerald-400">Relevance: {item.relevanceScore}%</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono pt-1">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase">Industry Demand</span>
                <span className="font-bold text-emerald-300">{item.industryDemand}</span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase">Learning Priority</span>
                <span className="font-bold text-cyan-300">{item.learningPriority}</span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-white/5 space-y-0.5">
                <span className="text-[10px] text-slate-500 block uppercase">Growth Potential</span>
                <span className="font-bold text-amber-300">{item.growthPotential}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 pt-1 border-t border-white/5">
              💡 <strong>Actionable Tip:</strong> {item.recommendedAction}
            </p>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
};
