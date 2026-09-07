import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Bot, User, CheckCircle2, AlertTriangle, BookOpen, Layers } from 'lucide-react';
import { TiltCard } from './effects/TiltCard';

interface PresetPrompt {
  id: string;
  roleTitle: string;
  userMessage: string;
  matchScore: number;
  confidenceScore: number;
  gaps: string[];
  roadmapSteps: string[];
  recommendedProjects: string[];
}

const PRESET_PROMPTS: PresetPrompt[] = [
  {
    id: 'ai-engineer',
    roleTitle: 'AI Systems Engineer',
    userMessage: 'I want to transition into an AI Systems Engineer role. What is my gap analysis?',
    matchScore: 94,
    confidenceScore: 99.2,
    gaps: ['Vector Databases (Pinecone/Milvus)', 'LLM Evaluation & Guardrails', 'GPU Optimization with CUDA'],
    roadmapSteps: [
      'Phase 1: Master PyTorch & Transformer Architecture (2 Wks)',
      'Phase 2: Build End-to-End RAG Pipeline with LangChain (3 Wks)',
      'Phase 3: Deploy Model Microservices on Kubernetes & FastAPI (2 Wks)',
    ],
    recommendedProjects: ['Production RAG Knowledge Base', 'Custom Fine-Tuned Llama 3 Agent'],
  },
  {
    id: 'fullstack-lead',
    roleTitle: 'Senior Full-Stack Lead',
    userMessage: 'Analyze my readiness for a Senior Full-Stack Lead role at an AI SaaS startup.',
    matchScore: 89,
    confidenceScore: 98.7,
    gaps: ['System Design for 100k QPS', 'GraphQL Federation', 'Distributed Tracing with OpenTelemetry'],
    roadmapSteps: [
      'Phase 1: Advanced Micro-Frontend Architecture & Vite (1 Wk)',
      'Phase 2: Distributed Caching with Redis & Node.js Cluster (2 Wks)',
      'Phase 3: High-Scale DB Partitioning & Sharding (2 Wks)',
    ],
    recommendedProjects: ['Real-Time Collaborative Canvas App', 'High-Throughput Analytics Service'],
  },
  {
    id: 'cloud-architect',
    roleTitle: 'Cloud AI Architect',
    userMessage: 'What certification or hands-on projects do I need to become a Cloud AI Architect?',
    matchScore: 91,
    confidenceScore: 98.1,
    gaps: ['AWS Bedrock & Vertex AI Infrastructure', 'Terraform IaC Pipelines', 'Zero-Trust Cloud Security'],
    roadmapSteps: [
      'Phase 1: Terraform Infrastructure as Code for Multi-Region Deployments (2 Wks)',
      'Phase 2: Secure Cloud AI Pipeline Configuration (2 Wks)',
      'Phase 3: Cost Optimization & Serverless AI Inference (1 Wk)',
    ],
    recommendedProjects: ['Automated Multi-Cloud IaC Engine', 'Zero-Trust Enterprise Gateway'],
  },
];

export const LiveAIExperience: React.FC = () => {
  const [selectedPrompt, setSelectedPrompt] = useState<PresetPrompt>(PRESET_PROMPTS[0]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamedText, setStreamedText] = useState('');

  const fullResponse = `Based on your analyzed Skill Vector and Resume Taxonomy, you have strong foundational alignment (${selectedPrompt.matchScore}% match) for the ${selectedPrompt.roleTitle} role. Here is your personalized AI gap evaluation and action plan:`;

  useEffect(() => {
    setIsTyping(true);
    setStreamedText('');
    let i = 0;

    const timer = setInterval(() => {
      if (i < fullResponse.length) {
        setStreamedText((prev) => prev + fullResponse.charAt(i));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 12);

    return () => clearInterval(timer);
  }, [fullResponse]);

  return (
    <section id="live-ai" className="py-28 px-4 max-w-7xl mx-auto relative">
      {/* Cinematic Statement Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-md">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider uppercase">
            Live Intelligence Console
          </span>
        </div>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
          Ask Your Career <br />
          <span className="bg-linear-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            A Better Question.
          </span>
        </h2>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Select a sample target career path to simulate how SkillBridge evaluates your skills and generates instant, explainable guidance.
        </p>
      </div>

      {/* Preset Prompt Selector Pills */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
        {PRESET_PROMPTS.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => setSelectedPrompt(prompt)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 border ${
              selectedPrompt.id === prompt.id
                ? 'bg-linear-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white border-cyan-400 shadow-lg shadow-indigo-600/30 scale-105'
                : 'bg-slate-900/70 text-slate-400 hover:text-white border-white/10 hover:border-white/20 backdrop-blur-md'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>{prompt.roleTitle}</span>
          </button>
        ))}
      </div>

      {/* Main AI Interaction Console */}
      <TiltCard glowColor="rgba(99, 102, 241, 0.25)" className="p-6 sm:p-8 md:p-10">
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                SkillBridge AI Architect
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                  Online
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">Powered by Gemini 1.5 & Custom Skill Embeddings</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Confidence:</span>
              <span className="text-emerald-400 font-bold">{selectedPrompt.confidenceScore}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Match:</span>
              <span className="text-indigo-400 font-bold">{selectedPrompt.matchScore}%</span>
            </div>
          </div>
        </div>

        {/* Chat Thread */}
        <div className="space-y-6">
          {/* User Prompt */}
          <div className="flex items-start gap-4 justify-end">
            <div className="max-w-2xl p-4 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 text-slate-100 text-sm leading-relaxed backdrop-blur-md">
              <p className="font-mono text-indigo-200 text-xs mb-1">User Query</p>
              {selectedPrompt.userMessage}
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <User className="w-4 h-4" />
            </div>
          </div>

          {/* AI Response Stream */}
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-cyan-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-cyan-500/30">
              <Sparkles className="w-4 h-4" />
            </div>

            <div className="flex-1 space-y-5 p-5 sm:p-6 rounded-2xl bg-slate-950/90 border border-white/10">
              <div className="text-sm text-slate-200 leading-relaxed font-normal">
                {streamedText}
                {isTyping && <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse" />}
              </div>

              {/* Revealed Analysis Grid */}
              <AnimatePresence>
                {!isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10"
                  >
                    {/* Skill Gap Tile */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                        <AlertTriangle className="w-4 h-4" />
                        Targeted Skill Gaps
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {selectedPrompt.gaps.map((gap, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Capstone Projects Tile */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2">
                      <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                        <BookOpen className="w-4 h-4" />
                        Recommended Capstone Projects
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {selectedPrompt.recommendedProjects.map((proj, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{proj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Adaptive Roadmap Blueprint */}
                    <div className="md:col-span-2 p-4 rounded-xl bg-slate-900 border border-indigo-500/30 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-300 uppercase tracking-wider">
                        <span className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-400" />
                          Adaptive Learning Roadmap Blueprint
                        </span>
                        <span className="text-emerald-400 font-mono text-[11px] lowercase">
                          Est. Completion: 7 Weeks
                        </span>
                      </div>
                      <div className="space-y-2">
                        {selectedPrompt.roadmapSteps.map((step, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-950/80 border border-white/5 text-xs text-slate-200 flex items-center justify-between"
                          >
                            <span>{step}</span>
                            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                              Verified
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </TiltCard>
    </section>
  );
};
