import { z } from 'zod';
import { aiHttp } from './aiHttp.js';
import logger from '../config/logger.js';
import { IQuestionEvaluation, IQuestionItem, IEvaluationDimensions } from '../models/InterviewSession.js';
import { extractSkills } from '../utils/skillLexicon.js';
import { escapeRegExp } from '../utils/skillMatching.js';
import { InterviewRubric, RUBRICS } from './interview/InterviewRubrics.js';
import { answerLanguage, EVALUATION_METHODS, LIMITATIONS, limitationsFor, uncertaintyFor } from './interview/evaluationQuality.js';
import { CONTRADICTION_CAP, findContradictions, type Contradiction } from './interview/contradictions.js';

/**
 * Interview answer evaluation.
 *
 * Preferred path: the AI service scores the answer against an explicit rubric and returns
 * structured output, which is validated here before use.
 * Fallback path: a deterministic rule-based rubric, clearly labelled as such. It measures
 * relevance, depth, specificity and structure. It cannot judge technical correctness, so it
 * reports that dimension as unavailable and never awards a top score.
 */

/** How long to wait for the AI rubric before using the rule-based one (override for tests). */
const aiTimeoutMs = (): number => Number(process.env.INTERVIEW_AI_TIMEOUT_MS) || 12000;

/** Highest score the rule-based fallback will give: it cannot confirm the answer is correct. */
export const HEURISTIC_MAX_SCORE = 80;

const AiEvaluationSchema = z.object({
  relevance: z.number().int().min(0).max(5),
  completeness: z.number().int().min(0).max(5),
  specificity: z.number().int().min(0).max(5),
  structure: z.number().int().min(0).max(5),
  technical_accuracy: z.number().int().min(0).max(5).nullable().optional(),
  is_relevant: z.boolean().default(true),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  missing_concepts: z.array(z.string()).default([]),
  feedback: z.string().default('')
});

const STOPWORDS = new Set(
  ('about above after again against also among because been before being below between both could ' +
    'describe does doing down during each explain from further have having here into itself just more ' +
    'most once only other over same should some such than that their them then there these they this ' +
    'those through under until very walk were what when where which while with would your yours how why ' +
    'tell give using used based approach one recent previous work').split(' ')
);

