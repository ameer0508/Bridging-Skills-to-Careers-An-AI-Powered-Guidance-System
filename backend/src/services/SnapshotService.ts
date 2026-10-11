import mongoose from 'mongoose';
import { AnalyticsSnapshot } from '../models/AnalyticsSnapshot.js';
import { UserSkill } from '../models/UserSkill.js';
import { CareerReadiness } from '../models/CareerReadiness.js';
import { GapAnalysis, IGapItem } from '../models/GapAnalysis.js';
import { Recommendation } from '../models/Recommendation.js';
import { LearningRoadmap, IRoadmapPhase, IRoadmapItem } from '../models/LearningRoadmap.js';
import logger from '../config/logger.js';
import { AppError } from '../middlewares/errorHandler.js';

export class SnapshotService {
  /**
   * Takes a current snapshot of the user's intelligence states.
   * Typically called via a daily cron job or triggered manually for this MVP.
   */
  public async createSnapshot(userId: string): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day

      // Check if we already snapped today
      const existing = await AnalyticsSnapshot.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        period: 'daily',
        date: today
      });

      if (existing) {
        return; // Already snapped today
      }

      // Compute metrics
      const totalSkills = await UserSkill.countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
      
      const readinesses = await CareerReadiness.find({ userId: new mongoose.Types.ObjectId(userId) });
      const averageReadinessScore = readinesses.length > 0
        ? readinesses.reduce((acc, r) => acc + r.overallScore, 0) / readinesses.length
        : 0;

      const gaps = await GapAnalysis.find({ userId: new mongoose.Types.ObjectId(userId) });
      const totalGaps = gaps.reduce((acc, g) => acc + g.criticalGaps.length + g.weakAreas.length, 0);

      const completedRecommendations = await Recommendation.countDocuments({ 
        userId: new mongoose.Types.ObjectId(userId),
        status: 'completed'
      });

      const roadmaps = await LearningRoadmap.find({ userId: new mongoose.Types.ObjectId(userId) });
      let completedRoadmapItems = 0;
      roadmaps.forEach(r => {
        r.phases.forEach((p: IRoadmapPhase) => {
          p.items.forEach((i: IRoadmapItem) => {
            if (i.status === 'completed') completedRoadmapItems++;
          });
        });
      });

      await AnalyticsSnapshot.create({
        userId: new mongoose.Types.ObjectId(userId),
        period: 'daily',
        date: today,
        metrics: {
          totalSkills,
          averageReadinessScore: Math.round(averageReadinessScore),
          totalGaps,
          completedRecommendations,
          completedRoadmapItems
        }
      });

      logger.info(`Created daily analytics snapshot for user ${userId}`);

    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error creating snapshot for user ${userId}: ${err.message}`);
    }
  }

  public async getSnapshots(userId: string, limit: number = 30) {
    return await AnalyticsSnapshot.find({ userId: new mongoose.Types.ObjectId(userId), period: 'daily' })
      .sort({ date: 1 })
      .limit(limit)
      .lean();
  }

  /**
   * Assembles a unified canonical server-side career intelligence snapshot across all 12 platform subsystems
   */
  public async getUnifiedCareerSnapshot(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid user ID provided', 400, 'INVALID_ID');
    }

    const userObjId = new mongoose.Types.ObjectId(userId);

    // Dynamic imports to prevent circular dependencies
    const { default: CareerMatch } = await import('../models/CareerMatch.js');
    const { default: ParsedResume } = await import('../models/ParsedResume.js');
    const { default: SavedOpportunity } = await import('../models/SavedOpportunity.js');
    const { default: InterviewSession } = await import('../models/InterviewSession.js');
    const { default: User } = await import('../models/User.js');

    const userDoc = await User.findById(userObjId).select('fullName email targetRole primaryCareerDomain profileCompleted');

    if (mongoose.connection.readyState !== 1) {
      return {
        targetCareer: userDoc?.targetRole || userDoc?.primaryCareerDomain || 'Target Career Role',
        targetRole: userDoc?.targetRole || '',
        primaryCareerDomain: userDoc?.primaryCareerDomain || '',
        matchScore: null,
        isMatchEvaluated: false,
        readinessScore: null,
        isReadinessEvaluated: false,
        careerHealth: null,
        isCareerHealthEvaluated: false,
        totalSkills: 0,
        criticalGaps: [],
        roadmapProgress: 0,
        isRoadmapInitialized: false,
        roadmap: {
          isInitialized: false,
          progress: 0,
          title: null,
          currentPhaseTitle: null,
          totalMilestones: 0,
          completedMilestones: 0,
          phases: [],
        },
        activeRecommendationsCount: 0,
        topRecommendations: [],
        opportunities: { saved: 0, applied: 0, interviewing: 0, offer: 0, rejected: 0, withdrawn: 0, total: 0 },
        interviews: { total: 0, completed: 0, averageScore: null, latestScore: null, isEvaluated: false, latestWeaknesses: [] },
        resumeInfo: {
          hasResume: false,
          fileName: null,
          detectedSkillsCount: 0,
          atsScore: null,
          experienceCount: 0,
          projectsCount: 0,
          educationCount: 0,
          certificationsCount: 0,
          parsingStatus: 'none',
          updatedAt: null,
        },
        skillsInfo: { total: 0, categories: [] },
        pipeline: [],
        nextBestAction: {
          action: 'upload_resume',
          title: 'Upload Resume to Activate Skill Intelligence',
          subtitle: 'Upload your PDF or DOCX resume to extract verified skills and ground your learning path.',
          route: '/resume',
          icon: 'FileText',
          actionLabel: 'Upload Resume',
          badge: 'Priority Action: Resume Upload',
        },
        telemetry: {
          timestamp: new Date().toISOString(),
          databaseStatus: 'DEGRADED',
          primaryProvider: 'Local Rule Engine (Offline Fallback)',
          aiStatus: 'FALLBACK',
          marketStatus: 'SANDBOX',
        }
      };
    }

    // 1. Target career match & target role resolution
    const topMatch = await CareerMatch.findOne({ userId: userObjId }).sort({ matchScore: -1, confidence: -1, _id: 1 }).populate<{ careerId: { title: string } }>('careerId');
    const targetCareer = topMatch?.careerId && typeof topMatch.careerId === 'object'
      ? topMatch.careerId.title
      : userDoc?.targetRole || userDoc?.primaryCareerDomain || 'Target Career Role';

    // 2. User Skills & Taxonomy
    const totalSkills = await UserSkill.countDocuments({ userId: userObjId });
    const userSkillsList = await UserSkill.find({ userId: userObjId }).limit(15);
    const categoryCounts: Record<string, number> = {};
    userSkillsList.forEach((us) => {
      const cat = us.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const isMatchEvaluated = Boolean(topMatch && totalSkills > 0 && typeof topMatch.matchScore === 'number');
    const matchScore = isMatchEvaluated ? topMatch!.matchScore : null;

    // 3. Readiness & Dimensions
    const readiness = await CareerReadiness.findOne({ userId: userObjId }).sort({ updatedAt: -1 });
    const isReadinessEvaluated = Boolean(readiness && typeof readiness.overallScore === 'number');
    const readinessScore = isReadinessEvaluated ? readiness!.overallScore : null;

    // 4. Critical Gaps
    const gapDoc = await GapAnalysis.findOne({ userId: userObjId }).sort({ updatedAt: -1 });
    const criticalGaps = gapDoc?.criticalGaps?.map((g: IGapItem) => g.skillName) || [];

    // 5. Active Recommendations
    const activeRecsCount = await Recommendation.countDocuments({ userId: userObjId, status: { $ne: 'completed' } });
    const topRecs = await Recommendation.find({ userId: userObjId, status: { $ne: 'completed' } })
      .sort({ priority: 1, createdAt: -1 })
      .limit(3);

    // 6. Roadmap Progress
    const roadmaps = await LearningRoadmap.find({ userId: userObjId });
    let totalItems = 0;
    let completedItems = 0;
    roadmaps.forEach((r) => {
      r.phases.forEach((p: IRoadmapPhase) => {
        p.items.forEach((item: IRoadmapItem) => {
          totalItems++;
          if (item.status === 'completed') completedItems++;
        });
      });
    });
    const isRoadmapInitialized = roadmaps.length > 0 && totalItems > 0;
    const roadmapProgress = isRoadmapInitialized ? Math.round((completedItems / totalItems) * 100) : 0;
    const activeRoadmap = roadmaps[0] || null;
    const activePhase = activeRoadmap?.phases?.find((p: IRoadmapPhase) => p.status !== 'completed') || activeRoadmap?.phases?.[0];

    // 7. Saved Opportunity Telemetry
    const savedDocs = await SavedOpportunity.find({ userId: userObjId });
    const opportunityTelemetry = {
      saved: savedDocs.filter((d) => d.status === 'saved').length,
      applied: savedDocs.filter((d) => d.status === 'applied').length,
      interviewing: savedDocs.filter((d) => d.status === 'interviewing').length,
      offer: savedDocs.filter((d) => d.status === 'offer').length,
      rejected: savedDocs.filter((d) => d.status === 'rejected').length,
      withdrawn: savedDocs.filter((d) => d.status === 'withdrawn').length,
      total: savedDocs.length,
    };

    // 8. Interview Telemetry
    const sessions = await InterviewSession.find({ userId: userObjId }).sort({ createdAt: -1 });
    const completedSessions = sessions.filter((s) => s.status === 'completed' && typeof s.overallScore === 'number');
    const averageInterviewScore = completedSessions.length > 0
      ? Math.round(completedSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / completedSessions.length)
      : null;

    const latestSession = completedSessions[0];
    const latestInterviewScore = typeof latestSession?.overallScore === 'number' ? latestSession.overallScore : null;
    const isInterviewEvaluated = completedSessions.length > 0;

    // 9. Active Resume ATS
    // The active upload carries the file name and parsing state; its parsed counterpart carries the content
    const { default: Resume } = await import('../models/Resume.js');
    const activeResume = await Resume.findOne({ userId: userObjId, isActive: true });
    const resumeDoc = activeResume
      ? await ParsedResume.findOne({ resumeId: activeResume._id })
      : await ParsedResume.findOne({ userId: userObjId }).sort({ updatedAt: -1 });

    // 10. Canonical Career Health Calculation (Weighted Formula)
    // Formula Breakdown:
    // - Readiness Component (30%): readinessScore if evaluated
    // - Target Alignment (25%): matchScore if evaluated
    // - Verified Skill Coverage & Resume Completeness (20%): 10 pts for resume + up to 10 pts for verified skills
    // - Roadmap Progress (15%): roadmapProgress if initialized
    // - Interview Performance (10%): latestInterviewScore if evaluated
    let careerHealth: number | null = null;
    const hasSufficientTelemetry = Boolean(resumeDoc || totalSkills > 0 || isReadinessEvaluated);

    if (hasSufficientTelemetry) {
      const readinessPart = (isReadinessEvaluated && readinessScore !== null ? readinessScore : 0) * 0.30;
      const matchPart = (isMatchEvaluated && matchScore !== null ? matchScore : 0) * 0.25;
      const skillPart = (resumeDoc ? 10 : 0) + Math.min(10, (totalSkills / 10) * 10);
      const roadmapPart = (isRoadmapInitialized ? roadmapProgress : 0) * 0.15;
      const interviewPart = (isInterviewEvaluated && latestInterviewScore !== null ? latestInterviewScore : 0) * 0.10;
      careerHealth = Math.min(100, Math.round(readinessPart + matchPart + skillPart + roadmapPart + interviewPart));
    }

    // 11. Canonical 10-Stage Career Pipeline Status
    const pipeline = [
      {
        id: 'profile',
        name: 'IDENTITY',
        subtitle: userDoc?.profileCompleted ? 'Profile Verified' : 'Profile Active',
        status: userDoc?.profileCompleted ? 'COMPLETED' : 'IN_PROGRESS',
        route: '/profile',
      },
      {
        id: 'target',
        name: 'CAREER TARGET',
        subtitle: userDoc?.targetRole || userDoc?.primaryCareerDomain || 'Target Unset',
        status: userDoc?.targetRole || userDoc?.primaryCareerDomain ? 'COMPLETED' : 'NOT_STARTED',
        route: '/profile',
      },
      {
        id: 'resume',
        name: 'RESUME VAULT',
        subtitle: resumeDoc ? 'ATS Analyzed' : 'Upload Needed',
        status: resumeDoc ? 'COMPLETED' : 'NOT_STARTED',
        route: '/resume',
      },
      {
        id: 'skills',
        name: 'SKILL ENGINE',
        subtitle: totalSkills > 0 ? `${totalSkills} Skills Verified` : 'No Skills Yet',
        status: totalSkills > 0 ? 'COMPLETED' : 'NOT_STARTED',
        route: '/skills',
      },
      {
        id: 'readiness',
        name: 'READINESS',
        subtitle: isReadinessEvaluated && readinessScore !== null ? `${readinessScore}% Score` : 'Unevaluated',
        status: isReadinessEvaluated ? 'COMPLETED' : 'NOT_STARTED',
        route: '/readiness',
      },
      {
        id: 'roadmap',
        name: 'ROADMAP',
        subtitle: isRoadmapInitialized ? `${roadmapProgress}% Complete` : 'Not Initialized',
        status: isRoadmapInitialized ? (roadmapProgress >= 100 ? 'COMPLETED' : 'IN_PROGRESS') : 'NOT_STARTED',
        route: '/roadmap',
      },
      {
        id: 'opportunities',
        name: 'OPPORTUNITIES',
        subtitle: opportunityTelemetry.saved > 0 ? `${opportunityTelemetry.saved} Saved` : 'Live Discovery',
        status: opportunityTelemetry.saved > 0 ? 'COMPLETED' : 'ACTIVE',
        route: '/opportunities',
      },
      {
        id: 'applications',
        name: 'APPLICATIONS',
        subtitle: opportunityTelemetry.applied > 0 ? `${opportunityTelemetry.applied} Applied` : 'Pipeline Ready',
        status: opportunityTelemetry.applied > 0 ? 'COMPLETED' : 'NOT_STARTED',
        route: '/opportunities?tab=SAVED&status=applied',
      },
      {
        id: 'interviews',
        name: 'INTERVIEWS',
        subtitle: completedSessions.length > 0 ? `${completedSessions.length} Conducted` : 'STAR Studio',
        status: completedSessions.length > 0 ? 'COMPLETED' : 'NOT_STARTED',
        route: '/interview-agent',
      },
      {
        id: 'outcome',
        name: 'CAREER OUTCOME',
        subtitle: opportunityTelemetry.offer > 0 ? `${opportunityTelemetry.offer} Offers` : 'Target Role Offer',
        status: opportunityTelemetry.offer > 0 ? 'COMPLETED' : 'ACTIVE',
        route: '/opportunities',
      },
    ];

    // 12. Dynamic Real-Data Next Best Action Calculation
    let nextBestAction;
    if (!resumeDoc) {
      nextBestAction = {
        action: 'upload_resume',
        title: 'Upload Resume to Activate Skill Intelligence',
        subtitle: 'Upload your PDF or DOCX resume to extract verified skills, benchmark ATS fit, and ground your readiness path.',
        route: '/resume',
        icon: 'FileText',
        actionLabel: 'Upload Resume File',
        badge: 'Priority Action: Resume Upload',
      };
    } else if (totalSkills === 0) {
      nextBestAction = {
        action: 'verify_skills',
        title: 'Review & Verify Extracted Skills',
        subtitle: 'Your resume has been parsed. Review and verify your skills taxonomy to initialize real-time career matching.',
        route: '/skills',
        icon: 'ShieldCheck',
        actionLabel: 'Manage Verified Skills',
        badge: 'Priority Action: Skill Verification',
      };
    } else if (!userDoc?.targetRole && !userDoc?.primaryCareerDomain) {
      nextBestAction = {
        action: 'set_target_career',
        title: 'Configure Target Career Blueprint',
        subtitle: 'Specify your target career domain and role to activate market alignment metrics and gap recommendations.',
        route: '/profile',
        icon: 'Target',
        actionLabel: 'Configure Target Career',
        badge: 'Priority Action: Target Alignment',
      };
    } else if (criticalGaps.length > 0) {
      nextBestAction = {
        action: 'close_skill_gap',
        title: `Close Highest-Priority Skill Gap: [${criticalGaps[0]}]`,
        subtitle: `Closing ${criticalGaps[0]} will directly increase your readiness score for ${targetCareer}.`,
        route: '/roadmap',
        icon: 'Target',
        actionLabel: 'Execute Roadmap Module',
        badge: 'Priority Action: Skill Gap Closure',
      };
    } else if (opportunityTelemetry.saved > 0 && completedSessions.length === 0) {
      nextBestAction = {
        action: 'prepare_interview',
        title: 'Simulate STAR Technical Interview for Saved Opportunities',
        subtitle: `You have ${opportunityTelemetry.saved} saved opportunities. Conduct mock technical interviews to boost offer probability.`,
        route: '/interview-agent',
        icon: 'Video',
        actionLabel: 'Launch Interview Studio',
        badge: 'Priority Action: Interview Prep',
      };
    } else {
      nextBestAction = {
        action: 'explore_opportunities',
        title: `Discover Live Opportunities for ${targetCareer}`,
        subtitle: 'Explore real-time market job postings personalized to your verified tech stack and target role.',
        route: '/opportunities',
        icon: 'Briefcase',
        actionLabel: 'Explore Live Opportunities',
        badge: 'Priority Action: Opportunity Discovery',
      };
    }

    return {
      targetCareer,
      targetRole: userDoc?.targetRole || '',
      primaryCareerDomain: userDoc?.primaryCareerDomain || '',
      matchScore,
      isMatchEvaluated,
      readinessScore,
      isReadinessEvaluated,
      careerHealth,
      isCareerHealthEvaluated: careerHealth !== null,
      totalSkills,
      criticalGaps,
      roadmapProgress,
      isRoadmapInitialized,
      activePhaseTitle: activePhase?.title || null,
      roadmap: {
        isInitialized: isRoadmapInitialized,
        progress: roadmapProgress,
        title: activeRoadmap ? 'Learning Roadmap' : null,
        currentPhaseTitle: activePhase?.title || null,
        totalMilestones: totalItems,
        completedMilestones: completedItems,
        phases: activeRoadmap?.phases?.slice(0, 3).map((p: IRoadmapPhase) => ({
          title: p.title,
          description: p.objective,
          items: p.items.map((item: IRoadmapItem) => ({ title: item.title, status: item.status })),
        })) || [],
      },
      activeRecommendationsCount: activeRecsCount,
      topRecommendations: topRecs.map(r => ({
        id: r._id.toString(),
        title: r.title,
        reason: r.reason,
        category: r.category,
        priority: r.priority,
        type: r.type,
      })),
      opportunities: opportunityTelemetry,
      interviews: {
        total: sessions.length,
        completed: completedSessions.length,
        averageScore: averageInterviewScore,
        latestScore: latestInterviewScore,
        isEvaluated: isInterviewEvaluated,
        latestWeaknesses: latestSession?.weaknesses || [],
      },
      resumeInfo: {
        hasResume: Boolean(resumeDoc),
        fileName: activeResume?.originalFileName || null,
        detectedSkillsCount: totalSkills,
        atsScore: resumeDoc?.atsScore || null,
        experienceCount: resumeDoc?.experience?.length || 0,
        projectsCount: resumeDoc?.projects?.length || 0,
        educationCount: resumeDoc?.education?.length || 0,
        certificationsCount: resumeDoc?.certifications?.length || 0,
        parsingStatus: activeResume?.parsingStatus || (resumeDoc ? 'completed' : 'none'),
        updatedAt: resumeDoc?.updatedAt || null,
      },
      skillsInfo: {
        total: totalSkills,
        categories: Object.entries(categoryCounts).map(([cat, count]) => ({ category: cat, count })),
      },
      pipeline,
      nextBestAction,
      telemetry: await (async () => {
        let aiProviderName: string;
        let aiStatus: 'LIVE' | 'FALLBACK';
        let marketStatus: 'LIVE' | 'SANDBOX';

        try {
          const { default: aiClient } = await import('./AIClientService.js');
          const aiProbe = await aiClient.getProviderStatus();
          aiProviderName = aiProbe.primaryProvider;
          aiStatus = aiProbe.isLive ? 'LIVE' : 'FALLBACK';
        } catch {
          aiProviderName = 'Local Rule Engine (Offline Fallback)';
          aiStatus = 'FALLBACK';
        }

        try {
          const { default: JSearchProvider } = await import('./opportunities/JSearchProvider.js');
          const marketProbe = await new JSearchProvider().healthCheck();
          marketStatus = marketProbe.status === 'UP' ? 'LIVE' : 'SANDBOX';
        } catch {
          marketStatus = 'SANDBOX';
        }

        return {
          timestamp: new Date().toISOString(),
          databaseStatus: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
          primaryProvider: aiProviderName,
          aiStatus,
          marketStatus,
        };
      })(),
    };
  }
}

export default new SnapshotService();

