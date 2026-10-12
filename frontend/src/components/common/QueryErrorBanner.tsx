import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, RotateCw } from 'lucide-react';

/**
 * Shown at the top of every signed-in page when a data request used by that page has failed.
 *
 * Without it a page whose request failed can look like a page with nothing to show: counts and
 * scores sit at zero as if that were the user's real data. The banner says the figures may be
 * incomplete and offers to load them again.
 */
export const QueryErrorBanner: React.FC = () => {
  const queryClient = useQueryClient();
  const [isRetrying, setIsRetrying] = useState(false);

  // The query cache reports every change of every request, often while other components are
  // rendering. The count is therefore re-read shortly afterwards rather than on each event.
  const [failedCount, setFailedCount] = useState(0);
  useEffect(() => {
    const cache = queryClient.getQueryCache();
    // Only requests a mounted component is still waiting on
    const count = () =>
      cache.findAll({ predicate: (query) => query.state.status === 'error' && query.getObserversCount() > 0 }).length;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        setFailedCount(count());
      }, 150);
    };
    schedule();
    const unsubscribe = cache.subscribe(schedule);
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [queryClient]);

  if (failedCount === 0) return null;

  const retry = async () => {
    setIsRetrying(true);
    try {
      await queryClient.refetchQueries({ predicate: (query) => query.state.status === 'error' });
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      role="alert"
      data-testid="load-error-banner"
      className="mb-6 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-white">Some of your data could not be loaded.</p>
          <p className="text-xs text-slate-300">
            Figures on this page may be missing or show zero until it loads. Your saved data is not affected.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={retry}
        disabled={isRetrying}
        className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-100 text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
      >
        <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} aria-hidden="true" />
        <span>{isRetrying ? 'Loading...' : 'Try again'}</span>
      </button>
    </div>
  );
};

export default QueryErrorBanner;
