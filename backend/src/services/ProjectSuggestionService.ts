import mongoose from 'mongoose';
import { CareerMatch } from '../models/CareerMatch.js';
import { User } from '../models/User.js';
import LearningProject, { type ILearningProject, type LearningProjectStatus } from '../models/LearningProject.js';
import { PROJECT_BRIEFS, PROJECT_BRIEFS_VERSION, type ProjectBrief } from '../seed/projectBriefs.js';
import CareerScenarioService from './CareerScenarioService.js';
import { AppError } from '../middlewares/errorHandler.js';
import LearningActivityService from './LearningActivityService.js';
import { EventType } from '../models/ProgressEvent.js';

/**
 * Practice projects chosen from the user's own gaps for one career.
 *
 * A brief is suggested only when it exercises at least one requirement of the career that the
 * user has not yet shown in a role or project. Suggestions are ranked by how far the match score
 * would move if those skills had project evidence, computed by the same scenario engine as the
 * Career Lab. That figure is hypothetical: taking on or finishing a project here changes no score.
 */

interface Suggestion {
  briefId: string;
  title: string;
  summary: string;
  practises: Array<{ skill: string; importance: string; currentStatus: string }>;
  alternatives: string[][];
  tasks: string[];
  deliverables: string[];
  effortHours: { low: number; high: number };
  weeks: { low: number; high: number } | null;
  hypotheticalScore: { before: number; after: number; delta: number };
  requiredGapsClosed: number;
  why: string;
  started: { projectId: string; status: string } | null;
}

interface Gap {
  skillName: string;
  importance: string;
  currentStatus: string;
}

const key = (name: string): string => name.trim().toLowerCase();
const MAX_SUGGESTIONS = 5;

/** Gap skills a brief would exercise, taking one skill from each group of alternatives. */
export function practisedGaps<G>(brief: ProjectBrief, gaps: Map<string, G>, gain: Map<string, number>): G[] {
  const chosen = brief.skills.filter(skill => gaps.has(key(skill)));
  for (const group of brief.oneOf) {
    const inGroup = chosen.filter(skill => group.some(g => key(g) === key(skill)));
    if (inGroup.length <= 1) continue;
    // Keep the alternative worth most to this career
    const best = [...inGroup].sort((a, b) => (gain.get(key(b)) ?? 0) - (gain.get(key(a)) ?? 0) || a.localeCompare(b))[0];
    for (const skill of inGroup) if (skill !== best) chosen.splice(chosen.indexOf(skill), 1);
  }
  return chosen.map(skill => gaps.get(key(skill))!);
}

class ProjectSuggestionService {
  /** The career to plan for: the one asked for, otherwise the user's target role or best match. */
  private async resolveCareer(userId: string, careerId?: string): Promise<string | null> {
    if (careerId) return careerId;
    const uid = new mongoose.Types.ObjectId(userId);
    const matches = await CareerMatch.find({ userId: uid })
      .sort({ matchScore: -1, confidence: -1, _id: 1 })
      .populate<{ careerId: { _id: mongoose.Types.ObjectId; title: string } | null }>('careerId', 'title');
    if (matches.length === 0) return null;
    const user = await User.findById(uid).select('targetRole learningPreferences').lean();
    const target = (user?.targetRole || '').trim().toLowerCase();
    const preferred = matches.find(m => m.careerId && m.careerId.title.toLowerCase() === target) || matches[0];
    return preferred.careerId ? preferred.careerId._id.toString() : null;
  }

  private practised(brief: ProjectBrief, gaps: Map<string, Gap>, gain: Map<string, number>): Gap[] {
    return practisedGaps(brief, gaps, gain);
  }

  /** The five most useful projects for the career. */
  public async suggest(userId: string, requestedCareerId?: string) {
    const ranked = await this.ranked(userId, requestedCareerId);
    return { ...ranked, suggestions: ranked.suggestions.slice(0, MAX_SUGGESTIONS) };
  }

