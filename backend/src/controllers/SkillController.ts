import { Request, Response, NextFunction } from 'express';
import UserSkillService from '../services/UserSkillService.js';
import { SkillRelationship } from '../models/SkillRelationship.js';
import { AppError } from '../middlewares/errorHandler.js';
import { ISkill } from '../models/Skill.js';

class SkillController {
  /**
   * Retrieves all skills for the authenticated user, grouped by category.
   */
  getMine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('Authentication is required.', 401);
      }

      const userSkills = await UserSkillService.getUserSkills(userId);

      const grouped: Record<string, unknown[]> = {};

      for (const us of userSkills) {
        const skill = us.skillId as unknown as ISkill; // populated canonical skill
        if (!skill) continue;

        const category = skill.category || 'Uncategorized';
        if (!grouped[category]) grouped[category] = [];

        grouped[category].push({
          id: us.id,
          skillId: skill.id,
          name: skill.canonicalName,
          evidenceScore: us.evidenceScore,
          evidences: us.evidences,
          aliases: skill.aliases
        });
      }

      res.status(200).json({
        success: true,
        data: {
          categories: grouped,
          totalSkills: userSkills.length
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieves the global knowledge graph edges to visualize relationships.
   */
  getGraph = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // In a real production app, you might limit this to the user's active sub-graph
      // For now, we return all relationships (capped to avoid massive payload)
      const relationships = await SkillRelationship.find()
        .populate('sourceSkillId', 'canonicalName category')
        .populate('targetSkillId', 'canonicalName category')
        .limit(1000);

      const formatted = relationships
        .map(rel => ({
          source: (rel.sourceSkillId as unknown as ISkill)?.canonicalName,
          target: (rel.targetSkillId as unknown as ISkill)?.canonicalName,
          type: rel.relationshipType
        }))
        .filter(r => r.source && r.target);

      res.status(200).json({
        success: true,
        data: {
          edges: formatted
        }
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new SkillController();
