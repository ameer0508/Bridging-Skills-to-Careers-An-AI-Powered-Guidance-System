import crypto from 'crypto';
import mongoose from 'mongoose';
import ExamAttempt, { ExamResponse, IExamAttempt } from '../../models/ExamAttempt.js';
import { ExamDefinition, EXAMS, EXAMS_BY_ID, topicsOf } from '../../seed/exams/examDefinitions.js';
import { GATE_CS_QUESTIONS } from '../../seed/exams/gateCsQuestions.js';
import { SSC_CGL_QUESTIONS } from '../../seed/exams/sscCglQuestions.js';
import type { PracticeQuestion } from '../../seed/exams/questionTypes.js';
import { markQuestion, penaltyFor, responseProblem, round2 } from './examScoring.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { withUserLock } from '../../utils/userLock.js';

/**
 * Everything that reads or changes one attempt runs one call at a time (answers, section starts,
 * submission and deadline expiry), so an answer can never be written after the attempt was scored.
 */
const attemptLock = <T>(attemptId: string, task: () => Promise<T>) => withUserLock(`exam-attempt:${attemptId}`, task);

/**
 * Exam practice attempts (E2, E3); see docs/EXAM_PREP.md.
 *
 * Timing is enforced on the server: a timed GATE attempt has one deadline for the whole set; a
 * timed SSC attempt runs section by section, each with its own deadline, and a section cannot be
 * reopened once the next has started. Answers can be changed until submission (or the deadline);
 * answers and explanations are revealed only after the attempt is completed.
 */

export const MIN_QUESTIONS = 1;
export const MAX_QUESTIONS = 40;
/** A topic with fewer practice questions than this is flagged as having limited content. */
export const LIMITED_TOPIC_QUESTIONS = 3;
/** Network and clock slack allowed after a deadline. */
export const DEADLINE_GRACE_MS = 5000;

export const QUESTIONS: PracticeQuestion[] = [...GATE_CS_QUESTIONS, ...SSC_CGL_QUESTIONS];
export const QUESTIONS_BY_ID = new Map(QUESTIONS.map(q => [q.id, q]));
export const questionsFor = (examId: string) => QUESTIONS.filter(q => q.examId === examId);

export function examOrThrow(examId: string): ExamDefinition {
  const exam = EXAMS_BY_ID.get(examId as ExamDefinition['id']);
  if (!exam) throw new AppError('Exam not found.', 404, 'EXAM_NOT_FOUND');
  return exam;
}

/** The syllabus with question counts, so screens can say where practice content is limited. */
export function catalogEntry(exam: ExamDefinition) {
  const bank = questionsFor(exam.id);
  return {
    id: exam.id,
    name: exam.name,
    shortName: exam.shortName,
    conductingBody: exam.conductingBody,
    syllabusVersion: exam.syllabusVersion,
    kind: exam.kind,
    sources: exam.sources,
    officialPattern: exam.officialPattern,
    practiceRules: exam.practiceRules,
    secondsPerQuestion: exam.secondsPerQuestion,
    sectionalTiming: exam.sectionalTiming,
    disclaimer: exam.disclaimer,
    questionCount: bank.length,
    sections: exam.sections.map(s => ({
      id: s.id,
      name: s.name,
      questionCount: bank.filter(q => q.sectionId === s.id).length,
      topics: s.topics.map(t => {
        const count = bank.filter(q => q.topicId === t.id).length;
        return { ...t, questionCount: count, limitedContent: count < LIMITED_TOPIC_QUESTIONS };
      }),
    })),
  };
}

const seededOrder = <T extends { id: string }>(items: T[], seed: string) =>
  [...items].sort((a, b) =>
    crypto.createHash('sha256').update(`${seed}:${a.id}`).digest('hex').localeCompare(crypto.createHash('sha256').update(`${seed}:${b.id}`).digest('hex'))
  );

const now = () => new Date();

class ExamPracticeService {
  catalog() {
    return EXAMS.map(catalogEntry);
  }

