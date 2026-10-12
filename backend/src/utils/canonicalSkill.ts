import { Skill, type ISkill } from '../models/Skill.js';
import { CareerRequirement } from '../models/CareerRequirement.js';
import { escapeRegExp, lookupSkill } from './skillLexicon.js';
import { skillKeys } from './skillMatching.js';

/**
 * The name SkillBridge uses for a skill, or null when it does not recognise it. A skill is
 * recognised when it is in the lexicon or is a requirement of some career.
 */
export async function recogniseSkill(name: string): Promise<string | null> {
  const trimmed = (name || '').trim();
  if (!trimmed) return null;
  const known = lookupSkill(trimmed);
  if (known) return known.name;
  const keys = new Set(skillKeys(trimmed));
  const requirements: string[] = await CareerRequirement.distinct('skillName');
  return requirements.find(requirement => skillKeys(requirement).some(k => keys.has(k))) ?? null;
}

/** The canonical skill record, created locally when no resume has named the skill yet. */
export async function findOrCreateCanonicalSkill(skillName: string): Promise<ISkill> {
  const exact = new RegExp(`^${escapeRegExp(skillName)}$`, 'i');
  const existing = await Skill.findOne({ $or: [{ canonicalName: exact }, { aliases: exact }] });
  if (existing) return existing;
  const known = lookupSkill(skillName);
  return Skill.create({ canonicalName: known?.name || skillName, category: known?.category || 'General', aliases: known?.aliases || [], isActive: true });
}
