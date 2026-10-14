import React from 'react';
import { Layers } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface SkillCluster {
  clusterName: string;
  categoryCount: number;
  skills: string[];
  description: string;
  proficiencyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

const defaultClusters: SkillCluster[] = [
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
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'Advanced':
        return 'bg-aurora-violet/[0.06] border-aurora-violet/25 text-aurora-violet';
      case 'Intermediate':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'Beginner':
      default:
        return 'bg-aurora-canvas border-aurora-line text-aurora-muted';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {clusters.map((cluster, idx) => (
        <GlassPanel key={idx} className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-aurora-canvas text-aurora-indigo rounded-lg border border-aurora-line">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-sm text-aurora-ink">{cluster.clusterName}</h4>
            </div>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getProficiencyBadge(cluster.proficiencyLevel)}`}>
              {cluster.proficiencyLevel}
            </span>
          </div>

          <p className="text-xs text-aurora-muted leading-relaxed">{cluster.description}</p>

          <div className="space-y-2 pt-2 border-t border-aurora-line">
            <span className="text-[10px] text-aurora-muted uppercase tracking-wider block">
              Clustered Skills ({cluster.skills.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {cluster.skills.map((skill, sIdx) => (
                <span
                  key={sIdx}
                  className="px-2 py-0.5 rounded bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo text-xs font-semibold"
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
