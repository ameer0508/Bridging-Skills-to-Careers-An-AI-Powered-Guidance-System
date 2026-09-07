import mongoose from 'mongoose';
import InterviewSession, { IInterviewSession, IQuestionItem } from '../models/InterviewSession.js';
import UserSkill from '../models/UserSkill.js';
import CareerMatch from '../models/CareerMatch.js';
import GapAnalysis from '../models/GapAnalysis.js';
import ParsedResume from '../models/ParsedResume.js';

export interface StartInterviewDTO {
  targetCareerId?: string;
  targetCareerTitle?: string;
  mode?: 'technical' | 'behavioral' | 'project' | 'resume' | 'career' | 'mixed';
  questionCount?: number;
  opportunityContext?: {
    title?: string;
    company?: string;
    description?: string;
  };
}

export interface RespondQuestionDTO {
  questionIndex: number;
  candidateResponse: string;
}

export class InterviewService {
  private inMemorySessions = new Map<string, any>();

  /**
   * Start a new grounded AI interview session using candidate database context
   */
  public async startSession(userId: string, dto: StartInterviewDTO = {}): Promise<IInterviewSession> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID provided');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Fetch verified candidate context
    let targetCareerTitle = dto.targetCareerTitle || dto.opportunityContext?.title || '';
    let targetCareerIdObj: mongoose.Types.ObjectId | undefined = dto.targetCareerId && mongoose.Types.ObjectId.isValid(dto.targetCareerId)
      ? new mongoose.Types.ObjectId(dto.targetCareerId)
      : undefined;

    let userSkillNames: string[] = [];
    let criticalGaps: string[] = [];
    let resumeExperience: string[] = [];

    if (mongoose.connection.readyState === 1) {
      try {
        // Top career match
        if (!targetCareerTitle) {
          const topMatch = await CareerMatch.findOne({ userId: userObjectId }).sort({ matchScore: -1 }).populate<{ careerId: { title: string } }>('careerId');
          if (topMatch?.careerId && typeof topMatch.careerId === 'object') {
            targetCareerTitle = topMatch.careerId.title;
            targetCareerIdObj = topMatch.careerId as unknown as mongoose.Types.ObjectId;
          }
        }

        // Verified skills
        const skillsDocs = await UserSkill.find({ userId: userObjectId }).populate<{ skillId: { name: string } }>('skillId');
        userSkillNames = skillsDocs
          .map((s) => (s.skillId && typeof s.skillId === 'object' ? s.skillId.name : null))
          .filter((n): n is string => Boolean(n));

        // Gap Analysis
        const gapDoc = await GapAnalysis.findOne({ userId: userObjectId }).sort({ updatedAt: -1 });
        if (gapDoc?.criticalGaps) {
          criticalGaps = gapDoc.criticalGaps.map((g) => g.skillName);
        }

        // Parsed resume experience
        const resumeDoc = await ParsedResume.findOne({ userId: userObjectId }).sort({ updatedAt: -1 });
        if (resumeDoc?.experience) {
          resumeExperience = resumeDoc.experience
            .map((w) => `${w.role?.value || 'Developer'} at ${w.company?.value || 'Tech Corp'}`);
        }
      } catch {
        // Fallback to defaults if MongoDB query encounters issues
      }
    }

    if (!targetCareerTitle) {
      targetCareerTitle = 'Full Stack Software Engineer';
    }

    const mode = dto.mode || 'technical';
    const questionCount = dto.questionCount || 5;

    // Generate grounded contextual questions
    const questions = this.generateGroundedQuestions(
      targetCareerTitle,
      mode,
      questionCount,
      userSkillNames,
      criticalGaps,
      resumeExperience,
      dto.opportunityContext
    );

