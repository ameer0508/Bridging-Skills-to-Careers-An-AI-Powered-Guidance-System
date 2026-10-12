import mongoose from 'mongoose';
import { Career } from '../models/Career.js';
import { CareerRequirement, type ICareerRequirement } from '../models/CareerRequirement.js';
import { CareerSimilarity } from '../models/CareerSimilarity.js';
import { UserSkill, type IEvidence, type IUserSkill } from '../models/UserSkill.js';
import TransitionPlan, { type ITransitionPlan, type ITransitionStage } from '../models/TransitionPlan.js';
import CareerScoringEngine, { type ScoreResult } from './CareerScoringEngine.js';
import { EVIDENCE_POINTS } from './EvidenceCalculator.js';
import { canonicalSkillName, lookupSkill } from '../utils/skillLexicon.js';
import { skillKeys } from '../utils/skillMatching.js';
import { SCORING_VERSION, taxonomyVersion } from '../utils/versions.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Career comparison, what-if analysis, counterfactual explanations and transition plans.
 *
 * Everything here is computed with the real scoring function, CareerScoringEngine.calculateScore,
 * applied to an in-memory copy of the user's skills. Nothing hypothetical is written to the
 * user's profile, and there is no second scoring formula to drift out of step.
 *
 * A hypothetical score says how the match score would change if the evidence existed. It is not
 * a prediction of interviews, offers or employment.
 */

export type ScenarioChange =
  | { type: 'add_skill'; skill: string }
  | { type: 'add_project'; skills: string[]; name?: string }
  | { type: 'add_certification'; skills: string[]; name?: string }
  | { type: 'add_experience'; skills: string[]; name?: string }
  | { type: 'remove_skill'; skill: string };

/** A skill as the scoring engine needs it, detached from the database. */
interface ScenarioSkill {
  canonicalName: string;
  aliases: string[];
  evidenceScore: number;
  evidences: IEvidence[];
  hypothetical: boolean;
}

export interface RequirementDelta {
  skillName: string;
  importance: string;
  pointsPossible: number;
  statusBefore: string;
  statusAfter: string;
  pointsBefore: number;
  pointsAfter: number;
  pointsDelta: number;
}

export interface CareerScenarioResult {
  careerId: string;
  careerTitle: string;
  scoreBefore: number;
  scoreAfter: number;
  scoreDelta: number;
  missingRequiredBefore: number;
  missingRequiredAfter: number;
  /** Requirements whose points changed, largest change first. */
  requirementChanges: RequirementDelta[];
}

const round2 = (n: number): number => Math.round(n * 100) / 100;
const stepped = (steps: readonly number[], occurrence: number): number => steps[Math.min(occurrence, steps.length - 1)];
const countOf = (skill: ScenarioSkill, sourceType: string): number => skill.evidences.filter(e => e.sourceType === sourceType).length;
/** Projects already counted for a skill: those on the resume and portfolio entries that earned points. */
const projectCount = (skill: ScenarioSkill): number =>
  skill.evidences.filter(e => e.sourceType === 'resume_projects' || (e.sourceType === 'portfolio_project' && (e.points || 0) > 0)).length;

/** The scoring engine reads `skillId.canonicalName`, `skillId.aliases`, `evidenceScore` and `evidences`. */
const asEngineInput = (skills: ScenarioSkill[]): IUserSkill[] =>
  skills.map(s => ({
    skillId: { canonicalName: s.canonicalName, aliases: s.aliases },
    evidenceScore: s.evidenceScore,
    evidences: s.evidences
  })) as unknown as IUserSkill[];

class CareerScenarioService {
  // ------------------------------------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------------------------------------

  private async loadSkills(userId: string): Promise<ScenarioSkill[]> {
    const docs = await UserSkill.find({ userId: new mongoose.Types.ObjectId(userId) }).populate('skillId');
    const skills: ScenarioSkill[] = [];
    for (const doc of docs) {
      const skill = doc.skillId as unknown as { canonicalName?: string; aliases?: string[] } | null;
      if (!skill?.canonicalName) continue;
      skills.push({
        canonicalName: skill.canonicalName,
        aliases: skill.aliases || [],
        evidenceScore: doc.evidenceScore,
        evidences: doc.evidences.map(e => ({ sourceType: e.sourceType, description: e.description, weight: e.weight, points: e.points })),
        hypothetical: false
      });
    }
    return skills;
  }

