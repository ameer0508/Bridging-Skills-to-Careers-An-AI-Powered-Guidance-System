import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { AIExplanation, type ExplanationSubject, type IAIExplanation } from '../../models/AIExplanation.js';
import AIClientService, { AiUnavailableError } from '../AIClientService.js';
import { withUserAiGeneration } from '../aiGenerationLock.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { localAiExplanationsEnabled } from '../../config/aiFeatures.js';

/**
 * Local-AI explanations of a user's deterministic results (docs/AI_EXPLANATIONS.md), one service for
 * every subject: career match, readiness, skill gaps and the next-best action.
 *
 * Each subject registers how to build its fact sheet from the signed-in user's own stored records;
 * nothing from the request body is ever used. An explanation is cached per user, subject and career
 * together with the hash of those facts, reused while the result is unchanged and shown as out of
 * date once it changes. Reading never calls the model. A generation takes the user's single
 * local-AI slot, shared with chat, and identical simultaneous requests share one generation.
 *
 * Two kinds of text, kept apart:
 *  - a verified summary, written by fixed templates from the facts (no model). Always available for
 *    the subjects that define one, and the authoritative wording;
 *  - optional local-AI wording, only while ENABLE_LOCAL_AI_EXPLANATIONS is on (config/aiFeatures.ts).
 *    While it is off nothing is generated and no saved AI text is returned.
 */

export interface ExplanationDto {
  text: string;
  provider: string;
  model: string;
  generatedAt: string;
  stale: boolean;
  facts: Record<string, unknown>;
  usage: { promptTokens: number; completionTokens: number; source: string };
  latencyMs: number;
}

/** Text written by fixed templates from the verified facts; attributed to SkillBridge's rules, never to AI. */
export interface VerifiedSummary {
  source: 'skillbridge_rules';
  sentences: string[];
  /** An ordered list shown under the sentences (e.g. gaps in priority order), when the subject has one */
  items: string[];
}

export interface SubjectDefinition {
  /** Path under the AI service's /api/v1/explain/ */
  aiPath: string;
  /** Part of the hash: a change to how facts are built makes saved explanations out of date */
  factsVersion: string;
  /** Raised when the user has no such record for this career */
  notFound: { message: string; code: string };
  /** Shown when the record exists but holds nothing to explain */
  noEvidenceMessage: string;
  /** The fact sheet from the user's own records, or null when there is nothing to explain. Throws notFound. */
  build(userId: mongoose.Types.ObjectId, careerId: mongoose.Types.ObjectId): Promise<Record<string, unknown> | null>;
  /** The verified summary of the facts, for subjects that have one */
  summarize?(facts: Record<string, unknown>): Omit<VerifiedSummary, 'source'>;
}

