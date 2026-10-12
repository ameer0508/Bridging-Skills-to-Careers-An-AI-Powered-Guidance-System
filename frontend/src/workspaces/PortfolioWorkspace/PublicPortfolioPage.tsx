import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import apiClient from '../../lib/axios';
import { Loading, Note } from '../../features/careerLab/components/labUi';
import { formatDate, panelClass } from '../../features/careerLab/components/labStyles';

interface PublicPortfolio {
  ownerName: string | null;
  entries: Array<{ title: string; description: string; completedOn: string; evidenceUrl: string | null; skills: Array<{ skill: string; verifiedBySkillCheck: boolean }> }>;
  note: string;
}

/** The shared part of someone's portfolio, for anyone who has the link. No sign-in. */
export const PublicPortfolioPage: React.FC = () => {
  const { token = '' } = useParams();
  const view = useQuery<PublicPortfolio>({
    queryKey: ['public-portfolio', token],
    queryFn: async () => (await apiClient.get(`/portfolio/shared/${encodeURIComponent(token)}`)).data.data,
    retry: false,
  });

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="font-display text-2xl font-extrabold text-white">{view.data?.ownerName ? `${view.data.ownerName}'s portfolio` : 'Portfolio'}</h1>
          <p className="text-xs text-slate-400">Shared from SkillBridge.</p>
        </header>

        {view.isLoading ? (
          <section className={panelClass}><Loading label="Loading the portfolio..." /></section>
        ) : view.isError || !view.data ? (
          <section className={panelClass} role="alert" data-testid="public-portfolio-unavailable">
            <h2 className="text-base font-bold text-white">This portfolio link is not active</h2>
            <p className="text-xs text-slate-400">The owner may have switched sharing off, or the link is incomplete.</p>
          </section>
        ) : (
          <section className={panelClass} data-testid="public-portfolio">
            {view.data.entries.length === 0 ? (
              <p className="text-sm text-slate-300">Nothing has been shared yet.</p>
            ) : (
              <ul className="space-y-4">
                {view.data.entries.map((entry) => (
                  <li key={`${entry.title}-${entry.completedOn}`} className="p-4 rounded-2xl bg-slate-900/50 border border-white/10 space-y-2" data-testid="public-portfolio-entry">
                    <h2 className="text-sm font-bold text-white">{entry.title}</h2>
                    {entry.description && <p className="text-xs text-slate-300">{entry.description}</p>}
                    <p className="text-xs text-slate-300">
                      Finished {formatDate(entry.completedOn)}.{' '}
                      {entry.evidenceUrl && <a href={entry.evidenceUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-cyan-300 underline">View the work</a>}
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {entry.skills.map((s) => (
                        <li key={s.skill} className="px-2 py-0.5 rounded text-[11px] font-semibold border bg-slate-900 text-slate-200 border-white/10">
                          {s.skill}{s.verifiedBySkillCheck ? ' (verified by skill check)' : ''}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
            <Note testId="public-portfolio-note">{view.data.note}</Note>
          </section>
        )}
      </div>
    </main>
  );
};

export default PublicPortfolioPage;