  private async loadCareers(careerIds?: string[]): Promise<Array<{ id: string; title: string; category: string; requirements: ICareerRequirement[] }>> {
    if (careerIds) {
      const invalid = careerIds.find(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalid) throw new AppError(`"${invalid}" is not a valid career id.`, 400, 'VALIDATION_ERROR');
    }
    const filter = careerIds ? { _id: { $in: careerIds.map(id => new mongoose.Types.ObjectId(id)) } } : { isActive: { $ne: false } };
    const careers = await Career.find(filter).sort({ title: 1 });
    if (careerIds && careers.length !== new Set(careerIds).size) {
      throw new AppError('One or more careers were not found.', 404, 'CAREER_NOT_FOUND');
    }
    const requirements = await CareerRequirement.find({ careerId: { $in: careers.map(c => c._id) } });
    return careers
      .map(career => ({
        id: career._id.toString(),
        title: career.title,
        category: career.category,
        requirements: requirements.filter(r => r.careerId.toString() === career._id.toString())
      }))
      .filter(career => career.requirements.length > 0);
  }

  /** Requirement names across all careers, used to accept skill names that are not in the lexicon. */
  private async knownRequirementKeys(): Promise<Set<string>> {
    const names: string[] = await CareerRequirement.distinct('skillName');
    return new Set(names.flatMap(name => skillKeys(name)));
  }

  // ------------------------------------------------------------------------------------------
  // Applying hypothetical changes
  // ------------------------------------------------------------------------------------------

  /**
   * Returns a changed copy of the skills. Evidence added here earns the same points real evidence
   * of that kind earns (EVIDENCE_POINTS), including the diminishing returns for repeats.
   */
  public applyChanges(skills: ScenarioSkill[], changes: ScenarioChange[], requirementKeys: Set<string>): ScenarioSkill[] {
    const result = skills.map(s => ({ ...s, evidences: [...s.evidences] }));
    const find = (name: string): ScenarioSkill | undefined => {
      const keys = new Set(skillKeys(canonicalSkillName(name)));
      return result.find(s => [s.canonicalName, ...s.aliases].some(n => skillKeys(n).some(k => keys.has(k))));
    };
    const ensure = (name: string): ScenarioSkill => {
      const existing = find(name);
      if (existing) return existing;
      const known = lookupSkill(name);
      if (!known && !skillKeys(name).some(k => requirementKeys.has(k))) {
        throw new AppError(`"${name}" is not a skill SkillBridge recognises.`, 400, 'UNKNOWN_SKILL');
      }
      const created: ScenarioSkill = {
        canonicalName: known?.name || name.trim(),
        aliases: known?.aliases || [],
        // A skill that newly appears also earns the baseline for being listed
        evidenceScore: EVIDENCE_POINTS.listed,
        evidences: [{ sourceType: 'resume_skills', description: 'Hypothetical: listed', weight: 0.2 }],
        hypothetical: true
      };
      result.push(created);
      return created;
    };
    const add = (skill: ScenarioSkill, points: number, sourceType: IEvidence['sourceType'], description: string) => {
      skill.evidenceScore = Math.min(100, skill.evidenceScore + points);
      skill.evidences.push({ sourceType, description, weight: 0 });
      skill.hypothetical = true;
    };

    for (const change of changes) {
      switch (change.type) {
        case 'add_skill':
          ensure(change.skill);
          break;
        case 'remove_skill': {
          const target = find(change.skill);
          if (target) result.splice(result.indexOf(target), 1);
          break;
        }
        case 'add_project':
          for (const name of change.skills) {
            const skill = ensure(name);
            add(skill, stepped(EVIDENCE_POINTS.projects, projectCount(skill)), 'resume_projects', `Hypothetical project${change.name ? `: ${change.name}` : ''}`);
          }
          break;
        case 'add_experience':
          for (const name of change.skills) {
            const skill = ensure(name);
            add(skill, stepped(EVIDENCE_POINTS.experience, countOf(skill, 'resume_experience')), 'resume_experience', `Hypothetical role${change.name ? `: ${change.name}` : ''}`);
          }
          break;
        case 'add_certification':
          for (const name of change.skills) {
            const skill = ensure(name);
            // A certification counts once per skill, as in the real calculation
            if (countOf(skill, 'resume_certifications') === 0) {
              add(skill, EVIDENCE_POINTS.certification, 'resume_certifications', `Hypothetical certification${change.name ? `: ${change.name}` : ''}`);
            }
          }
          break;
      }
    }
    return result;
  }

