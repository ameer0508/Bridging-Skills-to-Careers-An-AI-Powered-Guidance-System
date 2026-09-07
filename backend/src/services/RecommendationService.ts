import mongoose from 'mongoose';
import { Recommendation, RecommendationStatus } from '../models/Recommendation.js';
import { RecommendationHistory } from '../models/RecommendationHistory.js';
import { LearningResource } from '../models/LearningResource.js';
import { ProjectTemplate } from '../models/ProjectTemplate.js';
import { Certification } from '../models/Certification.js';
import logger from '../config/logger.js';

class RecommendationService {
  /**
   * Fetch user recommendations
   */
  public async getUserRecommendations(userId: string) {
    return await Recommendation.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ priorityScore: -1 })
      .populate('careerId', 'title category');
  }

  /**
   * Update feedback/status of a recommendation
   */
  public async updateRecommendationStatus(
    userId: string,
    recommendationId: string,
    status: RecommendationStatus
  ) {
    const rec = await Recommendation.findOne({
      _id: new mongoose.Types.ObjectId(recommendationId),
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!rec) throw new Error('Recommendation not found');

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
      const count = await LearningResource.countDocuments();
      if (count > 0) return; // Already seeded

      logger.info('Seeding initial Resource Catalogs...');

      await LearningResource.insertMany([
        {
          title: 'Docker for Beginners',
          provider: 'Official Docs',
          url: 'https://docs.docker.com/get-started/',
          targetSkills: ['Docker'],
          difficulty: 'Beginner',
          estimatedTime: '4 hours',
          type: 'Documentation'
        },
        {
          title: 'CI/CD Pipelines with GitHub Actions',
          provider: 'FreeCodeCamp',
          url: 'https://www.freecodecamp.org',
          targetSkills: ['CI/CD'],
          difficulty: 'Intermediate',
          estimatedTime: '6 hours',
          type: 'Course'
        },
        {
          title: 'Advanced React Patterns',
          provider: 'Frontend Masters',
          url: 'https://frontendmasters.com',
          targetSkills: ['React'],
          difficulty: 'Advanced',
          estimatedTime: '10 hours',
          type: 'Course'
        }
      ]);

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
