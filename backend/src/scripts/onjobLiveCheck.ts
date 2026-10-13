/**
 * One real read of OnJob.io's public jobs feed through the production code path, for the
 * operator: `npx tsx src/scripts/onjobLiveCheck.ts` with SKILLBRIDGE_ENABLE_ONJOB=true and
 * SKILLBRIDGE_ONJOB_FEED_TERMS_ACCEPTED=true. Prints, per SkillBridge career, which live India
 * listings the comparison would show. Stores nothing.
 */
import { OnJobLiveListingsService } from '../services/market/OnJobLiveListings.js';
import { CAREER_TAXONOMY } from '../seed/careerTaxonomy.js';
import { CAREER_DOMAIN_CATALOGUE } from '../seed/careerDomainCatalogue.js';

const careers = [...CAREER_TAXONOMY, ...CAREER_DOMAIN_CATALOGUE].map(c => ({ id: c.title, title: c.title }));
const service = new OnJobLiveListingsService();
const policy = service.policy();
if (!policy.allowed) {
  console.log(JSON.stringify({ allowed: false, reason: policy.reason, message: policy.message }));
  process.exit(1);
}
const started = Date.now();
const result = await service.forCareers(careers);
const rows = [...result.entries()].map(([title, r]) => ({
  career: title,
  state: r.state,
  shown: r.listings.length,
  newest: r.listings[0] ? `${r.listings[0].title} | ${r.listings[0].employer} | ${r.listings[0].location} | ${r.listings[0].postedAt?.slice(0, 10) ?? 'undated'}` : null,
}));
console.log(JSON.stringify({ retrievedAt: [...result.values()][0]?.retrievedAt, seconds: (Date.now() - started) / 1000, rows }, null, 1));
