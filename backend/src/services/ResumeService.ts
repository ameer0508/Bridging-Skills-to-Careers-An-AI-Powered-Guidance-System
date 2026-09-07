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
    confidence: number;
  }>;
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

    // Remove physical file from disk
    await StorageService.deleteFile(activeResume.storagePath);
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
      status: hasInfo ? 'Verified' : 'Missing',
      qualitativeConfidence: hasInfo ? 'Very High' : 'Low',
      extractionMethod: 'Regex & Header NER',
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
      qualitativeConfidence: exp.length > 0 ? 'High' : 'Low',
      extractionMethod: 'Transformer Sequence Classifier',
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
      qualitativeConfidence: proj.length > 0 ? 'Very High' : 'Low',
      extractionMethod: 'Layout & Heading Detector',
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
      qualitativeConfidence: edu.length > 0 ? 'Very High' : 'Low',
      extractionMethod: 'Fuzzy Section Heading Match',
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
      qualitativeConfidence: skills.length > 0 ? 'Very High' : 'Low',
      extractionMethod: 'Taxonomy Embedding Equivalence',
      description: skills.length > 0
        ? `${skills.length} skill entities mapped to domain taxonomy.`
        : 'No skills section found.'
    });

    const certs = parsedData.certifications || [];
    sections.push({
      sectionName: 'Certifications',
      iconName: 'award',
      score: certs.length > 0 ? 90 : 0,
      status: certs.length > 0 ? `${certs.length} Certs` : 'None Listed',
      qualitativeConfidence: certs.length > 0 ? 'High' : 'Low',
      extractionMethod: 'Issuer NER Pattern Match',
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
      qualitativeConfidence: ach.length > 0 ? 'Medium' : 'Low',
      extractionMethod: 'Semantic Bullet Classifier',
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
      qualitativeConfidence: lang.length > 0 ? 'Very High' : 'Low',
      extractionMethod: 'Natural Language Detector',
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
      await this.resumeRepository.update(resumeId, { parsingStatus: 'processing' });

      const AIClientService = (await import('./AIClientService.js')).default;
      const ParsedResume = (await import('../models/ParsedResume.js')).default;
      const ExtractedSkill = (await import('../models/ExtractedSkill.js')).default;

      // 2. Call AI Service
      const parsedData = (await AIClientService.extractResume(fileBuffer, fileName)) as IParsedResumeData;

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
              confidence: skill.confidence,
            });
          }
        }
        await ExtractedSkill.insertMany(Array.from(uniqueSkillsMap.values()));
      }

      // 6. Build the User Skill Intelligence layer from extracted data
      const UserSkillService = (await import('./UserSkillService.js')).default;
      UserSkillService.buildUserSkillsFromResume(userId, resumeId).catch((e: Error) => {
        logger.error(`Async skill processing failed for ${userId}: ${e.message}`);
      });

      const ProgressEventService = (await import('./ProgressEventService.js')).default;
      ProgressEventService.logEvent(userId, 'resume_parsed', { resumeId: resumeId }).catch((e: Error) => {
        logger.error(`Async progress log failed: ${e.message}`);
      });
      await this.resumeRepository.update(resumeId, { parsingStatus: 'completed' });
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
