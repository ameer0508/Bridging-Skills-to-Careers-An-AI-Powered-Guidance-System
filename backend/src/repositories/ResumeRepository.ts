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
    return Resume.findByIdAndUpdate(id, { $set: updateData }, { new: true });
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
