import type { IQuestionEvaluation, IQuestionItem } from '../../models/InterviewSession.js';

/**
 * Answer-adaptive follow-up questions (D3); see docs/INTERVIEWS.md.
 *
 * A follow-up is written from what the evaluated answer lacked, in this order:
 *   1. an expected concept the answer did not cover;
 *   2. too little concrete detail (specificity below 40);
 *   3. a weak structure (below 50): the STAR parts for behavioural questions, reasoning otherwise.
 * It is deterministic and needs no AI. Empty answers get no follow-up (the question itself still
 * needs an answer), nor do follow-ups themselves, and strong answers (score 75 or more with no
 * missing concept) are left alone.
 */

export const MAX_FOLLOW_UPS_PER_SESSION = 3;
export const STRONG_ANSWER_SCORE = 75;

export type FollowUpReason =
  | { type: 'missing_concept'; concept: string }
  | { type: 'low_specificity' }
  | { type: 'weak_structure' };

const BEHAVIOURAL = new Set(['behavioral', 'behavioural', 'resume', 'career']);

/** Why a follow-up is warranted, or null when the answer does not need one. */
export function followUpReason(question: IQuestionItem, evaluation: IQuestionEvaluation): FollowUpReason | null {
  if (question.followUpOf) return null;
  if (!question.candidateResponse?.trim() || evaluation.score === 0) return null;
  const missing = (evaluation.missingConcepts || []).filter(c => c.trim());
  if (missing.length > 0) return { type: 'missing_concept', concept: missing[0] };
  if (evaluation.score >= STRONG_ANSWER_SCORE) return null;
  const d = evaluation.dimensions;
  if (d && d.specificity < 40) return { type: 'low_specificity' };
  if (d && d.structure < 50) return { type: 'weak_structure' };
  return null;
}

/** The follow-up question for a reason, as a question item that can be answered and scored. */
export function buildFollowUp(question: IQuestionItem, reason: FollowUpReason, questionNumber: number): IQuestionItem {
  const behavioural = BEHAVIOURAL.has(question.category);
  let text: string;
  let groundedIn: string;
  let expectedConcepts = question.expectedConcepts || [];

  if (reason.type === 'missing_concept') {
    text = behavioural
      ? `In the situation you described, what part did ${reason.concept.toLowerCase()} play? Be specific about what you did.`
      : `Your answer did not cover ${reason.concept.toLowerCase()}. How does it apply here, and what would you do about it?`;
    groundedIn = `your answer to question ${questionNumber} did not cover "${reason.concept}"`;
    expectedConcepts = [reason.concept];
  } else if (reason.type === 'low_specificity') {
    text = behavioural
      ? 'Can you make that concrete: which tools or methods did you use, and what measurable result did it have?'
      : 'Can you make that concrete: name the specific technologies you would use and the numbers you would watch (for example latency, error rate or cost)?';
    groundedIn = `your answer to question ${questionNumber} had few concrete details`;
  } else {
    text = behavioural
      ? 'Walk me through it in order: what was the situation, what were you responsible for, what did you do, and what was the result?'
      : 'Walk me through your reasoning step by step: why that approach, what alternatives you considered, and the trade-offs.';
    groundedIn = `your answer to question ${questionNumber} needed a clearer structure`;
  }

  return {
    questionId: `${question.questionId}-followup`,
    question: text,
    category: question.category,
    difficulty: question.difficulty,
    expectedConcepts,
    source: 'follow_up',
    groundedIn,
    followUpOf: question.questionId,
    followUpReason: reason,
  };
}

/**
 * Whether the follow-up recovered what the original answer lacked: the concept is now covered,
 * or the weak dimension reached its threshold.
 */
export function recovered(followUp: IQuestionItem): boolean | null {
  const evaluation = followUp.evaluation;
  const reason = followUp.followUpReason;
  if (!evaluation || !reason) return null;
  if (reason.type === 'missing_concept') {
    const concept = (reason.concept ?? '').toLowerCase();
    return !evaluation.missingConcepts.some(c => c.toLowerCase() === concept);
  }
  const d = evaluation.dimensions;
  if (!d) return null;
  return reason.type === 'low_specificity' ? d.specificity >= 40 : d.structure >= 50;
}
