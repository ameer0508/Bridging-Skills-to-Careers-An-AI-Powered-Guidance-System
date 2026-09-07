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
    <GlassPanel className={`p-8 text-center flex flex-col items-center justify-center border-rose-500/30 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
        <ShieldAlert className="w-7 h-7" />
      </div>

      <div className="max-w-md space-y-2 mb-6">
        <h3 className="font-display text-lg font-bold text-white tracking-tight">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{message}</p>
      </div>

      <div className="flex flex-col items-center gap-3">
        {onRetry && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="py-2.5 px-5 rounded-xl bg-linear-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-rose-950/50 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Operation</span>
          </motion.button>
        )}

        {errorDetails && (
          <div className="mt-2 w-full max-w-sm">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] font-mono text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1 mx-auto"
            >
              <span>{showDetails ? 'Hide Technical Stacktrace' : 'View Technical Stacktrace'}</span>
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showDetails && (
              <pre className="mt-2 p-3 rounded-xl bg-slate-950 border border-white/10 text-[10px] font-mono text-rose-300 text-left overflow-x-auto max-h-32">
                {errorDetails}
              </pre>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  );
};
