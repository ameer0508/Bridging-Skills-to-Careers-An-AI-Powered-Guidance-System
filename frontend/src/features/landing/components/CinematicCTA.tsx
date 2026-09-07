import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { TiltCard } from './effects/TiltCard';

export const CinematicCTA: React.FC = () => {
  return (
    <section className="py-28 px-4 max-w-7xl mx-auto relative overflow-hidden">
      <TiltCard glowColor="rgba(99, 102, 241, 0.35)" className="p-8 sm:p-16 text-center relative overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-160 h-160 rounded-full bg-linear-to-tr from-indigo-600/30 via-purple-600/20 to-cyan-500/20 blur-3xl -z-10" />

        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-indigo-300 tracking-wider uppercase">
              Begin Acceleration Today
            </span>
          </div>

          <h2 className="font-display text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Your Career Has A Direction. <br />
            <span className="bg-linear-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              Now Give It Intelligence.
            </span>
          </h2>

          <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Join thousands of ambitious professionals using SkillBridge to unlock targeted skill insights and land high-impact roles.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto relative group overflow-hidden inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-bold text-white rounded-full bg-linear-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-2xl shadow-indigo-600/40 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <Sparkles className="w-5 h-5 text-cyan-200" />
              <span>Start Your Journey Today</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-4 text-base font-semibold text-slate-200 hover:text-white rounded-full bg-slate-900/80 border border-white/15 hover:border-white/30 backdrop-blur-xl transition-all"
            >
              Sign In to Account
            </Link>
          </div>

          <div className="pt-6 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant Access
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No Credit Card Required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Enterprise-Grade AI
            </span>
          </div>
        </div>
      </TiltCard>
    </section>
  );
};
