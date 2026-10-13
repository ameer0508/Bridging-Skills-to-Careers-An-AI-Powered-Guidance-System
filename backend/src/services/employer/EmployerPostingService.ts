import { Types } from 'mongoose';
import { z } from 'zod';
import { User } from '../../models/User.js';
import EmployerProfile, { type IEmployerProfile } from '../../models/EmployerProfile.js';
import EmployerPosting, {
  CONTRIBUTION_TERMS_VERSION,
  CONTRIBUTION_USES,
  EMPLOYMENT_TYPES,
  INDIAN_STATES,
  WORK_MODES,
  type IEmployerPosting,
} from '../../models/EmployerPosting.js';
import EmployerPostingReport, { REPORT_REASONS } from '../../models/EmployerPostingReport.js';
import MarketPosting from '../../models/MarketPosting.js';
import MarketImportBatch from '../../models/MarketImportBatch.js';
import MarketIngestionService, { postingFingerprint, postingSkills } from '../market/MarketIngestionService.js';
import { EMPLOYER_SUBMISSIONS_SOURCE, activateEmployerSource } from '../../config/marketSources.js';
import { lookupSkill } from '../../utils/skillLexicon.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../config/logger.js';

/**
 * First-party job postings (docs/EMPLOYER_POSTINGS.md). An organization's representative creates
 * a posting, publishes it under the contribution terms (which grant retention and analysis), and
 * closes or withdraws it. Published postings are mirrored into the market records through the
 * normal ingestion path (de-duplication, skills from the lexicon); withdrawn or hidden postings are
 * removed from them. Nothing here is verified: organizations are self-declared and labelled so.
 */

export const LIMITS = {
  openPostingsPerUser: 25,
  newPostingsPerDay: 10,
  openDays: 60,
  reportsToHide: 3,
  maxSkills: 20,
} as const;

/** Advertised pay must be plausible for India; anything else is a typing error or a unit mix-up. */
export const SALARY_BOUNDS = {
  YEAR: { min: 50_000, max: 50_000_000 },
  MONTH: { min: 5_000, max: 5_000_000 },
} as const;
export const MAX_RANGE_RATIO = 10;

const DAY_MS = 86_400_000;
const text = (min: number, max: number) =>
  z
    .string()
    // eslint-disable-next-line no-control-regex
    .transform(v => v.replace(/<[^>]*>/g, ' ').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/[ \t]+/g, ' ').trim())
    .pipe(z.string().min(min, `needs at least ${min} characters`).max(max, `must be at most ${max} characters`));

const httpsUrl = z
  .string()
  .trim()
  .max(300)
  .refine(v => {
    try {
      const u = new URL(v);
      return u.protocol === 'https:' && !u.username && !u.password && u.hostname.includes('.');
    } catch {
      return false;
    }
  }, 'must be an https address');

const salarySchema = z
  .object({
    min: z.number().int().positive().nullable().optional(),
    max: z.number().int().positive().nullable().optional(),
    currency: z.literal('INR'),
    period: z.enum(['YEAR', 'MONTH']),
  })
  .strict()
  .superRefine((s, ctx) => {
    const min = s.min ?? null;
    const max = s.max ?? null;
    if (min === null && max === null) ctx.addIssue({ code: 'custom', message: 'needs a minimum, a maximum or both' });
    const bounds = SALARY_BOUNDS[s.period];
    for (const [name, value] of [['min', min], ['max', max]] as const) {
      if (value !== null && (value < bounds.min || value > bounds.max)) {
        ctx.addIssue({ code: 'custom', path: [name], message: `must be between ₹${bounds.min.toLocaleString('en-IN')} and ₹${bounds.max.toLocaleString('en-IN')} per ${s.period.toLowerCase()}` });
      }
    }
    if (min !== null && max !== null) {
      if (min > max) ctx.addIssue({ code: 'custom', path: ['max'], message: 'must not be below the minimum' });
      else if (max > min * MAX_RANGE_RATIO) ctx.addIssue({ code: 'custom', path: ['max'], message: `must be at most ${MAX_RANGE_RATIO} times the minimum` });
    }
  });

