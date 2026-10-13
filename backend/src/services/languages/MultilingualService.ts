import path from 'path';
import FormData from 'form-data';
import mongoose from 'mongoose';
import { aiHttp } from '../aiHttp.js';
import ResumeLanguageAnalysis, { IResumeLanguageAnalysis } from '../../models/ResumeLanguageAnalysis.js';
import LanguageSettings, { UiLanguage } from '../../models/LanguageSettings.js';
import { AppError } from '../../middlewares/errorHandler.js';
import logger from '../../config/logger.js';
import { displayFileName } from '../../utils/uploadFileName.js';

/**
 * Multilingual resume analysis and language settings (E5, X1). The analysis runs in the AI
 * service (ai/app/multilingual), locally, with no translation, OCR or paid inference. Results are
 * stored for the user who asked, with the original lines for provenance, and can be deleted.
 */

export const SUPPORTED_RESUME_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi', note: 'Devanagari script. Hindi PDFs often have a damaged text layer; DOCX or plain text read best.' },
  { code: 'es', name: 'Spanish' },
];

const MAX_LINES_STORED = 2000;

type AnalysisPayload = {
  method: string;
  status: IResumeLanguageAnalysis['status'];
  language: Record<string, unknown>;
  layout: Record<string, unknown>;
  textQuality: 'ok' | 'degraded';
  textRecovery?: { glyphsRecovered: number; glyphsUnrecovered: number };
  textSource?: 'text_layer' | 'ocr' | 'mixed';
  ocr?: Record<string, unknown> | null;
  warnings: string[];
  sections: Array<Record<string, unknown>>;
  fields: Record<string, unknown>;
  originalLines: string[];
  fileType: string;
};

const displayName = displayFileName;

/** Only the known OCR metadata fields are stored (codes and numbers, no text). */
function ocrSummary(ocr: Record<string, unknown> | null | undefined) {
  if (!ocr || typeof ocr !== 'object') return null;
  const keep = ['used', 'reason', 'engine', 'languages', 'pagesRequested', 'pagesRead', 'pagesSkipped', 'failures', 'meanConfidence', 'seconds', 'rejected'];
  return Object.fromEntries(keep.filter(k => k in ocr).map(k => [k, ocr[k]]));
}

function view(doc: IResumeLanguageAnalysis, withLines = true) {
  return {
    id: String(doc._id),
    fileName: doc.fileName,
    fileType: doc.fileType,
    method: doc.method,
    status: doc.status,
    language: doc.language,
    layout: doc.layout,
    textQuality: doc.textQuality,
    textRecovery: doc.textRecovery ?? null,
    textSource: doc.textSource ?? 'text_layer',
    ocr: doc.ocr ?? null,
    warnings: doc.warnings,
    sections: doc.sections,
    fields: doc.fields,
    lineCount: doc.originalLines.length,
    ...(withLines ? { originalLines: doc.originalLines } : {}),
    createdAt: doc.createdAt.toISOString(),
  };
}

class MultilingualService {
  private async call(pathName: string, body: FormData | { text: string }, headers: Record<string, string> = {}): Promise<AnalysisPayload> {
    try {
      const response = await aiHttp.post(pathName, body, { headers, timeout: 60_000, maxBodyLength: Infinity });
      if (!response.data?.success) throw new Error('unexpected response');
      return response.data.data as AnalysisPayload;
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { detail?: string } }; message?: string };
      const status = err.response?.status;
      // The AI service's own validation answers (bad type, not really a PDF, too large) are the user's to fix
      if (status && [400, 413, 415, 422].includes(status)) {
        throw new AppError(err.response?.data?.detail || 'The file could not be read.', status === 413 ? 413 : 400, 'INVALID_DOCUMENT');
      }
      logger.warn(`Multilingual analysis unavailable: ${err.message ?? 'unknown error'}`);
      throw new AppError('Resume language analysis is unavailable right now. Please try again later.', 503, 'AI_UNAVAILABLE');
    }
  }

  private async store(userId: string, fileName: string, data: AnalysisPayload) {
    const doc = await ResumeLanguageAnalysis.create({
      userId,
      fileName: displayName(fileName),
      fileType: data.fileType,
      method: data.method,
      status: data.status,
      language: data.language,
      layout: data.layout,
      textQuality: data.textQuality,
      ...(data.textRecovery ? { textRecovery: { glyphsRecovered: Number(data.textRecovery.glyphsRecovered) || 0, glyphsUnrecovered: Number(data.textRecovery.glyphsUnrecovered) || 0 } } : {}),
      textSource: ['text_layer', 'ocr', 'mixed'].includes(data.textSource as string) ? data.textSource : 'text_layer',
      ocr: ocrSummary(data.ocr),
      warnings: data.warnings,
      sections: data.sections,
      fields: data.fields,
      originalLines: (data.originalLines || []).slice(0, MAX_LINES_STORED),
    });
    return view(doc);
  }

  async analyzeFile(userId: string, file: { buffer: Buffer; originalname: string }) {
    const form = new FormData();
    // Only the extension is forwarded; the user's file name stays in the backend
    form.append('file', file.buffer, { filename: `resume${path.extname(file.originalname).toLowerCase()}` });
    const data = await this.call('/api/v1/multilingual/analyze', form, form.getHeaders());
    return this.store(userId, file.originalname, data);
  }

  async analyzeText(userId: string, text: string) {
    const data = await this.call('/api/v1/multilingual/analyze-text', { text });
    return this.store(userId, 'Pasted text', data);
  }

  async list(userId: string) {
    const docs = await ResumeLanguageAnalysis.find({ userId }).sort({ createdAt: -1 }).limit(50);
    return docs.map(d => view(d, false));
  }

  private async owned(userId: string, id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError('Analysis not found.', 404, 'ANALYSIS_NOT_FOUND');
    const doc = await ResumeLanguageAnalysis.findOne({ _id: id, userId });
    if (!doc) throw new AppError('Analysis not found.', 404, 'ANALYSIS_NOT_FOUND');
    return doc;
  }

  async get(userId: string, id: string) {
    return view(await this.owned(userId, id));
  }

  async remove(userId: string, id: string) {
    const doc = await this.owned(userId, id);
    await doc.deleteOne();
  }

  async getSettings(userId: string) {
    const settings = await LanguageSettings.findOne({ userId });
    return { uiLanguage: (settings?.uiLanguage ?? 'en') as UiLanguage, updatedAt: settings ? settings.updatedAt.toISOString() : null };
  }

  async setSettings(userId: string, uiLanguage: UiLanguage) {
    const settings = await LanguageSettings.findOneAndUpdate({ userId }, { uiLanguage }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return { uiLanguage: settings.uiLanguage, updatedAt: settings.updatedAt.toISOString() };
  }
}

export default new MultilingualService();
