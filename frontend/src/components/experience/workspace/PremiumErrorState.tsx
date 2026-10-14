import React, { useState } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { friendlyErrorMessage } from './errorMessages';

export interface PremiumErrorStateProps {
  title?: string;
  message?: string;
  errorDetails?: string;
  onRetry?: () => void;
  className?: string;
}

export const PremiumErrorState: React.FC<PremiumErrorStateProps> = ({
  title = 'This page could not be loaded',
  message = 'Something went wrong while loading your data. Your saved data is not affected.',
  errorDetails,
  onRetry,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const text = friendlyErrorMessage(message);
  // A technical message that was rewritten stays available under "Technical details"
  const details = errorDetails ?? (text !== message ? message : undefined);

  return (
    <div role="alert" className={`flex flex-col items-center justify-center rounded-[28px] border border-rose-200 bg-white p-6 text-center shadow-aurora-sm sm:p-8 ${className}`}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700" aria-hidden="true">
        <AlertTriangle className="h-6 w-6" />
      </div>

      <div className="mb-5 max-w-md space-y-2">
        <h3 className="font-display text-lg font-bold tracking-tight text-aurora-ink">{title}</h3>
        <p className="text-sm leading-relaxed text-aurora-muted">{text}</p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-aurora-violet px-5 py-2 text-sm font-semibold text-white shadow-aurora-sm transition-colors hover:bg-aurora-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet focus-visible:ring-offset-2"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      )}

      {details && (
        <div className="mt-4 w-full max-w-sm">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
            className="mx-auto flex items-center justify-center gap-1 text-xs text-aurora-muted hover:text-aurora-ink"
          >
            <span>{showDetails ? 'Hide technical details' : 'Technical details'}</span>
            {showDetails ? <ChevronUp className="h-3 w-3" aria-hidden="true" /> : <ChevronDown className="h-3 w-3" aria-hidden="true" />}
          </button>
          {showDetails && (
            <pre className="mt-2 max-h-32 overflow-x-auto rounded-xl border border-aurora-line bg-aurora-canvas p-3 text-left text-[11px] text-rose-700">{details}</pre>
          )}
        </div>
      )}
    </div>
  );
};
