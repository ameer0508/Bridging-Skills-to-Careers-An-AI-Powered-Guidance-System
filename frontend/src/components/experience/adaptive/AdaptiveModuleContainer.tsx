import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Pin, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

export interface AdaptiveModuleContainerProps {
  id: string;
  title: string;
  isPrioritized?: boolean;
  explanation?: string;
  children: React.ReactNode;
  className?: string;
}

export const AdaptiveModuleContainer: React.FC<AdaptiveModuleContainerProps> = ({
  id,
  title,
  isPrioritized = false,
  explanation,
  children,
  className = '',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  return (
    <motion.div
      layout={!prefersReducedMotion}
      id={id}
      transition={{ duration: 0.3 }}
      className={`relative rounded-2xl transition-all ${
        isPrioritized
          ? 'ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-500/10'
          : 'border border-aurora-line'
      } ${className}`}
    >
      {/* Header Controls Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-aurora-line bg-aurora-canvas/60 rounded-t-2xl">
        <div className="flex items-center gap-2">
          {isPrioritized && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-aurora-violet/[0.06] text-aurora-indigo border border-aurora-violet/25">
              <Sparkles className="w-3 h-3 text-aurora-indigo" />
              Prioritized Focus
            </span>
          )}
          <h3 className="text-sm font-bold text-aurora-ink">{title}</h3>
        </div>

        <div className="flex items-center gap-1 text-xs">
          {explanation && (
            <button
              onClick={() => setShowExplanation((prev) => !prev)}
              className="p-1 rounded text-aurora-muted hover:text-aurora-indigo transition-colors outline-none cursor-pointer"
              title="Why is this prioritized?"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsPinned((prev) => !prev)}
            className={`p-1 rounded transition-colors outline-none cursor-pointer ${
              isPinned ? 'text-aurora-indigo' : 'text-aurora-muted hover:text-aurora-indigo'
            }`}
            title={isPinned ? 'Unpin Module' : 'Pin Module'}
          >
            <Pin className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1 rounded text-aurora-muted hover:text-aurora-indigo transition-colors outline-none cursor-pointer"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Transparent Explanation Tag */}
      {showExplanation && explanation && (
        <div className="p-3 bg-violet-50 border-b border-aurora-line text-xs text-aurora-indigo animate-fade-in flex items-center justify-between">
          <span>{explanation}</span>
        </div>
      )}

      {/* Module Content Area */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdaptiveModuleContainer;