const wordsOf = (text: string): string[] => text.toLowerCase().match(/[a-z][a-z0-9+#.'-]*/g) || [];

const containsTerm = (text: string, term: string): boolean =>
  new RegExp(`(?<![a-z0-9])${escapeRegExp(term.toLowerCase())}`, 'i').test(text);

const STAR_MARKERS = {
  situation: /\b(when|while|during|at my|in my (?:previous|last|current)|we were|there was|the situation|faced|context)\b/i,
  task: /\b(my task|task was|responsible for|i was asked|needed to|had to|my goal|the goal|objective|my role)\b/i,
  action:
    /\bI\s+(?:\w+\s+){0,2}(built|implemented|designed|led|wrote|created|refactored|analy[sz]ed|proposed|decided|introduced|migrated|debugged|profiled|organi[sz]ed|coordinated|added|replaced|set up|investigated|rewrote|automated|tested)\b/i,
  result: /\b(as a result|result(?:ed|ing)?|outcome|which (?:reduced|increased|improved|cut|saved)|reduced|increased|improved|saved|achieved|led to|dropped|grew|went from)\b/i
};

const REASONING_MARKERS =
  /\b(because|so that|therefore|trade-?offs?|alternatively|however|instead|compared (?:to|with)|whereas|complexity|first|then|finally|for example|for instance|depends on|in case|otherwise)\b/gi;

// A number tied to a unit or a change, not just any digit
const METRIC =
  /\b\d+(?:\.\d+)?\s?(?:%|percent|ms|s|sec|seconds|minutes|hours|days|weeks|x|k|m|gb|mb|rps|qps|users|requests|customers|tickets|bugs|releases)(?![a-z0-9])|\bfrom\s+\d[\d.,]*\s*\w*\s+to\s+\d/gi;

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
const pct = (n: number): number => Math.round(clamp01(n) * 100);

const rubricStamp = (rubric: InterviewRubric) => ({ rubricId: rubric.id, rubricVersion: rubric.version });

const emptyEvaluation = (rubric: InterviewRubric = RUBRICS.general): IQuestionEvaluation => ({
  score: 0,
  starFormatted: false,
  strengths: [],
  improvements: ['Give an answer: even a short structured response can be scored and improved.'],
  missingConcepts: [],
  feedback: 'No answer was given, so nothing could be evaluated.',
  source: 'heuristic',
  dimensions: { relevance: 0, completeness: 0, specificity: 0, structure: 0, technicalAccuracy: null },
  ...rubricStamp(rubric),
  method: EVALUATION_METHODS.empty,
  uncertainty: { level: 'low', reasons: ['No answer was given; there was nothing to judge.'] },
  limitations: [LIMITATIONS.notHiringPrediction],
  evaluatedAt: new Date()
});

/**
 * X9: an answer the rubric cannot score fairly (not in English). It is kept, explained and left out
 * of the overall score, instead of being marked down as off-topic.
 */
const notScoredEvaluation = (reason: string, rubric: InterviewRubric = RUBRICS.general): IQuestionEvaluation => ({
  score: 0,
  starFormatted: false,
  strengths: [],
  improvements: [],
  missingConcepts: [],
  feedback: `Not scored: ${reason} Practice scoring works in English only; this answer is saved but not counted in your overall score.`,
  source: 'heuristic',
  // No dimensions: nothing was measured
  ...rubricStamp(rubric),
  method: EVALUATION_METHODS.language,
  notScored: true,
  notScoredReason: reason,
  uncertainty: { level: 'high', reasons: [reason] },
  limitations: [LIMITATIONS.englishOnly, LIMITATIONS.notHiringPrediction],
  evaluatedAt: new Date()
});

/**
 * Deterministic rule-based rubric (0-100). Weights come from the role rubric (D5); the general
 * rubric, used when none is given, has the weights below:
 *   relevance 35%  - topical overlap with the question and its expected concepts (full at 3 hits)
 *   completeness 25% - enough substance to judge (full marks from about 120 words)
 *   specificity 20% - concrete technologies and meaningful metrics, not generalities
 *   structure 20%  - STAR parts for behavioural questions; explicit reasoning for technical ones
 * Caps: under 15 words -> at most 25; under 40 words -> at most 50; off-topic -> at most 15;
 * never above HEURISTIC_MAX_SCORE.
 */
export function evaluateHeuristically(answer: string, question: IQuestionItem, rubric: InterviewRubric = RUBRICS.general): IQuestionEvaluation {
  // Whitespace is normalised so multi-word markers ("so that", "as a result") match however the answer is spaced
  const text = (answer || '').replace(/\s+/g, ' ').trim();
  const words = wordsOf(text);
  // Language first: the word counter only sees Latin words, so a Hindi answer would look empty
  const languageCheck = text ? answerLanguage(text) : { english: true };
  if (!languageCheck.english) return notScoredEvaluation(languageCheck.reason!, rubric);
  if (words.length < 3) return emptyEvaluation(rubric);

  // --- Relevance ---
  const expected = question.expectedConcepts || [];
  const questionTerms = [...new Set(wordsOf(question.question).filter(w => w.length >= 5 && !STOPWORDS.has(w)))];
  const matchedQuestionTerms = questionTerms.filter(term => containsTerm(text, term.slice(0, Math.max(5, term.length - 2))));
  const coveredConcepts = expected.filter(concept =>
    wordsOf(concept)
      .filter(w => w.length >= 4 && !STOPWORDS.has(w))
      .some(w => containsTerm(text, w.slice(0, Math.max(4, w.length - 2))))
  );
  const missingConcepts = expected.filter(c => !coveredConcepts.includes(c));
  // Topical overlap, saturating at three distinct hits (question terms or expected concepts).
  // This is a coarse lexical signal: it reliably spots off-topic answers, not subtle ones.
  const relevance = clamp01((matchedQuestionTerms.length + coveredConcepts.length) / 3);

  // --- Completeness ---
  const completeness = clamp01(words.length / 120);

  // --- Specificity ---
  const technologyNames = extractSkills(text);
  const metricMatches = text.match(METRIC) || [];
  const technologies = technologyNames.length;
  const metrics = metricMatches.length;
  const specificity = clamp01((Math.min(technologies, 3) + Math.min(metrics, 2) * 1.5) / 5);

  // --- Structure ---
  const isBehavioural = ['behavioral', 'behavioural', 'resume', 'career'].includes(question.category);
  const starParts = Object.entries(STAR_MARKERS).filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
  const reasoningCount = new Set((text.match(REASONING_MARKERS) || []).map(m => m.toLowerCase())).size;
  const structure = isBehavioural ? starParts.length / 4 : clamp01(reasoningCount / 4);
  const starFormatted = isBehavioural && starParts.length === 4;

  const w = rubric.heuristic;
  let score = Math.round((relevance * w.relevance + completeness * w.completeness + specificity * w.specificity + structure * w.structure) * 100);

  const caps: string[] = [];
  if (words.length < 15) {
    score = Math.min(score, 25);
    caps.push('the answer is only a sentence long');
  } else if (words.length < 40) {
    score = Math.min(score, 50);
    caps.push('the answer is brief');
  }
  if (relevance < 0.15) {
    score = Math.min(score, 15);
    caps.push('it does not address the question');
  }
  const contradictions = findContradictions(text);
  if (contradictions.length) {
    score = Math.min(score, CONTRADICTION_CAP);
    caps.push('it contradicts itself');
  }
  score = Math.min(score, HEURISTIC_MAX_SCORE);

  const strengths: string[] = [];
  const improvements: string[] = contradictionAdvice(contradictions);

  if (relevance >= 0.6) strengths.push('Addresses the question directly.');
  else if (relevance < 0.3) improvements.push('Answer the question that was asked: refer to its specific subject.');
  if (coveredConcepts.length > 0) strengths.push(`Covers: ${coveredConcepts.join(', ')}.`);

  if (completeness >= 0.8) strengths.push('Enough depth to judge the answer properly.');
  else improvements.push(`Develop the answer further (${words.length} words; aim for a few full sentences per point).`);

  if (metrics > 0) strengths.push('Backs claims with measured results.');
  else improvements.push('Add a concrete, measured result where you have one (for example a time, size or percentage change).');
  if (technologies === 0) improvements.push('Name the specific tools or technologies you used.');

  if (isBehavioural) {
    const missingParts = ['situation', 'task', 'action', 'result'].filter(p => !starParts.includes(p));
    if (missingParts.length === 0) strengths.push('Follows a clear Situation-Task-Action-Result structure.');
    else improvements.push(`Complete the STAR structure: add the ${missingParts.join(', ')}.`);
  } else if (reasoningCount >= 2) {
    strengths.push('Explains the reasoning, not just the conclusion.');
  } else {
    improvements.push('Explain your reasoning: why this approach, and what the trade-offs are.');
  }

  const feedback =
    `Scored ${score}/100 by the built-in rule-based scoring (${rubric.label.toLowerCase()} weights) because AI evaluation was unavailable. ` +
    (caps.length ? `The score is limited because ${caps.join(' and ')}. ` : '') +
    'This rubric checks relevance, depth, specificity and structure; it cannot verify technical correctness.';

  return {
    score,
    starFormatted,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    missingConcepts,
    feedback,
    source: 'heuristic',
    dimensions: {
      relevance: pct(relevance),
      completeness: pct(completeness),
      specificity: pct(specificity),
      structure: pct(structure),
      technicalAccuracy: null
    },
    ...rubricStamp(rubric),
    method: EVALUATION_METHODS.heuristic,
    // X9: what each dimension was measured from, so the score can be checked
    factors: {
      relevance: { questionTermsMatched: matchedQuestionTerms, conceptsCovered: coveredConcepts, conceptsMissing: missingConcepts, saturatesAt: 3 },
      completeness: { words: words.length, fullCreditAt: 120 },
      specificity: { technologies: technologyNames.slice(0, 10), metrics: metricMatches.slice(0, 5).map(m => m.trim()) },
      structure: isBehavioural ? { kind: 'STAR', partsFound: starParts } : { kind: 'reasoning', reasoningMarkers: reasoningCount, fullCreditAt: 4 },
      weights: rubric.heuristic,
      contradictions,
      capsApplied: caps,
    },
    uncertainty: uncertaintyFor('heuristic', words.length, caps),
    limitations: limitationsFor('heuristic'),
    evaluatedAt: new Date()
  };
}

/** X9: the first contradiction found, quoted, so the user can see exactly what was counted against the answer. */
const contradictionAdvice = (found: Contradiction[]): string[] =>
  found.length ? [`Resolve the contradiction: "${found[0].first}" conflicts with "${found[0].second}". State one position and the reason for it.`] : [];

/** Converts a validated AI rubric result into the stored evaluation. */
export function evaluationFromRubric(
  rubric: z.infer<typeof AiEvaluationSchema>,
  answer: string,
  roleRubric: InterviewRubric = RUBRICS.general
): IQuestionEvaluation {
  const hasAccuracy = typeof rubric.technical_accuracy === 'number';
  // Weights come from the role rubric; the general one is relevance 25, completeness 20,
  // specificity 20, structure 15, technical accuracy 20. When accuracy cannot be judged its
  // weight is shared proportionally among the others.
  const weights = roleRubric.ai;
  const base =
    (rubric.relevance / 5) * weights.relevance +
    (rubric.completeness / 5) * weights.completeness +
    (rubric.specificity / 5) * weights.specificity +
    (rubric.structure / 5) * weights.structure;
  let score = hasAccuracy
    ? Math.round(base + ((rubric.technical_accuracy as number) / 5) * weights.technicalAccuracy)
    : Math.round((base / (100 - weights.technicalAccuracy)) * 100);

  // Guard rails applied regardless of what the model returned
  const wordCount = wordsOf(answer).length;
  const caps: string[] = [];
  if (!rubric.is_relevant || rubric.relevance <= 1) {
    score = Math.min(score, 20);
    caps.push('it does not address the question');
  }
  const contradictions = findContradictions(answer);
  if (contradictions.length) {
    score = Math.min(score, CONTRADICTION_CAP);
    caps.push('it contradicts itself');
  }
  if (wordCount < 15) {
    score = Math.min(score, 30);
    caps.push('the answer is only a sentence long');
  } else if (wordCount < 40) {
    score = Math.min(score, 60);
    caps.push('the answer is brief');
  }

  return {
    score,
    starFormatted: rubric.structure >= 4,
    strengths: rubric.strengths.slice(0, 3),
    improvements: [...contradictionAdvice(contradictions), ...rubric.improvements].slice(0, 3),
    missingConcepts: rubric.missing_concepts.slice(0, 6),
    feedback: rubric.feedback,
    source: 'ai',
    dimensions: {
      relevance: rubric.relevance * 20,
      completeness: rubric.completeness * 20,
      specificity: rubric.specificity * 20,
      structure: rubric.structure * 20,
      technicalAccuracy: hasAccuracy ? (rubric.technical_accuracy as number) * 20 : null
    },
    ...rubricStamp(roleRubric),
    method: EVALUATION_METHODS.ai,
    factors: {
      rubricScoresOutOf5: { relevance: rubric.relevance, completeness: rubric.completeness, specificity: rubric.specificity, structure: rubric.structure, technicalAccuracy: rubric.technical_accuracy ?? null },
      weights: roleRubric.ai,
      words: wordCount,
      contradictions,
      capsApplied: caps,
    },
    uncertainty: uncertaintyFor('ai', wordCount, caps),
    limitations: limitationsFor('ai'),
    evaluatedAt: new Date()
  };
}

/**
 * Evaluates one answer. Tries the AI rubric first; on timeout, provider failure or output that
 * fails validation it falls back to the labelled rule-based rubric. It never invents an AI result.
 */
export async function evaluateAnswer(
  answer: string,
  question: IQuestionItem,
  roleTitle: string,
  rubric: InterviewRubric = RUBRICS.general
): Promise<IQuestionEvaluation> {
  // X9: the rubric (and the AI prompt) is English; other languages are not scored rather than marked down
  const languageCheck = (answer || '').trim() ? answerLanguage(answer) : { english: true };
  if (!languageCheck.english) return notScoredEvaluation(languageCheck.reason!, rubric);
  if (wordsOf(answer || '').length < 3) return emptyEvaluation(rubric);

  try {
    const response = await aiHttp.post(
      '/api/v1/interview/evaluate',
      {
        question: question.question,
        answer: answer.slice(0, 8000),
        category: question.category,
        role_title: roleTitle,
        expected_concepts: (question.expectedConcepts || []).slice(0, 12)
      },
      { timeout: aiTimeoutMs() }
    );

    if (response.data?.success) {
      const parsed = AiEvaluationSchema.safeParse(response.data.data);
      if (parsed.success) return evaluationFromRubric(parsed.data, answer, rubric);
      logger.warn('AI interview evaluation returned output that failed validation; using the rule-based rubric.');
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown error';
    logger.info(`AI interview evaluation unavailable (${message}); using the rule-based rubric.`);
  }

  return evaluateHeuristically(answer, question, rubric);
}

export type { IEvaluationDimensions };
