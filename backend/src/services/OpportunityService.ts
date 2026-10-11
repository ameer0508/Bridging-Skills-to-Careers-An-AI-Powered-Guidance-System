import {
  OpportunityProvider,
  OpportunitySearchQuery,
  CanonicalOpportunity,
  EnrichedOpportunity,
  OpportunityProviderHealth,
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
  private cache: Map<string, { data: EnrichedOpportunity[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.provider = new JSearchProvider();
  }

  /**
   * Searches live external opportunities and enriches them with candidate SkillBridge match telemetry.
   */
  async searchOpportunities(
    userId: string,
    query: OpportunitySearchQuery
  ): Promise<{ opportunities: EnrichedOpportunity[]; providerHealth: OpportunityProviderHealth }> {
    const health = await this.provider.healthCheck();

    // Check cache
    const cacheKey = `${userId}_${query.keywords || 'default'}_${query.location || 'all'}_${query.page || 1}_${query.datePosted || 'all'}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      let filtered = cached.data;
      if (query.remoteOnly) filtered = filtered.filter((o) => o.remote);
      if (query.employmentType) {
        filtered = filtered.filter((o) => o.employmentType.toLowerCase().includes(query.employmentType!.toLowerCase()));
      }
      return {
        opportunities: this.sortOpportunities(filtered, query.sortBy),
        providerHealth: health,
      };
    }

    // Candidate evidence: the user's skills with their resume evidence
    let userSkillIndex = new Map<string, SkillEvidenceMatch>();
    let targetTitle = '';
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const userObjId = new mongoose.Types.ObjectId(userId);
        const userSkillsDocs = await UserSkill.find({ userId: userObjId }).populate('skillId');
        userSkillIndex = buildUserSkillIndex(userSkillsDocs);

        const topCareerMatch = await CareerMatch.findOne({ userId: userObjId }).sort({ matchScore: -1 }).populate<{ careerId: { title: string } }>('careerId');
        targetTitle = topCareerMatch?.careerId?.title || '';
      } catch {
        // Without candidate evidence, postings are returned unscored (never with an invented score)
      }
    }

    // Deriving search keyword query if not provided
    const searchKeyword = query.keywords || targetTitle || 'Software Engineer';
    let canonicalOpportunities: CanonicalOpportunity[];
    try {
      canonicalOpportunities = await this.provider.search({ ...query, keywords: searchKeyword });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'External opportunity provider request failed';
      return {
        opportunities: [],
        providerHealth: {
          status: 'DOWN',
          provider: this.provider.name,
          message: errorMsg,
        },
      };
    }

    // DEDUPLICATION: Prevent duplicate live opportunities using provider + externalId
    const uniqueMap = new Map<string, CanonicalOpportunity>();
    canonicalOpportunities.forEach((opp) => {
      const dedupKey = `${opp.provider}_${opp.externalId}`;
      if (!uniqueMap.has(dedupKey)) {
        uniqueMap.set(dedupKey, opp);
      }
    });
    const deduplicatedList = Array.from(uniqueMap.values());

    // Score each posting against the requirements the employer actually wrote
    const enrichedList: EnrichedOpportunity[] = deduplicatedList.map((opp) => {
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
        skillbridgeMatchScore: match.score,
        matchStatus: match.status,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        requirements: match.requirements,
        matchExplanation: match.explanation,
      };
    });

    // Save to cache
    this.cache.set(cacheKey, { data: enrichedList, timestamp: Date.now() });

    let finalResults = enrichedList;
    if (query.remoteOnly) finalResults = finalResults.filter((o) => o.remote);
    if (query.employmentType) {
      finalResults = finalResults.filter((o) => o.employmentType.toLowerCase().includes(query.employmentType!.toLowerCase()));
    }

    return {
      opportunities: this.sortOpportunities(finalResults, query.sortBy),
      providerHealth: health,
    };
  }

  /**
   * Sorts opportunities based on match score, date, salary, or relevance.
   */
  private sortOpportunities(list: EnrichedOpportunity[], sortBy?: string): EnrichedOpportunity[] {
    const sorted = [...list];
    if (sortBy === 'date') {
      return sorted.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    }
    if (sortBy === 'salary') {
      return sorted.sort((a, b) => (b.salary?.max || b.salary?.min || 0) - (a.salary?.max || a.salary?.min || 0));
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
    // Postings are only available from the provider's search results, so look in this
    // user's recent (cached) searches rather than running an unrelated new search.
    const prefix = `${userId}_`;
    for (const [key, entry] of this.cache.entries()) {
      if (!key.startsWith(prefix)) continue;
      const found = entry.data.find((opp) => opp.externalId === externalId);
      if (found) return found;
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
    const salaryStr = oppData.salary?.min && oppData.salary?.max
      ? `$${(oppData.salary.min / 1000).toFixed(0)}k - $${(oppData.salary.max / 1000).toFixed(0)}k`
      : 'Salary Not Disclosed';

    const saved = await SavedOpportunity.findOneAndUpdate(
      { userId, provider, externalId: oppData.externalId },
      {
        $set: {
          title: sanitizeText(oppData.title),
          company: sanitizeText(oppData.company),
          location: sanitizeText(oppData.location || 'Remote / Global'),
          salary: salaryStr,
          applicationUrl: safeUrl,
          postedAt: oppData.postedAt || new Date().toISOString(),
          skillbridgeMatchScore:
            typeof oppData.skillbridgeMatchScore === 'number' ? oppData.skillbridgeMatchScore : null,
          matchedSkills: oppData.matchedSkills || [],
          missingSkills: oppData.missingSkills || [],
          description: sanitizeText(oppData.description || ''),
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
   * Removes a saved opportunity.
   */
  async unsaveOpportunity(userId: string, externalId: string): Promise<boolean> {
    const res = await SavedOpportunity.deleteOne({ userId, externalId });
    return res.deletedCount > 0;
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
    if (!doc) throw new AppError('Saved opportunity not found.', 404);

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
  }> {
    const docs = await SavedOpportunity.find({ userId });
    return {
      savedCount: docs.filter((d) => d.status === 'saved').length,
      appliedCount: docs.filter((d) => d.status === 'applied').length,
      interviewingCount: docs.filter((d) => d.status === 'interviewing').length,
      offerCount: docs.filter((d) => d.status === 'offer').length,
      rejectedCount: docs.filter((d) => d.status === 'rejected').length,
      withdrawnCount: docs.filter((d) => d.status === 'withdrawn').length,
    };
  }
}

export default new OpportunityService();
