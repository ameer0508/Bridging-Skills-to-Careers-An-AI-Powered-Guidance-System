import { SKILL_LEXICON, LexiconSkill } from '../seed/skillLexicon.js';

/**
 * Text matcher over the shared skill lexicon. Mirrors ai/app/resume_intelligence/skill_lexicon.py
 * rule for rule, so a job description and a resume are read the same way:
 *  - URLs and e-mail addresses are ignored
 *  - whole-token matches only ("Java" is not found inside "JavaScript")
 *  - longer terms win ("React Native" is not also "React")
 *  - each skill is reported once, however often it is mentioned
 *  - ordinary-word names (Go, Swift...) need exact casing; single letters must be list items
 */

/** Escapes a string so it can be embedded literally inside a RegExp (e.g. "C++", "Node.js"). */
export const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const URL_OR_EMAIL =
  /(?:https?:\/\/|www\.)\S+|\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b|\b(?:[a-z0-9-]+\.)+(?:com|org|net|io|dev|in|co|edu|app|me)(?:\/\S*)?/gi;

const TOKEN_CHARS = 'A-Za-z0-9+#';

interface Term {
  text: string;
  pattern: RegExp;
  skill: LexiconSkill;
}

const termPattern = (term: string, caseSensitive: boolean): RegExp => {
  const escaped = escapeRegExp(term);
  if (term.length === 1) {
    return new RegExp(`(?:(?<=^)|(?<=[,:/(|;])|(?<=[,:/(|;]\\s))${escaped}(?=\\s*(?:[,/)|;]|$))`, 'gm');
  }
  return new RegExp(
    `(?<![${TOKEN_CHARS}])${escaped}(?![${TOKEN_CHARS}])`,
    caseSensitive ? 'g' : 'gi'
  );
};

const byKey = new Map<string, LexiconSkill>();
const terms: Term[] = [];

for (const skill of SKILL_LEXICON) {
  byKey.set(skill.name.toLowerCase(), skill);
  terms.push({ text: skill.name, pattern: termPattern(skill.name, skill.caseSensitive), skill });
  for (const alias of skill.aliases) {
    if (!byKey.has(alias.toLowerCase())) byKey.set(alias.toLowerCase(), skill);
    terms.push({ text: alias, pattern: termPattern(alias, false), skill });
  }
  for (const alias of skill.exactAliases) {
    if (!byKey.has(alias.toLowerCase())) byKey.set(alias.toLowerCase(), skill);
    terms.push({ text: alias, pattern: termPattern(alias, true), skill });
  }
}
// Longest terms first so specific names claim their text before general ones
terms.sort((a, b) => b.text.length - a.text.length);

/** Looks up a canonical name or alias, e.g. "postgres" or "Amazon Web Services (AWS)". */
export const lookupSkill = (name: string): LexiconSkill | undefined => {
  const key = (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
  const direct = byKey.get(key);
  if (direct) return direct;

  const parenthetical = key.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (parenthetical) {
    return byKey.get(parenthetical[1].trim()) || byKey.get(parenthetical[2].trim());
  }
  return undefined;
};

/** Canonical lexicon name for a skill, or the trimmed input when the skill is not in the lexicon. */
export const canonicalSkillName = (name: string): string => lookupSkill(name)?.name || name.trim();

/** Skills that having `name` necessarily demonstrates (e.g. PostgreSQL -> SQL). */
export const impliedSkills = (name: string): string[] => lookupSkill(name)?.implies || [];

export const stripLinks = (text: string): string => (text || '').replace(URL_OR_EMAIL, ' ');

/** Distinct lexicon skills mentioned in the text, in order of first appearance. */
export const extractSkills = (text: string): string[] => {
  const cleaned = stripLinks(text);
  const consumed: Array<[number, number]> = [];
  const firstIndex = new Map<string, number>();

  for (const term of terms) {
    term.pattern.lastIndex = 0;
    for (const match of cleaned.matchAll(term.pattern)) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      if (consumed.some(([cStart, cEnd]) => start < cEnd && end > cStart)) continue;
      consumed.push([start, end]);
      const existing = firstIndex.get(term.skill.name);
      if (existing === undefined || start < existing) firstIndex.set(term.skill.name, start);
    }
  }

  return [...firstIndex.entries()].sort((a, b) => a[1] - b[1]).map(([name]) => name);
};
