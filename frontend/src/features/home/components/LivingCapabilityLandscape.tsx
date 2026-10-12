import React, { useMemo, useState } from 'react';
import { ArrowUpRight, Upload, Sparkles, BookOpen } from 'lucide-react';

export interface LivingCapabilityLandscapeProps {
  skills: Array<{ name: string; category?: string }>;
  targetRole: string;
  criticalGaps?: string[];
  onNavigateSkills: () => void;
  onUploadResume: () => void;
  onBridgeGap?: (gap: string) => void;
}

interface CapabilityNode {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  isGap?: boolean;
}

export const LivingCapabilityLandscape: React.FC<LivingCapabilityLandscapeProps> = ({
  skills,
  targetRole,
  criticalGaps = [],
  onNavigateSkills,
  onUploadResume,
  onBridgeGap,
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Synthesize spatial coordinates for verified competencies & critical gaps
  const { nodes, edges } = useMemo(() => {
    const nodeList: CapabilityNode[] = [];
    const edgeList: Array<{ from: string; to: string }> = [];

    // Group skills by category to position them in clusters
    const categories: Record<string, string[]> = {};
    skills.forEach((s) => {
      const cat = s.category || 'General';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(s.name);
    });

    const categoryKeys = Object.keys(categories);
    const clusterCenters = [
      { x: 25, y: 35 },
      { x: 75, y: 35 },
      { x: 25, y: 75 },
      { x: 75, y: 75 },
      { x: 50, y: 55 },
    ];

    categoryKeys.forEach((cat, catIdx) => {
      const center = clusterCenters[catIdx % clusterCenters.length];
      const items = categories[cat];
      const count = items.length;

      items.forEach((skillName, itemIdx) => {
        const angle = (itemIdx / Math.max(count, 1)) * 2 * Math.PI;
        const dist = 10 + (itemIdx % 3) * 6;
        const x = Math.max(10, Math.min(90, center.x + Math.cos(angle) * dist));
        const y = Math.max(15, Math.min(85, center.y + Math.sin(angle) * dist));

        const nodeId = `skill-${skillName}`;
        nodeList.push({
          id: nodeId,
          name: skillName,
          category: cat,
          x,
          y,
          isGap: false,
        });

        // Add intra-cluster edges
        if (itemIdx > 0) {
          edgeList.push({
            from: `skill-${items[itemIdx - 1]}`,
            to: nodeId,
          });
        }
      });
    });

    // Place critical gaps in a central focal constellation
    criticalGaps.forEach((gapName, idx) => {
      const gapId = `gap-${gapName}`;
      const angle = (idx / Math.max(criticalGaps.length, 1)) * 2 * Math.PI;
      const x = 50 + Math.cos(angle) * 18;
      const y = 50 + Math.sin(angle) * 18;

      nodeList.push({
        id: gapId,
        name: gapName,
        category: 'Target Growth Gap',
        x,
        y,
        isGap: true,
      });

      // Link gaps to nearest skills
      if (nodeList.length > 0 && !nodeList[0].isGap) {
        edgeList.push({
          from: nodeList[0].id,
          to: gapId,
        });
      }
    });

    return { nodes: nodeList, edges: edgeList };
  }, [skills, criticalGaps]);

  const totalSkillsCount = skills.length;

  return (
    <section className="carto-surface p-8 sm:p-10 space-y-7 relative overflow-hidden">
      {/* Top Header Narrative */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Living Capability Landscape</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
            Competency Topology & Growth Vectors
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 font-medium">
            {totalSkillsCount} Verified Nodes
          </span>
          <button
            onClick={onNavigateSkills}
            className="carto-ghost-btn group"
          >
            <span>Full Inventory</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* THE SPATIAL CONSTELLATION OR ACTIVATION PORTAL */}
      {totalSkillsCount === 0 ? (
        <div
          onClick={onUploadResume}
          className="relative min-h-[380px] rounded-2xl bg-gradient-to-b from-white/[0.02] to-black/30 border border-dashed border-white/10 hover:border-amber-500/30 transition-all p-8 flex flex-col items-center justify-center text-center space-y-5 cursor-pointer group"
        >
          {/* Subtle Ambient Rings */}
          <div className="w-16 h-16 rounded-full bg-amber-500/[0.08] border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <Upload className="w-7 h-7" />
          </div>

          <div className="space-y-2 max-w-md">
            <h3 className="text-lg sm:text-xl font-bold text-white font-display">
              Awaken Your Capability Landscape
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Upload your resume document to instantly reveal your technical proficiencies, capability clusters, and shortest path to <strong className="text-slate-200">{targetRole || 'your target career'}</strong>.
            </p>
          </div>

          <button className="catalyst-btn">
            <Upload className="w-4 h-4" />
            <span>Upload Resume Document</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Interactive Topological Canvas */}
          <div className="relative w-full h-[360px] sm:h-[420px] rounded-2xl bg-black/40 border border-white/[0.06] overflow-hidden">
            {/* SVG Vector Edge Web */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {edges.map((edge, idx) => {
                const source = nodes.find((n) => n.id === edge.from);
                const target = nodes.find((n) => n.id === edge.to);
                if (!source || !target) return null;

                const isHovered = hoveredNodeId === source.id || hoveredNodeId === target.id;

                return (
                  <line
                    key={`${edge.from}-${edge.to}-${idx}`}
                    x1={`${source.x}%`}
                    y1={`${source.y}%`}
                    x2={`${target.x}%`}
                    y2={`${target.y}%`}
                    stroke={isHovered ? 'rgba(226, 179, 87, 0.6)' : 'rgba(255, 255, 255, 0.08)'}
                    strokeWidth={isHovered ? 1.5 : 0.8}
                    strokeDasharray={target.isGap ? '3 3' : undefined}
                    className="transition-colors duration-300"
                  />
                );
              })}
            </svg>

            {/* Spatial Capability Nodes */}
            {nodes.map((node) => {
              const isGap = node.isGap;
              const isHovered = hoveredNodeId === node.id;

              return (
                <div
                  key={node.id}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => (isGap && onBridgeGap ? onBridgeGap(node.name) : onNavigateSkills())}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10 ${
                    isHovered ? 'scale-115 z-20' : ''
                  }`}
                >
                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-md flex items-center gap-1.5 border shadow-lg transition-all ${
                      isGap
                        ? 'bg-amber-950/80 border-amber-500/40 text-amber-200 hover:border-amber-400'
                        : 'bg-slate-900/80 border-white/10 text-slate-200 hover:border-white/30 hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isGap ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                      }`}
                    />
                    <span className="truncate max-w-[120px]">{node.name}</span>
                  </div>
                </div>
              );
            })}

            {/* Legend Overlay at Bottom Left */}
            <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[11px] text-slate-400 bg-black/60 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-md">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Verified Mastery</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Priority Growth Gap</span>
              </span>
            </div>
          </div>

          {/* Targeted Growth Directives (If gaps exist) */}
          {criticalGaps.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between text-xs text-amber-300 font-medium">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>High-Leverage Growth Opportunities</span>
                </span>
                <span>{criticalGaps.length} Target Competencies</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {criticalGaps.map((gap) => (
                  <button
                    key={gap}
                    onClick={() => onBridgeGap?.(gap)}
                    className="text-xs px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-500/25 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Bridge {gap}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
