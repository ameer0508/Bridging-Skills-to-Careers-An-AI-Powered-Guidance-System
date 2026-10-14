import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ShieldCheck, FileText, Layers, Briefcase, UserCheck } from 'lucide-react';

export interface ContextTelemetry {
  totalSkills: number;
  readinessScore: number | null;
  atsScore: number | null;
  roadmapProgress: number | null;
  activePhaseTitle?: string;
  opportunityCount: number;
  userDomain: string;
}

interface NeuralContextOrbitProps {
  telemetry: ContextTelemetry;
  onSelectContextNode?: (nodeKey: string) => void;
}

interface OrbitingContextNode {
  key: string;
  label: string;
  value: string;
  sublabel: string;
  icon: React.ReactNode;
  angleDeg: number; // Angle in degrees around core
  color: 'cyan' | 'indigo' | 'purple' | 'amber' | 'emerald';
}

export const NeuralContextOrbit: React.FC<NeuralContextOrbitProps> = ({
  telemetry,
  onSelectContextNode,
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const contextNodes: OrbitingContextNode[] = [
    {
      key: 'skills',
      label: 'Skills Matrix',
      value: `${telemetry.totalSkills} on profile`,
      sublabel: 'Evidence Grounded',
      icon: <Cpu className="w-4 h-4 text-aurora-violet" />,
      angleDeg: -60,
      color: 'cyan',
    },
    {
      key: 'readiness',
      label: 'Readiness Rating',
      value: telemetry.readinessScore !== null ? `${Math.round(telemetry.readinessScore)}%` : 'Pending',
      sublabel: '5 Competency Vectors',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-700" />,
      angleDeg: 0,
      color: 'emerald',
    },
    {
      key: 'ats',
      label: 'Resume completeness',
      value: telemetry.atsScore !== null && telemetry.atsScore > 0 ? `${telemetry.atsScore}/100` : 'Sync Pending',
      sublabel: 'Parser Telemetry',
      icon: <FileText className="w-4 h-4 text-aurora-indigo" />,
      angleDeg: 60,
      color: 'indigo',
    },
    {
      key: 'roadmap',
      label: 'Active Learning',
      value: telemetry.activePhaseTitle || `${telemetry.roadmapProgress ?? 0}% Complete`,
      sublabel: 'Curriculum Milestone',
      icon: <Layers className="w-4 h-4 text-aurora-violet" />,
      angleDeg: 120,
      color: 'purple',
    },
    {
      key: 'market',
      label: 'Market Pipeline',
      value: `${telemetry.opportunityCount} Active`,
      sublabel: 'Live Role Alignment',
      icon: <Briefcase className="w-4 h-4 text-amber-700" />,
      angleDeg: 180,
      color: 'amber',
    },
    {
      key: 'identity',
      label: 'Domain Context',
      value: telemetry.userDomain || 'Cross-Domain',
      sublabel: 'Target Career Vector',
      icon: <UserCheck className="w-4 h-4 text-aurora-violet" />,
      angleDeg: 240,
      color: 'cyan',
    },
  ];

  // Base radius for context orbit (in percentage of parent container)
  const orbitRadiusX = 29; // % horizontally
  const orbitRadiusY = 27; // % vertically

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Visual Orbit Guide Ellipse */}
      <svg className="w-full h-full absolute inset-0">
        <ellipse
          cx="50%"
          cy="50%"
          rx={`${orbitRadiusX}%`}
          ry={`${orbitRadiusY}%`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
      </svg>

      {/* Orbiting Context Nodes */}
      {contextNodes.map((node) => {
        const rad = (node.angleDeg * Math.PI) / 180;
        const leftPercent = 50 + Math.cos(rad) * orbitRadiusX;
        const topPercent = 50 + Math.sin(rad) * orbitRadiusY;
        const isHovered = hoveredKey === node.key;

        return (
          <div
            key={node.key}
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute pointer-events-auto z-20"
            onMouseEnter={() => setHoveredKey(node.key)}
            onMouseLeave={() => setHoveredKey(null)}
            onClick={() => onSelectContextNode?.(node.key)}
          >
            <motion.div
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.92 }}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer shadow-lg ${
                isHovered
                  ? 'bg-aurora-canvas/60 border-cyan-400 text-aurora-ink shadow-[0_0_20px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400/50'
                  : 'bg-aurora-canvas/60 border-aurora-line text-aurora-muted hover:border-aurora-line'
              }`}
            >
              <div className="p-1 rounded-full bg-white/[0.05] shrink-0">{node.icon}</div>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[9px] uppercase tracking-wider text-aurora-muted">
                  {node.label}
                </span>
                <span className="text-xs font-display font-semibold text-aurora-ink truncate max-w-[110px]">
                  {node.value}
                </span>
              </div>
            </motion.div>

            {/* Context Tooltip Dropdown when Hovered */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-xl bg-aurora-canvas/60 border border-cyan-400/40 shadow-2xl text-center whitespace-nowrap z-30"
                >
                  <span className="text-[10px] text-aurora-violet block">{node.sublabel}</span>
                  <span className="text-[9px] text-aurora-muted">Telemetry Feed Grounded</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default NeuralContextOrbit;
