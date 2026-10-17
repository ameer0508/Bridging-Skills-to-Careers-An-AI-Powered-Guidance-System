import { AppError } from '../middlewares/errorHandler.js';

/**
 * One local-model generation at a time per user, whatever it is for: a chat reply or an
 * explanation. In process, like the other per-user limits (docs/SECURITY_REVIEW.md), so one account
 * cannot queue several slow local generations and crowd out everyone else; the AI service also has
 * its own global capacity limit.
 */
export type AiGenerationKind = 'chat' | 'explanation';

const inProgress = new Map<string, AiGenerationKind>();

const BUSY_MESSAGE: Record<AiGenerationKind, string> = {
  chat: 'A reply to your previous message is still being written. Please wait for it.',
  explanation: 'An AI explanation for you is still being written. Please wait for it.',
};

/** Refuses (409 REPLY_IN_PROGRESS) while another generation for this user is running. */
export async function withUserAiGeneration<T>(userId: string, kind: AiGenerationKind, work: () => Promise<T>): Promise<T> {
  const holder = inProgress.get(userId);
  if (holder) throw new AppError(BUSY_MESSAGE[holder], 409, 'REPLY_IN_PROGRESS');
  inProgress.set(userId, kind);
  try {
    return await work();
  } finally {
    inProgress.delete(userId);
  }
}
