import mongoose from 'mongoose';
import Career from '../../models/Career.js';
import CareerMatch from '../../models/CareerMatch.js';
import { CAREER_TAXONOMY } from '../../seed/careerTaxonomy.js';
import {
  CAREER_DOMAIN_CATALOGUE,
  E1_LEXICON_SKILLS,
  ONET_ACCESSED_ON,
  ONET_ATTRIBUTION,
  ONET_DATABASE_URL,
  ONET_LICENSE_URL,
} from '../../seed/careerDomainCatalogue.js';

/**
 * The careers added with E1 and where their requirements come from. They are part of the shared
 * taxonomy, so the user's figures here are the same stored career matches shown everywhere else.
 */

const E1_TITLES = CAREER_DOMAIN_CATALOGUE.map(c => c.title);
/** Domains of the original fourteen careers, to tell which domains E1 added. */
const ORIGINAL_DOMAINS = new Set(CAREER_TAXONOMY.filter(c => !c.source).map(c => c.domain));

export const SOURCE_SCOPE_NOTE =
  'The requirements are informed by O*NET, which describes occupations in the United States. They are a skills baseline, not a measure of hiring demand, pay or job availability in India.';

export function catalogueView() {
  return {
    status: 'integrated' as const,
    statusText: 'These careers are part of your career matches, readiness, recommendations and roadmaps.',
    scopeNote: SOURCE_SCOPE_NOTE,
    careers: CAREER_DOMAIN_CATALOGUE.map(c => ({ ...c, newDomain: !ORIGINAL_DOMAINS.has(c.domain) })),
    addedSkills: E1_LEXICON_SKILLS,
    source: { attribution: ONET_ATTRIBUTION, licenseUrl: ONET_LICENSE_URL, databaseUrl: ONET_DATABASE_URL, accessedOn: ONET_ACCESSED_ON },
  };
}

class CareerDomainService {
  /** The caller's stored matches for these careers (the same records as /careers/matches). */
  async matchesForUser(userId: string) {
    const careers = await Career.find({ title: { $in: E1_TITLES } }).select('_id title domain').lean();
    const matches = await CareerMatch.find({ userId: new mongoose.Types.ObjectId(userId), careerId: { $in: careers.map(c => c._id) } }).lean();
    const byCareer = new Map(matches.map(m => [String(m.careerId), m]));
    return {
      careers: careers
        .map(c => {
          const m = byCareer.get(String(c._id));
          return {
            careerId: String(c._id),
            title: c.title,
            domain: c.domain,
            matchScore: m ? m.matchScore : null,
            matchingSkills: m?.matchingSkills ?? [],
            missingSkills: m?.missingSkills ?? [],
          };
        })
        .sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1) || a.title.localeCompare(b.title)),
      notes: [
        'These are your stored career matches, computed with the same scoring as every other career.',
        'No figure yet means your matches have not been recalculated since these careers were added, or you have no skill evidence yet.',
        'A match score measures skill coverage against these requirements; it does not predict hiring.',
      ],
    };
  }
}

export default new CareerDomainService();
