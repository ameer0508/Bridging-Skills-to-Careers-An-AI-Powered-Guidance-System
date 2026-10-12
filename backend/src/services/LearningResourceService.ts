import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { LearningResource, type ILearningResource } from '../models/LearningResource.js';
import CareerScenarioService from './CareerScenarioService.js';
import { CareerMatch } from '../models/CareerMatch.js';
import { AppError } from '../middlewares/errorHandler.js';

/**
 * Free learning resources for the skills a user still has to show for a career.
 *
 * The catalogue is a curated list of official documentation and first-party tutorials that were
 * free to read when they were listed. Every one is third-party content: SkillBridge does not
 * host it, has not re-checked the link, and cannot promise it stays free. No ratings, durations
 * or completion figures are attached, because none are known.
 *
 * "Saved" and "worked through" are the user's own bookmarks. They are not course completions
 * and change no score.
 */
export type ResourceStatus = 'saved' | 'done';

interface IResourceProgress extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  resourceId: Types.ObjectId;
  status: ResourceStatus;
  updatedAt: Date;
}

const ResourceProgressSchema = new Schema<IResourceProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resourceId: { type: Schema.Types.ObjectId, ref: 'LearningResource', required: true },
    status: { type: String, enum: ['saved', 'done'], required: true }
  },
  { timestamps: true }
);
ResourceProgressSchema.index({ userId: 1, resourceId: 1 }, { unique: true });

export const ResourceProgress: Model<IResourceProgress> =
  (mongoose.models.ResourceProgress as Model<IResourceProgress>) || mongoose.model<IResourceProgress>('ResourceProgress', ResourceProgressSchema);

const key = (name: string): string => name.trim().toLowerCase();
const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

export const RESOURCE_NOTE =
  'These are links to third-party sites: official documentation and first-party tutorials that were free to read when they were added to the catalogue. SkillBridge does not host them, has not re-checked the links and cannot promise they stay free; check the site\'s own terms. Marking a resource as worked through is your own note. It is not a course completion and changes no score.';

class LearningResourceService {
  private present(resource: ILearningResource, status: ResourceStatus | null) {
    return {
      id: resource._id.toString(),
      title: resource.title,
      provider: resource.provider,
      host: hostOf(resource.url),
      url: resource.url,
      type: resource.type,
      difficulty: resource.difficulty,
      thirdParty: true as const,
      // What is known about cost: how it was listed, not a guarantee
      cost: 'Free to read when listed; not re-checked',
      myStatus: status
    };
  }

  private async statuses(userId: string): Promise<Map<string, ResourceStatus>> {
    const rows = await ResourceProgress.find({ userId: new mongoose.Types.ObjectId(userId) });
    return new Map(rows.map(r => [r.resourceId.toString(), r.status]));
  }

  /** Resources grouped by the gaps of one career, most valuable gap first. */
  public async forCareer(userId: string, requestedCareerId?: string) {
    const catalogue = await LearningResource.find({ url: /^https:\/\// }).sort({ title: 1 });
    const catalogueInfo = { resources: catalogue.length, skillsCovered: new Set(catalogue.flatMap(r => r.targetSkills.map(key))).size };

    let careerId = requestedCareerId;
    if (!careerId) {
      const top = await CareerMatch.findOne({ userId: new mongoose.Types.ObjectId(userId) }).sort({ matchScore: -1, confidence: -1, _id: 1 });
      careerId = top?.careerId.toString();
    }
    if (!careerId) {
      return { hasProfile: false, career: null, groups: [], withoutResources: [] as string[], coverage: { gapSkills: 0, withResources: 0 }, catalogue: catalogueInfo, note: RESOURCE_NOTE };
    }

    const counterfactuals = await CareerScenarioService.counterfactuals(userId, careerId);
    const career = { id: careerId, title: counterfactuals.careerTitle };
    if (!counterfactuals.hasProfile) {
      return { hasProfile: false, career, groups: [], withoutResources: [] as string[], coverage: { gapSkills: 0, withResources: 0 }, catalogue: catalogueInfo, note: RESOURCE_NOTE };
    }

    const mine = await this.statuses(userId);
    const groups = [];
    const withoutResources: string[] = [];
    for (const gap of counterfactuals.singleChanges) {
      const resources = catalogue.filter(r => r.targetSkills.some(s => key(s) === key(gap.skillName)));
      if (resources.length === 0) {
        withoutResources.push(gap.skillName);
        continue;
      }
      groups.push({
        skill: gap.skillName,
        importance: gap.importance,
        currentStatus: gap.currentStatus,
        resources: resources.map(r => this.present(r, mine.get(r._id.toString()) ?? null))
      });
    }
    return {
      hasProfile: true,
      career,
      groups,
      // Said plainly, so a missing resource is not mistaken for "nothing to learn"
      withoutResources,
      coverage: { gapSkills: counterfactuals.singleChanges.length, withResources: groups.length },
      catalogue: catalogueInfo,
      note: RESOURCE_NOTE
    };
  }

  /** The resources the user saved or marked as worked through. */
  public async mine(userId: string) {
    const rows = await ResourceProgress.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ updatedAt: -1 });
    const resources = await LearningResource.find({ _id: { $in: rows.map(r => r.resourceId) } });
    return rows.flatMap(row => {
      const resource = resources.find(r => r._id.toString() === row.resourceId.toString());
      return resource ? [{ ...this.present(resource, row.status), skills: resource.targetSkills, updatedAt: row.updatedAt }] : [];
    });
  }

  /** Sets or clears (`null`) the user's own mark on a resource. */
  public async setStatus(userId: string, resourceId: string, status: ResourceStatus | null) {
    const notFound = new AppError('Resource not found.', 404, 'RESOURCE_NOT_FOUND');
    if (!mongoose.Types.ObjectId.isValid(resourceId)) throw notFound;
    const resource = await LearningResource.findById(resourceId);
    if (!resource) throw notFound;
    const filter = { userId: new mongoose.Types.ObjectId(userId), resourceId: resource._id };
    if (status === null) await ResourceProgress.deleteOne(filter);
    else await ResourceProgress.updateOne(filter, { $set: { status } }, { upsert: true });
    return this.present(resource, status);
  }
}

export default new LearningResourceService();