  /** Every brief that addresses one of the user's gaps for the career, most useful first. */
  private async ranked(userId: string, requestedCareerId?: string) {
    const careerId = await this.resolveCareer(userId, requestedCareerId);
    const base = { briefsVersion: PROJECT_BRIEFS_VERSION, note: 'Score changes are hypothetical: what the match score would be if these skills had project evidence on your profile. Starting or finishing a project here changes no score.' };
    if (!careerId) {
      return { ...base, hasProfile: false, career: null, hoursPerWeek: null, suggestions: [] as Suggestion[] };
    }

    const counterfactuals = await CareerScenarioService.counterfactuals(userId, careerId);
    const user = await User.findById(userId).select('learningPreferences').lean();
    const hoursPerWeek = user?.learningPreferences?.hoursPerWeek ?? null;
    const career = { id: careerId, title: counterfactuals.careerTitle, matchScore: counterfactuals.baseline.score };
    if (!counterfactuals.hasProfile) {
      return { ...base, hasProfile: false, career, hoursPerWeek, suggestions: [] as Suggestion[] };
    }

    // Requirements not yet backed by a role or project, with what one project would add for each
    const gaps = new Map<string, Gap>();
    const gain = new Map<string, number>();
    for (const change of counterfactuals.singleChanges) {
      gaps.set(key(change.skillName), { skillName: change.skillName, importance: change.importance, currentStatus: change.currentStatus });
      gain.set(key(change.skillName), change.scoreDelta);
    }

    const started = await LearningProject.find({ userId: new mongoose.Types.ObjectId(userId) });
    const suggestions: Suggestion[] = [];
    for (const brief of PROJECT_BRIEFS) {
      const practised = this.practised(brief, gaps, gain);
      if (practised.length === 0) continue;
      const scenario = await CareerScenarioService.whatIf(userId, [{ type: 'add_project', skills: practised.map(g => g.skillName), name: brief.title }], [careerId]);
      const effect = scenario.careers[0];
      const mine = started.find(p => p.briefId === brief.id);
      suggestions.push({
        briefId: brief.id,
        title: brief.title,
        summary: brief.summary,
        practises: practised.map(g => ({ skill: g.skillName, importance: g.importance, currentStatus: g.currentStatus })),
        alternatives: brief.oneOf.filter(group => practised.some(g => group.some(s => key(s) === key(g.skillName)))),
        tasks: brief.tasks,
        deliverables: brief.deliverables,
        effortHours: brief.effortHours,
        weeks: hoursPerWeek ? { low: Math.ceil(brief.effortHours.low / hoursPerWeek), high: Math.ceil(brief.effortHours.high / hoursPerWeek) } : null,
        hypotheticalScore: { before: effect.scoreBefore, after: effect.scoreAfter, delta: effect.scoreDelta },
        requiredGapsClosed: effect.missingRequiredBefore - effect.missingRequiredAfter,
        why: this.reason(practised, career.title),
        started: mine ? { projectId: mine._id.toString(), status: mine.status } : null
      });
    }

    suggestions.sort(
      (a, b) =>
        b.hypotheticalScore.delta - a.hypotheticalScore.delta ||
        b.requiredGapsClosed - a.requiredGapsClosed ||
        a.effortHours.low - b.effortHours.low ||
        a.briefId.localeCompare(b.briefId)
    );
    return { ...base, hasProfile: true, career, hoursPerWeek, suggestions };
  }

  private reason(practised: Gap[], careerTitle: string): string {
    const describe = (g: Gap) => `${g.skillName} (${g.importance}, ${g.currentStatus === 'missing' ? 'not on your profile' : g.currentStatus === 'listed' ? 'listed but never shown in use' : 'only inferred from a related skill'})`;
    return `${careerTitle} asks for ${practised.map(describe).join(', ')}. This project would put ${practised.length === 1 ? 'it' : 'them'} to use.`;
  }

  // ------------------------------------------------------------------------------------------
  // Projects the user has taken on
  // ------------------------------------------------------------------------------------------

