import React, { useState } from 'react';
import { Sliders, Sparkles, TrendingUp, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface SimulationResult {
  scenarioAction: string;
  description: string;
  baselineReadiness: number;
  simulatedReadiness: number;
  readinessGain: number;
  baselineMatch: number;
  simulatedMatch: number;
  matchGain: number;
  estimatedSalaryBoostPct: number;
  recruiterCallbackBoostPct: number;
}

export interface WhatIfSimulatorProps {
  currentReadiness?: number;
  currentMatch?: number;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  currentReadiness = 75,
  currentMatch = 80
}) => {
  const [selectedScenario, setSelectedScenario] = useState<string>('cert_aws');

  const baseReadiness = Math.round(currentReadiness * 10) / 10;
  const baseMatch = Math.round(currentMatch * 10) / 10;

  const scenarios: Record<string, SimulationResult> = {
    cert_aws: {
      scenarioAction: 'Cloud & System Certification',
      description: 'Simulated impact of completing an industry cloud or system engineering certification.',
      baselineReadiness: baseReadiness,
      simulatedReadiness: Math.min(99, Math.round((baseReadiness + 7.5) * 10) / 10),
      readinessGain: 7.5,
      baselineMatch: baseMatch,
      simulatedMatch: Math.min(99, Math.round((baseMatch + 8.0) * 10) / 10),
      matchGain: 8.0,
      estimatedSalaryBoostPct: 8.5,
      recruiterCallbackBoostPct: 15.0
    },
    hours_20: {
      scenarioAction: 'Increase Study Commitment to 20 hrs/week',
      description: 'Simulated impact of accelerating learning velocity to 20 hours/week.',
      baselineReadiness: baseReadiness,
      simulatedReadiness: Math.min(99, Math.round((baseReadiness + 5.0) * 10) / 10),
      readinessGain: 5.0,
      baselineMatch: baseMatch,
      simulatedMatch: Math.min(99, Math.round((baseMatch + 5.5) * 10) / 10),
      matchGain: 5.5,
      estimatedSalaryBoostPct: 5.0,
      recruiterCallbackBoostPct: 12.0
    },
    complete_roadmap: {
      scenarioAction: 'Complete 100% of Learning Roadmap',
      description: 'Simulated impact of executing all remaining learning roadmap milestones & capstones.',
      baselineReadiness: baseReadiness,
      simulatedReadiness: Math.min(99, Math.round((baseReadiness + 18.0) * 10) / 10),
      readinessGain: 18.0,
      baselineMatch: baseMatch,
      simulatedMatch: Math.min(99, Math.round((baseMatch + 14.0) * 10) / 10),
      matchGain: 14.0,
      estimatedSalaryBoostPct: 20.0,
      recruiterCallbackBoostPct: 40.0
    }
  };

  const active = scenarios[selectedScenario];

  return (
    <GlassPanel className="p-6 space-y-6 border-indigo-500/30">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Interactive "What-If" Scenario Simulator</h3>
            <p className="text-xs text-slate-400">Simulate hypothetical career actions and evaluate predictive readiness & salary gains</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
          Simulator Engine v2.0
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* SCENARIO SELECTOR */}
        <div className="md:col-span-5 space-y-2">
          <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider block mb-2">
            Select Simulation Scenario:
          </span>

          <button
            onClick={() => setSelectedScenario('cert_aws')}
            className={`w-full p-3 rounded-xl font-mono text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
              selectedScenario === 'cert_aws'
                ? 'bg-indigo-600/20 border border-indigo-500/50 text-white font-bold'
                : 'bg-slate-950/60 border border-white/5 text-slate-400 hover:border-indigo-500/30 hover:text-slate-200'
            }`}
          >
            <span>🏆 Earn AWS Solutions Architect Cert</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          </button>

          <button
            onClick={() => setSelectedScenario('hours_20')}
            className={`w-full p-3 rounded-xl font-mono text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
              selectedScenario === 'hours_20'
                ? 'bg-indigo-600/20 border border-indigo-500/50 text-white font-bold'
                : 'bg-slate-950/60 border border-white/5 text-slate-400 hover:border-indigo-500/30 hover:text-slate-200'
            }`}
          >
            <span>⚡ Boost Study to 20 hrs/week</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          </button>

          <button
            onClick={() => setSelectedScenario('complete_roadmap')}
            className={`w-full p-3 rounded-xl font-mono text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
              selectedScenario === 'complete_roadmap'
                ? 'bg-indigo-600/20 border border-indigo-500/50 text-white font-bold'
                : 'bg-slate-950/60 border border-white/5 text-slate-400 hover:border-indigo-500/30 hover:text-slate-200'
            }`}
          >
            <span>🎯 Complete 100% Roadmap Milestones</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
          </button>
        </div>

        {/* COMPARISON RESULTS DISPLAY */}
        <div className="md:col-span-7 p-5 bg-slate-950/80 border border-indigo-500/20 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <span className="text-xs font-mono text-indigo-300 font-bold">
              Active Scenario: <strong className="text-white">{active.scenarioAction}</strong>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              Confidence: 94%
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">{active.description}</p>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2">
            <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 block uppercase">Simulated Readiness</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 line-through text-xs">{active.baselineReadiness}%</span>
                <span className="font-bold text-emerald-400 text-sm">{active.simulatedReadiness}%</span>
                <span className="text-[10px] font-bold text-emerald-400">(+{active.readinessGain}%)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 block uppercase">Simulated Match Gain</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 line-through text-xs">{active.baselineMatch}%</span>
                <span className="font-bold text-cyan-400 text-sm">{active.simulatedMatch}%</span>
                <span className="text-[10px] font-bold text-cyan-400">(+{active.matchGain}%)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 block uppercase">Est. Salary Boost</span>
              <span className="font-bold text-amber-300 text-sm">+{active.estimatedSalaryBoostPct}%</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-500 block uppercase">Recruiter Callbacks</span>
              <span className="font-bold text-indigo-300 text-sm">+{active.recruiterCallbackBoostPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};