  private async owned(userId: string, attemptId: string): Promise<IExamAttempt> {
    if (!mongoose.Types.ObjectId.isValid(attemptId)) throw new AppError('Attempt not found.', 404, 'ATTEMPT_NOT_FOUND');
    const attempt = await ExamAttempt.findOne({ _id: attemptId, userId });
    if (!attempt) throw new AppError('Attempt not found.', 404, 'ATTEMPT_NOT_FOUND');
    await this.expireIfDue(attempt);
    return attempt;
  }

  /** A timed attempt past its (last) deadline is completed with the answers given in time. */
  private async expireIfDue(attempt: IExamAttempt) {
    if (attempt.status !== 'active' || attempt.mode !== 'timed') return;
    const t = now().getTime();
    const exam = examOrThrow(attempt.examId);
    if (exam.sectionalTiming) {
      const last = attempt.sections[attempt.sections.length - 1];
      const allClosed = attempt.sections.every(s => s.closedAt || (s.deadline && s.deadline.getTime() + DEADLINE_GRACE_MS < t));
      if (last.deadline && allClosed) {
        attempt.timedOut = true;
        this.finish(attempt);
        await attempt.save();
      }
    } else if (attempt.deadline && attempt.deadline.getTime() + DEADLINE_GRACE_MS < t) {
      attempt.timedOut = true;
      this.finish(attempt);
      await attempt.save();
    }
  }

  async start(userId: string, examId: string, input: { sectionIds?: string[]; topicIds?: string[]; count: number; mode: 'practice' | 'timed' }) {
    const exam = examOrThrow(examId);
    const topics = topicsOf(exam);
    const sectionIds = input.sectionIds ?? [];
    const topicIds = input.topicIds ?? [];
    const unknown = [...sectionIds.filter(id => !exam.sections.some(s => s.id === id)), ...topicIds.filter(id => !topics.some(t => t.id === id))];
    if (unknown.length) throw new AppError(`Invalid request: not part of this syllabus: ${unknown.join(', ')}`, 400, 'VALIDATION_ERROR');

    const eligible = questionsFor(exam.id).filter(
      q => (!sectionIds.length || sectionIds.includes(q.sectionId)) && (!topicIds.length || topicIds.includes(q.topicId))
    );
    if (eligible.length === 0) throw new AppError('There are no practice questions for this selection yet.', 400, 'NO_QUESTIONS');

    // Questions not yet seen by this user come first
    const previous = await ExamAttempt.find({ userId, examId }).select('items.questionId').lean();
    const seen = new Set(previous.flatMap(p => p.items.map(i => i.questionId)));
    const seed = `${userId}:${previous.length}`;
    let chosen = [...seededOrder(eligible.filter(q => !seen.has(q.id)), seed), ...seededOrder(eligible.filter(q => seen.has(q.id)), seed)].slice(0, input.count);
    // Questions follow the official section order (needed for sectional timing)
    const order = new Map(exam.sections.map((s, i) => [s.id, i]));
    chosen = [...chosen].sort((a, b) => (order.get(a.sectionId)! - order.get(b.sectionId)!));

    const timed = input.mode === 'timed';
    const startedAt = now();
    const sectionIdsUsed = [...new Set(chosen.map(q => q.sectionId))];
    const sections = sectionIdsUsed.map((sectionId, i) => {
      const limit = chosen.filter(q => q.sectionId === sectionId).length * exam.secondsPerQuestion;
      const first = timed && exam.sectionalTiming && i === 0;
      return {
        sectionId,
        timeLimitSec: timed && exam.sectionalTiming ? limit : null,
        startedAt: first ? startedAt : null,
        deadline: first ? new Date(startedAt.getTime() + limit * 1000) : null,
        closedAt: null,
      };
    });
    const timeLimitSec = timed && !exam.sectionalTiming ? chosen.length * exam.secondsPerQuestion : null;

    const attempt = await ExamAttempt.create({
      userId,
      examId: exam.id,
      syllabusVersion: exam.syllabusVersion,
      mode: input.mode,
      status: 'active',
      selection: { sectionIds, topicIds, requested: input.count },
      items: chosen.map(q => ({ questionId: q.id, sectionId: q.sectionId, topicId: q.topicId, response: null })),
      sections,
      timeLimitSec,
      deadline: timeLimitSec ? new Date(startedAt.getTime() + timeLimitSec * 1000) : null,
      startedAt,
    });
    return this.view(attempt);
  }

