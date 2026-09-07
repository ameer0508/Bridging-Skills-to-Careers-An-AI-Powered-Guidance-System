import mongoose from 'mongoose';
import { LearningRoadmap, RoadmapItemStatus } from '../models/LearningRoadmap.js';
import { RoadmapHistory } from '../models/RoadmapHistory.js';


export class ProgressService {
  /**
   * Updates the status of a specific roadmap item and recalculates overall roadmap progress.
   */
  public async updateItemStatus(
    userId: string,
    careerId: string,
    itemId: string,
    newStatus: RoadmapItemStatus
  ): Promise<void> {
    const roadmap = await LearningRoadmap.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      careerId: new mongoose.Types.ObjectId(careerId)
    });

    if (!roadmap) {
      throw new Error('Roadmap not found for this user and career.');
    }

    let itemFound = false;
    let totalItems = 0;
    let completedItems = 0;

    for (const phase of roadmap.phases) {
      for (const item of phase.items) {
        totalItems++;

        if (item._id && item._id.toString() === itemId) {
          itemFound = true;

          if (item.status !== newStatus) {
            // Record History
            await RoadmapHistory.create({
              userId: new mongoose.Types.ObjectId(userId),
              careerId: new mongoose.Types.ObjectId(careerId),
              roadmapId: roadmap._id,
              action: `item_${newStatus}`,
              itemId: item._id,
              details: `Item "${item.title}" status changed to ${newStatus}`
            });
          }

          item.status = newStatus;

          if (newStatus === 'completed') {
            item.completedAt = new Date();
          } else if (newStatus === 'in_progress' && !item.startedAt) {
            item.startedAt = new Date();
          }
        }

        if (item.status === 'completed' || item.status === 'skipped') {
          completedItems++;
        }
      }
    }

    if (!itemFound) {
      throw new Error('Roadmap item not found.');
    }

    roadmap.progressPercentage =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    if (roadmap.progressPercentage === 100 && roadmap.status !== 'completed') {
      roadmap.status = 'completed';
      await RoadmapHistory.create({
        userId: new mongoose.Types.ObjectId(userId),
        careerId: new mongoose.Types.ObjectId(careerId),
        roadmapId: roadmap._id,
        action: 'completed',
        details: 'Roadmap fully completed.'
      });
    }

    await roadmap.save();
  }
}

export default new ProgressService();
