/* global Express, NodeJS */
import mongoose from 'mongoose';
import ResumeRepository from '../repositories/ResumeRepository.js';
import StorageService from './StorageService.js';
import { IResume } from '../models/Resume.js';
import { AppError } from '../middlewares/errorHandler.js';
import logger from '../config/logger.js';

export interface IParsedResumeData {
  personalInfo?: Record<string, unknown>;
  education?: Array<Record<string, unknown>>;
  experience?: Array<Record<string, unknown>>;
  projects?: Array<Record<string, unknown>>;
  certifications?: Array<Record<string, unknown>>;
  achievements?: Array<Record<string, unknown>>;
  languages?: Array<Record<string, unknown>>;
  interests?: Array<Record<string, unknown>>;
  skills?: Array<{
    name: string;
    category: string;
    confidence: number | null;
  }>;
}

/** A job still marked pending/processing after this long is treated as stuck. */
export const RESUME_STUCK_AFTER_MS = 3 * 60 * 1000;

const INTERRUPTED_MESSAGE =
  'Processing was interrupted before it finished. Choose "Reprocess" to run it again; your file is still stored.';

export function isResumeStuck(resume: Pick<IResume, 'parsingStatus' | 'parsingStartedAt' | 'updatedAt'>): boolean {
  if (resume.parsingStatus !== 'pending' && resume.parsingStatus !== 'processing') return false;
  const since = resume.parsingStartedAt ?? resume.updatedAt;
  return !!since && Date.now() - new Date(since).getTime() > RESUME_STUCK_AFTER_MS;
}

