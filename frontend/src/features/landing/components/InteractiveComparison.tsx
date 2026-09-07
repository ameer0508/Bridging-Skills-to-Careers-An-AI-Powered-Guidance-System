import React, { useState } from 'react';
import { Scale, XCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { TiltCard } from './effects/TiltCard';

export const InteractiveComparison: React.FC = () => {
  const [activeDimension, setActiveDimension] = useState<number>(0);

  const dimensions = [
    {
      title: 'Skill Assessment',
      traditional: 'Manual self-ratings & subjective resume guessing',
      skillBridge: 'NLP resume parsing & vector skill embedding analysis',
      impact: '10x Extraction Precision',
    },
    {
      title: 'Career Match Precision',
      traditional: 'Generic job board searches & rigid job titles',
      skillBridge: '98%+ mathematically calculated vector similarity match',
      impact: 'Exact Capability Alignment',
    },
    {
      title: 'Gap Identification',
      traditional: 'Trial-and-error after rejected applications',
      skillBridge: 'Instant deterministic gap matrix spotlighting exact missing tools',
      impact: 'Zero Application Waste',
    },
    {
      title: 'Learning Guidance',
      traditional: 'Static course lists without personalized sequence',
      skillBridge: 'Adaptive 7-week milestone roadmap with curated projects',
      impact: 'Personalized Velocity',
    },
    {
      title: 'Progress Telemetry',
      traditional: 'Unmeasured learning with no readiness signal',
      skillBridge: 'Live Career Readiness Index & automated ATS score tracking',
      impact: 'Quantified Interview Readiness',
    },
    {
      title: 'AI Transparency',
      traditional: 'Black-box recommendations with zero explanation',
      skillBridge: 'Explainable AI with clear reasoning & confidence scores',
      impact: 'Transparent Guidance',
    },
  ];

  const current = dimensions[activeDimension];

  return (
    <section id="comparison" className="py-28 px-4 max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-md">
          <Scale className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono font-bold text-purple-300 tracking-wider uppercase">
            Platform Differentiation
          </span>
        </div>

        <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Traditional Guesswork <br />
          <span className="bg-linear-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            vs SkillBridge Intelligence
          </span>
        </h2>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          See how commercial AI intelligence replaces outdated guesswork in tech career navigation.
        </p>
      </div>

      {/* Dimension Selector Pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {dimensions.map((d, idx) => (
          <button
            key={d.title}
            onClick={() => setActiveDimension(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeDimension === idx
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 scale-105'
                : 'bg-slate-900/70 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            {d.title}
          </button>
        ))}
      </div>

      {/* Side-by-Side Comparison Container */}
      <TiltCard glowColor="rgba(99, 102, 241, 0.2)" className="p-8 sm:p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Traditional Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-950/80 border border-rose-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
              <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Traditional Approach
              </span>
              <span className="text-[10px] text-slate-500">Legacy Paradigm</span>
            </div>
            <h3 className="text-lg font-bold text-slate-300">{current.title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{current.traditional}</p>
          </div>

          {/* SkillBridge Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-linear-to-br from-indigo-950/90 to-cyan-950/70 border border-cyan-400/50 space-y-4 shadow-2xl shadow-cyan-950/50">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" /> SkillBridge Intelligence
              </span>
              <span className="px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                {current.impact}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-white">{current.title}</h3>
            <p className="text-sm text-slate-100 font-medium leading-relaxed flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>{current.skillBridge}</span>
            </p>
          </div>
        </div>
      </TiltCard>
    </section>
  );
};
