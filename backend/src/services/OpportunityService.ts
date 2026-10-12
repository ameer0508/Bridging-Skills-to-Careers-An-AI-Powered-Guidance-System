import {
  OpportunityProvider,
  OpportunitySearchQuery,
  CanonicalOpportunity,
  EnrichedOpportunity,
  OpportunityProviderHealth,
  OpportunitySearchMeta,
} from './opportunities/OpportunityProvider.js';
import JSearchProvider from './opportunities/JSearchProvider.js';
import mongoose from 'mongoose';
import UserSkill from '../models/UserSkill.js';
import { buildUserSkillIndex, SkillEvidenceMatch } from '../utils/skillMatching.js';
import { extractJobRequirements, matchOpportunity } from './opportunities/OpportunityMatcher.js';
import CareerMatch from '../models/CareerMatch.js';
import SavedOpportunity, { ApplicationStatus, ISavedOpportunity } from '../models/SavedOpportunity.js';
import { AppError } from '../middlewares/errorHandler.js';

function sanitizeText(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<iframe\b[^<]*>([\s\S]*?)<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Yearly amounts are compared directly; other periods are not converted, so they never pass a salary filter. */
const yearlyTop = (salary: CanonicalOpportunity['salary']): number | null => {
  if (!salary) return null;
  if (salary.period && salary.period !== 'YEARLY' && salary.period !== 'YEAR') return null;
  return salary.max ?? salary.min ?? null;
};

const DATE_WINDOW_DAYS: Record<string, number> = { today: 1, '3days': 3, week: 7, month: 30 };

/** Same role re-posted by the same employer in the same place counts as one posting. */
const repostKey = (opp: CanonicalOpportunity): string =>
  [opp.title, opp.company, opp.location].map(v => (v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()).join('|');

export function formatSalary(salary?: CanonicalOpportunity['salary'] | null): string {
  if (!salary || (!salary.min && !salary.max)) return 'Salary not disclosed';
  const amount = (n: number) => n.toLocaleString('en-US');
  const range = salary.min && salary.max && salary.min !== salary.max
    ? `${amount(salary.min)} - ${amount(salary.max)}`
    : amount((salary.max || salary.min) as number);
  const period = salary.period ? ` per ${salary.period.toLowerCase().replace(/ly$/, '')}` : '';
  return `${salary.currency ? `${salary.currency} ` : ''}${range}${period}`;
}

export interface SavedOpportunityDetailsUpdate {
  notes?: string;
  /** ISO date, or null to clear the reminder. */
  reminderAt?: string | null;
  reminderNote?: string;
}

function sanitizeUrl(urlStr?: string): string {
  if (!urlStr) return '';
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    // invalid URL format
  }
  return '';
}

class OpportunityService {
  private provider: OpportunityProvider;
  // Provider results only, keyed by search. Match scores are never cached: they are computed
  // per request from the user's current skills.
  private cache: Map<string, { data: CanonicalOpportunity[]; timestamp: number; duplicatesRemoved: number }> = new Map();
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.provider = new JSearchProvider();
  }

  /**
   * Searches job postings, scores each against the user's evidenced skills, and reports
   * honestly where the results came from and what the filters removed.
   */
  async searchOpportunities(
    userId: string,
    query: OpportunitySearchQuery
  ): Promise<{ opportunities: EnrichedOpportunity[]; providerHealth: OpportunityProviderHealth; meta: OpportunitySearchMeta }> {
    const health = await this.provider.healthCheck();
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = Math.min(50, Math.max(1, query.limit || 10));

    // Candidate evidence: the user's skills with their resume evidence
    let userSkillIndex = new Map<string, SkillEvidenceMatch>();
    let targetTitle = '';
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const userObjId = new mongoose.Types.ObjectId(userId);
        userSkillIndex = await this.loadUserSkillIndex(userId);

        const topCareerMatch = await CareerMatch.findOne({ userId: userObjId }).sort({ matchScore: -1, confidence: -1, _id: 1 }).populate<{ careerId: { title: string } }>('careerId');
        targetTitle = topCareerMatch?.careerId?.title || '';
      } catch {
        // Without candidate evidence, postings are returned unscored (never with an invented score)
      }
    }

    // With no keywords the search is for the user's own best-matching career, if they have one
    const searchKeyword = (query.keywords || targetTitle || '').trim();
    const cacheKey = `${searchKeyword}_${query.location || 'all'}_${page}_${query.datePosted || 'all'}`.toLowerCase();
    const cached = this.cache.get(cacheKey);
    const fromCache = Boolean(cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS);

    let deduplicatedList: CanonicalOpportunity[];
    let duplicatesRemoved: number;
    let fetchedAt: number;
    let rawCount: number;
    if (fromCache && cached) {
      deduplicatedList = cached.data;
      duplicatesRemoved = cached.duplicatesRemoved;
      fetchedAt = cached.timestamp;
      rawCount = cached.data.length + cached.duplicatesRemoved;
    } else {
      let fetched: CanonicalOpportunity[];
      try {
        fetched = await this.provider.search({ ...query, keywords: searchKeyword, page });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'External opportunity provider request failed';
        return {
          opportunities: [],
          providerHealth: { status: 'DOWN', provider: this.provider.name, message: errorMsg },
          meta: {
            total: 0, page, limit, hasMore: false, source: 'unavailable', fetchedAt: null, fromCache: false,
            duplicatesRemoved: 0, salaryDataAvailable: false, salaryFilter: null, excludedWithoutDate: 0,
          },
        };
      }
      rawCount = fetched.length;

      // Deduplicate by provider id, then by the same role re-posted by the same employer in the same place
      const byId = new Map<string, CanonicalOpportunity>();
      const seenReposts = new Set<string>();
      for (const opp of fetched) {
        const idKey = `${opp.provider}_${opp.externalId}`;
        const repost = repostKey(opp);
        if (byId.has(idKey) || seenReposts.has(repost)) continue;
        byId.set(idKey, opp);
        seenReposts.add(repost);
      }
      deduplicatedList = Array.from(byId.values());
      duplicatesRemoved = fetched.length - deduplicatedList.length;
      fetchedAt = Date.now();
      this.cache.set(cacheKey, { data: deduplicatedList, timestamp: fetchedAt, duplicatesRemoved });
    }

    // Score each posting against the requirements the employer actually wrote
    let results: EnrichedOpportunity[] = deduplicatedList.map((opp) => this.enrich(opp, userSkillIndex));
    const salaryDataAvailable = results.some((o) => yearlyTop(o.salary) !== null);

    if (query.remoteOnly) results = results.filter((o) => o.remote);
    if (query.employmentType) {
      const wanted = query.employmentType.toLowerCase().replace(/[^a-z]/g, '');
      results = results.filter((o) => o.employmentType.toLowerCase().replace(/[^a-z]/g, '').includes(wanted));
    }

    let excludedWithoutDate = 0;
    const windowDays = query.datePosted ? DATE_WINDOW_DAYS[query.datePosted] : undefined;
    if (windowDays) {
      const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
      excludedWithoutDate = results.filter((o) => !o.postedAt).length;
      results = results.filter((o) => o.postedAt && new Date(o.postedAt).getTime() >= cutoff);
    }

    let salaryFilter: OpportunitySearchMeta['salaryFilter'] = null;
    if (typeof query.salaryMin === 'number' && query.salaryMin > 0) {
      const min = query.salaryMin;
      // A posting that states no salary cannot be shown to meet a salary requirement
      salaryFilter = { requestedMin: min, excludedWithoutSalary: results.filter((o) => yearlyTop(o.salary) === null).length };
      results = results.filter((o) => (yearlyTop(o.salary) ?? -1) >= min);
    }

    const sorted = this.sortOpportunities(results, query.sortBy);
    const isSample =
      deduplicatedList.some((o) => o.isSample) || health.status === 'PENDING_CREDS' || health.status === 'BLOCKED_BY_POLICY';

    return {
      opportunities: sorted.slice(0, limit),
      providerHealth: health,
      meta: {
        total: sorted.length,
        page,
        limit,
        // Demo listings are a fixed set; a live provider may have more when it filled its page
        hasMore: sorted.length > limit || (!isSample && rawCount >= 10),
        source: isSample ? 'sample' : 'live',
        fetchedAt: new Date(fetchedAt).toISOString(),
        fromCache,
        duplicatesRemoved,
        salaryDataAvailable,
        salaryFilter,
        excludedWithoutDate,
      },
    };
  }

  /** Scores one posting for a candidate and sanitises its text fields. */
  private enrich(opp: CanonicalOpportunity, userSkillIndex: Map<string, SkillEvidenceMatch>): EnrichedOpportunity {
    const description = sanitizeText(opp.description);
    const requirements = extractJobRequirements({
      skills: opp.skills,
      qualifications: opp.qualifications,
      description,
    });
    const match = matchOpportunity(requirements, userSkillIndex);

    return {
      ...opp,
      title: sanitizeText(opp.title),
      company: sanitizeText(opp.company),
      location: sanitizeText(opp.location),
      description,
      applicationUrl: sanitizeUrl(opp.applicationUrl) || `https://www.google.com/search?q=${encodeURIComponent(`${opp.title} ${opp.company} jobs`)}`,
      isSample: Boolean(opp.isSample),
      skillbridgeMatchScore: match.score,
      matchStatus: match.status,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      requirements: match.requirements,
      matchExplanation: match.explanation,
    };
  }

  /** The candidate's evidenced skills, indexed for matching. Empty when none are on record. */
  private async loadUserSkillIndex(userId: string): Promise<Map<string, SkillEvidenceMatch>> {
    if (mongoose.connection.readyState !== 1 || !mongoose.Types.ObjectId.isValid(userId)) {
      return new Map();
    }
    const docs = await UserSkill.find({ userId: new mongoose.Types.ObjectId(userId) }).populate('skillId');
    return buildUserSkillIndex(docs);
  }

  /**
   * Sorts opportunities based on match score, date, salary, or relevance.
   */
  private sortOpportunities(list: EnrichedOpportunity[], sortBy?: string): EnrichedOpportunity[] {
    const sorted = [...list];
    if (sortBy === 'date') {
      // Newest first; postings with no publication date go last
      const time = (o: EnrichedOpportunity) => (o.postedAt ? new Date(o.postedAt).getTime() : -Infinity);
      return sorted.sort((a, b) => time(b) - time(a));
    }
    if (sortBy === 'salary') {
      // Highest stated salary first; postings with no salary go last
      return sorted.sort((a, b) => (yearlyTop(b.salary) ?? -1) - (yearlyTop(a.salary) ?? -1));
    }
    if (sortBy === 'relevance') {
      return sorted;
    }
    // Default to match score; postings that could not be scored go last, in provider order
    return sorted.sort(
      (a, b) => (b.skillbridgeMatchScore ?? -1) - (a.skillbridgeMatchScore ?? -1)
    );
  }

  /**
   * Retrieves detailed opportunity by external ID.
   */
  async getOpportunityById(userId: string, externalId: string): Promise<EnrichedOpportunity | null> {
    // Postings are only available from the provider's search results, so look in recent
    // (cached) searches rather than running an unrelated new search, and score for this user.
    for (const entry of this.cache.values()) {
      const found = entry.data.find((opp) => opp.externalId === externalId);
      if (found) return this.enrich(found, await this.loadUserSkillIndex(userId));
    }
    return null;
  }

  /**
   * Saves an opportunity for persistent user bookmarking and application tracking.
   */
  async saveOpportunity(userId: string, oppData: Partial<EnrichedOpportunity>): Promise<ISavedOpportunity> {
    if (!oppData.externalId || !oppData.title || !oppData.company) {
      throw new AppError('Opportunity ID, title, and company are required.', 400);
    }

    const safeUrl = sanitizeUrl(oppData.applicationUrl);
    if (!safeUrl) {
      throw new AppError('Valid http/https application URL is required.', 400);
    }

    const provider = oppData.provider || 'JSearch API';
    const salaryStr = formatSalary(oppData.salary);

    const saved = await SavedOpportunity.findOneAndUpdate(
      { userId, provider, externalId: oppData.externalId },
      {
        $set: {
          title: sanitizeText(oppData.title),
          company: sanitizeText(oppData.company),
          location: sanitizeText(oppData.location || 'Location not stated'),
          salary: salaryStr,
          applicationUrl: safeUrl,
          postedAt: oppData.postedAt || undefined,
          skillbridgeMatchScore:
            typeof oppData.skillbridgeMatchScore === 'number' ? oppData.skillbridgeMatchScore : null,
          matchedSkills: oppData.matchedSkills || [],
          missingSkills: oppData.missingSkills || [],
          description: sanitizeText(oppData.description || ''),
          isSample: Boolean(oppData.isSample),
          remote: typeof oppData.remote === 'boolean' ? oppData.remote : undefined,
          employmentType: sanitizeText(oppData.employmentType || ''),
          matchExplanation: sanitizeText(oppData.matchExplanation || ''),
          savedAt: new Date(),
        },
        $setOnInsert: {
          status: 'saved',
          notes: '',
          statusHistory: [{ status: 'saved', changedAt: new Date(), note: '' }],
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return saved;
  }

  /**
   * Removes one of the caller's saved opportunities. Like every saved-opportunity operation it is
   * scoped to the caller and reports 404 when the caller has no such record, whether the id is
   * unknown or belongs to someone else.
   */
  async unsaveOpportunity(userId: string, externalId: string): Promise<void> {
    const res = await SavedOpportunity.deleteOne({ userId, externalId });
    if (res.deletedCount === 0) {
      throw new AppError('Saved opportunity not found.', 404, 'SAVED_OPPORTUNITY_NOT_FOUND');
    }
  }

  /**
   * Updates the notes and follow-up reminder of a saved opportunity without changing its status.
   */
  async updateSavedDetails(
    userId: string,
    externalId: string,
    update: SavedOpportunityDetailsUpdate
  ): Promise<ISavedOpportunity> {
    const doc = await SavedOpportunity.findOne({ userId, externalId });
    if (!doc) throw new AppError('Saved opportunity not found.', 404, 'SAVED_OPPORTUNITY_NOT_FOUND');

    if (typeof update.notes === 'string') doc.notes = sanitizeText(update.notes).slice(0, 2000);
    if (update.reminderAt === null) {
      doc.reminderAt = null;
      doc.reminderNote = '';
    } else if (typeof update.reminderAt === 'string') {
      const when = new Date(update.reminderAt);
      if (Number.isNaN(when.getTime())) throw new AppError('Reminder date is not a valid date.', 400, 'VALIDATION_ERROR');
      if (when.getTime() < Date.now() - 60 * 1000) {
        throw new AppError('Reminder date must be in the future.', 400, 'VALIDATION_ERROR');
      }
      doc.reminderAt = when;
    }
    if (typeof update.reminderNote === 'string' && doc.reminderAt) {
      doc.reminderNote = sanitizeText(update.reminderNote).slice(0, 300);
    }

    await doc.save();
    return doc;
  }

  /**
   * Retrieves all saved opportunities for a user.
   */
  async getSavedOpportunities(userId: string): Promise<ISavedOpportunity[]> {
    return SavedOpportunity.find({ userId }).sort({ savedAt: -1 });
  }

  /**
   * Updates application pipeline status for a saved opportunity.
   */
  async updateSavedStatus(
    userId: string,
    externalId: string,
    status: ApplicationStatus,
    notes?: string
  ): Promise<ISavedOpportunity> {
    const validStatuses: ApplicationStatus[] = ['saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid application status: ${status}`, 400);
    }

    const doc = await SavedOpportunity.findOne({ userId, externalId });
    if (!doc) throw new AppError('Saved opportunity not found.', 404, 'SAVED_OPPORTUNITY_NOT_FOUND');

    const cleanNotes = typeof notes === 'string' ? sanitizeText(notes) : undefined;
    if (doc.status !== status) {
      // Every transition is recorded so the application's history can be shown
      doc.statusHistory.push({ status, changedAt: new Date(), note: cleanNotes || '' });
      if (status === 'applied' && !doc.appliedAt) doc.appliedAt = new Date();
      doc.status = status;
    }
    if (cleanNotes !== undefined) doc.notes = cleanNotes;

    await doc.save();
    return doc;
  }

  /**
   * Retrieves persistent application telemetry metrics.
   */
  async getSavedTelemetry(userId: string): Promise<{
    savedCount: number;
    appliedCount: number;
    interviewingCount: number;
    offerCount: number;
    rejectedCount: number;
    withdrawnCount: number;
    /** Follow-up reminders whose time has arrived. */
    remindersDue: number;
  }> {
    const docs = await SavedOpportunity.find({ userId });
    return {
      savedCount: docs.filter((d) => d.status === 'saved').length,
      appliedCount: docs.filter((d) => d.status === 'applied').length,
      interviewingCount: docs.filter((d) => d.status === 'interviewing').length,
      offerCount: docs.filter((d) => d.status === 'offer').length,
      rejectedCount: docs.filter((d) => d.status === 'rejected').length,
      withdrawnCount: docs.filter((d) => d.status === 'withdrawn').length,
      remindersDue: docs.filter((d) => d.reminderAt && d.reminderAt.getTime() <= Date.now()).length,
    };
  }
}

export default new OpportunityService();
