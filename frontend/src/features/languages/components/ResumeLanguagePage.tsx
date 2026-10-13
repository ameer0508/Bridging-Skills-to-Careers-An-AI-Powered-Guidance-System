import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Languages, Trash2 } from 'lucide-react';
import { messageOf } from '../../../lib/collections';
import { GUIDANCE, LANGUAGE_NAMES } from '../guidance';
import { Analysis, analyzeFile, analyzeText, deleteAnalysis, fetchAnalyses, fetchAnalysis, fetchSettings, saveSettings, UiLanguage } from '../languagesApi';

const card = 'rounded-[var(--radius-md)] border border-[var(--color-border-default)] p-4';
const primaryButton = 'rounded-[var(--radius-md)] bg-[var(--color-interactive-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60';
const SECTION_NAMES: Record<string, string> = {
  summary: 'Summary', experience: 'Experience', education: 'Education', skills: 'Skills',
  projects: 'Projects', certifications: 'Certifications', languages: 'Languages', contact: 'Contact',
};

/** E5/X1: check how a resume in English, Hindi or Spanish is read, with every value traced to its line. */
export const ResumeLanguagePage: React.FC = () => {
  const queryClient = useQueryClient();
  const settings = useQuery({ queryKey: ['language-settings'], queryFn: fetchSettings, retry: false });
  const analyses = useQuery({ queryKey: ['resume-analyses'], queryFn: fetchAnalyses, retry: false });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const lang: UiLanguage = settings.data?.uiLanguage ?? 'en';
  const t = GUIDANCE[lang];

  const setLanguage = useMutation({ mutationFn: saveSettings, onSuccess: d => queryClient.setQueryData(['language-settings'], d) });
  const done = (a: Analysis) => {
    queryClient.setQueryData(['resume-analysis', a.id], a);
    queryClient.invalidateQueries({ queryKey: ['resume-analyses'] });
    setSelectedId(a.id);
  };
  const fromFile = useMutation({ mutationFn: (f: File) => analyzeFile(f), onSuccess: done });
  const fromText = useMutation({ mutationFn: (s: string) => analyzeText(s), onSuccess: done });
  const remove = useMutation({
    mutationFn: (id: string) => deleteAnalysis(id),
    onSuccess: (_d, id) => {
      if (selectedId === id) setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ['resume-analyses'] });
    },
  });
  const error = fromFile.error ?? fromText.error;

  // Wait for the saved language so the page does not flash in English first
  if (settings.isPending) return <p role="status" className="px-4 py-6 text-sm text-[var(--color-text-secondary)]">…</p>;

  return (
    <div lang={lang} className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6" data-testid="resume-language-page">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold font-display text-[var(--color-text-primary)]">{t.title}</h1>
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Languages size={16} aria-hidden="true" /> {t.interfaceLanguage}
            <select
              className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-2 py-1 text-sm"
              value={lang}
              disabled={setLanguage.isPending}
              onChange={e => setLanguage.mutate(e.target.value as UiLanguage)}
            >
              {(Object.keys(LANGUAGE_NAMES) as UiLanguage[]).map(code => (
                <option key={code} value={code} lang={code}>{LANGUAGE_NAMES[code]}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="max-w-3xl text-sm text-[var(--color-text-secondary)]" data-testid="guidance-intro">{t.intro}</p>
        <p className="max-w-3xl text-xs text-[var(--color-text-secondary)]">{t.tips}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <form
          className={`${card} flex flex-col gap-3`}
          aria-label={t.uploadLabel}
          onSubmit={e => {
            e.preventDefault();
            if (file) fromFile.mutate(file);
          }}
        >
          <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--color-text-primary)]">
            {t.uploadLabel}
            <input type="file" accept=".pdf,.docx,.txt" onChange={e => setFile(e.target.files?.[0] ?? null)} className="text-sm font-normal" />
          </label>
          <div><button type="submit" className={primaryButton} disabled={!file || fromFile.isPending}>{t.analyse}</button></div>
        </form>
        <form
          className={`${card} flex flex-col gap-3`}
          aria-label={t.pasteLabel}
          onSubmit={e => {
            e.preventDefault();
            fromText.mutate(text);
          }}
        >
          <label className="flex flex-col gap-1 text-sm font-semibold text-[var(--color-text-primary)]">
            {t.pasteLabel}
            <textarea rows={5} maxLength={100000} value={text} onChange={e => setText(e.target.value)} className="rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-2 text-sm font-normal" />
          </label>
          <div><button type="submit" className={primaryButton} disabled={text.trim().length < 20 || fromText.isPending}>{t.analyseText}</button></div>
        </form>
      </div>

      {(fromFile.isPending || fromText.isPending) && <p role="status" className="text-sm text-[var(--color-text-secondary)]">…</p>}
      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-[var(--color-status-error,#dc2626)]">
          <AlertTriangle size={16} aria-hidden="true" /> {messageOf(error, 'The resume could not be analysed.')}
        </p>
      )}

      {selectedId && <AnalysisView id={selectedId} labels={t} />}

      <section aria-labelledby="analyses-heading">
        <h2 id="analyses-heading" className="mb-2 text-base font-bold text-[var(--color-text-primary)]">{t.history}</h2>
        {analyses.data?.length === 0 && <p className="text-sm text-[var(--color-text-secondary)]">{t.none}</p>}
        <ul className="flex flex-col gap-2" data-testid="analysis-history">
          {analyses.data?.map(a => (
            <li key={a.id} className={`${card} flex flex-wrap items-center justify-between gap-2 text-sm`}>
              <button type="button" className="text-left underline" onClick={() => setSelectedId(a.id)}>
                {a.fileName} · {a.language.name ?? a.language.language ?? '—'} · {new Date(a.createdAt).toLocaleString()}
              </button>
              <button type="button" className="inline-flex items-center gap-1 text-xs underline" onClick={() => remove.mutate(a.id)} aria-label={`${t.remove}: ${a.fileName}`}>
                <Trash2 size={12} aria-hidden="true" /> {t.remove}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{t.privacy}</p>
      </section>
    </div>
  );
};

const Source: React.FC<{ line: number; text: string; label: string; origin?: 'ocr'; ocrConfidence?: number; ocrMark?: string }> = ({ line, text, label, origin, ocrConfidence, ocrMark }) => (
  <span className="block text-xs text-[var(--color-text-secondary)]">
    {label} {line + 1}: <q>{text}</q>
    {origin === 'ocr' && <span className="ml-1 rounded border border-amber-500 px-1 text-amber-800" data-testid="ocr-mark">{ocrMark} {ocrConfidence}%</span>}
  </span>
);

const AnalysisView: React.FC<{ id: string; labels: Record<string, string> }> = ({ id, labels }) => {
  const q = useQuery({ queryKey: ['resume-analysis', id], queryFn: () => fetchAnalysis(id), retry: false });
  if (q.isPending) return <p role="status" className="text-sm text-[var(--color-text-secondary)]">…</p>;
  if (q.isError || !q.data) return <p role="alert" className="text-sm">{messageOf(q.error, 'Not found.')}</p>;
  const a = q.data;
  const ok = a.status === 'extracted';

  return (
    <section className={`${card} flex flex-col gap-3`} aria-labelledby="analysis-heading" data-testid="analysis" data-status={a.status}>
      <h2 id="analysis-heading" className="flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
        {ok ? <CheckCircle2 size={18} aria-hidden="true" className="text-emerald-600" /> : <AlertTriangle size={18} aria-hidden="true" className="text-amber-600" />}
        {a.fileName}
      </h2>
      <p className="text-sm" data-testid="detected-language">
        {labels.detected}: <strong>{a.language.supported ? a.language.name : a.language.language ?? '—'}</strong>
        {a.language.mixed ? ' (with English terms)' : ''} · {labels.layout}: {a.layout.type.replace('_', ' ')} · method {a.method}
      </p>
      {a.textSource && a.textSource !== 'text_layer' && a.ocr?.used && (
        <p role="note" data-testid="ocr-notice" className="rounded-[var(--radius-md)] border border-amber-500 p-3 text-sm">
          <strong>{labels.ocrNotice}</strong>{a.ocr.engine ? ` (${a.ocr.engine}; ${(a.ocr.languages ?? []).join(', ')})` : ''} · {labels.ocrConfidence} {a.ocr.meanConfidence ?? '—'}%. {labels.ocrCheck}
        </p>
      )}
      {a.warnings.length > 0 && (
        <ul role="alert" className="list-disc space-y-1 rounded-[var(--radius-md)] border border-amber-500 bg-amber-50 p-3 pl-7 text-sm text-amber-900" data-testid="analysis-warnings">
          {a.warnings.map(w => <li key={w}>{w}</li>)}
        </ul>
      )}
      {ok && (
        <>
          {a.sections.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm" data-testid="section-table">
                <caption className="mb-1 text-left text-sm font-semibold">{labels.sectionsFound}</caption>
                <thead><tr><th scope="col" className="py-1 pr-3">{labels.headingAsWritten}</th><th scope="col" className="py-1">{labels.understoodAs}</th></tr></thead>
                <tbody>
                  {a.sections.map(s => (
                    <tr key={`${s.startLine}-${s.key}`}><td className="py-1 pr-3">{s.heading}</td><td className="py-1">{SECTION_NAMES[s.key] ?? s.key}{s.matchedLoosely ? ' (matched loosely: damaged text)' : ''}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div><dt className="font-semibold">{labels.email}</dt><dd>{a.fields.email ? <>{a.fields.email.value}<Source {...a.fields.email.source} label={labels.fromLine} ocrMark={labels.ocrMark} /></> : '—'}</dd></div>
            <div><dt className="font-semibold">{labels.phone}</dt><dd>{a.fields.phone ? <>{a.fields.phone.value}<Source {...a.fields.phone.source} label={labels.fromLine} ocrMark={labels.ocrMark} /></> : '—'}</dd></div>
          </dl>
          <div>
            <h3 className="text-sm font-semibold">{labels.experienceDates}</h3>
            {a.fields.experience.length === 0 ? <p className="text-sm text-[var(--color-text-secondary)]">—</p> : (
              <ul className="text-sm" data-testid="experience-list">
                {a.fields.experience.map(e => (
                  <li key={`${e.source.line}`}>{e.start} → {e.end}{e.context ? ` · ${e.context}` : ''}{e.inferred ? ' (inferred: heading not readable)' : ''}<Source {...e.source} label={labels.fromLine} ocrMark={labels.ocrMark} /></li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold">{labels.skills}</h3>
            {a.fields.skills.length === 0 ? <p className="text-sm text-[var(--color-text-secondary)]">—</p> : (
              <ul className="flex flex-wrap gap-2 text-sm" data-testid="skill-list">
                {a.fields.skills.map(s => (
                  <li key={s.name} className="rounded border border-[var(--color-border-default)] px-2 py-0.5" title={`${labels.fromLine} ${s.source.line + 1}: ${s.source.text}`}>
                    {s.name}{s.matched !== s.name ? ` (“${s.matched}”)` : ''}{s.source.origin === 'ocr' ? <span className="ml-1 text-xs text-amber-800" data-testid="ocr-mark">· OCR {s.source.ocrConfidence}%</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default ResumeLanguagePage;
