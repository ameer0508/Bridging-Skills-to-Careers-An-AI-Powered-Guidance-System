import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowLeft,
  Brain,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { AuroraBackground } from '../../features/landing/components/effects/AuroraBackground';
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
              Career guidance
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-aurora-muted hover:text-aurora-indigo bg-aurora-canvas/60 border border-aurora-line hover:border-aurora-line transition-all duration-200 group"
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-aurora-violet/25 bg-aurora-violet/[0.06] self-start">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-aurora-violet"></span>
            </span>
            <span className="text-xs font-bold text-aurora-indigo tracking-wider uppercase">
              {isRegister ? 'Create your account' : 'Sign in'}
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="font-display text-4xl xl:text-5xl font-extrabold text-aurora-ink tracking-tight leading-tight">
              {isRegister ? (
                <>
                  Map Your Career <br />
                  <span className="bg-linear-to-r from-aurora-indigo via-aurora-violet to-aurora-sky bg-clip-text text-transparent">
                    From Your Own Evidence.
                  </span>
                </>
              ) : (
                <>
                  Welcome Back To <br />
                  <span className="bg-linear-to-r from-aurora-indigo via-aurora-violet to-aurora-sky bg-clip-text text-transparent">
                    Your Career Plan.
                  </span>
                </>
              )}
            </h1>
            <p className="text-aurora-muted text-base leading-relaxed max-w-lg">
              Upload a resume, see which careers fit the skills it shows, and follow a roadmap for the gaps. No paid AI required.
            </p>
          </div>

          {/* Canvas Orbital Node Network */}
          <div className="relative">
            <AuthIntelligenceField activeMode={activeMode} />
          </div>

          {/* Floating Glass Showcase Card */}
          {/* What signing in opens: described, with no figures */}
          <div className="rounded-3xl border border-aurora-line bg-white/90 p-5 shadow-aurora-sm space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-aurora-indigo">What you will find inside</p>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <li className="p-3 rounded-2xl bg-aurora-canvas border border-aurora-line">
                <Brain className="w-4 h-4 text-aurora-violet mb-1.5" aria-hidden="true" />
                <span className="font-bold text-aurora-ink block">Skills from your resume</span>
                <span className="text-aurora-muted">Each one linked to the line it came from.</span>
              </li>
              <li className="p-3 rounded-2xl bg-aurora-canvas border border-aurora-line">
                <Award className="w-4 h-4 text-aurora-violet mb-1.5" aria-hidden="true" />
                <span className="font-bold text-aurora-ink block">Career matches</span>
                <span className="text-aurora-muted">Weighted requirement scores, not hiring predictions.</span>
              </li>
              <li className="p-3 rounded-2xl bg-aurora-canvas border border-aurora-line">
                <CheckCircle2 className="w-4 h-4 text-aurora-violet mb-1.5" aria-hidden="true" />
                <span className="font-bold text-aurora-ink block">A roadmap</span>
                <span className="text-aurora-muted">Next steps for the skills you are missing.</span>
              </li>
            </ul>
            <p className="text-[11px] text-aurora-muted">
              <strong className="text-aurora-ink">Guidance:</strong> an AI provider when one is configured, otherwise built-in rules, labelled as such.
            </p>
          </div>
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
      <footer className="relative z-20 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-aurora-muted border-t border-aurora-line gap-2 ">
        <span>© {new Date().getFullYear()} SkillBridge, a college capstone project</span>
        <span>Scores are explained on each page and are not hiring predictions.</span>
      </footer>
    </AuroraBackground>
  );
};

AuthLayout.displayName = 'AuthLayout';
export default AuthLayout;
