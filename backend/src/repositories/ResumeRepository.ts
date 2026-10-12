import mongoose from 'mongoose';
import { Resume, IResume } from '../models/Resume.js';

export class ResumeRepository {
  /**
   * Finds the currently active resume for a user.
   */
  async findActiveByUserId(userId: string): Promise<IResume | null> {
    return Resume.findOne({ userId: new mongoose.Types.ObjectId(userId), isActive: true });
  }

  /**
   * Creates a new resume document.
   */
  async create(resumeData: Partial<IResume>): Promise<IResume> {
    const resume = new Resume(resumeData);
    return resume.save();
  }

  /**
   * Updates an existing resume document.
   */
  async update(id: string, updateData: Partial<IResume>): Promise<IResume | null> {
    // A field passed as `undefined` is removed (e.g. clearing a previous parsingError)
    const set: Record<string, unknown> = {};
    const unset: Record<string, ''> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value === undefined) unset[key] = '';
      else set[key] = value;
    }
    const update: Record<string, unknown> = {};
    if (Object.keys(set).length) update.$set = set;
    if (Object.keys(unset).length) update.$unset = unset;
    return Resume.findByIdAndUpdate(id, update, { new: true });
  }

  /**
   * Marks all resumes for a user as inactive (isActive: false) and updates their uploadStatus.
   * This is used when replacing the current resume or during complete removal.
   */
  async markAllInactive(
    userId: string,
    newStatus: 'replaced' | 'deleted' = 'replaced'
  ): Promise<void> {
    await Resume.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), isActive: true },
      { $set: { isActive: false, uploadStatus: newStatus } }
    );
  }
}

export default ResumeRepository;
