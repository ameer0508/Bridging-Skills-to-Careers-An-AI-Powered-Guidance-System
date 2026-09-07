import React from 'react';
import { Sparkles } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface AIThinkingAnimationProps {
  statusText?: string;
  className?: string;
}

export const AIThinkingAnimation: React.FC<AIThinkingAnimationProps> = ({
  statusText = 'AI is analyzing...',
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={`flex flex-col items-center justify-center p-6 gap-4 ${className}`}>
      {/* Animated Orb Center */}
      <div className="relative flex items-center justify-center w-16 h-16">
        <div
          aria-hidden="true"
          className={`absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-sky-400 opacity-75 filter blur-md ${
            prefersReducedMotion ? '' : 'animate-[sb-glow-pulse_3s_ease-in-out_infinite]'
          }`}
        />
        <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-neutral-900 border border-indigo-500/30 text-indigo-400 shadow-inner">
          <Sparkles className={`w-6 h-6 ${prefersReducedMotion ? '' : 'animate-pulse'}`} />
        </div>
      </div>

      {/* Status Label */}
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
        <span>{statusText}</span>
      </div>
    </div>
  );
};

export default AIThinkingAnimation;
