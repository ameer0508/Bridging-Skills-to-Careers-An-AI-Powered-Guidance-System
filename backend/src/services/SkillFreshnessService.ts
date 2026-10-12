import mongoose from 'mongoose';
import { UserSkill, type IEvidence, type IUserSkill } from '../models/UserSkill.js';
import { monthsBetween } from '../utils/periods.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * How recently each skill was last shown to be in use.
 *
 * Only dated evidence counts: the end date of a role the skill was used in, a confirmation by
 * the user, or an assessment. A skill with no dated evidence is reported as "undated", not
 * assumed to be current or stale.
 *
 * Freshness is information for the user. It does not lower the match or readiness scores; the
 * thresholds are a stated policy, not a measured rate at which skills are forgotten.
 */
export const FRESHNESS_POLICY = {
  /** Up to this many months since last use: current. */
  currentWithinMonths: 18,
  /** Up to this many months: ageing. Beyond it: stale. */
  agingWithinMonths: 36
} as const;

export type FreshnessStatus = 'current' | 'aging' | 'stale' | 'undated';

export interface SkillFreshness {
  userSkillId: string;
  name: string;
  category: string;
  evidenceScore: number;
  status: FreshnessStatus;
  lastEvidencedAt: Date | null;
  monthsSinceLastUse: number | null;
  /** What the most recent dated evidence was. */
  basis: string | null;
  /** How far that evidence was checked: stated in a resume, confirmed by the user, or assessed. */
  verification: IEvidence['verification'] | null;
  revalidationSuggested: boolean;
}

export function freshnessOf(evidences: IEvidence[], now: Date = new Date()) {
  const dated = evidences.filter(e => e.observedAt).sort((a, b) => new Date(b.observedAt!).getTime() - new Date(a.observedAt!).getTime());
  const latest = dated[0];
  if (!latest) {
    return { status: 'undated' as FreshnessStatus, lastEvidencedAt: null, monthsSinceLastUse: null, basis: null, verification: null };
  }
  const last = new Date(latest.observedAt!);
  const months = latest.ongoing ? 0 : monthsBetween(last, now);
  const status: FreshnessStatus =
    months <= FRESHNESS_POLICY.currentWithinMonths ? 'current' : months <= FRESHNESS_POLICY.agingWithinMonths ? 'aging' : 'stale';
  return { status, lastEvidencedAt: last, monthsSinceLastUse: months, basis: latest.description, verification: latest.verification ?? null };
}

class SkillFreshnessService {
  public async list(userId: string) {
    const docs = await UserSkill.find({ userId: new mongoose.Types.ObjectId(userId) }).populate('skillId');
    const now = new Date();
    const skills: SkillFreshness[] = docs
      .map(doc => this.describe(doc, now))
      .filter((s): s is SkillFreshness => s !== null)
      .sort((a, b) => {
        const order: Record<FreshnessStatus, number> = { stale: 0, aging: 1, undated: 2, current: 3 };
        return order[a.status] - order[b.status] || b.evidenceScore - a.evidenceScore || a.name.localeCompare(b.name);
      });
    const count = (status: FreshnessStatus) => skills.filter(s => s.status === status).length;
    return {
      skills,
      summary: { total: skills.length, current: count('current'), aging: count('aging'), stale: count('stale'), undated: count('undated') },
      policy: FRESHNESS_POLICY,
      note: 'Freshness comes from dated evidence only and does not change your scores. "Undated" means the resume gave no date for when the skill was last used.'
    };
  }

  /**
   * Records the user's own confirmation that they have used a skill recently. It is stored as
   * self-attested evidence dated today: it updates freshness, adds no points to the evidence
   * score, and is shown as unverified.
   */
  public async revalidate(userId: string, userSkillId: string, note?: string) {
    if (!mongoose.Types.ObjectId.isValid(userSkillId)) throw new AppError('Skill not found.', 404, 'SKILL_NOT_FOUND');
    const doc = await UserSkill.findOne({ _id: new mongoose.Types.ObjectId(userSkillId), userId: new mongoose.Types.ObjectId(userId) }).populate('skillId');
    if (!doc) throw new AppError('Skill not found.', 404, 'SKILL_NOT_FOUND');

    const now = new Date();
    const cleanNote = (note || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
    doc.evidences.push({
      sourceType: 'self_attested',
      description: cleanNote ? `Confirmed by you: ${cleanNote}` : 'Confirmed by you as recently used',
      weight: 0,
      points: 0,
      observedAt: now,
      verification: 'self_attested',
      recordedAt: now
    });
    await doc.save();
    return this.describe(doc, now)!;
  }

  private describe(doc: IUserSkill, now: Date): SkillFreshness | null {
    const skill = doc.skillId as unknown as { canonicalName?: string } | null;
    if (!skill?.canonicalName) return null;
    const freshness = freshnessOf(doc.evidences, now);
    return {
      userSkillId: doc._id.toString(),
      name: skill.canonicalName,
      category: doc.category,
      evidenceScore: doc.evidenceScore,
      ...freshness,
      revalidationSuggested: freshness.status === 'stale' || freshness.status === 'aging'
    };
  }
}

export default new SkillFreshnessService();