const profileSchema = z.object({ organizationName: text(2, 120), website: httpsUrl.nullable().optional() }).strict();

const postingFields = {
  title: text(3, 120),
  description: text(80, 8000),
  city: text(2, 80),
  state: z.enum(INDIAN_STATES),
  workMode: z.enum(WORK_MODES),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  salary: salarySchema.nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(60)).min(1, 'list at least one skill').max(LIMITS.maxSkills),
  applyUrl: httpsUrl.nullable().optional(),
};
const createSchema = z.object(postingFields).strict();
// Title and place identify a published posting; changing them means closing it and posting anew
const openEditSchema = z
  .object({
    description: postingFields.description.optional(),
    workMode: postingFields.workMode.optional(),
    employmentType: postingFields.employmentType.optional(),
    salary: postingFields.salary,
    skills: postingFields.skills.optional(),
    applyUrl: postingFields.applyUrl,
  })
  .strict();
const draftEditSchema = createSchema.partial().strict();

const consentSchema = z
  .object({
    termsVersion: z.literal(CONTRIBUTION_TERMS_VERSION),
    authorizedToPost: z.literal(true),
    realOpening: z.literal(true),
    grantsUses: z.literal(true),
  })
  .strict();

const reportSchema = z.object({ reason: z.enum(REPORT_REASONS), note: text(0, 500).optional() }).strict();

export function parse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, input: unknown): T {
  const parsed = schema.safeParse(input ?? {});
  if (!parsed.success) {
    throw new AppError(`Invalid request: ${parsed.error.issues.map(i => `${i.path.join('.') || 'body'} ${i.message}`).join('; ')}`, 400, 'VALIDATION_ERROR');
  }
  return parsed.data;
}

const oid = (id: string, what = 'posting') => {
  if (!Types.ObjectId.isValid(id)) throw new AppError(`Invalid ${what} id`, 400, 'INVALID_ID');
  return new Types.ObjectId(id);
};

/** Canonical lexicon names; anything unknown is kept apart and never analysed. */
export function normaliseSkills(raw: string[]): { skills: string[]; unrecognised: string[] } {
  const skills: string[] = [];
  const unrecognised: string[] = [];
  for (const s of raw) {
    const known = lookupSkill(s)?.name;
    if (known) {
      if (!skills.includes(known)) skills.push(known);
    } else if (!unrecognised.some(u => u.toLowerCase() === s.toLowerCase())) unrecognised.push(s);
  }
  return { skills, unrecognised };
}

const hostOf = (url: string | null | undefined) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
};

export const DISCLOSURE =
  'Posted directly on SkillBridge by the organization named. The organization and its details are self-declared; SkillBridge has not verified them.';

export interface PublicPostingView {
  id: string;
  organizationName: string;
  organization: { website: string | null; emailDomainMatchesWebsite: boolean; selfDeclared: true };
  title: string;
  description: string;
  city: string;
  state: string;
  workMode: string;
  employmentType: string;
  salary: IEmployerPosting['salary'];
  skills: string[];
  applyUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
  expiresAt: string | null;
  disclosure: string;
}

const publicView = (p: IEmployerPosting, profile: IEmployerProfile | null): PublicPostingView => ({
  id: p._id.toString(),
  organizationName: p.organizationName,
  organization: { website: profile?.website ?? null, emailDomainMatchesWebsite: profile?.emailDomainMatchesWebsite ?? false, selfDeclared: true },
  title: p.title,
  description: p.description,
  city: p.city,
  state: p.state,
  workMode: p.workMode,
  employmentType: p.employmentType,
  salary: p.salary,
  skills: p.skills,
  applyUrl: p.applyUrl,
  publishedAt: p.publishedAt?.toISOString() ?? null,
  updatedAt: p.updatedAt.toISOString(),
  expiresAt: p.expiresAt?.toISOString() ?? null,
  disclosure: DISCLOSURE,
});

