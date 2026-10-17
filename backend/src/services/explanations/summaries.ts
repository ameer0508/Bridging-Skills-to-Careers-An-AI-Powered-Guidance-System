/**
 * Verified summaries: plain-language text written by fixed templates from a fact sheet, with no
 * model involved (docs/AI_EXPLANATIONS.md). Every number and status comes straight from the facts,
 * which come from the deterministic engines; nothing is inferred, compared or predicted beyond what
 * those engines compute. These are the authoritative wording; local-AI wording is optional.
 */

type Rec = Record<string, unknown>;
export interface SummaryText { sentences: string[]; items: string[] }

const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;

/** "A", "A and B", "A, B and C" */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

interface Dimension { name: string; score: number; weight_percent: number }
interface Shares { assessed: number | null; self_reported: number | null; stated: number | null; inferred: number | null }

export function summarizeReadiness(facts: Rec): SummaryText {
  const f = facts as unknown as {
    career_title: string; readiness_score: number; tier: string; dimensions: Dimension[];
    required_total: number; required_missing_skills: string[];
    requirements_total: number; requirements_covered: number; requirements_assessed: number; evidence_shares: Shares;
  };
  const dims = f.dimensions;
  const top = Math.max(...dims.map(d => d.score));
  const bottom = Math.min(...dims.map(d => d.score));
  const strongest = dims.filter(d => d.score === top).map(d => d.name);
  const weakest = dims.filter(d => d.score === bottom).map(d => d.name);
  const met = f.required_total - f.required_missing_skills.length;
  const sentences = [
    `Your readiness for ${f.career_title} is ${f.readiness_score}/100, in the “${f.tier}” tier.`,
    `It combines four dimensions by weight: ${dims.map(d => `${d.name} ${d.score}/100 (weight ${d.weight_percent}%)`).join(', ')}.`,
  ];
  if (top === bottom) {
    sentences.push(`All four dimensions score ${top}/100.`);
  } else {
    sentences.push(`Your highest dimension is ${joinNames(strongest)} (${top}/100) and your lowest is ${joinNames(weakest)} (${bottom}/100).`);
  }
  if (f.required_total > 0) {
    sentences.push(`You show evidence for ${met} of ${plural(f.required_total, 'required skill')}.`);
  }
  if (f.required_missing_skills.length > 0) {
    sentences.push(
      `Not found: ${joinNames(f.required_missing_skills)}. Each required skill that is not found takes part of the weighted total off (at most 40% in all); in SkillBridge's calculation, evidence for ${f.required_missing_skills.length === 1 ? 'it' : 'them'} would reduce that deduction.`
    );
  }
  sentences.push(
    `${f.requirements_covered} of ${plural(f.requirements_total, 'requirement')} for this career ${f.requirements_covered === 1 ? 'is' : 'are'} covered; ${f.requirements_assessed} of them ${f.requirements_assessed === 1 ? 'was' : 'were'} checked in a SkillBridge skill check.`
  );
  const s = f.evidence_shares;
  if (s.assessed !== null) {
    sentences.push(
      `Of the credited evidence, ${s.stated}% comes from your resume, ${s.self_reported}% from portfolio projects you recorded, ${s.assessed}% from SkillBridge skill checks and ${s.inferred}% from related skills.`
    );
  } else {
    sentences.push('No skill evidence is credited yet.');
  }
  sentences.push('Readiness describes the evidence in your profile; it is not a prediction of interview or hiring outcomes.');
  return { sentences, items: [] };
}

interface Gap { skill: string; importance: string; kind: 'missing' | 'limited_evidence'; impact: number }

