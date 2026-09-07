import mongoose from 'mongoose';
import { LearningRoadmap } from '../models/LearningRoadmap.js';
import { RoadmapHistory } from '../models/RoadmapHistory.js';
import RoadmapEngine from './RoadmapEngine.js';
import ProgressService from './ProgressService.js';
import { RoadmapItemStatus } from '../models/LearningRoadmap.js';

class RoadmapService {
  /**
   * Retrieves the current roadmap for a user for a specific career.
   */
  public async getRoadmap(userId: string, careerId: string) {
    const roadmap = await LearningRoadmap.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      careerId: new mongoose.Types.ObjectId(careerId)
    });

    return roadmap;
  }

  /**
   * Triggers the engine to regenerate the roadmap.
   */
  public async generateRoadmap(userId: string, careerId: string) {
    await RoadmapEngine.generateRoadmap(userId, careerId);
    return await this.getRoadmap(userId, careerId);
  }

  /**
   * Updates an item's status.
   */
  public async updateItemStatus(
    userId: string,
    careerId: string,
    itemId: string,
    status: RoadmapItemStatus
  ) {
    return await ProgressService.updateItemStatus(userId, careerId, itemId, status);
  }

  /**
   * Fetches history for a specific roadmap.
   */
  public async getRoadmapHistory(userId: string, roadmapId: string) {
    return await RoadmapHistory.find({
      userId: new mongoose.Types.ObjectId(userId),
      roadmapId: new mongoose.Types.ObjectId(roadmapId)
    }).sort({ createdAt: -1 });
  }
}

export default new RoadmapService();
