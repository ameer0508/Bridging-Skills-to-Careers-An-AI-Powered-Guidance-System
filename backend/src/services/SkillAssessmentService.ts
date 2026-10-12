import crypto from 'node:crypto';
import mongoose from 'mongoose';
import AssessmentAttempt, { type IAssessmentAttempt } from '../models/AssessmentAttempt.js';
import { Skill, type ISkill } from '../models/Skill.js';
import { UserSkill, type IEvidence } from '../models/UserSkill.js';
import {
  SKILL_ASSESSMENTS,
  ASSESSMENT_BANK_VERSION,
  ASSESSMENT_PASS_MARK,
  ASSESSMENT_QUESTION_COUNT,
  criteriaFor,
  type AssessmentQuestion
} from '../seed/skillAssessments.js';
import EvidenceCalculator, { EVIDENCE_POINTS } from './EvidenceCalculator.js';
import RecalculationService from './RecalculationService.js';
import { escapeRegExp, lookupSkill } from '../utils/skillLexicon.js';
import { withUserLock } from '../utils/userLock.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Skill checks: a short multiple-choice quiz per skill, scored on the server.
 *
 * A pass is stored as evidence of kind "assessment" (verification "assessed"), dated on the day
 * it was taken. It is worth a fixed number of points, once per skill however often it is passed,
 * and it triggers the same recalculation as any other change of evidence. A failed or abandoned
 * attempt is kept in the user's history and changes no score.
 *
 * What a pass means is limited: five conceptual questions answered correctly at one point in
 * time, from a small bank the user may see again. It is not a certification.
 */
