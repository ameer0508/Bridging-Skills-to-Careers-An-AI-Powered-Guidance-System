import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIThinkingAnimation from './AIThinkingAnimation';

export interface GlassLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

export const GlassLoadingOverlay: React.FC<GlassLoadingOverlayProps> = ({
  isLoading,
  message = 'Loading data...',
  className = '',
}) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`absolute inset-0 z-40 flex items-center justify-center backdrop-blur-md bg-white/60 dark:bg-neutral-950/60 rounded-xl ${className}`}
        >
          <AIThinkingAnimation statusText={message} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlassLoadingOverlay;