    const sessionData = {
      _id: new mongoose.Types.ObjectId(),
      userId: userObjectId,
      targetCareerId: targetCareerIdObj,
      targetCareerTitle,
      mode,
      status: 'active' as const,
      startedAt: new Date(),
      questionCount: questions.length,
      currentQuestionIndex: 0,
      questions,
      strengths: [],
      weaknesses: [],
      preparationRecommendations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      const session = new InterviewSession(sessionData);
      await session.save();
      return session;
    } else {
      const key = `${userId}_${sessionData._id}`;
      this.inMemorySessions.set(key, sessionData);
      return sessionData as any;
    }
  }

  /**
   * Retrieve an active or completed interview session by ID for an authenticated user
   */
  public async getSession(userId: string, sessionId: string): Promise<IInterviewSession> {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new Error('Invalid session ID or user ID');
    }

    if (mongoose.connection.readyState === 1) {
      const session = await InterviewSession.findOne({
        _id: new mongoose.Types.ObjectId(sessionId),
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!session) {
        throw new Error('Interview session not found or access denied');
      }

      return session;
    } else {
      const key = `${userId}_${sessionId}`;
      const session = this.inMemorySessions.get(key);
      if (!session) {
        throw new Error('Interview session not found or access denied');
      }
      return session as any;
    }
  }

  /**
   * Evaluate candidate response for a specific question index
   */
  public async respondToQuestion(userId: string, sessionId: string, dto: RespondQuestionDTO): Promise<IInterviewSession> {
    const session = await this.getSession(userId, sessionId);

    if (session.status !== 'active') {
      throw new Error('Interview session is no longer active');
    }

    if (dto.questionIndex < 0 || dto.questionIndex >= session.questions.length) {
      throw new Error('Invalid question index');
    }

    const q = session.questions[dto.questionIndex];
    q.candidateResponse = dto.candidateResponse;

    // Evaluate response deterministically based on STAR keywords, action verbs, metrics, and expected concepts
    const evaluation = this.evaluateResponse(dto.candidateResponse, q);
    q.evaluation = evaluation;

    // Advance question index if applicable
    if (session.currentQuestionIndex <= dto.questionIndex) {
      session.currentQuestionIndex = Math.min(session.questions.length - 1, dto.questionIndex + 1);
    }

    if (mongoose.connection.readyState === 1 && typeof session.save === 'function') {
      await session.save();
    }
    return session;
  }

  /**
   * Finalize and complete interview session, calculating final scores and recommendations
   */
  public async completeSession(userId: string, sessionId: string): Promise<IInterviewSession> {
    const session = await this.getSession(userId, sessionId);

    const evaluatedQuestions = session.questions.filter((q) => q.evaluation && typeof q.evaluation.score === 'number');

    let overallScore = 0;
    if (evaluatedQuestions.length > 0) {
      const sum = evaluatedQuestions.reduce((acc, q) => acc + (q.evaluation?.score || 0), 0);
      overallScore = Math.round(sum / evaluatedQuestions.length);
    }

    session.overallScore = overallScore;
    session.status = 'completed';
    session.completedAt = new Date();

    // Compute dimension scores
    const techQs = session.questions.filter((q) => q.category === 'technical' && q.evaluation);
    const behQs = session.questions.filter((q) => q.category === 'behavioral' && q.evaluation);
    const projQs = session.questions.filter((q) => q.category === 'project' && q.evaluation);

    session.dimensionScores = {
      technical: techQs.length ? Math.round(techQs.reduce((acc, q) => acc + (q.evaluation?.score || 0), 0) / techQs.length) : overallScore,
      behavioral: behQs.length ? Math.round(behQs.reduce((acc, q) => acc + (q.evaluation?.score || 0), 0) / behQs.length) : Math.max(0, overallScore - 5),
      communication: Math.min(100, overallScore + 5),
      project: projQs.length ? Math.round(projQs.reduce((acc, q) => acc + (q.evaluation?.score || 0), 0) / projQs.length) : overallScore,
    };

    // Extract consolidated strengths & weaknesses
    const allStrengths = evaluatedQuestions.flatMap((q) => q.evaluation?.strengths || []);
    const allImprovements = evaluatedQuestions.flatMap((q) => q.evaluation?.improvements || []);

    session.strengths = Array.from(new Set(allStrengths)).slice(0, 5);
    session.weaknesses = Array.from(new Set(allImprovements)).slice(0, 5);

    // Connected preparation recommendations
    session.preparationRecommendations = [
      `Review core architecture & system design patterns for ${session.targetCareerTitle}`,
      'Practice quantifying impact in STAR behavioral responses (e.g. 35% latency reduction)',
      'Update active resume and project evidence in SkillBridge Profile',
      'Follow your personalized SkillBridge Roadmap milestones to close identified gaps',
    ];

    if (mongoose.connection.readyState === 1 && typeof session.save === 'function') {
      await session.save();
    }
    return session;
  }

  /**
   * Retrieve session history for authenticated user
   */
  public async getHistory(userId: string): Promise<IInterviewSession[]> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return [];
    }

    if (mongoose.connection.readyState === 1) {
      return InterviewSession.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(20);
    } else {
      const results: any[] = [];
      for (const [key, val] of this.inMemorySessions.entries()) {
        if (key.startsWith(`${userId}_`)) {
          results.push(val);
        }
      }
      return results as any;
    }
  }

  /**
   * Helper: Generate grounded contextual questions
   */
  private generateGroundedQuestions(
    roleTitle: string,
    mode: string,
    count: number,
    verifiedSkills: string[],
    criticalGaps: string[],
    resumeExperience: string[],
    opportunityContext?: { company?: string; description?: string }
  ): IQuestionItem[] {
    const company = opportunityContext?.company ? `at ${opportunityContext.company}` : '';
    const skillsList = verifiedSkills.slice(0, 3).join(', ') || 'software development, APIs, data modeling';
    const gapList = criticalGaps.slice(0, 2).join(', ') || 'distributed caching, CI/CD automation';

    const pool: IQuestionItem[] = [
      {
        questionId: 'q_tech_01',
        question: `How would you design a high-throughput, fault-tolerant service for ${roleTitle} ${company} leveraging your verified skills in ${skillsList}?`,
        category: 'technical',
        difficulty: 'hard',
        expectedConcepts: ['Scalability', 'Fault Tolerance', 'API Rate Limiting', 'Caching'],
      },
      {
        questionId: 'q_tech_02',
        question: `Describe how you approach addressing skill gaps in ${gapList} when building enterprise applications for ${roleTitle}.`,
        category: 'technical',
        difficulty: 'medium',
        expectedConcepts: ['Skill Gap Mitigation', 'Continuous Learning', 'System Reliability'],
      },
      {
        questionId: 'q_beh_01',
        question: `Describe a challenging situation in your previous work where a critical production bug occurred. Use the STAR method to explain your action and quantified result.`,
        category: 'behavioral',
        difficulty: 'medium',
        expectedConcepts: ['Situation/Task', 'Action Verb Vocabulary', 'Quantified Impact Metrics'],
      },
      {
        questionId: 'q_proj_01',
        question: `Walk through a key technical architecture decision in one of your recent software projects. What trade-offs did you evaluate?`,
        category: 'project',
        difficulty: 'hard',
        expectedConcepts: ['Architectural Trade-offs', 'Database Selection', 'Security Isolation'],
      },
      {
        questionId: 'q_res_01',
        question: `Based on your resume experience (${resumeExperience[0] || 'software development projects'}), explain how you measure technical debt and ensure maintainability.`,
        category: 'resume',
        difficulty: 'medium',
        expectedConcepts: ['Code Quality', 'Refactoring', 'Test Coverage'],
      },
    ];

    if (mode === 'behavioral') {
      return pool.filter((q) => q.category === 'behavioral' || q.category === 'resume').concat(pool).slice(0, count);
    }
    if (mode === 'project') {
      return pool.filter((q) => q.category === 'project' || q.category === 'technical').concat(pool).slice(0, count);
    }

    return pool.slice(0, count);
  }

  /**
   * Helper: Evaluate candidate response against STAR standards & expected concepts
   */
  private evaluateResponse(candidateResponse: string, question: IQuestionItem) {
    const text = candidateResponse.trim();
    const hasActionVerbs = /built|architected|implemented|developed|designed|led|spearheaded|engineered/i.test(text);
    const hasQuantifiedMetrics = /\d+%|\$\d+|\d+ms|\d+x|\d+k|\d+ RPS/i.test(text);

    let matchedConcepts = 0;
    const missingConcepts: string[] = [];

    for (const concept of question.expectedConcepts) {
      const regex = new RegExp(concept.split(' ')[0], 'i');
      if (regex.test(text)) {
        matchedConcepts++;
      } else {
        missingConcepts.push(concept);
      }
    }

    const conceptScore = question.expectedConcepts.length > 0
      ? Math.round((matchedConcepts / question.expectedConcepts.length) * 40)
      : 30;

    const actionScore = hasActionVerbs ? 30 : 15;
    const metricScore = hasQuantifiedMetrics ? 30 : 15;

    const totalScore = Math.min(100, conceptScore + actionScore + metricScore);

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (hasActionVerbs) strengths.push('Strong action-oriented engineering vocabulary used');
    else improvements.push('Use clear action verbs (e.g. Architected, Implemented, Engineered)');

    if (hasQuantifiedMetrics) strengths.push('Explicit quantified metrics provided (e.g. 35% latency reduction)');
    else improvements.push('Include explicit quantified business/technical metrics');

    if (matchedConcepts > 0) strengths.push(`Addressed core concepts (${question.expectedConcepts.slice(0, matchedConcepts).join(', ')})`);
    if (missingConcepts.length > 0) improvements.push(`Detail coverage for: ${missingConcepts.join(', ')}`);

    return {
      score: totalScore,
      starFormatted: hasActionVerbs && hasQuantifiedMetrics,
      strengths,
      improvements,
      missingConcepts,
      feedback: totalScore >= 80
        ? 'Exemplary STAR structured response demonstrating high technical depth and quantified impact.'
        : 'Good technical response. Incorporate explicit performance metrics and action verbs to strengthen STAR formatting.',
      evaluatedAt: new Date(),
    };
  }
}

export default new InterviewService();
