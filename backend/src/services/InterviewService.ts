import mongoose from 'mongoose';
import InterviewSession, { IInterviewSession } from '../models/InterviewSession.js';
import UserSkill from '../models/UserSkill.js';
import CareerMatch from '../models/CareerMatch.js';
import GapAnalysis from '../models/GapAnalysis.js';
import ParsedResume from '../models/ParsedResume.js';
import Resume from '../models/Resume.js';
import { User } from '../models/User.js';
import { evaluateAnswer } from './InterviewEvaluator.js';
import { resolveRubric, rubricById, RUBRICS, type RubricId } from './interview/InterviewRubrics.js';
import { buildFollowUp, followUpReason, MAX_FOLLOW_UPS_PER_SESSION, recovered } from './interview/FollowUpService.js';
import { generateInterviewQuestions, INTERVIEW_MODES, type InterviewMode } from './InterviewQuestionGenerator.js';
import { extractSkills } from '../utils/skillLexicon.js';
import logger from '../config/logger.js';
import { AppError } from '../middlewares/errorHandler.js';

export interface StartInterviewDTO {
  targetCareerId?: string;
  targetCareerTitle?: string;
  mode?: InterviewMode;
  questionCount?: number;
  /** Role rubric to score with; resolved from the role title when omitted. */
  rubricId?: RubricId;
  /** D3: ask a follow-up when an answer misses something. */
  adaptiveFollowUps?: boolean;
  opportunityContext?: {
    title?: string;
    company?: string;
    description?: string;
  };
}

export interface RespondQuestionDTO {
  questionIndex: number;
  candidateResponse: string;
  /** D2: how the answer was entered; dictated text is always editable before it is sent. */
  inputMethod?: 'typed' | 'dictated' | 'mixed';
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
    const job = dto.opportunityContext;

    // A session started from a job posting prepares for that posting's role
    let targetCareerTitle = dto.targetCareerTitle || job?.title || '';
    let targetCareerIdObj: mongoose.Types.ObjectId | undefined = dto.targetCareerId && mongoose.Types.ObjectId.isValid(dto.targetCareerId)
      ? new mongoose.Types.ObjectId(dto.targetCareerId)
      : undefined;

    let userSkillNames: string[] = [];
    let criticalGaps: string[] = [];
    let resumeExperience: string[] = [];
    let resumeProjects: string[] = [];
    let recentQuestionIds: string[] = [];
    let recentQuestionTexts: string[] = [];
    let sessionOrdinal = 0;

    if (mongoose.connection.readyState === 1) {
      try {
        const topMatch = await CareerMatch.findOne({ userId: userObjectId })
          .sort({ matchScore: -1, confidence: -1, _id: 1 })
          .populate<{ careerId: { _id: mongoose.Types.ObjectId; title: string } }>('careerId');
        const topCareer = topMatch?.careerId && typeof topMatch.careerId === 'object' ? topMatch.careerId : null;

        if (!targetCareerTitle) {
          // The role the user chose during onboarding comes first, then their best match
          const user = await User.findById(userObjectId).select('targetRole');
          targetCareerTitle = user?.targetRole || topCareer?.title || '';
        }
        if (!targetCareerIdObj && topCareer && topCareer.title === targetCareerTitle) {
          targetCareerIdObj = topCareer._id;
        }

        // Skills on the profile, strongest evidence first
        const skillsDocs = await UserSkill.find({ userId: userObjectId })
          .sort({ evidenceScore: -1 })
          .populate<{ skillId: { canonicalName?: string; name?: string } }>('skillId');
        userSkillNames = skillsDocs
          .map((s) => (s.skillId && typeof s.skillId === 'object' ? s.skillId.canonicalName || s.skillId.name : null))
          .filter((n): n is string => Boolean(n));

        // Gaps for the career being prepared for; otherwise for the best match
        const gapCareerId = targetCareerIdObj ?? topCareer?._id;
        const gapDoc = gapCareerId
          ? await GapAnalysis.findOne({ userId: userObjectId, careerId: gapCareerId })
          : await GapAnalysis.findOne({ userId: userObjectId }).sort({ updatedAt: -1 });
        if (gapDoc?.criticalGaps) {
          criticalGaps = gapDoc.criticalGaps.map((g) => g.skillName);
        }

        // Only the active resume: a replaced or deleted resume no longer describes the user
        const activeResume = await Resume.findOne({ userId: userObjectId, isActive: true });
        const resumeDoc = activeResume ? await ParsedResume.findOne({ resumeId: activeResume._id }) : null;
        if (resumeDoc?.experience) {
          // Only real entries: no placeholder role or employer is ever inserted
          resumeExperience = resumeDoc.experience
            .filter((w) => w.role?.value && w.company?.value)
            .map((w) => `${w.role?.value} at ${w.company?.value}`);
        }
        if (resumeDoc?.projects) {
          resumeProjects = resumeDoc.projects
            .map((p) => (p as { name?: { value?: string } }).name?.value)
            .filter((n): n is string => typeof n === 'string' && n.trim().length > 0 && n.length <= 80);
        }

        const previous = await InterviewSession.find({ userId: userObjectId })
          .sort({ createdAt: -1 })
          .limit(10)
          .select('questions.questionId questions.question');
        recentQuestionIds = previous.flatMap((p) => p.questions.map((q) => q.questionId));
        recentQuestionTexts = previous.flatMap((p) => p.questions.map((q) => q.question));
        sessionOrdinal = await InterviewSession.countDocuments({ userId: userObjectId });
      } catch (error) {
        logger.warn(`Interview context could not be fully loaded: ${error instanceof Error ? error.message : error}`);
      }
    }

