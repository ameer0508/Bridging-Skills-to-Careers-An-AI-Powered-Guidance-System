import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, X, Activity, Zap, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface AgentDescriptor {
  id: string;
  name: string;
  version: string;
  status: string;
  route: string;
  category: string;
  description: string;
  metricLabel: string;
  metricValue: string;
  dagStep: number;
}

interface NeuralInspectorBladeProps {
  agent: AgentDescriptor | null;
  onClose: () => void;
}

export const NeuralInspectorBlade: React.FC<NeuralInspectorBladeProps> = ({
  agent,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!agent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 16 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 pointer-events-auto"
    >
      <div className="neural-glass-blade p-5 sm:p-6 border-cyan-400/40 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.2)]">
        {/* Header with Title, Badge, and Close button */}
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-cyan-500 to-indigo-600 p-[1px] shadow-md">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center text-cyan-300">
                <Bot className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-display text-white">{agent.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  v{agent.version}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">{agent.category}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{agent.status}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="py-3.5 space-y-3">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {agent.description}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400 font-medium">{agent.metricLabel}</span>
              </div>
              <span className="text-xs font-mono font-bold text-white">{agent.metricValue}</span>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-400 font-medium">Pipeline Phase</span>
              </div>
              <span className="text-xs font-mono font-bold text-purple-300">Phase {agent.dagStep} DAG</span>
            </div>
          </div>
        </div>

        {/* Action Blade Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Telemetry Synchronized with AI Orchestrator</span>
          </div>

          <button
            onClick={() => navigate(agent.route)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-linear-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 transition-all duration-200 shadow-[0_0_20px_rgba(6,182,212,0.4)] group"
          >
            <span>Launch Subsystem</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default NeuralInspectorBlade;