const ownerView = (p: IEmployerPosting, reports = 0) => ({
  ...publicView(p, null),
  status: p.status,
  unrecognisedSkills: p.unrecognisedSkills,
  consent: p.consent ? { termsVersion: p.consent.termsVersion, uses: p.consent.uses, grantedAt: p.consent.grantedAt.toISOString() } : null,
  closedAt: p.closedAt?.toISOString() ?? null,
  withdrawnAt: p.withdrawnAt?.toISOString() ?? null,
  hiddenReason: p.hiddenReason,
  reports,
  inMarketData: ['open', 'closed'].includes(p.status),
});

class EmployerPostingService {
  /** At startup: if any posting was ever published under the terms, the channel is a source. */
  async syncSourceRegistration(): Promise<boolean> {
    const any = await EmployerPosting.exists({ status: { $in: ['open', 'closed'] } });
    if (any) activateEmployerSource();
    return Boolean(any);
  }

  // ---------------------------------------------------------------- organization
  async getProfile(userId: string) {
    const profile = await EmployerProfile.findOne({ userId: oid(userId, 'user') });
    return profile ? { organizationName: profile.organizationName, website: profile.website, emailDomainMatchesWebsite: profile.emailDomainMatchesWebsite, selfDeclared: true as const } : null;
  }

  async saveProfile(userId: string, body: unknown) {
    const input = parse(profileSchema, body);
    const user = await User.findById(userId).select('email');
    if (!user) throw new AppError('Account not found.', 404, 'NOT_FOUND');
    const emailDomain = user.email.split('@')[1]?.toLowerCase() ?? '';
    const site = hostOf(input.website ?? null);
    const emailDomainMatchesWebsite = Boolean(site && (emailDomain === site || emailDomain.endsWith(`.${site}`)));
    await EmployerProfile.updateOne(
      { userId: oid(userId, 'user') },
      { $set: { organizationName: input.organizationName, website: input.website ?? null, emailDomainMatchesWebsite } },
      { upsert: true }
    );
    // Open and draft postings carry the organization's current name
    await EmployerPosting.updateMany({ userId: oid(userId, 'user'), status: { $in: ['draft'] } }, { $set: { organizationName: input.organizationName } });
    return this.getProfile(userId);
  }

  // ---------------------------------------------------------------- the owner's postings
  private async ownPosting(userId: string, id: string) {
    const posting = await EmployerPosting.findOne({ _id: oid(id), userId: oid(userId, 'user') });
    if (!posting) throw new AppError('Posting not found.', 404, 'NOT_FOUND');
    return posting;
  }

