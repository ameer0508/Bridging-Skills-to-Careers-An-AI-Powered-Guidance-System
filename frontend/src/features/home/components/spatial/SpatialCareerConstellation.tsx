import React, { useMemo, useState } from 'react';
import { Sparkles, ArrowUpRight, Upload, BookOpen, Target, CheckCircle2, AlertCircle, X, ChevronRight } from 'lucide-react';
import { SpotlightSurface } from './SpotlightSurface';
import { MagneticButton } from './MagneticButton';

export interface SpatialCareerConstellationProps {
  skills: Array<{ name: string; category?: string }>;
  targetRole: string;
  criticalGaps?: string[];
  readinessScore?: number | null;
  onNavigateSkills: () => void;
  onUploadResume: () => void;
  onBridgeGap?: (gap: string) => void;
}

interface ConstellationNode {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  type: 'summit' | 'skill' | 'gap';
}

export const SpatialCareerConstellation: React.FC<SpatialCareerConstellationProps> = ({
  skills,
  targetRole,
  criticalGaps = [],
  readinessScore,
  onNavigateSkills,
  onUploadResume,
  onBridgeGap,
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ConstellationNode | null>(null);

  // Compute organic coordinates for the target summit, skills, and gaps
  const { nodes, edges } = useMemo(() => {
    const nodeList: ConstellationNode[] = [];
    const edgeList: Array<{ from: string; to: string; type: 'verified' | 'gap' | 'summit' }> = [];

    // Summit Node (Target Career) placed near top-center
    const summitId = 'node-summit';
    nodeList.push({
      id: summitId,
      name: targetRole || 'Target Career Summit',
      category: 'Career Summit',
      x: 50,
      y: 18,
      type: 'summit',
    });

    // Group skills by category to position them in balanced organic clusters
    const categories: Record<string, string[]> = {};
    skills.forEach((s) => {
      const cat = s.category || 'General';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(s.name);
    });

    const categoryKeys = Object.keys(categories);
    const clusterCenters = [
      { x: 22, y: 48 },
      { x: 78, y: 48 },
      { x: 28, y: 78 },
      { x: 72, y: 78 },
      { x: 50, y: 82 },
    ];

    categoryKeys.forEach((cat, catIdx) => {
      const center = clusterCenters[catIdx % clusterCenters.length];
      const items = categories[cat];
      const count = items.length;

      items.forEach((skillName, itemIdx) => {
        const angle = (itemIdx / Math.max(count, 1)) * 2 * Math.PI;
        const dist = 9 + (itemIdx % 3) * 5;
        const x = Math.max(10, Math.min(90, center.x + Math.cos(angle) * dist));
        const y = Math.max(30, Math.min(88, center.y + Math.sin(angle) * dist));

        const nodeId = `skill-${skillName}`;
        nodeList.push({
          id: nodeId,
          name: skillName,
          category: cat,
          x,
          y,
          type: 'skill',
        });

        // Link primary skill in cluster towards the summit
        if (itemIdx === 0) {
          edgeList.push({
            from: nodeId,
            to: summitId,
            type: 'verified',
          });
        }

        // Link intra-cluster skills
        if (itemIdx > 0) {
          edgeList.push({
            from: `skill-${items[itemIdx - 1]}`,
            to: nodeId,
            type: 'verified',
          });
        }
      });
    });

    // Place critical gaps between current skills and the summit
    criticalGaps.forEach((gapName, idx) => {
      const gapId = `gap-${gapName}`;
      const angle = (idx / Math.max(criticalGaps.length, 1)) * Math.PI;
      const x = 35 + (idx * 30) / Math.max(criticalGaps.length - 1, 1);
      const y = 34 + Math.sin(angle) * 8;

      nodeList.push({
        id: gapId,
        name: gapName,
        category: 'Growth Gap',
        x: Math.max(15, Math.min(85, x)),
        y,
        type: 'gap',
      });

      // Filaments from gaps to the summit
      edgeList.push({
        from: gapId,
        to: summitId,
        type: 'gap',
      });
    });

    return { nodes: nodeList, edges: edgeList };
  }, [skills, criticalGaps, targetRole]);

  const totalSkillsCount = skills.length;

  return (
    <SpotlightSurface
      spotlightColor="rgba(226, 179, 87, 0.09)"
      spotlightRadius={450}
      className="p-6 sm:p-9 space-y-6"
    >
      {/* Header Narrative */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Living Career Constellation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
            Competency Topology & Upward Alignment
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 font-medium">
            {totalSkillsCount} Active Nodes
          </span>
          <button
            onClick={onNavigateSkills}
            className="spatial-ghost-btn group"
          >
            <span>Full Inventory</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Centerpiece Visualization or Awakening Drop Portal */}
      {totalSkillsCount === 0 ? (
        <div
          onClick={onUploadResume}
          className="relative min-h-[380px] rounded-2xl bg-gradient-to-b from-white/[0.02] to-black/40 border border-dashed border-white/10 hover:border-amber-500/40 transition-all p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 cursor-pointer group"
        >
          <div className="w-20 h-20 rounded-full bg-amber-500/[0.08] border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(245,158,11,0.15)]">
            <Upload className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg">
            <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
              Awaken Your Career Constellation
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Upload your resume document to immediately illuminate your verified competencies, discover structural skill gaps, and visualize your shortest trajectory to <strong className="text-slate-200">{targetRole || 'your target career'}</strong>.
            </p>
          </div>

          <MagneticButton className="catalyst-magnetic-btn">
            <Upload className="w-4 h-4" />
            <span>Upload Resume Document</span>
          </MagneticButton>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Spatial Vector Canvas */}
          <div className="relative w-full h-[380px] sm:h-[450px] rounded-2xl bg-black/45 border border-white/[0.06] overflow-hidden select-none">
            {/* SVG Connecting Filaments */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="verifiedFilament" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(16, 185, 129, 0.4)" />
                  <stop offset="100%" stopColor="rgba(226, 179, 87, 0.4)" />
                </linearGradient>
                <linearGradient id="gapFilament" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(245, 158, 11, 0.6)" />
                  <stop offset="100%" stopColor="rgba(239, 68, 68, 0.2)" />
                </linearGradient>
              </defs>

              {edges.map((edge, idx) => {
                const source = nodes.find((n) => n.id === edge.from);
                const target = nodes.find((n) => n.id === edge.to);
                if (!source || !target) return null;

                const isConnectedToHovered =
                  hoveredNodeId === source.id || hoveredNodeId === target.id;

                const strokeColor = isConnectedToHovered
                  ? 'rgba(226, 179, 87, 0.9)'
                  : edge.type === 'gap'
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(255, 255, 255, 0.08)';

                return (
                  <line
                    key={`${edge.from}-${edge.to}-${idx}`}
                    x1={`${source.x}%`}
                    y1={`${source.y}%`}
                    x2={`${target.x}%`}
                    y2={`${target.y}%`}
                    stroke={strokeColor}
                    strokeWidth={isConnectedToHovered ? 2 : 0.8}
                    strokeDasharray={edge.type === 'gap' ? '4 4' : undefined}
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>

            {/* Constellation Nodes */}
            {nodes.map((node) => {
              const isSummit = node.type === 'summit';
              const isGap = node.type === 'gap';
              const isHovered = hoveredNodeId === node.id;
              const isSelected = selectedNode?.id === node.id;

              if (isSummit) {
                return (
                  <div
                    key={node.id}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    onClick={() => setSelectedNode(node)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 transition-transform duration-300 hover:scale-110"
                  >
                    <div className="relative flex flex-col items-center group">
                      <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-400/50 backdrop-blur-xl shadow-[0_0_35px_rgba(245,158,11,0.3)] flex items-center gap-2">
                        <Target className="w-4 h-4 text-amber-300 animate-pulse" />
                        <span className="text-xs font-bold text-amber-100 tracking-tight whitespace-nowrap">
                          {node.name}
                        </span>
                        {readinessScore !== null && readinessScore !== undefined && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 font-bold">
                            {readinessScore}%
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-amber-300/80 font-medium tracking-wider uppercase mt-1">
                        Target Career Summit
                      </span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={node.id}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => setSelectedNode(node)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-20 ${
                    isHovered || isSelected ? 'scale-110 z-30' : ''
                  }`}
                >
                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-md flex items-center gap-1.5 border shadow-lg transition-all ${
                      isGap
                        ? 'bg-amber-950/85 border-amber-500/50 text-amber-200 hover:border-amber-400 hover:bg-amber-900/90'
                        : 'bg-slate-900/85 border-white/10 text-slate-200 hover:border-white/30 hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isGap ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                      }`}
                    />
                    <span className="truncate max-w-[130px]">{node.name}</span>
                  </div>
                </div>
              );
            })}

            {/* Contextual Drawer when a node is selected */}
            {selectedNode && (
              <div className="absolute bottom-4 right-4 max-w-xs sm:max-w-sm p-4 rounded-xl bg-slate-950/95 border border-white/20 backdrop-blur-2xl shadow-2xl z-40 space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    {selectedNode.type === 'gap' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span className="truncate">{selectedNode.name}</span>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {selectedNode.type === 'summit'
                    ? `Primary career destination. Your overall readiness is calculated across all verified nodes and target growth gaps.`
                    : selectedNode.type === 'gap'
                    ? `Identified as a critical competency gap for ${targetRole}. Acquiring this accelerates your role match.`
                    : `Verified technical capability. Anchored to category: ${selectedNode.category}.`}
                </p>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {selectedNode.type === 'gap' && onBridgeGap ? (
                    <button
                      onClick={() => onBridgeGap(selectedNode.name)}
                      className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-medium border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Bridge Gap</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <button
                      onClick={onNavigateSkills}
                      className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/15 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Inspect Portfolio</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Legend */}
            <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[11px] text-slate-400 bg-black/60 px-3.5 py-1.5 rounded-lg border border-white/5 backdrop-blur-md">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Verified Capability</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Target Growth Gap</span>
              </span>
            </div>
          </div>

          {/* High-Leverage Growth Directives Bar */}
          {criticalGaps.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between text-xs text-amber-300 font-medium">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Prioritized Remediation Trajectory</span>
                </span>
                <span>{criticalGaps.length} Target Competencies</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-0.5">
                {criticalGaps.map((gap) => (
                  <button
                    key={gap}
                    onClick={() => onBridgeGap?.(gap)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 border border-amber-500/25 transition-all flex items-center gap-2 cursor-pointer group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover:scale-125 transition-transform" />
                    <span>Bridge {gap}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </SpotlightSurface>
  );
};
