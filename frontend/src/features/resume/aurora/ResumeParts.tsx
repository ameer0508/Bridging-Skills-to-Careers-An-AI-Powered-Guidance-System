import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Award,
  Briefcase,
  CheckCircle2,
  Download,
  FileText,
  FolderGit2,
  GraduationCap,
  Languages,
  Loader2,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  Target,
  Trash2,
  Trophy,
  UploadCloud,
  User,
} from 'lucide-react';
import { auroraButtonClass } from '../../../design/aurora/buttonStyles';
import { AuroraDialog, Notice, Pill, type PillTone } from '../../../design/aurora/kit';
import { Bar, CardHeader, EmptyNote, cardClass } from '../../../design/aurora/ui';
import { auroraEase } from '../../../design/aurora/motion';
import { EVIDENCE_KINDS, SOURCE_LABEL, kindOf, type EvidenceKind, type ProfileSkill } from './skillEvidence';

export type ParsingStatus = 'pending' | 'processing' | 'completed' | 'failed';

const smallButton =
  'inline-flex h-10 items-center gap-2 rounded-full border border-aurora-line bg-white px-4 text-sm font-semibold text-aurora-ink shadow-aurora-sm transition-colors hover:border-aurora-lavender hover:text-aurora-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet disabled:cursor-not-allowed disabled:opacity-60';

