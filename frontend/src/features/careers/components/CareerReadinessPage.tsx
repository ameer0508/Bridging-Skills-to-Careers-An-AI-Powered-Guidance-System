import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Briefcase, CheckCircle2, Cpu, FolderGit2, Gauge, GraduationCap, Info, Scale } from 'lucide-react';
import apiClient from '../../../lib/axios';
import { messageOf } from '../../../lib/collections';
import { EvidenceBasisPanel, type EvidenceBasis } from './EvidenceBasisPanel';
import { UploadCard } from '../../resume/aurora/ResumeParts';
import type { CareerMatchData } from '../aurora/types';
import { Notice, PageHeader, PageSkeleton, Pill, type PillTone } from '../../../design/aurora/kit';
import { Bar, CardHeader, EmptyNote, Ring, cardClass } from '../../../design/aurora/ui';
import { auroraButtonClass } from '../../../design/aurora/buttonStyles';
import { auroraEase } from '../../../design/aurora/motion';

interface IGapItem {
  skillName: string;
  impactScore: number;
  reason: string;
}

interface IDimension {
  name: string;
  score: number;
  weight: number;
}

interface ICareerReadiness {
  _id: string;
  careerId: { _id: string; title: string; category: string; description?: string };
  overallScore: number;
  readinessTier: string;
  dimensions: IDimension[];
  evidenceBasis?: EvidenceBasis;
  gaps: { criticalGaps: IGapItem[]; weakAreas: IGapItem[]; strengthAreas: IGapItem[] };
}

/** Tier names come from the server (ReadinessCalculator): 75, 50 and 25 are the boundaries. */
const TIER_TONE: Record<string, PillTone> = { 'Strong evidence': 'mint', 'Solid foundation': 'sky', Developing: 'amber', 'Early stage': 'neutral' };
const TIERS = ['Early stage', 'Developing', 'Solid foundation', 'Strong evidence'];

const dimensionIcon = (name: string) =>
  name.includes('Technical') ? <Cpu className="h-5 w-5" aria-hidden="true" /> : name.includes('Experience') ? <Briefcase className="h-5 w-5" aria-hidden="true" /> : name.includes('Project') ? <FolderGit2 className="h-5 w-5" aria-hidden="true" /> : <GraduationCap className="h-5 w-5" aria-hidden="true" />;

/** What to do next, from the stored gaps and dimensions; each item links to where it is done. */
const nextActions = (item: ICareerReadiness) => {
  const actions: Array<{ title: string; why: string; to: string; cta: string }> = [];
  const gap = item.gaps?.criticalGaps?.[0];
  if (gap) actions.push({ title: `Learn ${gap.skillName}`, why: `A required skill for ${item.careerId.title} with no evidence yet.`, to: '/roadmap', cta: 'Open the roadmap' });
  const weak = item.gaps?.weakAreas?.[0];
  if (weak) actions.push({ title: `Show ${weak.skillName} in practice`, why: 'It is on your profile but only weakly evidenced. A skill check or a project would strengthen it.', to: '/career-lab', cta: 'Take a skill check' });
  const low = [...(item.dimensions ?? [])].sort((a, b) => a.score - b.score)[0];
  if (low && low.score < 50) {
    const to = low.name.includes('Project') ? '/portfolio' : low.name.includes('Experience') ? '/portfolio' : low.name.includes('Education') ? '/profile' : '/roadmap';
    actions.push({ title: `Raise ${low.name.toLowerCase()}`, why: `Your lowest dimension at ${low.score}%, weighted ${(low.weight * 100).toFixed(0)}% of the score.`, to, cta: 'Add evidence' });
  }
  return actions.slice(0, 3);
};

