import {
  OpportunityProvider,
  OpportunitySearchQuery,
  CanonicalOpportunity,
  OpportunityProviderHealth,
} from './OpportunityProvider.js';
import env from '../../config/env.js';

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
        message: 'JSearch RapidAPI Key not configured in environment (RAPIDAPI_KEY / JSEARCH_API_KEY). Provider in sandbox mode.',
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

    // If API credentials are not set, return sandbox live opportunities
    if (!apiKey) {
      return this.getSandboxOpportunities(fullQuery);
    }

    try {
      const pageNum = query.page && query.page > 0 ? query.page : 1;
      let url = `https://jsearch.p.rapidapi.com/search-v2?query=${encodeURIComponent(fullQuery)}&page=${pageNum}&num_pages=1`;
      if (query.datePosted && ['all', 'today', '3days', 'week', 'month'].includes(query.datePosted)) {
        url += `&date_posted=${encodeURIComponent(query.datePosted)}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
        signal: controller.signal,
      });

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
        const title = String(item.job_title || 'Software Opportunity');
        const company = String(item.employer_name || 'Verified Employer');
        const description = sanitizeText(String(item.job_description || 'No description provided by employer.'));
        const jobCity = item.job_city ? String(item.job_city) : '';
        const jobCountry = item.job_country ? String(item.job_country) : '';
        const locationStr = jobCity ? `${jobCity}, ${jobCountry}` : 'Remote / Global';
        const isRemote = Boolean(item.job_is_remote);
        const employmentType = String(item.job_employment_type || 'FULL_TIME').toUpperCase();
        const minSalary = typeof item.job_min_salary === 'number' ? item.job_min_salary : undefined;
        const maxSalary = typeof item.job_max_salary === 'number' ? item.job_max_salary : undefined;
        const salaryObj = minSalary || maxSalary ? { min: minSalary, max: maxSalary, currency: 'USD', period: 'YEARLY' } : null;
        const postedAt = item.job_posted_at_timestamp ? new Date((item.job_posted_at_timestamp as number) * 1000).toISOString() : new Date().toISOString();
        const applicationUrl = sanitizeUrl(String(item.job_apply_link || item.job_google_link || ''));
        const sourceUrl = sanitizeUrl(String(item.job_google_link || ''));
        const requiredSkills = Array.isArray(item.job_required_skills)
          ? item.job_required_skills.map((s) => String(s))
          : [];

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
          applicationUrl: applicationUrl || 'https://jsearch.p.rapidapi.com',
          sourceUrl,
          skills: requiredSkills,
          fetchedAt: new Date().toISOString(),
        };
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown JSearch API error';
      // When API credentials are configured, do not substitute fake sandbox data on failure.
      // Rethrow to allow caller to handle honest provider failure state.
      throw new Error(`JSearch Provider Error: ${errorMsg}`);
    }
  }

  /**
   * Retrieves single opportunity by external ID.
   */
  async getById(externalId: string): Promise<CanonicalOpportunity | null> {
    const list = await this.search({ keywords: 'Software' });
    return list.find((item) => item.externalId === externalId) || null;
  }

  /**
   * Sandbox provider results when live API keys are pending.
   */
  private getSandboxOpportunities(searchQuery: string): CanonicalOpportunity[] {
    const now = new Date().toISOString();
    return [
      {
        externalId: 'live_opp_sandbox_01',
        provider: 'JSearch Provider (Sandbox Mode)',
        title: `Senior ${searchQuery} Lead`,
        company: 'CloudScale Infrastructure Systems',
        description: `Lead architecture and high-throughput microservices development for ${searchQuery} platforms. Requires TypeScript, React, Node.js, and API design.`,
        location: 'San Francisco, CA',
        remote: true,
        employmentType: 'FULL_TIME',
        salary: { min: 140000, max: 195000, currency: 'USD', period: 'YEARLY' },
        postedAt: now,
        applicationUrl: 'https://jsearch.p.rapidapi.com',
        sourceUrl: 'https://jsearch.p.rapidapi.com',
        skills: ['TypeScript', 'React', 'Node.js', 'FastAPI', 'System Design'],
        fetchedAt: now,
      },
      {
        externalId: 'live_opp_sandbox_02',
        provider: 'JSearch Provider (Sandbox Mode)',
        title: `${searchQuery} Systems Engineer`,
        company: 'OpenAI Ecosystem Partner',
        description: `Build scalable AI infrastructure and high-frequency data pipelines for ${searchQuery} workloads.`,
        location: 'New York, NY',
        remote: true,
        employmentType: 'FULL_TIME',
        salary: { min: 150000, max: 210000, currency: 'USD', period: 'YEARLY' },
        postedAt: now,
        applicationUrl: 'https://jsearch.p.rapidapi.com',
        sourceUrl: 'https://jsearch.p.rapidapi.com',
        skills: ['Python', 'FastAPI', 'Docker', 'Kubernetes', 'MongoDB'],
        fetchedAt: now,
      },
    ];
  }
}

export default JSearchProvider;
