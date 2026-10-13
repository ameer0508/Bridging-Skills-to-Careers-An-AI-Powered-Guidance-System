import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import Resume from '../models/Resume.js';
import Conversation from '../models/Conversation.js';
import ConversationMessage from '../models/ConversationMessage.js';
import VoiceRecording from '../models/VoiceRecording.js';
import StorageService from './StorageService.js';
import VoiceRecordingService from './interview/VoiceRecordingService.js';
import EmployerPostingService from './employer/EmployerPostingService.js';
import { AppError } from '../middlewares/errorHandler.js';
import logger from '../config/logger.js';
import { revokeAccount } from '../utils/revokedAccounts.js';

/**
 * Deletes an account and everything stored about it (X12).
 *
 * - Every collection whose documents carry the user's `userId` is found from the registered
 *   models, so a collection added later is included without editing this list.
 * - Files: resume uploads (current and replaced) and interview recordings are removed from disk.
 *   A recording whose file cannot be removed keeps its record, marked for deletion, so the retention
 *   job keeps retrying; it holds only the account id and the file's location.
 * - Chat messages are removed through their conversations.
 * - The account id is revoked in this process at once, so an access token issued before deletion
 *   cannot create new data while it is still valid.
 * - Job postings the user published as an employer leave every market figure (their market
 *   records and the reports about them are removed), as the contribution terms promise.
 * Kept on purpose: market import batches record which administrator imported a source (an id
 * only, needed for provenance).
 */

export interface AccountDeletionResult {
  documentsDeleted: Record<string, number>;
  filesDeleted: { resumes: number; recordings: number };
  recordingsPendingDeletion: number;
}

class AccountDeletionService {
  async deleteAccount(userId: string, password: string): Promise<AccountDeletionResult> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw new AppError('Account not found.', 404, 'NOT_FOUND');
    if (!user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError('The password is not correct.', 403, 'PASSWORD_INCORRECT');
    }
    revokeAccount(userId);
    const uid = new mongoose.Types.ObjectId(userId);

    // Files first, while their records still say where they are
    let resumeFiles = 0;
    for (const resume of await Resume.find({ userId: uid }).select('storagePath').lean()) {
      try {
        await StorageService.deleteFile(resume.storagePath);
        resumeFiles++;
      } catch (error) {
        logger.warn(`Account deletion: resume file could not be removed (${error instanceof Error ? error.message : String(error)})`);
      }
    }
    const recordings = await VoiceRecordingService.removeAllForUser(userId);
    const pendingRecordings = await VoiceRecording.countDocuments({ userId: uid });

    await EmployerPostingService.removeAllForUser(userId);

    const conversations = (await Conversation.find({ userId: uid }).select('_id').lean()).map(c => c._id);
    const documentsDeleted: Record<string, number> = {};
    if (conversations.length) {
      documentsDeleted.ConversationMessage = (await ConversationMessage.deleteMany({ conversationId: { $in: conversations } })).deletedCount;
    }
    for (const name of mongoose.modelNames()) {
      const model = mongoose.model(name);
      if (name === 'User' || name === 'VoiceRecording' || !model.schema.path('userId')) continue;
      const { deletedCount } = await model.deleteMany({ userId: uid });
      if (deletedCount) documentsDeleted[name] = deletedCount;
    }
    await user.deleteOne();
    documentsDeleted.User = 1;
    logger.info(`Account deleted: ${JSON.stringify({ documentsDeleted, resumeFiles, recordings: recordings.removed, pendingRecordings })}`);
    return {
      documentsDeleted,
      filesDeleted: { resumes: resumeFiles, recordings: recordings.removed },
      recordingsPendingDeletion: pendingRecordings,
    };
  }
}

export default new AccountDeletionService();