  async listMine(userId: string) {
    await this.closeExpired();
    const postings = await EmployerPosting.find({ userId: oid(userId, 'user') }).sort({ createdAt: -1 }).limit(200);
    const counts = await EmployerPostingReport.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { postingId: { $in: postings.map(p => p._id) } } },
      { $group: { _id: '$postingId', n: { $sum: 1 } } },
    ]);
    const byId = new Map(counts.map(c => [c._id.toString(), c.n]));
    return postings.map(p => ownerView(p, byId.get(p._id.toString()) ?? 0));
  }

  async create(userId: string, body: unknown) {
    const profile = await EmployerProfile.findOne({ userId: oid(userId, 'user') });
    if (!profile) throw new AppError('Add your organization before creating a posting.', 409, 'NO_ORGANIZATION');
    const input = parse(createSchema, body);
    const since = new Date(Date.now() - DAY_MS);
    if ((await EmployerPosting.countDocuments({ userId: profile.userId, createdAt: { $gte: since } })) >= LIMITS.newPostingsPerDay) {
      throw new AppError(`At most ${LIMITS.newPostingsPerDay} new postings a day.`, 429, 'POSTING_LIMIT');
    }
    const { skills, unrecognised } = normaliseSkills(input.skills);
    if (skills.length === 0) throw new AppError('None of the skills is recognised. Use common names such as SQL, Python or Excel.', 400, 'VALIDATION_ERROR');
    const posting = await EmployerPosting.create({
      ...input,
      userId: profile.userId,
      organizationName: profile.organizationName,
      salary: input.salary ? { min: input.salary.min ?? null, max: input.salary.max ?? null, currency: 'INR', period: input.salary.period } : null,
      applyUrl: input.applyUrl ?? null,
      skills,
      unrecognisedSkills: unrecognised,
    });
    return ownerView(posting);
  }

  async update(userId: string, id: string, body: unknown) {
    const posting = await this.ownPosting(userId, id);
    if (!['draft', 'open'].includes(posting.status)) throw new AppError(`A ${posting.status} posting cannot be changed.`, 409, 'NOT_EDITABLE');
    const input = posting.status === 'draft' ? parse(draftEditSchema, body) : parse(openEditSchema, body);
    if ('skills' in input && input.skills) {
      const { skills, unrecognised } = normaliseSkills(input.skills);
      if (skills.length === 0) throw new AppError('None of the skills is recognised.', 400, 'VALIDATION_ERROR');
      posting.skills = skills;
      posting.unrecognisedSkills = unrecognised;
    }
    for (const key of ['title', 'description', 'city', 'state', 'workMode', 'employmentType', 'applyUrl'] as const) {
      if (key in input && (input as Record<string, unknown>)[key] !== undefined) (posting as unknown as Record<string, unknown>)[key] = (input as Record<string, unknown>)[key] ?? null;
    }
    if ('salary' in input && input.salary !== undefined) {
      posting.salary = input.salary ? { min: input.salary.min ?? null, max: input.salary.max ?? null, currency: 'INR', period: input.salary.period } : null;
    }
    await posting.save();
    if (posting.status === 'open') await this.syncMarketRecord(posting);
    return ownerView(posting);
  }

  async removeDraft(userId: string, id: string) {
    const posting = await this.ownPosting(userId, id);
    if (posting.status !== 'draft') throw new AppError('Only a draft can be deleted; close or withdraw a published posting.', 409, 'NOT_A_DRAFT');
    await posting.deleteOne();
  }

  async publish(userId: string, id: string, body: unknown) {
    parse(consentSchema, body);
    const posting = await this.ownPosting(userId, id);
    if (posting.status !== 'draft') throw new AppError('Only a draft can be published.', 409, 'NOT_A_DRAFT');
    if ((await EmployerPosting.countDocuments({ userId: posting.userId, status: 'open' })) >= LIMITS.openPostingsPerUser) {
      throw new AppError(`At most ${LIMITS.openPostingsPerUser} open postings at a time.`, 429, 'POSTING_LIMIT');
    }
    const now = new Date();
    // The same role, place and day again from this organization is a duplicate, not a new opening
    const fingerprint = postingFingerprint({ title: posting.title, company: posting.organizationName, location: `${posting.city}, ${posting.state}`, postedAt: now });
    const mine = await EmployerPosting.find({ userId: posting.userId, status: { $in: ['open', 'closed'] }, _id: { $ne: posting._id } }).select('title organizationName city state publishedAt');
    if (mine.some(p => postingFingerprint({ title: p.title, company: p.organizationName, location: `${p.city}, ${p.state}`, postedAt: p.publishedAt }) === fingerprint)) {
      throw new AppError('You already published this role in this place today.', 409, 'DUPLICATE_POSTING');
    }
    if (await EmployerPosting.exists({ userId: posting.userId, status: 'open', title: posting.title, city: posting.city, state: posting.state, _id: { $ne: posting._id } })) {
      throw new AppError('This role is already open in this place. Close it before posting it again.', 409, 'DUPLICATE_POSTING');
    }
    posting.status = 'open';
    posting.publishedAt = now;
    posting.expiresAt = new Date(now.getTime() + LIMITS.openDays * DAY_MS);
    posting.consent = { termsVersion: CONTRIBUTION_TERMS_VERSION, uses: [...CONTRIBUTION_USES], authorizedToPost: true, realOpening: true, grantedAt: now };
    await posting.save();
    activateEmployerSource();
    await this.syncMarketRecord(posting);
    return ownerView(posting);
  }

  async close(userId: string, id: string) {
    const posting = await this.ownPosting(userId, id);
    if (posting.status !== 'open') throw new AppError('Only an open posting can be closed.', 409, 'NOT_OPEN');
    posting.status = 'closed';
    posting.closedAt = new Date();
    await posting.save();
    // Kept in the market records, as the terms allow; it was last advertised when it closed
    await MarketPosting.updateOne({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id, sourceRecordId: posting._id.toString() }, { $set: { lastSeenAt: posting.closedAt } });
    return ownerView(posting);
  }

  /** Withdrawing removes the posting from view and from every market figure, at once. */
  async withdraw(userId: string, id: string) {
    const posting = await this.ownPosting(userId, id);
    if (!['open', 'closed', 'hidden'].includes(posting.status)) throw new AppError('Only a published posting can be withdrawn.', 409, 'NOT_PUBLISHED');
    posting.status = 'withdrawn';
    posting.withdrawnAt = new Date();
    await posting.save();
    await this.removeMarketRecords([posting._id]);
    return ownerView(posting);
  }

  // ---------------------------------------------------------------- job seekers
  async listOpen(query: { skill?: string; state?: string }) {
    await this.closeExpired();
    const filter: Record<string, unknown> = { status: 'open' };
    if (query.skill) {
      const skill = lookupSkill(String(query.skill))?.name;
      if (!skill) throw new AppError('Unknown skill.', 400, 'VALIDATION_ERROR');
      filter.skills = skill;
    }
    if (query.state) {
      if (!(INDIAN_STATES as readonly string[]).includes(String(query.state))) throw new AppError('Unknown state.', 400, 'VALIDATION_ERROR');
      filter.state = query.state;
    }
    const postings = await EmployerPosting.find(filter).sort({ publishedAt: -1 }).limit(100);
    const profiles = await EmployerProfile.find({ userId: { $in: postings.map(p => p.userId) } });
    const byUser = new Map(profiles.map(p => [p.userId.toString(), p]));
    return { postings: postings.map(p => publicView(p, byUser.get(p.userId.toString()) ?? null)), disclosure: DISCLOSURE };
  }

  async report(userId: string, id: string, body: unknown) {
    const input = parse(reportSchema, body);
    const posting = await EmployerPosting.findOne({ _id: oid(id), status: 'open' });
    if (!posting) throw new AppError('Posting not found.', 404, 'NOT_FOUND');
    if (posting.userId.toString() === userId) throw new AppError('You cannot report your own posting.', 409, 'OWN_POSTING');
    try {
      await EmployerPostingReport.create({ postingId: posting._id, userId: oid(userId, 'user'), reason: input.reason, note: input.note ?? '' });
    } catch (err) {
      if ((err as { code?: number }).code === 11000) throw new AppError('You have already reported this posting.', 409, 'ALREADY_REPORTED');
      throw err;
    }
    const reports = await EmployerPostingReport.countDocuments({ postingId: posting._id });
    if (reports >= LIMITS.reportsToHide) {
      posting.status = 'hidden';
      posting.hiddenAt = new Date();
      posting.hiddenReason = `Hidden after ${reports} reports, pending review`;
      await posting.save();
      await this.removeMarketRecords([posting._id]);
    }
    return { reported: true, hidden: posting.status === 'hidden' };
  }

  // ---------------------------------------------------------------- administrators
  async listReported() {
    const grouped = await EmployerPostingReport.aggregate<{ _id: Types.ObjectId; reports: number; reasons: string[] }>([
      { $group: { _id: '$postingId', reports: { $sum: 1 }, reasons: { $push: '$reason' } } },
      { $sort: { reports: -1 } },
      { $limit: 200 },
    ]);
    const postings = await EmployerPosting.find({ _id: { $in: grouped.map(g => g._id) } });
    const byId = new Map(postings.map(p => [p._id.toString(), p]));
    return grouped
      .filter(g => byId.has(g._id.toString()))
      .map(g => ({ ...ownerView(byId.get(g._id.toString())!, g.reports), reasons: g.reasons }));
  }

  async moderate(id: string, action: 'hide' | 'restore') {
    const posting = await EmployerPosting.findById(oid(id));
    if (!posting) throw new AppError('Posting not found.', 404, 'NOT_FOUND');
    if (action === 'hide') {
      if (!['open', 'closed'].includes(posting.status)) throw new AppError('Only a published posting can be hidden.', 409, 'NOT_PUBLISHED');
      posting.status = 'hidden';
      posting.hiddenAt = new Date();
      posting.hiddenReason = 'Hidden by an administrator';
      await posting.save();
      await this.removeMarketRecords([posting._id]);
    } else {
      if (posting.status !== 'hidden') throw new AppError('Only a hidden posting can be restored.', 409, 'NOT_HIDDEN');
      const expired = posting.expiresAt && posting.expiresAt.getTime() <= Date.now();
      posting.status = expired ? 'closed' : 'open';
      if (expired && !posting.closedAt) posting.closedAt = posting.expiresAt;
      posting.hiddenAt = null;
      posting.hiddenReason = null;
      await posting.save();
      await EmployerPostingReport.deleteMany({ postingId: posting._id });
      await this.syncMarketRecord(posting);
    }
    return ownerView(posting);
  }

  // ---------------------------------------------------------------- lifecycle and market records
  /** Open postings past their 60 days close themselves. */
  async closeExpired(now = new Date()) {
    const due = await EmployerPosting.find({ status: 'open', expiresAt: { $lte: now } }).select('_id expiresAt');
    for (const p of due) {
      await EmployerPosting.updateOne({ _id: p._id, status: 'open' }, { $set: { status: 'closed', closedAt: p.expiresAt } });
      await MarketPosting.updateOne({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id, sourceRecordId: p._id.toString() }, { $set: { lastSeenAt: p.expiresAt } });
    }
    return due.length;
  }

  /** Mirrors one published posting into the market records through the normal ingestion path. */
  private async syncMarketRecord(posting: IEmployerPosting) {
    const recordId = posting._id.toString();
    const existing = await MarketPosting.findOne({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id, sourceRecordId: recordId });
    const salary = posting.salary ? { min: posting.salary.min ?? undefined, max: posting.salary.max ?? undefined, currency: 'INR', period: posting.salary.period } : undefined;
    if (existing) {
      // Editable fields only; title, employer, place and date are fixed once published
      await MarketPosting.updateOne(
        { _id: existing._id },
        {
          $set: {
            skills: postingSkills({ title: posting.title, description: posting.description, skills: posting.skills }),
            salary: salary ? { min: salary.min ?? null, max: salary.max ?? null, currency: 'INR', period: salary.period } : null,
            remote: posting.workMode === 'remote',
          },
        }
      );
      return;
    }
    const batch = await MarketIngestionService.importBatch(
      {
        sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id,
        retrievedAt: new Date().toISOString(),
        postings: [
          {
            sourceRecordId: recordId,
            title: posting.title,
            company: posting.organizationName,
            location: `${posting.city}, ${posting.state}`,
            country: 'IN',
            remote: posting.workMode === 'remote',
            postedAt: (posting.publishedAt ?? new Date()).toISOString(),
            description: posting.description,
            skills: posting.skills,
            salary,
          },
        ],
      },
      posting.userId.toString()
    );
    if (batch.counts.rejected > 0) logger.warn(`Employer posting ${recordId} was not added to market records: ${batch.rejections.map(r => r.reason).join('; ')}`);
  }

  private async removeMarketRecords(ids: Types.ObjectId[]) {
    const recordIds = ids.map(i => i.toString());
    await MarketPosting.deleteMany({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id, sourceRecordId: { $in: recordIds } });
    // A posting merged into another source's copy is only a reference there; drop the reference
    await MarketPosting.updateMany({}, { $pull: { alsoSeenIn: { sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id, sourceRecordId: { $in: recordIds } } } });
  }

  /** Account deletion: the user's postings leave every market figure, and reports about them go too. */
  async removeAllForUser(userId: string) {
    const uid = oid(userId, 'user');
    const ids = (await EmployerPosting.find({ userId: uid }).select('_id').lean()).map(p => p._id);
    await this.removeMarketRecords(ids);
    await EmployerPostingReport.deleteMany({ postingId: { $in: ids } });
    await MarketImportBatch.deleteMany({ sourceId: EMPLOYER_SUBMISSIONS_SOURCE.id, importedBy: uid });
    return ids.length;
  }
}

export default new EmployerPostingService();
