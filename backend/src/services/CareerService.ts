import { Career } from '../models/Career.js';
import { CareerRequirement } from '../models/CareerRequirement.js';
import { CareerMatch } from '../models/CareerMatch.js';
import { CareerSimilarity } from '../models/CareerSimilarity.js';
import mongoose from 'mongoose';
import logger from '../config/logger.js';

class CareerService {
  /**
   * Fetches top matched careers for a user along with similar careers.
   */
  public async getUserMatches(userId: string) {
    const matches = await CareerMatch.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ matchScore: -1 })
      .populate('careerId', 'title category description')
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
   * Seed a basic taxonomy if the database is empty.
   */
  public async seedInitialTaxonomy(): Promise<void> {
    try {
      const count = await Career.countDocuments();
      if (count > 0) return; // Already seeded

      logger.info('Seeding initial Career Taxonomy...');

      // 1. Create Careers
      const se = await Career.create({
        title: 'Software Engineer',
        category: 'Engineering',
        description: 'Builds and maintains software systems.'
      });
      const fe = await Career.create({
        title: 'Frontend Engineer',
        category: 'Engineering',
        description: 'Specializes in user interfaces and client-side logic.'
      });
      const be = await Career.create({
        title: 'Backend Engineer',
        category: 'Engineering',
        description: 'Focuses on server-side logic, databases, and APIs.'
      });
      const ds = await Career.create({
        title: 'Data Scientist',
        category: 'Data',
        description: 'Analyzes data and builds ML models.'
      });

      // 2. Create Requirements
      const reqs = [
        // Software Engineer
        { careerId: se._id, skillName: 'JavaScript', importance: 'required', weight: 4 },
        { careerId: se._id, skillName: 'Python', importance: 'preferred', weight: 4 },
        { careerId: se._id, skillName: 'Git', importance: 'required', weight: 3 },
        // Frontend Engineer
        { careerId: fe._id, skillName: 'JavaScript', importance: 'required', weight: 5 },
        { careerId: fe._id, skillName: 'React', importance: 'preferred', weight: 5 },
        { careerId: fe._id, skillName: 'CSS', importance: 'required', weight: 4 },
        // Backend Engineer
        { careerId: be._id, skillName: 'Node.js', importance: 'required', weight: 5 },
        { careerId: be._id, skillName: 'SQL', importance: 'required', weight: 4 },
        { careerId: be._id, skillName: 'Docker', importance: 'preferred', weight: 3 },
        // Data Scientist
        { careerId: ds._id, skillName: 'Python', importance: 'required', weight: 5 },
        { careerId: ds._id, skillName: 'SQL', importance: 'required', weight: 4 },
        { careerId: ds._id, skillName: 'Machine Learning', importance: 'preferred', weight: 5 }
      ];

      await CareerRequirement.insertMany(reqs);

      // 3. Create Similarities
      await CareerSimilarity.create({
        sourceCareerId: se._id,
        targetCareerId: be._id,
        similarityScore: 80
      });
      await CareerSimilarity.create({
        sourceCareerId: be._id,
        targetCareerId: se._id,
        similarityScore: 80
      });
      await CareerSimilarity.create({
        sourceCareerId: se._id,
        targetCareerId: fe._id,
        similarityScore: 70
      });
      await CareerSimilarity.create({
        sourceCareerId: fe._id,
        targetCareerId: se._id,
        similarityScore: 70
      });

      logger.info('Successfully seeded Career Taxonomy.');
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('Failed to seed Career Taxonomy:', error.message);
    }
  }
}

export default new CareerService();
