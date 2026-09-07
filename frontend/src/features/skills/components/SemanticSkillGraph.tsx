import React, { useState } from 'react';
import { GitBranch, Layers, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface SkillGraphNode {
  id: string;
  name: string;
  category: string;
  type: 'core' | 'parent' | 'prerequisite' | 'sub';
  confidence: number;
}

export interface SkillGraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface SemanticSkillGraphProps {
  nodes?: SkillGraphNode[];
  edges?: SkillGraphEdge[];
}

export const defaultNodes: SkillGraphNode[] = [
  { id: 'tf', name: 'TensorFlow', category: 'AI / ML', type: 'core', confidence: 0.96 },
  { id: 'ml', name: 'Machine Learning', category: 'AI / ML', type: 'parent', confidence: 0.98 },
  { id: 'ai', name: 'Artificial Intelligence', category: 'AI / ML', type: 'parent', confidence: 0.99 },
  { id: 'pytorch', name: 'PyTorch', category: 'AI / ML', type: 'core', confidence: 0.95 },
  { id: 'dl', name: 'Deep Learning', category: 'AI / ML', type: 'parent', confidence: 0.97 },
  { id: 'fastapi', name: 'FastAPI', category: 'Backend', type: 'core', confidence: 0.96 },
  { id: 'py', name: 'Python', category: 'Programming Languages', type: 'prerequisite', confidence: 0.99 },
  { id: 'docker', name: 'Docker', category: 'DevOps', type: 'core', confidence: 0.98 },
  { id: 'containers', name: 'Containers', category: 'DevOps', type: 'parent', confidence: 0.97 },
  { id: 'k8s', name: 'Kubernetes', category: 'DevOps', type: 'sub', confidence: 0.94 },
  { id: 'rag', name: 'RAG Pipelines', category: 'AI / ML', type: 'core', confidence: 0.96 },
  { id: 'vdb', name: 'Vector Databases', category: 'Databases', type: 'prerequisite', confidence: 0.95 }
];

export const defaultEdges: SkillGraphEdge[] = [
  { source: 'TensorFlow', target: 'Machine Learning', relationship: 'parent' },
  { source: 'Machine Learning', target: 'Artificial Intelligence', relationship: 'parent' },
  { source: 'PyTorch', target: 'Deep Learning', relationship: 'parent' },
  { source: 'Deep Learning', target: 'Machine Learning', relationship: 'parent' },
  { source: 'FastAPI', target: 'Python', relationship: 'prerequisite' },
  { source: 'Docker', target: 'Containers', relationship: 'parent' },
  { source: 'Kubernetes', target: 'Docker', relationship: 'prerequisite' },
  { source: 'RAG Pipelines', target: 'Vector Databases', relationship: 'prerequisite' }
];

export const SemanticSkillGraph: React.FC<SemanticSkillGraphProps> = ({
  nodes = defaultNodes,
  edges = defaultEdges
}) => {
  const [activeNode, setActiveNode] = useState<string>('TensorFlow');

  const relatedEdges = edges.filter(e => e.source === activeNode || e.target === activeNode);

  return (
    <GlassPanel className="p-6 space-y-6 border-cyan-500/30">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Semantic Directed Skill Graph</h3>
            <p className="text-xs text-slate-400">Multi-directional relationship traversal & prerequisite dependency graph</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
          Ontology Graph v2.1
        </span>
      </div>

      {/* GRAPH NODE CANVAS */}
      <div className="p-6 bg-slate-950/80 border border-white/5 rounded-2xl space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>SELECT SKILL NODE TO EXPLORE PATH:</span>
          <span className="text-cyan-400 font-bold">Active: {activeNode}</span>
        </div>

        {/* NODE CHIPS */}
        <div className="flex flex-wrap gap-2.5">
          {nodes.map(node => (
            <button
              key={node.id}
              onClick={() => setActiveNode(node.name)}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeNode === node.name
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105'
                  : 'bg-slate-900 border border-white/10 text-slate-300 hover:border-cyan-500/40 hover:text-white'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                node.type === 'core' ? 'bg-emerald-400' : node.type === 'parent' ? 'bg-purple-400' : 'bg-amber-400'
              }`} />
              <span>{node.name}</span>
            </button>
          ))}
        </div>

        {/* ACTIVE TRAVERSAL PATH */}
        <div className="p-4 bg-slate-900/60 border border-cyan-500/20 rounded-xl space-y-3">
          <span className="text-xs font-bold text-cyan-300 uppercase font-mono tracking-wider">
            Directed Paths & Ancestor Equivalences for {activeNode}:
          </span>

          {relatedEdges.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No directed edges registered for this node.</p>
          ) : (
            <div className="space-y-2">
              {relatedEdges.map((edge, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs font-mono p-2.5 bg-slate-950 border border-white/5 rounded-lg">
                  <span className="font-bold text-white">{edge.source}</span>
                  <div className="flex items-center gap-1 text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-[10px]">
                    <span>{edge.relationship.toUpperCase()}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                  <span className="font-bold text-indigo-300">{edge.target}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
};
