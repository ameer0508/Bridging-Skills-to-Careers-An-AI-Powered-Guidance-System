import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HeroStateMachine, HeroState } from './HeroStateMachine';
import { HeroRevealTimeline } from './HeroRevealTimeline';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface HeroOrchestratorProps {
  children: React.ReactNode;
  onReady?: () => void;
  className?: string;
}

export const HeroOrchestrator: React.FC<HeroOrchestratorProps> = ({
  children,
  onReady,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [currentState, setCurrentState] = useState<HeroState>('idle');

  useEffect(() => {
    if (prefersReducedMotion) {
      setCurrentState('interactive_ready');
      onReady?.();
      return;
    }

    const stateMachine = new HeroStateMachine({
      onStateChange: (state) => {
        setCurrentState(state);
        if (state === 'interactive_ready') {
          onReady?.();
        }
      },
    });

    stateMachine.transitionTo('background_settling');

    const t1 = setTimeout(() => stateMachine.transitionTo('greeting_reveal'), HeroRevealTimeline.greetingRevealDelay * 1000);
    const t2 = setTimeout(() => stateMachine.transitionTo('briefing_typing'), HeroRevealTimeline.briefingTypingDelay * 1000);
    const t3 = setTimeout(() => stateMachine.transitionTo('mission_reveal'), HeroRevealTimeline.missionRevealDelay * 1000);
    const t4 = setTimeout(() => stateMachine.transitionTo('progress_ring_reveal'), HeroRevealTimeline.progressRingRevealDelay * 1000);
    const t5 = setTimeout(() => stateMachine.transitionTo('interactive_ready'), HeroRevealTimeline.totalDuration * 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [prefersReducedMotion, onReady]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`relative w-full ${className}`}
      data-hero-state={currentState}
    >
      {children}
    </motion.div>
  );
};

export default HeroOrchestrator;
