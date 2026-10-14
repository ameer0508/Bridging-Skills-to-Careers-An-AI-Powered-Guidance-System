import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  GraduationCap,
  FileCheck2,
  Video,
  Search,
  Share2,
  TrendingUp,
} from 'lucide-react';
import { NeuralSynapticAxon } from './NeuralSynapticAxon';
import { AgentDescriptor } from './NeuralInspectorBlade';

interface NeuralAgentConstellationProps {
  onSelectAgent: (agent: AgentDescriptor | null) => void;
  selectedAgentId?: string | null;
  // Real telemetry data passed in to ground metrics
  matchScore: number;
  readinessScore: number;
  atsScore: number;
  opportunityCount: number;
}

export const NeuralAgentConstellation: React.FC<NeuralAgentConstellationProps> = ({
  onSelectAgent,
  selectedAgentId,
  matchScore,
  readinessScore,
  atsScore,
  opportunityCount,
}) => {
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);

  const activeAgentId = hoveredAgentId || selectedAgentId;

  // 7 Registered Agents distributed cleanly across the outer orbit
  const agents: (AgentDescriptor & {
    angleDeg: number;
    icon: React.ReactNode;
    color: 'cyan' | 'indigo' | 'purple' | 'amber' | 'emerald';
  })[] = [
    {
      id: 'career_agent',
      name: 'Career Planning Agent',
      version: '2.1.0',
      status: 'ACTIVE',
      route: '/agent',
      category: 'Target Strategy & Synthesis',
      description: 'Defines career target alignment, competency mapping, and strategic positioning.',
      metricLabel: 'Career Fit Index',
      metricValue: `${matchScore}% Match`,
      dagStep: 1,
      angleDeg: -90, // Top
      icon: <Compass className="w-4 h-4 text-aurora-violet" />,
      color: 'cyan',
    },
    {
      id: 'learning_agent',
      name: 'Learning Journey Agent',
      version: '2.0.4',
      status: 'ACTIVE',
      route: '/learning-agent',
      category: 'Curriculum & Skill Synthesis',
      description: 'Synthesizes personalized learning roadmaps, phase milestones, and verified skill modules.',
      metricLabel: 'Curriculum Velocity',
      metricValue: 'Adaptive Pace',
      dagStep: 2,
      angleDeg: -38, // Top Right
      icon: <GraduationCap className="w-4 h-4 text-aurora-violet" />,
      color: 'purple',
    },
    {
      id: 'resume_agent',
      name: 'Resume Optimization Agent',
      version: '2.2.1',
      status: 'ACTIVE',
      route: '/resume-agent',
      category: 'ATS & Narrative Intelligence',
      description: 'Audits resume ATS passability, keyword density, and quantitative impact bullets.',
      metricLabel: 'ATS Compliance',
      metricValue: atsScore > 0 ? `${atsScore}/100` : 'Calibrating',
      dagStep: 2,
      angleDeg: 14, // Middle Right
      icon: <FileCheck2 className="w-4 h-4 text-aurora-indigo" />,
      color: 'indigo',
    },
    {
      id: 'interview_agent',
      name: 'Interview Prep Agent',
      version: '2.0.0',
      status: 'ACTIVE',
      route: '/interview-agent',
      category: 'STAR Behavioral & Technical',
      description: 'Conducts AI-grounded mock technical sessions, behavioral STAR audits, and design evaluations.',
      metricLabel: 'Readiness Rating',
      metricValue: `${Math.round(readinessScore)}%`,
      dagStep: 3,
      angleDeg: 66, // Bottom Right
      icon: <Video className="w-4 h-4 text-emerald-700" />,
      color: 'emerald',
    },
    {
      id: 'opportunity_agent',
      name: 'Opportunity Discovery Agent',
      version: '1.9.5',
      status: 'ACTIVE',
      route: '/opportunity-agent',
      category: 'Market Intelligence & Trajectory',
      description: 'Scans real-time job requisitions, market salary tiers, and emerging role transitions.',
      metricLabel: 'Live Opportunities',
      metricValue: `${opportunityCount} Verified`,
      dagStep: 4,
      angleDeg: 120, // Bottom Left
      icon: <TrendingUp className="w-4 h-4 text-amber-700" />,
      color: 'amber',
    },
    {
      id: 'job_agent',
      name: 'Job Search Agent',
      version: '2.1.0',
      status: 'ACTIVE',
      route: '/job-agent',
      category: 'Requisition Match & Filtering',
      description: 'Filters verified industry openings matching the student candidate proficiencies.',
      metricLabel: 'Search Horizon',
      metricValue: 'Real-time',
      dagStep: 4,
      angleDeg: 180, // Middle Left
      icon: <Search className="w-4 h-4 text-aurora-violet" />,
      color: 'cyan',
    },
    {
      id: 'networking_agent',
      name: 'Networking Agent',
      version: '1.8.0',
      status: 'ACTIVE',
      route: '/networking-agent',
      category: 'Mentorship & Industry Graph',
      description: 'Maps industry alumni, high-probability mentors, and strategic referral pipelines.',
      metricLabel: 'Referral Density',
      metricValue: 'High Match',
      dagStep: 3,
      angleDeg: 232, // Top Left
      icon: <Share2 className="w-4 h-4 text-aurora-indigo" />,
      color: 'indigo',
    },
  ];

  const orbitRadiusX = 42; // % horizontally
  const orbitRadiusY = 38; // % vertically

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Outer Orbit Guide Track */}
      <svg className="w-full h-full absolute inset-0">
        <ellipse
          cx="50%"
          cy="50%"
          rx={`${orbitRadiusX}%`}
          ry={`${orbitRadiusY}%`}
          fill="none"
          stroke="rgba(255, 255, 255, 0.04)"
          strokeWidth="1"
        />

        {/* Synaptic Axons connecting each agent to AI Core (50%, 50%) */}
        {agents.map((agent) => {
          const rad = (agent.angleDeg * Math.PI) / 180;
          const agentX = 50 + Math.cos(rad) * orbitRadiusX;
          const agentY = 50 + Math.sin(rad) * orbitRadiusY;
          const isHighlighted = activeAgentId === agent.id;

          return (
            <NeuralSynapticAxon
              key={`axon-${agent.id}`}
              startX={agentX}
              startY={agentY}
              endX={50}
              endY={50}
              active={true}
              highlighted={isHighlighted}
              color={agent.color}
              curvature={0.12}
            />
          );
        })}
      </svg>

      {/* Interactive Agent Nodes */}
      {agents.map((agent) => {
        const rad = (agent.angleDeg * Math.PI) / 180;
        const leftPercent = 50 + Math.cos(rad) * orbitRadiusX;
        const topPercent = 50 + Math.sin(rad) * orbitRadiusY;
        const isHovered = hoveredAgentId === agent.id;
        const isSelected = selectedAgentId === agent.id;
        const isFaded = activeAgentId !== null && activeAgentId !== agent.id;

        return (
          <div
            key={agent.id}
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`absolute pointer-events-auto z-30 transition-opacity duration-300 ${
              isFaded ? 'opacity-35' : 'opacity-100'
            }`}
            onMouseEnter={() => {
              setHoveredAgentId(agent.id);
              onSelectAgent(agent);
            }}
            onMouseLeave={() => {
              setHoveredAgentId(null);
            }}
            onClick={() => onSelectAgent(agent)}
          >
            <motion.div
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.94 }}
              className={`flex items-center gap-3 px-3.5 py-2 rounded-2xl border transition-all duration-300 cursor-pointer backdrop-blur-xl shadow-xl ${
                isHovered || isSelected
                  ? 'bg-aurora-canvas/60 border-cyan-400 text-aurora-ink shadow-[0_0_25px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400/60'
                  : 'bg-aurora-canvas/60 border-aurora-line text-aurora-muted hover:border-aurora-line'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-aurora-line flex items-center justify-center shrink-0">
                {agent.icon}
              </div>
              <div className="flex flex-col text-left leading-tight pr-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-display font-bold text-aurora-ink truncate max-w-[130px]">
                    {agent.name}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_#10b981]" />
                </div>
                <span className="text-[10px] text-aurora-violet/80">
                  {agent.metricValue}
                </span>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

export default NeuralAgentConstellation;
