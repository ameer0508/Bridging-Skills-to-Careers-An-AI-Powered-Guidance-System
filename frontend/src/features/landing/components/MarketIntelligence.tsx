import React, { useState } from 'react';
import { TrendingUp, DollarSign, BarChart2 } from 'lucide-react';
import { TiltCard } from './effects/TiltCard';

export const MarketIntelligence: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'ai' | 'fullstack' | 'cloud'>('ai');

  const roleData = {
    ai: {
      title: 'AI & ML Systems Engineer',
      salaryBand: '$140k - $210k / yr',
      growthRate: '+34% YoY',
      demandLevel: 'Very High',
      topSkills: ['PyTorch & CUDA', 'Vector DBs (Milvus)', 'FastAPI & RAG Architecture', 'Kubernetes'],
    },
    fullstack: {
      title: 'Senior Full-Stack Lead',
      salaryBand: '$130k - $185k / yr',
      growthRate: '+22% YoY',
      demandLevel: 'High',
      topSkills: ['React 19 & Vite', 'TypeScript Strict', 'Node.js Microservices', 'Redis Sharding'],
    },
    cloud: {
      title: 'Cloud AI Architect',
      salaryBand: '$150k - $225k / yr',
      growthRate: '+28% YoY',
      demandLevel: 'High',
      topSkills: ['AWS Bedrock & Vertex AI', 'Terraform IaC', 'Docker & Helm', 'Zero-Trust Security'],
    },
  };

  const current = roleData[selectedRole];

  return (
    <section className="py-24 px-4 max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-md">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold text-amber-300 tracking-wider uppercase">
            Market Intelligence Radar
          </span>
        </div>

        <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Live Industry <br />
          <span className="bg-linear-to-r from-amber-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Demand Telemetry
          </span>
        </h2>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          SkillBridge correlates your personal skill vectors with real-time industry hiring trends and benchmark compensation bands.
        </p>
      </div>

      {/* Selector Tabs */}
      <div className="flex justify-center gap-3 mb-10">
        {(['ai', 'fullstack', 'cloud'] as const).map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold capitalize transition-all duration-300 border ${
              selectedRole === role
                ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-lg shadow-amber-950/40 scale-105'
                : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {role === 'ai' && 'AI Systems Engineer'}
            {role === 'fullstack' && 'Full-Stack Lead'}
            {role === 'cloud' && 'Cloud Architect'}
          </button>
        ))}
      </div>

      {/* Main Radar Card */}
      <TiltCard glowColor="rgba(245, 158, 11, 0.2)" className="p-8 sm:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Key Metrics Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-xl sm:text-2xl font-bold text-white">{current.title}</h3>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                {current.demandLevel} Demand
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10">
                <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Benchmark Compensation
                </span>
                <span className="text-lg font-bold text-white font-mono">{current.salaryBand}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10">
                <span className="text-xs text-slate-400 block mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Hiring Growth Rate
                </span>
                <span className="text-lg font-bold text-emerald-400 font-mono">{current.growthRate}</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">
                High-Yield Skill Requirements
              </span>
              <div className="flex flex-wrap gap-2">
                {current.topSkills.map((sk) => (
                  <span
                    key={sk}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Conceptual Radar Display Side */}
          <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-950/90 border border-white/10 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono border-b border-white/10 pb-3">
              <span className="text-slate-400 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                Industry Skill Weight Vector
              </span>
              <span className="text-slate-500">Conceptual Radar</span>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Deep Learning & Transformers</span>
                  <span className="text-amber-400 font-mono font-bold">96%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full w-[96%] bg-linear-to-r from-amber-500 to-orange-400 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Vector Database Indexing</span>
                  <span className="text-amber-400 font-mono font-bold">88%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full w-[88%] bg-linear-to-r from-amber-500 to-indigo-400 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Distributed Microservice Scalability</span>
                  <span className="text-emerald-400 font-mono font-bold">92%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                  <div className="h-full w-[92%] bg-linear-to-r from-emerald-500 to-cyan-400 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </TiltCard>
    </section>
  );
};
