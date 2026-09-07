import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface ParsingStatusProps {
  status: 'pending' | 'processing' | 'completed' | 'failed' | undefined;
  error?: string;
  originalFileName?: string;
}

export const ParsingStatus: React.FC<ParsingStatusProps> = ({
  status,
  error,
  originalFileName
}) => {
  if (!status) return null;

  return (
    <div className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-lg p-6 my-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 text-primary rounded-full">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {originalFileName || 'Resume Document'}
            </h3>

            <div className="flex items-center mt-1 space-x-2">
              {status === 'pending' || status === 'processing' ? (
                <>
                  <Loader2 size={16} className="animate-spin text-primary" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    AI is analyzing your resume... This may take a few moments.
                  </span>
                </>
              ) : status === 'completed' ? (
                <>
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Analysis complete. Skills and experience extracted.
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle size={16} className="text-red-500" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Analysis failed: {error || 'Unknown error during extraction.'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {(status === 'pending' || status === 'processing') && (
        <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div className="bg-primary h-1.5 rounded-full animate-pulse w-full"></div>
        </div>
      )}
    </div>
  );
};
