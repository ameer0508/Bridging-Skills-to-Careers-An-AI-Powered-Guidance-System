/**
 * Rewrites a raw HTTP client message ("…: Request failed with status code 429") into words a
 * student can act on. Messages that are already written for people pass through unchanged.
 */
export function friendlyErrorMessage(message: string): string {
  const status = Number(message.match(/status code (\d{3})/)?.[1]);
  if (status === 429) return 'Too many requests were sent in a short time. Wait a minute, then try again.';
  if (status === 401 || status === 403) return 'Your session has ended or you do not have access. Sign in again to continue.';
  if (status === 404) return 'This information was not found. It may have been removed.';
  if (status >= 500) return 'The server had a problem answering. Your saved data is not affected; try again in a moment.';
  if (/Network Error|timeout|ECONNREFUSED/i.test(message)) return 'The server could not be reached. Check that SkillBridge is running, then try again.';
  return message;
}
