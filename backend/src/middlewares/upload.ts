import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import env from '../config/env.js';

// Pre-configured Multer middleware with memory storage
const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.UPLOAD_MAX_SIZE
  }
}).single('resume');

/**
 * Middleware that handles the multipart upload and performs security/schema validations.
 * Specifically checks for allowed extensions, MIME types, empty files, and size boundaries.
 */
export const validateResumeUpload = (req: Request, _res: Response, next: NextFunction): void => {
  uploadSingle(req, _res, (err: unknown) => {
    if (err) {
      const multerError = err as { code?: string };
      if (multerError.code === 'LIMIT_FILE_SIZE') {
        const error = new Error(
          `File size exceeds the limit of ${env.UPLOAD_MAX_SIZE / (1024 * 1024)}MB.`
        ) as AppError;
        error.statusCode = 400;
        error.code = 'FILE_TOO_LARGE';
        return next(error);
      }
      return next(err);
    }

    const file = req.file;
    if (!file) {
      const error = new Error('No resume file was uploaded.') as AppError;
      error.statusCode = 400;
      error.code = 'MISSING_FILE';
      return next(error);
    }

    // Guard against empty files
    if (file.size === 0) {
      const error = new Error('Uploaded file is empty and invalid.') as AppError;
      error.statusCode = 400;
      error.code = 'EMPTY_FILE';
      return next(error);
    }

    // Verify file extension
    const originalName = file.originalname;
    const dotIndex = originalName.lastIndexOf('.');
    if (dotIndex === -1) {
      const error = new Error('File name lacks a valid extension.') as AppError;
      error.statusCode = 400;
      error.code = 'INVALID_FILE_EXTENSION';
      return next(error);
    }

    const ext = originalName.substring(dotIndex + 1).toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      const error = new Error(
        'Only PDF (.pdf) and Microsoft Word (.docx) files are supported.'
      ) as AppError;
      error.statusCode = 400;
      error.code = 'INVALID_FILE_EXTENSION';
      return next(error);
    }

    // Verify MIME type integrity
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      const error = new Error('Upload blocked: invalid MIME type signature.') as AppError;
      error.statusCode = 400;
      error.code = 'INVALID_MIME_TYPE';
      return next(error);
    }

    next();
  });
};
