import React, { useState } from 'react';
import { FileText, Cpu, Target, BarChart, BookOpen, Layers, Trophy, Sparkles, ArrowRight } from 'lucide-react';
import { TiltCard } from './effects/TiltCard';

export const IntelligencePipeline: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(0);

  const stages = [
    {
      step: '01',
      title: 'Resume Ingestion',
      subtitle: 'pdfplumber & PyMuPDF text extraction',
      detail: 'Parses PDF and DOCX documents with high precision, removing formatting anomalies and organizing raw career text.',
      icon: FileText,
      color: 'text-indigo-400',
    },
    {
      step: '02',
      title: 'Semantic Skill Extraction',
      subtitle: 'spaCy NLP entity recognition',
      detail: 'Identifies tech stack keywords, framework proficiencies, and experience metrics to build a structured JSON taxonomy.',
      icon: Cpu,
      color: 'text-cyan-400',
    },
    {
      step: '03',
      title: 'Career Matching',
      subtitle: 'Sentence Transformer vector embeddings',
      detail: 'Computes cosine similarity between your skill vector and 500+ tech role profiles to rank best-fit career paths.',
      icon: Target,
      color: 'text-purple-400',
    },
    {
      step: '04',
      title: 'Skill Gap Analysis',
      subtitle: 'Deterministic taxonomy matrix',
      detail: 'Spotlights exact missing technologies, outdated tools, and critical gap areas needed for your target position.',
      icon: BarChart,
      color: 'text-rose-400',
    },
    {
      step: '05',
      title: 'Recommendation Engine',
      subtitle: 'Curated courses & capstone projects',
      detail: 'Generates targeted learning recommendations and hands-on capstone projects tailored to resolve your specific skill gaps.',
      icon: BookOpen,
      color: 'text-amber-400',
    },
    {
      step: '06',
      title: 'Adaptive Roadmap',
      subtitle: 'Personalized week-by-week curriculum',
      detail: 'Constructs an actionable milestone roadmap with progress checkpoints to guide your weekly learning velocity.',
      icon: Layers,
      color: 'text-emerald-400',
    },
    {
      step: '07',
      title: 'Career Readiness Index',
      subtitle: 'Live interview readiness telemetry',
      detail: 'Calculates your overall readiness percentage as you complete roadmap milestones, signaling when you hit application-ready status.',
      icon: Trophy,
      color: 'text-cyan-300',
    },
  ];

  return (
    <section className="py-24 px-4 max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono font-bold text-purple-300 tracking-wider uppercase">
            End-to-End Pipeline
          </span>
        </div>

        <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          The SkillBridge <br />
          <span className="bg-linear-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Intelligence Engine
          </span>
        </h2>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Watch raw career data flow through 7 interconnected processing stages to generate explainable career strategy.
        </p>
      </div>

      {/* Pipeline Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-8">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          const isActive = activeStage === idx;
          return (
            <button
              key={st.step}
              onClick={() => setActiveStage(idx)}
              className={`p-3 rounded-xl border text-center transition-all duration-300 flex flex-col items-center gap-1.5 ${
                isActive
                  ? 'bg-indigo-600 text-white border-cyan-400 shadow-lg shadow-indigo-600/40 scale-105'
                  : 'bg-slate-900/60 text-slate-400 border-white/10 hover:border-white/20 hover:text-white'
              }`}
            >
              <span className="text-[10px] font-mono font-bold">{st.step}</span>
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-bold truncate max-w-full">{st.title}</span>
            </button>
          );
        })}
      </div>

      {/* Stage Detail Card */}
      {(() => {
        const current = stages[activeStage];
        const Icon = current.icon;
        return (
          <TiltCard glowColor="rgba(99, 102, 241, 0.2)" className="p-8 sm:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Stage {current.step} Processing
                  </span>
                  <span className="text-xs text-slate-400 font-mono">{current.subtitle}</span>
                </div>

                <h3 className="font-display text-2xl sm:text-4xl font-bold text-white flex items-center gap-3">
                  <Icon className={`w-8 h-8 ${current.color}`} />
                  {current.title}
                </h3>

                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {current.detail}
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/90 border border-white/10 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/40">
                  <Icon className="w-8 h-8" />
                </div>
                <button
                  onClick={() => setActiveStage((prev) => (prev + 1) % stages.length)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/15 transition-all"
                >
                  <span>Next Stage ({stages[(activeStage + 1) % stages.length].step})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </TiltCard>
        );
      })()}
    </section>
  );
};