  public async list(userId: string) {
    const projects = await LearningProject.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1, _id: -1 });
    return projects.map(p => this.present(p));
  }

  /** Takes a suggested project on. The brief must currently address one of the user's gaps. */
  public async start(userId: string, briefId: string, careerId?: string) {
    const existing = await LearningProject.findOne({ userId: new mongoose.Types.ObjectId(userId), briefId });
    if (existing) return { project: this.present(existing), created: false };
    if (!PROJECT_BRIEFS.some(b => b.id === briefId)) throw new AppError('That project is not in the catalogue.', 404, 'PROJECT_BRIEF_NOT_FOUND');

    const result = await this.ranked(userId, careerId);
    const suggestion = result.suggestions.find(s => s.briefId === briefId);
    if (!result.career || !suggestion) {
      throw new AppError('This project does not address a gap on your profile for that career.', 409, 'PROJECT_NOT_RELEVANT');
    }
    const project = await LearningProject.create({
      userId: new mongoose.Types.ObjectId(userId),
      careerId: new mongoose.Types.ObjectId(result.career.id),
      briefId,
      title: suggestion.title,
      summary: suggestion.summary,
      targetSkills: suggestion.practises.map(p => p.skill),
      tasks: suggestion.tasks.map(text => ({ text, done: false })),
      deliverables: suggestion.deliverables,
      effortHours: suggestion.effortHours,
      status: 'planned',
      briefsVersion: PROJECT_BRIEFS_VERSION
    });
    return { project: this.present(project), created: true };
  }

  public async update(userId: string, projectId: string, change: { status?: LearningProjectStatus; task?: { index: number; done: boolean } }) {
    const project = await this.owned(userId, projectId);
    const now = new Date();
    if (change.task) {
      const task = project.tasks[change.task.index];
      if (!task) throw new AppError('That task does not exist.', 400, 'VALIDATION_ERROR');
      task.done = change.task.done;
      // Ticking a task off means the project is under way
      if (change.task.done && project.status === 'planned' && !change.status) change.status = 'in_progress';
    }
    if (change.status && change.status !== project.status) {
      project.status = change.status;
      if (change.status === 'planned') {
        project.startedAt = undefined;
        project.completedAt = undefined;
      } else {
        if (!project.startedAt) project.startedAt = now;
        project.completedAt = change.status === 'completed' ? now : undefined;
      }
    }
    await project.save();
    const justCompleted = change.status === 'completed' && Boolean(project.completedAt) && project.completedAt!.getTime() === now.getTime();
    if (change.task?.done || justCompleted) {
      await LearningActivityService.recordActivity(userId, EventType.PRACTICE_PROJECT_PROGRESS, { title: project.title, status: project.status }, project._id.toString());
    }
    if (justCompleted) {
      await LearningActivityService.notify(userId, 'milestone', `project:${project._id.toString()}`, `Practice project marked complete: ${project.title}`, 'Add it to your portfolio with a link to make it count as evidence.', '/portfolio');
    }
    return this.present(project);
  }

  public async remove(userId: string, projectId: string): Promise<void> {
    const project = await this.owned(userId, projectId);
    await project.deleteOne();
  }

  private async owned(userId: string, projectId: string): Promise<ILearningProject> {
    const notFound = new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
    if (!mongoose.Types.ObjectId.isValid(projectId)) throw notFound;
    const project = await LearningProject.findOne({ _id: new mongoose.Types.ObjectId(projectId), userId: new mongoose.Types.ObjectId(userId) });
    if (!project) throw notFound;
    return project;
  }

  private present(project: ILearningProject) {
    return {
      id: project._id.toString(),
      careerId: project.careerId.toString(),
      briefId: project.briefId,
      title: project.title,
      summary: project.summary,
      targetSkills: project.targetSkills,
      tasks: project.tasks.map(t => ({ text: t.text, done: t.done })),
      tasksDone: project.tasks.filter(t => t.done).length,
      deliverables: project.deliverables,
      effortHours: project.effortHours,
      status: project.status,
      startedAt: project.startedAt ?? null,
      completedAt: project.completedAt ?? null,
      // What the status is worth as evidence: nothing, until it is shown on a resume or in the portfolio
      evidence: 'Your own record of progress. It is not skill evidence and changes no score.'
    };
  }
}

export default new ProjectSuggestionService();
