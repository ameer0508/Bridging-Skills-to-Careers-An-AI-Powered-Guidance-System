import mongoose from 'mongoose';
import { Recommendation, RecommendationStatus } from '../models/Recommendation.js';
import { RecommendationHistory } from '../models/RecommendationHistory.js';
import { LearningResource } from '../models/LearningResource.js';
import { ProjectTemplate } from '../models/ProjectTemplate.js';
import { Certification } from '../models/Certification.js';
import logger from '../config/logger.js';
import { LEARNING_RESOURCES } from '../seed/learningResources.js';
import { AppError } from '../middlewares/errorHandler.js';

class RecommendationService {
  /**
   * Fetch user recommendations
   */
  public async getUserRecommendations(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const docs = await Recommendation.find({ userId: userObjectId })
      .sort({ priorityScore: -1 })
      .populate<{ careerId: { _id: mongoose.Types.ObjectId; title: string; category?: string } | null }>('careerId', 'title category');

    // The user's primary career: the role chosen in their profile when it is one of their
    // matches, otherwise their best match. Its recommendations are listed first so the top
    // action never argues from a different career than the one the user is aiming for.
    const { CareerMatch } = await import('../models/CareerMatch.js');
    const { User } = await import('../models/User.js');
    const matches = await CareerMatch.find({ userId: userObjectId })
      .sort({ matchScore: -1, confidence: -1, _id: 1 })
      .populate<{ careerId: { _id: mongoose.Types.ObjectId; title: string } | null }>('careerId', 'title');
    const targetRole = ((await User.findById(userObjectId).select('targetRole'))?.targetRole || '').trim().toLowerCase();
    const valid = matches.filter(m => m.careerId);
    const primary = (targetRole && valid.find(m => m.careerId!.title.toLowerCase() === targetRole)) || valid[0];
    const primaryCareerId = primary?.careerId?._id.toString() ?? null;

    const withFlag = docs.map(doc => ({
      ...doc.toObject(),
      isPrimaryCareer: primaryCareerId !== null && doc.careerId?._id.toString() === primaryCareerId,
    }));
    // Stable: primary-career items first, each group still ordered by priority
    return [...withFlag.filter(r => r.isPrimaryCareer), ...withFlag.filter(r => !r.isPrimaryCareer)];
  }

  /**
   * Update feedback/status of a recommendation
   */
  public async updateRecommendationStatus(
    userId: string,
    recommendationId: string,
    status: RecommendationStatus
  ) {
    if (!mongoose.Types.ObjectId.isValid(recommendationId)) {
      throw new AppError('Recommendation not found', 404, 'RECOMMENDATION_NOT_FOUND');
    }
    const rec = await Recommendation.findOne({
      _id: new mongoose.Types.ObjectId(recommendationId),
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!rec) throw new AppError('Recommendation not found', 404, 'RECOMMENDATION_NOT_FOUND');

    const previousStatus = rec.status;
    rec.status = status;
    await rec.save();

    await RecommendationHistory.create({
      userId: new mongoose.Types.ObjectId(userId),
      recommendationId: rec._id,
      previousStatus,
      newStatus: status
    });

    return rec;
  }

  /**
   * Seed a basic catalog of resources to match against
   */
  public async seedInitialResources(): Promise<void> {
    try {
      // Idempotent: add any curated resource that is not present yet (matched by URL)
      let added = 0;
      for (const resource of LEARNING_RESOURCES) {
        const result = await LearningResource.updateOne(
          { url: resource.url },
          { $setOnInsert: { ...resource, estimatedTime: 'Self-paced' } },
          { upsert: true }
        );
        if (result.upsertedCount > 0) added++;
      }
      if (added > 0) logger.info(`Added ${added} curated learning resources.`);

      if ((await ProjectTemplate.countDocuments()) > 0) return; // Templates already seeded

      await ProjectTemplate.insertMany([
        {
          title: 'Containerized REST API',
          description:
            'Build a Node.js REST API and containerize it using Docker and Docker Compose.',
          targetSkills: ['Docker', 'Node.js', 'REST API'],
          difficulty: 'Intermediate',
          estimatedTime: '12 hours',
          expectedOutcome: 'Working Dockerized API'
        },
        {
          title: 'Automated CI/CD Deployment',
          description:
            'Setup a GitHub Actions pipeline that lints, tests, and deploys code automatically.',
          targetSkills: ['CI/CD', 'Git'],
          difficulty: 'Intermediate',
          estimatedTime: '8 hours',
          expectedOutcome: 'Automated deployment workflow'
        }
      ]);

      await Certification.insertMany([
        {
          title: 'AWS Certified Solutions Architect - Associate',
          provider: 'Amazon Web Services',
          targetSkills: ['AWS', 'Cloud Architecture'],
          difficulty: 'Intermediate',
          estimatedTime: '2 months',
          url: 'https://aws.amazon.com/certification/'
        }
      ]);

      logger.info('Successfully seeded Resource Catalogs.');
    } catch (err: unknown) {
      const error = err as Error;
      logger.error('Failed to seed Resource Catalogs:', error.message);
    }
  }
}

export default new RecommendationService();
