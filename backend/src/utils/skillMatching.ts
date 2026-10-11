import { IUserSkill } from '../models/UserSkill.js';
import { ISkill } from '../models/Skill.js';

/** Escapes a string so it can be embedded literally inside a RegExp (e.g. "C++", "Node.js"). */
export const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Returns every lookup key a skill name can be matched under.
 * "Amazon Web Services (AWS)" -> ["amazon web services (aws)", "amazon web services", "aws"]
 * "React.js" -> ["react.js", "react"]
 */
export const skillKeys = (name: string): string[] => {
  const base = (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
  if (!base) return [];

  const keys = new Set<string>([base]);

  const parenthetical = base.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (parenthetical) {
    keys.add(parenthetical[1].trim());
    keys.add(parenthetical[2].trim());
  }

  for (const key of [...keys]) {
    // "react.js" / "reactjs" -> "react"; keeps short names such as "js" or "d3.js" intact
    const withoutJs = key.replace(/\.?js$/, '');
    if (withoutJs.length >= 3 && withoutJs !== key) keys.add(withoutJs);
  }

  keys.delete('');
  return [...keys];
};

/** Indexes a user's populated skills by every key their canonical name and aliases can match. */
export const buildUserSkillIndex = (userSkills: IUserSkill[]): Map<string, IUserSkill> => {
  const index = new Map<string, IUserSkill>();
  for (const userSkill of userSkills) {
    const skill = userSkill.skillId as unknown as ISkill | null;
    if (!skill || !skill.canonicalName) continue;

    for (const name of [skill.canonicalName, ...(skill.aliases || [])]) {
      for (const key of skillKeys(name)) {
        // Keep the strongest evidence when two of the user's skills share a key
        const existing = index.get(key);
        if (!existing || existing.evidenceScore < userSkill.evidenceScore) {
          index.set(key, userSkill);
        }
      }
    }
  }
  return index;
};

/** Finds the user's skill that satisfies a named requirement, if any. */
export const findUserSkill = (
  index: Map<string, IUserSkill>,
  requiredSkillName: string
): IUserSkill | undefined => {
  for (const key of skillKeys(requiredSkillName)) {
    const match = index.get(key);
    if (match) return match;
  }
  return undefined;
};
