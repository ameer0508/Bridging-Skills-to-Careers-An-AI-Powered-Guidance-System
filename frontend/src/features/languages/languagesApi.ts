import apiClient from '../../lib/axios';

/** Mirrors backend/src/services/languages/MultilingualService.ts (E5, X1). */
export type UiLanguage = 'en' | 'hi' | 'es';

export interface FieldSource {
  line: number;
  text: string;
  /** Set when the line was read by OCR: the value is a guess with this confidence (0-100). */
  origin?: 'ocr';
  ocrConfidence?: number;
}

export interface Analysis {
  id: string;
  fileName: string;
  fileType: string;
  method: string;
  status: 'extracted' | 'unsupported' | 'scanned_unreadable';
  language: { language: string | null; name?: string; supported: boolean; status: string; message?: string; mixed?: boolean; scripts?: Record<string, number> };
  layout: { type: string; pages: number; scannedPages: number };
  textQuality: 'ok' | 'degraded';
  textSource?: 'text_layer' | 'ocr' | 'mixed';
  ocr?: { used?: boolean; reason?: string; engine?: string | null; languages?: string[]; pagesRead?: number; pagesSkipped?: number; meanConfidence?: number | null; failures?: string[] } | null;
  warnings: string[];
  sections: Array<{ key: string; heading: string; headingLanguage: string | null; startLine: number; endLine: number; matchedLoosely?: boolean }>;
  fields: {
    email: { value: string; source: FieldSource } | null;
    phone: { value: string; source: FieldSource } | null;
    experience: Array<{ start: string; end: string; context: string | null; inferred?: boolean; source: FieldSource }>;
    education: Array<{ year: number; source: FieldSource }>;
    skills: Array<{ name: string; matched: string; source: FieldSource }>;
  };
  lineCount: number;
  originalLines?: string[];
  createdAt: string;
}

const data = <T,>(p: Promise<{ data: { data: T } }>) => p.then(r => r.data.data);

export const fetchSettings = () => data<{ uiLanguage: UiLanguage; updatedAt: string | null }>(apiClient.get('/languages/settings'));
export const saveSettings = (uiLanguage: UiLanguage) => data<{ uiLanguage: UiLanguage }>(apiClient.put('/languages/settings', { uiLanguage }));
export const fetchAnalyses = () => data<{ analyses: Analysis[] }>(apiClient.get('/languages/resume-analyses')).then(d => d.analyses);
export const fetchAnalysis = (id: string) => data<Analysis>(apiClient.get(`/languages/resume-analyses/${encodeURIComponent(id)}`));
export const deleteAnalysis = (id: string) => apiClient.delete(`/languages/resume-analyses/${encodeURIComponent(id)}`);
export function analyzeFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  return data<Analysis>(apiClient.post('/languages/resume-analyses', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 90_000 }));
}
export const analyzeText = (text: string) => data<Analysis>(apiClient.post('/languages/resume-analyses/text', { text }));
