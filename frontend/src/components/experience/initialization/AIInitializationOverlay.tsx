import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';
import { useExperience } from '../../../contexts/ExperienceContext';
import { useAuthStore } from '../../../store/authStore';
import { AuroraBackground } from '../backgrounds/AuroraBackground';
import { LightingSurface } from '../lighting/LightingSurface';
import { AIThinkingAnimation } from '../loading/AIThinkingAnimation';
import { ProgressLoader } from '../loading/ProgressLoader';
import { TypingHeadline } from '../typography/TypingHeadline';

export const AIInitializationOverlay: React.FC = () => {
  const { initializationState, setInitializationState } = useExperience();

  const { user, isAuthenticated } = useAuthStore();
  const [progress, setProgress] = useState<number>(0);
  const [hasCompletedOnce, setHasCompletedOnce] = useState<boolean>(false);

  useEffect(() => {
    // If not authenticated or already completed initialization once in session, set to ready
    if (!isAuthenticated) {
      setInitializationState('idle');
      return;
    }

    if (hasCompletedOnce || initializationState === 'ready') {
      return;
    }

    // Step 1: Authenticating (0 - 25%)
    setInitializationState('authenticating');
    setProgress(25);

    const t1 = setTimeout(() => {
      // Step 2: Initializing (25 - 60%)
      setInitializationState('initializing');
      setProgress(60);
    }, 600);

    const t2 = setTimeout(() => {
      // Step 3: Context Activating (60 - 90%)
      setInitializationState('context_activating');
      setProgress(90);
    }, 1300);

    const t3 = setTimeout(() => {
      // Step 4: Ready (100%)
      setProgress(100);
      setInitializationState('ready');
      setHasCompletedOnce(true);
    }, 1900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, hasCompletedOnce, setInitializationState]);

  const isVisible = isAuthenticated && initializationState !== 'ready' && !hasCompletedOnce;

  const getStepInfo = () => {
    switch (initializationState) {
      case 'authenticating':
        return {
          icon: <ShieldCheck className="w-5 h-5 text-aurora-indigo" />,
          title: 'Verifying Security Tokens',
          subtext: 'Establishing encrypted session for ' + (user?.fullName || 'User'),
        };
      case 'initializing':
        return {
          icon: <Cpu className="w-5 h-5 text-aurora-violet" />,
          title: 'Initializing AI Models',
          subtext: 'Loading skill graph taxonomy & profile metrics',
        };
      case 'context_activating':
        return {
          icon: <Sparkles className="w-5 h-5 text-sky-800" />,
          title: 'Activating Intelligence Engine',
          subtext: 'Synthesizing career recommendations & learning roadmaps',
        };
      case 'ready':
      default:
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-700" />,
          title: 'Workspace Active',
          subtext: 'Welcome to SkillBridge Operating System',
        };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-aurora-canvas/60 text-aurora-ink overflow-hidden select-none"
        >
          <AuroraBackground className="absolute inset-0">
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
              <LightingSurface
                profile="commandCenterGlow"
                className="w-full max-w-lg p-8 rounded-2xl bg-aurora-canvas/60 backdrop-blur-xl border border-aurora-line shadow-2xl"
              >
                {/* Header Brand Badge */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-aurora-line">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-aurora-indigo">
                      SkillBridge OS v1.0
                    </span>
                  </div>
                  <span className="text-xs text-aurora-muted">
                    {Math.round(progress)}%
                  </span>
                </div>

                {/* AI Center Neural Pulse */}
                <AIThinkingAnimation
                  statusText={stepInfo.title}
                  className="py-2"
                />

                {/* Dynamic Subtext */}
                <div className="text-center my-4">
                  <TypingHeadline
                    phrases={[stepInfo.subtext]}
                    className="text-sm font-medium text-aurora-muted"
                  />
                </div>

                {/* Progress Bar */}
                <div className="mt-6 mb-4">
                  <ProgressLoader progress={progress} height={6} />
                </div>

                {/* Stage Indicators */}
                <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-aurora-line text-center">
                  <div
                    className={`p-2 rounded-lg transition-all ${
                      initializationState === 'authenticating'
                        ? 'bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25'
                        : 'text-aurora-muted'
                    }`}
                  >
                    <span className="block text-[10px] uppercase">01. Auth</span>
                  </div>
                  <div
                    className={`p-2 rounded-lg transition-all ${
                      initializationState === 'initializing'
                        ? 'bg-violet-50 text-aurora-violet border border-purple-500/40'
                        : 'text-aurora-muted'
                    }`}
                  >
                    <span className="block text-[10px] uppercase">02. Taxonomy</span>
                  </div>
                  <div
                    className={`p-2 rounded-lg transition-all ${
                      initializationState === 'context_activating'
                        ? 'bg-sky-50 text-sky-800 border border-sky-500/40'
                        : 'text-aurora-muted'
                    }`}
                  >
                    <span className="block text-[10px] uppercase">03. AI Sync</span>
                  </div>
                </div>
              </LightingSurface>
            </div>
          </AuroraBackground>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIInitializationOverlay;
