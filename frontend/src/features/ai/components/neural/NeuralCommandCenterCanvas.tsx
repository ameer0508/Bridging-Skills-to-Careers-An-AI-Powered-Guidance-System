import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Target,
  RefreshCw,
  Plus,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { NeuralAICore, AICoreState } from './NeuralAICore';
import { NeuralContextOrbit, ContextTelemetry } from './NeuralContextOrbit';
import { NeuralAgentConstellation } from './NeuralAgentConstellation';
import { NeuralInspectorBlade, AgentDescriptor } from './NeuralInspectorBlade';

interface CareerMatchOption {
  careerId?: {
    _id: string;
    title: string;
    category?: string;
  };
  matchScore?: number;
}

interface NeuralCommandCenterCanvasProps {
  aiState: AICoreState;
  targetRole: string;
  activeDomain?: string;
  careers: CareerMatchOption[];
  selectedCareerId?: string;
  onSelectCareerContext: (careerId: string) => void;
  onNewChat: () => void;
  telemetry: ContextTelemetry;
  matchScore: number;
  readinessScore: number;
  atsScore: number;
  opportunityCount: number;
  onOpenConversationDrawer?: () => void;
}

export const NeuralCommandCenterCanvas: React.FC<NeuralCommandCenterCanvasProps> = ({
  aiState,
  targetRole,
  activeDomain,
  careers,
  selectedCareerId,
  onSelectCareerContext,
  onNewChat,
  telemetry,
  matchScore,
  readinessScore,
  atsScore,
  opportunityCount,
  onOpenConversationDrawer,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentDescriptor | null>(null);
  const [isCareerDropdownOpen, setIsCareerDropdownOpen] = useState(false);

  // Mouse Coordinates with smooth spring physics
  const canvasRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-[620px] lg:min-h-[700px] rounded-3xl overflow-hidden neural-glass-blade border-cyan-500/20 shadow-2xl p-6 sm:p-8 flex flex-col justify-between select-none"
    >
      {/* 1. Cursor-Reactive Specular Spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-40 transition-opacity duration-300"
        style={{
          background: `radial-gradient(550px circle at ${springX}px ${springY}px, rgba(6, 182, 212, 0.15), rgba(99, 102, 241, 0.08), transparent 70%)`,
        }}
      />

      {/* 2. Neural Background Grid & Nebula Layer */}
      <div className="neural-grid-matrix" />

      {/* 3. Top Spatial Masthead & Context Controls */}
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        {/* Left: Target Role Selector & Live Domain Badge */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Target Role Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsCareerDropdownOpen(!isCareerDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-400/30 hover:bg-cyan-500/20 backdrop-blur-md transition-all shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            >
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Role: {targetRole}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCareerDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Career Matches Dropdown Menu */}
            <AnimatePresence>
              {isCareerDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-slate-950/95 border border-white/15 backdrop-blur-2xl shadow-2xl p-2 z-50 space-y-1"
                >
                  <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-widest border-b border-white/10">
                    Switch Active Intelligence Target
                  </div>
                  {careers.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-400">No matched paths found.</div>
                  ) : (
                    careers.map((c) => {
                      const cid = c.careerId?._id;
                      const isCurrent = cid === selectedCareerId || (!selectedCareerId && c.careerId?.title === targetRole);
                      return (
                        <button
                          key={cid || c.careerId?.title}
                          onClick={() => {
                            if (cid) onSelectCareerContext(cid);
                            setIsCareerDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left ${
                            isCurrent
                              ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 font-semibold'
                              : 'text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          <span className="truncate">{c.careerId?.title}</span>
                          {c.matchScore !== undefined && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-cyan-300">
                              {c.matchScore}%
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {activeDomain && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-300 bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <Layers className="w-3 h-3 text-purple-400" />
              <span>{activeDomain}</span>
            </span>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="font-mono">7-Agent DAG Synced</span>
          </div>
        </div>

        {/* Right: New Chat Catalyst & Conversation Drawer Trigger */}
        <div className="flex items-center gap-2">
          {onOpenConversationDrawer && (
            <button
              onClick={onOpenConversationDrawer}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.05] border border-white/10 text-slate-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Open Advisory Cockpit</span>
            </button>
          )}

          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-linear-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Advisory Stream</span>
          </button>
        </div>
      </div>

      {/* 4. Living Centerpiece: Interactive Neural Environment Stage */}
      <div className="relative flex-1 flex items-center justify-center my-6 min-h-[420px] lg:min-h-[460px]">
        {/* Layer A: Context Receptor Orbit (Inner Ring) */}
        <NeuralContextOrbit
          telemetry={telemetry}
          onSelectContextNode={(key) => {
            // Context node clicked
          }}
        />

        {/* Layer B: Outer Subsystem Constellation (7 Agents) */}
        <NeuralAgentConstellation
          onSelectAgent={(agent) => setSelectedAgent(agent)}
          selectedAgentId={selectedAgent?.id}
          matchScore={matchScore}
          readinessScore={readinessScore}
          atsScore={atsScore}
          opportunityCount={opportunityCount}
        />

        {/* Layer C: Dominant Central AI Core */}
        <div className="relative z-20">
          <NeuralAICore
            state={aiState}
            targetRole={targetRole}
            activeCareerDomain={activeDomain}
            onClick={() => setSelectedAgent(null)}
          />
        </div>

        {/* Layer D: Floating Neural Inspector Blade (when agent hovered/clicked) */}
        <AnimatePresence>
          {selectedAgent && (
            <NeuralInspectorBlade
              agent={selectedAgent}
              onClose={() => setSelectedAgent(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* 5. Bottom Ambient Intelligence Status Footer */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive Neural Constellation: Hover agents or context nodes to inspect telemetry pathways.</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>Engine: <span className="text-cyan-300 font-semibold">Gemini Multi-Agent Orchestration</span></span>
          <span className="text-slate-600">•</span>
          <span>Security: <span className="text-emerald-400 font-semibold">Deterministic Grounding</span></span>
        </div>
      </div>
    </div>
  );
};

export default NeuralCommandCenterCanvas;