/** Refresh, reprocess, download and delete (with a confirmation that says what is kept). */
export const ResumeActions: React.FC<{
  fileName?: string;
  hasResume: boolean;
  busy: boolean;
  isDeleting: boolean;
  onRefresh: () => void;
  onReprocess: () => void;
  onDownload: () => void;
  onDelete: () => void;
}> = ({ fileName, hasResume, busy, isDeleting, onRefresh, onReprocess, onDownload, onDelete }) => {
  const [confirming, setConfirming] = useState(false);
  const keepRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button type="button" onClick={onRefresh} aria-label="Refresh status" title="Refresh status" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-aurora-line bg-white text-aurora-ink shadow-aurora-sm transition-colors hover:border-aurora-lavender hover:text-aurora-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet">
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
      </button>
      {hasResume && (
        <>
          <button type="button" onClick={onReprocess} disabled={busy} title="Read the stored file again and rebuild your skills" className={smallButton}>
            <RotateCw className={`h-4 w-4 ${busy ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
            {busy ? 'Processing…' : 'Reprocess'}
          </button>
          <button type="button" onClick={onDownload} className={auroraButtonClass('primary', 'md')}>
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={isDeleting}
            aria-label="Delete resume"
            title="Delete resume"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-600 shadow-aurora-sm transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      )}
      <AuroraDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Delete this resume?"
        size="sm"
        tone="danger"
        initialFocus={keepRef}
        footer={
          <>
            <button ref={keepRef} type="button" onClick={() => setConfirming(false)} className={smallButton}>
              Keep resume
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                onDelete();
              }}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-rose-600 px-4 text-sm font-semibold text-white shadow-aurora-sm hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            >
              Delete resume
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm leading-relaxed">
          <p className="text-aurora-ink">
            The file{fileName ? ` "${fileName}"` : ''} will be removed, together with the skills, career matches, readiness scores and active recommendations calculated from it.
          </p>
          <p className="text-aurora-muted">
            Your roadmap progress, saved jobs and interview history are kept, and so are skills you verified with a skill check. This cannot be undone.
          </p>
        </div>
      </AuroraDialog>
    </>
  );
};

/** Drop or choose a PDF/DOCX; checked here first (type and 5 MB), then sent. */
export const UploadCard: React.FC<{
  hasResume: boolean;
  uploadProgress: number | null;
  validationError: string | null;
  onFileSelect: (file: File) => void;
}> = ({ hasResume, uploadProgress, validationError, onFileSelect }) => {
  const reduce = useReducedMotion();
  const [drag, setDrag] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const error = localError || validationError;

  const submit = (file: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const extension = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase();
    if (!validTypes.includes(file.type) || (extension !== 'pdf' && extension !== 'docx')) {
      setLocalError('That file type is not supported. Please choose a PDF or Word document (.pdf or .docx).');
      return;
    }
    // Same limit as the server (UPLOAD_MAX_SIZE)
    if (file.size > 5 * 1024 * 1024) {
      setLocalError('That file is larger than the 5 MB limit.');
      return;
    }
    setLocalError(null);
    onFileSelect(file);
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(e.type === 'dragenter' || e.type === 'dragover');
  };

  return (
    <section className={cardClass} aria-labelledby="upload-heading">
      <CardHeader
        id="upload-heading"
        icon={<UploadCloud className="h-5 w-5" aria-hidden="true" />}
        title={hasResume ? 'Replace your resume' : 'Upload your resume'}
        lead="PDF or Word (.docx), up to 5 MB. The file stays private to your account."
      />
      <label
        onDragEnter={onDrag}
        onDragOver={onDrag}
        onDragLeave={onDrag}
        onDrop={e => {
          onDrag(e);
          setDrag(false);
          if (e.dataTransfer.files?.[0]) submit(e.dataTransfer.files[0]);
        }}
        className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-within:ring-2 focus-within:ring-aurora-violet ${
          drag ? 'border-aurora-violet bg-aurora-violet/[0.06]' : 'border-aurora-line bg-aurora-canvas/70 hover:border-aurora-lavender hover:bg-aurora-violet/[0.03]'
        }`}
      >
        <input
          type="file"
          accept=".pdf,.docx"
          className="sr-only"
          onChange={e => {
            if (e.target.files?.[0]) submit(e.target.files[0]);
            e.target.value = '';
          }}
        />
        <motion.span
          animate={drag && !reduce ? { y: -4, scale: 1.05 } : { y: 0, scale: 1 }}
          className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-aurora-md [background:var(--aurora-gradient-action)]"
        >
          <UploadCloud className="h-6 w-6" aria-hidden="true" />
        </motion.span>
        <span className="font-heading text-base font-bold text-aurora-ink">{drag ? 'Drop to upload' : hasResume ? 'Drop a new file, or choose one' : 'Drop your resume here, or choose a file'}</span>
        <span className="text-xs text-aurora-muted">{hasResume ? 'Replacing rebuilds your skills and tells you what changed.' : 'Your skills, matches and readiness are calculated from it.'}</span>
      </label>

      <AnimatePresence>
        {uploadProgress !== null && (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduce ? undefined : { opacity: 0, height: 0 }}
            className="mt-4 space-y-2 overflow-hidden"
            role="status"
          >
            <div className="flex justify-between text-xs font-semibold text-aurora-muted">
              <span>Uploading…</span>
              <span className="text-aurora-indigo">{uploadProgress}%</span>
            </div>
            <Bar value={uploadProgress} label="Upload progress" />
          </motion.div>
        )}
      </AnimatePresence>
      {error && (
        <div className="mt-4">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
    </section>
  );
};

export interface SkillChanges {
  comparedToPrevious: boolean;
  added: string[];
  removed: string[];
  unchangedCount: number;
}

/** The state of the last extraction run, with recovery, and what changed after a replacement. */
export const ProcessingNotices: React.FC<{
  status?: ParsingStatus;
  error?: string;
  isStuck?: boolean;
  changes?: SkillChanges | null;
  actionError?: string | null;
  isReprocessing: boolean;
  onReprocess: () => void;
}> = ({ status, error, isStuck = false, changes, actionError, isReprocessing, onReprocess }) => {
  const inFlight = status === 'pending' || status === 'processing';
  const showChanges = status === 'completed' && !!changes?.comparedToPrevious && (changes.added.length > 0 || changes.removed.length > 0);
  const reprocess = (
    <button type="button" onClick={onReprocess} disabled={isReprocessing} className={auroraButtonClass('primary', 'md')}>
      <RotateCw className={`h-4 w-4 ${isReprocessing ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
      Reprocess resume
    </button>
  );
  return (
    <div className="space-y-3" aria-live="polite">
      {actionError && <Notice tone="error">{actionError}</Notice>}
      {status === 'failed' && (
        <Notice tone="error" title="This resume could not be processed." action={reprocess}>
          <p>{error || 'No reason was reported.'}</p>
          <p>Your file is still stored. You can run the extraction again or replace the file.</p>
        </Notice>
      )}
      {inFlight && isStuck && (
        <Notice tone="warning" title="Processing is taking longer than expected." action={reprocess}>
          It may have been interrupted. You can start it again.
        </Notice>
      )}
      {inFlight && !isStuck && (
        <div className="flex items-center gap-3 rounded-2xl border border-aurora-violet/20 bg-aurora-violet/[0.05] px-4 py-3 text-sm text-aurora-ink" role="status">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-aurora-violet motion-reduce:animate-none" aria-hidden="true" />
          Reading your resume. Skills, career matches and readiness update when this finishes.
        </div>
      )}
      {showChanges && changes && (
        <section className={cardClass} data-testid="resume-skill-changes" aria-labelledby="changes-heading">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <h2 id="changes-heading" className="font-heading text-base font-bold text-aurora-ink">
              What changed compared with your previous resume
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Skills added', list: changes.added, tone: 'mint' as const },
              { label: 'Skills no longer found', list: changes.removed, tone: 'rose' as const },
            ].map(group => (
              <div key={group.label}>
                <p className="mb-2 text-xs font-semibold text-aurora-muted">
                  {group.label} ({group.list.length})
                </p>
                {group.list.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {group.list.map(skill => (
                      <li key={skill}>
                        <Pill tone={group.tone}>{skill}</Pill>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-aurora-muted">None</p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-aurora-muted">
            {changes.unchangedCount} skill{changes.unchangedCount === 1 ? '' : 's'} unchanged. Career matches, readiness and recommendations were recalculated from the new skill list.
          </p>
        </section>
      )}
    </div>
  );
};

const KIND_TONE: Record<EvidenceKind, PillTone> = { assessed: 'mint', applied: 'violet', studied: 'sky', self: 'amber', listed: 'neutral' };

/** Skills grouped by their strongest evidence, each with the sources behind its score. */
export const EvidenceSkills: React.FC<{ skills: ProfileSkill[]; total?: number }> = ({ skills, total }) => {
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState<EvidenceKind | 'all'>('all');
  const [openSkill, setOpenSkill] = useState<string | null>(null);
  const grouped = useMemo(() => {
    const byKind = new Map<EvidenceKind, ProfileSkill[]>();
    for (const skill of skills) {
      const kind = kindOf(skill);
      byKind.set(kind, [...(byKind.get(kind) ?? []), skill]);
    }
    for (const list of byKind.values()) list.sort((a, b) => (b.evidenceScore ?? -1) - (a.evidenceScore ?? -1));
    return byKind;
  }, [skills]);

  if (skills.length === 0) {
    return (
      <section className={cardClass} aria-labelledby="skills-heading">
        <CardHeader id="skills-heading" icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />} title="Skills and their evidence" />
        <EmptyNote>No skills yet. Upload your resume to see the skills recognised in it and the evidence for each.</EmptyNote>
      </section>
    );
  }

  const kinds = EVIDENCE_KINDS.filter(k => (grouped.get(k.id)?.length ?? 0) > 0);
  const visible = filter === 'all' ? kinds : kinds.filter(k => k.id === filter);

  return (
    <section className={cardClass} aria-labelledby="skills-heading" data-testid="resume-skills">
      <CardHeader
        id="skills-heading"
        icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
        title="Skills and their evidence"
        lead={`${total ?? skills.length} skills recognised. Each is grouped by its strongest evidence; open one to see every source and its points.`}
        action={{ to: '/skills', label: 'Skill Intelligence' }}
      />
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Show skills by evidence">
        {[{ id: 'all' as const, title: 'All' }, ...kinds].map(k => {
          const count = k.id === 'all' ? skills.length : grouped.get(k.id)?.length ?? 0;
          const active = filter === k.id;
          return (
            <button
              key={k.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(k.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet ${
                active ? 'border-transparent text-white [background:var(--aurora-gradient-action)]' : 'border-aurora-line bg-white text-aurora-muted hover:text-aurora-ink'
              }`}
            >
              {k.title} <span className={active ? 'text-white/80' : 'text-aurora-muted'}>{count}</span>
            </button>
          );
        })}
      </div>
      <div className="space-y-6">
        {visible.map(kind => (
          <div key={kind.id}>
            <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-sm font-bold text-aurora-ink">{kind.title}</h3>
              <p className="text-xs text-aurora-muted">{kind.blurb}</p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {(grouped.get(kind.id) ?? []).map((skill, i) => {
                const key = skill.id ?? skill.name;
                const open = openSkill === key;
                const score = typeof skill.evidenceScore === 'number' ? Math.round(skill.evidenceScore) : null;
                return (
                  <motion.li
                    key={key}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: auroraEase, delay: reduce ? 0 : Math.min(i, 10) * 0.03 }}
                    className={`rounded-2xl border transition-shadow ${open ? 'border-aurora-violet/30 shadow-aurora-md sm:col-span-2' : 'border-aurora-line hover:shadow-aurora-sm'}`}
                    data-testid="resume-skill"
                    data-kind={kind.id}
                  >
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenSkill(open ? null : key)}
                      className="flex w-full flex-col gap-2 rounded-2xl p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet"
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-aurora-ink">{skill.name}</span>
                        <Pill tone={KIND_TONE[kind.id]}>{kind.title}</Pill>
                      </span>
                      <span className="flex w-full items-center gap-3">
                        <span className="flex-1">
                          {score === null ? <span className="text-xs text-aurora-muted">No evidence score</span> : <Bar value={score} label={`${skill.name} evidence score`} />}
                        </span>
                        <span className="w-14 shrink-0 text-right text-xs font-semibold text-aurora-muted">{score === null ? '—' : `${score}/100`}</span>
                      </span>
                      <span className="text-[11px] text-aurora-muted">{skill.category ? skill.category.replace(/_/g, ' ') : 'Skill'}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={reduce ? false : { height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={reduce ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: auroraEase }}
                          className="overflow-hidden"
                        >
                          <ul className="space-y-1.5 border-t border-aurora-line px-3 py-3" aria-label={`Evidence for ${skill.name}`}>
                            {(skill.evidences ?? []).length === 0 && <li className="text-xs text-aurora-muted">No sources recorded.</li>}
                            {(skill.evidences ?? []).map((ev, j) => (
                              <li key={j} className="flex items-start justify-between gap-3 text-xs">
                                <span className="min-w-0">
                                  <span className="font-semibold text-aurora-ink">{SOURCE_LABEL[ev.sourceType] ?? ev.sourceType}</span>
                                  <span className="text-aurora-muted"> · {ev.description}</span>
                                  {ev.duplicateOf && <span className="text-aurora-muted"> (already counted from another record)</span>}
                                </span>
                                <span className="shrink-0 font-semibold text-aurora-indigo">{typeof ev.points === 'number' ? `+${ev.points}` : ''}</span>
                              </li>
                            ))}
                            <li className="pt-1 text-[11px] text-aurora-muted">
                              {(skill.evidences ?? []).some(e => e.verification === 'assessed') ? 'Includes a skill check you passed.' : 'Stated, not verified: written by you, not checked by SkillBridge.'}
                            </li>
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs leading-relaxed text-aurora-muted">
        Points per source are set out in the scoring guide: a role counts most, then a project, a certification, education and finally a plain mention. &ldquo;Inferred&rdquo; is used only on career pages, for a requirement met through a related skill.
      </p>
    </section>
  );
};

export interface SectionHealth {
  sectionName: string;
  iconName: string;
  score: number;
  status: string;
  qualitativeConfidence: string;
  extractionMethod: string;
  description: string;
}

const SECTION_ICON: Record<string, React.ReactNode> = {
  user: <User className="h-4 w-4" aria-hidden="true" />,
  briefcase: <Briefcase className="h-4 w-4" aria-hidden="true" />,
  folder: <FolderGit2 className="h-4 w-4" aria-hidden="true" />,
  graduation: <GraduationCap className="h-4 w-4" aria-hidden="true" />,
  target: <Target className="h-4 w-4" aria-hidden="true" />,
  award: <Award className="h-4 w-4" aria-hidden="true" />,
  trophy: <Trophy className="h-4 w-4" aria-hidden="true" />,
  languages: <Languages className="h-4 w-4" aria-hidden="true" />,
};

/** Which resume sections the rule-based parser found, in its own words. */
export const SectionsFound: React.FC<{ sections?: SectionHealth[]; completeness?: number | null }> = ({ sections = [], completeness }) => (
  <section className={cardClass} aria-labelledby="sections-heading" data-testid="resume-sections">
    <CardHeader id="sections-heading" icon={<FileText className="h-5 w-5" aria-hidden="true" />} title="Sections found" lead="Read by the rule-based parser. Nothing here is a hiring or ATS prediction." />
    {sections.length === 0 ? (
      <EmptyNote>Sections appear once a resume has been read.</EmptyNote>
    ) : (
      <ul className="space-y-2">
        {sections.map(section => {
          const found = section.score > 0;
          return (
            <li key={section.sectionName} className="flex items-start gap-3 rounded-2xl border border-aurora-line bg-aurora-canvas/50 p-3">
              <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${found ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-aurora-muted'}`}>
                {SECTION_ICON[section.iconName] ?? <Target className="h-4 w-4" aria-hidden="true" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-aurora-ink">{section.sectionName}</p>
                  <Pill tone={found ? 'mint' : 'neutral'}>{found ? 'Found' : 'Not found'}</Pill>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-aurora-muted">{section.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    )}
    {typeof completeness === 'number' && (
      <div className="mt-4 rounded-2xl border border-aurora-line p-3">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="font-semibold text-aurora-ink">Completeness check</span>
          <span className="font-semibold text-aurora-indigo">{completeness}/100</span>
        </div>
        <Bar value={completeness} label="Resume completeness" tone="mint" />
        <p className="mt-1.5 text-[11px] text-aurora-muted">How many standard sections and contact details were found.</p>
      </div>
    )}
  </section>
);

/** Plain suggestions derived from what the parser found and did not find. */
export const Suggestions: React.FC<{ strengths: string[]; gaps: string[]; tips: Array<{ title: string; suggestion: string }> }> = ({ strengths, gaps, tips }) => (
  <section className={cardClass} aria-labelledby="suggestions-heading" data-testid="resume-suggestions">
    <CardHeader id="suggestions-heading" icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />} title="What the resume shows, and what to add" />
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-semibold text-aurora-muted">Found</p>
        {strengths.length ? (
          <ul className="space-y-1.5 text-sm text-aurora-ink">
            {strengths.map(s => (
              <li key={s} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                {s}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-aurora-muted">Nothing yet.</p>
        )}
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-aurora-muted">Worth adding</p>
        {gaps.length + tips.length ? (
          <ul className="space-y-2 text-sm">
            {gaps.map(g => (
              <li key={g} className="text-aurora-ink">
                {g}
              </li>
            ))}
            {tips.map(t => (
              <li key={t.title}>
                <span className="font-semibold text-aurora-ink">{t.title}.</span> <span className="text-aurora-muted">{t.suggestion}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-aurora-muted">Nothing obvious is missing.</p>
        )}
      </div>
    </div>
  </section>
);
