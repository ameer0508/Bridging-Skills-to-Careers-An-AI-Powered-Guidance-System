import React, { useState } from 'react';
import { User, Cpu, Code2, Award, Target, FileText, CheckCircle2, Sparkles, Activity } from 'lucide-react';
import { TiltCard } from './effects/TiltCard';

export const DigitalTwinSection: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string>('twin');

  const nodes = [
    { id: 'resume', label: 'Resume Parser', icon: FileText, value: '98/100 ATS Score', color: 'text-indigo-400', border: 'border-indigo-500/30' },
    { id: 'skills', label: 'Skill Vectors', icon: Cpu, value: '24 Entities Extracted', color: 'text-cyan-400', border: 'border-cyan-500/30' },
    { id: 'projects', label: 'GitHub Projects', icon: Code2, value: '14 Repos Ingested', color: 'text-purple-400', border: 'border-purple-500/30' },
    { id: 'certifications', label: 'Verified Badges', icon: Award, value: '3 Active Credentials', color: 'text-emerald-400', border: 'border-emerald-500/30' },
    { id: 'goals', label: 'Target Role', icon: Target, value: 'AI Systems Architect', color: 'text-rose-400', border: 'border-rose-500/30' },
  ];

  return (
    <section id="digital-twin" className="py-24 px-4 max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider uppercase">
            Signature Intelligence Feature
          </span>
        </div>

        <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Construct Your <br />
          <span className="bg-linear-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            Professional Digital Twin
          </span>
        </h2>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          SkillBridge unifies all your career telemetry into a dynamic, living AI representation that continuously simulates market fit and interview readiness.
        </p>
      </div>

      {/* Main Interactive Graph Card */}
      <TiltCard glowColor="rgba(14, 165, 233, 0.2)" className="p-6 sm:p-10 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Inputs Column */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Ingestion Evidence Nodes
            </span>
            {nodes.map((node) => {
              const Icon = node.icon;
              const isSelected = activeNode === node.id;
              return (
                <button
                  key={node.id}
                  onClick={() => setActiveNode(node.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all duration-300 flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400/60 shadow-lg shadow-cyan-950/40 scale-[1.02]'
                      : 'bg-slate-950/70 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center ${node.color} border border-white/10`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{node.label}</span>
                      <span className="text-[11px] font-mono text-slate-400">{node.value}</span>
                    </div>
                  </div>
                  <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-700'}`} />
                </button>
              );
            })}
          </div>

          {/* Central Animated Digital Twin Sphere */}
          <div className="lg:col-span-8 relative flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-950/90 border border-white/10">
            {/* Ambient Aura */}
            <div className="absolute inset-0 rounded-2xl bg-linear-to-tr from-indigo-500/10 via-purple-500/10 to-cyan-500/10 blur-2xl -z-10" />

            <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-cyan-500/30 flex items-center justify-center mb-6">
              {/* Rotating Orbit Rings */}
              <div className="absolute inset-2 rounded-full border border-dashed border-indigo-500/30 animate-spin" style={{ animationDuration: '25s' }} />
              <div className="absolute inset-6 rounded-full border border-dashed border-purple-500/30 animate-spin" style={{ animationDuration: '18s', animationDirection: 'reverse' }} />

              {/* Core Icon */}
              <div className="w-24 h-24 rounded-full bg-linear-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex flex-col items-center justify-center text-white shadow-2xl shadow-cyan-500/40">
                <User className="w-8 h-8 text-white mb-1" />
                <span className="text-[9px] font-mono font-bold tracking-wider uppercase">Digital Twin</span>
              </div>
            </div>

            {/* Live Telemetry Card */}
            <div className="w-full max-w-lg p-4 rounded-xl bg-slate-900 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Twin Synergy Status
                </span>
                <span className="text-emerald-400 font-mono">94.8% Career Match Readiness</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {activeNode === 'twin' && 'All 5 telemetry sources synchronized. Digital Twin indicates high compatibility with Tier 1 AI Engineer roles.'}
                {activeNode === 'resume' && 'Resume Parser Node: Extracted 24 verified tech keywords with 98/100 ATS formatting density.'}
                {activeNode === 'skills' && 'Skill Vector Node: High proficiency detected in PyTorch, FastAPI, and TypeScript; gap flagged in Vector Databases.'}
                {activeNode === 'projects' && 'GitHub Node: Analyzed 14 open-source repositories verifying hands-on microservice deployment capability.'}
                {activeNode === 'certifications' && 'Certifications Node: Verified 3 AWS & Docker technical credentials.'}
                {activeNode === 'goals' && 'Goals Node: AI Systems Architect path mapped with 7-week adaptive roadmap.'}
              </p>
            </div>
          </div>
        </div>
      </TiltCard>
    </section>
  );
};
