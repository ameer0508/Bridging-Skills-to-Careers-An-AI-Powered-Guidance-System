import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { PortfolioEntry, PortfolioShare, type IPortfolioEntry, type PortfolioVisibility } from '../models/PortfolioEntry.js';
import LearningProject from '../models/LearningProject.js';
import { User } from '../models/User.js';
import { UserSkill, type IEvidence, type IUserSkill } from '../models/UserSkill.js';
import EvidenceCalculator, { EVIDENCE_POINTS } from './EvidenceCalculator.js';
import RecalculationService from './RecalculationService.js';
import { findOrCreateCanonicalSkill, recogniseSkill } from '../utils/canonicalSkill.js';
import { withUserLock } from '../utils/userLock.js';
import { creditedProjectKeys, linkIdentitiesIn, linkIdentity, projectKey, projectTitleOf } from '../utils/projectIdentity.js';
import { Resume } from '../models/Resume.js';
import { ParsedResume } from '../models/ParsedResume.js';
import { AppError } from '../middlewares/errorHandler.js';
import LearningActivityService from './LearningActivityService.js';
import { EventType } from '../models/ProgressEvent.js';

/**
 * The user's portfolio: finished work recorded as evidence of skills.
 *
 * An entry with a link counts like a project on a resume: the same points, on the same
 * diminishing scale, continuing after the resume's own projects. Both are the user's statement;
 * neither is checked. An entry without a link is kept and dated but earns no points.
 *
 * Portfolio evidence is rebuilt from the entries whenever they or the resume change, so the
 * entries are the single record of it.
 */
export const PORTFOLIO_LIMITS = { entries: 30, skillsPerEntry: 8 } as const;
export const PORTFOLIO_SOURCE = 'portfolio_project' as const;

export interface PortfolioInput {
  title: string;
  description?: string;
  skills: string[];
  completedOn: string;
  evidenceUrl?: string | null;
  sourceProjectId?: string | null;
  visibility?: PortfolioVisibility;
}

const stepped = (steps: readonly number[], occurrence: number): number => steps[Math.min(occurrence, steps.length - 1)];
const clean = (text: string): string => text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/** An https address without embedded credentials, or null. Throws on anything else. */
function normaliseUrl(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value.trim() === '') return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new AppError('Invalid request: evidenceUrl is not a web address.', 400, 'VALIDATION_ERROR');
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new AppError('Invalid request: evidenceUrl must be an https address without a user name or password in it.', 400, 'VALIDATION_ERROR');
  }
  return url.toString();
}

class PortfolioService {
  // ------------------------------------------------------------------------------------------
  // Entries
  // ------------------------------------------------------------------------------------------

  public async list(userId: string) {
    const uid = new mongoose.Types.ObjectId(userId);
    const [entries, userSkills] = await Promise.all([
      PortfolioEntry.find({ userId: uid }).sort({ completedOn: -1, _id: -1 }),
      UserSkill.find({ userId: uid }).populate('skillId')
    ]);
    return {
      entries: entries.map(entry => this.present(entry, userSkills)),
      limits: PORTFOLIO_LIMITS,
      note:
        'Portfolio entries are your own statement. SkillBridge does not open the link or check the work. An entry with a link counts like a project on a resume; an entry without one is kept but earns no points.'
    };
  }

  public create(userId: string, input: PortfolioInput) {
    return withUserLock(`portfolio:${userId}`, async () => {
      const uid = new mongoose.Types.ObjectId(userId);
      if ((await PortfolioEntry.countDocuments({ userId: uid })) >= PORTFOLIO_LIMITS.entries) {
        throw new AppError(`A portfolio holds at most ${PORTFOLIO_LIMITS.entries} entries.`, 409, 'PORTFOLIO_FULL');
      }
      const fields = await this.validated(userId, input);
      if (fields.sourceProjectId && (await PortfolioEntry.exists({ userId: uid, sourceProjectId: fields.sourceProjectId }))) {
        throw new AppError('That practice project is already in your portfolio.', 409, 'PROJECT_ALREADY_IN_PORTFOLIO');
      }
      const entry = await PortfolioEntry.create({ userId: uid, ...fields });
      await LearningActivityService.recordActivity(userId, EventType.PORTFOLIO_ENTRY_ADDED, { title: entry.title }, entry._id.toString());
      const recalculation = await this.syncAndRecalculate(userId, entry._id.toString());
      return { entry: this.present(entry, await UserSkill.find({ userId: uid }).populate('skillId')), recalculation };
    });
  }

  public update(userId: string, entryId: string, input: PortfolioInput) {
    return withUserLock(`portfolio:${userId}`, async () => {
      const entry = await this.owned(userId, entryId);
      const fields = await this.validated(userId, input, entry);
      entry.set(fields);
      await entry.save();
      const recalculation = await this.syncAndRecalculate(userId, entryId);
      return { entry: this.present(entry, await UserSkill.find({ userId: entry.userId }).populate('skillId')), recalculation };
    });
  }

