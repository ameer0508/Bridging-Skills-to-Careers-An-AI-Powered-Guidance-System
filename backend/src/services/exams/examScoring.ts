import type { ExamDefinition } from '../../seed/exams/examDefinitions.js';
import type { PracticeQuestion } from '../../seed/exams/questionTypes.js';
import type { ExamResponse } from '../../models/ExamAttempt.js';

/**
 * Server-side marking for exam practice, following each exam's official marking scheme:
 *  - GATE: a correct answer earns the question's marks; a wrong 1-mark MCQ loses 1/3 and a wrong
 *    2-mark MCQ loses 2/3; MSQ and NAT have no negative marking and MSQ has no partial marks.
 *  - SSC CGL Tier-I: +2 for a correct answer, −0.50 for a wrong one.
 * Unanswered questions score 0. Marks are rounded to two decimals only when totalled.
 */

export function isCorrect(question: PracticeQuestion, response: ExamResponse | undefined): boolean | null {
  if (response === null || response === undefined) return null;
  const answer = question.answer;
  if ('index' in answer) return response === answer.index;
  if ('indices' in answer) {
    if (!Array.isArray(response)) return false;
    const given = [...new Set(response)].sort((a, b) => a - b);
    const expected = [...answer.indices].sort((a, b) => a - b);
    return given.length === expected.length && given.every((v, i) => v === expected[i]);
  }
  return typeof response === 'number' && Math.abs(response - answer.value) <= answer.tolerance + 1e-9;
}

export function penaltyFor(exam: ExamDefinition, question: PracticeQuestion): number {
  if (exam.id === 'ssc-cgl-2026-tier1') return 0.5;
  // GATE: only MCQs carry negative marks
  return question.type === 'mcq' ? question.marks / 3 : 0;
}

export function markQuestion(exam: ExamDefinition, question: PracticeQuestion, response: ExamResponse | undefined) {
  const correct = isCorrect(question, response);
  if (correct === null) return { outcome: 'unanswered' as const, marks: 0 };
  return correct ? { outcome: 'correct' as const, marks: question.marks } : { outcome: 'wrong' as const, marks: -penaltyFor(exam, question) };
}

/** Checks a response's shape against the question type; returns an error message or null. */
export function responseProblem(question: PracticeQuestion, response: unknown): string | null {
  if (response === null) return null;
  const options = question.options?.length ?? 0;
  const validIndex = (v: unknown) => Number.isInteger(v) && (v as number) >= 0 && (v as number) < options;
  if (question.type === 'mcq') return validIndex(response) ? null : `response must be an option index from 0 to ${options - 1}`;
  if (question.type === 'msq') {
    if (!Array.isArray(response) || response.length === 0 || response.length > options || !response.every(validIndex)) {
      return `response must be a list of 1 to ${options} option indices`;
    }
    return new Set(response).size === response.length ? null : 'response must not repeat an option';
  }
  return typeof response === 'number' && Number.isFinite(response) && Math.abs(response) <= 1e9 ? null : 'response must be a number';
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
