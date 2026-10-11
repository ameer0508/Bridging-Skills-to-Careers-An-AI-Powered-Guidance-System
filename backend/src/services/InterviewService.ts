import mongoose from 'mongoose';
import InterviewSession, { IInterviewSession, IQuestionItem } from '../models/InterviewSession.js';
import UserSkill from '../models/UserSkill.js';
import CareerMatch from '../models/CareerMatch.js';
import GapAnalysis from '../models/GapAnalysis.js';
import ParsedResume from '../models/ParsedResume.js';
import { evaluateAnswer } from './InterviewEvaluator.js';
import { AppError } from '../middlewares/errorHandler.js';

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
  // Fallback store used only while the database is unreachable
  private inMemorySessions = new Map<string, IInterviewSession>();

  /**
   * Start a new grounded AI interview session using candidate database context
   */
  public async startSession(userId: string, dto: StartInterviewDTO = {}): Promise<IInterviewSession> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid user ID provided', 400, 'INVALID_ID');
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
          // Only real entries: no placeholder role or employer is ever inserted
          resumeExperience = resumeDoc.experience
            .filter((w) => w.role?.value && w.company?.value)
            .map((w) => `${w.role?.value} at ${w.company?.value}`);
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
      const transient = sessionData as unknown as IInterviewSession;
      this.inMemorySessions.set(key, transient);
      return transient;
    }
  }

  /**
   * Retrieve an active or completed interview session by ID for an authenticated user
   */
  public async getSession(userId: string, sessionId: string): Promise<IInterviewSession> {
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new AppError('Invalid session ID or user ID', 400, 'INVALID_ID');
    }

    if (mongoose.connection.readyState === 1) {
      const session = await InterviewSession.findOne({
        _id: new mongoose.Types.ObjectId(sessionId),
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!session) {
        throw new AppError('Interview session not found or access denied', 404, 'INTERVIEW_NOT_FOUND');
      }

      return session;
    } else {
      const key = `${userId}_${sessionId}`;
      const session = this.inMemorySessions.get(key);
      if (!session) {
        throw new AppError('Interview session not found or access denied', 404, 'INTERVIEW_NOT_FOUND');
      }
      return session;
    }
  }

  /**
   * Evaluate candidate response for a specific question index
   */
  public async respondToQuestion(userId: string, sessionId: string, dto: RespondQuestionDTO): Promise<IInterviewSession> {
    const session = await this.getSession(userId, sessionId);

    if (session.status !== 'active') {
      throw new AppError('Interview session is no longer active', 409, 'INTERVIEW_NOT_ACTIVE');
    }

    if (dto.questionIndex < 0 || dto.questionIndex >= session.questions.length) {
      throw new AppError('Invalid question index', 400, 'INVALID_QUESTION_INDEX');
    }

    const q = session.questions[dto.questionIndex];
    q.candidateResponse = dto.candidateResponse;

    // AI rubric when available, otherwise the labelled rule-based rubric
    const evaluation = await evaluateAnswer(dto.candidateResponse, q, session.targetCareerTitle);
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
    const totalQuestions = session.questions.length;

    // Unanswered questions count as zero: skipping most of an interview must not look like a pass
    const overallScore =
      totalQuestions > 0
        ? Math.round(evaluatedQuestions.reduce((acc, q) => acc + (q.evaluation?.score || 0), 0) / totalQuestions)
        : 0;

    session.overallScore = overallScore;
    session.answeredCount = evaluatedQuestions.length;
    session.status = 'completed';
    session.completedAt = new Date();

    // Dimension scores are averages of what was actually measured for each answer.
    // A dimension nobody could judge (e.g. technical accuracy without AI) stays null.
    const average = (values: Array<number | null | undefined>): number | null => {
      const numbers = values.filter((n): n is number => typeof n === 'number');
      return numbers.length ? Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length) : null;
    };
    const dims = evaluatedQuestions.map((q) => q.evaluation?.dimensions);
    session.dimensionScores = {
      relevance: average(dims.map((d) => d?.relevance)),
      completeness: average(dims.map((d) => d?.completeness)),
      specificity: average(dims.map((d) => d?.specificity)),
      structure: average(dims.map((d) => d?.structure)),
      technicalAccuracy: average(dims.map((d) => d?.technicalAccuracy)),
    };

    const sources = new Set(evaluatedQuestions.map((q) => q.evaluation?.source || 'heuristic'));
    session.evaluationSource = sources.size === 0 ? undefined : sources.size > 1 ? 'mixed' : [...sources][0];

    const allStrengths = evaluatedQuestions.flatMap((q) => q.evaluation?.strengths || []);
    const allImprovements = evaluatedQuestions.flatMap((q) => q.evaluation?.improvements || []);
    session.strengths = Array.from(new Set(allStrengths)).slice(0, 5);
    session.weaknesses = Array.from(new Set(allImprovements)).slice(0, 5);

    // Preparation advice derived from this session's own results
    const advice: string[] = [];
    const unanswered = totalQuestions - evaluatedQuestions.length;
    if (unanswered > 0) {
      advice.push(`Answer every question next time: ${unanswered} of ${totalQuestions} were left unanswered and scored zero.`);
    }
    const missedConcepts = Array.from(new Set(evaluatedQuestions.flatMap((q) => q.evaluation?.missingConcepts || []))).slice(0, 4);
    if (missedConcepts.length > 0) {
      advice.push(`Review these topics, which your answers did not cover: ${missedConcepts.join(', ')}.`);
    }
    const dimensionLabels: Record<string, string> = {
      relevance: 'staying on the question asked',
      completeness: 'developing answers in more depth',
      specificity: 'giving concrete details, tools and measured results',
      structure: 'structuring answers (Situation, Task, Action, Result for behavioural questions)',
      technicalAccuracy: 'technical accuracy',
    };
    const weakest = Object.entries(session.dimensionScores)
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
      .sort((x, y) => x[1] - y[1])[0];
    if (weakest && weakest[1] < 70) {
      advice.push(`Your weakest area was ${dimensionLabels[weakest[0]]} (${weakest[1]}/100). Focus your next practice session on it.`);
    }
    if (sources.has('heuristic')) {
      advice.push('Some answers were scored by the built-in rubric because AI evaluation was unavailable; technical correctness was not checked for those.');
    }
    session.preparationRecommendations = advice;

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
      const results: IInterviewSession[] = [];
      for (const [key, val] of this.inMemorySessions.entries()) {
        if (key.startsWith(`${userId}_`)) {
          results.push(val);
        }
      }
      return results;
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
    // Questions only refer to skills, gaps and experience the candidate actually has on record
    const skillsList = verifiedSkills.slice(0, 3).join(', ');
    const gapList = criticalGaps.slice(0, 2).join(', ');

    const pool: IQuestionItem[] = [
      {
        questionId: 'q_tech_01',
        question: skillsList
          ? `How would you design a reliable, scalable service for a ${roleTitle} role ${company} using your experience with ${skillsList}?`
          : `How would you design a reliable, scalable service for a ${roleTitle} role ${company}? Explain your main design decisions.`,
        category: 'technical',
        difficulty: 'hard',
        expectedConcepts: ['Scalability', 'Fault Tolerance', 'API Rate Limiting', 'Caching'],
      },
      {
        questionId: 'q_tech_02',
        question: gapList
          ? `Your profile shows little evidence of ${gapList}, which ${roleTitle} roles commonly expect. How would you get productive in ${gapList} on a real project?`
          : `Describe how you get productive in a technology you have not used before when a ${roleTitle} project requires it.`,
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
        question: resumeExperience[0]
          ? `From your time as ${resumeExperience[0]}, describe a piece of work you are proud of and how you kept it maintainable.`
          : 'Describe a project you have worked on and how you kept the code maintainable as it grew.',
        category: 'resume',
        difficulty: 'medium',
        expectedConcepts: ['Code Quality', 'Refactoring', 'Test Coverage'],
      },
    ];

    // Questions of the requested kind first, then the rest; never the same question twice
    const prioritised = (categories: string[]) =>
      [...pool.filter((q) => categories.includes(q.category)), ...pool.filter((q) => !categories.includes(q.category))].slice(0, count);

    if (mode === 'behavioral') {
      return prioritised(['behavioral', 'resume']);
    }
    if (mode === 'project') {
      return prioritised(['project', 'technical']);
    }

    return pool.slice(0, count);
  }
}

export default new InterviewService();
