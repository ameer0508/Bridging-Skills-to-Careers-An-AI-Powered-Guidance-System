import mongoose from 'mongoose';
import { GapAnalysis, IGapItem } from '../models/GapAnalysis.js';
import { Recommendation } from '../models/Recommendation.js';
import PriorityCalculator from './PriorityCalculator.js';
import ResourceMatcher from './ResourceMatcher.js';
import logger from '../config/logger.js';
import { withUserLock } from '../utils/userLock.js';

export class RecommendationEngine {
  /**
   * Generates recommendations based on the user's latest gap analysis for all matched careers.
   */
  public generateForUser(userId: string): Promise<void> {
    return withUserLock(`recommendations:${userId}`, () => this.runGeneration(userId));
  }

  private async runGeneration(userId: string): Promise<void> {
    try {
      logger.info(`Starting Recommendation Generation for user ${userId}`);

      const gaps = await GapAnalysis.find({ userId: new mongoose.Types.ObjectId(userId) });
      const newRecommendations = [];

      // Wipe active, unconverted recommendations (refresh) to avoid duplicates
      await Recommendation.deleteMany({
        userId: new mongoose.Types.ObjectId(userId),
        status: 'active'
      });

      for (const gapAnalysis of gaps) {
        // Analyze Critical Gaps first
        for (const gap of gapAnalysis.criticalGaps) {
          const recs = await this.buildRecommendationsForGap(
            userId,
            gapAnalysis.careerId.toString(),
            gap,
            true
          );
          newRecommendations.push(...recs);
        }

        // Analyze Weak Areas next
        for (const gap of gapAnalysis.weakAreas) {
          const recs = await this.buildRecommendationsForGap(
            userId,
            gapAnalysis.careerId.toString(),
            gap,
            false
          );
          newRecommendations.push(...recs);
        }

        // If they have strengths but a low overall readiness, maybe recommend Resume Improvements
        // (Assuming if they have the skill, they just need to showcase it better, though our evidence score
        // already accounts for resume sections. Just a conceptual demonstration.)
        if (gapAnalysis.strengthAreas.length > 0) {
          const strength = gapAnalysis.strengthAreas[0]; // Pick their top strength
          const { priorityScore, priority } = PriorityCalculator.calculate(
            40,
            'Resume Improvements'
          );
          newRecommendations.push({
            userId: new mongoose.Types.ObjectId(userId),
            careerId: gapAnalysis.careerId,
            category: 'Resume Improvements',
            title: `Highlight ${strength.skillName} in your Executive Summary`,
            description: `You have strong evidence for ${strength.skillName}. Make sure it is highly visible at the top of your resume to catch recruiters' eyes.`,
            priority,
            priorityScore,
            reason: strength.reason,
            impact: 40,
            difficulty: 'Beginner',
            estimatedTime: '30 mins',
            dependencies: [],
            confidence: 90,
            targetSkill: strength.skillName
          });
        }
      }

      // If user has no existing gap analysis, generate foundational high-leverage recommendations
      if (newRecommendations.length === 0) {
        logger.info(`No specific gap analysis found for user ${userId}. Generating foundational strategic recommendations.`);

        const Career = (await import('../models/Career.js')).default;
        const defaultCareer = await Career.findOne();
        const careerId = defaultCareer?._id || new mongoose.Types.ObjectId();

        newRecommendations.push(
          {
            userId: new mongoose.Types.ObjectId(userId),
            careerId,
            category: 'Projects',
            type: 'project',
            title: 'Build Hands-On Project: Containerized REST API & Microservice Mesh',
            description: 'Design and deploy a scalable microservices architecture using Node.js/Python, Docker container orchestration, and automated API gateway routing.',
            priority: 'Highest',
            priorityScore: 94,
            reason: 'Hands-on architectural capstones provide the strongest verified proof of seniority for tech hiring managers.',
            impact: 35,
            difficulty: 'Intermediate',
            estimatedTime: '12 hours',
            dependencies: ['Container fundamentals', 'REST API design'],
            confidence: 95,
            actionType: 'Project',
            targetSkill: 'Docker & Microservices',
            status: 'active'
          },
          {
            userId: new mongoose.Types.ObjectId(userId),
            careerId,
            category: 'Learning Resources',
            type: 'course',
            title: 'Learn CI/CD Automation: GitHub Actions & Cloud Delivery',
            description: 'Master enterprise deployment pipelines that automatically lint, test, containerize, and ship software with zero-downtime releases.',
            priority: 'High',
            priorityScore: 88,
            reason: 'Automated delivery pipelines are required across 85% of modern software engineering postings.',
            impact: 28,
            difficulty: 'Intermediate',
            estimatedTime: '6 hours',
            dependencies: ['Git branching workflows'],
            confidence: 92,
            actionLink: 'https://docs.github.com/en/actions',
            actionType: 'Course',
            targetSkill: 'CI/CD Pipelines',
            status: 'active'
          },
          {
            userId: new mongoose.Types.ObjectId(userId),
            careerId,
            category: 'Certifications',
            type: 'certification',
            title: 'Get Certified: AWS Certified Solutions Architect - Associate',
            description: 'Validate cloud infrastructure competencies including VPC networking, S3 security policies, ECS clusters, and cost-effective scaling.',
            priority: 'High',
            priorityScore: 82,
            reason: 'Official cloud credentials dramatically elevate recruiter search visibility and profile shortlist conversion.',
            impact: 30,
            difficulty: 'Intermediate',
            estimatedTime: '2 months',
            dependencies: ['Basic cloud concepts'],
            confidence: 88,
            actionLink: 'https://aws.amazon.com/certification/',
            actionType: 'Certification',
            targetSkill: 'Cloud Architecture (AWS)',
            status: 'active'
          },
          {
            userId: new mongoose.Types.ObjectId(userId),
            careerId,
            category: 'Learning Resources',
            type: 'course',
            title: 'Deep Dive: Advanced System Architecture & Scalability Patterns',
            description: 'Explore distributed caching, message queues, rate limiting, and database sharding techniques used at high scale.',
            priority: 'High',
            priorityScore: 78,
            reason: 'System architecture questions constitute 50% of senior and staff level technical interview assessments.',
            impact: 22,
            difficulty: 'Advanced',
            estimatedTime: '10 hours',
            dependencies: ['Backend systems'],
            confidence: 90,
            actionType: 'Course',
            targetSkill: 'System Design',
            status: 'active'
          },
          {
            userId: new mongoose.Types.ObjectId(userId),
            careerId,
            category: 'Resume Improvements',
            type: 'resume_improvement',
            title: 'Highlight System Design & Cloud Deliverables in Executive Summary',
            description: 'Restructure your top resume summary to prominently showcase containerization, microservice orchestration, and measurable business impact.',
            priority: 'Medium',
            priorityScore: 70,
            reason: 'ATS scanners and technical recruiters allocate 6-8 seconds to initial executive summary evaluations.',
            impact: 20,
            difficulty: 'Beginner',
            estimatedTime: '30 mins',
            dependencies: [],
            confidence: 85,
            actionType: 'Resume Optimization',
            targetSkill: 'Resume Formatting',
            status: 'active'
          }
        );
      }

      if (newRecommendations.length > 0) {
        // We use try-catch to safely ignore uniqueness constraint errors if a duplicate somehow slips in
        // across different careers (e.g. recommending Python for both Backend and Data Science)
        // Mongoose insertMany with ordered: false will insert successful ones and skip errors
        try {
          await Recommendation.insertMany(newRecommendations, { ordered: false });
          logger.info(`Generated new recommendations for user ${userId}`);
        } catch (err: unknown) {
          // ordered: false throws a BulkWriteError if ANY fail, but still inserts the rest
          if ((err as Record<string, unknown>).code === 11000) {
            logger.warn(`Some duplicate recommendations were skipped for user ${userId}`);
          } else {
            logger.error(`Failed to insert recommendations: ${(err as Error).message}`);
          }
        }
      }

      // 6. Regenerate any existing active roadmaps now that recommendations changed
      const LearningRoadmap = (await import('../models/LearningRoadmap.js')).default;
      const RoadmapEngineInstance = (await import('./RoadmapEngine.js')).default;

      const existingRoadmaps = await LearningRoadmap.find({
        userId: new mongoose.Types.ObjectId(userId)
      });
      for (const roadmap of existingRoadmaps) {
        await RoadmapEngineInstance.generateRoadmap(userId, roadmap.careerId.toString());
      }
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error generating recommendations for user ${userId}: ${err.message}`);
    }
  }

  private async buildRecommendationsForGap(
    userId: string,
    careerId: string,
    gap: IGapItem,
    isCritical: boolean
  ) {
    const recs = [];

    // 1. Learning Resources
    const resources = await ResourceMatcher.matchLearningResources(gap.skillName);
    for (const res of resources) {
      const { priorityScore, priority } = PriorityCalculator.calculate(
        gap.impactScore || 50,
        'Learning Resources'
      );
      recs.push({
        userId: new mongoose.Types.ObjectId(userId),
        careerId: new mongoose.Types.ObjectId(careerId),
        category: 'Learning Resources',
        title: `Learn ${gap.skillName}: ${res.title}`,
        description: `Take this ${res.difficulty.toLowerCase()} ${res.type.toLowerCase()} by ${res.provider} to build foundational knowledge.`,
        priority,
        priorityScore,
        reason: gap.reason,
        impact: gap.impactScore || 50,
        difficulty: res.difficulty,
        estimatedTime: res.estimatedTime,
        dependencies: [],
        confidence: isCritical ? 95 : 75,
        actionLink: res.url,
        actionType: res.type,
        targetSkill: gap.skillName
      });
    }

    // No curated resource for this skill yet: still surface the gap as an actionable step
    // rather than silently dropping it. No provider or duration is invented.
    if (resources.length === 0) {
      const { priorityScore, priority } = PriorityCalculator.calculate(
        gap.impactScore || 50,
        'Learning Resources'
      );
      recs.push({
        userId: new mongoose.Types.ObjectId(userId),
        careerId: new mongoose.Types.ObjectId(careerId),
        category: 'Learning Resources',
        title: `Learn ${gap.skillName}`,
        description: `Build working knowledge of ${gap.skillName} through a structured course or official documentation, then apply it in a small project so it shows up as evidence on your resume.`,
        priority,
        priorityScore,
        reason: gap.reason,
        impact: gap.impactScore || 50,
        difficulty: isCritical ? 'Beginner' : 'Intermediate',
        estimatedTime: 'Self-paced',
        dependencies: [],
        confidence: isCritical ? 90 : 70,
        actionLink: `https://www.google.com/search?q=${encodeURIComponent(`learn ${gap.skillName}`)}`,
        actionType: 'Self-Study',
        targetSkill: gap.skillName
      });
    }

    // 2. Projects
    const projects = await ResourceMatcher.matchProjects(gap.skillName);
    for (const proj of projects) {
      const { priorityScore, priority } = PriorityCalculator.calculate(gap.impactScore || 50, 'Projects');
      recs.push({
        userId: new mongoose.Types.ObjectId(userId),
        careerId: new mongoose.Types.ObjectId(careerId),
        category: 'Projects',
        title: `Build Project: ${proj.title}`,
        description: proj.description,
        priority,
        priorityScore,
        reason: `Hands-on application is required to prove proficiency in ${gap.skillName}.`,
        impact: gap.impactScore || 50,
        difficulty: proj.difficulty,
        estimatedTime: proj.estimatedTime,
        dependencies: [`Understand ${gap.skillName} basics`],
        confidence: 90,
        actionType: 'Project',
        targetSkill: gap.skillName
      });
    }

    // 3. Certifications (Only if critical or high impact)
    if ((gap.impactScore || 0) > 75) {
      const certs = await ResourceMatcher.matchCertifications(gap.skillName);
      for (const cert of certs) {
        const { priorityScore, priority } = PriorityCalculator.calculate(
          gap.impactScore || 50,
          'Certifications'
        );
        recs.push({
          userId: new mongoose.Types.ObjectId(userId),
          careerId: new mongoose.Types.ObjectId(careerId),
          category: 'Certifications',
          title: `Get Certified: ${cert.title}`,
          description: `Earning this official certification from ${cert.provider} will strongly validate your ${gap.skillName} skills.`,
          priority,
          priorityScore,
          reason: gap.reason,
          impact: gap.impactScore,
          difficulty: cert.difficulty,
          estimatedTime: cert.estimatedTime,
          dependencies: [`Deep experience with ${gap.skillName}`],
          confidence: 85,
          actionLink: cert.url,
          actionType: 'Certification',
          targetSkill: gap.skillName
        });
      }
    }

    return recs;
  }
}

export default new RecommendationEngine();
