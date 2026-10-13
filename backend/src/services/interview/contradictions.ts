/**
 * X9: explicit self-contradictions in an interview answer.
 *
 * Deliberately narrow and deterministic. It reports only:
 *   1. a claim and its direct negation: a negative clause whose content words are all asserted by a
 *      positive clause ("I would use a token bucket" ... "I would never use a token bucket");
 *   2. a small, fixed list of opposite design terms asserted for the same thing
 *      ("must fail open" ... "must fail closed").
 * Clauses that are conditional ("if", "when", "unless") or that report someone else's view
 * ("some people", "a common mistake") are never compared, because "use X when A; do not use X
 * when B" and "people often do X; I would not" are not contradictions. Anything subtler is not
 * detected; the limitation says so.
 */

export interface Contradiction {
  kind: 'negation' | 'opposite_terms';
  first: string;
  second: string;
}

const NEGATIONS = new Set(['not', 'no', 'never', 'cannot', 'without', 'none', 'neither', 'nor']);
const NEGATED_CONTRACTION = /n't$/;

// Words that carry no claim of their own; dropping them lets "would always use" match "would never use"
const FILLER = new Set(
  ('a an the i we you it its it\'s they them this that these those my our your their to of in on at by for from ' +
    'with as is are was were be been being am do does did would will shall should must can could may might ' +
    'also always every each all any some both just only really very too so then there here at well own ' +
    'which who whom whose what how why use using used way one thing things ' +
    // discourse markers: they connect claims but assert nothing
    'however therefore thus hence actually honestly basically now first second then finally overall still yes ok okay').split(' ')
);

const CONDITIONAL = /\b(if|when|whenever|unless|until|otherwise|depending|depends|except|in case|only for|for (?:small|large|smaller|larger))\b/i;
const ATTRIBUTED = /\b(people|others|some teams|many teams|commonly|common mistake|mistake|naive(?:ly)?|myth|tempting|might think|you might|is often|are often|instead of|rather than|compared (?:to|with)|whereas|unlike)\b/i;

const OPPOSITES: Array<{ frame: RegExp; label: string }> = [
  { frame: /\b(?:must|should|will|would|always|to)\s+(?:also\s+)?fail(?:s)?\s+(open|closed)\b/i, label: 'fail open / fail closed' },
  { frame: /\b(?:is|be|are|stay|stays|remain|remains)\s+(?:also\s+)?(?:fully\s+)?(stateless|stateful)\b/i, label: 'stateless / stateful' },
];

const stem = (w: string): string => {
  if (w.length <= 4) return w;
  return w.replace(/(ing|ed|es|s)$/, '').replace(/e$/, '');
};

const clausesOf = (text: string): string[] =>
  text
    .split(/[.;:!?]+/)
    .flatMap(sentence => sentence.split(/,?\s+(?:but|and|because|while|although|though|yet|so that|which|with)\s+|,\s+(?:but|yet)\s+/i))
    .map(c => c.trim())
    .filter(c => c.length > 0);

const tokens = (clause: string): string[] => clause.toLowerCase().match(/[a-z][a-z0-9'-]*/g) || [];

function polarityAndContent(clause: string): { negative: boolean; content: Set<string> } {
  let negations = 0;
  const content = new Set<string>();
  for (const t of tokens(clause)) {
    if (NEGATIONS.has(t) || NEGATED_CONTRACTION.test(t)) {
      negations++;
      continue;
    }
    if (FILLER.has(t)) continue;
    content.add(stem(t));
  }
  return { negative: negations % 2 === 1, content };
}

const comparable = (clause: string): boolean => !CONDITIONAL.test(clause) && !ATTRIBUTED.test(clause);

/** Explicit contradictions in an answer, at most a few, in the order they occur. */
export function findContradictions(answer: string, limit = 3): Contradiction[] {
  const clauses = clausesOf((answer || '').replace(/\s+/g, ' ')).filter(comparable);
  const found: Contradiction[] = [];
  const analysed = clauses.map(c => ({ text: c, ...polarityAndContent(c) }));

  for (let i = 0; i < analysed.length && found.length < limit; i++) {
    for (let j = i + 1; j < analysed.length && found.length < limit; j++) {
      const a = analysed[i];
      const b = analysed[j];
      if (a.negative === b.negative) continue;
      const [positive, negative] = a.negative ? [b, a] : [a, b];
      // Everything the negative clause denies must be asserted by the positive one, and it must say
      // something (two content words). A negative clause with words of its own is a scoped exception
      // ("not for internal traffic"), not a contradiction.
      if (negative.content.size < 2) continue;
      if ([...negative.content].every(w => positive.content.has(w))) found.push({ kind: 'negation', first: a.text, second: b.text });
    }
  }

  for (const { frame, label } of OPPOSITES) {
    if (found.length >= limit) break;
    const hits = clauses.map(c => ({ c, m: c.match(frame) })).filter(h => h.m);
    const firstOf = (term: string) => hits.find(h => h.m![1].toLowerCase() === term);
    const [x, y] = label.split(' / ').map(s => s.split(' ').pop()!);
    const hx = firstOf(x);
    const hy = firstOf(y);
    if (hx && hy && hx.c !== hy.c) found.push({ kind: 'opposite_terms', first: hx.c, second: hy.c });
  }
  return found;
}

/** Highest score an answer with an explicit contradiction can receive, from either scoring path. */
export const CONTRADICTION_CAP = 40;
