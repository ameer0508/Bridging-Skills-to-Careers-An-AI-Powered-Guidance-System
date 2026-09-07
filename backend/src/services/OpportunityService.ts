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

    // Fetch user skills from MongoDB if connected
    let userSkillNames: string[] = [];
    let targetTitle = '';
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const userObjId = new mongoose.Types.ObjectId(userId);
        const userSkillsDocs = await UserSkill.find({ userId: userObjId }).populate<{ skillId: { name: string } }>('skillId');
        userSkillNames = userSkillsDocs
          .map((us) => (us.skillId && typeof us.skillId === 'object' ? us.skillId.name : null))
          .filter((n): n is string => Boolean(n));

        const topCareerMatch = await CareerMatch.findOne({ userId: userObjId }).sort({ matchScore: -1 }).populate<{ careerId: { title: string } }>('careerId');
        targetTitle = topCareerMatch?.careerId?.title || '';
      } catch {
        // Fallback to empty skill matrix if database query fails
      }
    }

    // Deriving search keyword query if not provided
    const searchKeyword = query.keywords || targetTitle || 'Software Engineer';
    let canonicalOpportunities: CanonicalOpportunity[] = [];
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

    // Enrich opportunities with candidate SkillBridge match telemetry
    const enrichedList: EnrichedOpportunity[] = deduplicatedList.map((opp) => {
      const oppSkills = opp.skills.length > 0 ? opp.skills : ['TypeScript', 'React', 'Node.js', 'Python', 'FastAPI'];
      
      const matchedSkills = userSkillNames.filter((sk) =>
        oppSkills.some((req) => req.toLowerCase().includes(sk.toLowerCase()) || sk.toLowerCase().includes(req.toLowerCase()))
      );

      const missingSkills = oppSkills.filter(
        (req) => !userSkillNames.some((sk) => sk.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(sk.toLowerCase()))
      );

      const totalReqs = Math.max(1, matchedSkills.length + missingSkills.length);
      const calculatedScore = Math.min(99, Math.max(65, Math.round((matchedSkills.length / totalReqs) * 100)));

      const matchExplanation = matchedSkills.length > 0
        ? `Matched based on verified skills (${matchedSkills.slice(0, 3).join(', ')}) matching target role requirements.`
        : `Matched target role pathway for ${opp.title} with grounded readiness alignment.`;

      return {
        ...opp,
        title: sanitizeText(opp.title),
        company: sanitizeText(opp.company),
        location: sanitizeText(opp.location),
        description: sanitizeText(opp.description),
        applicationUrl: sanitizeUrl(opp.applicationUrl) || 'https://jsearch.p.rapidapi.com',
        skillbridgeMatchScore: calculatedScore,
        matchedSkills: matchedSkills.length > 0 ? matchedSkills : userSkillNames.slice(0, 2),
        missingSkills: missingSkills.slice(0, 3),
        matchExplanation,
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
    // Default to match score
    return sorted.sort((a, b) => b.skillbridgeMatchScore - a.skillbridgeMatchScore);
  }

  /**
   * Retrieves detailed opportunity by external ID.
   */
  async getOpportunityById(userId: string, externalId: string): Promise<EnrichedOpportunity | null> {
    const { opportunities } = await this.searchOpportunities(userId, { keywords: 'Software' });
    return opportunities.find((opp) => opp.externalId === externalId) || null;
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
          skillbridgeMatchScore: oppData.skillbridgeMatchScore || 85,
          matchedSkills: oppData.matchedSkills || [],
          missingSkills: oppData.missingSkills || [],
          description: sanitizeText(oppData.description || ''),
          savedAt: new Date(),
        },
        $setOnInsert: {
          status: 'saved',
          notes: '',
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

    const updateObj: Record<string, unknown> = { status };
    if (typeof notes === 'string') updateObj.notes = sanitizeText(notes);

    const doc = await SavedOpportunity.findOneAndUpdate(
      { userId, externalId },
      { $set: updateObj },
      { new: true }
    );

    if (!doc) throw new AppError('Saved opportunity not found.', 404);
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
