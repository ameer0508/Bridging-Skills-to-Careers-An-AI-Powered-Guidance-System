import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Target,
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
      className="relative w-full min-h-[620px] lg:min-h-[700px] rounded-3xl overflow-hidden neural-glass-blade border-aurora-violet/25 shadow-2xl p-6 sm:p-8 flex flex-col justify-between select-none"
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
      <div className="relative z-30 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-aurora-line">
        {/* Left: Target Role Selector & Live Domain Badge */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Target Role Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsCareerDropdownOpen(!isCareerDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-aurora-violet/[0.06] text-aurora-violet border border-cyan-400/30 hover:bg-aurora-violet/[0.06] backdrop-blur-md transition-all shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            >
              <Target className="w-3.5 h-3.5 text-aurora-violet" />
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
                  className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-aurora-canvas/60 border border-aurora-line backdrop-blur-2xl shadow-2xl p-2 z-50 space-y-1"
                >
                  <div className="px-3 py-1.5 text-[10px] text-aurora-muted uppercase tracking-widest border-b border-aurora-line">
                    Switch Active Intelligence Target
                  </div>
                  {careers.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-aurora-muted">No matched paths found.</div>
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
                              ? 'bg-aurora-violet/[0.06] text-aurora-violet border border-aurora-violet/25 font-semibold'
                              : 'text-aurora-muted hover:bg-aurora-canvas'
                          }`}
                        >
                          <span className="truncate">{c.careerId?.title}</span>
                          {c.matchScore !== undefined && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-aurora-canvas text-aurora-violet">
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
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-aurora-muted bg-white/[0.04] border border-aurora-line backdrop-blur-md">
              <Layers className="w-3 h-3 text-aurora-violet" />
              <span>{activeDomain}</span>
            </span>
          )}

          <div className="flex items-center gap-2 text-[11px] text-aurora-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="font-mono">Your data loaded</span>
          </div>
        </div>

        {/* Right: New Chat Catalyst & Conversation Drawer Trigger */}
        <div className="flex items-center gap-2">
          {onOpenConversationDrawer && (
            <button
              onClick={onOpenConversationDrawer}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/[0.05] border border-aurora-line text-aurora-ink hover:text-aurora-indigo hover:bg-aurora-canvas transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-aurora-violet" />
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
          onSelectContextNode={() => {
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
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-aurora-line text-xs text-aurora-muted">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-aurora-violet" />
          <span>Interactive Neural Constellation: Hover agents or context nodes to inspect telemetry pathways.</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>Engine: <span className="text-aurora-violet font-semibold">Gemini Multi-Agent Orchestration</span></span>
          <span className="text-aurora-muted">•</span>
          <span>Security: <span className="text-emerald-700 font-semibold">Deterministic Grounding</span></span>
        </div>
      </div>
    </div>
  );
};

export default NeuralCommandCenterCanvas;
