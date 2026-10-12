/** Wording for who wrote interview questions and who scored the answers. */
export const QUESTION_SOURCE_LABEL: Record<string, string> = {
  ai: 'Questions written by AI',
  question_bank: 'Questions from the built-in question bank',
};

export const SCORING_SOURCE_LABEL: Record<string, string> = {
  ai: 'Scored by AI rubric',
  heuristic: 'Scored by rule-based rubric',
  mixed: 'Scored by AI and rule-based rubrics',
};

/** What the rule-based fallback can and cannot tell the candidate. */
export const HEURISTIC_NOTICE =
  'The AI evaluator was unavailable, so these answers were scored by a rule-based rubric. It checks relevance, completeness, specificity and structure from the wording of your answer. It cannot verify that an answer is technically correct, and its scores are capped at 80.';
