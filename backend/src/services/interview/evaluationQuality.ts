/**
 * Interview scoring quality (X9): method versions, the answer-language check, uncertainty labels
 * and the standing limitations of automated answer scoring; see docs/INTERVIEWS.md §X9.
 */

export const EVALUATION_METHODS = {
  heuristic: 'rule-based-v3',
  ai: 'ai-rubric-v2',
  empty: 'no-answer-v1',
  language: 'language-check-v1',
} as const;

/** Stated with every evaluation; none of them is hidden behind a score. */
export const LIMITATIONS = {
  notHiringPrediction: 'This score describes one practice answer. It does not predict how an employer would assess you or whether you would be hired.',
  englishOnly: 'Answers are scored in English only. The rubric looks for English words and structure, so answers in other languages cannot be scored fairly.',
  noFactCheck: 'The built-in rubric cannot check whether technical claims are correct.',
  noContradictions: 'Only explicit self-contradictions are detected (a claim and its direct negation, or fail open and fail closed); subtler inconsistencies are not.',
  lexical: 'Relevance is judged from words shared with the question and its expected concepts, so an accurate answer in unusual wording can score lower.',
  aiSingleJudge: 'An AI score is a single automated judgement; it has not been calibrated against human interviewers.',
} as const;

const ENGLISH = new Set('the and of to in for with on at by from as is was are an a my i this that have has we it be or not but which when'.split(' '));
const OTHER_LATIN = new Set(
  ('de la que el en y los del las por con para una como su al es lo se sus más ' + // Spanish
    'le les des et du une pour avec dans sur est au aux par qui ' + // French
    'der die das und mit für von zu im ist ein eine den dem bei auf ' + // German
    'da do em com um os dos das no na não').split(' ') // Portuguese
);

/**
 * Whether an answer is in English as far as the rubric needs: answers mostly in a non-Latin script
 * (e.g. Devanagari) or whose function words are clearly another language are not.
 */
export function answerLanguage(answer: string): { english: boolean; reason?: string } {
  const letters = (answer.match(/\p{L}/gu) || []).length;
  const latin = (answer.match(/[A-Za-zÀ-ɏ]/g) || []).length;
  if (letters > 0 && latin / letters < 0.7) {
    return { english: false, reason: 'The answer is mostly in a script other than Latin (for example Devanagari).' };
  }
  const words = answer.toLowerCase().match(/[a-zÀ-ɏ']+/g) || [];
  const english = words.filter(w => ENGLISH.has(w)).length;
  const other = words.filter(w => OTHER_LATIN.has(w) && !ENGLISH.has(w)).length;
  if (other >= 4 && other > english * 1.5) {
    return { english: false, reason: 'The answer appears to be in a language other than English.' };
  }
  return { english: true };
}

export function uncertaintyFor(source: 'ai' | 'heuristic', wordCount: number, capsApplied: string[]): { level: 'low' | 'medium' | 'high'; reasons: string[] } {
  const reasons: string[] = [];
  let level: 'low' | 'medium' | 'high' = 'low';
  const raise = (to: 'medium' | 'high', why: string) => {
    reasons.push(why);
    if (to === 'high' || level === 'low') level = to;
  };
  if (source === 'heuristic') raise('medium', 'Scored by word and structure rules, which cannot confirm the answer is correct.');
  else raise('medium', 'Scored by a single AI judgement that has not been calibrated against human interviewers.');
  if (wordCount < 40) raise('high', `The answer is short (${wordCount} words), so small wording changes move the score a lot.`);
  if (capsApplied.length) raise('high', `A limit was applied: ${capsApplied.join(' and ')}.`);
  return { level, reasons };
}

export function limitationsFor(source: 'ai' | 'heuristic'): string[] {
  const common = [LIMITATIONS.notHiringPrediction, LIMITATIONS.englishOnly, LIMITATIONS.noContradictions];
  return source === 'heuristic' ? [...common, LIMITATIONS.noFactCheck, LIMITATIONS.lexical] : [...common, LIMITATIONS.aiSingleJudge];
}
