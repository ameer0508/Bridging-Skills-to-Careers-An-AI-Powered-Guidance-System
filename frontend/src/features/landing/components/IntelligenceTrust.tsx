import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Cpu, Code2, Brain, Lock } from 'lucide-react';
import { TiltCard } from './effects/TiltCard';

export const IntelligenceTrust: React.FC = () => {
  const pillars = [
    {
      title: 'Explainable AI Architecture',
      desc: 'Every career match score and skill gap warning is accompanied by transparent reasoning breakdown and confidence metrics.',
      icon: Brain,
      color: 'text-cyan-400',
    },
    {
      title: 'High-Dimensional Vector Search',
      desc: 'Converts skills and role descriptions into dense vector embeddings using Sentence Transformers for mathematical similarity ranking.',
      icon: Cpu,
      color: 'text-indigo-400',
    },
    {
      title: 'spaCy NLP Document Parsing',
      desc: 'Ingests complex multi-page PDF and DOCX files using custom entity recognition trained on technical software engineering taxonomies.',
      icon: Code2,
      color: 'text-purple-400',
    },
    {
      title: 'Deterministic Skill Matrix',
      desc: 'Replaces black-box AI guessing with verified skill comparison matrices against standardized industry role definitions.',
      icon: ShieldCheck,
      color: 'text-emerald-400',
    },
  ];

  return (
    <section className="py-24 px-4 max-w-7xl mx-auto relative">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold text-emerald-300 tracking-wider uppercase">
            Technical Authority & Grounding
          </span>
        </div>

        <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
          Engineered For <br />
          <span className="bg-linear-to-r from-emerald-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Maximum AI Transparency
          </span>
        </h2>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          SkillBridge is built on open explainable models, mathematical vector distances, and strict domain schemas.
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pillars.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <TiltCard glowColor="rgba(52, 211, 153, 0.15)" className="p-8 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center ${item.color} border border-white/10`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-normal">{item.desc}</p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Lock className="w-3.5 h-3.5" /> Verified Architecture
                  </span>
                  <span>Component {idx + 1}</span>
                </div>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
