import React, { useState } from 'react';
import {
  Workflow,
  ChevronRight,
  Info
} from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';
import { IAgentMetadata } from '../../../types/orchestrator';

export interface AgentTopologyNetworkProps {
  agents: IAgentMetadata[];
  selectedAgentId: string | null;
  onSelectAgent: (agent: IAgentMetadata) => void;
  isExecuting?: boolean;
}

interface NodePosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export const AgentTopologyNetwork: React.FC<AgentTopologyNetworkProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  isExecuting = false,
}) => {
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'GRAPH' | 'TABLE'>('GRAPH');

  // Defined spatial positions for the 10 real agents
  const nodePositions: Record<string, NodePosition> = {
    orchestrator: { x: 50, y: 50 }, // Central Root Coordinator
    career_agent: { x: 26, y: 22 },
    skill_agent: { x: 50, y: 15 },
    readiness_agent: { x: 74, y: 22 },
    resume_agent: { x: 12, y: 48 },
    learning_agent: { x: 88, y: 48 },
    job_agent: { x: 24, y: 78 },
    interview_agent: { x: 76, y: 78 },
    analytics_agent: { x: 40, y: 88 },
    recommendation_agent: { x: 60, y: 88 },
  };

  // Real inter-agent data flow pipelines
  const realEdges = [
    { from: 'orchestrator', to: 'career_agent', label: 'DAG Phase 1 Dispatch' },
    { from: 'orchestrator', to: 'skill_agent', label: 'DAG Phase 2 Dispatch' },
    { from: 'orchestrator', to: 'resume_agent', label: 'Resume ATS Sync' },
    { from: 'orchestrator', to: 'interview_agent', label: 'DAG Phase 3 Dispatch' },
    { from: 'orchestrator', to: 'job_agent', label: 'DAG Phase 4 Dispatch' },
    { from: 'orchestrator', to: 'learning_agent', label: 'Roadmap Sync' },
    { from: 'resume_agent', to: 'career_agent', label: 'Parsed Experience' },
    { from: 'career_agent', to: 'skill_agent', label: 'Target Role Context' },
    { from: 'career_agent', to: 'readiness_agent', label: 'Role Requirements' },
    { from: 'skill_agent', to: 'learning_agent', label: 'Competency Gaps' },
    { from: 'skill_agent', to: 'interview_agent', label: 'Skills on Profile' },
    { from: 'career_agent', to: 'job_agent', label: 'Search Criteria' },
    { from: 'readiness_agent', to: 'recommendation_agent', label: 'Diagnostic Signals' },
    { from: 'interview_agent', to: 'analytics_agent', label: 'Evaluation Telemetry' },
  ];

  const activeFocusId = hoveredAgentId || selectedAgentId;

  return (
    <GlassPanel className="p-6 space-y-6 border-aurora-violet/25">
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-aurora-indigo flex items-center gap-2">
            <Workflow className="w-4 h-4 text-aurora-indigo" />
            Living Agent Topology Network (10 Subsystems)
          </span>
          <p className="text-[11px] text-aurora-muted">
            Interactive map of SkillBridge's autonomous agents. Hover to trace inter-agent context flow; click to inspect subsystem details.
          </p>
        </div>

        {/* View Switcher: Interactive Graph vs Accessible Table */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-aurora-canvas border border-aurora-line text-xs">
          <button
            onClick={() => setViewMode('GRAPH')}
            type="button"
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              viewMode === 'GRAPH'
                ? 'text-white [background:var(--aurora-gradient-action)] shadow-aurora-sm'
                : 'text-aurora-muted hover:text-aurora-indigo'
            }`}
          >
            Spatial Graph
          </button>
          <button
            onClick={() => setViewMode('TABLE')}
            type="button"
            className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
              viewMode === 'TABLE'
                ? 'text-white [background:var(--aurora-gradient-action)] shadow-aurora-sm'
                : 'text-aurora-muted hover:text-aurora-indigo'
            }`}
          >
            Tabular Matrix
          </button>
        </div>
      </div>

      {viewMode === 'GRAPH' ? (
        /* SPATIAL SVG TOPOLOGY VISUALIZATION */
        <div className="relative w-full h-[520px] rounded-2xl bg-aurora-canvas border border-aurora-line overflow-hidden shadow-inner flex items-center justify-center">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          
          {/* Radial Ambient Center Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* SVG Connection Layer */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
          >
            <defs>
              <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {realEdges.map((edge, i) => {
              const fromPos = nodePositions[edge.from];
              const toPos = nodePositions[edge.to];
              if (!fromPos || !toPos) return null;

              const isConnected =
                activeFocusId === edge.from || activeFocusId === edge.to;
              const isDimmed = activeFocusId && !isConnected;

              return (
                <g key={i} className="transition-opacity duration-300">
                  <line
                    x1={fromPos.x}
                    y1={fromPos.y}
                    x2={toPos.x}
                    y2={toPos.y}
                    stroke={isConnected ? '#818cf8' : 'rgba(99, 102, 241, 0.25)'}
                    strokeWidth={isConnected ? (isExecuting ? 2.5 : 2) : 1}
                    strokeDasharray={edge.from === 'orchestrator' ? '4 3' : undefined}
                    vectorEffect="non-scaling-stroke"
                    opacity={isDimmed ? 0.15 : isConnected ? 1 : 0.6}
                  />
                  {/* Optional animated pulse along edge if executing */}
                  {isExecuting && isConnected && (
                    <circle r="0.8" fill="#38bdf8">
                      <animateMotion
                        path={`M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive Agent Nodes */}
          <div className="absolute inset-0 z-10">
            {agents.map((agent) => {
              const pos = nodePositions[agent.id] || { x: 50, y: 50 };
              const isSelected = selectedAgentId === agent.id;
              const isHovered = hoveredAgentId === agent.id;
              const isRoot = agent.id === 'orchestrator';

              const isRelated =
                !activeFocusId ||
                activeFocusId === agent.id ||
                realEdges.some(
                  (e) =>
                    (e.from === activeFocusId && e.to === agent.id) ||
                    (e.to === activeFocusId && e.from === agent.id)
                );

              return (
                <div
                  key={agent.id}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onMouseEnter={() => setHoveredAgentId(agent.id)}
                  onMouseLeave={() => setHoveredAgentId(null)}
                  onClick={() => onSelectAgent(agent)}
                  className={`group cursor-pointer transition-all duration-300 select-none ${
                    !isRelated ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
                  }`}
                >
                  <div
                    className={`relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-2.5 shadow-xl ${
                      isRoot
                        ? 'bg-violet-50 border-aurora-violet text-aurora-ink ring-2 ring-indigo-500/50'
                        : isSelected
                        ? 'bg-violet-50 border-indigo-400 text-aurora-ink ring-2 ring-indigo-400'
                        : isHovered
                        ? 'bg-aurora-canvas border-aurora-violet/25 text-aurora-ink scale-105'
                        : 'bg-aurora-canvas/60 border-aurora-line text-aurora-muted hover:border-aurora-line'
                    }`}
                  >
                    {/* Node Status Dot */}
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        agent.status === 'ACTIVE'
                          ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                          : 'bg-amber-400'
                      }`}
                    />

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold whitespace-nowrap block">
                          {agent.name}
                        </span>
                        {isRoot && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25 uppercase">
                            ROOT
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-aurora-muted block tracking-tight truncate max-w-[140px]">
                        v{agent.version} • {agent.category}
                      </span>
                    </div>

                    {/* Subtle Click Cue */}
                    <ChevronRight className="w-3.5 h-3.5 text-aurora-muted group-hover:text-aurora-indigo transition" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hovered Node Quick Telemetry Banner (Bottom of Graph) */}
          {hoveredAgentId && (
            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-violet/25 z-20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-aurora-indigo shrink-0" />
                <span className="text-aurora-muted">
                  {agents.find((a) => a.id === hoveredAgentId)?.purpose}
                </span>
              </div>
              <span className="text-[10px] text-aurora-indigo font-bold uppercase shrink-0">
                Click to Open Subsystem Inspector →
              </span>
            </div>
          )}
        </div>
      ) : (
        /* ACCESSIBLE TABULAR MATRIX ALTERNATIVE */
        <div className="overflow-x-auto rounded-2xl border border-aurora-line">
          <table className="w-full text-left text-xs tabular-nums">
            <thead className="bg-aurora-canvas text-aurora-muted uppercase text-[10px] border-b border-aurora-line">
              <tr>
                <th className="p-3">Agent Identity</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Primary Purpose</th>
                <th className="p-3">Core Tool</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aurora-line bg-aurora-canvas/60">
              {agents.map((agent) => (
                <tr
                  key={agent.id}
                  onClick={() => onSelectAgent(agent)}
                  className={`hover:bg-violet-50 transition cursor-pointer ${
                    selectedAgentId === agent.id ? 'bg-violet-50' : ''
                  }`}
                >
                  <td className="p-3 font-bold text-aurora-ink flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        agent.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    <span>{agent.name}</span>
                    <span className="text-[10px] text-aurora-muted">v{agent.version}</span>
                  </td>
                  <td className="p-3 text-aurora-muted">{agent.category}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {agent.status}
                    </span>
                  </td>
                  <td className="p-3 text-aurora-muted max-w-sm truncate">{agent.purpose}</td>
                  <td className="p-3 text-aurora-indigo">{agent.tools[0] || 'Core Engine'}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-lg bg-aurora-canvas hover:bg-indigo-600 text-white text-[11px] font-semibold transition"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassPanel>
  );
};
