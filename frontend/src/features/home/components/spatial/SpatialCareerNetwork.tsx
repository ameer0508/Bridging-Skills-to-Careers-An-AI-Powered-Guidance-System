import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Cpu,
  ShieldCheck,
  Compass,
  TrendingUp,
  Sparkles,
  Briefcase,
  Video,
  Target,
  ArrowRight,
  Share2,
  X,
} from 'lucide-react';
import { MagneticButton } from './MagneticButton';

export interface SpatialCareerNetworkProps {
  onNavigate: (route: string) => void;
  hasResume: boolean;
  totalSkills: number;
  readinessScore: number | null;
  savedOpportunities: number;
  totalInterviews: number;
  targetRole?: string;
  externalHighlightId?: string | null;
}

interface NetworkDomain {
  id: string;
  name: string;
  metric: string;
  category: string;
  icon: React.ElementType;
  route: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  accentColor: string;
  description: string;
  impacts: string;
  connectedTo: string[];
}

export const SpatialCareerNetwork: React.FC<SpatialCareerNetworkProps> = ({
  onNavigate,
  hasResume,
  totalSkills,
  readinessScore,
  savedOpportunities,
  totalInterviews,
  targetRole = 'Career Target',
  externalHighlightId,
}) => {
  const [hoveredDomainId, setHoveredDomainId] = useState<string | null>(null);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);

  const safeSkills = totalSkills || 0;
  const safeOpps = savedOpportunities || 0;
  const safeInterviews = totalInterviews || 0;
  const displayScore = readinessScore !== null ? Math.round(readinessScore) : null;

  // The 8 interconnected career intelligence domains organized in spatial harmony
  const domains: NetworkDomain[] = useMemo(() => [
    {
      id: 'resume',
      name: 'Profile & Resume',
      metric: hasResume ? 'Active Profile' : 'Upload Needed',
      category: 'Foundation',
      icon: FileText,
      route: '/resume',
      x: 50,
      y: 84,
      accentColor: '#38bdf8',
      description: 'Extracted career history, education, and source credentials.',
      impacts: 'Directly feeds extracted competencies into Your Skills.',
      connectedTo: ['skills', 'recommendations'],
    },
    {
      id: 'skills',
      name: 'Your Skills',
      metric: `${safeSkills} Verified`,
      category: 'Capabilities',
      icon: Cpu,
      route: '/skills',
      x: 24,
      y: 62,
      accentColor: '#10b981',
      description: 'Confirmed competencies, tools, frameworks, and verified strengths.',
      impacts: 'Powers the Readiness benchmark and identifies roadmap gaps.',
      connectedTo: ['resume', 'readiness', 'roadmap'],
    },
    {
      id: 'readiness',
      name: 'Readiness Audit',
      metric: displayScore !== null ? `${displayScore}% Benchmark` : 'Pending',
      category: 'Evaluation',
      icon: ShieldCheck,
      route: '/readiness',
      x: 50,
      y: 52,
      accentColor: '#f59e0b',
      description: 'Algorithmically weighted role alignment and gap severity scoring.',
      impacts: 'Defines threshold eligibility for live market opportunities.',
      connectedTo: ['skills', 'target', 'opportunities'],
    },
    {
      id: 'roadmap',
      name: 'Curriculum Roadmap',
      metric: 'Adaptive Path',
      category: 'Growth',
      icon: Compass,
      route: '/roadmap',
      x: 18,
      y: 32,
      accentColor: '#818cf8',
      description: 'Sequenced learning milestones engineered to close critical gaps.',
      impacts: 'Accelerates qualification toward your destination career target.',
      connectedTo: ['skills', 'target'],
    },
    {
      id: 'careers',
      name: 'Market Pathways',
      metric: 'Domain Trends',
      category: 'Strategy',
      icon: TrendingUp,
      route: '/careers',
      x: 82,
      y: 32,
      accentColor: '#2dd4bf',
      description: 'Industry hiring benchmarks, salary distributions, and taxonomy mapping.',
      impacts: 'Informs strategic trajectory toward high-growth specializations.',
      connectedTo: ['target', 'opportunities'],
    },
    {
      id: 'opportunities',
      name: 'Career Opportunities',
      metric: `${safeOpps} Tracked`,
      category: 'Market',
      icon: Briefcase,
      route: '/opportunities',
      x: 76,
      y: 62,
      accentColor: '#fb923c',
      description: 'Live role openings filtered and scored against your verified capabilities.',
      impacts: 'Selects target roles for interview coaching simulations.',
      connectedTo: ['readiness', 'interview-agent', 'careers'],
    },
    {
      id: 'interview-agent',
      name: 'Interview Preparation',
      metric: `${safeInterviews} Completed`,
      category: 'Simulation',
      icon: Video,
      route: '/interview-agent',
      x: 66,
      y: 84,
      accentColor: '#a855f7',
      description: 'Conversational audio simulation and technical defense practice.',
      impacts: 'Converts qualified pipeline roles into signed employment offers.',
      connectedTo: ['opportunities', 'target'],
    },
    {
      id: 'recommendations',
      name: 'Career Insights',
      metric: 'AI Directives',
      category: 'Advisory',
      icon: Sparkles,
      route: '/recommendations',
      x: 34,
      y: 84,
      accentColor: '#f43f5e',
      description: 'Real-time next-best-action guidance synthesized across all data.',
      impacts: 'Continuously orchestrates priorities across your entire journey.',
      connectedTo: ['resume', 'readiness'],
    },
  ], [hasResume, safeSkills, displayScore, safeOpps, safeInterviews]);

  // Target Career Apex Node
  const targetNode = {
    id: 'target',
    name: targetRole || 'Career Destination',
    metric: 'Summit Target',
    category: 'Target Summit',
    x: 50,
    y: 14,
  };

  // Build edge list from domain connections
  const edges = useMemo(() => {
    const edgeList: Array<{ from: string; to: string }> = [];
    domains.forEach((domain) => {
      domain.connectedTo.forEach((targetId) => {
        // Prevent duplicate undirected edges
        const exists = edgeList.some(
          (e) => (e.from === domain.id && e.to === targetId) || (e.from === targetId && e.to === domain.id)
        );
        if (!exists) {
          edgeList.push({ from: domain.id, to: targetId });
        }
      });
    });
    return edgeList;
  }, [domains]);

  // Calculate connected nodes for current hover/selection/trajectory-sync
  const activeFocusId = selectedDomainId || hoveredDomainId || externalHighlightId;
  const connectedIds = useMemo(() => {
    if (!activeFocusId) return new Set<string>();
    const set = new Set<string>([activeFocusId]);
    edges.forEach((e) => {
      if (e.from === activeFocusId) set.add(e.to);
      if (e.to === activeFocusId) set.add(e.from);
    });
    return set;
  }, [activeFocusId, edges]);

  const activeDomain = domains.find((d) => d.id === activeFocusId);

  // Dynamic semantic destination target reaction
  const targetSubtitle = useMemo(() => {
    if (activeFocusId === 'skills') return 'TARGET: SKILL ALIGNMENT';
    if (activeFocusId === 'readiness') return 'TARGET: BENCHMARK QUALIFIED';
    if (activeFocusId === 'roadmap') return 'TARGET: ROADMAP ACCELERATION';
    if (activeFocusId === 'opportunities') return 'TARGET: LIVE MARKET ROLES';
    if (activeFocusId === 'interview-agent') return 'TARGET: OFFER ACQUISITION';
    if (activeFocusId === 'resume') return 'TARGET: PROFILE GROUNDING';
    if (activeFocusId === 'careers') return 'TARGET: PATHWAY TAXONOMY';
    if (activeFocusId === 'recommendations') return 'TARGET: STRATEGIC VECTOR';
    return 'SUMMIT DESTINATION';
  }, [activeFocusId]);

  return (
    <div className="spatial-glass-blade p-6 sm:p-10 space-y-8 relative overflow-hidden" onClick={() => setSelectedDomainId(null)}>
      {/* Network Header Aperture */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-white/[0.06] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-400" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-amber-300 font-semibold">
              Career Intelligence Network
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Interconnected Career System
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Every capability, benchmark, and market opportunity operates as an interrelated system guiding you to your career summit.
          </p>
        </div>

        <span className="text-xs text-slate-300 font-mono px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] self-start sm:self-center backdrop-blur-md">
          8 Interconnected Domains
        </span>
      </div>

      {/* The Interactive Spatial Network Stage */}
      <div className="relative w-full h-[460px] sm:h-[500px] rounded-3xl bg-black/40 border border-white/[0.06] overflow-hidden select-none shadow-[inset_0_0_80px_rgba(0,0,0,0.85)]">
        {/* SVG Connection Paths */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="networkEdgeDefault" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.08)" />
              <stop offset="100%" stopColor="rgba(226, 179, 87, 0.2)" />
            </linearGradient>
            <linearGradient id="networkEdgeActive" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.9)" />
              <stop offset="100%" stopColor="rgba(251, 191, 36, 1)" />
            </linearGradient>
          </defs>

          {edges.map((edge, idx) => {
            const allNodes = [...domains, targetNode];
            const source = allNodes.find((n) => n.id === edge.from);
            const target = allNodes.find((n) => n.id === edge.to);
            if (!source || !target) return null;

            const isEdgeActive =
              activeFocusId &&
              (edge.from === activeFocusId || edge.to === activeFocusId);

            return (
              <line
                key={`edge-${edge.from}-${edge.to}-${idx}`}
                x1={`${source.x}%`}
                y1={`${source.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke={isEdgeActive ? 'url(#networkEdgeActive)' : 'url(#networkEdgeDefault)'}
                strokeWidth={isEdgeActive ? 2.5 : 1}
                strokeDasharray={isEdgeActive ? '6 4' : '3 3'}
                className={`transition-all duration-300 ${isEdgeActive ? 'animate-pulse' : 'opacity-40'}`}
              />
            );
          })}
        </svg>

        {/* 1. Target Career Apex Node */}
        <div
          style={{ left: `${targetNode.x}%`, top: `${targetNode.y}%` }}
          onClick={(e) => {
            e.stopPropagation();
            onNavigate('/readiness');
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 transition-transform duration-300 hover:scale-108"
        >
          <div className="relative flex flex-col items-center">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500/25 via-yellow-400/30 to-amber-600/35 border-2 border-amber-400/80 backdrop-blur-2xl flex flex-col items-center justify-center p-2 text-center shadow-[0_0_35px_rgba(245,158,11,0.45)] transition-all ${
              activeFocusId ? 'border-amber-300 shadow-[0_0_50px_rgba(245,158,11,0.65)] scale-105' : ''
            }`}>
              <Target className="w-5 h-5 text-amber-300 animate-pulse mb-0.5" />
              <span className="text-[9px] font-black text-white uppercase tracking-tight line-clamp-1">
                {targetNode.name}
              </span>
            </div>
            <span className="text-[8px] font-mono tracking-widest text-amber-300 uppercase mt-1.5 px-2 py-0.5 rounded-full bg-black/70 border border-amber-400/30 truncate max-w-[170px]">
              {targetSubtitle}
            </span>
          </div>
        </div>

        {/* 2. The 8 Domain Nodes */}
        {domains.map((domain) => {
          const Icon = domain.icon;
          const isSelected = selectedDomainId === domain.id;
          const isFocused = activeFocusId === domain.id;
          const isNeighbor = activeFocusId && connectedIds.has(domain.id) && !isFocused;
          const isDimmed = activeFocusId && !connectedIds.has(domain.id);

          return (
            <div
              key={domain.id}
              style={{ left: `${domain.x}%`, top: `${domain.y}%` }}
              onMouseEnter={() => setHoveredDomainId(domain.id)}
              onMouseLeave={() => setHoveredDomainId(null)}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDomainId(selectedDomainId === domain.id ? null : domain.id);
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-20 ${
                isSelected
                  ? 'scale-120 z-40'
                  : isFocused
                  ? 'scale-115 z-40'
                  : isNeighbor
                  ? 'scale-105 z-30'
                  : isDimmed
                  ? 'opacity-20 scale-95'
                  : ''
              }`}
            >
              <div
                className={`p-3 sm:p-3.5 rounded-2xl backdrop-blur-xl border flex items-center gap-3 transition-all shadow-xl ${
                  isSelected
                    ? 'bg-slate-900/95 border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.5)]'
                    : isFocused
                    ? 'bg-slate-900/95 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.35)]'
                    : isNeighbor
                    ? 'bg-black/90 border-white/30'
                    : 'bg-black/70 border-white/10 hover:border-white/30'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform"
                  style={{
                    backgroundColor: `${domain.accentColor}20`,
                    color: domain.accentColor,
                    borderColor: `${domain.accentColor}40`,
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="pr-1">
                  <span className="text-[9px] font-mono uppercase tracking-wider block text-slate-400">
                    {domain.category}
                  </span>
                  <h4 className="text-xs font-bold text-white tracking-tight truncate max-w-[110px] sm:max-w-[130px]">
                    {domain.name}
                  </h4>
                  <span className="text-[10px] font-medium" style={{ color: domain.accentColor }}>
                    {domain.metric}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Dynamic Contextual Glass Surface on Hover / Selection */}
        <AnimatePresence>
          {activeDomain && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-5 left-5 right-5 sm:left-auto sm:right-6 sm:max-w-sm p-4 rounded-2xl bg-slate-950/95 border border-white/20 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-50 space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: activeDomain.accentColor }}
                  />
                  <h5 className="text-xs font-bold text-white">{activeDomain.name}</h5>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">
                    {activeDomain.metric}
                  </span>
                  {selectedDomainId && (
                    <button
                      onClick={() => setSelectedDomainId(null)}
                      className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {activeDomain.description}
              </p>

              <div className="text-[11px] text-amber-300/90 font-medium pt-1 border-t border-white/5">
                ↳ {activeDomain.impacts}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onNavigate(activeDomain.route)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Open {activeDomain.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
