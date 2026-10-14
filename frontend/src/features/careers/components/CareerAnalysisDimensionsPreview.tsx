import React from 'react';
import { ShieldCheck, Target, TrendingUp, BarChart3 } from 'lucide-react';

export const CareerAnalysisDimensionsPreview: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-aurora-indigo px-2 py-0.5 rounded bg-aurora-violet/[0.06] border border-aurora-violet/25">
            Analytical Output Specifications
          </span>
          <span className="text-[10px] text-aurora-muted">
            What Unlocks Post-Activation
          </span>
        </div>
        <h3 className="font-display text-xl sm:text-2xl font-bold text-aurora-ink tracking-tight">
          What Will Be Analyzed in Your Profile
        </h3>
        <p className="text-xs sm:text-sm text-aurora-muted max-w-2xl font-sans">
          The deterministic engine produces 4 interconnected analytical models once resume evidence is parsed:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DIMENSION 1: SKILL PROFILE TAXONOMY */}
        <div className="p-6 rounded-3xl border border-aurora-line bg-aurora-canvas/60 backdrop-blur-xl space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-aurora-violet uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-aurora-violet" />
                Dimension 01 • Verified Skill Profile
              </span>
              <span className="text-[10px] text-aurora-muted uppercase">
                Vector Mapping
              </span>
            </div>

            <h4 className="font-display text-base font-bold text-aurora-ink tracking-tight">
              Entity Normalization & Evidence Verification
            </h4>
            <p className="text-xs text-aurora-muted leading-relaxed font-sans">
              Raw bullet points are translated into canonical skill entities with calculated evidence depth based on mentions in professional experience, project achievements, and credential issuers.
            </p>

            {/* Visual Skill Matrix Sample Preview */}
            <div className="pt-2 flex flex-wrap gap-1.5 text-[10px]">
              <span className="px-2.5 py-1 rounded-lg bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-violet font-bold">
                ✓ Node.js & REST APIs (95% Evidence)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-aurora-violet/[0.06] border border-aurora-violet/25 text-aurora-indigo font-bold">
                ✓ Docker Containers (88% Evidence)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-aurora-violet font-bold">
                ✓ System Architecture (82% Evidence)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-aurora-canvas border border-aurora-line text-aurora-muted">
                + 15 Normalized Entities
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-aurora-line flex items-center justify-between text-[11px] text-aurora-muted">
            <span>Extraction Resolution:</span>
            <span className="text-emerald-700 font-bold">Zero Ambiguity</span>
          </div>
        </div>

        {/* DIMENSION 2: DETERMINISTIC ROLE FIT SCORING */}
        <div className="p-6 rounded-3xl border border-aurora-line bg-aurora-canvas/60 backdrop-blur-xl space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-aurora-indigo uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-aurora-indigo" />
                Dimension 02 • Precision Role Fit
              </span>
              <span className="text-[10px] text-aurora-muted uppercase">
                Weighted Bipartite Fit
              </span>
            </div>

            <h4 className="font-display text-base font-bold text-aurora-ink tracking-tight">
              Core (70%) vs Preferred (30%) Formula
            </h4>
            <p className="text-xs text-aurora-muted leading-relaxed font-sans">
              Instead of loose text similarity, the engine calculates a weighted mathematical score against mandatory role requirements, factoring in evidence strength and confidence intervals.
            </p>

            {/* Visual Formula Indicator */}
            <div className="p-3 rounded-xl bg-aurora-canvas/60 border border-aurora-violet/25 text-xs space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-aurora-muted">Mandatory Core Skills:</span>
                <span className="text-emerald-700 font-bold">70% Total Weight</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-aurora-muted">Preferred Technologies:</span>
                <span className="text-aurora-indigo font-bold">30% Total Weight</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-aurora-canvas overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-cyan-400 w-3/4" />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-aurora-line flex items-center justify-between text-[11px] text-aurora-muted">
            <span>Target Benchmark:</span>
            <span className="text-aurora-violet font-bold">Tier 1 Threshold ≥ 85%</span>
          </div>
        </div>

        {/* DIMENSION 3: CRITICAL SKILL GAP AUDIT */}
        <div className="p-6 rounded-3xl border border-aurora-line bg-aurora-canvas/60 backdrop-blur-xl space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-700" />
                Dimension 03 • Critical Gap Diagnosis
              </span>
              <span className="text-[10px] text-aurora-muted uppercase">
                Delta Isolation
              </span>
            </div>

            <h4 className="font-display text-base font-bold text-aurora-ink tracking-tight">
              Separating Missing Must-Haves from Nice-to-Haves
            </h4>
            <p className="text-xs text-aurora-muted leading-relaxed font-sans">
              Identifies the exact 2 to 4 capability bottlenecks preventing you from reaching 90%+ readiness scores, with estimated impact metrics for closing each gap.
            </p>

            {/* Gap Delta Sample */}
            <div className="space-y-1.5 text-[11px]">
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
                <span>⚡ Missing Core: Cloud Architecture (AWS)</span>
                <span className="font-bold">+18% Fit Impact</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-between">
                <span>⚡ Missing Preferred: Vector DBs</span>
                <span className="font-bold">+8% Fit Impact</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-aurora-line flex items-center justify-between text-[11px] text-aurora-muted">
            <span>Action Output:</span>
            <span className="text-rose-700 font-bold">Automated Roadmap Link</span>
          </div>
        </div>

        {/* DIMENSION 4: CAREER TRAJECTORY & COMPENSATION */}
        <div className="p-6 rounded-3xl border border-aurora-line bg-aurora-canvas/60 backdrop-blur-xl space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-700" />
                Dimension 04 • Market Evidence
              </span>
              <span className="text-[10px] text-aurora-muted uppercase">
                Market Alignment
              </span>
            </div>

            <h4 className="font-display text-base font-bold text-aurora-ink tracking-tight">
              Job-Market Evidence, When Sourced
            </h4>
            <p className="text-xs text-aurora-muted leading-relaxed font-sans">
              Posting counts and advertised salaries for a career are shown only from licensed, dated sources, with the source and collection date. Where none exist, the page says market data is unavailable.
            </p>

            <p className="p-2.5 rounded-xl bg-aurora-canvas border border-aurora-line text-xs text-aurora-muted">
              No salary, hiring-trend or remote-work figure is shown here: none is available from a licensed source.
            </p>
          </div>

          <div className="pt-3 border-t border-aurora-line flex items-center justify-between text-[11px] text-aurora-muted">
            <span>Market data:</span>
            <span className="text-amber-700 font-bold">Sourced or unavailable</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerAnalysisDimensionsPreview;
