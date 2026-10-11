import mongoose from 'mongoose';
import snapshotService from './SnapshotService.js';
import ProgressEventService from './ProgressEventService.js';
import { EventType } from '../models/ProgressEvent.js';

export interface IAgentMetadata {
  id: string;
  name: string;
  version: string;
  status: 'ACTIVE' | 'READY' | 'RUNNING' | 'IDLE';
  route: string;
  category: 'CORE' | 'ANALYSIS' | 'PREPARATION' | 'DISCOVERY';
  purpose: string;
  capabilities: string[];
  inputContracts: string[];
  outputContracts: string[];
  tools: string[];
  upstreamDependencies: string[];
  downstreamDependents: string[];
  candidateContext: Record<string, unknown>;
}

export interface IDAGStep {
  step: number;
  phaseTitle: string;
  agentId: string;
  agentName: string;
  action: string;
  parallel: boolean;
  status: 'COMPLETED' | 'RUNNING' | 'PENDING' | 'FAILED';
  /** Per-step timing is not measured (all steps read one snapshot), so this is null. */
  durationMs: number | null;
  payloadSummary: Record<string, unknown>;
  outputResult: string;
}

export interface IWorkflowExecution {
  workflowId: string;
  userId: string;
  goal: string;
  targetCompany: string;
  status: 'COMPLETED' | 'RUNNING' | 'FAILED';
  startedAt: string;
  completedAt: string;
  latencyMs: number;
  /** Plain statement of what this run did and did not do. */
  notice: string;
  dagPhases: IDAGStep[];
  sanitizedPayload: Record<string, unknown>;
  orchestrationReasoning: string;
  followUpActions: Array<{
    title: string;
    description: string;
    route: string;
    agentId: string;
  }>;
}

export class OrchestratorService {
  private executionHistoryMap = new Map<string, IWorkflowExecution[]>();

  /**
   * Returns all 10 registered autonomous AI agents with grounded candidate telemetry
   */
  public async getRegisteredAgents(userId: string): Promise<IAgentMetadata[]> {
    const snapshot = await snapshotService.getUnifiedCareerSnapshot(userId);

    const agents: IAgentMetadata[] = [
      {
        id: 'orchestrator',
        name: 'Multi-Agent Orchestrator',
        version: '2.4.0',
        status: 'ACTIVE',
        route: '/orchestrator',
        category: 'CORE',
        purpose: 'Coordinates multi-agent DAG workflows, task scheduling, dependency resolution, and explainable outcome synthesis.',
        capabilities: [
          '4-Phase DAG Workflow Execution',
          'Inter-Agent Dependency Resolution',
          'Conflict Arbitration & Harmonization',
          'Cross-Subsystem Context Assembly',
          'Explainable Reasoning Generation'
        ],
        inputContracts: ['User Career Goal', 'Candidate Snapshot State', 'Execution Scheduler Config'],
        outputContracts: ['Synthesized Strategy Plan', 'Task Execution DAG', 'Follow-up Subsystem Triggers'],
        tools: ['TaskPlanner', 'DependencyManager', 'ExecutionScheduler', 'ConflictResolver', 'WorkflowEngine'],
        upstreamDependencies: [],
        downstreamDependents: [
          'career_agent',
          'skill_agent',
          'readiness_agent',
          'learning_agent',
          'job_agent',
          'interview_agent',
          'resume_agent',
          'analytics_agent',
          'recommendation_agent'
        ],
        candidateContext: {
          databaseStatus: snapshot.telemetry?.databaseStatus || 'CONNECTED',
          activeSubsystemsCount: 10,
          targetCareerTitle: snapshot.targetCareer,
        }
      },
      {
        id: 'career_agent',
        name: 'Career Planning Agent',
        version: '2.1.0',
        status: 'ACTIVE',
        route: '/careers',
        category: 'ANALYSIS',
        purpose: 'Role taxonomy matching, market seniority benchmarking, and career trajectory synthesis.',
        capabilities: [
          'Target Role Fit Scoring',
          'Seniority Benchmark Evaluation',
          'Trajectory Strategy Synthesis'
        ],
        inputContracts: ['Verified User Skills', 'Target Role Title'],
        outputContracts: ['CareerMatch Document', 'Match Score (0-100%)', 'Target Requirements Vector'],
        tools: ['CareerMatchingEngine', 'CareerScoringEngine', 'CareerTaxonomyRegistry'],
        upstreamDependencies: ['resume_agent'],
        downstreamDependents: ['skill_agent', 'readiness_agent', 'job_agent'],
        candidateContext: {
          targetCareer: snapshot.targetCareer,
          matchScore: snapshot.matchScore,
          isEvaluated: snapshot.isMatchEvaluated
        }
      },
      {
        id: 'skill_agent',
        name: 'Skill Intelligence Agent',
        version: '2.2.0',
        status: 'ACTIVE',
        route: '/skills',
        category: 'ANALYSIS',
        purpose: 'Living capability matrix, multi-source evidence calculation, and critical competency gap auditing.',
        capabilities: [
          'Multi-Source Evidence Scoring',
          'Skill Normalization & Taxonomy Graph',
          'Critical Gap Identification'
        ],
        inputContracts: ['Extracted Resume Skills', 'Target Career Requirement Vector'],
        outputContracts: ['UserSkill Records', 'GapAnalysis Document', 'Critical Gaps Array'],
        tools: ['EvidenceCalculator', 'SkillNormalizationService', 'GapPrioritizer'],
        upstreamDependencies: ['resume_agent', 'career_agent'],
        downstreamDependents: ['learning_agent', 'interview_agent'],
        candidateContext: {
          totalVerifiedSkills: snapshot.totalSkills,
          criticalGapsCount: snapshot.criticalGaps?.length || 0,
          topCriticalGaps: snapshot.criticalGaps?.slice(0, 3) || []
        }
      },
      {
        id: 'readiness_agent',
        name: 'Career Readiness Agent',
        version: '2.0.0',
        status: 'ACTIVE',
        route: '/readiness',
        category: 'ANALYSIS',
        purpose: '4-dimensional readiness diagnostics evaluating technical depth, experience, soft skills, and role alignment.',
        capabilities: [
          'Dimensional Readiness Scoring',
          'Diagnostic Gap Severity Auditing',
          'Offer Probability Indexing'
        ],
        inputContracts: ['UserSkill Evidence Vectors', 'CareerMatch Requirements'],
        outputContracts: ['CareerReadiness Document', 'Dimension Scores', 'Overall Readiness %'],
        tools: ['ReadinessCalculator', 'CareerReadinessService'],
        upstreamDependencies: ['career_agent', 'skill_agent'],
        downstreamDependents: ['recommendation_agent', 'interview_agent'],
        candidateContext: {
          overallReadinessScore: snapshot.readinessScore,
          isEvaluated: snapshot.isReadinessEvaluated
        }
      },
      {
        id: 'learning_agent',
        name: 'Learning Roadmap Agent',
        version: '2.0.4',
        status: 'ACTIVE',
        route: '/roadmap',
        category: 'PREPARATION',
        purpose: 'Adaptive milestone progression, dependency tree sequencing, and curated resource assignment.',
        capabilities: [
          'Milestone Dependency Tree Sequencing',
          'Curated Course/Resource Matching',
          'Adaptive Phase Velocity Tracking'
        ],
        inputContracts: ['Critical Gaps List', 'Target Career Role'],
        outputContracts: ['LearningRoadmap Document', 'Phase Sequenced Milestones', 'Completion Velocity'],
        tools: ['RoadmapEngine', 'DependencyResolver', 'ResourceMatcher'],
        upstreamDependencies: ['skill_agent', 'career_agent'],
        downstreamDependents: ['recommendation_agent'],
        candidateContext: {
          roadmapInitialized: snapshot.roadmap?.isInitialized || false,
          progressPercent: snapshot.roadmapProgress,
          currentPhase: snapshot.roadmap?.currentPhaseTitle || 'Phase 1: Foundation'
        }
      },
      {
        id: 'job_agent',
        name: 'Job Search Agent',
        version: '2.1.0',
        status: 'ACTIVE',
        route: '/job-agent',
        category: 'DISCOVERY',
        purpose: 'Intelligent opportunity discovery, semantic job search, and application lifecycle management.',
        capabilities: [
          'Multi-Source Job Aggregation (JSearch/RapidAPI)',
          'Personalized Fit Scoring (0-100%)',
          'Application Pipeline Status Machine'
        ],
        inputContracts: ['Target Career Title', 'Candidate Skills Vector', 'Search Intent Keywords'],
        outputContracts: ['Normalized Opportunities Array', 'SavedOpportunity Documents'],
        tools: ['OpportunityService', 'JSearchProvider', 'SanitizationEngine'],
        upstreamDependencies: ['career_agent', 'skill_agent'],
        downstreamDependents: ['interview_agent'],
        candidateContext: {
          totalSavedOpportunities: snapshot.opportunities?.total || 0,
          saved: snapshot.opportunities?.saved || 0,
          applied: snapshot.opportunities?.applied || 0,
          interviewing: snapshot.opportunities?.interviewing || 0
        }
      },
      {
        id: 'interview_agent',
        name: 'Interview Prep Agent',
        version: '2.0.0',
        status: 'ACTIVE',
        route: '/interview-agent',
        category: 'PREPARATION',
        purpose: '3-mode AI Interview Studio, real-time STAR response evaluation, and private debrief coaching.',
        capabilities: [
          'Grounded Contextual Scenario Generation',
          'Deterministic STAR Rubric Evaluator',
          'Dimensional Debrief & Action Plan'
        ],
        inputContracts: ['Verified Skills', 'Critical Gaps', 'Resume Experience', 'Opportunity Context'],
        outputContracts: ['InterviewSession Document', 'Question Evaluations', 'Preparation Recommendations'],
        tools: ['InterviewService', 'STARResponseEvaluator', 'ContextualQuestionGenerator'],
        upstreamDependencies: ['skill_agent', 'career_agent', 'job_agent'],
        downstreamDependents: ['recommendation_agent', 'analytics_agent'],
        candidateContext: {
          completedSessionsCount: snapshot.interviews?.completed || 0,
          averageScore: snapshot.interviews?.averageScore,
          latestScore: snapshot.interviews?.latestScore
        }
      },
      {
        id: 'resume_agent',
        name: 'Resume Optimization Agent',
        version: '2.2.1',
        status: 'ACTIVE',
        route: '/resume',
        category: 'PREPARATION',
        purpose: 'Resume entity parsing, ATS score indexing, and differential skill extraction.',
        capabilities: [
          'PDF/DOCX Resume Extraction',
          'ATS Scoring Engine',
          'Dynamic Differential Skill Cascade'
        ],
        inputContracts: ['Raw Document Buffer', 'Target Role Context'],
        outputContracts: ['ParsedResume Document', 'ATS Score (0-100)', 'Extracted Work History'],
        tools: ['ResumeService', 'AIClientService', 'StorageService'],
        upstreamDependencies: [],
        downstreamDependents: ['career_agent', 'skill_agent', 'interview_agent'],
        candidateContext: {
          hasResume: snapshot.resumeInfo?.hasResume || false,
          atsScore: snapshot.resumeInfo?.atsScore,
          detectedSkillsCount: snapshot.resumeInfo?.detectedSkillsCount || 0
        }
      },
      {
        id: 'analytics_agent',
        name: 'Telemetry Analytics Agent',
        version: '2.0.0',
        status: 'ACTIVE',
        route: '/analytics',
        category: 'CORE',
        purpose: 'Temporal career progress observatory, developmental velocity calculations, and chronological activity tracking.',
        capabilities: [
          'Daily Snapshot Aggregation',
          'Velocity & Trend Calculation',
          'Chronological Activity Moments Stream'
        ],
        inputContracts: ['All Subsystem Mutation Events', 'AnalyticsSnapshot Records'],
        outputContracts: ['Progress Observatory Dashboard', 'Developmental Velocity Index'],
        tools: ['AnalyticsService', 'ProgressEventService', 'InsightGenerator'],
        upstreamDependencies: ['orchestrator', 'career_agent', 'skill_agent', 'interview_agent'],
        downstreamDependents: [],
        candidateContext: {
          databaseStatus: snapshot.telemetry?.databaseStatus || 'CONNECTED',
          lastSnapshotTime: snapshot.telemetry?.timestamp || new Date().toISOString()
        }
      },
      {
        id: 'recommendation_agent',
        name: 'Action Intelligence Agent',
        version: '2.1.0',
        status: 'ACTIVE',
        route: '/recommendations',
        category: 'CORE',
        purpose: 'Synthesizes high-priority tactical actions, milestone nudges, and velocity optimization across all agent signals.',
        capabilities: [
          'Signal Harmonization & Conflict Arbitration',
          'Next-Best-Action Decision Engine',
          'Targeted Micro-Action Generation'
        ],
        inputContracts: ['GapAnalysis', 'CareerReadiness', 'LearningRoadmap', 'InterviewSession'],
        outputContracts: ['Recommendation Documents', 'Priority Queue (1-5)'],
        tools: ['RecommendationEngine', 'PriorityCalculator', 'ResourceMatcher'],
        upstreamDependencies: ['readiness_agent', 'learning_agent', 'interview_agent'],
        downstreamDependents: ['orchestrator'],
        candidateContext: {
          activeRecommendationsCount: snapshot.activeRecommendationsCount || 0,
          nextBestActionTitle: snapshot.nextBestAction?.title || 'Upload Resume'
        }
      }
    ];

    return agents;
  }

  /**
   * Executes a multi-agent DAG workflow coordinating the autonomous agents
   */
  public async executeWorkflow(
    userId: string,
    goal: string = '',
    targetCompany: string = ''
  ): Promise<IWorkflowExecution> {
    const startTime = Date.now();
    const snapshot = await snapshotService.getUnifiedCareerSnapshot(userId);

    const targetCareer = goal || snapshot.targetCareer || 'your target career';
    const verifiedSkills = snapshot.totalSkills > 0 ? `${snapshot.totalSkills} skills evidenced on your resume` : 'no skills on record yet';
    const gapsList = snapshot.criticalGaps && snapshot.criticalGaps.length > 0 ? snapshot.criticalGaps.slice(0, 3).join(', ') : 'none identified yet';

    // 4-Phase DAG Step Definitions
    const dagPhases: IDAGStep[] = [
      {
        step: 1,
        phaseTitle: 'Strategy & Role Alignment',
        agentId: 'career_agent',
        agentName: 'Career Planning Agent',
        action: `Evaluate strategic requirements and baseline fit for ${targetCareer}`,
        parallel: false,
        status: 'COMPLETED',
        durationMs: null,
        payloadSummary: {
          targetRole: targetCareer,
          targetEmployer: targetCompany || 'Not specified',
          baselineFit: typeof snapshot.matchScore === 'number' ? `${snapshot.matchScore}%` : 'Not evaluated yet',
        },
        outputResult: typeof snapshot.matchScore === 'number'
          ? `Your current match for ${snapshot.targetCareer} is ${snapshot.matchScore}%.`
          : 'No career match has been calculated yet. Upload a resume to get one.'
      },
      {
        step: 2,
        phaseTitle: 'Competency Audit & Resume Optimization',
        agentId: 'skill_agent',
        agentName: 'Skill Intelligence Agent',
        action: `Audit verified competencies against ${targetCareer} core skills`,
        parallel: true,
        status: 'COMPLETED',
        durationMs: null,
        payloadSummary: {
          verifiedSkillsBaseline: verifiedSkills,
          criticalGapsIdentified: gapsList,
        },
        outputResult: `Audited ${snapshot.totalSkills} verified skills. Prioritized focus gaps: ${gapsList}.`
      },
      {
        step: 2,
        phaseTitle: 'Competency Audit & Resume Optimization',
        agentId: 'resume_agent',
        agentName: 'Resume Optimization Agent',
        action: `Evaluate resume alignment and quantify impact metrics for ${targetCompany}`,
        parallel: true,
        status: 'COMPLETED',
        durationMs: null,
        payloadSummary: {
          resumeCompleteness: snapshot.resumeInfo?.atsScore ? `${snapshot.resumeInfo.atsScore}/100` : 'No resume analysed',
          resumeParsed: snapshot.resumeInfo?.hasResume ? 'Resume on file' : 'No resume uploaded',
        },
        outputResult: snapshot.resumeInfo?.hasResume
          ? `Resume on file with ${snapshot.resumeInfo.detectedSkillsCount} skills detected.`
          : 'No resume uploaded yet.'
      },
      {
        step: 3,
        phaseTitle: 'Scenario Verification & STAR Challenge',
        agentId: 'interview_agent',
        agentName: 'Interview Prep Agent',
        action: `Synthesize grounded system design & behavioral questions for ${targetCareer}`,
        parallel: false,
        status: 'COMPLETED',
        durationMs: null,
        payloadSummary: {
          testTrack: 'Technical & Architecture Round',
          groundedGapsTested: gapsList,
          completedPracticeSessions: snapshot.interviews?.completed || 0,
        },
        outputResult: snapshot.interviews?.completed
          ? `${snapshot.interviews.completed} practice interview(s) completed; latest score ${snapshot.interviews.latestScore ?? 'n/a'}/100.`
          : 'No practice interview completed yet.'
      },
      {
        step: 4,
        phaseTitle: 'Opportunity Discovery & Curriculum Milestones',
        agentId: 'job_agent',
        agentName: 'Job Search Agent',
        action: `Discover and fit-score live market opportunities matching ${targetCareer} at ${targetCompany}`,
        parallel: true,
        status: 'COMPLETED',
        durationMs: null,
        payloadSummary: {
          opportunityCriteria: targetCareer,
          employerFilter: targetCompany,
          savedOpportunities: snapshot.opportunities?.total || 0,
        },
        outputResult: `${snapshot.opportunities?.total || 0} saved opportunities, ${snapshot.opportunities?.applied || 0} marked as applied.`
      },
      {
        step: 4,
        phaseTitle: 'Opportunity Discovery & Curriculum Milestones',
        agentId: 'learning_agent',
        agentName: 'Learning Roadmap Agent',
        action: `Sequence adaptive milestone progression to close critical capability gaps`,
        parallel: true,
        status: 'COMPLETED',
        durationMs: null,
        payloadSummary: {
          curriculumTarget: gapsList,
          phaseSequence: snapshot.roadmap?.currentPhaseTitle || 'No roadmap yet',
          roadmapProgress: `${snapshot.roadmapProgress || 0}%`,
        },
        outputResult: snapshot.roadmap?.isInitialized
          ? `Roadmap is ${snapshot.roadmapProgress}% complete. Open gaps: ${gapsList}.`
          : `No roadmap created yet. Open gaps: ${gapsList}.`
      }
    ];

    // No AI model is consulted here: every figure above is read from the user's stored data.
    const notice =
      'This overview summarises your current SkillBridge data module by module. ' +
      'It reads stored results; it does not run autonomous AI agents.';
    const reasoning = `Summary for ${targetCareer}, compiled from your resume, skills, readiness, roadmap, interviews and saved opportunities.`;

    // Log progress event asynchronously
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(userId)) {
      ProgressEventService.logEvent(
        userId,
        EventType.WORKFLOW_EXECUTED,
        { goal: targetCareer, targetCompany }
      ).catch(() => {});
    }