  async list(userId: string, examId: string) {
    examOrThrow(examId);
    const attempts = await ExamAttempt.find({ userId, examId }).sort({ createdAt: -1 }).limit(50);
    const current = [];
    for (const a of attempts) {
      // Re-read under the attempt's lock, so an expiry cannot interleave with an answer
      current.push(await attemptLock(String(a._id), async () => {
        const fresh = (await ExamAttempt.findById(a._id)) ?? a;
        await this.expireIfDue(fresh);
        return fresh;
      }));
    }
    return current.map(a => this.summary(a));
  }

  async get(userId: string, attemptId: string) {
    return attemptLock(attemptId, async () => this.view(await this.owned(userId, attemptId)));
  }

  answer(userId: string, attemptId: string, questionId: string, response: unknown) {
    return attemptLock(attemptId, () => this.answerNow(userId, attemptId, questionId, response));
  }

  private async answerNow(userId: string, attemptId: string, questionId: string, response: unknown) {
    const attempt = await this.owned(userId, attemptId);
    if (attempt.status !== 'active') {
      throw new AppError(attempt.timedOut ? 'Time is up: this attempt has been submitted.' : 'This attempt has been submitted.', 409, attempt.timedOut ? 'TIME_UP' : 'ATTEMPT_COMPLETED');
    }
    const item = attempt.items.find(i => i.questionId === questionId);
    const question = QUESTIONS_BY_ID.get(questionId);
    if (!item || !question) throw new AppError('Question not found in this attempt.', 404, 'QUESTION_NOT_FOUND');
    const problem = responseProblem(question, response);
    if (problem) throw new AppError(`Invalid request: ${problem}`, 400, 'VALIDATION_ERROR');

    if (attempt.mode === 'timed') {
      const exam = examOrThrow(attempt.examId);
      const t = now().getTime();
      if (exam.sectionalTiming) {
        const section = attempt.sections.find(s => s.sectionId === item.sectionId)!;
        if (!section.startedAt) throw new AppError('This section has not started yet.', 409, 'SECTION_NOT_STARTED');
        if (section.closedAt || (section.deadline && section.deadline.getTime() + DEADLINE_GRACE_MS < t)) {
          throw new AppError("This section's time is over; it cannot be changed.", 409, 'SECTION_CLOSED');
        }
      } else if (attempt.deadline && attempt.deadline.getTime() + DEADLINE_GRACE_MS < t) {
        throw new AppError('Time is up.', 409, 'TIME_UP');
      }
    }

    item.response = response as ExamResponse;
    item.answeredAt = response === null ? undefined : now();
    attempt.markModified('items');
    await attempt.save();
    return this.view(attempt);
  }

  /** Sectional timing: start the next section, which closes the current one for good. */
  startSection(userId: string, attemptId: string, sectionId: string) {
    return attemptLock(attemptId, () => this.startSectionNow(userId, attemptId, sectionId));
  }

  private async startSectionNow(userId: string, attemptId: string, sectionId: string) {
    const attempt = await this.owned(userId, attemptId);
    const exam = examOrThrow(attempt.examId);
    if (attempt.status !== 'active') throw new AppError('This attempt has been submitted.', 409, 'ATTEMPT_COMPLETED');
    if (attempt.mode !== 'timed' || !exam.sectionalTiming) throw new AppError('This attempt has no sectional timer.', 400, 'NOT_SECTIONAL');
    const index = attempt.sections.findIndex(s => s.sectionId === sectionId);
    if (index === -1) throw new AppError('Section not found in this attempt.', 404, 'SECTION_NOT_FOUND');
    const section = attempt.sections[index];
    if (section.startedAt) throw new AppError('This section has already started.', 409, 'SECTION_ALREADY_STARTED');
    const previous = attempt.sections[index - 1];
    if (index > 0 && !previous.startedAt) throw new AppError('Sections are taken in order.', 409, 'SECTION_OUT_OF_ORDER');
    const t = now();
    attempt.sections.forEach((s, i) => {
      if (i < index && !s.closedAt) s.closedAt = t;
    });
    section.startedAt = t;
    section.deadline = new Date(t.getTime() + (section.timeLimitSec ?? 0) * 1000);
    attempt.markModified('sections');
    await attempt.save();
    return this.view(attempt);
  }

