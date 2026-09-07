import logger from '../config/logger.js';
import ResumeService from './ResumeService.js';

interface ProcessResumeTask {
  userId: string;
  resumeId: string;
  fileBuffer: Buffer;
  fileName: string;
}

class QueueService {
  /**
   * Processes the resume asynchronously in the background.
   */
  public enqueueResumeProcessing(task: ProcessResumeTask): void {
    logger.info(`Enqueuing resume processing for user: ${task.userId}, resumeId: ${task.resumeId}`);

    // Fire and forget - simple background worker simulation
    Promise.resolve().then(async () => {
      try {
        const resumeService = new ResumeService();
        await resumeService.processResumeExtraction(
          task.userId,
          task.resumeId,
          task.fileBuffer,
          task.fileName
        );
      } catch (error: unknown) {
        const err = error as Error;
        logger.error(`Background processing failed for resume ${task.resumeId}`, err);
      }
    });
  }
}

export default new QueueService();
