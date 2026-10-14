import React, { useState } from 'react';
import { Sliders, ArrowRight } from 'lucide-react';
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
    <GlassPanel className="p-6 space-y-6 border-aurora-violet/25">
      <div className="flex items-center justify-between border-b border-aurora-line pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-aurora-violet/[0.06] text-aurora-indigo rounded-xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-aurora-ink">Interactive "What-If" Scenario Simulator</h3>
            <p className="text-xs text-aurora-muted">Simulate hypothetical career actions and evaluate predictive readiness & salary gains</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo text-xs font-bold">
          Simulator Engine v2.0
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* SCENARIO SELECTOR */}
        <div className="md:col-span-5 space-y-2">
          <span className="text-xs font-bold text-aurora-muted uppercase tracking-wider block mb-2">
            Select Simulation Scenario:
          </span>

          <button
            onClick={() => setSelectedScenario('cert_aws')}
            className={`w-full p-3 rounded-xl text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
              selectedScenario === 'cert_aws'
                ? 'bg-violet-50 border border-aurora-violet/25 text-aurora-ink font-bold'
                : 'bg-aurora-canvas/60 border border-aurora-line text-aurora-muted hover:border-aurora-violet/25 hover:text-aurora-ink'
            }`}
          >
            <span>🏆 Earn AWS Solutions Architect Cert</span>
            <ArrowRight className="w-3.5 h-3.5 text-aurora-indigo" />
          </button>

          <button
            onClick={() => setSelectedScenario('hours_20')}
            className={`w-full p-3 rounded-xl text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
              selectedScenario === 'hours_20'
                ? 'bg-violet-50 border border-aurora-violet/25 text-aurora-ink font-bold'
                : 'bg-aurora-canvas/60 border border-aurora-line text-aurora-muted hover:border-aurora-violet/25 hover:text-aurora-ink'
            }`}
          >
            <span>⚡ Boost Study to 20 hrs/week</span>
            <ArrowRight className="w-3.5 h-3.5 text-aurora-indigo" />
          </button>

          <button
            onClick={() => setSelectedScenario('complete_roadmap')}
            className={`w-full p-3 rounded-xl text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
              selectedScenario === 'complete_roadmap'
                ? 'bg-violet-50 border border-aurora-violet/25 text-aurora-ink font-bold'
                : 'bg-aurora-canvas/60 border border-aurora-line text-aurora-muted hover:border-aurora-violet/25 hover:text-aurora-ink'
            }`}
          >
            <span>🎯 Complete 100% Roadmap Milestones</span>
            <ArrowRight className="w-3.5 h-3.5 text-aurora-indigo" />
          </button>
        </div>

        {/* COMPARISON RESULTS DISPLAY */}
        <div className="md:col-span-7 p-5 bg-aurora-canvas/60 border border-aurora-violet/25 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-aurora-line pb-3">
            <span className="text-xs text-aurora-indigo font-bold">
              Active Scenario: <strong className="text-aurora-ink">{active.scenarioAction}</strong>
            </span>
            <span className="text-[10px] text-emerald-700 font-bold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
              Confidence: 94%
            </span>
          </div>

          <p className="text-xs text-aurora-muted leading-relaxed font-sans">{active.description}</p>

          <div className="grid grid-cols-2 gap-3 text-xs pt-2">
            <div className="p-3 bg-aurora-canvas rounded-xl border border-aurora-line space-y-1">
              <span className="text-[10px] text-aurora-muted block uppercase">Simulated Readiness</span>
              <div className="flex items-center gap-2">
                <span className="text-aurora-muted line-through text-xs">{active.baselineReadiness}%</span>
                <span className="font-bold text-emerald-700 text-sm">{active.simulatedReadiness}%</span>
                <span className="text-[10px] font-bold text-emerald-700">(+{active.readinessGain}%)</span>
              </div>
            </div>

            <div className="p-3 bg-aurora-canvas rounded-xl border border-aurora-line space-y-1">
              <span className="text-[10px] text-aurora-muted block uppercase">Simulated Match Gain</span>
              <div className="flex items-center gap-2">
                <span className="text-aurora-muted line-through text-xs">{active.baselineMatch}%</span>
                <span className="font-bold text-aurora-violet text-sm">{active.simulatedMatch}%</span>
                <span className="text-[10px] font-bold text-aurora-violet">(+{active.matchGain}%)</span>
              </div>
            </div>

            <div className="p-3 bg-aurora-canvas rounded-xl border border-aurora-line space-y-1">
              <span className="text-[10px] text-aurora-muted block uppercase">Est. Salary Boost</span>
              <span className="font-bold text-amber-700 text-sm">+{active.estimatedSalaryBoostPct}%</span>
            </div>

            <div className="p-3 bg-aurora-canvas rounded-xl border border-aurora-line space-y-1">
              <span className="text-[10px] text-aurora-muted block uppercase">Recruiter Callbacks</span>
              <span className="font-bold text-aurora-indigo text-sm">+{active.recruiterCallbackBoostPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
};
