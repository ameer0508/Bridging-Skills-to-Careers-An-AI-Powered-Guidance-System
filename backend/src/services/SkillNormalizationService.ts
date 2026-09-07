import axios from 'axios';
import { Skill, ISkill } from '../models/Skill.js';
import { SkillRelationship } from '../models/SkillRelationship.js';
import logger from '../config/logger.js';

interface NormalizedSkillData {
  raw_name: string;
  canonical_name: string;
  category: string;
  aliases: string[];
  relationships: Array<{
    related_skill: string;
    type: string;
  }>;
}

class SkillNormalizationService {
  private aiServiceUrl: string;

  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Takes a list of raw skill strings, checks cache (DB), and normalizes unknown skills via AI.
   * Returns a map of rawName -> canonical ISkill document.
   */
  async normalizeSkills(rawSkills: string[]): Promise<Map<string, ISkill>> {
    const skillMap = new Map<string, ISkill>();
    const unknownRawSkills: string[] = [];

    // 1. Check DB for exact matches on canonicalName or aliases (case-insensitive)
    for (const raw of rawSkills) {
      const trimmed = raw.trim();
      if (!trimmed) continue;

      const regex = new RegExp(`^${trimmed}$`, 'i');
      const existing = await Skill.findOne({
        $or: [{ canonicalName: regex }, { aliases: regex }]
      });

      if (existing) {
        skillMap.set(trimmed, existing);
      } else {
        unknownRawSkills.push(trimmed);
      }
    }

    if (unknownRawSkills.length === 0) {
      return skillMap;
    }

    // 2. Call AI Service for unknown skills
    logger.info(`Sending ${unknownRawSkills.length} unknown skills to AI for normalization.`);
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/skills/normalize`, {
        skills: unknownRawSkills
      });

      if (response.data && response.data.normalized_skills) {
        const normalizedDataList: NormalizedSkillData[] = response.data.normalized_skills;

        for (const data of normalizedDataList) {
          // Upsert the Canonical Skill
          let skill = await Skill.findOne({ canonicalName: data.canonical_name });

          if (!skill) {
            skill = await Skill.create({
              canonicalName: data.canonical_name,
              category: data.category,
              aliases: [data.raw_name, ...data.aliases].filter((v, i, a) => a.indexOf(v) === i), // Unique aliases
              isActive: true
            });
          } else {
            // Add raw name to aliases if not present
            if (!skill.aliases.includes(data.raw_name)) {
              skill.aliases.push(data.raw_name);
              await skill.save();
            }
          }

          skillMap.set(data.raw_name, skill);

          // Handle relationships asynchronously (don't block the map return)
          this.buildRelationships(skill, data.relationships).catch(err => {
            logger.error(
              `Failed to build relationships for ${skill!.canonicalName}: ${err.message}`
            );
          });
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to normalize skills via AI', err.message);
      // We don't throw here to allow partial success (cached skills) to proceed, but we log the error.
    }

    return skillMap;
  }

  /**
   * Helper to build relationships between a source skill and its AI-determined targets.
   * Creates the target skills if they don't exist (with a generic 'Unknown' category).
   */
  private async buildRelationships(
    sourceSkill: ISkill,
    relationships: NormalizedSkillData['relationships']
  ) {
    for (const rel of relationships) {
      // Find or create target skill
      let targetSkill = await Skill.findOne({ canonicalName: rel.related_skill });
      if (!targetSkill) {
        targetSkill = await Skill.create({
          canonicalName: rel.related_skill,
          category: 'Uncategorized', // Will be updated if explicitly normalized later
          aliases: [],
          isActive: true
        });
      }

      // Upsert Relationship
      const filter = {
        sourceSkillId: sourceSkill.id,
        targetSkillId: targetSkill.id,
        relationshipType: rel.type
      };

      await SkillRelationship.findOneAndUpdate(filter, filter, { upsert: true });
    }
  }
}

export default new SkillNormalizationService();