export function summarizeSkillGaps(facts: Rec): SummaryText {
  const f = facts as unknown as { career_title: string; gaps: Gap[]; strengths: Array<{ skill: string; impact: number }> };
  const missingRequired = f.gaps.filter(g => g.importance === 'required' && g.kind === 'missing');
  const weak = f.gaps.filter(g => g.kind === 'limited_evidence');
  const sentences = [
    `SkillBridge orders your ${plural(f.gaps.length, 'gap')} for ${f.career_title} by priority: required skills that are not found come first, then the others, each by its priority score out of 100.`,
  ];
  if (missingRequired.length > 0) {
    sentences.push(`${plural(missingRequired.length, 'required skill')} ${missingRequired.length === 1 ? 'is' : 'are'} not found: ${joinNames(missingRequired.map(g => g.skill))}.`);
  }
  if (weak.length > 0) {
    sentences.push(
      `${joinNames(weak.map(g => g.skill))} ${weak.length === 1 ? 'is a required skill' : 'are required skills'} shown only weakly: ${weak.length === 1 ? 'it already counts' : 'they already count'}, and stronger evidence would raise ${weak.length === 1 ? 'its' : 'their'} contribution.`
    );
  }
  if (f.strengths.length > 0) {
    sentences.push(`Well evidenced: ${joinNames(f.strengths.map(s => s.skill))}.`);
  }
  const KIND = { missing: 'not found', limited_evidence: 'shown only weakly' } as const;
  const items = f.gaps.map(g => `${g.skill}: ${g.importance}, ${KIND[g.kind]}, priority ${g.impact}/100`);
  return { sentences, items };
}

interface Effort { low: number; high: number; unit: 'minutes' | 'hours'; basis: 'time limit' | 'assumption'; approximate?: boolean }

export function summarizeNextAction(facts: Rec): SummaryText {
  const f = facts as unknown as {
    career_title: string; action_title: string; kind: 'verify' | 'project' | 'portfolio'; skills: string[];
    total_actions: number; score_before: number; score_after: number; impact: number; required_gaps_addressed: number;
    needs_learning_first: string[]; effort: Effort; hours_per_week: number | null; weeks_low: number | null;
    weeks_high: number | null; fits_two_weeks: boolean | null;
  };
  const skills = joinNames(f.skills);
  const what = {
    verify: `It is a SkillBridge skill check for ${skills}.`,
    project: `It is a practice project that adds evidence for ${skills}.`,
    portfolio: `It records a finished project in your portfolio, adding evidence for ${skills}.`,
  }[f.kind];
  const e = f.effort;
  // Rounded to whole units from the engine's figures: said so, rather than presented as exact
  const range = `${e.approximate ? 'about ' : ''}${e.low === e.high ? `${e.low} ${e.unit}` : `${e.low} to ${e.high} ${e.unit}`}`;
  const sentences = [
    `SkillBridge ranks “${f.action_title}” first of ${plural(f.total_actions, 'possible action')} for ${f.career_title}.`,
    what,
    `In SkillBridge's scoring it would move your match score from ${f.score_before} to ${f.score_after} (+${f.impact}). This is a hypothetical change, not a guarantee.`,
  ];
  if (f.required_gaps_addressed > 0) {
    sentences.push(`It addresses ${plural(f.required_gaps_addressed, 'required skill')} you have not yet shown in use.`);
  }
  sentences.push(f.needs_learning_first.length > 0
    ? `You would need to learn ${joinNames(f.needs_learning_first)} first.`
    : 'Nothing has to be learnt first.');
  sentences.push(`Effort: ${range} (${e.basis === 'time limit' ? 'the time limit of the skill check' : 'an assumed planning range, not a measurement'}).`);
  if (f.hours_per_week !== null) {
    const weeks = f.weeks_low === f.weeks_high ? plural(f.weeks_low!, 'week') : `${f.weeks_low} to ${f.weeks_high} weeks`;
    sentences.push(`At your ${f.hours_per_week} hours a week that is about ${weeks}, so it ${f.fits_two_weeks ? 'fits' : 'does not fit'} into two weeks.`);
  } else {
    sentences.push('Set your weekly hours to see how it fits your schedule.');
  }
  sentences.push('The ranking adds the score change, points for required skills it addresses and for fitting your weekly hours, and subtracts points when a skill must be learnt first; a tie goes to the action with less effort.');
  return { sentences, items: [] };
}
