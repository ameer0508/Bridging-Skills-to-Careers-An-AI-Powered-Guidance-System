import React, { useMemo, useState } from 'react';
import {
  Target,
  Sparkles,
  Upload,
  RefreshCw,
  ShieldCheck,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
} from 'lucide-react';
import { MagneticButton } from './MagneticButton';
import { NextBestActionInfo } from '../index';

export interface SpatialCareerObservatoryProps {
  userName: string;
  targetRole: string;
  primaryDomain?: string;
  readinessScore: number | null;
  isReadinessEvaluated: boolean;
  syncTime: string;
  isRefreshing: boolean;
  skills: Array<{ name: string; category?: string }>;
  criticalGaps?: string[];
  nextBestAction: NextBestActionInfo;
  onRefresh: () => void;
  onNavigate: (route: string) => void;
  onUploadResume: () => void;
  onNavigateSkills: () => void;
  onBridgeGap?: (gap: string) => void;
}

interface ConstellationNode {
  id: string;
  name: string;
  category: string;
  x: number;
  y: number;
  type: 'summit' | 'skill' | 'gap' | 'dormant';
}

export const SpatialCareerObservatory: React.FC<SpatialCareerObservatoryProps> = ({
  userName,
  targetRole,
  primaryDomain,
  readinessScore,
  isReadinessEvaluated,
  syncTime,
  isRefreshing,
  skills,
  criticalGaps = [],
  nextBestAction,
  onRefresh,
  onNavigate,
  onUploadResume,
  onNavigateSkills,
  onBridgeGap,
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ConstellationNode | null>(null);

  const safeSkills = useMemo(() => (Array.isArray(skills) ? skills : []), [skills]);
  const safeGaps = useMemo(() => (Array.isArray(criticalGaps) ? criticalGaps : []), [criticalGaps]);
  const safeAction: NextBestActionInfo = nextBestAction || {
    action: 'upload_resume',
    subtitle: 'Upload your PDF or DOCX resume to extract verified skills, benchmark ATS fit, and ground your readiness path.',
    route: '/resume',
    actionLabel: 'Upload Resume File',
    badge: 'Priority Action: Resume Upload',
  };

  const displayScore = isReadinessEvaluated && readinessScore !== null ? Math.round(readinessScore) : null;
  const strokeDash = displayScore !== null ? (displayScore / 100) * 283 : 0;
  const totalSkillsCount = safeSkills.length;

  // Synthesize nodes & edges for verified skills OR preview dormant career taxonomy
  const { nodes, edges } = useMemo(() => {
    const nodeList: ConstellationNode[] = [];
    const edgeList: Array<{ from: string; to: string; type: 'verified' | 'gap' | 'dormant' }> = [];

    // Summit Node in center
    const summitId = 'node-summit';
    nodeList.push({
      id: summitId,
      name: targetRole || 'Target Career Summit',
      category: 'Career Summit',
      x: 50,
      y: 50,
      type: 'summit',
    });

    if (totalSkillsCount === 0) {
      // Dormant preview satellites representing target domain intelligence
      const domainCapabilities = [
        { name: 'Neural Networks', category: 'Deep Learning' },
        { name: 'Transformer Architecture', category: 'LLMs & GenAI' },
        { name: 'MLOps & Pipeline Engineering', category: 'Infrastructure' },
        { name: 'Python Core & PyTorch', category: 'Frameworks' },
        { name: 'Feature Engineering', category: 'Data Modeling' },
        { name: 'Model Optimization', category: 'Production Systems' },
      ];

      domainCapabilities.forEach((cap, idx) => {
        const angle = (idx / domainCapabilities.length) * 2 * Math.PI - Math.PI / 2;
        const radius = 38;
        const x = 50 + Math.cos(angle) * radius;
        const y = 50 + Math.sin(angle) * (radius * 0.75);

        const id = `dormant-${idx}`;
        nodeList.push({
          id,
          name: cap.name,
          category: cap.category,
          x,
          y,
          type: 'dormant',
        });

        edgeList.push({
          from: id,
          to: summitId,
          type: 'dormant',
        });
      });
    } else {
      // Verified skills nodes
      const categories: Record<string, string[]> = {};
      safeSkills.forEach((s) => {
        if (!s || !s.name) return;
        const cat = s.category || 'General';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(s.name);
      });

      const categoryKeys = Object.keys(categories);
      const clusterAngles = [0.2, 1.4, 2.7, 4.1, 5.3];

      categoryKeys.forEach((cat, catIdx) => {
        const baseAngle = clusterAngles[catIdx % clusterAngles.length];
        const items = categories[cat] || [];
        const count = items.length;

        items.forEach((skillName, itemIdx) => {
          const spread = ((itemIdx - (count - 1) / 2) / Math.max(count, 1)) * 0.8;
          const angle = baseAngle + spread;
          const dist = 32 + (itemIdx % 3) * 6;
          const x = 50 + Math.cos(angle) * dist;
          const y = 50 + Math.sin(angle) * (dist * 0.72);

          const nodeId = `skill-${skillName}`;
          nodeList.push({
            id: nodeId,
            name: skillName,
            category: cat,
            x: Math.max(8, Math.min(92, x)),
            y: Math.max(12, Math.min(88, y)),
            type: 'skill',
          });

          if (itemIdx === 0) {
            edgeList.push({ from: nodeId, to: summitId, type: 'verified' });
          }
          if (itemIdx > 0) {
            edgeList.push({ from: `skill-${items[itemIdx - 1]}`, to: nodeId, type: 'verified' });
          }
        });
      });

      // Growth gaps
      safeGaps.forEach((gapName, idx) => {
        if (!gapName) return;
        const gapId = `gap-${gapName}`;
        const angle = (idx / Math.max(safeGaps.length, 1)) * Math.PI + 0.5;
        const x = 50 + Math.cos(angle) * 22;
        const y = 50 + Math.sin(angle) * 16;

        nodeList.push({
          id: gapId,
          name: gapName,
          category: 'Target Growth Gap',
          x,
          y,
          type: 'gap',
        });

        edgeList.push({ from: gapId, to: summitId, type: 'gap' });
      });
    }

    return { nodes: nodeList, edges: edgeList };
  }, [safeSkills, safeGaps, targetRole, totalSkillsCount]);

  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const set = new Set<string>([hoveredNodeId]);
    edges.forEach((edge) => {
      if (edge.from === hoveredNodeId) set.add(edge.to);
      if (edge.to === hoveredNodeId) set.add(edge.from);
    });
    return set;
  }, [hoveredNodeId, edges]);

  const hoveredNode = useMemo(() => {
    if (!hoveredNodeId) return null;
    return nodes.find((n) => n.id === hoveredNodeId) || null;
  }, [hoveredNodeId, nodes]);

  return (
    <div className="spatial-glass-blade p-7 sm:p-12 space-y-10 relative overflow-hidden">
      {/* 1. TOP SPATIAL APERTURE (Frameless, integrated, fluid) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
        <div className="space-y-3.5 max-w-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wide bg-amber-400/10 text-amber-300 border border-amber-400/30 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>{targetRole || 'Target Career Summit'}</span>
            </span>

            {primaryDomain && (
              <span className="text-xs text-slate-300 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
                {primaryDomain}
              </span>
            )}

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
              <span>Data loaded ({syncTime})</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-display leading-[1.15]">
              Welcome to Your Career Intelligence Space, <span className="bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent">{userName}</span>.
            </h1>
            <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed max-w-xl">
              A spatial observatory mapping verified proficiencies, high-leverage growth vectors, and live market alignment in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <MagneticButton
              onClick={() => onNavigate('/readiness')}
              className="spatial-ghost-btn group"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Inspect Readiness Matrix</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </MagneticButton>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="spatial-ghost-btn hover:text-white"
              title="Synchronize live platform telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isRefreshing ? 'Synchronizing...' : 'Sync Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* Top Right Gravitational Readiness Instrument */}
        <div className="flex items-center gap-6 p-6 rounded-3xl bg-gradient-to-br from-white/[0.05] to-black/50 border border-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] self-start lg:self-center">
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="7"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="url(#observatoryReadinessGradient)"
                strokeWidth="7"
                strokeDasharray="283"
                strokeDashoffset={283 - strokeDash}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="observatoryReadinessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-black text-white tracking-tight">
                {displayScore !== null ? `${displayScore}%` : '—'}
              </span>
              <span className="text-[10px] text-amber-300 font-bold uppercase tracking-widest">
                Readiness
              </span>
            </div>
          </div>

          <div className="space-y-1.5 max-w-[150px]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Career Gravitas</span>
            </div>
            <p className="text-xs text-slate-400 leading-snug">
              {displayScore !== null && displayScore >= 75
                ? 'High market alignment for target role.'
                : displayScore !== null && displayScore >= 50
                ? 'Moderate alignment; bridge priority gaps.'
                : 'Awaiting verified capability synthesis.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. THE CINEMATIC SPATIAL HOLOCRON (Expansive 3D Orbit & Constellation Theater) */}
      <div className="relative w-full h-[480px] sm:h-[560px] rounded-3xl bg-gradient-to-b from-black/60 via-[#060913]/80 to-black/90 border border-white/[0.08] overflow-hidden select-none shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]">
        {/* Concentric Holographic Rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Ring 1 (Outer) */}
          <div className="w-[520px] h-[520px] rounded-full border border-dashed border-white/[0.06] spin-orbit-slow flex items-center justify-center" />
          {/* Ring 2 (Middle) */}
          <div className="absolute w-[380px] h-[380px] rounded-full border border-white/[0.08] spin-orbit-counter flex items-center justify-center">
            <span className="absolute -top-2 text-[9px] font-mono text-slate-500 tracking-widest">000° ORBIT</span>
            <span className="absolute -bottom-2 text-[9px] font-mono text-slate-500 tracking-widest">180° HORIZON</span>
          </div>
          {/* Ring 3 (Inner Radar) */}
          <div className="absolute w-[240px] h-[240px] rounded-full border border-amber-400/20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/5 to-transparent radar-sweep-anim" />
          </div>
        </div>

        {/* SVG Connecting Filaments */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="verifiedFilamentObs" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(16, 185, 129, 0.6)" />
              <stop offset="100%" stopColor="rgba(226, 179, 87, 0.6)" />
            </linearGradient>
            <linearGradient id="gapFilamentObs" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.7)" />
              <stop offset="100%" stopColor="rgba(239, 68, 68, 0.3)" />
            </linearGradient>
            <linearGradient id="dormantFilamentObs" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(148, 163, 184, 0.2)" />
              <stop offset="100%" stopColor="rgba(226, 179, 87, 0.3)" />
            </linearGradient>
          </defs>

          {edges.map((edge, idx) => {
            const source = nodes.find((n) => n.id === edge.from);
            const target = nodes.find((n) => n.id === edge.to);
            if (!source || !target) return null;

            const isHovered = hoveredNodeId === source.id || hoveredNodeId === target.id;
            const strokeColor = isHovered
              ? 'rgba(245, 158, 11, 0.95)'
              : edge.type === 'gap'
              ? 'url(#gapFilamentObs)'
              : edge.type === 'verified'
              ? 'url(#verifiedFilamentObs)'
              : 'url(#dormantFilamentObs)';

            return (
              <line
                key={`${edge.from}-${edge.to}-${idx}`}
                x1={`${source.x}%`}
                y1={`${source.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke={strokeColor}
                strokeWidth={isHovered ? 2.5 : edge.type === 'dormant' ? 1 : 1.5}
                strokeDasharray={isHovered ? '6 4' : edge.type === 'dormant' || edge.type === 'gap' ? '4 4' : undefined}
                className={`transition-all duration-300 ${isHovered ? 'animate-pulse' : ''}`}
              />
            );
          })}
        </svg>

        {/* Constellation Nodes */}
        {nodes.map((node) => {
          const isSummit = node.type === 'summit';
          const isGap = node.type === 'gap';
          const isDormant = node.type === 'dormant';
          const isHovered = hoveredNodeId === node.id;
          const isSelected = selectedNode?.id === node.id;
          const isDimmed = Boolean(hoveredNodeId && !connectedNodeIds.has(node.id) && !isSummit);

          // The Central Core Summit
          if (isSummit) {
            return (
              <div
                key={node.id}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => setSelectedNode(null)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 transition-transform duration-500 hover:scale-108 select-none"
              >
                <div className="relative flex flex-col items-center">
                  <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-amber-500/20 via-yellow-400/30 to-amber-600/30 border-2 border-amber-400/60 backdrop-blur-2xl flex flex-col items-center justify-center p-3 text-center spatial-core-glow shadow-[0_0_50px_rgba(245,158,11,0.4)] transition-all ${
                    hoveredNode ? 'scale-105 border-amber-300 shadow-[0_0_60px_rgba(245,158,11,0.6)]' : ''
                  }`}>
                    <Target className="w-6 h-6 text-amber-300 animate-pulse mb-1" />
                    <span className="text-[10px] sm:text-xs font-black text-amber-100 uppercase tracking-tight leading-tight line-clamp-2">
                      {node.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono tracking-widest text-amber-300 uppercase mt-2 px-2.5 py-0.5 rounded-full bg-black/60 border border-amber-400/30 truncate max-w-[160px]">
                    {hoveredNode && hoveredNode.type !== 'summit'
                      ? `ALIGNING: ${hoveredNode.name}`
                      : 'GRAVITATIONAL CORE'}
                  </span>
                </div>
              </div>
            );
          }

          // Satellites (Verified, Gap, or Dormant)
          return (
            <div
              key={node.id}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onClick={() => {
                if (isDormant) {
                  onUploadResume();
                } else if (isGap && onBridgeGap) {
                  onBridgeGap(node.name);
                } else {
                  setSelectedNode(node);
                }
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 select-none ${
                isSelected ? 'scale-120 z-40' : isHovered ? 'scale-115 z-40' : isDimmed ? 'opacity-30 scale-95 z-10' : 'z-20'
              }`}
            >
              <div
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold backdrop-blur-xl flex items-center gap-2 border shadow-2xl transition-all relative ${
                  isGap
                    ? 'bg-amber-950/90 border-amber-500/60 text-amber-200 hover:border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    : isDormant
                    ? 'bg-slate-950/70 border-white/10 text-slate-400 hover:border-amber-400/40 hover:text-amber-200'
                    : 'bg-slate-900/90 border-emerald-500/40 text-emerald-100 hover:border-emerald-400 hover:bg-slate-800 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isGap
                      ? 'bg-amber-400 animate-ping'
                      : isDormant
                      ? 'bg-slate-500'
                      : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  }`}
                />
                <span className="truncate max-w-[140px]">{node.name}</span>

                {/* Floating Context Lens on Hover */}
                {isHovered && !isSelected && (
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-black/90 border border-white/20 text-[10px] text-white whitespace-nowrap shadow-2xl pointer-events-none z-50">
                    <span className="text-amber-300 font-mono font-bold mr-1">
                      {isGap ? 'GAP' : isDormant ? 'TARGET DOMAIN' : 'VERIFIED'}:
                    </span>
                    <span>{node.category}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Awakening Gateway Drawer Overlay (when totalSkills === 0) */}
        {totalSkillsCount === 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg p-5 rounded-2xl bg-black/80 border border-amber-500/30 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-amber-400 font-bold tracking-wide">
                <Sparkles className="w-4 h-4" />
                <span>Awaken Profile Intelligence</span>
              </div>
              <p className="text-xs text-slate-300">
                Drop your resume to illuminate verified capability nodes and map your trajectory.
              </p>
            </div>
            <MagneticButton
              onClick={onUploadResume}
              className="catalyst-magnetic-btn shrink-0 text-xs py-2 px-4 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Resume</span>
            </MagneticButton>
          </div>
        )}

        {/* Contextual Node Inspection Drawer */}
        {selectedNode && selectedNode.type !== 'summit' && (
          <div className="absolute top-6 right-6 max-w-xs sm:max-w-sm p-4 rounded-2xl bg-slate-950/95 border border-white/20 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-40 space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                {selectedNode.type === 'gap' ? (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span>{selectedNode.name}</span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedNode.type === 'gap'
                ? `Identified as a high-leverage competency gap for ${targetRole}. Bridging this directly accelerates your readiness.`
                : `Verified competency verified under ${selectedNode.category}. Anchored to your career capability portfolio.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              {selectedNode.type === 'gap' && onBridgeGap ? (
                <button
                  onClick={() => onBridgeGap(selectedNode.name)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-semibold border border-amber-500/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Bridge Gap</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={onNavigateSkills}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Full Portfolio</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Observatory Legend */}
        <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[11px] text-slate-400 bg-black/70 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span>Verified Mastery</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Target Growth Vector</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Dormant Capability</span>
          </span>
        </div>
      </div>

      {/* 3. CATALYST ACTION COMMAND BLADE (Docked at base of Observatory) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/[0.08] via-yellow-500/[0.05] to-transparent border border-amber-400/25 flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-xl">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{safeAction.badge || 'Priority Directive'}</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Aligned with {targetRole || 'Career Summit'}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-display">
            {safeAction.title}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {safeAction.subtitle}
          </p>
        </div>

        <div className="shrink-0 flex items-center">
          <MagneticButton
            onClick={() => onNavigate(safeAction.route)}
            className="catalyst-magnetic-btn group w-full md:w-auto"
          >
            <span>{safeAction.actionLabel}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </MagneticButton>
        </div>
      </div>
    </div>
  );
};
