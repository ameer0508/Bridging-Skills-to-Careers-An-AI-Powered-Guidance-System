/**
 * Role-specific interview rubrics (D5); see docs/INTERVIEWS.md.
 *
 * A rubric only re-weights the dimensions every answer is already measured on (relevance,
 * completeness, specificity, structure and, when an AI evaluator judged it, technical accuracy).
 * The caps that stop short, off-topic or unverified answers scoring well are the same for every
 * role. The rubric is chosen when a session starts and stored with it, so a session is always
 * re-scored the way it was first scored; sessions from before rubrics existed use 'general', whose
 * weights are the ones used before.
 */

export const RUBRIC_VERSION = 1 as const;

export type RubricId = 'general' | 'software_engineering' | 'data' | 'infrastructure_security' | 'product_business' | 'design';

export interface HeuristicWeights {
  relevance: number;
  completeness: number;
  specificity: number;
  structure: number;
}

export interface AiWeights extends HeuristicWeights {
  technicalAccuracy: number;
}

export interface InterviewRubric {
  id: RubricId;
  version: typeof RUBRIC_VERSION;
  label: string;
  /** Example roles, for display. */
  roles: string[];
  /** What the rubric emphasises and why, in one sentence. */
  emphasis: string;
  /** Weights of the rule-based rubric; sum to 1. */
  heuristic: HeuristicWeights;
  /** Weights of the AI rubric, in points; sum to 100. */
  ai: AiWeights;
}

export const RUBRICS: Record<RubricId, InterviewRubric> = {
  general: {
    id: 'general',
    version: RUBRIC_VERSION,
    label: 'General',
    roles: ['Any role not listed below'],
    emphasis: 'Balanced: answering the question asked comes first, then depth, concrete detail and structure.',
    heuristic: { relevance: 0.35, completeness: 0.25, specificity: 0.2, structure: 0.2 },
    ai: { relevance: 25, completeness: 20, specificity: 20, structure: 15, technicalAccuracy: 20 },
  },
  software_engineering: {
    id: 'software_engineering',
    version: RUBRIC_VERSION,
    label: 'Software engineering',
    roles: ['Software Engineer', 'Backend Engineer', 'Frontend Engineer', 'Full Stack Developer', 'Mobile App Developer'],
    emphasis: 'Correctness and reasoning about trade-offs weigh more; concrete tools and a clear line of reasoning matter more than length.',
    heuristic: { relevance: 0.3, completeness: 0.2, specificity: 0.25, structure: 0.25 },
    ai: { relevance: 20, completeness: 15, specificity: 20, structure: 15, technicalAccuracy: 30 },
  },
  data: {
    id: 'data',
    version: RUBRIC_VERSION,
    label: 'Data and machine learning',
    roles: ['Data Analyst', 'Data Scientist', 'Machine Learning Engineer'],
    emphasis: 'Measured results and named methods weigh more: data roles are judged on evidence and quantities.',
    heuristic: { relevance: 0.3, completeness: 0.2, specificity: 0.3, structure: 0.2 },
    ai: { relevance: 20, completeness: 15, specificity: 25, structure: 15, technicalAccuracy: 25 },
  },
  infrastructure_security: {
    id: 'infrastructure_security',
    version: RUBRIC_VERSION,
    label: 'Infrastructure, reliability and security',
    roles: ['DevOps Engineer', 'Cloud Engineer', 'Cybersecurity Analyst', 'Site Reliability Engineer'],
    emphasis: 'Precise, correct operational detail weighs most; a structured incident or change narrative also counts.',
    heuristic: { relevance: 0.3, completeness: 0.15, specificity: 0.3, structure: 0.25 },
    ai: { relevance: 20, completeness: 10, specificity: 25, structure: 15, technicalAccuracy: 30 },
  },
  product_business: {
    id: 'product_business',
    version: RUBRIC_VERSION,
    label: 'Product and business',
    roles: ['Product Manager', 'Business Analyst'],
    emphasis: 'Structure and relevance weigh more: a clear situation, decision and outcome, told in order.',
    heuristic: { relevance: 0.35, completeness: 0.2, specificity: 0.15, structure: 0.3 },
    ai: { relevance: 25, completeness: 20, specificity: 15, structure: 25, technicalAccuracy: 15 },
  },
  design: {
    id: 'design',
    version: RUBRIC_VERSION,
    label: 'Design',
    roles: ['UI/UX Designer', 'Product Designer'],
    emphasis: 'Relevance and the story of the design process weigh more than technical vocabulary.',
    heuristic: { relevance: 0.35, completeness: 0.2, specificity: 0.2, structure: 0.25 },
    ai: { relevance: 25, completeness: 20, specificity: 20, structure: 20, technicalAccuracy: 15 },
  },
};

export const RUBRIC_IDS = Object.keys(RUBRICS) as RubricId[];

/** Checked in order; the first match wins. Anything unmatched uses 'general'. */
const ROLE_PATTERNS: Array<[RegExp, RubricId]> = [
  [/\b(ui|ux|designer|design)\b/i, 'design'],
  [/\b(product manager|product owner|business analyst|program manager|project manager)\b/i, 'product_business'],
  [/\b(data|machine learning|ml|ai engineer|analytics|statistician)\b/i, 'data'],
  [/\b(devops|cloud|security|cybersecurity|site reliability|sre|platform|infrastructure|network|systems administrator)\b/i, 'infrastructure_security'],
  [/\b(software|backend|back-end|frontend|front-end|full[ -]?stack|mobile|developer|programmer|engineer)\b/i, 'software_engineering'],
];

export function resolveRubric(roleTitle: string | undefined | null): InterviewRubric {
  const title = (roleTitle ?? '').trim();
  for (const [pattern, id] of ROLE_PATTERNS) if (pattern.test(title)) return RUBRICS[id];
  return RUBRICS.general;
}

/** The rubric a stored session or evaluation names; unknown or missing ids are 'general'. */
export const rubricById = (id: string | undefined | null): InterviewRubric => RUBRICS[(id as RubricId) ?? 'general'] ?? RUBRICS.general;