function appError(message: string, statusCode: number, code: string): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export class ResumeService {
  private resumeRepository: ResumeRepository;

  constructor() {
    this.resumeRepository = new ResumeRepository();
  }

  /**
   * Uploads a new resume. Fails if the user already has an active resume.
   */
  async uploadResume(userId: string, file: Express.Multer.File): Promise<IResume> {
    const existing = await this.resumeRepository.findActiveByUserId(userId);
    if (existing) {
      const error = new Error(
        'An active resume already exists. Please replace the current document instead.'
      ) as AppError;
      error.statusCode = 400;
      error.code = 'ACTIVE_RESUME_EXISTS';
      throw error;
    }

    // Write file securely to directory structured by user subfolder
    const { storedFileName, storagePath } = await StorageService.saveFile(file, userId);

    const dotIndex = file.originalname.lastIndexOf('.');
    const ext = file.originalname.substring(dotIndex).toLowerCase();

    const newResume = await this.resumeRepository.create({
      userId: new mongoose.Types.ObjectId(userId),
      originalFileName: file.originalname,
      storedFileName,
      fileExtension: ext,
      mimeType: file.mimetype,
      fileSize: file.size,
      storageProvider: 'local',
      storagePath,
      isActive: true,
      uploadStatus: 'active',
      parsingStatus: 'pending',
    });

    // Enqueue for async processing
    const QueueService = (await import('./QueueService.js')).default;
    QueueService.enqueueResumeProcessing({
      userId,
      resumeId: newResume.id,
      fileBuffer: file.buffer,
      fileName: file.originalname,
    });

    const ProgressEventService = (await import('./ProgressEventService.js')).default;
    ProgressEventService.logEvent(userId, 'resume_uploaded', { fileName: file.originalname }, newResume.id).catch(e => logger.error(e));

    return newResume;
  }

  /**
   * Replaces the currently active resume. Marks the old one inactive and deletes its physical file.
   */
  async replaceResume(userId: string, file: Express.Multer.File): Promise<IResume> {
    const oldResume = await this.resumeRepository.findActiveByUserId(userId);

    // Save the new file first (ensures successful write before database transaction edits)
    const { storedFileName, storagePath } = await StorageService.saveFile(file, userId);

    // Mark previous documents inactive in the database
    await this.resumeRepository.markAllInactive(userId, 'replaced');

    // Clean up old physical file from disk storage
    if (oldResume) {
      try {
        await StorageService.deleteFile(oldResume.storagePath);
      } catch (err) {
        logger.error(`Failed to unlink old physical resume: ${oldResume.storagePath}`, err);
      }
    }

    const dotIndex = file.originalname.lastIndexOf('.');
    const ext = file.originalname.substring(dotIndex).toLowerCase();

    const newResume = await this.resumeRepository.create({
      userId: new mongoose.Types.ObjectId(userId),
      originalFileName: file.originalname,
      storedFileName,
      fileExtension: ext,
      mimeType: file.mimetype,
      fileSize: file.size,
      storageProvider: 'local',
      storagePath,
      isActive: true,
      uploadStatus: 'active',
      parsingStatus: 'pending',
    });

    // Enqueue for async processing
    const QueueService = (await import('./QueueService.js')).default;
    QueueService.enqueueResumeProcessing({
      userId,
      resumeId: newResume.id,
      fileBuffer: file.buffer,
      fileName: file.originalname,
    });

    const ProgressEventService = (await import('./ProgressEventService.js')).default;
    ProgressEventService.logEvent(userId, 'resume_replaced', { fileName: file.originalname }, newResume.id).catch(e => logger.error(e));

    return newResume;
  }

  /**
   * Deletes the active resume document, removing the physical file and updating the DB status to deleted.
   */
  async deleteResume(userId: string): Promise<void> {
    const activeResume = await this.resumeRepository.findActiveByUserId(userId);
    if (!activeResume) {
      const error = new Error('No active resume found to delete.') as AppError;
      error.statusCode = 404;
      error.code = 'RESUME_NOT_FOUND';
      throw error;
    }

    // Mark database record as inactive / deleted
    await this.resumeRepository.markAllInactive(userId, 'deleted');

    // Remove physical file from disk. A file that is already gone must not block the deletion.
    try {
      await StorageService.deleteFile(activeResume.storagePath);
    } catch (err) {
      logger.error(`Failed to unlink deleted resume file: ${activeResume.storagePath}`, err);
    }

    // The parsed content and everything calculated from it no longer describe the user.
    const ParsedResume = (await import('../models/ParsedResume.js')).default;
    const ExtractedSkill = (await import('../models/ExtractedSkill.js')).default;
    await ParsedResume.deleteMany({ resumeId: activeResume._id });
    await ExtractedSkill.deleteMany({ resumeId: activeResume._id });
    const UserSkillService = (await import('./UserSkillService.js')).default;
    await UserSkillService.clearDerivedIntelligence(userId);
    // Recorded so the history shows why the figures dropped; there is nothing left to recompute
    const { default: RecalculationService } = await import('./RecalculationService.js');
    await RecalculationService.run(userId, 'resume_deleted', activeResume.id);

    const ProgressEventService = (await import('./ProgressEventService.js')).default;
    ProgressEventService.logEvent(userId, 'resume_deleted', { fileName: activeResume.originalFileName }).catch(e => logger.error(e));
  }

  /**
   * Runs extraction again on the stored file of the active resume. Allowed once the previous
   * run has finished (completed or failed) or has been stuck for RESUME_STUCK_AFTER_MS.
   */
  async reprocessResume(userId: string): Promise<IResume> {
    const activeResume = await this.resumeRepository.findActiveByUserId(userId);
    if (!activeResume) throw appError('No active resume found to reprocess.', 404, 'RESUME_NOT_FOUND');

    const inFlight = activeResume.parsingStatus === 'pending' || activeResume.parsingStatus === 'processing';
    if (inFlight && !isResumeStuck(activeResume)) {
      throw appError('This resume is still being processed. Please wait for it to finish.', 409, 'RESUME_PROCESSING');
    }

    let fileBuffer: Buffer;
    try {
      fileBuffer = await streamToBuffer(await StorageService.getFileStream(activeResume.storagePath));
    } catch {
      throw appError(
        'The stored resume file could not be read. Please upload the resume again.',
        410,
        'RESUME_FILE_MISSING'
      );
    }

    const updated = await this.resumeRepository.update(activeResume.id, {
      parsingStatus: 'pending',
      parsingError: undefined,
      parsingStartedAt: new Date(),
    });

    const QueueService = (await import('./QueueService.js')).default;
    QueueService.enqueueResumeProcessing({
      userId,
      resumeId: activeResume.id,
      fileBuffer,
      fileName: activeResume.originalFileName,
    });

    const ProgressEventService = (await import('./ProgressEventService.js')).default;
    ProgressEventService.logEvent(userId, 'resume_reprocessed', { fileName: activeResume.originalFileName }, activeResume.id).catch(e => logger.error(e));

    return updated ?? activeResume;
  }

  /**
   * Processing runs in this process's memory, so a restart loses any job that was in flight.
   * Called once at startup: such resumes are marked failed with a recoverable message instead
   * of staying "processing" forever. Nothing is deleted.
   */
  async recoverInterruptedJobs(): Promise<number> {
    const { default: Resume } = await import('../models/Resume.js');
    const result = await Resume.updateMany(
      { isActive: true, parsingStatus: { $in: ['pending', 'processing'] } },
      { $set: { parsingStatus: 'failed', parsingError: INTERRUPTED_MESSAGE } }
    );
    if (result.modifiedCount > 0) {
      logger.warn(`Marked ${result.modifiedCount} interrupted resume job(s) as failed so they can be reprocessed.`);
    }
    return result.modifiedCount;
  }

  /**
   * Retrieves the active resume metadata.
   */
  async getActiveResume(userId: string): Promise<IResume | null> {
    return this.resumeRepository.findActiveByUserId(userId);
  }

  /**
   * Retrieves parsed resume details associated with a resumeId.
   */
  async getParsedResume(resumeId: string) {
    const ParsedResume = (await import('../models/ParsedResume.js')).default;
    return ParsedResume.findOne({ resumeId });
  }

  /**
   * Prepares the file read stream for secure authenticated download downloads.
   */
  async downloadResume(
    userId: string
  ): Promise<{ stream: NodeJS.ReadableStream; originalFileName: string; mimeType: string }> {
    const activeResume = await this.resumeRepository.findActiveByUserId(userId);
    if (!activeResume) {
      const error = new Error('No active resume found to download.') as AppError;
      error.statusCode = 404;
      error.code = 'RESUME_NOT_FOUND';
      throw error;
    }

    const stream = await StorageService.getFileStream(activeResume.storagePath);
    return {
      stream,
      originalFileName: activeResume.originalFileName,
      mimeType: activeResume.mimeType,
    };
  }

  private calculateAtsScore(parsedData: IParsedResumeData): number {
    let score = 0;
    const info = parsedData.personalInfo || {};
    if (info.email) score += 10;
    if (info.phone) score += 5;
    if (info.fullName) score += 5;
    if (info.linkedin || info.github) score += 5;

    const exp = parsedData.experience || [];
    if (exp.length > 0) score += Math.min(25, exp.length * 10 + 5);

    const proj = parsedData.projects || [];
    if (proj.length > 0) score += Math.min(20, proj.length * 10);

    const skills = parsedData.skills || [];
    if (skills.length > 0) score += Math.min(20, skills.length * 2);

    const edu = parsedData.education || [];
    if (edu.length > 0) score += 5;

    const certs = parsedData.certifications || [];
    if (certs.length > 0) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  private calculateSectionHealth(parsedData: IParsedResumeData) {
    const sections = [];
    const info = parsedData.personalInfo || {};
    const emailVal = typeof info.email === 'object' && info.email && 'value' in info.email ? (info.email as { value: string }).value : undefined;
    const phoneVal = typeof info.phone === 'object' && info.phone && 'value' in info.phone ? (info.phone as { value: string }).value : undefined;
    const nameVal = typeof info.fullName === 'object' && info.fullName && 'value' in info.fullName ? (info.fullName as { value: string }).value : undefined;
    const hasInfo = !!(emailVal || phoneVal || nameVal);

    sections.push({
      sectionName: 'Contact Information',
      iconName: 'user',
      score: hasInfo ? 95 : 0,
      status: hasInfo ? 'Found' : 'Missing',
      qualitativeConfidence: hasInfo ? 'Detected' : 'Not found',
      extractionMethod: 'Rule-based parser',
      description: hasInfo
        ? `Email: ${emailVal || 'N/A'}, Phone: ${phoneVal || 'N/A'}`
        : 'No contact details detected in resume.'
    });

    const exp = parsedData.experience || [];
    sections.push({
      sectionName: 'Experience & Roles',
      iconName: 'briefcase',
      score: exp.length > 0 ? Math.min(95, 60 + exp.length * 15) : 0,
      status: exp.length > 0 ? `${exp.length} Roles Found` : 'Empty',
      qualitativeConfidence: exp.length > 0 ? 'Detected' : 'Not found',
      extractionMethod: 'Rule-based parser',
      description: exp.length > 0
        ? `${exp.length} work experience entry/entries detected.`
        : 'No work experience section found.'
    });

    const proj = parsedData.projects || [];
    sections.push({
      sectionName: 'Projects & Capstones',
      iconName: 'folder',
      score: proj.length > 0 ? Math.min(95, 60 + proj.length * 10) : 0,
      status: proj.length > 0 ? `${proj.length} Projects` : 'Empty',
      qualitativeConfidence: proj.length > 0 ? 'Detected' : 'Not found',
      extractionMethod: 'Rule-based parser',
      description: proj.length > 0
        ? `${proj.length} project entries detected.`
        : 'No project section found.'
    });

    const edu = parsedData.education || [];
    const degVal = edu[0]?.degree && typeof edu[0].degree === 'object' && 'value' in edu[0].degree ? (edu[0].degree as { value: string }).value : undefined;
    const instVal = edu[0]?.institution && typeof edu[0].institution === 'object' && 'value' in edu[0].institution ? (edu[0].institution as { value: string }).value : undefined;

    sections.push({
      sectionName: 'Education & Credentials',
      iconName: 'graduation',
      score: edu.length > 0 ? 95 : 0,
      status: edu.length > 0 ? 'Extracted' : 'Missing',
      qualitativeConfidence: edu.length > 0 ? 'Detected' : 'Not found',
      extractionMethod: 'Rule-based parser',
      description: edu.length > 0
        ? `${degVal || 'Education'} at ${instVal || 'Institution'}`
        : 'No education section found.'
    });

    const skills = parsedData.skills || [];
    sections.push({
      sectionName: 'Technical Skills',
      iconName: 'target',
      score: skills.length > 0 ? Math.min(98, 50 + skills.length * 3) : 0,
      status: skills.length > 0 ? `${skills.length} Skills Mapped` : 'Empty',
      qualitativeConfidence: skills.length > 0 ? 'Detected' : 'Not found',
      extractionMethod: 'Rule-based parser',
      description: skills.length > 0
        ? `${skills.length} skills recognised from the skill lexicon.`
        : 'No skills section found.'
    });

    const certs = parsedData.certifications || [];
    sections.push({
      sectionName: 'Certifications',
      iconName: 'award',
      score: certs.length > 0 ? 90 : 0,
      status: certs.length > 0 ? `${certs.length} Certs` : 'None Listed',
      qualitativeConfidence: certs.length > 0 ? 'Detected' : 'Not found',
      extractionMethod: 'Rule-based parser',
      description: certs.length > 0
        ? `${certs.length} certification entry/entries detected.`
        : 'No certifications listed in resume.'
    });

    const ach = parsedData.achievements || [];
    sections.push({
      sectionName: 'Achievements & Honors',
      iconName: 'trophy',
      score: ach.length > 0 ? 85 : 0,
      status: ach.length > 0 ? `${ach.length} Achievements` : 'None Listed',
      qualitativeConfidence: ach.length > 0 ? 'Detected' : 'Not found',
      extractionMethod: 'Rule-based parser',
      description: ach.length > 0
        ? `${ach.length} achievement entry/entries detected.`
        : 'No explicit achievements section listed.'
    });

    const lang = parsedData.languages || [];
    sections.push({
      sectionName: 'Languages Spoken',
      iconName: 'languages',
      score: lang.length > 0 ? 94 : 0,
      status: lang.length > 0 ? `${lang.length} Languages` : 'None Listed',
      qualitativeConfidence: lang.length > 0 ? 'Detected' : 'Not found',
      extractionMethod: 'Rule-based parser',
      description: lang.length > 0
        ? `${lang.map(l => l.value).join(', ')} detected.`
        : 'No explicit language skills listed.'
    });

    return sections;
  }

  /**
   * Processes the resume asynchronously: calls AI service and stores structured results.
   */
  async processResumeExtraction(
    userId: string,
    resumeId: string,
    fileBuffer: Buffer,
    fileName: string
  ): Promise<void> {
    try {
      // 1. Update status to processing
      await this.resumeRepository.update(resumeId, { parsingStatus: 'processing', parsingStartedAt: new Date() });

      const AIClientService = (await import('./AIClientService.js')).default;
      const ParsedResume = (await import('../models/ParsedResume.js')).default;
      const ExtractedSkill = (await import('../models/ExtractedSkill.js')).default;

      // 2. Call AI Service
      const parsedData = (await AIClientService.extractResume(fileBuffer, fileName)) as IParsedResumeData;

      // The user may have replaced or deleted this resume while it was being read. Its result
      // must not overwrite the skill profile that now belongs to a newer resume.
      const stillActive = await this.resumeRepository.findActiveByUserId(userId);
      if (!stillActive || stillActive.id !== resumeId) {
        logger.info(`Resume ${resumeId} is no longer the active resume; discarding its extraction result.`);
        return;
      }

      // 3. Clear any existing parsed data for this resume
      await ParsedResume.deleteMany({ resumeId });
      await ExtractedSkill.deleteMany({ resumeId });

      const atsScore = this.calculateAtsScore(parsedData);
      const sectionHealth = this.calculateSectionHealth(parsedData);

      // 4. Save ParsedResume
      const newParsedResume = new ParsedResume({
        userId: new mongoose.Types.ObjectId(userId),
        resumeId: new mongoose.Types.ObjectId(resumeId),
        personalInfo: parsedData.personalInfo || {},
        education: parsedData.education || [],
        experience: parsedData.experience || [],
        projects: parsedData.projects || [],
        certifications: parsedData.certifications || [],
        achievements: parsedData.achievements || [],
        languages: parsedData.languages || [],
        interests: parsedData.interests || [],
        atsScore,
        sectionHealth,
      });
      await newParsedResume.save();

      // 5. Save ExtractedSkills
      const skills = parsedData.skills || [];
      if (skills.length > 0) {
        const uniqueSkillsMap = new Map();
        for (const skill of skills) {
          const lowerName = skill.name.toLowerCase().trim();
          if (!uniqueSkillsMap.has(lowerName)) {
            uniqueSkillsMap.set(lowerName, {
              userId: new mongoose.Types.ObjectId(userId),
              resumeId: new mongoose.Types.ObjectId(resumeId),
              name: skill.name.trim(),
              category: skill.category.trim(),
              confidence: typeof skill.confidence === 'number' ? skill.confidence : null,
            });
          }
        }
        await ExtractedSkill.insertMany(Array.from(uniqueSkillsMap.values()));
      }

      // 6. Build the User Skill Intelligence layer from extracted data
      const UserSkillService = (await import('./UserSkillService.js')).default;
      // Awaited so `parsingStatus: completed` means skills, matches, readiness and
      // recommendations are all ready to read (this already runs in the background).
      const skillChanges = await UserSkillService.buildUserSkillsFromResume(userId, resumeId);

      const ProgressEventService = (await import('./ProgressEventService.js')).default;
      ProgressEventService.logEvent(userId, 'resume_parsed', { resumeId: resumeId }).catch((e: Error) => {
        logger.error(`Async progress log failed: ${e.message}`);
      });
      await this.resumeRepository.update(resumeId, {
        parsingStatus: 'completed',
        parsingError: undefined,
        ...(skillChanges ? { skillChanges } : {}),
      });
      logger.info(`Successfully parsed and saved resume ${resumeId} for user ${userId}`);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error processing resume ${resumeId}: ${err.message || String(err)}`);
      await this.resumeRepository.update(resumeId, {
        parsingStatus: 'failed',
        parsingError: err.message || 'Unknown error occurred during parsing',
      });
    }
  }
}

export default ResumeService;
