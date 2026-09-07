import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Cpu, Code2, Briefcase, Target, BookOpen, TrendingUp, Sparkles } from 'lucide-react';

export const CareerUniverse: React.FC = () => {
  const elements = [
    { name: 'Raw Resume', desc: 'Fragmented PDF bullet points', icon: FileText, color: 'text-slate-400', border: 'border-slate-700' },
    { name: 'Skill Vectors', desc: 'spaCy NLP extracted entities', icon: Cpu, color: 'text-indigo-400', border: 'border-indigo-500/30' },
    { name: 'Project Proof', desc: 'GitHub repos & code metrics', icon: Code2, color: 'text-cyan-400', border: 'border-cyan-500/30' },
    { name: 'Domain Experience', desc: 'Year equivalent proficiency', icon: Briefcase, color: 'text-purple-400', border: 'border-purple-500/30' },
    { name: 'Career Aspirations', desc: 'Target role benchmarks', icon: Target, color: 'text-rose-400', border: 'border-rose-500/30' },
    { name: 'Adaptive Learning', desc: 'Targeted capstone roadmaps', icon: BookOpen, color: 'text-emerald-400', border: 'border-emerald-500/30' },
    { name: 'Market Demand', desc: 'Live industry skill trends', icon: TrendingUp, color: 'text-amber-400', border: 'border-amber-500/30' },
  ];

  return (
    <section id="platform" className="py-28 px-4 max-w-7xl mx-auto relative">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono font-bold text-indigo-300 tracking-wider uppercase">
            Paradigm Shift
          </span>
        </div>

        <h2 className="font-display text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
          Your Career Is <br />
          <span className="bg-linear-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            More Than A Static Resume.
          </span>
        </h2>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Traditional job boards treat you as a 2-page PDF. SkillBridge synthesizes your complete technical fingerprint into a unified intelligence graph.
        </p>
      </div>

      {/* Spatial Element Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10 mb-12">
        {elements.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.07, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`p-6 rounded-2xl bg-slate-900/70 border ${item.border} backdrop-blur-xl transition-all duration-300 group hover:bg-slate-900/90 shadow-xl`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center ${item.color} border border-white/10 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">Node 0{idx + 1}</span>
              </div>
              <h3 className="text-base font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">
                {item.name}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          );
        })}

        {/* Central Intelligence Synthesis Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="lg:col-span-1 p-6 rounded-2xl bg-linear-to-tr from-indigo-950/80 via-purple-950/60 to-cyan-950/40 border border-cyan-500/40 backdrop-blur-2xl flex flex-col justify-between shadow-2xl shadow-cyan-950/40"
        >
          <div>
            <div className="w-12 h-12 rounded-xl bg-linear-to-r from-cyan-500 to-indigo-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-cyan-500/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest block mb-1">
              Unified Output
            </span>
            <h3 className="text-lg font-extrabold text-white mb-2">Professional Intelligence</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Consolidates all nodes into real-time career match scores, targeted gap matrices, and explainable action plans.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs text-cyan-300 font-mono">
            <span>Status: Active</span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-[10px]">100% Grounding</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
