import React from 'react';

/**
 * Error text in a live region that is always mounted (C3), so screen readers are already
 * watching it when an error appears. Pair with useAnnouncedError.
 */
export const ErrorRegion: React.FC<{ error: string | null; errorId: number; testId?: string }> = ({ error, errorId, testId }) => (
  <div role="alert" aria-atomic="true" className="text-rose-700" data-testid={testId}>
    {error && <p key={errorId}>{error}</p>}
  </div>
);
