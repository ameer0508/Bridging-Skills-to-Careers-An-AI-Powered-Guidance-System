import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import { MAX_RECORDING_BYTES } from '../services/interview/VoiceRecordingService.js';

const single = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_RECORDING_BYTES, files: 1, fields: 4 } }).single('audio');

/** Multipart parsing for one answer recording (D1); content checks happen in the service. */
export const recordingUpload = (req: Request, res: Response, next: NextFunction): void => {
  single(req, res, (err: unknown) => {
    if (!err) return next();
    const code = (err as { code?: string }).code;
    if (code === 'LIMIT_FILE_SIZE') return next(new AppError('The recording is too large (5 MB at most).', 400, 'FILE_TOO_LARGE'));
    return next(new AppError('The recording could not be read.', 400, 'INVALID_UPLOAD'));
  });
};
