import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Play, Brain, CheckCircle2, ChevronDown } from 'lucide-react';
import { InteractiveIntelligenceField } from './effects/InteractiveIntelligenceField';

export const IntelligenceHero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex flex-col justify-between pt-36 pb-16 px-4 max-w-7xl mx-auto overflow-hidden">
      {/* Background Interactive Intelligence Field */}
      <InteractiveIntelligenceField />

      {/* Main Hero Narrative Body */}
      <div className="relative z-10 my-auto flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
        {/* Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-cyan-500/40 bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-cyan-500/10"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider uppercase">
            Career Intelligence System v1.0
          </span>
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        </motion.div>

        {/* Massive Display Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white leading-[1.05]"
        >
          Bridge Your Skills <br />
          <span className="bg-linear-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
            To Your Dream Career
          </span>{' '}
          <br />
          With Precision AI.
        </motion.h1>

        {/* Supporting Copy */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="text-base sm:text-lg md:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl"
        >
          SkillBridge transforms resumes, project evidence, and skill vectors into an explainable, adaptive career intelligence roadmap.
        </motion.p>

        {/* Magnetic Primary & Secondary CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-2 w-full sm:w-auto"
        >
          <Link
            to="/register"
            className="relative group overflow-hidden inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white rounded-full bg-linear-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-2xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all duration-300"
          >
            <Sparkles className="w-5 h-5 text-cyan-200" />
            <span>Start Your Journey</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#live-ai"
            className="inline-flex items-center justify-center gap-2.5 px-7 py-4 text-base font-semibold text-slate-200 hover:text-white rounded-full bg-slate-900/80 border border-white/15 hover:border-white/30 backdrop-blur-xl hover:bg-white/10 transition-all duration-200"
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400">
              <Play className="w-3 h-3 fill-current translate-x-0.5" />
            </div>
            <span>Explore Intelligence Engine</span>
          </a>
        </motion.div>

        {/* System Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.8 }}
          className="pt-8 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400 font-mono"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Production Grade AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span>Vector Skill Graph</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Explainable Guidance</span>
          </div>
        </motion.div>
      </div>

      {/* Subtle Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="relative z-10 flex flex-col items-center pt-8 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        onClick={() => {
          document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <span className="text-[10px] font-mono uppercase tracking-widest mb-1">Scroll to Explore</span>
        <ChevronDown className="w-4 h-4 animate-bounce text-cyan-400" />
      </motion.div>
    </section>
  );
};
