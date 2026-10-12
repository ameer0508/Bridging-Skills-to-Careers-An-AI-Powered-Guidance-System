import {
  OpportunityProvider,
  OpportunitySearchQuery,
  CanonicalOpportunity,
  OpportunityProviderHealth,
} from './OpportunityProvider.js';
import env from '../../config/env.js';
import { searchSampleOpportunities } from './sampleOpportunities.js';
import { checkLiveCall, guardedFetch } from '../../config/costPolicy.js';

/**
 * Sanitizes external HTML text to prevent script execution / XSS / prompt injection.
 */
function sanitizeText(raw: string): string {
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

/**
 * Validates external application URLs ensuring http/https protocol.
 */
function sanitizeUrl(urlStr?: string): string {
  if (!urlStr) return '';
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    // Invalid URL format
  }
  return '';
}

/** The process environment (enable flags are not part of the parsed env schema) plus parsed values. */
const policyEnv = (envObj: Record<string, string>) => ({ ...process.env, ...envObj });

export class JSearchProvider implements OpportunityProvider {
  public readonly name = 'JSearch Provider';

  /**
   * Health check verifying API credentials configuration.
   */
  async healthCheck(): Promise<OpportunityProviderHealth> {
    const envObj = env as unknown as Record<string, string>;
    const apiKey = envObj.RAPIDAPI_KEY || envObj.JSEARCH_API_KEY;
    if (!apiKey) {
      return {
        status: 'PENDING_CREDS',
        provider: this.name,
        message: 'No live job provider key is configured (RAPIDAPI_KEY / JSEARCH_API_KEY). Showing built-in demo listings only.',
      };
    }
    // A key alone does not make the provider live: the zero-cost policy must clear it
    const decision = checkLiveCall('jsearch', policyEnv(envObj));
    if (!decision.allowed) {
      return {
        status: 'BLOCKED_BY_POLICY',
        provider: this.name,
        message: `Live job search is off under the zero-cost policy (${decision.reason}). Showing built-in demo listings only.`,
      };
    }
    return {
      status: 'UP',
      provider: this.name,
      message: 'JSearch API credentials active.',
    };
  }

  /**
   * Searches live external job opportunities.
   */
  async search(query: OpportunitySearchQuery): Promise<CanonicalOpportunity[]> {
    const envObj = env as unknown as Record<string, string>;
    const apiKey = envObj.RAPIDAPI_KEY || envObj.JSEARCH_API_KEY;
    const searchQuery = query.keywords || 'Software Engineer';
    const location = query.location || '';
    const fullQuery = location ? `${searchQuery} in ${location}` : searchQuery;

    // Without credentials, or while the zero-cost policy does not clear JSearch, only the
    // clearly labelled demo listings are available
    if (!apiKey || !checkLiveCall('jsearch', policyEnv(envObj)).allowed) {
      return searchSampleOpportunities(query);
    }

    try {
      const pageNum = query.page && query.page > 0 ? query.page : 1;
      let url = `https://jsearch.p.rapidapi.com/search-v2?query=${encodeURIComponent(fullQuery)}&page=${pageNum}&num_pages=1`;
      if (query.datePosted && ['all', 'today', '3days', 'week', 'month'].includes(query.datePosted)) {
        url += `&date_posted=${encodeURIComponent(query.datePosted)}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await guardedFetch('jsearch', url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
        signal: controller.signal,
      }, policyEnv(envObj));

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`JSearch API HTTP ${response.status}: ${response.statusText}`);
      }

      const body = (await response.json()) as {
        data?: Array<Record<string, unknown>> | { jobs?: Array<Record<string, unknown>> };
      };
      const results = Array.isArray(body.data)
        ? body.data
        : body.data?.jobs || [];

      return results.map((item, idx) => {
        const externalId = String(item.job_id || `jsearch_${idx}`);
        const title = String(item.job_title || 'Untitled role');
        const company = String(item.employer_name || 'Employer not stated');
        const description = sanitizeText(String(item.job_description || 'No description provided by employer.'));
        const jobCity = item.job_city ? String(item.job_city) : '';
        const jobCountry = item.job_country ? String(item.job_country) : '';
        const locationStr = [jobCity, jobCountry].filter(Boolean).join(', ') || 'Location not stated';
        const isRemote = Boolean(item.job_is_remote);
        const employmentType = String(item.job_employment_type || 'NOT_STATED').toUpperCase();
        const minSalary = typeof item.job_min_salary === 'number' ? item.job_min_salary : undefined;
        const maxSalary = typeof item.job_max_salary === 'number' ? item.job_max_salary : undefined;
        // Currency and period are only reported when the provider states them
        const salaryObj = minSalary || maxSalary
          ? {
              min: minSalary,
              max: maxSalary,
              currency: item.job_salary_currency ? String(item.job_salary_currency) : undefined,
              period: item.job_salary_period ? String(item.job_salary_period).toUpperCase() : undefined,
            }
          : null;
        // Null rather than "now" when the provider gives no date, so freshness is never invented
        const postedAt = typeof item.job_posted_at_timestamp === 'number'
          ? new Date(item.job_posted_at_timestamp * 1000).toISOString()
          : null;
        const applicationUrl = sanitizeUrl(String(item.job_apply_link || item.job_google_link || ''));
        const sourceUrl = sanitizeUrl(String(item.job_google_link || ''));
        const requiredSkills = Array.isArray(item.job_required_skills)
          ? item.job_required_skills.map((s) => String(s))
          : [];
        const highlights = (item.job_highlights || {}) as Record<string, unknown>;
        const qualifications = Array.isArray(highlights.Qualifications)
          ? highlights.Qualifications.map((q) => sanitizeText(String(q)))
          : [];

        // Safe public destination URL - never direct the user's browser to the raw RapidAPI backend endpoint
        const fallbackSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(`${title} ${company} jobs`)}`;
        const safeApplicationUrl = applicationUrl || sourceUrl || fallbackSearchUrl;
        const safeSourceUrl = sourceUrl || safeApplicationUrl;

        return {
          externalId,
          provider: 'JSearch API',
          title,
          company,
          description,
          location: locationStr,
          remote: isRemote,
          employmentType,
          salary: salaryObj,
          postedAt,
          applicationUrl: safeApplicationUrl,
          sourceUrl: safeSourceUrl,
          skills: requiredSkills,
          qualifications,
          fetchedAt: new Date().toISOString(),
        };
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown JSearch API error';
      // When API credentials are configured, do not substitute fake sandbox data on failure.
      // Rethrow to allow caller to handle honest provider failure state.
      throw new Error(`JSearch Provider Error: ${errorMsg}`, { cause: err });
    }
  }

  /**
   * Retrieves single opportunity by external ID.
   */
  async getById(externalId: string): Promise<CanonicalOpportunity | null> {
    // JSearch offers no stable lookup by id on this plan; callers use recent search results
    void externalId;
    return null;
  }

  /** Demo listings, as returned when no live key is configured. */
  getSandboxOpportunities(searchQuery: string): CanonicalOpportunity[] {
    return searchSampleOpportunities({ keywords: searchQuery });
  }
}

export default JSearchProvider;