  public remove(userId: string, entryId: string) {
    return withUserLock(`portfolio:${userId}`, async () => {
      const entry = await this.owned(userId, entryId);
      await entry.deleteOne();
      return { recalculation: await this.syncAndRecalculate(userId, entryId) };
    });
  }

  private async owned(userId: string, entryId: string): Promise<IPortfolioEntry> {
    const notFound = new AppError('Portfolio entry not found.', 404, 'PORTFOLIO_ENTRY_NOT_FOUND');
    if (!mongoose.Types.ObjectId.isValid(entryId)) throw notFound;
    const entry = await PortfolioEntry.findOne({ _id: new mongoose.Types.ObjectId(entryId), userId: new mongoose.Types.ObjectId(userId) });
    if (!entry) throw notFound;
    return entry;
  }

  private async validated(userId: string, input: PortfolioInput, existing?: IPortfolioEntry) {
    const title = clean(input.title);
    if (title.length < 3) throw new AppError('Invalid request: title must be at least 3 characters.', 400, 'VALIDATION_ERROR');

    const skills: string[] = [];
    for (const raw of input.skills) {
      const name = await recogniseSkill(raw);
      if (!name) throw new AppError(`"${raw.trim().slice(0, 80)}" is not a skill SkillBridge recognises.`, 400, 'UNKNOWN_SKILL');
      if (!skills.includes(name)) skills.push(name);
    }

    const completedOn = new Date(`${input.completedOn}T00:00:00.000Z`);
    const today = new Date();
    if (Number.isNaN(completedOn.getTime()) || completedOn.getTime() > today.getTime() || completedOn.getUTCFullYear() < 1990) {
      throw new AppError('Invalid request: completedOn must be a date that is not in the future.', 400, 'VALIDATION_ERROR');
    }

    // Only a practice project the user has marked complete can be recorded as finished work
    let sourceProjectId: mongoose.Types.ObjectId | null = existing?.sourceProjectId ?? null;
    if (input.sourceProjectId !== undefined && (input.sourceProjectId || null) !== (existing?.sourceProjectId?.toString() ?? null)) {
      sourceProjectId = null;
      if (input.sourceProjectId) {
        const project = await LearningProject.findOne({ _id: new mongoose.Types.ObjectId(input.sourceProjectId), userId: new mongoose.Types.ObjectId(userId) });
        if (!project) throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
        if (project.status !== 'completed') {
          throw new AppError('Mark the practice project complete before adding it to your portfolio.', 409, 'PROJECT_NOT_COMPLETED');
        }
        sourceProjectId = project._id;
      }
    }

    return {
      title: title.slice(0, 120),
      description: clean(input.description || '').slice(0, 1000),
      skills,
      completedOn,
      evidenceUrl: normaliseUrl(input.evidenceUrl),
      sourceProjectId,
      visibility: input.visibility ?? existing?.visibility ?? 'private'
    };
  }

  private present(entry: IPortfolioEntry, userSkills: IUserSkill[]) {
    const id = entry._id.toString();
    return {
      id,
      title: entry.title,
      description: entry.description,
      completedOn: entry.completedOn.toISOString().slice(0, 10),
      evidenceUrl: entry.evidenceUrl ?? null,
      sourceProjectId: entry.sourceProjectId ? entry.sourceProjectId.toString() : null,
      visibility: entry.visibility,
      // How far the entry itself has been checked: not at all
      verification: 'self_reported' as const,
      countsTowardsScores: Boolean(entry.evidenceUrl),
      skills: entry.skills.map(skill => {
        const userSkill = userSkills.find(us => (us.skillId as unknown as { canonicalName?: string } | null)?.canonicalName?.toLowerCase() === skill.toLowerCase());
        const evidence = userSkill?.evidences.find(e => e.sourceType === PORTFOLIO_SOURCE && e.sourceId === id);
        return {
          skill,
          points: evidence?.points ?? 0,
          // Set when the same project is already credited elsewhere, so this entry adds no points for the skill
          countedElsewhere: evidence?.duplicateOf ?? null,
          // Why it was recognised as the same project: the same title, or a link to the same repository or page
          countedElsewhereBecause: evidence?.duplicateReason ?? null,
          // Verified separately, by a skill check; never because of this entry
          verifiedBySkillCheck: Boolean(userSkill?.evidences.some(e => e.sourceType === 'assessment'))
        };
      })
    };
  }

  // ------------------------------------------------------------------------------------------
  // Evidence
  // ------------------------------------------------------------------------------------------

