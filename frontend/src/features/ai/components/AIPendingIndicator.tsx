import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { formatElapsed } from './formatElapsed';

/**
 * Shown only while a local-AI request (a chat reply or an explanation) is actually pending; the parent removes it as soon as the
 * request succeeds, fails or is abandoned, which also stops the clock. It reports elapsed time
 * only: the server sends no progress, so none is invented. The local model on this hardware can
 * take 40-90 seconds, so no fixed promise is made.
 */
export const AIPendingIndicator: React.FC<{ testId?: string }> = ({ testId = 'chat-pending' }) => {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = Math.floor((now - startedAt) / 1000);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-aurora-muted" data-testid={testId}>
      <RefreshCw className="w-4 h-4 animate-spin text-aurora-violet" aria-hidden="true" />
      {/* Announced once when it appears; the clock below is not re-announced every second */}
      <span role="status" aria-live="polite">
        AI is thinking... Running locally. Responses may take longer depending on system load.
      </span>
      <span className="tabular-nums" aria-hidden="true" data-testid={`${testId}-elapsed`} data-seconds={elapsed}>
        {formatElapsed(elapsed)}
      </span>
    </div>
  );
};

export default AIPendingIndicator;
