import mongoose from 'mongoose';
import { GapAnalysis, IGapItem } from '../models/GapAnalysis.js';
import { Recommendation, RecommendationSource } from '../models/Recommendation.js';
import { CareerMatch, IRequirementBreakdown } from '../models/CareerMatch.js';
import { CareerReadiness } from '../models/CareerReadiness.js';
import { InterviewSession } from '../models/InterviewSession.js';
import { User } from '../models/User.js';
import PriorityCalculator from './PriorityCalculator.js';
import ResourceMatcher from './ResourceMatcher.js';
import { IMPORTANCE_MULTIPLIER } from './CareerScoringEngine.js';
import logger from '../config/logger.js';
import { withUserLock } from '../utils/userLock.js';

/** Recommendations are generated for the user's strongest career matches, not every career. */
const FOCUS_CAREER_COUNT = 3;
/** At most this many "show your evidence" recommendations per career. */
const MAX_EVIDENCE_RECOMMENDATIONS = 4;

interface CareerContext {
  careerId: mongoose.Types.ObjectId;
  title: string;
  matchScore: number;
  readinessScore: number | null;
  breakdown: IRequirementBreakdown[];
}

interface DraftRecommendation {
  userId: mongoose.Types.ObjectId;
  careerId: mongoose.Types.ObjectId;
  category: string;
  source: RecommendationSource;
  title: string; // what should improve
  description: string;
  reason: string; // why it matters
  evidence: string[]; // what the recommendation is based on
  nextAction: string; // the next practical step
  priority: string;
  priorityScore: number;
  impact: number;
  difficulty: string;
  estimatedTime: string;
  dependencies: string[];
  actionLink?: string;
  actionType?: string;
  targetSkill: string;
}

/**
 * Builds recommendations exclusively from the user's own data:
 *   - skill gaps between their resume evidence and their best-matching careers
 *   - skills they list but never demonstrate
 *   - weaknesses recorded in their most recent completed interview
 *
 * Every recommendation states what to improve, why it matters, the evidence it is based on,
 * the next practical action and a priority. Nothing is generated without such evidence: a user
 * with no resume gets no recommendations rather than generic advice. No statistics, market
 * claims or outcome probabilities are produced.
 */
export class RecommendationEngine {
  public generateForUser(userId: string): Promise<void> {
    return withUserLock(`recommendations:${userId}`, () => this.runGeneration(userId));
  }