  /**
   * Rebuilds portfolio evidence on the user's skills from their entries. Idempotent. Returns
   * true when any skill's evidence score changed.
   */
  public async syncEvidence(userId: string): Promise<boolean> {
    const uid = new mongoose.Types.ObjectId(userId);
    const entries = await PortfolioEntry.find({ userId: uid }).sort({ completedOn: 1, _id: 1 });
    const docs = await UserSkill.find({ userId: uid }).populate('skillId');
    const bySkill = new Map<string, IUserSkill>();
    const before = new Map<string, number>();
    const basePoints = new Map<string, number>();

    for (const doc of docs) {
      const name = (doc.skillId as unknown as { canonicalName?: string } | null)?.canonicalName;
      if (!name) continue;
      const previous = doc.evidences.filter(e => e.sourceType === PORTFOLIO_SOURCE);
      const others = doc.evidences.filter(e => e.sourceType !== PORTFOLIO_SOURCE);
      // Records made before points were stored per evidence fall back to the stored score
      const base = others.every(e => typeof e.points === 'number')
        ? others.reduce((sum, e) => sum + (e.points || 0), 0)
        : Math.max(0, doc.evidenceScore - previous.reduce((sum, e) => sum + (e.points || 0), 0));
      doc.evidences = others;
      bySkill.set(name.toLowerCase(), doc);
      before.set(doc._id.toString(), doc.evidenceScore);
      basePoints.set(doc._id.toString(), base);
    }

    // Links written in the active resume's projects, by project title: a portfolio entry that links
    // to the same repository or page is that resume project, whatever it is called
    const resumeProjectLinks = await this.resumeProjectLinks(uid);

    const now = new Date();
    const creditedLinks = new Map<string, Set<string>>();
    for (const entry of entries) {
      for (const skillName of entry.skills) {
        let doc = bySkill.get(skillName.toLowerCase());
        if (!doc) {
          // An entry without a link earns nothing, so it does not put a new skill on the profile
          if (!entry.evidenceUrl) continue;
          const skill = await findOrCreateCanonicalSkill(skillName);
          doc = new UserSkill({ userId: uid, skillId: skill._id, category: skill.category || 'General', evidenceScore: 0, evidences: [] });
          bySkill.set(skillName.toLowerCase(), doc);
          basePoints.set(doc._id.toString(), 0);
        }
        const projectsSoFar = doc.evidences.filter(e => e.sourceType === 'resume_projects' || (e.sourceType === PORTFOLIO_SOURCE && (e.points || 0) > 0)).length;
        // The same project already credited for this skill, from the resume or an earlier entry,
        // is not credited again. The entry is kept and dated; it simply earns nothing here.
        const titleKey = projectKey(entry.title);
        const urlKey = linkIdentity(entry.evidenceUrl);
        const docLinks = creditedLinks.get(doc._id.toString()) ?? new Set<string>();
        creditedLinks.set(doc._id.toString(), docLinks);
        const resumeEvidence = doc.evidences.filter(e => e.sourceType === 'resume_projects');
        const resumeKeys = creditedProjectKeys(resumeEvidence);
        const resumeLinks = new Set(resumeEvidence.flatMap(e => resumeProjectLinks.get(projectKey(projectTitleOf(e)) ?? '') ?? []));
        const portfolioKeys = creditedProjectKeys(doc.evidences.filter(e => e.sourceType === PORTFOLIO_SOURCE));
        let duplicateOf: IEvidence['duplicateOf'];
        let duplicateReason: IEvidence['duplicateReason'];
        if (entry.evidenceUrl) {
          if (titleKey && resumeKeys.has(titleKey)) [duplicateOf, duplicateReason] = ['resume_project', 'same_title'];
          else if (urlKey && resumeLinks.has(urlKey)) [duplicateOf, duplicateReason] = ['resume_project', 'same_link'];
          else if (titleKey && portfolioKeys.has(titleKey)) [duplicateOf, duplicateReason] = ['portfolio_entry', 'same_title'];
          else if (urlKey && docLinks.has(urlKey)) [duplicateOf, duplicateReason] = ['portfolio_entry', 'same_link'];
        }
        const why = duplicateReason === 'same_link' ? ' (it links to the same repository or page)' : '';
        const evidence: IEvidence = {
          sourceType: PORTFOLIO_SOURCE,
          sourceId: entry._id.toString(),
          description:
            `Portfolio project: ${entry.title}${entry.evidenceUrl ? '' : ' (no link given)'}. Your own record, not checked` +
            (duplicateOf === 'resume_project' ? `. The same project is on your resume${why}, so it is counted once` : duplicateOf === 'portfolio_entry' ? `. The same project is in another portfolio entry${why}, so it is counted once` : ''),
          weight: 0.6,
          points: entry.evidenceUrl && !duplicateOf ? stepped(EVIDENCE_POINTS.projects, projectsSoFar) : 0,
          observedAt: entry.completedOn,
          verification: 'self_attested',
          recordedAt: now,
          label: entry.title,
          ...(duplicateOf ? { duplicateOf, duplicateReason } : {})
        };
        // A duplicate stands for a project that is credited, so its link identifies that project too
        if (urlKey && ((evidence.points || 0) > 0 || duplicateOf)) docLinks.add(urlKey);
        doc.evidences.push(evidence);
      }
    }

    let changed = false;
    for (const doc of bySkill.values()) {
      const id = doc._id.toString();
      if (doc.evidences.length === 0) {
        if (!doc.isNew) await doc.deleteOne();
        changed = true;
        continue;
      }
      const portfolioPoints = doc.evidences.filter(e => e.sourceType === PORTFOLIO_SOURCE).reduce((sum, e) => sum + (e.points || 0), 0);
      doc.evidenceScore = Math.min(100, (basePoints.get(id) ?? 0) + portfolioPoints);
      doc.proficiency = EvidenceCalculator.estimateProficiency(doc.evidenceScore);
      if (doc.isNew || before.get(id) !== doc.evidenceScore) changed = true;
      await doc.save();
    }
    return changed;
  }

