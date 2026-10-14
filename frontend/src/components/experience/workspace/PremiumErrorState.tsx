import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

export interface PremiumErrorStateProps {
  title?: string;
  message?: string;
  errorDetails?: string;
  onRetry?: () => void;
  className?: string;
}

export const PremiumErrorState: React.FC<PremiumErrorStateProps> = ({
  title = 'Unable to Load AI Workspace Data',
  message = 'An unexpected network or service error occurred while retrieving telemetry. Please try refreshing.',
  errorDetails,
  onRetry,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <GlassPanel className={`p-8 text-center flex flex-col items-center justify-center border-rose-200 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 mb-4">
        <ShieldAlert className="w-7 h-7" />
      </div>

      <div className="max-w-md space-y-2 mb-6">
        <h3 className="font-display text-lg font-bold text-aurora-ink tracking-tight">{title}</h3>
        <p className="text-xs sm:text-sm text-aurora-muted leading-relaxed">{message}</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        {onRetry && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="py-2.5 px-5 rounded-xl bg-linear-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-xs font-bold text-aurora-ink shadow-lg shadow-rose-950/50 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Operation</span>
          </motion.button>
        )}

        {errorDetails && (
          <div className="mt-2 w-full max-w-sm">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] text-aurora-muted hover:text-aurora-ink flex items-center justify-center gap-1 mx-auto"
            >
              <span>{showDetails ? 'Hide Technical Stacktrace' : 'View Technical Stacktrace'}</span>
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showDetails && (
              <pre className="mt-2 p-3 rounded-xl bg-aurora-canvas border border-aurora-line text-[10px] text-rose-700 text-left overflow-x-auto max-h-32">
                {errorDetails}
              </pre>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  );
};
