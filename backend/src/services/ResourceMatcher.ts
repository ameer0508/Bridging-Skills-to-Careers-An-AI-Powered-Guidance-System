import { LearningResource } from '../models/LearningResource.js';
import { ProjectTemplate } from '../models/ProjectTemplate.js';
import { Certification } from '../models/Certification.js';
import { escapeRegExp, skillKeys } from '../utils/skillMatching.js';

/** Case-insensitive exact match on any accepted spelling of the skill (e.g. "AWS" / "Amazon Web Services (AWS)"). */
const skillRegex = (skillName: string): RegExp =>
  new RegExp(`^(${skillKeys(skillName).map(escapeRegExp).join('|')})$`, 'i');

export class ResourceMatcher {
  /**
   * Finds learning resources (courses, docs) that target a specific skill.
   */
  public static async matchLearningResources(skillName: string) {
    return await LearningResource.find({ targetSkills: { $regex: skillRegex(skillName) } }).limit(2);
  }

  /**
   * Finds hands-on projects that would build evidence for a specific skill.
   */
  public static async matchProjects(skillName: string) {
    return await ProjectTemplate.find({ targetSkills: { $regex: skillRegex(skillName) } }).limit(2);
  }

  /**
   * Finds certifications related to a specific skill.
   */
  public static async matchCertifications(skillName: string) {
    return await Certification.find({ targetSkills: { $regex: skillRegex(skillName) } }).limit(1);
  }
}

export default ResourceMatcher;
