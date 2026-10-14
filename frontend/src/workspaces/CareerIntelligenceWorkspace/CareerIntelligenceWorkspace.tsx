import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Compass, GitCompare, LineChart, Search, Target } from 'lucide-react';
import apiClient from '../../lib/axios';
import { messageOf } from '../../lib/collections';
import type { CareerMatchData } from '../../features/careers/aurora/types';
import { CareerDemandPanel, CareerSalaryPanel, JobListingsPointer } from '../../features/careers/components/CareerMarketFacts';
import { CareerCard, CareerDetailDialog, CompareDialog, ScoreBreakdown, SourceNote } from '../../features/careers/aurora/CareerParts';
import { UploadCard } from '../../features/resume/aurora/ResumeParts';
import { Disclosure, Notice, PageHeader, PageSkeleton, Pill, StatTile, fieldClass } from '../../design/aurora/kit';
import { CardHeader, Ring, cardClass } from '../../design/aurora/ui';
import { auroraButtonClass } from '../../design/aurora/buttonStyles';
import { auroraEase } from '../../design/aurora/motion';

interface CatalogueCareer {
  id: string;
  title: string;
  category: string;
  description: string;
}

type SortKey = 'match' | 'practice' | 'title';
const SORT_LABEL: Record<SortKey, string> = { match: 'Match score', practice: 'Shown in practice', title: 'Title (A to Z)' };

