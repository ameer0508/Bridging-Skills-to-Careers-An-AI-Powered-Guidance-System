import { Request, Response, NextFunction } from 'express';
import ResumeService from '../services/ResumeService.js';
import { AppError } from '../middlewares/errorHandler.js';

export class ResumeController {
  private resumeService: ResumeService;

  constructor() {
    this.resumeService = new ResumeService();
  }

  /**
   * Handles uploading a fresh resume document.
   */
  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        const error = new Error('Authentication is required.') as AppError;
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const file = req.file;
      if (!file) {
        const error = new Error('No resume file was attached.') as AppError;
        error.statusCode = 400;
        error.code = 'MISSING_FILE';
        return next(error);
      }

      const resume = await this.resumeService.uploadResume(userId, file);

      res.status(201).json({
        success: true,
        data: {
          resume: {
            id: resume.id,
            originalFileName: resume.originalFileName,
            fileExtension: resume.fileExtension,
            mimeType: resume.mimeType,
            fileSize: resume.fileSize,
            storageProvider: resume.storageProvider,
            uploadStatus: resume.uploadStatus,
            parsingStatus: resume.parsingStatus,
            parsingError: resume.parsingError,
            uploadedAt: resume.uploadedAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Handles replacing the active resume document.
   */
  replace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        const error = new Error('Authentication is required.') as AppError;
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const file = req.file;
      if (!file) {
        const error = new Error('No replacement file was attached.') as AppError;
        error.statusCode = 400;
        error.code = 'MISSING_FILE';
        return next(error);
      }

      const resume = await this.resumeService.replaceResume(userId, file);

      res.status(200).json({
        success: true,
        data: {
          resume: {
            id: resume.id,
            originalFileName: resume.originalFileName,
            fileExtension: resume.fileExtension,
            mimeType: resume.mimeType,
            fileSize: resume.fileSize,
            storageProvider: resume.storageProvider,
            uploadStatus: resume.uploadStatus,
            parsingStatus: resume.parsingStatus,
            parsingError: resume.parsingError,
            uploadedAt: resume.uploadedAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Fetches metadata for the user's active resume.
   */
  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        const error = new Error('Authentication is required.') as AppError;
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const resume = await this.resumeService.getActiveResume(userId);

      if (!resume) {
        res.status(200).json({
          success: true,
          data: {
            resume: null
          }
        });
        return;
      }

      const parsedResume = await this.resumeService.getParsedResume(resume.id);

      res.status(200).json({
        success: true,
        data: {
          resume: {
            id: resume.id,
            originalFileName: resume.originalFileName,
            fileExtension: resume.fileExtension,
            mimeType: resume.mimeType,
            fileSize: resume.fileSize,
            storageProvider: resume.storageProvider,
            uploadStatus: resume.uploadStatus,
            parsingStatus: resume.parsingStatus,
            parsingError: resume.parsingError,
            uploadedAt: resume.uploadedAt,
            atsScore: parsedResume?.atsScore || 0,
            sectionHealth: parsedResume?.sectionHealth || [],
            personalInfo: parsedResume?.personalInfo || {},
            education: parsedResume?.education || [],
            experience: parsedResume?.experience || [],
            projects: parsedResume?.projects || [],
            certifications: parsedResume?.certifications || [],
            achievements: parsedResume?.achievements || [],
            languages: parsedResume?.languages || [],
            interests: parsedResume?.interests || [],
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Returns a file stream for secure downloading.
   */
  download = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        const error = new Error('Authentication is required.') as AppError;
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { stream, originalFileName, mimeType } =
        await this.resumeService.downloadResume(userId);

      // Safe filename injection in content-disposition header
      const encodedName = encodeURIComponent(originalFileName);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`);
      res.setHeader('Content-Type', mimeType);

      stream.on('error', err => {
        next(err);
      });

      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Removes the active resume.
   */
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        const error = new Error('Authentication is required.') as AppError;
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      await this.resumeService.deleteResume(userId);

      res.status(200).json({
        success: true,
        message: 'Resume deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  };
}

export default ResumeController;