  private compareScores(career: { id: string; title: string }, before: ScoreResult, after: ScoreResult): CareerScenarioResult {
    const requirementChanges: RequirementDelta[] = [];
    before.breakdown.forEach((row, index) => {
      const next = after.breakdown[index];
      const delta = round2(next.pointsEarned - row.pointsEarned);
      if (delta !== 0 || next.status !== row.status) {
        requirementChanges.push({
          skillName: row.skillName,
          importance: row.importance,
          pointsPossible: row.pointsPossible,
          statusBefore: row.status,
          statusAfter: next.status,
          pointsBefore: row.pointsEarned,
          pointsAfter: next.pointsEarned,
          pointsDelta: delta
        });
      }
    });
    requirementChanges.sort((a, b) => Math.abs(b.pointsDelta) - Math.abs(a.pointsDelta));
    return {
      careerId: career.id,
      careerTitle: career.title,
      scoreBefore: before.totalScore,
      scoreAfter: after.totalScore,
      scoreDelta: after.totalScore - before.totalScore,
      missingRequiredBefore: before.missingRequiredCount,
      missingRequiredAfter: after.missingRequiredCount,
      requirementChanges
    };
  }

  // ------------------------------------------------------------------------------------------
  // A2. What-if
  // ------------------------------------------------------------------------------------------

  /** Scores before and after a set of hypothetical changes, for the given careers or for all. */
  public async whatIf(userId: string, changes: ScenarioChange[], careerIds?: string[]) {
    const [skills, careers, requirementKeys] = await Promise.all([
      this.loadSkills(userId),
      this.loadCareers(careerIds),
      this.knownRequirementKeys()
    ]);
    const changed = this.applyChanges(skills, changes, requirementKeys);
    const baseInput = asEngineInput(skills);
    const changedInput = asEngineInput(changed);

    const results = careers
      .map(career =>
        this.compareScores(
          career,
          CareerScoringEngine.calculateScore(career.requirements, baseInput),
          CareerScoringEngine.calculateScore(career.requirements, changedInput)
        )
      )
      .sort((a, b) => b.scoreDelta - a.scoreDelta || b.scoreAfter - a.scoreAfter || a.careerTitle.localeCompare(b.careerTitle));

    return {
      hasProfile: skills.length > 0,
      changesApplied: changes.length,
      hypotheticalSkills: changed.filter(s => s.hypothetical).map(s => ({ name: s.canonicalName, evidenceScore: s.evidenceScore })),
      careers: results,
      scoringVersion: SCORING_VERSION,
      taxonomyVersion: taxonomyVersion(),
      note: 'Hypothetical: these scores show how the match score would change if this evidence were on your resume. Nothing was saved, and they do not predict hiring outcomes.'
    };
  }

  // ------------------------------------------------------------------------------------------
  // A1. Compare
  // ------------------------------------------------------------------------------------------

