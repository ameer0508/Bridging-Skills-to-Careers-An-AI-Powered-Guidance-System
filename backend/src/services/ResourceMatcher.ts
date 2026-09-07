import { LearningResource } from '../models/LearningResource.js';
import { ProjectTemplate } from '../models/ProjectTemplate.js';
import { Certification } from '../models/Certification.js';

export class ResourceMatcher {
  /**
   * Finds learning resources mapping to a specific gap skill.
   */
  public static async matchLearningResources(skillName: string) {
    // Exact or partial match using regex on targetSkills array
    const regex = new RegExp(`^${skillName}$`, 'i');
    return await LearningResource.find({ targetSkills: { $regex: regex } }).limit(2);
  }

  /**
   * Finds project templates mapping to a specific gap skill.
   */
  public static async matchProjects(skillName: string) {
    const regex = new RegExp(`^${skillName}$`, 'i');
    return await ProjectTemplate.find({ targetSkills: { $regex: regex } }).limit(2);
  }

  /**
   * Finds certifications mapping to a specific gap skill.
   */
  public static async matchCertifications(skillName: string) {
    const regex = new RegExp(`^${skillName}$`, 'i');
    return await Certification.find({ targetSkills: { $regex: regex } }).limit(1);
  }
}

export default ResourceMatcher;
