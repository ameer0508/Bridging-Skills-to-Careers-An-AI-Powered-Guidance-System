import React from 'react';
import { TrendingUp, DollarSign, BarChart2, ShieldCheck } from 'lucide-react';
import { TiltCard } from './effects/TiltCard';

/**
 * Landing-page section on market evidence. It describes what the product reports and shows no
 * figures: SkillBridge publishes job-market numbers only from licensed, dated sources, and this
 * page has none to quote.
 */
const POINTS = [
  {
    icon: BarChart2,
    title: 'Posting counts, with their source',
    body: 'A number of postings is shown only when it comes from a licensed source, with the source, the period, the location and the date it was collected.',
  },
  {
    icon: DollarSign,
    title: 'Advertised salaries, never estimates',
    body: 'Salaries are the ones stated in postings, kept per country, currency and pay period. They are not converted, averaged across currencies or predicted.',
  },
  {
    icon: ShieldCheck,
    title: '"Unavailable" instead of a guess',
    body: 'Where there are too few recent records, or none, the page says market data is unavailable. Missing data is never shown as zero or filled in.',
  },
];

export const MarketIntelligence: React.FC = () => (
  <section className="py-24 px-4 max-w-7xl mx-auto relative">
    <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-md">
        <TrendingUp className="w-4 h-4 text-amber-400" aria-hidden="true" />
        <span className="text-xs font-mono font-bold text-amber-300 tracking-wider uppercase">Market Evidence</span>
      </div>

      <h2 className="font-display text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
        Job-market facts, <br />
        <span className="bg-linear-to-r from-amber-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">only when they are sourced</span>
      </h2>

      <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
        SkillBridge keeps what it knows about you separate from what it knows about the job market, and reports the market only from records it can cite.
      </p>
    </div>

    <TiltCard glowColor="rgba(245, 158, 11, 0.2)" className="p-8 sm:p-12">
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {POINTS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-2">
            <Icon className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{body}</p>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-slate-400 text-center">
        No salary, growth or demand figure is quoted on this page, because none would be backed by a source.
      </p>
    </TiltCard>
  </section>
);