export const CareerReadinessPage: React.FC = () => {
  const reduce = useReducedMotion();
  const queryClient = useQueryClient();
  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null);

  const { data: resumeData } = useQuery({
    queryKey: ['resumes', 'me'],
    queryFn: async () => {
      try {
        return (await apiClient.get('/resumes/me')).data?.data?.resume || null;
      } catch {
        return null;
      }
    },
    refetchInterval: query => {
      const status = query.state.data?.parsingStatus;
      return status === 'pending' || status === 'processing' ? 2000 : false;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      return (await apiClient.post('/resumes/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });

  const { data, isLoading, error, refetch } = useQuery<{ readiness: ICareerReadiness[] }>({
    queryKey: ['readiness'],
    queryFn: async () => (await apiClient.get('/readiness')).data.data,
  });
  // The match score for the same career, to explain how the two figures differ
  const matches = useQuery<{ matches: CareerMatchData[] }>({
    queryKey: ['careers', 'matches'],
    queryFn: async () => (await apiClient.get('/careers/matches')).data.data,
  });

  const items = useMemo(() => data?.readiness || [], [data]);
  const active = items.find(i => i.careerId._id === selectedCareerId) || items[0];
  const match = matches.data?.matches.find(m => m.careerId._id === active?.careerId._id);

  useEffect(() => {
    if (resumeData?.parsingStatus === 'completed' && items.length === 0) queryClient.invalidateQueries({ queryKey: ['readiness'] });
  }, [resumeData?.parsingStatus, items.length, queryClient]);

  if (isLoading) return <PageSkeleton label="Loading your readiness" />;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <Notice tone="error" title="Your readiness could not be loaded." action={<button type="button" className={auroraButtonClass('secondary', 'md')} onClick={() => refetch()}>Try again</button>}>
          {messageOf(error, 'Please try again.')}
        </Notice>
      </div>
    );
  }

  if (!active) {
    const processing = resumeData?.parsingStatus === 'processing' || resumeData?.parsingStatus === 'pending';
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
        <PageHeader
          eyebrow="Career Readiness"
          icon={<Gauge className="h-7 w-7" aria-hidden="true" />}
          title="How ready is your evidence?"
          lead="Readiness weighs your technical skills, experience, projects and education against a career’s requirements. It starts from your resume."
        />
        {processing && <Notice title="Reading your resume.">Your readiness appears here as soon as it finishes.</Notice>}
        {(uploadMutation.isError || resumeData?.parsingStatus === 'failed') && (
          <Notice tone="error" title="Your resume could not be processed.">
            {uploadMutation.error ? messageOf(uploadMutation.error, 'The upload failed.') : 'Please make sure the file is an unlocked PDF or DOCX document.'}
          </Notice>
        )}
        <UploadCard hasResume={!!resumeData} uploadProgress={uploadMutation.isPending ? 0 : null} validationError={null} onFileSelect={file => uploadMutation.mutate(file)} />
      </div>
    );
  }

  const actions = nextActions(active);
  const tierIndex = TIERS.indexOf(active.readinessTier);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
      <PageHeader
        eyebrow="Career Readiness"
        icon={<Gauge className="h-7 w-7" aria-hidden="true" />}
        title={`Readiness for ${active.careerId.title}`}
        lead="A weighted view of four dimensions of your evidence. It describes what your records show; it is not a probability of being hired."
      >
        <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex items-center gap-5">
            <span className="relative inline-flex shrink-0 items-center justify-center">
              <Ring value={active.overallScore} size={120} stroke={11} label={`Readiness for ${active.careerId.title}`} tone="mint" />
              <span aria-hidden="true" className="absolute text-center">
                <span className="block font-heading text-3xl font-extrabold text-aurora-ink">{active.overallScore}%</span>
              </span>
            </span>
            <div className="space-y-2">
              <p className="text-sm text-aurora-muted">Overall readiness</p>
              <p className="sr-only">{active.overallScore}%</p>
              <Pill tone={TIER_TONE[active.readinessTier] ?? 'neutral'}>{active.readinessTier}</Pill>
            </div>
          </div>
          {tierIndex >= 0 && (
            <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Readiness tiers">
              {TIERS.map((tier, i) => (
                <li
                  key={tier}
                  aria-current={i === tierIndex ? 'step' : undefined}
                  className={`rounded-2xl border px-3 py-2 text-xs ${i === tierIndex ? 'border-aurora-violet/30 bg-aurora-violet/[0.07] font-semibold text-aurora-indigo' : i < tierIndex ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800' : 'border-aurora-line bg-white text-aurora-muted'}`}
                >
                  <span className="block">{tier}</span>
                  <span className="text-[11px] opacity-80">{['0 to 24', '25 to 49', '50 to 74', '75 to 100'][i]}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </PageHeader>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <section className={`${cardClass} lg:col-span-4`} aria-labelledby="careers-heading">
          <CardHeader id="careers-heading" icon={<Briefcase className="h-5 w-5" aria-hidden="true" />} title="Careers analysed" lead={`${items.length} with a readiness score`} />
          <ul className="aurora-scroll max-h-[440px] space-y-2 overflow-y-auto pr-1">
            {items.map(item => {
              const selected = item._id === active._id;
              return (
                <li key={item._id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedCareerId(item.careerId._id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet ${
                      selected ? 'border-aurora-violet/30 bg-aurora-violet/[0.06]' : 'border-aurora-line hover:bg-aurora-canvas'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-aurora-ink">{item.careerId.title}</span>
                      <span className="text-xs text-aurora-muted">{item.readinessTier}</span>
                    </span>
                    <span className="font-heading text-lg font-extrabold text-aurora-ink">{item.overallScore}%</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={`${cardClass} lg:col-span-8`} aria-labelledby="dimensions-heading" data-testid="readiness-dimensions">
          <CardHeader id="dimensions-heading" icon={<Scale className="h-5 w-5" aria-hidden="true" />} title="The four dimensions" lead="Each dimension is scored from your evidence and weighted into the overall figure." />
          <motion.ul key={active._id} className="grid gap-3 sm:grid-cols-2" initial={reduce ? false : 'hidden'} animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}>
            {active.dimensions.map(dim => (
              <motion.li
                key={dim.name}
                variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: auroraEase } } }}
                className="rounded-3xl border border-aurora-line bg-aurora-canvas/50 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-aurora-ink">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-aurora-violet shadow-aurora-sm">{dimensionIcon(dim.name)}</span>
                    {dim.name}
                  </span>
                  <Pill>Weight {(dim.weight * 100).toFixed(0)}%</Pill>
                </div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="font-heading text-2xl font-extrabold text-aurora-ink">{dim.score}%</span>
                  <span className="text-xs text-aurora-muted">adds {Math.round(dim.score * dim.weight)} point{Math.round(dim.score * dim.weight) === 1 ? '' : 's'}</span>
                </div>
                <Bar value={dim.score} label={`${dim.name}: ${dim.score}%`} tone={dim.score >= 50 ? 'mint' : 'violet'} />
              </motion.li>
            ))}
          </motion.ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardClass} aria-labelledby="next-heading" data-testid="readiness-next-actions">
          <CardHeader id="next-heading" icon={<ArrowRight className="h-5 w-5" aria-hidden="true" />} title="What would move it" />
          {actions.length === 0 ? (
            <EmptyNote>No gap or weak dimension is recorded for this career.</EmptyNote>
          ) : (
            <ol className="space-y-3">
              {actions.map((a, i) => (
                <li key={a.title} className="flex items-start gap-3 rounded-2xl border border-aurora-line p-3.5">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-aurora-violet/[0.08] text-xs font-bold text-aurora-violet">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-aurora-ink">{a.title}</p>
                    <p className="text-sm text-aurora-muted">{a.why}</p>
                  </div>
                  <Link to={a.to} className="shrink-0 self-center text-sm font-semibold text-aurora-violet underline-offset-2 hover:underline">
                    {a.cta}
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={cardClass} aria-labelledby="versus-heading" data-testid="match-vs-readiness">
          <CardHeader id="versus-heading" icon={<Info className="h-5 w-5" aria-hidden="true" />} title="Match and readiness are different figures" />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-aurora-line p-3">
              <p className="text-xs font-semibold text-aurora-muted">Career match</p>
              <p className="font-heading text-2xl font-extrabold text-aurora-ink">{match ? `${match.matchScore}%` : <span className="text-sm font-semibold text-aurora-muted">Not available</span>}</p>
              <p className="mt-1 text-xs text-aurora-muted">Share of the career’s skill requirements your evidence covers.</p>
            </div>
            <div className="rounded-2xl border border-aurora-line p-3">
              <p className="text-xs font-semibold text-aurora-muted">Readiness</p>
              <p className="font-heading text-2xl font-extrabold text-aurora-ink">{active.overallScore}%</p>
              <p className="mt-1 text-xs text-aurora-muted">Skills plus experience, projects and education, weighted.</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-aurora-muted">A high match with lower readiness usually means the skills are listed but not yet shown in roles or projects. Neither figure predicts a hiring outcome.</p>
        </section>
      </div>

      <EvidenceBasisPanel basis={active.evidenceBasis} careerTitle={active.careerId.title} />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardClass} aria-labelledby="gaps-heading">
          <CardHeader id="gaps-heading" icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />} title="Gaps to close" lead="Ordered by the server’s priority for this career." action={{ to: '/roadmap', label: 'Roadmap' }} />
          {active.gaps.criticalGaps.length + active.gaps.weakAreas.length === 0 ? (
            <EmptyNote>No required skill is missing and none is weakly evidenced. Preferred skills you lack are listed on the career page.</EmptyNote>
          ) : (
            <ul className="space-y-2">
              {active.gaps.criticalGaps.map(g => (
                <li key={`c-${g.skillName}`} className="rounded-2xl border border-rose-200 bg-rose-50/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-rose-900">{g.skillName}</span>
                    <Pill tone="rose">Missing</Pill>
                  </div>
                  {g.reason && <p className="mt-1 text-sm text-rose-950/80">{g.reason}</p>}
                  <p className="mt-1 text-[11px] text-rose-900/70">Priority {g.impactScore}/100</p>
                </li>
              ))}
              {active.gaps.weakAreas.map(g => (
                <li key={`w-${g.skillName}`} className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-amber-900">{g.skillName}</span>
                    <Pill tone="amber">Weak evidence</Pill>
                  </div>
                  {g.reason && <p className="mt-1 text-sm text-amber-950/80">{g.reason}</p>}
                  <p className="mt-1 text-[11px] text-amber-900/70">Priority {g.impactScore}/100</p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className={cardClass} aria-labelledby="strengths-heading">
          <CardHeader id="strengths-heading" icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />} title="Strengths" lead="Required skills with good evidence." />
          {active.gaps.strengthAreas.length === 0 ? (
            <EmptyNote>No strength is recorded for this career yet.</EmptyNote>
          ) : (
            <ul className="space-y-2">
              {active.gaps.strengthAreas.map(s => (
                <li key={s.skillName} className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <span className="text-sm font-semibold text-emerald-900">{s.skillName}</span>
                  {s.reason && <p className="mt-1 text-sm text-emerald-950/80">{s.reason}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default CareerReadinessPage;
