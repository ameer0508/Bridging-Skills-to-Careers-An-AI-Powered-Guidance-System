import React from 'react';
import { motion } from 'framer-motion';
import { Layers, ShieldCheck, Target, TrendingUp, BarChart3, Award, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const CareerAnalysisDimensionsPreview: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
            Analytical Output Specifications
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            What Unlocks Post-Activation
          </span>
        </div>
        <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
          What Will Be Analyzed in Your Profile
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-sans">
          The deterministic engine produces 4 interconnected analytical models once resume evidence is parsed:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DIMENSION 1: SKILL PROFILE TAXONOMY */}
        <div className="p-6 rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Dimension 01 • Verified Skill Profile
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                Vector Mapping
              </span>
            </div>

            <h4 className="font-display text-base font-bold text-white tracking-tight">
              Entity Normalization & Evidence Verification
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Raw bullet points are translated into canonical skill entities with calculated evidence depth based on mentions in professional experience, project achievements, and credential issuers.
            </p>

            {/* Visual Skill Matrix Sample Preview */}
            <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px]">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
                ✓ Node.js & REST APIs (95% Evidence)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold">
                ✓ Docker Containers (88% Evidence)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 font-bold">
                ✓ System Architecture (82% Evidence)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-slate-400">
                + 15 Normalized Entities
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Extraction Resolution:</span>
            <span className="text-emerald-400 font-bold">Zero Ambiguity</span>
          </div>
        </div>

        {/* DIMENSION 2: DETERMINISTIC ROLE FIT SCORING */}
        <div className="p-6 rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Dimension 02 • Precision Role Fit
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                Weighted Bipartite Fit
              </span>
            </div>

            <h4 className="font-display text-base font-bold text-white tracking-tight">
              Core (70%) vs Preferred (30%) Formula
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Instead of loose text similarity, the engine calculates a weighted mathematical score against mandatory role requirements, factoring in evidence strength and confidence intervals.
            </p>

            {/* Visual Formula Indicator */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-indigo-500/20 text-xs font-mono space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Mandatory Core Skills:</span>
                <span className="text-emerald-400 font-bold">70% Total Weight</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Preferred Technologies:</span>
                <span className="text-indigo-300 font-bold">30% Total Weight</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-cyan-400 w-3/4" />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Target Benchmark:</span>
            <span className="text-cyan-300 font-bold">Tier 1 Threshold ≥ 85%</span>
          </div>
        </div>

        {/* DIMENSION 3: CRITICAL SKILL GAP AUDIT */}
        <div className="p-6 rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-400" />
                Dimension 03 • Critical Gap Diagnosis
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                Delta Isolation
              </span>
            </div>

            <h4 className="font-display text-base font-bold text-white tracking-tight">
              Separating Missing Must-Haves from Nice-to-Haves
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Identifies the exact 2 to 4 capability bottlenecks preventing you from reaching 90%+ readiness scores, with estimated impact metrics for closing each gap.
            </p>

            {/* Gap Delta Sample */}
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center justify-between">
                <span>⚡ Missing Core: Cloud Architecture (AWS)</span>
                <span className="font-bold">+18% Fit Impact</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-between">
                <span>⚡ Missing Preferred: Vector DBs</span>
                <span className="font-bold">+8% Fit Impact</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Action Output:</span>
            <span className="text-rose-400 font-bold">Automated Roadmap Link</span>
          </div>
        </div>

        {/* DIMENSION 4: CAREER TRAJECTORY & COMPENSATION */}
        <div className="p-6 rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Dimension 04 • Trajectory & Compensation
              </span>
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                Market Alignment
              </span>
            </div>

            <h4 className="font-display text-base font-bold text-white tracking-tight">
              Real-Time Salary & Hiring Velocity Telemetry
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Matches your skills to real-world career trajectories with live salary compensation bands, industry growth velocity, and active market requisition volumes.
            </p>

            {/* Market Preview */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 space-y-0.5">
                <span className="text-[9px] text-slate-500 block uppercase">Median Base</span>
                <span className="text-amber-400 font-bold block">$165,000</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 space-y-0.5">
                <span className="text-[9px] text-slate-500 block uppercase">Hiring Trend</span>
                <span className="text-emerald-400 font-bold block">+22% YoY</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5 space-y-0.5">
                <span className="text-[9px] text-slate-500 block uppercase">Remote Rate</span>
                <span className="text-cyan-300 font-bold block">78% Roles</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Market Grounding:</span>
            <span className="text-amber-400 font-bold">Synchronized Daily</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerAnalysisDimensionsPreview;
