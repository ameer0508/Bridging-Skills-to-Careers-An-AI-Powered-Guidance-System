import React, { useState } from 'react';
import { CheckCircle2, Clock, PlayCircle, SkipForward, Sparkles, ShieldCheck, Layers, GitBranch } from 'lucide-react';
import { GlassPanel } from '../../../components/experience/workspace';

export interface MilestoneItem {
  id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'not_started' | 'skipped';
}

export interface PhaseTimelineItem {
  phase: number;
  title: string;
  durationWeeks: number;
  focusSkills: string[];
  milestones: MilestoneItem[];
  whyIncluded?: string;
  prerequisites?: string[];
  careerBenefit?: string;
  expectedOutcome?: string;
}

export interface AdaptiveTimelineProps {
  phases?: PhaseTimelineItem[];
  onToggleStatus?: (milestoneId: string, newStatus: string) => void;
}

export const defaultPhases: PhaseTimelineItem[] = [
  {
    phase: 1,
    title: 'Foundational Core & API Architecture',
    durationWeeks: 4,
    focusSkills: ['Python', 'Async FastAPI', 'Data Structures'],
    milestones: [
      { id: 'm1', title: 'Master core concepts & syntax for Python, Async FastAPI.', status: 'completed' },
      { id: 'm2', title: 'Build production-grade capstone project integrating Python.', status: 'completed' },
      { id: 'm3', title: 'Publish clean, documented code repository with README to GitHub.', status: 'in_progress' },
      { id: 'm4', title: 'Pass technical skill assessment checkpoint for Python.', status: 'not_started' }
    ],
    whyIncluded: 'Establishes core programming, mathematical logic, and API backend foundations.',
    prerequisites: ['Programming Fundamentals'],
    careerBenefit: 'Enables creation of robust API services and mathematical data manipulation.',
    expectedOutcome: 'Functional Python API service with automated test coverage.'
  },
  {
    phase: 2,
    title: 'Machine Learning & Deep Neural Architecture',
    durationWeeks: 6,
    focusSkills: ['Machine Learning', 'PyTorch', 'Deep Learning'],
    milestones: [
      { id: 'm5', title: 'Master core concepts & neural network architectures.', status: 'not_started' },
      { id: 'm6', title: 'Build PyTorch image classification capstone.', status: 'not_started' },
      { id: 'm7', title: 'Complete mock technical interview challenges.', status: 'not_started' }
    ],
    whyIncluded: 'Core machine learning algorithms and deep neural network training techniques.',
    prerequisites: ['Python', 'Linear Algebra'],
    careerBenefit: 'Unlocks ability to train, evaluate, and fine-tune machine learning models.',
    expectedOutcome: 'Trained PyTorch model achieving benchmark accuracy on test datasets.'
  },
  {
    phase: 3,
    title: 'LLMs, RAG Pipelines & Vector Databases',
    durationWeeks: 6,
    focusSkills: ['LLMs', 'RAG Pipelines', 'Vector Databases (Milvus)'],
    milestones: [
      { id: 'm8', title: 'Master RAG architecture and similarity indexing.', status: 'not_started' },
      { id: 'm9', title: 'Deploy Milvus vector index on Kubernetes.', status: 'not_started' }
    ],
    whyIncluded: 'Production Generative AI stack including vector similarity search and RAG.',
    prerequisites: ['Deep Learning', 'Async FastAPI'],
    careerBenefit: 'Prepares candidate for high-demand AI Engineer and LLM Architect roles.',
    expectedOutcome: 'Production RAG knowledge retrieval backend with vector similarity index.'
  }
];

export const AdaptiveTimeline: React.FC<AdaptiveTimelineProps> = ({
  phases = defaultPhases,
  onToggleStatus
}) => {
  const [localPhases, setLocalPhases] = useState<PhaseTimelineItem[]>(phases);

  const handleMilestoneAction = (phaseIdx: number, mId: string, action: 'complete' | 'skip') => {
    const updated = localPhases.map((p, pIdx) => {
      if (pIdx !== phaseIdx) return p;
      return {
        ...p,
        milestones: p.milestones.map(m => {
          if (m.id !== mId) return m;
          const nextStatus = action === 'complete' ? (m.status === 'completed' ? 'not_started' : 'completed') : 'skipped';
          return { ...m, status: nextStatus };
        })
      };
    });
    setLocalPhases(updated);
    if (onToggleStatus) onToggleStatus(mId, action);
  };

  return (
    <GlassPanel className="p-6 space-y-6 border-indigo-500/30">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Adaptive Learning Journey Timeline</h3>
            <p className="text-xs text-slate-400">Dynamic phase sequencing and milestone progress triggers</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold">
          Sequencer Active
        </span>
      </div>

      <div className="space-y-6">
        {localPhases.map((p, pIdx) => {
          const completedCount = p.milestones.filter(m => m.status === 'completed').length;
          const pct = Math.round((completedCount / max(p.milestones.length, 1)) * 100);

          return (
            <div key={pIdx} className="p-5 bg-slate-950/80 border border-white/5 rounded-2xl space-y-4">
              {/* PHASE HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold font-mono text-xs flex items-center justify-center shrink-0">
                    P{p.phase}
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-white">{p.title}</h4>
                    <span className="text-[11px] font-mono text-slate-400">Duration: {p.durationWeeks} Weeks</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-24 bg-slate-900 rounded-full h-2 overflow-hidden border border-white/10">
                    <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">{pct}%</span>
                </div>
              </div>

              {/* FOCUS SKILL TAGS */}
              <div className="flex flex-wrap gap-1.5">
                {p.focusSkills.map((sk, sIdx) => (
                  <span key={sIdx} className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-mono">
                    {sk}
                  </span>
                ))}
              </div>

              {/* MILESTONES LIST */}
              <div className="space-y-2 pt-2">
                {p.milestones.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                      m.status === 'completed'
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-200'
                        : m.status === 'skipped'
                        ? 'bg-slate-900 border-white/5 text-slate-500 line-through'
                        : 'bg-slate-900 border-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleMilestoneAction(pIdx, m.id, 'complete')}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          m.status === 'completed' ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <span className="font-mono">{m.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMilestoneAction(pIdx, m.id, 'skip')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <SkipForward className="w-3 h-3" />
                        <span>{m.status === 'skipped' ? 'Skipped' : 'Skip'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
};

function max(a: number, b: number) { return a > b ? a : b; }
