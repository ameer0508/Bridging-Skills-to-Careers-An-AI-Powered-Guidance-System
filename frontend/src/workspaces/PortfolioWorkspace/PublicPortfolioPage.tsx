import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ExternalLink, FolderGit2, Lock } from 'lucide-react';
import apiClient from '../../lib/axios';
import { Loading, Note } from '../../design/aurora/labUi';
import { formatDate } from '../../design/aurora/labStyles';
import { BrandLockup } from '../../design/aurora/Brand';
import { Eyebrow } from '../../design/aurora/primitives';

interface PublicPortfolio {
  ownerName: string | null;
  entries: Array<{ title: string; description: string; completedOn: string; evidenceUrl: string | null; skills: Array<{ skill: string; verifiedBySkillCheck: boolean }> }>;
  note: string;
}

/** The shared part of someone's portfolio, for anyone who has the link. No sign-in. */
export const PublicPortfolioPage: React.FC = () => {
  const { token = '' } = useParams();
  const reduce = useReducedMotion();
  const view = useQuery<PublicPortfolio>({
    queryKey: ['public-portfolio', token],
    queryFn: async () => (await apiClient.get(`/portfolio/shared/${encodeURIComponent(token)}`)).data.data,
    retry: false,
  });

  return (
    <div className="sb-aurora min-h-screen bg-aurora-canvas text-aurora-ink [background:var(--aurora-gradient-canvas)]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link to="/" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet" aria-label="SkillBridge home">
          <BrandLockup />
        </Link>
        <span className="text-xs font-semibold text-aurora-muted">Shared from SkillBridge</span>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 pb-16 sm:px-6">
        <section className="rounded-[32px] border border-aurora-line bg-white p-6 shadow-aurora-md sm:p-8">
          <Eyebrow>Portfolio</Eyebrow>
          <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-aurora-ink sm:text-4xl">{view.data?.ownerName ? `${view.data.ownerName}'s portfolio` : 'Portfolio'}</h1>
          <p className="mt-2 text-sm text-aurora-muted">Shared from SkillBridge. Each entry is the owner's own record of work they finished.</p>
        </section>

        {view.isLoading ? (
          <section className="rounded-[28px] border border-aurora-line bg-white p-6 shadow-aurora-sm">
            <Loading label="Loading the portfolio..." />
          </section>
        ) : view.isError || !view.data ? (
          <section className="rounded-[28px] border border-aurora-line bg-white p-6 text-center shadow-aurora-sm" role="alert" data-testid="public-portfolio-unavailable">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-aurora-canvas text-aurora-muted">
              <Lock className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-3 font-heading text-lg font-bold text-aurora-ink">This portfolio link is not active</h2>
            <p className="mt-1 text-sm text-aurora-muted">The owner may have switched sharing off, or the link is incomplete.</p>
          </section>
        ) : (
          <section className="space-y-4" data-testid="public-portfolio">
            {view.data.entries.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-aurora-line bg-white p-8 text-center">
                <FolderGit2 className="mx-auto h-8 w-8 text-aurora-lavender" aria-hidden="true" />
                <p className="mt-3 text-sm text-aurora-muted">Nothing has been shared yet.</p>
              </div>
            ) : (
              <ul className="grid gap-4 md:grid-cols-2">
                {view.data.entries.map((entry, i) => (
                  <motion.li
                    key={`${entry.title}-${entry.completedOn}`}
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: reduce ? 0 : Math.min(i, 6) * 0.06 }}
                    className="flex flex-col gap-3 overflow-hidden rounded-[28px] border border-aurora-line bg-white p-5 shadow-aurora-sm"
                    data-testid="public-portfolio-entry"
                  >
                    <h2 className="font-heading text-lg font-bold text-aurora-ink">{entry.title}</h2>
                    {entry.description && <p className="text-sm leading-relaxed text-aurora-muted">{entry.description}</p>}
                    <p className="text-sm text-aurora-muted">
                      Finished {formatDate(entry.completedOn)}.{' '}
                      {entry.evidenceUrl && (
                        <a href={entry.evidenceUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 font-semibold text-aurora-indigo underline-offset-2 hover:underline">
                          View the work <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      )}
                    </p>
                    <ul className="mt-auto flex flex-wrap gap-1.5">
                      {entry.skills.map((s) => (
                        <li key={s.skill} className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.verifiedBySkillCheck ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-aurora-line bg-aurora-canvas text-aurora-ink'}`}>
                          {s.skill}{s.verifiedBySkillCheck ? ' (verified by skill check)' : ''}
                        </li>
                      ))}
                    </ul>
                  </motion.li>
                ))}
              </ul>
            )}
            <Note testId="public-portfolio-note">{view.data.note}</Note>
          </section>
        )}
      </main>
    </div>
  );
};

export default PublicPortfolioPage;