  /** Side-by-side view of two to four careers against the user's current evidence. */
  public async compare(userId: string, careerIds: string[]) {
    const [skills, careers] = await Promise.all([this.loadSkills(userId), this.loadCareers(careerIds)]);
    const input = asEngineInput(skills);

    const rows = careerIds
      .map(id => careers.find(c => c.id === id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .map(career => {
        const score = CareerScoringEngine.calculateScore(career.requirements, input);
        const byImportance = (importance: string) => {
          const rows = score.breakdown.filter(r => r.importance === importance);
          return { total: rows.length, covered: rows.filter(r => r.status !== 'missing').length };
        };
        const covered = score.breakdown.filter(r => r.status !== 'missing');
        const gaps = score.breakdown.filter(r => r.status === 'missing');
        const weak = score.breakdown.filter(r => r.status === 'listed' || r.status === 'inferred');
        const pointsPossible = score.breakdown.reduce((sum, r) => sum + r.pointsPossible, 0);
        const pointsEarned = score.breakdown.reduce((sum, r) => sum + r.pointsEarned, 0);
        return {
          careerId: career.id,
          careerTitle: career.title,
          category: career.category,
          matchScore: score.totalScore,
          requirements: {
            total: score.breakdown.length,
            required: byImportance('required'),
            preferred: byImportance('preferred'),
            supporting: byImportance('supporting')
          },
          evidence: {
            applied: score.breakdown.filter(r => r.status === 'applied').length,
            listedOnly: score.breakdown.filter(r => r.status === 'listed').length,
            inferred: score.breakdown.filter(r => r.status === 'inferred').length,
            // Mean evidence score of the requirements the user covers; null when none are covered
            averageEvidenceScore: covered.length ? Math.round(covered.reduce((sum, r) => sum + r.evidenceScore, 0) / covered.length) : null
          },
          effort: {
            // Counts and points, not hours: SkillBridge holds no data on how long a skill takes to learn
            skillsToAcquire: gaps.map(r => r.skillName),
            requiredSkillsToAcquire: gaps.filter(r => r.importance === 'required').map(r => r.skillName),
            skillsToStrengthen: weak.map(r => r.skillName),
            pointsToClose: round2(pointsPossible - pointsEarned),
            pointsPossible: round2(pointsPossible)
          },
          sharedWithOthers: [] as string[]
        };
      });

    // Skills to acquire that count for more than one of the compared careers
    const gapCounts = new Map<string, number>();
    rows.forEach(r => r.effort.skillsToAcquire.forEach(s => gapCounts.set(s, (gapCounts.get(s) || 0) + 1)));
    rows.forEach(r => {
      r.sharedWithOthers = r.effort.skillsToAcquire.filter(s => (gapCounts.get(s) || 0) > 1);
    });

    return {
      hasProfile: skills.length > 0,
      careers: rows,
      effortNote: 'Effort is shown as the number of skills to acquire and the score points still open. No time estimate is given because none can be supported by data.',
      scoringVersion: SCORING_VERSION,
      taxonomyVersion: taxonomyVersion()
    };
  }

  // ------------------------------------------------------------------------------------------
  // A5. Counterfactual explanations
  // ------------------------------------------------------------------------------------------

  /**
   * For one career: which single changes would raise the score most, and the smallest set of
   * project-level additions that would reach a target score. Each candidate is evaluated by
   * really re-scoring the changed profile.
   */
  public async counterfactuals(userId: string, careerId: string, targetScore?: number) {
    const [skills, [career], requirementKeys] = await Promise.all([
      this.loadSkills(userId),
      this.loadCareers([careerId]),
      this.knownRequirementKeys()
    ]);
    if (!career) throw new AppError('Career not found.', 404, 'CAREER_NOT_FOUND');

    const baseInput = asEngineInput(skills);
    const baseline = CareerScoringEngine.calculateScore(career.requirements, baseInput);
    const scoreWith = (changes: ScenarioChange[]) =>
      CareerScoringEngine.calculateScore(career.requirements, asEngineInput(this.applyChanges(skills, changes, requirementKeys)));

    // One candidate per requirement that is missing or only weakly evidenced
    const candidates = baseline.breakdown
      .filter(row => row.status !== 'applied')
      .map(row => {
        const change: ScenarioChange = { type: 'add_project', skills: [row.skillName] };
        const after = scoreWith([change]);
        return {
          skillName: row.skillName,
          importance: row.importance,
          currentStatus: row.status,
          action: row.status === 'missing' ? 'Learn it and use it in a project' : 'Use it in a project',
          change,
          scoreAfter: after.totalScore,
          scoreDelta: after.totalScore - baseline.totalScore,
          closesRequiredGap: row.status === 'missing' && row.importance === 'required'
        };
      })
      .sort((a, b) => b.scoreDelta - a.scoreDelta || Number(b.closesRequiredGap) - Number(a.closesRequiredGap) || a.skillName.localeCompare(b.skillName));

    // Greedy path: repeatedly add the change that raises the score most, until the target is met
    const goal = Math.min(100, Math.max(0, targetScore ?? Math.min(100, baseline.totalScore + 20)));
    const path: Array<{ step: number; skillName: string; action: string; scoreAfter: number; scoreDelta: number }> = [];
    const applied: ScenarioChange[] = [];
    let current = baseline.totalScore;
    const remaining = candidates.map(c => c.skillName);
    while (current < goal && remaining.length > 0) {
      let best: { index: number; score: number } | null = null;
      remaining.forEach((skillName, index) => {
        const score = scoreWith([...applied, { type: 'add_project', skills: [skillName] }]).totalScore;
        if (!best || score > best.score) best = { index, score };
      });
      const chosen = best as { index: number; score: number } | null;
      if (!chosen || chosen.score <= current) break; // nothing left raises the score
      const skillName = remaining.splice(chosen.index, 1)[0];
      applied.push({ type: 'add_project', skills: [skillName] });
      path.push({
        step: path.length + 1,
        skillName,
        action: candidates.find(c => c.skillName === skillName)!.action,
        scoreAfter: chosen.score,
        scoreDelta: chosen.score - current
      });
      current = chosen.score;
    }

    return {
      careerId: career.id,
      careerTitle: career.title,
      hasProfile: skills.length > 0,
      baseline: { score: baseline.totalScore, missingRequired: baseline.missingRequiredCount, breakdown: baseline.breakdown },
      singleChanges: candidates.map(({ change: _change, ...rest }) => rest),
      pathToTarget: { targetScore: goal, reached: current >= goal, finalScore: current, steps: path },
      assumption: 'Each change assumes the skill is used in one project, which earns the same evidence points as a real project on a resume.',
      scoringVersion: SCORING_VERSION,
      taxonomyVersion: taxonomyVersion(),
      note: 'Hypothetical: computed by re-scoring your profile with each change. Not a prediction of hiring outcomes.'
    };
  }

  // ------------------------------------------------------------------------------------------
  // A4. Transition plans
  // ------------------------------------------------------------------------------------------

  /**
   * Builds a staged route to a target career. Intermediate stages are careers that are closer to
   * the user's current evidence than the target and share requirements with it, so the skills
   * gained at each stage also count towards the target.
   */
  public async buildTransitionPlan(userId: string, targetCareerId: string): Promise<ITransitionPlan> {
    const [skills, careers, requirementKeys] = await Promise.all([this.loadSkills(userId), this.loadCareers(), this.knownRequirementKeys()]);
    const target = careers.find(c => c.id === targetCareerId);
    if (!mongoose.Types.ObjectId.isValid(targetCareerId) || !target) throw new AppError('Career not found.', 404, 'CAREER_NOT_FOUND');
    if (skills.length === 0) {
      throw new AppError('Upload a resume first: a transition plan starts from the skills you have evidence for.', 409, 'NO_SKILL_PROFILE');
    }

    const input = asEngineInput(skills);
    const scoreOf = (requirements: ICareerRequirement[], withSkills = input) => CareerScoringEngine.calculateScore(requirements, withSkills);
    const targetScore = scoreOf(target.requirements);
    const targetGaps = new Set(targetScore.missingSkills);

    // Similarity recorded in the taxonomy, where present
    const similar = await CareerSimilarity.find({ targetCareerId: new mongoose.Types.ObjectId(targetCareerId) });
    const similarityTo = new Map(similar.map(s => [s.sourceCareerId.toString(), s.similarityScore]));

    const intermediates = careers
      .filter(c => c.id !== target.id)
      .map(career => {
        const score = scoreOf(career.requirements);
        // Gaps of this career that are also gaps of the target: closing them moves the user towards both
        const sharedGaps = score.missingSkills.filter(s => targetGaps.has(s));
        return { career, score, sharedGaps, similarity: similarityTo.get(career.id) ?? 0 };
      })
      .filter(c => c.score.totalScore > targetScore.totalScore && c.sharedGaps.length > 0 && c.score.missingSkills.length < targetScore.missingSkills.length)
      .sort((a, b) => b.similarity - a.similarity || b.sharedGaps.length - a.sharedGaps.length || b.score.totalScore - a.score.totalScore)
      .slice(0, 2)
      // Closest to the user's current evidence first
      .sort((a, b) => b.score.totalScore - a.score.totalScore);

    const stages: ITransitionStage[] = [];
    let accumulated: ScenarioChange[] = [];
    const acquired = new Set<string>();
    const route = [...intermediates.map(i => ({ career: i.career, score: i.score })), { career: target, score: targetScore }];
    route.forEach((stop, index) => {
      const toAcquire = stop.score.missingSkills.filter(s => !acquired.has(s));
      toAcquire.forEach(s => acquired.add(s));
      accumulated = [...accumulated, ...toAcquire.map(skill => ({ type: 'add_project' as const, skills: [skill] }))];
      const projected = scoreOf(stop.career.requirements, asEngineInput(this.applyChanges(skills, accumulated, requirementKeys)));
      stages.push({
        order: index + 1,
        careerId: new mongoose.Types.ObjectId(stop.career.id),
        careerTitle: stop.career.title,
        skillsToAcquire: toAcquire,
        scoreAtCreation: stop.score.totalScore,
        projectedScore: projected.totalScore
      });
    });

    return TransitionPlan.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId), targetCareerId: new mongoose.Types.ObjectId(targetCareerId) },
      { $set: { targetCareerTitle: target.title, stages, scoringVersion: SCORING_VERSION, taxonomyVersion: taxonomyVersion() } },
      { upsert: true, new: true, runValidators: true }
    );
  }

  /** The user's plans with each stage's score as it stands now. */
  public async listTransitionPlans(userId: string) {
    const [plans, skills, careers] = await Promise.all([
      TransitionPlan.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ updatedAt: -1 }),
      this.loadSkills(userId),
      this.loadCareers()
    ]);
    const input = asEngineInput(skills);
    return plans.map(plan => {
      const stages = plan.stages.map(stage => {
        const career = careers.find(c => c.id === stage.careerId.toString());
        const now = career ? CareerScoringEngine.calculateScore(career.requirements, input) : null;
        const stillMissing = now ? stage.skillsToAcquire.filter(s => now.missingSkills.includes(s)) : stage.skillsToAcquire;
        return {
          order: stage.order,
          careerId: stage.careerId.toString(),
          careerTitle: stage.careerTitle,
          skillsToAcquire: stage.skillsToAcquire,
          skillsStillMissing: stillMissing,
          scoreAtCreation: stage.scoreAtCreation,
          currentScore: now?.totalScore ?? null,
          projectedScore: stage.projectedScore,
          // Reached when the user's real evidence now covers everything this stage asked for
          reached: stillMissing.length === 0
        };
      });
      return {
        id: plan._id.toString(),
        targetCareerId: plan.targetCareerId.toString(),
        targetCareerTitle: plan.targetCareerTitle,
        stages,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        // Computed under other rules or another taxonomy: the figures may no longer hold
        outdated: plan.scoringVersion !== SCORING_VERSION || plan.taxonomyVersion !== taxonomyVersion()
      };
    });
  }

  public async deleteTransitionPlan(userId: string, planId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(planId)) throw new AppError('Transition plan not found.', 404, 'PLAN_NOT_FOUND');
    const result = await TransitionPlan.deleteOne({ _id: new mongoose.Types.ObjectId(planId), userId: new mongoose.Types.ObjectId(userId) });
    if (result.deletedCount === 0) throw new AppError('Transition plan not found.', 404, 'PLAN_NOT_FOUND');
  }
}

export default new CareerScenarioService();