/** JSON with object keys sorted at every level, so equal facts always give the same hash. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function hashFacts(facts: unknown, version: string): string {
  return crypto.createHash('sha256').update(`${version}\n${stableStringify(facts)}`).digest('hex');
}

// The AI service accepts exactly these characters in names (ai/app/schemas/explanation.py)
const UNSAFE_CHARS = /[^A-Za-z0-9 .,+#/&()'-]/g;
export const cleanName = (value: string): string => value.replace(UNSAFE_CHARS, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

const subjects = new Map<ExplanationSubject, SubjectDefinition>();
// Generations running now, by user, subject, career and facts: a second identical request joins the first
const inFlight = new Map<string, Promise<ExplanationDto>>();

class ExplanationService {
  register(subject: ExplanationSubject, definition: SubjectDefinition): void {
    subjects.set(subject, definition);
  }

  /**
   * The verified summary of the current facts, whether AI wording is enabled, and the saved AI
   * explanation (only while it is enabled) with whether it still matches. Never calls the model.
   */
  async get(subject: ExplanationSubject, userId: string, careerId: string): Promise<{
    explanation: ExplanationDto | null;
    aiEnabled: boolean;
    summary: (VerifiedSummary & { facts: Record<string, unknown> }) | null;
  }> {
    const definition = this.definition(subject);
    const { facts, factsHash, uid, cid } = await this.current(subject, userId, careerId);
    const aiEnabled = localAiExplanationsEnabled();
    // Disabled means disabled: a previously saved AI text is not returned either
    const saved = aiEnabled ? await AIExplanation.findOne({ userId: uid, subject, careerId: cid }).lean<IAIExplanation>() : null;
    const summary = facts && definition.summarize ? { source: 'skillbridge_rules' as const, ...definition.summarize(facts), facts } : null;
    return { explanation: saved ? toDto(saved, saved.factsHash !== factsHash || !facts) : null, aiEnabled, summary };
  }

  /** Returns the saved explanation if it is current; otherwise has the local model write one. */
  async generate(subject: ExplanationSubject, userId: string, careerId: string): Promise<{ explanation: ExplanationDto; cached: boolean }> {
    const definition = this.definition(subject);
    // Ownership first (another user's career is simply not found), then the feature flag
    const { facts, factsHash, uid, cid } = await this.current(subject, userId, careerId);
    if (!localAiExplanationsEnabled()) {
      throw new AppError('Local AI wording of explanations is turned off on this server.', 403, 'AI_EXPLANATIONS_DISABLED');
    }
    if (!facts) throw new AppError(definition.noEvidenceMessage, 422, 'NO_EVIDENCE');
    const saved = await AIExplanation.findOne({ userId: uid, subject, careerId: cid }).lean<IAIExplanation>();
    if (saved && saved.factsHash === factsHash) return { explanation: toDto(saved, false), cached: true };

    const key = `${userId}:${subject}:${careerId}:${factsHash}`;
    const running = inFlight.get(key);
    if (running) return { explanation: await running, cached: false };

    const work = withUserAiGeneration(userId, 'explanation', async () => {
      let reply;
      try {
        reply = await AIClientService.explainFacts(definition.aiPath, facts);
      } catch (error) {
        throw toAppError(error);
      }
      const doc = await AIExplanation.findOneAndUpdate(
        { userId: uid, subject, careerId: cid },
        {
          $set: {
            factsHash,
            facts,
            text: reply.text,
            aiProvider: reply.provider,
            aiModel: reply.model,
            promptVersion: reply.promptVersion,
            latencyMs: reply.latencyMs,
            usage: reply.usage,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean<IAIExplanation>();
      return toDto(doc!, false);
    });
    inFlight.set(key, work);
    try {
      return { explanation: await work, cached: false };
    } finally {
      inFlight.delete(key);
    }
  }

  private definition(subject: ExplanationSubject): SubjectDefinition {
    const definition = subjects.get(subject);
    if (!definition) throw new AppError('Unknown explanation subject.', 404, 'NOT_FOUND');
    return definition;
  }

  private async current(subject: ExplanationSubject, userId: string, careerId: string) {
    const definition = this.definition(subject);
    if (!mongoose.Types.ObjectId.isValid(careerId)) throw new AppError(definition.notFound.message, 404, definition.notFound.code);
    const uid = new mongoose.Types.ObjectId(userId);
    const cid = new mongoose.Types.ObjectId(careerId);
    // Builders look up records by this user id only: another user's career finds nothing
    const facts = await definition.build(uid, cid);
    return { facts, factsHash: facts ? hashFacts(facts, definition.factsVersion) : '', uid, cid };
  }
}

function toDto(doc: IAIExplanation, stale: boolean): ExplanationDto {
  return {
    text: doc.text,
    provider: doc.aiProvider,
    model: doc.aiModel,
    generatedAt: new Date(doc.updatedAt || doc.createdAt).toISOString(),
    stale,
    facts: doc.facts,
    usage: doc.usage,
    latencyMs: doc.latencyMs,
  };
}

function toAppError(error: unknown): AppError {
  const reason = error instanceof AiUnavailableError ? error.reason : 'error';
  switch (reason) {
    case 'busy':
      return new AppError('The local AI is busy with other requests. Try again in a minute.', 503, 'AI_BUSY');
    case 'timeout':
      return new AppError('The local AI did not answer in time.', 504, 'AI_TIMEOUT');
    case 'rejected':
      return new AppError("The local AI's explanation did not agree with your verified results, so it was not shown.", 422, 'EXPLANATION_REJECTED');
    case 'unavailable':
      return new AppError('The local AI is not available right now.', 503, 'AI_UNAVAILABLE');
    default:
      return new AppError('The local AI could not write an explanation.', 502, 'AI_ERROR');
  }
}

export default new ExplanationService();
