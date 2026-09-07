import React, { useState } from 'react';
import { Bot, Cpu, FileText, BookOpen, MessageSquare, Briefcase, Layers } from 'lucide-react';
import { TiltCard } from './effects/TiltCard';

interface Agent {
  id: string;
  name: string;
  role: string;
  purpose: string;
  inputs: string;
  outputs: string;
  icon: React.ElementType;
  color: string;
  border: string;
}

export const AgentConstellation: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<string>('orchestrator');

  const agents: Agent[] = [
    {
      id: 'orchestrator',
      name: 'Multi-Agent Orchestrator',
      role: 'Core Supervisor',
      purpose: 'Coordinates agent communication, task execution sequence, and long-term memory retrieval.',
      inputs: 'User Intent, Profile State, System Memory',
      outputs: 'Orchestrated Workflow Directives',
      icon: Cpu,
      color: 'text-cyan-400',
      border: 'border-cyan-500/40',
    },
    {
      id: 'planning',
      name: 'Career Planning Agent',
      role: 'Strategy & Milestones',
      purpose: 'Maps career benchmarks and computes probabilistic match percentages across target roles.',
      inputs: 'Skill Embeddings, Industry Taxonomies',
      outputs: 'Target Career Match Vector',
      icon: Bot,
      color: 'text-indigo-400',
      border: 'border-indigo-500/40',
    },
    {
      id: 'resume',
      name: 'Resume Intelligence Agent',
      role: 'Document Parsing & ATS',
      purpose: 'Runs spaCy NLP and PyMuPDF text extraction to generate hardened, ATS-optimized JSON profiles.',
      inputs: 'Raw PDF/DOCX Files',
      outputs: 'Parsed Skill Entity Taxonomy',
      icon: FileText,
      color: 'text-purple-400',
      border: 'border-purple-500/40',
    },
    {
      id: 'learning',
      name: 'Adaptive Learning Agent',
      role: 'Curriculum Generation',
      purpose: 'Constructs week-by-week learning roadmaps and selects curated open-source projects.',
      inputs: 'Skill Gap Matrix',
      outputs: 'Personalized 7-Week Roadmap',
      icon: BookOpen,
      color: 'text-emerald-400',
      border: 'border-emerald-500/40',
    },
    {
      id: 'interview',
      name: 'Interview Simulation Agent',
      role: 'Technical Coaching',
      purpose: 'Simulates technical interview queries and evaluates answer quality using Gemini 1.5.',
      inputs: 'Target Role & Code Snippets',
      outputs: 'Detailed Feedback & Score',
      icon: MessageSquare,
      color: 'text-rose-400',
      border: 'border-rose-500/40',
    },
    {
      id: 'job',
      name: 'Job Matching Agent',
      role: 'Opportunity Intelligence',
      purpose: 'Scans live hiring market feeds and matches candidate vectors with high-yield openings.',
      inputs: 'Readiness Index, Preferred Salary',
      outputs: 'Ranked Job Opportunities',
      icon: Briefcase,
      color: 'text-amber-400',
      border: 'border-amber-500/40',
    },
  ];

  const active = agents.find((a) => a.id === selectedAgent) || agents[0];
  const ActiveIcon = active.icon;

  return (
    <section id="agents" className="py-28 px-4 max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider uppercase">
            Product Architecture Visualization
          </span>
        </div>

        <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          The CareerOS <br />
          <span className="bg-linear-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            AI Agent Constellation
          </span>
        </h2>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          SkillBridge coordinates specialized autonomous AI agents working in unison to guide your career evolution.
        </p>
      </div>

      {/* Constellation Grid & Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Agent Buttons */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {agents.map((ag) => {
            const Icon = ag.icon;
            const isSelected = selectedAgent === ag.id;
            return (
              <button
                key={ag.id}
                onClick={() => setSelectedAgent(ag.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-300 flex items-center gap-3 ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-400 shadow-xl shadow-cyan-950/40 scale-[1.03]'
                    : 'bg-slate-950/70 border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center ${ag.color} border border-white/10`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">{ag.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">{ag.role}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Detail Card */}
        <div className="lg:col-span-6">
          <TiltCard glowColor="rgba(14, 165, 233, 0.2)" className="p-8 sm:p-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center text-cyan-400">
                    <ActiveIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{active.name}</h3>
                    <span className="text-xs font-mono text-cyan-300">{active.role}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
                  Autonomous Agent
                </span>
              </div>

              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest block mb-1">
                  Core Purpose & Capability
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-normal">{active.purpose}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Agent Inputs</span>
                  <span className="text-xs font-semibold text-white">{active.inputs}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/10">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Agent Outputs</span>
                  <span className="text-xs font-semibold text-emerald-400 font-mono">{active.outputs}</span>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
};
