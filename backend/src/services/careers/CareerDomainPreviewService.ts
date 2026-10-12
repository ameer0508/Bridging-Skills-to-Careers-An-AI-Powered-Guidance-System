import mongoose from 'mongoose';
import UserSkill, { IUserSkill } from '../../models/UserSkill.js';
import type { ICareerRequirement } from '../../models/CareerRequirement.js';
import { CareerScoringEngine } from '../CareerScoringEngine.js';
import { CAREER_TAXONOMY } from '../../seed/careerTaxonomy.js';
import {
  CAREER_DOMAIN_CATALOGUE,
  CatalogueCareer,
  ONET_ACCESSED_ON,
  ONET_ATTRIBUTION,
  ONET_DATABASE_URL,
  ONET_LICENSE_URL,
  PROPOSED_LEXICON_SKILLS,
} from '../../seed/careerDomainCatalogue.js';
import { lookupSkill } from '../../utils/skillLexicon.js';

/**
 * Preview of the proposed career domains (E1). Read-only: it scores the caller's existing skill
 * evidence against the proposed roles with the same scoring function the live matching uses, and
 * stores nothing. The roles are not part of career matches, readiness, recommendations or
 * roadmaps until Agent A applies the taxonomy and lexicon patch (docs/E1_CAREER_DOMAINS.md).
 */

export type LexiconStatus = 'present' | 'proposed';

export const lexiconStatus = (skill: string): LexiconStatus => (lookupSkill(skill)?.name === skill ? 'present' : 'proposed');

const existingDomains = new Set(CAREER_TAXONOMY.map(c => c.domain));

export function catalogueView() {
  return {
    status: 'preview' as const,
    statusText:
      'Proposed roles. They are not yet part of your career matches, readiness, recommendations or roadmaps; they will be once they are added to the shared career taxonomy.',
    careers: CAREER_DOMAIN_CATALOGUE.map(c => ({
      ...c,
      newDomain: !existingDomains.has(c.domain),
      requirements: c.requirements.map(r => ({ ...r, lexicon: lexiconStatus(r.skill) })),
    })),
    proposedLexiconSkills: PROPOSED_LEXICON_SKILLS.map(s => s.name),
    source: { attribution: ONET_ATTRIBUTION, licenseUrl: ONET_LICENSE_URL, databaseUrl: ONET_DATABASE_URL, accessedOn: ONET_ACCESSED_ON },
  };
}

const asRequirements = (career: CatalogueCareer) =>
  career.requirements.map(r => ({ skillName: r.skill, importance: r.importance, weight: r.weight })) as unknown as ICareerRequirement[];

export function scoreCareers(userSkills: IUserSkill[]) {
  return CAREER_DOMAIN_CATALOGUE.map(career => {
    const result = CareerScoringEngine.calculateScore(asRequirements(career), userSkills);
    const unmatchable = career.requirements.filter(r => lexiconStatus(r.skill) === 'proposed').map(r => r.skill);
    return {
      title: career.title,
      domain: career.domain,
      score: result.totalScore,
      matchingSkills: result.matchingSkills,
      missingSkills: result.missingSkills,
      /** Proposed skills a resume cannot evidence yet, so they always count as missing here. */
      notYetRecognisable: unmatchable,
    };
  }).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

class CareerDomainPreviewService {
  async previewForUser(userId: string) {
    const skills = await UserSkill.find({ userId: new mongoose.Types.ObjectId(userId) }).populate('skillId');
    return {
      status: 'preview' as const,
      hasProfile: skills.length > 0,
      careers: scoreCareers(skills),
      caveats: [
        'A preview computed from your current skill evidence with the same scoring as your career matches. Nothing is saved, and it does not change your matches or readiness.',
        'Skills marked "not yet recognised" cannot be read from a resume until they are added to SkillBridge’s skill list, so they always count as missing here.',
        'A match score measures skill coverage against these requirements; it does not predict hiring.',
      ],
    };
  }
}

export default new CareerDomainPreviewService();
