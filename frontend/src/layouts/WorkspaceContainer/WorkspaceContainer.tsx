import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import ErrorBoundary from '../../components/ErrorBoundary';
import { AIThinkingAnimation } from '../../components/experience';
import { QueryErrorBanner } from '../../components/common/QueryErrorBanner';
import { isAuroraRoute } from '../../design/aurora/routes';

export interface WorkspaceContainerProps {
  children?: React.ReactNode;
}

/**
 * The scrolling content area and the route-level theme boundary. Redesigned (Aurora) routes sit
 * directly on the light canvas; every other route renders inside one dark container
 * (`.sb-legacy-dark`) with its original colours, so no dark page inherits light text and no
 * light page inherits dark tokens. The dark container goes away as screen groups are migrated.
 */
export const WorkspaceContainer: React.FC<WorkspaceContainerProps> = ({ children }) => {
  const location = useLocation();
  const reduce = useReducedMotion();
  const aurora = isAuroraRoute(location.pathname);

  const loading = (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
      <AIThinkingAnimation statusText="Loading..." />
    </div>
  );

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
          {aurora ? (
            <div className="sb-aurora flex flex-1 flex-col text-aurora-ink" data-theme-boundary="aurora">
              <ErrorBoundary>
                <Suspense fallback={loading}>
                  <div className="px-4 pt-4 empty:hidden sm:px-6">
                    <QueryErrorBanner />
                  </div>
                  <div className="workspace-content w-full flex-1">{children || <Outlet />}</div>
                </Suspense>
              </ErrorBoundary>
            </div>
          ) : (
            <div className="flex flex-1 flex-col p-2 sm:p-4">
              <div
                className="sb-legacy-dark relative isolate flex flex-1 flex-col overflow-hidden rounded-[24px] bg-slate-950 text-slate-100 shadow-aurora-md ring-1 ring-aurora-line"
                data-theme-boundary="legacy-dark"
              >
                {/* The earlier ambient glow, now kept inside the dark container */}
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
                  <div className="absolute -left-[10%] -top-[20%] h-[50vw] w-[50vw] rounded-full bg-gradient-to-br from-indigo-600/10 via-purple-600/10 to-transparent blur-[120px]" />
                  <div className="absolute -right-[15%] top-[40%] h-[45vw] w-[45vw] rounded-full bg-gradient-to-bl from-cyan-600/10 via-indigo-600/10 to-transparent blur-[120px]" />
                </div>
                <ErrorBoundary>
                  <Suspense fallback={loading}>
                    <div className="px-4 pt-4 empty:hidden">
                      <QueryErrorBanner />
                    </div>
                    <div className="workspace-content w-full flex-1">{children || <Outlet />}</div>
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
};

WorkspaceContainer.displayName = 'WorkspaceContainer';
