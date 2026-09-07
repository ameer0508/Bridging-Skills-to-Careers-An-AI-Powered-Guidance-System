import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Brain, Award } from 'lucide-react';
import { TiltCard } from './effects/TiltCard';

export const CareerOSReveal: React.FC = () => {
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'console' | 'readiness' | 'roadmap'>('console');

  return (
    <section id="careeros" className="py-28 px-4 max-w-7xl mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md">
          <LayoutDashboard className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono font-bold text-indigo-300 tracking-wider uppercase">
            Interactive Product Environment
          </span>
        </div>

        <h2 className="font-display text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          This Is Not A Template. <br />
          <span className="bg-linear-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            This Is CareerOS.
          </span>
        </h2>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Preview the real SkillBridge workspace UI designed to orchestrate your career progression.
        </p>
      </div>

      {/* Main 3D Perspective Workspace Showcase */}
      <div className="relative">
        <div className="absolute -inset-6 rounded-3xl bg-linear-to-tr from-indigo-500/20 via-purple-500/20 to-cyan-500/20 blur-3xl opacity-70 -z-10" />

        <TiltCard glowColor="rgba(99, 102, 241, 0.3)" className="p-6 sm:p-10">
          {/* Browser Header Bar */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-3 text-xs font-mono text-slate-400">
                app.skillbridge.ai / workspace / command-center
              </span>
            </div>

            {/* View Selector Tabs */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/10">
              {(['console', 'readiness', 'roadmap'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveWorkspaceTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    activeWorkspaceTab === tab
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab === 'console' && 'AI Command Center'}
                  {tab === 'readiness' && 'Readiness Telemetry'}
                  {tab === 'roadmap' && 'Active Roadmap'}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Workspace Content */}
          {activeWorkspaceTab === 'console' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10">
                  <span className="text-xs text-slate-400 block mb-1">Target Role Match</span>
                  <span className="text-2xl font-bold text-cyan-400 font-mono">94.8%</span>
                  <span className="text-[10px] text-emerald-400 block mt-1">Tier 1 High Compatibility</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10">
                  <span className="text-xs text-slate-400 block mb-1">Resume Index Score</span>
                  <span className="text-2xl font-bold text-indigo-400 font-mono">98 / 100</span>
                  <span className="text-[10px] text-indigo-300 block mt-1">ATS Hardened</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10">
                  <span className="text-xs text-slate-400 block mb-1">AI Engine Grounding</span>
                  <span className="text-2xl font-bold text-emerald-400 font-mono">99.4%</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Explainable AI Active</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/90 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-cyan-400" />
                    AI Career Telemetry Summary
                  </span>
                  <span className="text-indigo-400 font-mono text-[11px]">18 / 20 Core Skills Mastered</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your skill vector matches 94.8% of requirements for AI Systems Engineer. Complete the remaining 2 vector database modules to reach 98%+ candidate alignment.
                </p>
              </div>
            </motion.div>
          )}

          {activeWorkspaceTab === 'readiness' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 p-5 rounded-2xl bg-slate-950/90 border border-white/10"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  Interview Readiness Score Breakdown
                </span>
                <span className="text-emerald-400 font-mono font-bold text-sm">92.4%</span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Technical Knowledge Coverage</span>
                    <span className="text-cyan-400 font-mono">96%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div className="h-full w-[96%] bg-cyan-400 rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>System Design Capability</span>
                    <span className="text-indigo-400 font-mono">88%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div className="h-full w-[88%] bg-indigo-500 rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeWorkspaceTab === 'roadmap' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 p-5 rounded-2xl bg-slate-950/90 border border-white/10"
            >
              <span className="text-xs font-bold text-white block mb-2">Personalized 7-Week Adaptive Curriculum</span>
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs flex justify-between items-center text-indigo-200">
                  <span className="font-semibold">Week 1-2: Master Milvus Vector Indexing</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-[10px] font-mono">In Progress</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-xs flex justify-between items-center text-slate-400">
                  <span>Week 3-5: Deploy Production RAG Microservices</span>
                  <span className="text-[10px] font-mono">Upcoming</span>
                </div>
              </div>
            </motion.div>
          )}
        </TiltCard>
      </div>
    </section>
  );
};