/** Career Intelligence: every catalogue career, ranked by the evidence in the student's resume. */
export const CareerIntelligenceWorkspace: React.FC = () => {
  const reduce = useReducedMotion();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('match');
  const [comparedIds, setComparedIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [detail, setDetail] = useState<CareerMatchData | null>(null);

  // Resume status, so a just-uploaded resume refreshes the matches when it finishes
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
      queryClient.invalidateQueries({ queryKey: ['careers', 'matches'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });

  const { data, isLoading, error, refetch } = useQuery<{ matches: CareerMatchData[] }>({
    queryKey: ['careers', 'matches'],
    queryFn: async () => (await apiClient.get('/careers/matches')).data.data,
  });
  const catalogue = useQuery<CatalogueCareer[]>({
    queryKey: ['careers', 'catalog'],
    queryFn: async () => (await apiClient.get('/careers/catalog')).data.data.careers,
    staleTime: 5 * 60_000,
  });

  const rawMatches = data?.matches;
  const matches = useMemo(() => rawMatches || [], [rawMatches]);

  useEffect(() => {
    if (resumeData?.parsingStatus === 'completed' && matches.length === 0) {
      queryClient.invalidateQueries({ queryKey: ['careers', 'matches'] });
    }
  }, [resumeData?.parsingStatus, matches.length, queryClient]);

  const categories = useMemo(() => ['all', ...Array.from(new Set(matches.map(m => m.careerId.category)))], [matches]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = matches.filter(
      m =>
        (category === 'all' || m.careerId.category === category) &&
        (!q ||
          m.careerId.title.toLowerCase().includes(q) ||
          m.careerId.category.toLowerCase().includes(q) ||
          m.matchingSkills.some(s => s.toLowerCase().includes(q)) ||
          m.missingSkills.some(s => s.toLowerCase().includes(q)))
    );
    return [...list].sort((a, b) =>
      sortBy === 'title' ? a.careerId.title.localeCompare(b.careerId.title) : sortBy === 'practice' ? (b.confidence || 0) - (a.confidence || 0) : b.matchScore - a.matchScore
    );
  }, [matches, category, search, sortBy]);

  const unmatched = useMemo(() => {
    const matched = new Set(matches.map(m => m.careerId._id));
    return (catalogue.data ?? []).filter(c => !matched.has(c.id));
  }, [catalogue.data, matches]);

  const toggleCompare = (id: string) => setComparedIds(ids => (ids.includes(id) ? ids.filter(i => i !== id) : ids.length >= 3 ? ids : [...ids, id]));
  const compared = matches.filter(m => comparedIds.includes(m.id));

  if (isLoading) return <PageSkeleton label="Loading your career matches" />;

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <Notice tone="error" title="Your career matches could not be loaded." action={<button type="button" className={auroraButtonClass('secondary', 'md')} onClick={() => refetch()}>Try again</button>}>
          {messageOf(error, 'Please try again.')}
        </Notice>
      </div>
    );
  }

  if (matches.length === 0) {
    const processing = resumeData?.parsingStatus === 'processing' || resumeData?.parsingStatus === 'pending';
    const failed = uploadMutation.isError || resumeData?.parsingStatus === 'failed';
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
        <PageHeader
          eyebrow="Career Intelligence"
          icon={<Compass className="h-7 w-7" aria-hidden="true" />}
          title="Which careers does your evidence fit?"
          lead={`SkillBridge compares your skills with the requirements of ${catalogue.data?.length ?? 'its'} careers and explains every point of every score. It starts from your resume.`}
        />
        {processing && <Notice title="Reading your resume.">Your matches appear here as soon as it finishes.</Notice>}
        {failed && (
          <Notice tone="error" title="Your resume could not be processed.">
            {uploadMutation.error ? messageOf(uploadMutation.error, 'The upload failed.') : 'Please make sure the document is not password-protected or damaged, then try again.'}
          </Notice>
        )}
        <div className="grid gap-6 lg:grid-cols-2">
          <UploadCard hasResume={!!resumeData} uploadProgress={uploadMutation.isPending ? 0 : null} validationError={null} onFileSelect={file => uploadMutation.mutate(file)} />
          <section className={cardClass} aria-labelledby="how-heading">
            <CardHeader id="how-heading" icon={<Target className="h-5 w-5" aria-hidden="true" />} title="How matches are scored" />
            <ul className="space-y-2 text-sm text-aurora-muted">
              <li>Each career lists required, preferred and supporting skills.</li>
              <li>A skill used in a role or project earns more than one that is only listed; a related skill can count as inferred.</li>
              <li>The score is the share of the career’s points your evidence earns. It is not a hiring prediction.</li>
            </ul>
          </section>
        </div>
      </div>
    );
  }

  const top = matches[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
      <PageHeader
        eyebrow="Career Intelligence"
        icon={<Compass className="h-7 w-7" aria-hidden="true" />}
        title="Careers ranked by your evidence"
        lead="Each score is the share of a career’s skill requirements your resume evidences. Scores are calculated from your resume only and are not predictions of hiring outcomes."
        actions={
          <button type="button" className={auroraButtonClass('primary', 'md')} onClick={() => setCompareOpen(true)} disabled={compared.length < 2}>
            <GitCompare className="h-4 w-4" aria-hidden="true" /> Compare {compared.length >= 2 ? `(${compared.length})` : 'careers'}
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Careers matched" value={`${matches.length} of ${catalogue.data?.length ?? matches.length}`} />
          <StatTile label="Closest match" value={`${top.matchScore}%`} hint={top.careerId.title} accent />
          <StatTile label="Skills evidenced" value={top.matchingSkills.length} hint="for the closest match" />
          <StatTile label="Skills missing" value={top.missingSkills.length} hint="for the closest match" />
        </div>
      </PageHeader>

      <section className={cardClass} aria-labelledby="top-heading" data-testid="top-match">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="flex flex-col gap-4 min-[420px]:flex-row min-[420px]:items-start lg:w-80 lg:shrink-0">
            <span className="relative inline-flex shrink-0 items-center justify-center">
              <Ring value={top.matchScore} size={92} stroke={9} label={`${top.careerId.title} match`} />
              <span aria-hidden="true" className="absolute font-heading text-xl font-extrabold text-aurora-ink">
                {top.matchScore}%
              </span>
            </span>
            <div className="min-w-0 space-y-1.5">
              <Pill tone="mint">Closest match</Pill>
              <h2 id="top-heading" className="font-heading text-xl font-bold text-aurora-ink">
                Top match: {top.careerId.title} ({top.matchScore}%)
              </h2>
              <p className="text-sm text-aurora-muted">{top.summary || 'The match score is the weighted share of this career’s skills that your resume evidences.'}</p>
              <SourceNote career={top.careerId} />
              <div className="flex flex-wrap gap-2 pt-1">
                <Link to="/readiness" className={auroraButtonClass('secondary', 'md')}>
                  See readiness and gaps
                </Link>
              </div>
            </div>
          </div>
          {Array.isArray(top.breakdown) && top.breakdown.length > 0 && (
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 font-heading text-base font-bold text-aurora-ink">How this score was calculated</h3>
              <p className="mb-3 text-sm text-aurora-muted">Each skill the career expects, and the evidence found for it on your resume.</p>
              <div className="rounded-2xl border border-aurora-line">
                <ScoreBreakdown rows={top.breakdown} testId="top-breakdown" />
              </div>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="explorer-heading" className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="explorer-heading" className="font-heading text-2xl font-extrabold tracking-tight text-aurora-ink">
              Career explorer
            </h2>
            <p className="text-sm text-aurora-muted">
              Showing {filtered.length} of {matches.length} matched careers. Tick up to three to compare.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative block sm:w-72">
              <span className="sr-only">Filter careers by title, category or skill</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-aurora-muted" aria-hidden="true" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by title, category or skill" className={`${fieldClass} pl-10`} />
            </label>
            <label className="flex items-center gap-2 text-sm text-aurora-muted">
              <span className="shrink-0">Sort by</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)} className={`${fieldClass} w-auto`} aria-label="Sort careers">
                {(Object.keys(SORT_LABEL) as SortKey[]).map(k => (
                  <option key={k} value={k}>
                    {SORT_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {categories.map(c => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet ${
                category === c ? 'border-transparent text-white [background:var(--aurora-gradient-action)]' : 'border-aurora-line bg-white text-aurora-muted hover:text-aurora-ink'
              }`}
            >
              {c === 'all' ? 'All categories' : c}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <Notice>No matched career fits that filter.</Notice>
        ) : (
          <motion.div layout={!reduce} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false}>
              {filtered.map((m, i) => (
                <motion.div
                  key={m.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: auroraEase, delay: reduce ? 0 : Math.min(i, 8) * 0.04 }}
                  className="flex"
                >
                  <div className="flex w-full">
                    <CareerCard
                      match={m}
                      rank={matches.indexOf(m) + 1}
                      compared={comparedIds.includes(m.id)}
                      compareDisabled={comparedIds.length >= 3}
                      onToggleCompare={() => toggleCompare(m.id)}
                      onOpen={() => setDetail(m)}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
        {unmatched.length > 0 && (
          <Disclosure summary={`${unmatched.length} more career${unmatched.length === 1 ? '' : 's'} with no match yet`} testId="unmatched-careers">
            <p className="mb-3">None of their skills appear in your evidence yet, so no score is shown for them.</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {unmatched.map(c => (
                <li key={c.id} className="rounded-2xl border border-aurora-line px-3 py-2">
                  <span className="block text-sm font-semibold text-aurora-ink">{c.title}</span>
                  <span className="text-xs">{c.category}</span>
                </li>
              ))}
            </ul>
          </Disclosure>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="market-heading">
        <div>
          <h2 id="market-heading" className="flex items-center gap-2 font-heading text-2xl font-extrabold tracking-tight text-aurora-ink">
            <LineChart className="h-6 w-6 text-aurora-violet" aria-hidden="true" /> Job market evidence
          </h2>
          <p className="text-sm text-aurora-muted">Posting counts and advertised salaries from licensed sources only. Where none exist, this says so instead of showing a figure.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {top.careerId._id && <CareerDemandPanel careerId={top.careerId._id} careerTitle={top.careerId.title} />}
          <CareerSalaryPanel />
        </div>
        <JobListingsPointer />
      </section>

      <CareerDetailDialog match={detail} onClose={() => setDetail(null)} />
      <CompareDialog open={compareOpen} onClose={() => setCompareOpen(false)} matches={compared} />
    </div>
  );
};

CareerIntelligenceWorkspace.displayName = 'CareerIntelligenceWorkspace';
export default CareerIntelligenceWorkspace;
