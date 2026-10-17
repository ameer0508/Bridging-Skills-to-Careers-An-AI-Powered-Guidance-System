import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { CareerMatch } from '../../models/CareerMatch.js';
import { AIExplanation, type IAIExplanation } from '../../models/AIExplanation.js';
import AIClientService, {
  AiUnavailableError,
  type CareerMatchExplanationFacts,
  type ExplanationStatusCounts,
} from '../AIClientService.js';
import { withUserAiGeneration } from '../aiGenerationLock.js';
import { AppError } from '../../middlewares/errorHandler.js';

/**
 * Local-AI explanations of a user's career-match result (Phase 1 of docs/AI_EXPLANATIONS.md).
 *
 * The stored match is the source of truth. The facts sent to the model are built here, on the
 * server, from that record only: nothing from the request body is used. The explanation is cached
 * per user and career together with the hash of those facts, so it is reused while the match is
 * unchanged and shown as out of date once it changes. Reading never calls the model.
 */

// Part of the hash: a change to how facts are built makes every saved explanation out of date
const FACTS_VERSION = 'career-match-facts-v1';
const MAX_REQUIREMENTS = 40;
const TOP_MISSING = 5;
const IMPORTANCE_ORDER = { required: 0, preferred: 1, supporting: 2 } as const;
// The AI service accepts exactly these characters in names (ai/app/schemas/explanation.py)
const UNSAFE_CHARS = /[^A-Za-z0-9 .,+#/&()'-]/g;

type Importance = keyof typeof IMPORTANCE_ORDER;
type Status = 'applied' | 'listed' | 'inferred' | 'missing';

export interface ExplanationDto {
  text: string;
  provider: string;
  model: string;
  generatedAt: string;
  stale: boolean;
  facts: CareerMatchExplanationFacts;
  usage: { promptTokens: number; completionTokens: number; source: string };
  latencyMs: number;
}

interface BreakdownRow {
  skillName: string;
  importance: string;
  status: string;
  pointsPossible?: number;
}

const cleanName = (value: string): string => value.replace(UNSAFE_CHARS, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

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

export function hashFacts(facts: CareerMatchExplanationFacts): string {
  return crypto.createHash('sha256').update(`${FACTS_VERSION}\n${stableStringify(facts)}`).digest('hex');
}

/**
 * The minimal fact sheet for one match: exact score, evidence share, each requirement's importance
 * and status, the counts by importance and the missing requirements with the most points at stake.
 * Returns null when the match has no requirement breakdown to explain.
 */
export function buildCareerMatchFacts(
  match: { matchScore: number; confidence: number; breakdown?: BreakdownRow[] },
  careerTitle: string
): CareerMatchExplanationFacts | null {
  const rows = (match.breakdown || [])
    .filter(r => r && typeof r.skillName === 'string' && r.importance in IMPORTANCE_ORDER)
    .map(r => ({
      skill: cleanName(r.skillName),
      importance: r.importance as Importance,
      status: (['applied', 'listed', 'inferred'].includes(r.status) ? r.status : 'missing') as Status,
      points: Number(r.pointsPossible) || 0,
    }))
    .filter(r => r.skill.length > 0);
  if (rows.length === 0 || rows.length > MAX_REQUIREMENTS) return null;

  rows.sort((a, b) =>
    IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance] || b.points - a.points || a.skill.localeCompare(b.skill));

  const counts = (importance: Importance): ExplanationStatusCounts => {
    const group = rows.filter(r => r.importance === importance);
    return {
      total: group.length,
      applied: group.filter(r => r.status === 'applied').length,
      listed: group.filter(r => r.status === 'listed').length,
      inferred: group.filter(r => r.status === 'inferred').length,
      missing: group.filter(r => r.status === 'missing').length,
    };
  };

  return {
    career_title: cleanName(careerTitle) || 'this career',
    match_score: Math.round(match.matchScore),
    evidence_share_percent: Math.round(match.confidence),
    requirements: rows.map(({ skill, importance, status }) => ({ skill, importance, status })),
    required: counts('required'),
    preferred: counts('preferred'),
    supporting: counts('supporting'),
    top_missing: rows.filter(r => r.status === 'missing').slice(0, TOP_MISSING).map(r => r.skill),
  };
}

// Generations running now, by user, career and facts: a second identical request joins the first
const inFlight = new Map<string, Promise<ExplanationDto>>();

class CareerMatchExplanationService {
  /** The saved explanation, if any, and whether it still matches the current result. Never calls the model. */
  async get(userId: string, careerId: string): Promise<{ explanation: ExplanationDto | null }> {
    const { facts, factsHash, uid, cid } = await this.currentFacts(userId, careerId);
    const saved = await AIExplanation.findOne({ userId: uid, subject: 'career_match', careerId: cid }).lean<IAIExplanation>();
    return { explanation: saved ? toDto(saved, saved.factsHash !== factsHash || !facts) : null };
  }

  /** Returns the saved explanation if it is current; otherwise has the local model write one. */
  async generate(userId: string, careerId: string): Promise<{ explanation: ExplanationDto; cached: boolean }> {
    const { facts, factsHash, uid, cid } = await this.currentFacts(userId, careerId);
    if (!facts) {
      throw new AppError('This match has no requirement-by-requirement evidence to explain yet.', 422, 'NO_EVIDENCE');
    }
    const saved = await AIExplanation.findOne({ userId: uid, subject: 'career_match', careerId: cid }).lean<IAIExplanation>();
    if (saved && saved.factsHash === factsHash) return { explanation: toDto(saved, false), cached: true };

    const key = `${userId}:career_match:${careerId}:${factsHash}`;
    const running = inFlight.get(key);
    if (running) return { explanation: await running, cached: false };

    const work = withUserAiGeneration(userId, 'explanation', async () => {
      let reply;
      try {
        reply = await AIClientService.explainCareerMatch(facts);
      } catch (error) {
        throw toAppError(error);
      }
      const doc = await AIExplanation.findOneAndUpdate(
        { userId: uid, subject: 'career_match', careerId: cid },
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

  private async currentFacts(userId: string, careerId: string) {
    if (!mongoose.Types.ObjectId.isValid(careerId)) throw new AppError('Career match not found.', 404, 'MATCH_NOT_FOUND');
    const uid = new mongoose.Types.ObjectId(userId);
    const cid = new mongoose.Types.ObjectId(careerId);
    // Only the signed-in user's own match: another user's id simply finds nothing
    const match = await CareerMatch.findOne({ userId: uid, careerId: cid })
      .populate<{ careerId: { title?: string } }>('careerId', 'title')
      .lean();
    if (!match) throw new AppError('Career match not found.', 404, 'MATCH_NOT_FOUND');
    const facts = buildCareerMatchFacts(match as unknown as { matchScore: number; confidence: number; breakdown?: BreakdownRow[] },
      match.careerId?.title || '');
    return { facts, factsHash: facts ? hashFacts(facts) : '', uid, cid };
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

export default new CareerMatchExplanationService();
