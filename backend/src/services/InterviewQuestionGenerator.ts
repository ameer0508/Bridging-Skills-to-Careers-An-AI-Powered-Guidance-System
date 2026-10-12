import { z } from 'zod';
import { aiHttp } from './aiHttp.js';
import logger from '../config/logger.js';
import type { IQuestionItem, InterviewQuestionSource } from '../models/InterviewSession.js';
import {
  INTERVIEW_QUESTION_BANK,
  roleFamilies,
  type BankQuestion,
  type InterviewCategory,
  type QuestionNeed
} from '../seed/interviewQuestionBank.js';

/**
 * Builds the questions for one interview session from facts on record for the user.
 *
 * An AI provider is asked first. When it is unavailable, slow, or returns output that fails
 * validation, the deterministic question bank is used instead and the session says so.
 */

export type InterviewMode = 'technical' | 'behavioral' | 'project' | 'resume' | 'career' | 'mixed';
export const INTERVIEW_MODES: InterviewMode[] = ['technical', 'behavioral', 'project', 'resume', 'career', 'mixed'];

export interface QuestionContext {
  userId: string;
  roleTitle: string;
  mode: InterviewMode;
  count: number;
  /** Skills on the user's profile, strongest evidence first. */
  skills: string[];
  /** Skills the target role expects that the profile does not show. */
  gaps: string[];
  /** "Role at Company" entries from the active resume. */
  experience: string[];
  /** Project names from the active resume. */
  projects: string[];
  job?: {
    title?: string;
    company?: string;
    description?: string;
    /** Skills named in the posting that are / are not on the user's profile. */
    matchedSkills: string[];
    missingSkills: string[];
  };
  /** Question ids and texts from the user's recent sessions, newest first. */
  recentQuestionIds: string[];
  recentQuestionTexts: string[];
  /** How many sessions the user has started before; varies the selection between sessions. */
  sessionOrdinal: number;
}

export interface GeneratedQuestions {
  questions: IQuestionItem[];
  source: InterviewQuestionSource;
}

const aiTimeoutMs = (): number => Number(process.env.INTERVIEW_QUESTION_AI_TIMEOUT_MS) || 15000;

