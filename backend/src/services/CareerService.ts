import { Career } from '../models/Career.js';
import { CareerRequirement } from '../models/CareerRequirement.js';
import { CareerMatch } from '../models/CareerMatch.js';
import { CareerSimilarity } from '../models/CareerSimilarity.js';
import mongoose from 'mongoose';
import logger from '../config/logger.js';
import { CAREER_TAXONOMY } from '../seed/careerTaxonomy.js';

class CareerService {
  /**
   * Fetches top matched careers for a user along with similar careers.
   */
  public async getUserMatches(userId: string) {
    const matches = await CareerMatch.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ matchScore: -1, confidence: -1, _id: 1 })
      .populate('careerId', 'title category description source')
      .limit(10); // Top 10

    // Fetch related careers for the top 3 matches
    const enrichedMatches = await Promise.all(
      matches.map(async match => {
        const matchObj = match.toObject();
        const similarities = await CareerSimilarity.find({ sourceCareerId: match.careerId })
          .sort({ similarityScore: -1 })
          .populate('targetCareerId', 'title category')
          .limit(3);

        return {
          ...matchObj,
          // The client keys and compares matches by `id`; toObject() only carries `_id`.
          id: String(matchObj._id),
          relatedCareers: similarities.map(s => ({
            career: s.targetCareerId,
            score: s.similarityScore
          }))
        };
      })
    );

    return enrichedMatches;
  }

  /**
   * Ensures the curated career taxonomy (careers, requirements, similarities) exists.
   */
  public async seedInitialTaxonomy(): Promise<void> {
    try {
      let createdCareers = 0;
      let createdRequirements = 0;
      const careerIdByTitle = new Map<string, mongoose.Types.ObjectId>();

      // Idempotent: only fills in what is missing, so it also repairs partially seeded databases
      for (const entry of CAREER_TAXONOMY) {
        let career = await Career.findOne({ title: entry.title });
        if (!career) {
          career = await Career.create({
            title: entry.title,
            category: entry.category,
            domain: entry.domain,
            description: entry.description,
            ...(entry.source ? { source: entry.source } : {})
          });
          createdCareers++;
        }
        careerIdByTitle.set(entry.title, career._id);

        const existingCount = await CareerRequirement.countDocuments({ careerId: career._id });
        if (existingCount === 0) {
          await CareerRequirement.insertMany(
            entry.requirements.map(r => ({
              careerId: career._id,
              skillName: r.skill,
              importance: r.importance,
              weight: r.weight
            }))
          );
          createdRequirements += entry.requirements.length;
        }
      }

      for (const entry of CAREER_TAXONOMY) {
        const sourceCareerId = careerIdByTitle.get(entry.title);
        for (const link of entry.similar) {
          const targetCareerId = careerIdByTitle.get(link.title);
          if (!sourceCareerId || !targetCareerId) continue;
          await CareerSimilarity.updateOne(
            { sourceCareerId, targetCareerId },
            { $setOnInsert: { similarityScore: link.score } },
            { upsert: true }
          );
        }
      }

      if (createdCareers > 0 || createdRequirements > 0) {
        logger.info(
          `Career taxonomy ensured: ${createdCareers} careers and ${createdRequirements} requirements added.`
        );
      }
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Failed to seed Career Taxonomy: ${error.message}`);
    }
  }
}

export default new CareerService();