export const ASSESSMENT_POLICY = {
  /** Defaults; a skill may set its own (see criteriaFor). */
  questionCount: ASSESSMENT_QUESTION_COUNT,
  passMark: ASSESSMENT_PASS_MARK,
  /** An attempt must be submitted within this many minutes of starting. */
  minutesToComplete: 15,
  /** Attempts that may be started per skill in any 24 hours. */
  attemptsPerDay: 3,
  /** Points a pass adds to the skill's evidence score, once per skill. */
  points: EVIDENCE_POINTS.assessment
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;

const shuffled = <T>(items: readonly T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

/** The bank's name for a skill ("js" -> "JavaScript"), or undefined when it has no skill check. */
export const assessableSkill = (name: string): string | undefined => {
  const wanted = (lookupSkill(name)?.name || name).trim().toLowerCase();
  return Object.keys(SKILL_ASSESSMENTS).find(skill => skill.toLowerCase() === wanted);
};

class SkillAssessmentService {
  // ------------------------------------------------------------------------------------------
  // Reading
  // ------------------------------------------------------------------------------------------

  /** Every skill that has a skill check, with the caller's standing on each, and their history. */
  public async overview(userId: string) {
    const uid = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    await this.expireOverdue(uid, now);

    const [userSkills, attempts] = await Promise.all([
      UserSkill.find({ userId: uid }).populate('skillId'),
      AssessmentAttempt.find({ userId: uid }).sort({ startedAt: -1, _id: -1 })
    ]);

    const skills = Object.keys(SKILL_ASSESSMENTS).map(skillName => {
      const userSkill = userSkills.find(us => assessableSkill((us.skillId as unknown as { canonicalName?: string } | null)?.canonicalName || '') === skillName);
      const passedEvidence = userSkill?.evidences.find(e => e.sourceType === 'assessment');
      const mine = attempts.filter(a => a.skillName === skillName);
      const recent = mine.filter(a => now.getTime() - a.startedAt.getTime() < DAY_MS);
      const inProgress = mine.find(a => a.status === 'in_progress');
      const attemptsRemaining = Math.max(0, ASSESSMENT_POLICY.attemptsPerDay - recent.length);
      const last = mine.find(a => a.status === 'submitted');
      return {
        skill: skillName,
        questionsInBank: SKILL_ASSESSMENTS[skillName].length,
        ...criteriaFor(skillName),
        onProfile: Boolean(userSkill),
        evidenceScore: userSkill?.evidenceScore ?? null,
        verified: Boolean(passedEvidence),
        verifiedAt: passedEvidence?.observedAt ?? null,
        inProgressAttemptId: inProgress ? inProgress._id.toString() : null,
        attemptsRemaining,
        // When the limit is used up: the moment the oldest attempt in the window drops out of it
        nextAttemptAt: attemptsRemaining === 0 ? new Date(recent[recent.length - 1].startedAt.getTime() + DAY_MS) : null,
        lastResult: last ? { correct: last.correctCount ?? 0, of: last.questions.length, passed: Boolean(last.passed), at: last.submittedAt ?? null } : null
      };
    });

    return {
      skills,
      history: attempts.slice(0, 20).map(a => this.summary(a)),
      policy: ASSESSMENT_POLICY,
      bankVersion: ASSESSMENT_BANK_VERSION,
      note:
        'A skill check is a short multiple-choice quiz written for SkillBridge. Passing shows you answered conceptual questions correctly on that day. It is not a certification and does not test building anything.'
    };
  }

  // ------------------------------------------------------------------------------------------
  // Taking a skill check
  // ------------------------------------------------------------------------------------------

  /**
   * Starts an attempt, or returns the one already in progress for that skill. Questions are
   * returned without their answers; the order of the options is shuffled per attempt.
   */
  public start(userId: string, requestedSkill: string) {
    return withUserLock(`assessment:${userId}`, async () => {
      const skillName = assessableSkill(requestedSkill);
      if (!skillName) throw new AppError(`There is no skill check for "${requestedSkill.trim().slice(0, 80)}" yet.`, 404, 'ASSESSMENT_NOT_AVAILABLE');

      const uid = new mongoose.Types.ObjectId(userId);
      const now = new Date();
      await this.expireOverdue(uid, now);

      const open = await AssessmentAttempt.findOne({ userId: uid, skillName, status: 'in_progress' });
      if (open) return { ...this.present(open), resumed: true };

      const recent = await AssessmentAttempt.find({ userId: uid, skillName, startedAt: { $gt: new Date(now.getTime() - DAY_MS) } }).sort({ startedAt: 1 });
      if (recent.length >= ASSESSMENT_POLICY.attemptsPerDay) {
        const nextAt = new Date(recent[0].startedAt.getTime() + DAY_MS);
        throw new AppError(
          `You have used all ${ASSESSMENT_POLICY.attemptsPerDay} attempts at the ${skillName} skill check for today. You can try again after ${nextAt.toISOString()}.`,
          429,
          'ASSESSMENT_ATTEMPT_LIMIT'
        );
      }

      // Prefer questions that were not in the previous attempt
      const previous = await AssessmentAttempt.findOne({ userId: uid, skillName }).sort({ startedAt: -1, _id: -1 });
      const seen = new Set((previous?.questions || []).map(q => q.questionId));
      const bank = SKILL_ASSESSMENTS[skillName];
      const chosen = [...shuffled(bank.filter(q => !seen.has(q.id))), ...shuffled(bank.filter(q => seen.has(q.id)))].slice(0, criteriaFor(skillName).questionCount);

      const attempt = await AssessmentAttempt.create({
        userId: uid,
        skillName,
        questions: shuffled(chosen).map(q => ({ questionId: q.id, optionOrder: shuffled([0, 1, 2, 3]) })),
        status: 'in_progress',
        startedAt: now,
        expiresAt: new Date(now.getTime() + ASSESSMENT_POLICY.minutesToComplete * 60 * 1000),
        passMark: criteriaFor(skillName).passMark,
        bankVersion: ASSESSMENT_BANK_VERSION
      });
      return { ...this.present(attempt), resumed: false };
    });
  }

  /**
   * Scores an attempt. `answers` holds, per question in the order presented, the position of the
   * chosen option or null. An attempt can be submitted once, by its owner, before it expires.
   */
  public submit(userId: string, attemptId: string, answers: Array<number | null>) {
    return withUserLock(`assessment:${userId}`, async () => {
      if (!mongoose.Types.ObjectId.isValid(attemptId)) throw new AppError('Attempt not found.', 404, 'ATTEMPT_NOT_FOUND');
      const uid = new mongoose.Types.ObjectId(userId);
      const attempt = await AssessmentAttempt.findOne({ _id: new mongoose.Types.ObjectId(attemptId), userId: uid });
      if (!attempt) throw new AppError('Attempt not found.', 404, 'ATTEMPT_NOT_FOUND');
      if (attempt.status === 'submitted') throw new AppError('This attempt has already been submitted.', 409, 'ATTEMPT_ALREADY_SUBMITTED');

      const now = new Date();
      const questions = attempt.questions.map(q => this.question(attempt.skillName, q.questionId));
      if (attempt.status === 'expired' || attempt.expiresAt.getTime() < now.getTime() || questions.some(q => !q)) {
        if (attempt.status !== 'expired') await AssessmentAttempt.updateOne({ _id: attempt._id }, { $set: { status: 'expired' } });
        const reason = questions.some(q => !q)
          ? 'The questions for this skill check have changed since you started.'
          : `The ${ASSESSMENT_POLICY.minutesToComplete} minutes for this attempt have passed.`;
        throw new AppError(`${reason} Start a new attempt.`, 409, 'ATTEMPT_EXPIRED');
      }
      if (answers.length !== attempt.questions.length) {
        throw new AppError(`Invalid request: answers must have ${attempt.questions.length} entries, one per question.`, 400, 'VALIDATION_ERROR');
      }

      const review = attempt.questions.map((presented, index) => {
        const question = questions[index] as AssessmentQuestion;
        const chosen = answers[index];
        const correctPosition = presented.optionOrder.indexOf(question.answer);
        return {
          prompt: question.prompt,
          options: presented.optionOrder.map(i => question.options[i]),
          chosen,
          correctOption: correctPosition,
          correct: chosen === correctPosition,
          explanation: question.explanation
        };
      });
      const correctCount = review.filter(r => r.correct).length;
      const passed = correctCount >= attempt.passMark;

      // Claimed in one step so the same attempt cannot be scored twice
      const claimed = await AssessmentAttempt.updateOne(
        { _id: attempt._id, status: 'in_progress' },
        { $set: { status: 'submitted', submittedAt: now, answers, correctCount, passed } }
      );
      if (claimed.modifiedCount !== 1) throw new AppError('This attempt has already been submitted.', 409, 'ATTEMPT_ALREADY_SUBMITTED');

      let evidence: { added: boolean; evidenceScoreBefore: number | null; evidenceScoreAfter: number; userSkillId: string } | null = null;
      let recalculation: { status: string; modulesRecomputed: string[] } | null = null;
      if (passed) {
        evidence = await this.recordPass(uid, attempt.skillName, attempt._id.toString(), correctCount, review.length, now);
        const run = await RecalculationService.run(userId, 'skill_evidence_changed', attempt._id.toString());
        recalculation = { status: run.status, modulesRecomputed: run.modulesRecomputed };
      }

      return {
        attemptId: attempt._id.toString(),
        skill: attempt.skillName,
        correct: correctCount,
        of: review.length,
        passMark: attempt.passMark,
        passed,
        review,
        evidence,
        recalculation,
        note: passed
          ? evidence?.added
            ? `Recorded as assessed evidence worth ${ASSESSMENT_POLICY.points} points. It counts once per skill.`
            : 'Your earlier pass already counts for this skill; the date it was last shown has been updated.'
          : 'No score has changed. A failed attempt is kept in your history only.'
      };
    });
  }

  // ------------------------------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------------------------------

  private question(skillName: string, questionId: string): AssessmentQuestion | undefined {
    return (SKILL_ASSESSMENTS[skillName] || []).find(q => q.id === questionId);
  }

  /** Marks attempts whose time has run out, so they are never left "in progress". */
  private async expireOverdue(uid: mongoose.Types.ObjectId, now: Date): Promise<void> {
    await AssessmentAttempt.updateMany({ userId: uid, status: 'in_progress', expiresAt: { $lt: now } }, { $set: { status: 'expired' } });
  }

  /** The attempt as the person taking it sees it: no answers, no explanations. */
  private present(attempt: IAssessmentAttempt) {
    return {
      attemptId: attempt._id.toString(),
      skill: attempt.skillName,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      passMark: attempt.passMark,
      questions: attempt.questions.flatMap(presented => {
        const question = this.question(attempt.skillName, presented.questionId);
        return question ? [{ prompt: question.prompt, options: presented.optionOrder.map(i => question.options[i]) }] : [];
      })
    };
  }

  private summary(attempt: IAssessmentAttempt) {
    return {
      attemptId: attempt._id.toString(),
      skill: attempt.skillName,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt ?? null,
      correct: attempt.status === 'submitted' ? (attempt.correctCount ?? 0) : null,
      of: attempt.questions.length,
      passed: attempt.status === 'submitted' ? Boolean(attempt.passed) : null
    };
  }

  /** The canonical skill record, created from the lexicon when the user's resume never named it. */
  private async canonicalSkill(skillName: string): Promise<ISkill> {
    const exact = new RegExp(`^${escapeRegExp(skillName)}$`, 'i');
    const existing = await Skill.findOne({ $or: [{ canonicalName: exact }, { aliases: exact }] });
    if (existing) return existing;
    const known = lookupSkill(skillName);
    return Skill.create({ canonicalName: skillName, category: known?.category || 'General', aliases: known?.aliases || [], isActive: true });
  }

  private async recordPass(uid: mongoose.Types.ObjectId, skillName: string, attemptId: string, correct: number, of: number, now: Date) {
    const skill = await this.canonicalSkill(skillName);
    const evidence: IEvidence = {
      sourceType: 'assessment',
      sourceId: attemptId,
      description: `Verified by a SkillBridge skill check: ${skillName} (${correct} of ${of} correct). Not a professional certification`,
      weight: 0.5,
      points: ASSESSMENT_POLICY.points,
      observedAt: now,
      verification: 'assessed',
      recordedAt: now
    };

    const userSkill = await UserSkill.findOne({ userId: uid, skillId: skill._id });
    if (!userSkill) {
      const created = await UserSkill.create({
        userId: uid,
        skillId: skill._id,
        category: skill.category || 'General',
        evidenceScore: evidence.points,
        proficiency: EvidenceCalculator.estimateProficiency(evidence.points ?? 0),
        evidences: [evidence]
      });
      return { added: true, evidenceScoreBefore: null, evidenceScoreAfter: created.evidenceScore, userSkillId: created._id.toString() };
    }

    const before = userSkill.evidenceScore;
    const alreadyPassed = userSkill.evidences.some(e => e.sourceType === 'assessment');
    // A pass counts once per skill: a later pass replaces the record and its date, not the points
    const others = userSkill.evidences.filter(e => e.sourceType !== 'assessment');
    userSkill.evidences = [...others, evidence] as typeof userSkill.evidences;
    if (!alreadyPassed) {
      userSkill.evidenceScore = Math.min(100, before + ASSESSMENT_POLICY.points);
      userSkill.proficiency = EvidenceCalculator.estimateProficiency(userSkill.evidenceScore);
    }
    await userSkill.save();
    return { added: !alreadyPassed, evidenceScoreBefore: before, evidenceScoreAfter: userSkill.evidenceScore, userSkillId: userSkill._id.toString() };
  }
}

export default new SkillAssessmentService();
