import React from 'react';
import { Layers, Cpu, Server, Database, ShieldCheck } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface SkillCluster {
  clusterName: string;
  categoryCount: number;
  skills: string[];
  description: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export const defaultClusters: SkillCluster[] = [
  {
    clusterName: 'Software Engineering & Full Stack',
    categoryCount: 5,
    skills: ['Python 3.12', 'Async FastAPI', 'TypeScript', 'React 19', 'Next.js'],
    description: 'High-performance web applications, API architecture, and microservice engineering.',
    proficiencyLevel: 'Expert'
  },
  {
    clusterName: 'AI, Data & Machine Learning',
    categoryCount: 4,
    skills: ['TensorFlow', 'PyTorch', 'Transformers', 'RAG Pipelines'],
    description: 'Deep neural networks, model training, and Retrieval-Augmented Generation.',
    proficiencyLevel: 'Advanced'
  },
  {
    clusterName: 'Cloud Infrastructure & DevOps',
    categoryCount: 3,
    skills: ['Docker', 'Kubernetes', 'AWS', 'Linux'],
    description: 'Containerization, cloud deployment pipelines, and infrastructure scaling.',
    proficiencyLevel: 'Advanced'
  },
  {
    clusterName: 'Database & Data Architecture',
    categoryCount: 3,
    skills: ['PostgreSQL', 'Redis', 'Vector Databases (Milvus)'],
    description: 'Relational data modeling, in-memory caching, and vector similarity indexes.',
    proficiencyLevel: 'Expert'
  }
];

export const SkillClusterCards: React.FC<{ clusters?: SkillCluster[] }> = ({
  clusters = defaultClusters
}) => {
  const getProficiencyBadge = (level: string) => {
    switch (level) {
      case 'Expert':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
      case 'Advanced':
        return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300';
      case 'Intermediate':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
      case 'Beginner':
      default:
        return 'bg-slate-800 border-white/10 text-slate-400';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {clusters.map((cluster, idx) => (
        <GlassPanel key={idx} className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-slate-900 text-indigo-400 rounded-lg border border-white/5">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-white">{cluster.clusterName}</h4>
            </div>
            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${getProficiencyBadge(cluster.proficiencyLevel)}`}>
              {cluster.proficiencyLevel}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">{cluster.description}</p>

          <div className="space-y-2 pt-2 border-t border-white/5">
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">
              Clustered Skills ({cluster.skills.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {cluster.skills.map((skill, sIdx) => (
                <span
                  key={sIdx}
                  className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </GlassPanel>
      ))}
    </div>
  );
};
