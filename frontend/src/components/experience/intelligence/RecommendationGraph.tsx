import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../cards/GlassCard';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface GraphNode {
  id: string;
  title: string;
  category: 'skill' | 'milestone' | 'role';
  isCompleted?: boolean;
  isTarget?: boolean;
}

export interface RecommendationGraphProps {
  nodes?: GraphNode[];
  targetRoleTitle?: string;
  className?: string;
}

export const RecommendationGraph: React.FC<RecommendationGraphProps> = ({
  nodes,
  targetRoleTitle = 'Target Role',
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [activeHoverNode, setActiveHoverNode] = useState<string | null>(null);

  const defaultNodes: GraphNode[] = nodes || [
    { id: '1', title: 'Verified Skills Graph', category: 'skill', isCompleted: true },
    { id: '2', title: 'Roadmap Milestone 1', category: 'milestone', isCompleted: false },
    { id: '3', title: targetRoleTitle, category: 'role', isTarget: true },
  ];

  return (
    <GlassCard className={`p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Recommendation Dependency Graph</h3>
            <p className="text-xs text-neutral-400">
              Visualizing how current learning unlocks target career fit
            </p>
          </div>
        </div>
      </div>

      {/* Visual Node Flow Container */}
      <div className="p-6 rounded-xl bg-black/40 border border-white/5 overflow-x-auto">
        <div className="flex items-center justify-between min-w-125 gap-4 relative">
          {/* Connecting Line Track */}
          <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-linear-to-r from-emerald-500 via-indigo-500 to-purple-500 -translate-y-1/2 opacity-30 pointer-events-none" />

          {defaultNodes.map((node, index) => {
            const isHovered = activeHoverNode === node.id;

            return (
              <React.Fragment key={node.id}>
                {/* Node Item */}
                <motion.div
                  onMouseEnter={() => setActiveHoverNode(node.id)}
                  onMouseLeave={() => setActiveHoverNode(null)}
                  whileHover={!prefersReducedMotion ? { scale: 1.05, y: -2 } : undefined}
                  className={`relative z-10 p-4 rounded-xl border transition-all cursor-pointer ${
                    node.isTarget
                      ? 'bg-purple-950/40 border-purple-500/50 shadow-lg shadow-purple-500/20'
                      : node.isCompleted
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : 'bg-indigo-950/30 border-indigo-500/30'
                  } ${isHovered ? 'ring-2 ring-indigo-400' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {node.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Step 0{index + 1} • {node.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white max-w-32.5 truncate">{node.title}</h4>
                </motion.div>


                {/* Arrow Connector between nodes */}
                {index < defaultNodes.length - 1 && (
                  <div className="z-10 text-neutral-500">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
};

export default RecommendationGraph;
