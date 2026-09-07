import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from '../../components/ErrorBoundary';
import { AIThinkingAnimation } from '../../components/experience';

export interface WorkspaceContainerProps {
  children?: React.ReactNode;
}

export const WorkspaceContainer: React.FC<WorkspaceContainerProps> = ({ children }) => {
  const location = useLocation();

  return (
    <main
      role="main"
      className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-950 text-slate-100 custom-scrollbar flex flex-col min-h-0 relative"
    >
      {/* GLOBAL BACKGROUND LAYER: Aurora mesh + subtle floating glowing orb */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-transparent blur-[120px]" />
        <div className="absolute top-[40%] -right-[15%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-bl from-cyan-600/10 via-indigo-600/10 to-transparent blur-[120px]" />
      </div>

      {/* CONTENT AREA WITH ANIMATED ROUTE TRANSITION */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0">
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <AIThinkingAnimation statusText="Loading Adaptive Workspace..." />
              </div>
            }
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="workspace-content flex-1 w-full"
              >
                {children || <Outlet />}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </ErrorBoundary>
      </div>
    </main>
  );
};

WorkspaceContainer.displayName = 'WorkspaceContainer';