    if (!targetCareerTitle) {
      // Nothing on record yet: a neutral title, never a role the user did not choose
      targetCareerTitle = 'General Interview Practice';
    }

    const mode: InterviewMode = dto.mode && INTERVIEW_MODES.includes(dto.mode) ? dto.mode : 'technical';
    const questionCount = Math.min(10, Math.max(1, Math.round(dto.questionCount || 5)));

    // Skills named in the job posting, split by whether the profile shows them
    const profileSkills = new Set(userSkillNames.map((n) => n.toLowerCase()));
    const postingSkills = job?.description ? extractSkills(job.description) : [];
    // A role title alone is just the target role; a posting has an employer or a description
    const hasJob = Boolean(job && (job.company?.trim() || job.description?.trim()));

    const generated = await generateInterviewQuestions({
      userId,
      roleTitle: targetCareerTitle,
      mode,
      count: questionCount,
      skills: userSkillNames,
      gaps: criticalGaps,
      experience: resumeExperience,
      projects: resumeProjects,
      job: hasJob
        ? {
            title: job?.title,
            company: job?.company,
            description: job?.description,
            matchedSkills: postingSkills.filter((n) => profileSkills.has(n.toLowerCase())),
            missingSkills: postingSkills.filter((n) => !profileSkills.has(n.toLowerCase())),
          }
        : undefined,
      recentQuestionIds,
      recentQuestionTexts,
      sessionOrdinal,
    });
    const questions = generated.questions;
    const rubric = dto.rubricId ? RUBRICS[dto.rubricId] : resolveRubric(targetCareerTitle);
    if (questions.length === 0) {
      throw new AppError('No interview questions could be prepared. Please try again.', 503, 'QUESTIONS_UNAVAILABLE');
    }

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
      questionSource: generated.source,
      rubricId: rubric.id,
      rubricVersion: rubric.version,
      adaptiveFollowUps: Boolean(dto.adaptiveFollowUps),
      opportunityContext: hasJob ? { title: job?.title, company: job?.company } : undefined,
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
    q.answerInputMethod = dto.inputMethod ?? 'typed';

    // AI rubric when available, otherwise the labelled rule-based rubric
    // The rubric stored with the session; sessions from before rubrics were scored with 'general'
    const evaluation = await evaluateAnswer(dto.candidateResponse, q, session.targetCareerTitle, rubricById(session.rubricId));
    q.evaluation = evaluation;

    // D3: one follow-up per question, asked right after it, when the answer missed something
    if (session.adaptiveFollowUps) {
      const asked = session.questions.filter((item) => item.followUpOf).length;
      const already = session.questions.some((item) => item.followUpOf === q.questionId);
      const reason = followUpReason(q, evaluation);
      if (reason && !already && asked < MAX_FOLLOW_UPS_PER_SESSION) {
        const number = session.questions.slice(0, dto.questionIndex + 1).filter((item) => !item.followUpOf).length;
        session.questions.splice(dto.questionIndex + 1, 0, buildFollowUp(q, reason, number));
      }
    }

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

    // Follow-ups (D3) are reported on their own and kept out of the overall score and dimensions
    const primary = session.questions.filter((q) => !q.followUpOf);
    const followUps = session.questions.filter((q) => q.followUpOf);
    // X9: answers that could not be scored fairly (not in English) are out of both the total and the count
    const notScored = primary.filter((q) => q.evaluation?.notScored);
    const evaluatedQuestions = primary.filter((q) => q.evaluation && typeof q.evaluation.score === 'number' && !q.evaluation.notScored);
    const totalQuestions = primary.length - notScored.length;

    // Unanswered questions count as zero: skipping most of an interview must not look like a pass
    const overallScore =
      totalQuestions > 0
        ? Math.round(evaluatedQuestions.reduce((acc, q) => acc + (q.evaluation?.score || 0), 0) / totalQuestions)
        : 0;

    session.overallScore = overallScore;
    session.answeredCount = evaluatedQuestions.length;
    session.notScoredCount = notScored.length;
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
    if (notScored.length > 0) {
      advice.push(`${notScored.length} answer${notScored.length === 1 ? ' was' : 's were'} not in English and could not be scored; ${notScored.length === 1 ? 'it is' : 'they are'} saved but left out of your overall score.`);
    }
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
    if (followUps.length > 0) {
      const answeredFollowUps = followUps.filter((q) => q.evaluation && typeof q.evaluation.score === 'number');
      const recoveredCount = answeredFollowUps.filter((q) => recovered(q) === true).length;
      session.followUpSummary = {
        asked: followUps.length,
        answered: answeredFollowUps.length,
        recovered: recoveredCount,
        averageScore: answeredFollowUps.length
          ? Math.round(answeredFollowUps.reduce((acc, q) => acc + (q.evaluation?.score || 0), 0) / answeredFollowUps.length)
          : null,
      };
      advice.push(
        `Follow-ups: you were asked ${followUps.length} and recovered the missing point in ${recoveredCount} of ${answeredFollowUps.length} answered. ` +
          'Covering those points in your first answer is what moves the score.'
      );
    }
    session.preparationRecommendations = advice;

    if (mongoose.connection.readyState === 1 && typeof session.save === 'function') {
      await session.save();
      // D1: with retention 0, this round's recordings are deleted now
      const { default: VoiceRecordingService } = await import('./interview/VoiceRecordingService.js');
      await VoiceRecordingService.onSessionCompleted(userId, sessionId);
      // Interview weaknesses feed recommendations; scores are unaffected, so only those are refreshed
      const { default: RecalculationService } = await import('./RecalculationService.js');
      await RecalculationService.run(userId, 'interview_completed', sessionId);
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
}

export default new InterviewService();
