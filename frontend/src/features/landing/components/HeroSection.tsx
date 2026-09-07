import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Play,
  TrendingUp,
  Brain,
  CheckCircle2,
  Zap,
  Target,
  BarChart3,
  Award,
} from 'lucide-react';
import { TiltCard } from './effects/TiltCard';

export const HeroSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'match' | 'roadmap' | 'skills'>('match');

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-4 max-w-7xl mx-auto overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column - Headline & CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 flex flex-col items-start gap-6 text-left"
        >
          {/* Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-semibold text-indigo-300 tracking-wide uppercase">
              Next-Gen AI Career Intelligence
            </span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </motion.div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Bridge Your Skills <br />
            <span className="bg-linear-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              To Your Dream Career
            </span>{' '}
            <br />
            With Precision AI.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-xl">
            SkillBridge analyzes your skills, parses your resume, identifies critical gap areas, and crafts adaptive learning roadmaps to land your ideal tech role.
          </p>

          {/* CTA Group */}
          <div className="flex flex-wrap items-center gap-4 pt-2 w-full sm:w-auto">
            <Link
              to="/register"
              className="relative group overflow-hidden inline-flex items-center justify-center gap-3 px-7 py-4 text-sm font-bold text-white rounded-2xl bg-linear-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Start Your Journey</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#live-ai"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-4 text-sm font-semibold text-slate-200 hover:text-white rounded-2xl bg-slate-900/60 border border-white/10 hover:border-white/20 backdrop-blur-xl hover:bg-white/5 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-cyan-400">
                <Play className="w-3 h-3 fill-current translate-x-0.5" />
              </div>
              <span>Watch Live Demo</span>
            </a>
          </div>

          {/* Trust Metrics */}
          <div className="pt-6 border-t border-white/10 flex items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Production Grade AI</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Skill Graph</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Explainable AI</span>
            </div>
          </div>
        </motion.div>

        {/* Right Column - Live Animated Glass Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 relative"
        >
          {/* Ambient Glow behind card */}
          <div className="absolute -inset-4 rounded-3xl bg-linear-to-tr from-indigo-500/20 via-purple-500/20 to-cyan-500/20 blur-2xl opacity-70 -z-10" />

          <TiltCard glowColor="rgba(14, 165, 233, 0.25)" className="p-6 md:p-8">
            {/* Dashboard Top Header */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400">
                  SkillBridge Intelligence Console v1.0
                </span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>AI Live Engine Active</span>
              </div>
            </div>

            {/* Simulated Workspace Controls */}
            <div className="flex items-center justify-between my-5">
              <div>
                <span className="text-xs text-slate-400 font-medium">Target Role</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-base font-bold text-white">AI Systems Architect</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold">
                    Tier 1 High Match
                  </span>
                </div>
              </div>

              {/* View Selector Tabs */}
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/10">
                {(['match', 'roadmap', 'skills'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                      activeTab === tab
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Mockup Body */}
            <div className="space-y-4">
              {/* Stat Pill Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Career Match</span>
                    <Target className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <span className="text-2xl font-bold text-white mt-1">94.8%</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                    <TrendingUp className="w-2.5 h-2.5" /> +4.2% this week
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Resume Index</span>
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <span className="text-2xl font-bold text-white mt-1">98/100</span>
                  <span className="text-[10px] text-indigo-300 mt-1">Production Hardened</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 flex flex-col">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>AI Confidence</span>
                    <Brain className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-2xl font-bold text-white mt-1">99.4%</span>
                  <span className="text-[10px] text-emerald-400 mt-1">High Grounding</span>
                </div>
              </div>

              {/* Dynamic Tab Content Display */}
              {activeTab === 'match' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-slate-950/70 border border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                      Skill Vector Coverage
                    </span>
                    <span className="text-indigo-400">18 / 20 Skills Mastered</span>
                  </div>

                  {/* Animated Skill Progress Bars */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>PyTorch & Neural Networks</span>
                        <span className="text-emerald-400 font-bold">96%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '96%' }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-linear-to-r from-indigo-500 to-cyan-400 rounded-full"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Distributed Systems & FastAPI</span>
                        <span className="text-emerald-400 font-bold">91%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '91%' }}
                          transition={{ duration: 1, delay: 0.1, ease: 'easeOut' }}
                          className="h-full bg-linear-to-r from-purple-500 to-indigo-400 rounded-full"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Vector Search & RAG Architecture</span>
                        <span className="text-amber-400 font-bold">78% (Gap Area)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '78%' }}
                          transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                          className="h-full bg-linear-to-r from-amber-500 to-orange-400 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'roadmap' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-slate-950/70 border border-white/10 space-y-2.5"
                >
                  <span className="text-xs font-semibold text-slate-300 block">
                    Personalized AI Action Plan (Phase 2 Active)
                  </span>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200">
                      <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[10px]">
                        1
                      </div>
                      <span className="flex-1 font-medium">Master Milvus Vector Database Indexing</span>
                      <span className="px-2 py-0.5 bg-indigo-500/20 rounded text-[10px] font-mono">
                        In Progress
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-900 border border-white/5 text-xs text-slate-400">
                      <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-[10px]">
                        2
                      </div>
                      <span className="flex-1">Deploy LLM Orchestration with LangChain</span>
                      <span className="text-[10px] font-mono text-slate-500">Upcoming</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'skills' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-slate-950/70 border border-white/10 space-y-3"
                >
                  <span className="text-xs font-semibold text-slate-300 block">
                    AI Parsed Skill Graph & Ontology
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'PyTorch', score: '98%', status: 'Expert' },
                      { name: 'FastAPI', score: '95%', status: 'Advanced' },
                      { name: 'React 19', score: '94%', status: 'Advanced' },
                      { name: 'TypeScript', score: '92%', status: 'Advanced' },
                      { name: 'Docker & Kubernetes', score: '88%', status: 'Proficient' },
                      { name: 'Vector DBs', score: '78%', status: 'Emerging' },
                    ].map((skill) => (
                      <span
                        key={skill.name}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-200 flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        {skill.name}
                        <span className="text-[10px] text-slate-400 font-mono">({skill.score})</span>
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* AI Assistant Live Stream Banner Footer */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="font-mono text-[11px]">
                  AI Recommendation: <strong className="text-white">Complete RAG module</strong> to boost match to 98%
                </span>
              </div>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
          </TiltCard>
        </motion.div>
      </div>
    </section>
  );
};