  /** Title key -> identities of the links written in that project of the active resume. */
  private async resumeProjectLinks(uid: mongoose.Types.ObjectId): Promise<Map<string, string[]>> {
    const active = await Resume.findOne({ userId: uid, isActive: true }).select('_id').lean();
    const parsed = active ? await ParsedResume.findOne({ resumeId: active._id }).select('projects').lean() : null;
    const links = new Map<string, string[]>();
    for (const project of parsed?.projects ?? []) {
      const key = projectKey(project.name?.value);
      if (!key) continue;
      const text = [project.name?.value, project.description?.value, ...(project.contributions ?? []).map(c => c?.value), ...(project.technologies ?? []).map(t => t?.value)].join(' ');
      const found = linkIdentitiesIn(text);
      if (found.length) links.set(key, [...(links.get(key) ?? []), ...found]);
    }
    return links;
  }

  private async syncAndRecalculate(userId: string, ref: string) {
    await this.syncEvidence(userId);
    const run = await RecalculationService.run(userId, 'skill_evidence_changed', ref);
    return { status: run.status, modulesRecomputed: run.modulesRecomputed };
  }

  // ------------------------------------------------------------------------------------------
  // Sharing
  // ------------------------------------------------------------------------------------------

  public async shareSettings(userId: string) {
    const share = await PortfolioShare.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    const sharedEntries = await PortfolioEntry.countDocuments({ userId: new mongoose.Types.ObjectId(userId), visibility: 'shared' });
    return { enabled: Boolean(share?.enabled), token: share?.enabled ? share.token : null, showName: Boolean(share?.showName), sharedEntries };
  }

  /** Switching sharing on always issues a new link, so an old link stops working for good. */
  public async updateShare(userId: string, change: { enabled?: boolean; showName?: boolean }) {
    const uid = new mongoose.Types.ObjectId(userId);
    const share = (await PortfolioShare.findOne({ userId: uid })) || new PortfolioShare({ userId: uid });
    if (change.showName !== undefined) share.showName = change.showName;
    if (change.enabled !== undefined && change.enabled !== share.enabled) {
      share.enabled = change.enabled;
      share.token = change.enabled ? crypto.randomBytes(24).toString('hex') : null;
    }
    await share.save();
    return this.shareSettings(userId);
  }

  /** What anyone with the link can see: shared entries only, and the owner's name only if allowed. */
  public async publicView(token: string) {
    const notFound = new AppError('This portfolio link is not active.', 404, 'PORTFOLIO_NOT_FOUND');
    if (!/^[0-9a-f]{48}$/.test(token)) throw notFound;
    const share = await PortfolioShare.findOne({ token, enabled: true });
    if (!share) throw notFound;
    const [entries, userSkills, user] = await Promise.all([
      PortfolioEntry.find({ userId: share.userId, visibility: 'shared' }).sort({ completedOn: -1, _id: -1 }),
      UserSkill.find({ userId: share.userId }).populate('skillId'),
      share.showName ? User.findById(share.userId).select('fullName name') : null
    ]);
    return {
      ownerName: user ? user.fullName || user.name || null : null,
      entries: entries.map(entry => {
        const shown = this.present(entry, userSkills);
        return {
          title: shown.title,
          description: shown.description,
          completedOn: shown.completedOn,
          evidenceUrl: shown.evidenceUrl,
          skills: shown.skills.map(s => ({ skill: s.skill, verifiedBySkillCheck: s.verifiedBySkillCheck }))
        };
      }),
      note: 'Entries are the owner\'s own record. SkillBridge has not checked the linked work. "Verified by skill check" means the owner passed a short SkillBridge quiz on that skill; it is not a professional certification.'
    };
  }
}

export default new PortfolioService();
