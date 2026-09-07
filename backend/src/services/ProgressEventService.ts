import mongoose from 'mongoose';
import { ProgressEvent, EventType } from '../models/ProgressEvent.js';
import logger from '../config/logger.js';

export class ProgressEventService {
  /**
   * Logs a progress event asynchronously.
   */
  public async logEvent(
    userId: string,
    eventType: EventType,
    details: Record<string, unknown> = {},
    entityId?: string
  ): Promise<void> {
    try {
      await ProgressEvent.create({
        userId: new mongoose.Types.ObjectId(userId),
        eventType,
        details,
        entityId: entityId ? new mongoose.Types.ObjectId(entityId) : undefined
      });
      
      // We do not wait for snapshotting here to keep it non-blocking.
      // A full production system might use a message queue here.
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Failed to log progress event ${eventType} for user ${userId}: ${err.message}`);
    }
  }

  /**
   * Retrieves events for a specific user.
   */
  public async getEvents(userId: string, limit: number = 50) {
    return await ProgressEvent.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}

export default new ProgressEventService();