  private async runGeneration(userId: string): Promise<void> {
    try {
      logger.info(`Starting Recommendation Generation for user ${userId}`);
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const careers = await this.loadFocusCareers(userObjectId);

      // Recommendations the user has already acted on are kept as they are and never duplicated
      const handled = await Recommendation.find({
        userId: userObjectId,
        status: { $ne: 'active' }
      }).select('careerId title');
      const handledKeys = new Set(handled.map(r => `${r.careerId.toString()}|${r.title}`));

      // Active ones are recomputed from the latest evidence
      await Recommendation.deleteMany({ userId: userObjectId, status: 'active' });

      const drafts: DraftRecommendation[] = [];
      for (const career of careers) {
        const gapAnalysis = await GapAnalysis.findOne({
          userId: userObjectId,
          careerId: career.careerId
        });
        if (gapAnalysis) {
          for (const gap of gapAnalysis.criticalGaps) {
            drafts.push(...(await this.forGap(userObjectId, career, gap, true)));
          }
          for (const gap of gapAnalysis.weakAreas) {
            drafts.push(...(await this.forGap(userObjectId, career, gap, false)));
          }
        }
        drafts.push(...this.forUnprovenSkills(userObjectId, career));
      }

      if (careers.length > 0) {
        drafts.push(...(await this.forInterviewWeaknesses(userObjectId, careers[0])));
      }

      const seen = new Set<string>();
      const fresh = drafts.filter(draft => {
        const key = `${draft.careerId.toString()}|${draft.title}`;
        if (handledKeys.has(key) || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (fresh.length > 0) {
        await Recommendation.insertMany(fresh.map(draft => ({ ...draft, status: 'active' })));
      }
      logger.info(`Generated ${fresh.length} evidence-based recommendations for user ${userId}`);

      // Roadmaps are derived from recommendations, so refresh any that exist
      const LearningRoadmap = (await import('../models/LearningRoadmap.js')).default;
      const RoadmapEngineInstance = (await import('./RoadmapEngine.js')).default;
      const existingRoadmaps = await LearningRoadmap.find({ userId: userObjectId });
      for (const roadmap of existingRoadmaps) {
        await RoadmapEngineInstance.generateRoadmap(userId, roadmap.careerId.toString());
      }
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error generating recommendations for user ${userId}: ${err.message}`);
    }
  }

  /** The user's best-matching careers, with the target role first when it is one of them. */
  private async loadFocusCareers(userObjectId: mongoose.Types.ObjectId): Promise<CareerContext[]> {
    const matches = await CareerMatch.find({ userId: userObjectId })
      .sort({ matchScore: -1, confidence: -1, _id: 1 })
      .populate<{ careerId: { _id: mongoose.Types.ObjectId; title: string } | null }>('careerId', 'title');

    const user = await User.findById(userObjectId).select('targetRole');
    const targetRole = (user?.targetRole || '').trim().toLowerCase();

    const valid = matches.filter(m => m.careerId);
    const target = targetRole
      ? valid.find(m => m.careerId!.title.toLowerCase() === targetRole)
      : undefined;
    const ordered = target ? [target, ...valid.filter(m => m !== target)] : valid;

    const contexts: CareerContext[] = [];
    for (const match of ordered.slice(0, FOCUS_CAREER_COUNT)) {
      const readiness = await CareerReadiness.findOne({
        userId: userObjectId,
        careerId: match.careerId!._id
      });
      contexts.push({
        careerId: match.careerId!._id,
        title: match.careerId!.title,
        matchScore: match.matchScore,
        readinessScore: readiness ? readiness.overallScore : null,
        breakdown: match.breakdown || []
      });
    }
    return contexts;
  }

  private careerFacts(career: CareerContext): string {
    return (
      `Your match for ${career.title} is ${career.matchScore}%` +
      (career.readinessScore !== null ? ` and your readiness is ${career.readinessScore}%.` : '.')
    );
  }

  /** A skill the career needs that the resume does not evidence (or evidences weakly). */
  private async forGap(
    userId: mongoose.Types.ObjectId,
    career: CareerContext,
    gap: IGapItem,
    isCritical: boolean
  ): Promise<DraftRecommendation[]> {
    const requirement = career.breakdown.find(b => b.skillName === gap.skillName);
    const importance = requirement?.importance || (isCritical ? 'required' : 'preferred');
    const missing = !requirement || requirement.status === 'missing';
    const impact = gap.impactScore || 50;

    const evidence = [
      `${gap.skillName} is a ${importance} skill in the ${career.title} skill baseline.`,
      missing
        ? `No mention of ${gap.skillName} was found in your resume's skills, experience, projects or certifications.`
        : `Your resume evidence for ${gap.skillName} is ${requirement!.evidenceScore}/100.`,
      this.careerFacts(career)
    ];
    const reason = missing
      ? `${career.title} roles expect ${gap.skillName}, and your resume currently shows no evidence of it.`
      : `${career.title} roles expect ${gap.skillName}, and your current evidence for it is thin.`;

    const drafts: DraftRecommendation[] = [];
    const base = {
      userId,
      careerId: career.careerId,
      source: 'gap' as const,
      reason,
      evidence,
      impact,
      dependencies: [] as string[],
      targetSkill: gap.skillName
    };

    // 1. Learning step: a curated resource when one exists, otherwise a plain self-study step
    const resources = await ResourceMatcher.matchLearningResources(gap.skillName);
    const learning = PriorityCalculator.calculate(impact, 'Learning Resources');
    if (resources.length > 0) {
      const resource = resources[0];
      drafts.push({
        ...base,
        category: 'Learning Resources',
        title: `Learn ${gap.skillName}`,
        description: `Work through "${resource.title}" from ${resource.provider} to build working knowledge of ${gap.skillName}.`,
        nextAction: `Open "${resource.title}" (${resource.provider}) and complete the first section this week.`,
        priority: learning.priority,
        priorityScore: learning.priorityScore,
        difficulty: resource.difficulty,
        estimatedTime: resource.estimatedTime || 'Self-paced',
        actionLink: resource.url,
        actionType: resource.type
      });
    } else {
      drafts.push({
        ...base,
        category: 'Learning Resources',
        title: `Learn ${gap.skillName}`,
        description: `Build working knowledge of ${gap.skillName} through its official documentation or a structured course.`,
        nextAction: `Find the official documentation or an introductory course for ${gap.skillName} and complete its first module this week.`,
        priority: learning.priority,
        priorityScore: learning.priorityScore,
        difficulty: 'Beginner',
        estimatedTime: 'Self-paced',
        actionLink: `https://www.google.com/search?q=${encodeURIComponent(`${gap.skillName} official documentation tutorial`)}`,
        actionType: 'Self-Study'
      });
    }

    // 2. Evidence step: knowing a skill only counts once the resume shows it being used
    const project = PriorityCalculator.calculate(impact, 'Projects');
    const templates = await ResourceMatcher.matchProjects(gap.skillName);
    drafts.push({
      ...base,
      category: 'Projects',
      title: `Build a project that uses ${gap.skillName}`,
      description:
        templates.length > 0
          ? templates[0].description
          : `Build a small, working project in which ${gap.skillName} does real work, and publish the code.`,
      reason: `Readiness is scored from evidence: a project using ${gap.skillName} is what moves it from "missing" to "applied".`,
      nextAction: `Pick one small project idea that needs ${gap.skillName}, build a first working version, then add it to the Projects section of your resume and re-upload it.`,
      priority: project.priority,
      priorityScore: project.priorityScore,
      difficulty: templates.length > 0 ? templates[0].difficulty : 'Intermediate',
      estimatedTime: (templates.length > 0 && templates[0].estimatedTime) || 'Self-paced',
      dependencies: [`Learn ${gap.skillName}`],
      actionType: 'Project'
    });

    return drafts;
  }

  /** Skills the user lists or implies but never demonstrates in a role or project. */
  private forUnprovenSkills(
    userId: mongoose.Types.ObjectId,
    career: CareerContext
  ): DraftRecommendation[] {
    return career.breakdown
      .filter(item => item.status === 'listed' || item.status === 'inferred')
      .sort((a, b) => b.pointsPossible - a.pointsPossible)
      .slice(0, MAX_EVIDENCE_RECOMMENDATIONS)
      .map(item => {
        // Same normalisation as gap impact, scaled down because the skill is partly credited
        const impact = Math.round(
          Math.min(item.weight * (IMPORTANCE_MULTIPLIER[item.importance] ?? 1) * (100 / 15), 100) * 0.6
        );
        const { priority, priorityScore } = PriorityCalculator.calculate(impact, 'Resume Improvements');
        const listed = item.status === 'listed';

        return {
          userId,
          careerId: career.careerId,
          category: 'Resume Improvements',
          source: 'evidence' as const,
          title: listed
            ? `Show where you used ${item.skillName}`
            : `List ${item.skillName} explicitly on your resume`,
          description: listed
            ? `${item.skillName} appears on your resume only as a listed skill. Describe a role or project in which you actually used it.`
            : `${item.skillName} is only inferred from your ${item.matchedVia} work. State it directly so it is counted in full.`,
          reason: `${item.skillName} is a ${item.importance} skill for ${career.title}; it currently earns ${item.pointsEarned} of ${item.pointsPossible} possible points in your match score.`,
          evidence: [
            listed
              ? `${item.skillName} is mentioned on your resume but not in any work experience, project or certification (evidence ${item.evidenceScore}/100).`
              : `${item.skillName} is not named on your resume; it was inferred from ${item.matchedVia} (credited at ${item.evidenceScore}/100).`,
            this.careerFacts(career)
          ],
          nextAction: listed
            ? `Edit one experience or project bullet to say what you built with ${item.skillName}, then re-upload your resume.`
            : `Add ${item.skillName} to your skills section and mention it in the ${item.matchedVia} bullet where you used it, then re-upload your resume.`,
          priority,
          priorityScore,
          impact,
          difficulty: 'Beginner',
          estimatedTime: 'Under an hour',
          dependencies: [],
          actionLink: '/resume',
          actionType: 'Resume Update',
          targetSkill: item.skillName
        };
      });
  }

  /** Weaknesses recorded in the user's most recent completed interview. */
  private async forInterviewWeaknesses(
    userId: mongoose.Types.ObjectId,
    career: CareerContext
  ): Promise<DraftRecommendation[]> {
    const session = await InterviewSession.findOne({ userId, status: 'completed' }).sort({
      completedAt: -1
    });
    if (!session || session.weaknesses.length === 0) return [];

    const when = (session.completedAt || session.updatedAt).toISOString().slice(0, 10);
    const { priority, priorityScore } = PriorityCalculator.calculate(50, 'Interview Preparation');

    return session.weaknesses.slice(0, 2).map(weakness => ({
      userId,
      careerId: career.careerId,
      category: 'Interview Preparation',
      source: 'interview' as const,
      title: `Interview practice: ${weakness}`,
      description: `Your last practice interview flagged this as an area to improve.`,
      reason: `It was identified in your own ${session.mode} practice interview, so it is likely to recur in real interviews for ${session.targetCareerTitle || career.title}.`,
      evidence: [
        `Practice interview on ${when} (${session.mode}, overall score ${session.overallScore ?? 0}/100).`,
        `Feedback recorded: "${weakness}".`
      ],
      nextAction: 'Start another practice interview and focus on this point in each answer.',
      priority,
      priorityScore,
      impact: 50,
      difficulty: 'Intermediate',
      estimatedTime: 'One practice session',
      dependencies: [],
      actionLink: '/interview-agent',
      actionType: 'Practice',
      targetSkill: 'Interviewing'
    }));
  }
}

export default new RecommendationEngine();
