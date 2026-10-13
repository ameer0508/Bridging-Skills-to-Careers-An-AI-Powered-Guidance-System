import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import env from '../config/env.js';
import MultilingualService, { SUPPORTED_RESUME_LANGUAGES } from '../services/languages/MultilingualService.js';
import { UI_LANGUAGES } from '../models/LanguageSettings.js';
import { AppError } from '../middlewares/errorHandler.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: env.UPLOAD_MAX_SIZE, files: 1 } }).single('file');
const ALLOWED = new Set(['.pdf', '.docx', '.txt']);

/** Multipart parsing for one resume file; content checks happen in the AI service. */
export const languageFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  upload(req, res, (err: unknown) => {
    if (!err) {
      // Multer reads multipart file names as Latin-1; names in Devanagari or with accents arrive
      // as mojibake. Re-read the bytes as UTF-8 when they are valid UTF-8.
      if (req.file) {
        const bytes = Buffer.from(req.file.originalname, 'latin1');
        const utf8 = bytes.toString('utf8');
        if (!utf8.includes('�') && Buffer.from(utf8, 'utf8').equals(bytes)) req.file.originalname = utf8;
      }
      return next();
    }
    if ((err as { code?: string }).code === 'LIMIT_FILE_SIZE') return next(new AppError(`File is larger than ${env.UPLOAD_MAX_SIZE / (1024 * 1024)} MB.`, 400, 'FILE_TOO_LARGE'));
    return next(new AppError('The file could not be read.', 400, 'INVALID_UPLOAD'));
  });
};

const textSchema = z.object({ text: z.string().trim().min(20, 'needs at least 20 characters').max(100_000) }).strict();
const settingsSchema = z.object({ uiLanguage: z.enum(UI_LANGUAGES) }).strict();

function parse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, input: unknown): T {
  const parsed = schema.safeParse(input ?? {});
  if (!parsed.success) {
    throw new AppError(`Invalid request: ${parsed.error.issues.map(i => `${i.path.join('.') || 'body'} ${i.message}`).join('; ')}`, 400, 'VALIDATION_ERROR');
  }
  return parsed.data;
}

const userIdOf = (req: Request): string => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  return userId;
};

type Handler = (req: Request, res: Response) => Promise<void>;
const handle = (fn: Handler) => (req: Request, res: Response, next: NextFunction): void => {
  fn(req, res).catch(next);
};

/** E5/X1: supported languages, interface language setting and multilingual resume analyses. */
class LanguageController {
  supported = handle(async (req, res) => {
    userIdOf(req);
    res.status(200).json({ success: true, data: { resumeLanguages: SUPPORTED_RESUME_LANGUAGES, uiLanguages: UI_LANGUAGES } });
  });

  getSettings = handle(async (req, res) => {
    res.status(200).json({ success: true, data: await MultilingualService.getSettings(userIdOf(req)) });
  });

  setSettings = handle(async (req, res) => {
    const userId = userIdOf(req);
    res.status(200).json({ success: true, data: await MultilingualService.setSettings(userId, parse(settingsSchema, req.body).uiLanguage) });
  });

  analyzeFile = handle(async (req, res) => {
    const userId = userIdOf(req);
    const file = req.file;
    if (!file || file.size === 0) throw new AppError('Choose a PDF, DOCX or TXT file to analyse.', 400, 'MISSING_FILE');
    if (!ALLOWED.has(path.extname(file.originalname).toLowerCase())) throw new AppError('Only PDF, DOCX and TXT files can be analysed.', 400, 'INVALID_FILE_EXTENSION');
    res.status(201).json({ success: true, data: await MultilingualService.analyzeFile(userId, file) });
  });

  analyzeText = handle(async (req, res) => {
    const userId = userIdOf(req);
    res.status(201).json({ success: true, data: await MultilingualService.analyzeText(userId, parse(textSchema, req.body).text) });
  });

  list = handle(async (req, res) => {
    res.status(200).json({ success: true, data: { analyses: await MultilingualService.list(userIdOf(req)) } });
  });

  get = handle(async (req, res) => {
    res.status(200).json({ success: true, data: await MultilingualService.get(userIdOf(req), req.params.id) });
  });

  remove = handle(async (req, res) => {
    await MultilingualService.remove(userIdOf(req), req.params.id);
    res.status(200).json({ success: true, data: { deleted: 1 } });
  });
}

export default new LanguageController();