// ---------------------------------------------------------------------------------------------
// Deterministic helpers
// ---------------------------------------------------------------------------------------------

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small seeded generator (mulberry32) so a given user/session always gets the same selection. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const slug = (value: string): string => value.toLowerCase().replace(/[^a-z0-9+#]+/g, '-').replace(/^-|-$/g, '');

/** Which categories to ask, in order, for a mode and question count. */
export function categoryPlan(mode: InterviewMode, count: number): InterviewCategory[] {
  const patterns: Record<InterviewMode, InterviewCategory[]> = {
    technical: ['technical'],
    behavioral: ['behavioral', 'behavioral', 'behavioral', 'resume'],
    project: ['project', 'project', 'technical'],
    resume: ['resume', 'resume', 'project'],
    career: ['career', 'career', 'behavioral'],
    mixed: ['technical', 'behavioral', 'project', 'technical', 'resume', 'career']
  };
  const pattern = patterns[mode];
  return Array.from({ length: count }, (_, i) => pattern[i % pattern.length]);
}

// ---------------------------------------------------------------------------------------------
// Question bank selection
// ---------------------------------------------------------------------------------------------

interface Candidate {
  bank: BankQuestion;
  questionId: string;
  text: string;
  groundedIn: string;
  /** Lower is preferred within a slot. */
  tier: number;
}

const GROUNDING_LABEL: Record<QuestionNeed, string> = {
  skill: 'Skill on your resume',
  gap: 'Gap for your target role',
  experience: 'Role on your resume',
  project: 'Project on your resume',
  jobSkill: 'Skill named in the job posting',
  company: 'Job posting'
};

export function selectFromQuestionBank(ctx: QuestionContext): IQuestionItem[] {
  const random = seededRandom(hashString(`${ctx.userId}|${ctx.sessionOrdinal}|${ctx.mode}|${ctx.roleTitle}`));
  const families = roleFamilies([ctx.roleTitle, ctx.job?.title || ''].join(' '));
  const recent = new Set(ctx.recentQuestionIds);
  const recentTexts = new Set(ctx.recentQuestionTexts.map(t => t.toLowerCase()));
  const jobSkills = [...(ctx.job?.missingSkills || []), ...(ctx.job?.matchedSkills || [])];
  const knownSkills = new Set([...ctx.skills, ...jobSkills].map(s => s.toLowerCase()));

  // Values a placeholder may take. The strongest skills come first, then order is varied per session.
  const fills: Record<QuestionNeed, string[]> = {
    skill: shuffled(ctx.skills.slice(0, 8), random),
    gap: shuffled(ctx.gaps.slice(0, 5), random),
    experience: ctx.experience.slice(0, 3),
    project: shuffled(ctx.projects.slice(0, 4), random),
    jobSkill: jobSkills.slice(0, 6),
    company: ctx.job?.company ? [ctx.job.company] : []
  };

  const render = (bank: BankQuestion, values: Partial<Record<QuestionNeed, string>>): string =>
    bank.text
      .replace(/\{role\}/g, ctx.roleTitle)
      .replace(/\{(skill|gap|experience|project|jobSkill|company)\}/g, (_, key: QuestionNeed) => values[key] || '');

  const candidatesFor = (bank: BankQuestion): Candidate[] => {
    if (bank.families && !bank.families.some(f => families.includes(f))) return [];
    if (bank.skills && !bank.skills.some(s => knownSkills.has(s.toLowerCase()))) return [];

    const needs = bank.needs || [];
    if (needs.some(n => fills[n].length === 0)) return [];

    // Job-posting questions about a skill only make sense in the matching direction
    const varying = needs.find(n => n !== 'company');
    const tierOf = (): number => {
      if (needs.includes('jobSkill') || needs.includes('company')) return 0;
      if (bank.skills) return 1;
      if (needs.length > 0) return 2;
      return bank.families ? 3 : 4;
    };

    if (!varying) {
      const specific = bank.skills?.find(s => knownSkills.has(s.toLowerCase()));
      return [
        {
          bank,
          questionId: bank.id,
          text: render(bank, { company: fills.company[0] }),
          groundedIn: needs.includes('company')
            ? `${GROUNDING_LABEL.company}: ${[ctx.job?.title, ctx.job?.company].filter(Boolean).join(' at ')}`
            : specific
              ? `${ctx.skills.some(s => s.toLowerCase() === specific.toLowerCase()) ? GROUNDING_LABEL.skill : GROUNDING_LABEL.jobSkill}: ${specific}`
              : bank.families
                ? `Target role: ${ctx.roleTitle}`
                : 'General question',
          tier: tierOf()
        }
      ];
    }

    let values = fills[varying];
    if (varying === 'jobSkill') {
      // "You don't show X" questions use skills missing from the profile; "show me X" use matched ones
      const missing = ctx.job?.missingSkills || [];
      const matched = ctx.job?.matchedSkills || [];
      values = bank.id === 'car_job_gap' ? missing : matched.length > 0 ? matched : missing;
    }
    return values.map(value => ({
      bank,
      questionId: `${bank.id}:${slug(value)}`,
      text: render(bank, { [varying]: value, company: fills.company[0] }),
      groundedIn: `${GROUNDING_LABEL[varying]}: ${value}`,
      tier: tierOf()
    }));
  };

  const all: Candidate[] = shuffled(INTERVIEW_QUESTION_BANK, random).flatMap(candidatesFor);

  const chosen: Candidate[] = [];
  const usedBankIds = new Set<string>();
  const usedFills = new Map<string, number>();
  const fillOf = (c: Candidate) => c.questionId.split(':')[1] || '';

  const repeatPenalty = (c: Candidate): number =>
    recent.has(c.questionId) || recentTexts.has(c.text.toLowerCase()) ? 1000 : 0;
  // Spread questions over different skills/projects rather than asking about one thing repeatedly
  const sameFillPenalty = (c: Candidate): number => (usedFills.get(fillOf(c)) || 0) * 3;
  const best = (candidates: Candidate[], score: (c: Candidate) => number): Candidate | undefined =>
    candidates.length === 0 ? undefined : candidates.reduce((a, c) => (score(c) < score(a) ? c : a));

  // Technical questions rotate between kinds so a round is not, say, five "debug X" questions
  type TechnicalKind = 'specific' | 'gap' | 'family' | 'skill';
  const kindOf = (c: Candidate): TechnicalKind | null => {
    if (c.bank.category !== 'technical' || c.tier === 0) return null;
    if (c.bank.needs?.includes('gap')) return 'gap';
    if (c.bank.skills) return 'specific';
    if (c.bank.needs?.includes('skill')) return 'skill';
    return c.bank.families ? 'family' : null;
  };
  const rotation: TechnicalKind[] = ['specific', 'gap', 'family', 'skill'];
  let technicalSlot = Math.floor(random() * rotation.length);

  const pick = (category: InterviewCategory | null): Candidate | undefined => {
    const wanted = category === 'technical' ? rotation[technicalSlot % rotation.length] : null;
    return best(
      all.filter(c => (category === null || c.bank.category === category) && !usedBankIds.has(c.bank.id)),
      // Job-posting questions (tier 0) outside their reserved slots rank between specific and generic ones
      c =>
        repeatPenalty(c) +
        (c.tier === 0 ? 2.5 : c.tier) +
        sameFillPenalty(c) -
        (wanted && kindOf(c) === wanted ? 4 : 0)
    );
  };

  /** A question tied to the job posting, preferably of the category the plan wanted here. */
  const pickForJob = (category: InterviewCategory): Candidate | undefined =>
    best(
      all.filter(c => c.tier === 0 && !usedBankIds.has(c.bank.id)),
      c => repeatPenalty(c) + (c.bank.category === category ? 0 : 1) + sameFillPenalty(c)
    );

  const plan = categoryPlan(ctx.mode, ctx.count);
  // With a job posting, about half of a technical, career or mixed session is tied to it.
  // Other modes keep their character and open with one question about the posting.
  const jobHeavy = ctx.mode === 'technical' || ctx.mode === 'career' || ctx.mode === 'mixed';
  let jobSlotsLeft = ctx.job ? (jobHeavy ? Math.ceil(ctx.count / 2) : 1) : 0;

  for (const category of plan) {
    const candidate = (jobSlotsLeft > 0 ? pickForJob(category) : undefined) || pick(category) || pick(null);
    if (!candidate) break;
    if (jobSlotsLeft > 0) jobSlotsLeft -= 1;
    if (candidate.bank.category === 'technical') technicalSlot += 1;
    chosen.push(candidate);
    usedBankIds.add(candidate.bank.id);
    const fill = fillOf(candidate);
    if (fill) usedFills.set(fill, (usedFills.get(fill) || 0) + 1);
  }

  return chosen.map(c => ({
    questionId: c.questionId,
    question: c.text.replace(/\s+/g, ' ').trim(),
    category: c.bank.category,
    difficulty: c.bank.difficulty,
    expectedConcepts: c.bank.concepts,
    source: 'question_bank' as const,
    groundedIn: c.groundedIn
  }));
}

// ---------------------------------------------------------------------------------------------
// AI generation
// ---------------------------------------------------------------------------------------------

const AiQuestionSchema = z.object({
  question: z.string().min(15).max(600),
  category: z.enum(['technical', 'behavioral', 'project', 'resume', 'career']),
  difficulty: z.enum(['easy', 'medium', 'hard']).catch('medium'),
  expected_concepts: z.array(z.string().min(1).max(80)).max(5).default([]),
  grounded_in: z.string().max(200).default('')
});
const AiQuestionSetSchema = z.object({ questions: z.array(AiQuestionSchema).min(1).max(10) });

async function generateWithAi(ctx: QuestionContext): Promise<IQuestionItem[] | null> {
  try {
    const response = await aiHttp.post(
      '/api/v1/interview/questions',
      {
        role_title: ctx.roleTitle.slice(0, 160),
        mode: ctx.mode,
        count: ctx.count,
        skills: ctx.skills.slice(0, 40),
        gaps: ctx.gaps.slice(0, 20),
        experience: ctx.experience.slice(0, 10),
        projects: ctx.projects.slice(0, 10),
        job_title: (ctx.job?.title || '').slice(0, 200),
        job_company: (ctx.job?.company || '').slice(0, 200),
        job_description: (ctx.job?.description || '').slice(0, 8000),
        avoid: ctx.recentQuestionTexts.slice(0, 20)
      },
      { timeout: aiTimeoutMs() }
    );
    if (!response.data?.success) return null;

    const parsed = AiQuestionSetSchema.safeParse(response.data.data);
    if (!parsed.success || parsed.data.questions.length < ctx.count) {
      logger.warn('AI interview questions failed validation; using the question bank.');
      return null;
    }
    const stamp = Date.now().toString(36);
    return parsed.data.questions.slice(0, ctx.count).map((item, index) => ({
      questionId: `ai_${stamp}_${index + 1}`,
      question: item.question.replace(/\s+/g, ' ').trim(),
      category: item.category,
      difficulty: item.difficulty,
      expectedConcepts: item.expected_concepts,
      source: 'ai' as const,
      groundedIn: item.grounded_in || undefined
    }));
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error';
    logger.info(`AI interview question generation unavailable (${reason}); using the question bank.`);
    return null;
  }
}

export async function generateInterviewQuestions(ctx: QuestionContext): Promise<GeneratedQuestions> {
  const fromAi = await generateWithAi(ctx);
  if (fromAi) return { questions: fromAi, source: 'ai' };
  return { questions: selectFromQuestionBank(ctx), source: 'question_bank' };
}
