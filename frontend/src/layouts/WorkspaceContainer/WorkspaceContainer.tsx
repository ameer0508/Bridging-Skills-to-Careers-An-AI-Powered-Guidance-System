import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import ErrorBoundary from '../../components/ErrorBoundary';
import { QueryErrorBanner } from '../../components/common/QueryErrorBanner';
import { PageSkeleton } from '../../design/aurora/kit';

export interface WorkspaceContainerProps {
  children?: React.ReactNode;
}

/** The scrolling content area: every route renders on the light Aurora Elite canvas. */
export const WorkspaceContainer: React.FC<WorkspaceContainerProps> = ({ children }) => {
  const location = useLocation();
  const reduce = useReducedMotion();

  return (
    <main id="main-content" tabIndex={-1} role="main" className="aurora-scroll relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-aurora-canvas">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="sb-aurora flex flex-1 flex-col text-aurora-ink">
            <ErrorBoundary>
              <Suspense fallback={<PageSkeleton label="Loading" />}>
                <div className="px-4 pt-4 empty:hidden sm:px-6">
                  <QueryErrorBanner />
                </div>
                <div className="workspace-content w-full flex-1">{children || <Outlet />}</div>
              </Suspense>
            </ErrorBoundary>
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
};

WorkspaceContainer.displayName = 'WorkspaceContainer';
