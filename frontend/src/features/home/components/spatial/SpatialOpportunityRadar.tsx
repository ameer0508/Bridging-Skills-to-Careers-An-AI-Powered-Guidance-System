import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, ArrowUpRight, Sparkles } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

export interface SpatialOpportunityRadarProps {
  opportunities: {
    saved: number;
    applied: number;
    interviewing: number;
    offer: number;
    total: number;
  };
  onNavigate: (route: string) => void;
  targetRole?: string;
  marketStatus?: 'LIVE' | 'SANDBOX';
}

export const SpatialOpportunityRadar: React.FC<SpatialOpportunityRadarProps> = ({
  opportunities,
  onNavigate,
  targetRole = 'Target Role',
  marketStatus = 'SANDBOX',
}) => {
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const safeOpps = opportunities || { saved: 0, applied: 0, interviewing: 0, offer: 0, total: 0 };
  const hasActivePipeline = (safeOpps.saved + safeOpps.applied + safeOpps.interviewing + safeOpps.offer) > 0;

  // Real pipeline orbital stations
  const pipelineStages = [
    {
      id: 'saved',
      name: 'Tracked',
      count: safeOpps.saved,
      radius: 40,
      angle: -0.75, // radians (~-43°)
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.25)',
      description: 'Saved opportunities undergoing fit analysis and tailoring.',
    },
    {
      id: 'applied',
      name: 'Submitted',
      count: safeOpps.applied,
      radius: 58,
      angle: 0.45, // (~26°)
      color: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.25)',
      description: 'Applications active across talent acquisition systems.',
    },
    {
      id: 'interviewing',
      name: 'In Review',
      count: safeOpps.interviewing,
      radius: 76,
      angle: 2.2, // (~126°)
      color: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.25)',
      description: 'Active candidate rounds, technical screens, and loops.',
    },
    {
      id: 'offer',
      name: 'Secured Offers',
      count: safeOpps.offer,
      radius: 92,
      angle: 3.8, // (~217°)
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.25)',
      description: 'Final evaluation proposals and compensation contracts.',
    },
  ];

  return (
    <div className="spatial-glass-blade p-6 sm:p-10 space-y-8 relative overflow-hidden">
      {/* Header Aperture */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-white/[0.06] pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                marketStatus === 'LIVE'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                  : 'bg-sky-400 shadow-[0_0_8px_#38bdf8]'
              } animate-pulse`}
            />
            <span
              className={`text-[11px] font-mono tracking-widest uppercase font-semibold ${
                marketStatus === 'LIVE' ? 'text-emerald-300' : 'text-sky-300'
              }`}
            >
              Market Proximity Radar
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider ${
                marketStatus === 'LIVE'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
                  : 'bg-sky-500/10 text-sky-300 border border-sky-500/25'
              }`}
              title={
                marketStatus === 'LIVE'
                  ? 'Live JSearch API Provider Active'
                  : 'Sandbox Provider Mode (Add RAPIDAPI_KEY to backend/.env for live postings)'
              }
            >
              {marketStatus === 'LIVE' ? 'LIVE JSEARCH' : 'SANDBOX MODE'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Career Opportunities
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Spatial distribution of target market positions relative to your capability benchmark.
          </p>
        </div>

        <MagneticButton
          onClick={() => onNavigate('/opportunities')}
          className="spatial-ghost-btn group text-xs py-2 px-4 self-start sm:self-center"
        >
          <span>{marketStatus === 'LIVE' ? 'Explore Live Market' : 'Explore Market Sandbox'}</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </MagneticButton>
      </div>

      {/* Spatial Radar Field */}
      <div className="relative w-full h-[360px] sm:h-[400px] rounded-3xl bg-black/40 border border-white/[0.06] overflow-hidden flex items-center justify-center select-none shadow-[inset_0_0_60px_rgba(0,0,0,0.8)]">
        {/* Concentric Orbital Radar Bands */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Outer Ring */}
          <div className="w-[340px] h-[340px] rounded-full border border-dashed border-white/[0.07]" />
          {/* Middle Ring */}
          <div className="absolute w-[250px] h-[250px] rounded-full border border-white/[0.08]" />
          {/* Inner Ring */}
          <div className="absolute w-[160px] h-[160px] rounded-full border border-amber-400/15" />

          {/* Crosshair Coordinate Axes */}
          <div className="absolute w-full h-px bg-white/[0.04]" />
          <div className="absolute h-full w-px bg-white/[0.04]" />

          {/* Radar Sweep Arc */}
          <div className="absolute w-[340px] h-[340px] rounded-full bg-gradient-to-tr from-amber-500/10 via-transparent to-transparent radar-sweep-anim" />
        </div>

        {/* Center: The User */}
        <div className="relative z-20 flex flex-col items-center">
          <motion.div
            whileHover={{ scale: 1.08 }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500/20 via-yellow-400/25 to-amber-600/30 border-2 border-amber-400/60 backdrop-blur-xl flex flex-col items-center justify-center text-center p-2 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
          >
            <Compass className="w-5 h-5 text-amber-300 animate-pulse mb-0.5" />
            <span className="text-[9px] font-black text-white uppercase tracking-tight">YOU</span>
          </motion.div>
          <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase mt-2 px-2 py-0.5 rounded-full bg-black/70 border border-white/10">
            {targetRole}
          </span>
        </div>

        {/* Satellite Stage Nodes (Positioned along orbital radii) */}
        {pipelineStages.map((stage) => {
          const x = 50 + Math.cos(stage.angle) * (stage.radius * 0.42);
          const y = 50 + Math.sin(stage.angle) * (stage.radius * 0.38);
          const isSelected = activeStage === stage.id;

          return (
            <div
              key={stage.id}
              style={{ left: `${x}%`, top: `${y}%` }}
              onMouseEnter={() => setActiveStage(stage.id)}
              onMouseLeave={() => setActiveStage(null)}
              onClick={() => onNavigate('/opportunities')}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group"
            >
              <motion.div
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-2xl backdrop-blur-xl border flex items-center gap-3 transition-all shadow-xl ${
                  isSelected
                    ? 'bg-slate-900/95 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.3)]'
                    : 'bg-black/80 border-white/10 hover:border-white/30'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0"
                  style={{ backgroundColor: `${stage.color}20`, color: stage.color }}
                >
                  {stage.count}
                </div>
                <div className="pr-1">
                  <div className="text-[11px] font-bold text-white tracking-tight flex items-center gap-1.5">
                    <span>{stage.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {stage.count === 1 ? '1 position' : `${stage.count} positions`}
                  </span>
                </div>
              </motion.div>
            </div>
          );
        })}

        {/* Floating Contextual Lens when stage hovered */}
        {activeStage && (
          <div className="absolute bottom-4 left-6 right-6 sm:left-auto sm:right-6 sm:max-w-xs p-3.5 rounded-2xl bg-slate-950/90 border border-white/15 backdrop-blur-2xl text-xs z-40 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-1.5">
              <span className="font-bold text-white">
                {pipelineStages.find((s) => s.id === activeStage)?.name} Orbit
              </span>
              <span className="text-[10px] text-amber-400 font-mono">
                {pipelineStages.find((s) => s.id === activeStage)?.count} Active
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              {pipelineStages.find((s) => s.id === activeStage)?.description}
            </p>
          </div>
        )}

        {/* Empty state overlay message if zero opportunities tracked */}
        {!hasActivePipeline && !activeStage && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-slate-400 backdrop-blur-md pointer-events-none flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Radar active. Discover market roles aligned to your profile.</span>
          </div>
        )}
      </div>
    </div>
  );
};