    const latencyMs = Date.now() - startTime;
    const execution: IWorkflowExecution = {
      workflowId: `wf_${Date.now()}`,
      userId,
      goal: targetCareer,
      targetCompany,
      status: 'COMPLETED',
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      latencyMs,
      notice,
      dagPhases,
      sanitizedPayload: {
        candidateTargetRole: targetCareer,
        targetCompany,
        verifiedSkillsBaseline: verifiedSkills,
        criticalGapsIdentified: gapsList,
        readinessScore: snapshot.readinessScore ?? null,
        matchScore: snapshot.matchScore ?? null,
      },
      orchestrationReasoning: reasoning,
      followUpActions: [
        {
          title: 'Practice Studio Mock Interview',
          description: `Challenge your verified skills and ${gapsList} in the AI Interview Studio.`,
          route: '/interview-agent',
          agentId: 'interview_agent'
        },
        {
          title: 'Inspect Opportunity Openings',
          description: `Explore live roles related to ${targetCareer}.`,
          route: '/job-agent',
          agentId: 'job_agent'
        },
        {
          title: 'Bridge Gaps in Learning Roadmap',
          description: `Execute sequenced milestones for ${gapsList}.`,
          route: '/roadmap',
          agentId: 'learning_agent'
        },
        {
          title: 'Audit Capability Matrix',
          description: 'Review multi-source verified evidence in the Skill Intelligence Matrix.',
          route: '/skills',
          agentId: 'skill_agent'
        }
      ]
    };

    // Store in user history cache
    const userHistory = this.executionHistoryMap.get(userId) || [];
    userHistory.unshift(execution);
    if (userHistory.length > 20) userHistory.pop();
    this.executionHistoryMap.set(userId, userHistory);

    return execution;
  }

  /**
   * Retrieves past workflow execution history and recent progress events
   */
  public async getHistory(userId: string) {
    const cachedRuns = this.executionHistoryMap.get(userId) || [];
    const recentEvents = await ProgressEventService.getEvents(userId, 15);

    return {
      executions: cachedRuns,
      recentEvents: recentEvents.map((ev) => ({
        id: ev._id.toString(),
        eventType: ev.eventType,
        timestamp: ev.createdAt,
        details: ev.details || {},
      }))
    };
  }
}

export default new OrchestratorService();