  submit(userId: string, attemptId: string) {
    return attemptLock(attemptId, () => this.submitNow(userId, attemptId));
  }

  private async submitNow(userId: string, attemptId: string) {
    const attempt = await this.owned(userId, attemptId);
    if (attempt.status === 'active') {
      this.finish(attempt);
      await attempt.save();
    }
    return this.view(attempt);
  }

  private finish(attempt: IExamAttempt) {
    const exam = examOrThrow(attempt.examId);
    let marks = 0;
    let maxMarks = 0;
    for (const item of attempt.items) {
      const question = QUESTIONS_BY_ID.get(item.questionId);
      if (!question) continue;
      const result = markQuestion(exam, question, item.response);
      item.outcome = result.outcome;
      item.marksAwarded = round2(result.marks);
      marks += result.marks;
      maxMarks += question.marks;
    }
    const correct = attempt.items.filter(i => i.outcome === 'correct').length;
    const wrong = attempt.items.filter(i => i.outcome === 'wrong').length;
    attempt.score = {
      attempted: correct + wrong,
      correct,
      wrong,
      unanswered: attempt.items.length - correct - wrong,
      marks: round2(marks),
      maxMarks,
      accuracy: correct + wrong > 0 ? round2(correct / (correct + wrong)) : null,
    };
    attempt.status = 'completed';
    attempt.completedAt = now();
    attempt.sections.forEach(s => {
      if (s.startedAt && !s.closedAt) s.closedAt = attempt.completedAt;
    });
    attempt.markModified('items');
    attempt.markModified('sections');
  }

  summary(a: IExamAttempt) {
    return {
      id: String(a._id),
      examId: a.examId,
      mode: a.mode,
      status: a.status,
      questionCount: a.items.length,
      answered: a.items.filter(i => i.response !== null && i.response !== undefined).length,
      score: a.score ?? null,
      timedOut: a.timedOut,
      startedAt: a.startedAt.toISOString(),
      completedAt: a.completedAt ? a.completedAt.toISOString() : null,
    };
  }

  view(a: IExamAttempt) {
    const exam = examOrThrow(a.examId);
    const done = a.status === 'completed';
    const topicName = new Map(topicsOf(exam).map(t => [t.id, t.name]));
    return {
      ...this.summary(a),
      syllabusVersion: a.syllabusVersion,
      timeLimitSec: a.timeLimitSec,
      deadline: a.deadline ? a.deadline.toISOString() : null,
      serverTime: now().toISOString(),
      sections: a.sections.map(s => ({
        sectionId: s.sectionId,
        name: exam.sections.find(x => x.id === s.sectionId)?.name ?? s.sectionId,
        timeLimitSec: s.timeLimitSec ?? null,
        startedAt: s.startedAt ? s.startedAt.toISOString() : null,
        deadline: s.deadline ? s.deadline.toISOString() : null,
        closedAt: s.closedAt ? s.closedAt.toISOString() : null,
      })),
      questions: a.items.map(item => {
        const q = QUESTIONS_BY_ID.get(item.questionId)!;
        const base = {
          questionId: q.id,
          sectionId: q.sectionId,
          topicId: q.topicId,
          topicName: topicName.get(q.topicId) ?? q.topicId,
          type: q.type,
          marks: q.marks,
          negativeMarks: round2(penaltyFor(exam, q)),
          difficulty: q.difficulty,
          stem: q.stem,
          code: q.code ?? null,
          options: q.options ?? null,
          response: item.response ?? null,
        };
        if (!done) return base;
        const answer = q.answer;
        return {
          ...base,
          outcome: item.outcome,
          marksAwarded: item.marksAwarded,
          correctAnswer:
            'index' in answer
              ? q.options![answer.index]
              : 'indices' in answer
                ? answer.indices.map(i => q.options![i]).join('; ')
                : answer.tolerance > 0
                  ? `${answer.value} (±${answer.tolerance})`
                  : String(answer.value),
          explanation: q.explanation,
        };
      }),
    };
  }
}

export default new ExamPracticeService();
