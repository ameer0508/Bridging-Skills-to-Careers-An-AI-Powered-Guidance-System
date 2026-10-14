import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowLeft,
  Brain,
  Award,
  Target,
  TrendingUp,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { AuroraBackground } from '../../features/landing/components/effects/AuroraBackground';
import { TiltCard } from '../../features/landing/components/effects/TiltCard';
import { AuthIntelligenceField } from '../../features/auth/components/AuthIntelligenceField';

export interface AuthLayoutProps {
  children?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isRegister = location.pathname.includes('register');
  const activeMode = isRegister ? 'register' : 'login';

  return (
    <AuroraBackground
      showParticles={true}
      className="min-h-screen w-screen flex flex-col justify-between overflow-x-hidden font-sans selection:bg-violet-50 selection:text-aurora-ink"
    >
      {/* Top Header Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between pointer-events-auto">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-extrabold tracking-tight text-aurora-ink group-hover:text-aurora-indigo transition-colors">
              SkillBridge
            </span>
            <span className="text-[10px] font-bold tracking-widest text-aurora-violet uppercase -mt-1">
              AI Intelligence OS
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-aurora-muted hover:text-aurora-indigo bg-aurora-canvas/60 border border-aurora-line hover:border-aurora-line backdrop-blur-md transition-all duration-200 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Landing Page</span>
        </Link>
      </header>

      {/* Main Container - Asymmetrical Editorial Split */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column - Dynamic Intelligence Node Visualization (Desktop) */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex lg:col-span-7 flex-col gap-6 justify-center pr-4"
        >
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-aurora-violet/25 bg-aurora-violet/[0.06] backdrop-blur-md self-start">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-bold text-aurora-indigo tracking-wider uppercase">
              {isRegister ? 'Build Career Intelligence' : 'Entering SkillBridge Doorway'}
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="font-display text-4xl xl:text-5xl font-extrabold text-aurora-ink tracking-tight leading-tight">
              {isRegister ? (
                <>
                  Map Your Career <br />
                  <span className="bg-linear-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                    With AI Vector Precision.
                  </span>
                </>
              ) : (
                <>
                  Welcome Back To <br />
                  <span className="bg-linear-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
                    Your AI Career OS.
                  </span>
                </>
              )}
            </h1>
            <p className="text-aurora-muted text-base leading-relaxed max-w-lg">
              Unlock vector skill matching, automated ATS resume intelligence, and adaptive milestone roadmaps tailored to your capabilities.
            </p>
          </div>

          {/* Canvas Orbital Node Network */}
          <div className="relative">
            <AuthIntelligenceField activeMode={activeMode} />
          </div>

          {/* Floating Glass Showcase Card */}
          <TiltCard glowColor="rgba(99, 102, 241, 0.25)" className="p-5 -mt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-aurora-line pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-linear-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-aurora-ink">Target Match: AI Systems Engineer</h4>
                    <p className="text-[10px] text-aurora-muted font-mono">Embedding Cosine Search</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  94.8% Vector Match
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex flex-col">
                  <span className="text-[10px] text-aurora-muted flex items-center justify-between">
                    <span>ATS Index</span>
                    <Award className="w-3 h-3 text-aurora-violet" />
                  </span>
                  <span className="text-base font-bold text-aurora-ink mt-1">98/100</span>
                  <span className="text-[9px] text-emerald-700 font-mono">Optimized</span>
                </div>

                <div className="p-2.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex flex-col">
                  <span className="text-[10px] text-aurora-muted flex items-center justify-between">
                    <span>Skill Gaps</span>
                    <Target className="w-3 h-3 text-aurora-violet" />
                  </span>
                  <span className="text-base font-bold text-aurora-ink mt-1">3 Missing</span>
                  <span className="text-[9px] text-aurora-indigo font-mono">Roadmap Ready</span>
                </div>

                <div className="p-2.5 rounded-xl bg-aurora-canvas/60 border border-aurora-line flex flex-col">
                  <span className="text-[10px] text-aurora-muted flex items-center justify-between">
                    <span>Velocity</span>
                    <TrendingUp className="w-3 h-3 text-emerald-700" />
                  </span>
                  <span className="text-base font-bold text-aurora-ink mt-1">4.8x Avg</span>
                  <span className="text-[9px] text-emerald-700 font-mono">High Growth</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-violet-50 border border-aurora-violet/25 flex items-center justify-between text-xs text-aurora-indigo">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span className="text-[11px]">
                    <strong>AI System:</strong> Real-time guidance engine ready
                  </span>
                </div>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              </div>
            </div>
          </TiltCard>
        </motion.div>

        {/* Right Column - Auth Card with Smooth Page Transitions */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 w-full flex items-center justify-center"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full flex justify-center"
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Footer minimal info */}
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-aurora-muted border-t border-aurora-line gap-2 font-mono">
        <span>© {new Date().getFullYear()} SkillBridge Platform. Production Hardened v1.0</span>
        <div className="flex items-center gap-4">
          <span className="hover:text-aurora-muted transition-colors cursor-pointer">Privacy Specification</span>
          <span className="hover:text-aurora-muted transition-colors cursor-pointer">Terms of Service</span>
          <span className="hover:text-aurora-muted transition-colors cursor-pointer">System Telemetry</span>
        </div>
      </footer>
    </AuroraBackground>
  );
};

AuthLayout.displayName = 'AuthLayout';
export default AuthLayout;
