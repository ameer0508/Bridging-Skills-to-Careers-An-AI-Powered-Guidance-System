import mongoose from 'mongoose';
import {
  LearningRoadmap,
  ILearningRoadmap,
  RoadmapItemStatus
} from '../models/LearningRoadmap.js';
import { RoadmapHistory } from '../models/RoadmapHistory.js';
import { EventType } from '../models/ProgressEvent.js';
import { AppError } from '../middlewares/errorHandler.js';
import { RoadmapEngine } from './RoadmapEngine.js';
import LearningActivityService from './LearningActivityService.js';

export class ProgressService {
  /**
   * Updates the status of a specific roadmap item, recalculates phase and overall progress,
   * and returns the saved roadmap.
   */
  public async updateItemStatus(
    userId: string,
    careerId: string,
    itemId: string,
    newStatus: RoadmapItemStatus
  ): Promise<ILearningRoadmap> {
    if (!mongoose.Types.ObjectId.isValid(careerId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      throw new AppError('Invalid career or roadmap item id.', 400, 'INVALID_ID');
    }

    const roadmap = await LearningRoadmap.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      careerId: new mongoose.Types.ObjectId(careerId)
    });

    if (!roadmap) {
      throw new AppError('Roadmap not found for this user and career.', 404, 'ROADMAP_NOT_FOUND');
    }

    const phase = roadmap.phases.find(p => p.items.some(i => i._id?.toString() === itemId));
    const item = phase?.items.find(i => i._id?.toString() === itemId);

    if (!phase || !item) {
      throw new AppError('Roadmap item not found.', 404, 'ROADMAP_ITEM_NOT_FOUND');
    }

    const previousStatus = item.status;
    item.status = newStatus;

    if (newStatus === 'completed') {
      item.completedAt = new Date();
      if (!item.startedAt) item.startedAt = item.completedAt;
    } else {
      item.completedAt = undefined;
      if (newStatus === 'in_progress' && !item.startedAt) item.startedAt = new Date();
      if (newStatus === 'not_started') item.startedAt = undefined;
    }

    phase.status = RoadmapEngine.derivePhaseStatus(phase.items);

    const wasCompleted = roadmap.status === 'completed';
    roadmap.progressPercentage = RoadmapEngine.calculateProgress(roadmap.phases);
    roadmap.status = roadmap.progressPercentage === 100 ? 'completed' : 'active';

    await roadmap.save();

    if (previousStatus !== newStatus) {
      await RoadmapHistory.create({
        userId: roadmap.userId,
        careerId: roadmap.careerId,
        roadmapId: roadmap._id,
        action: `item_${newStatus}`,
        itemId: item._id,
        details: `Item "${item.title}" status changed from ${previousStatus} to ${newStatus}`
      });

      if (newStatus === 'completed') {
        await LearningActivityService.recordActivity(
          userId,
          EventType.ROADMAP_ITEM_COMPLETED,
          { title: item.title, targetSkill: item.targetSkill, progress: roadmap.progressPercentage },
          roadmap._id.toString()
        );
        if (phase.status === 'completed' && phase._id) {
          await LearningActivityService.notify(userId, 'milestone', `phase:${roadmap._id.toString()}:${phase._id.toString()}`, `Roadmap phase finished: ${phase.title}`, `Every item in this phase is done. Your roadmap is ${roadmap.progressPercentage}% complete.`, '/roadmap');
        }
      }
    }

    if (roadmap.status === 'completed' && !wasCompleted) {
      await RoadmapHistory.create({
        userId: roadmap.userId,
        careerId: roadmap.careerId,
        roadmapId: roadmap._id,
        action: 'completed',
        details: 'Roadmap fully completed.'
      });
      await LearningActivityService.notify(userId, 'milestone', `roadmap:${roadmap._id.toString()}`, 'Roadmap complete', 'Every item on this roadmap is done or skipped.', '/roadmap');
    }

    return roadmap;
  }
}

export default new ProgressService();
