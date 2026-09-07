import React, { useState } from 'react';
import {
  FileText,
  Target,
  BarChart,
  LayoutDashboard,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { TiltCard } from './effects/TiltCard';

interface FeatureItem {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  highlights: string[];
  mockup: React.ReactNode;
}

export const FeatureShowcase: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<string>('resume');

  const features: FeatureItem[] = [
    {
      id: 'resume',
      badge: 'Resume Intelligence',
      title: 'Deep Multi-Format Document Parsing & Skill Extraction',
      subtitle: 'Extract skills, experience, and projects with precision NLP.',
      description:
        'SkillBridge ingests PDF and DOCX resumes, dissecting every project bullet, skill keyword, and tech stack mention to build a structured 360-degree candidate profile.',
      icon: FileText,
      color: 'text-indigo-400',
      gradient: 'from-indigo-500 via-purple-500 to-cyan-500',
      highlights: [
        'Automated PDF/DOCX Parsing via pdfplumber & PyMuPDF',
        'spaCy NLP & Custom Skill Entity Recognition',
        'ATS Score Optimization & Hardening Rules',
      ],
      mockup: (
        <div className="space-y-4 p-5 rounded-2xl bg-slate-950/80 border border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">Parsed_Resume_Analysis.json</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
              98.4% Parsing Quality
            </span>
          </div>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-300">Extracted Hard Skills (24)</span>
              <span className="text-indigo-300 font-mono">PyTorch, FastAPI, React 19, TS</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-300">Experience Index</span>
              <span className="text-emerald-400 font-bold">Senior (4.5 Yrs Equivalent)</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-300">ATS Keyword Match Score</span>
              <span className="text-cyan-400 font-bold">96 / 100</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'matching',
      badge: 'Career Match Engine',
      title: 'Vector Embedding Similarity & Role Ranking',
      subtitle: 'Find exact-fit career paths based on your real capability.',
      description:
        'Our vector search algorithms compare your unique skill fingerprint against live industry taxonomies to calculate probabilistic match percentages for hundreds of tech roles.',
      icon: Target,
      color: 'text-cyan-400',
      gradient: 'from-cyan-500 via-indigo-500 to-purple-500',
      highlights: [
        'Sentence Transformer Embeddings & Vector Cosine Distance',
        'Industry Taxonomy Mapping across 500+ Tech Roles',
        'Market Demand & Salary Trend Alignment',
      ],
      mockup: (
        <div className="space-y-3 p-5 rounded-2xl bg-slate-950/80 border border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              Live Career Match Leaderboard
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Updated Real-Time</span>
          </div>
          {[
            { role: 'AI Systems Architect', match: '94.8%', level: 'High Match' },
            { role: 'Lead MLOps Engineer', match: '91.2%', level: 'High Match' },
            { role: 'Senior Full-Stack Lead', match: '88.5%', level: 'Good Match' },
          ].map((item, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold text-white block">{item.role}</span>
                <span className="text-[10px] text-indigo-300">{item.level}</span>
              </div>
              <span className="text-sm font-bold text-cyan-400 font-mono">{item.match}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'gap-analysis',
      badge: 'Skill Gap Analysis',
      title: 'Targeted Gap Detection & Mastery Ratings',
      subtitle: 'Never guess what skills you are missing for promotion.',
      description:
        'SkillBridge maps your current capabilities against target role requirements, instantly spotlighting critical missing skills, outdated technologies, and recommended focus areas.',
      icon: BarChart,
      color: 'text-purple-400',
      gradient: 'from-purple-500 via-pink-500 to-indigo-500',
      highlights: [
        'Deterministic Skill Matrix Comparison',
        'Proficiency Gap Rating (Beginner to Expert)',
        'Time-to-Mastery Estimates per Skill',
      ],
      mockup: (
        <div className="space-y-3 p-5 rounded-2xl bg-slate-950/80 border border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <BarChart className="w-4 h-4 text-purple-400" />
              Skill Gap Matrix
            </span>
            <span className="text-rose-400 text-xs font-bold">3 Gaps Identified</span>
          </div>
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-slate-900 border border-rose-500/20 text-xs flex justify-between items-center">
              <div>
                <span className="font-semibold text-white block">Vector DB Indexing</span>
                <span className="text-[10px] text-slate-400">Target Level: Advanced</span>
              </div>
              <span className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 font-mono text-[11px]">
                Critical Gap
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/20 text-xs flex justify-between items-center">
              <div>
                <span className="font-semibold text-white block">System Sharding</span>
                <span className="text-[10px] text-slate-400">Target Level: Intermediate</span>
              </div>
              <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px]">
                Moderate Gap
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'dashboard',
      badge: 'Adaptive Dashboard',
      title: 'Real-Time Telemetry & Career Readiness Tracking',
      subtitle: 'Track your growth with linear-inspired metrics.',
      description:
        'A command center designed for ambitious professionals. Track career readiness scores, resume iterations, learning streaks, and milestone achievements in one fluid glass UI.',
      icon: LayoutDashboard,
      color: 'text-emerald-400',
      gradient: 'from-emerald-500 via-cyan-500 to-indigo-500',
      highlights: [
        'Zustand Global State & TanStack Query Caching',
        'Live Readiness Gauges & Historical Telemetry',
        'Multi-Workspace Customization',
      ],
      mockup: (
        <div className="space-y-3 p-5 rounded-2xl bg-slate-950/80 border border-white/10">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
              <span className="text-[10px] text-slate-400 block">Overall Readiness</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">92.4%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
              <span className="text-[10px] text-slate-400 block">Active Learning Velocity</span>
              <span className="text-xl font-bold text-cyan-400 font-mono">4.8x Avg</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-xs">
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Weekly Milestone Progress</span>
              <span className="text-indigo-400 font-bold">80%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
              <div className="h-full w-[80%] bg-linear-to-r from-emerald-400 to-indigo-500" />
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = features.find((f) => f.id === activeFeature) || features[0];

  return (
    <section id="features" className="py-24 px-4 max-w-7xl mx-auto relative">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-purple-300 tracking-wide uppercase">
            Platform Capabilities
          </span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Engineered for <br />
          <span className="bg-linear-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Maximum Career Acceleration
          </span>
        </h2>
        <p className="text-slate-300 text-base sm:text-lg">
          Explore the intelligent subsystems driving SkillBridge's commercial career platform.
        </p>
      </div>

      {/* Feature Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
        {features.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === activeFeature;
          return (
            <button
              key={item.id}
              onClick={() => setActiveFeature(item.id)}
              className={`p-4 rounded-2xl border text-left transition-all duration-300 flex items-center gap-3.5 ${
                isActive
                  ? 'bg-slate-900 border-indigo-500/50 shadow-xl shadow-indigo-950/40 scale-[1.02]'
                  : 'bg-slate-950/60 border-white/10 hover:border-white/20 backdrop-blur-md'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">{item.badge}</span>
                <span className="text-[11px] text-slate-400 hidden sm:block truncate max-w-35">
                  {item.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Horizontal Storytelling Showcase Card */}
      <TiltCard glowColor="rgba(168, 85, 247, 0.2)" className="p-6 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Text Story */}
          <div className="lg:col-span-7 space-y-6">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
              {current.badge} Subsystem
            </span>
            <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
              {current.title}
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{current.description}</p>

            <ul className="space-y-3 pt-2">
              {current.highlights.map((point, idx) => (
                <li key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Interactive Visual Mockup Column */}
          <div className="lg:col-span-5 relative">{current.mockup}</div>
        </div>
      </TiltCard>
    </section>
  );
};
