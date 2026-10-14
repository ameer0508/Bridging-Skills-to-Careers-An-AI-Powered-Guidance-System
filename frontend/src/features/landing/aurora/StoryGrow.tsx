import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Award, Check, ClipboardCheck, FlaskConical, FolderGit2, Hammer, Link2, Plus, Route } from 'lucide-react';
import { AuroraCard, IllustrativeBadge, Reveal, RevealItem, SectionHeading } from '../../../design/aurora/primitives';
import { auroraEase } from '../../../design/aurora/motion';

// A tiny model of the real what-if: each added skill earns its weighted requirement points
const BASE = { 'Data Analyst': 64, 'Business Analyst': 58, 'Data Scientist': 41 } as const;
type Career = keyof typeof BASE;
const OPTIONS: Array<{ skill: string; gain: Record<Career, number> }> = [
  { skill: 'Tableau', gain: { 'Data Analyst': 7, 'Business Analyst': 5, 'Data Scientist': 0 } },
  { skill: 'Statistics (assessed)', gain: { 'Data Analyst': 6, 'Business Analyst': 3, 'Data Scientist': 9 } },
  { skill: 'Machine Learning', gain: { 'Data Analyst': 0, 'Business Analyst': 0, 'Data Scientist': 14 } },
];

/** 4. Career Lab: an interactive what-if, with the result moving before your eyes. */
export const CareerLabPreview: React.FC = () => {
  const reduce = useReducedMotion();
  const [added, setAdded] = useState<string[]>([]);
  const scores = useMemo(
    () =>
      (Object.keys(BASE) as Career[]).map(career => {
        const gain = OPTIONS.filter(o => added.includes(o.skill)).reduce((s, o) => s + o.gain[career], 0);
        return { career, before: BASE[career], after: BASE[career] + gain };
      }),
    [added]
  );
  const toggle = (skill: string) => setAdded(a => (a.includes(skill) ? a.filter(s => s !== skill) : [...a, skill]));

  return (
    <section id="career-lab" aria-labelledby="lab-title" className="scroll-mt-24 py-14 lg:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-8">
        <div className="flex flex-col gap-6">
          <SectionHeading
            id="lab-title"
            eyebrow="Career Lab"
            title="Compare careers and test a change before you spend a month on it."
            lead="Compare two to four careers side by side. Ask “what if I learned this?” and see every score move, with nothing saved to your profile. Counterfactuals show the single change that would help most, and a staged plan takes you from here to a target role."
          />
          <ul className="grid gap-2 text-sm text-aurora-ink sm:grid-cols-2">
            {['Side-by-side comparison', 'What-if scenarios', 'Counterfactual explanations', 'Skill freshness checks', 'Staged transition plans', 'Market data only when it is real'].map(t => (
              <li key={t} className="flex items-center gap-2">
                <Check size={16} className="text-aurora-mint-ink" aria-hidden="true" /> {t}
              </li>
            ))}
          </ul>
        </div>

        <AuroraCard className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 font-heading text-base font-bold text-aurora-ink">
              <FlaskConical size={18} className="text-aurora-violet" aria-hidden="true" /> What if I add…
            </p>
            <IllustrativeBadge label="Simulation with sample data" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Skills to try">
            {OPTIONS.map(o => {
              const on = added.includes(o.skill);
              return (
                <button
                  key={o.skill}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(o.skill)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aurora-violet ${
                    on ? 'border-transparent text-white shadow-aurora-md [background:var(--aurora-gradient-action)]' : 'border-aurora-line bg-white text-aurora-ink hover:border-aurora-lavender'
                  }`}
                >
                  {on ? <Check size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
                  {o.skill}
                </button>
              );
            })}
          </div>
          <ul className="mt-6 space-y-4" aria-live="polite">
            {scores.map(s => {
              const diff = s.after - s.before;
              return (
                <li key={s.career}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold text-aurora-ink">{s.career}</span>
                    <span className="tabular-nums text-aurora-muted">
                      <span className="font-heading text-lg font-extrabold text-aurora-ink">{s.after}%</span>
                      <AnimatePresence initial={false}>
                        {diff > 0 && (
                          <motion.span
                            key={diff}
                            initial={reduce ? undefined : { opacity: 0, y: 4 }}
                            animate={reduce ? undefined : { opacity: 1, y: 0 }}
                            exit={reduce ? undefined : { opacity: 0 }}
                            className="ml-2 rounded-full bg-aurora-mint/15 px-2 py-0.5 text-xs font-bold text-aurora-mint-ink"
                          >
                            +{diff}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </div>
                  <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-aurora-sidebar" aria-hidden="true">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-aurora-lavender/45" style={{ width: `${s.before}%` }} />
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full [background:var(--aurora-gradient-action)]"
                      initial={false}
                      animate={{ width: `${s.after}%` }}
                      transition={reduce ? { duration: 0 } : { duration: 0.7, ease: auroraEase }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-aurora-muted">
            Sample figures for illustration. In the app, every number comes from your own evidence and the published weights, and a what-if never changes your profile.
          </p>
        </AuroraCard>
      </div>
    </section>
  );
};

const PHASES = [
  { title: 'Foundations', detail: 'SQL joins and aggregation · 2 weeks', done: true },
  { title: 'Core analysis', detail: 'Statistics refresher · 3 weeks', done: true },
  { title: 'Visual storytelling', detail: 'Tableau with a public dataset · 2 weeks', done: false },
  { title: 'Show your work', detail: 'Portfolio project with a write-up · 3 weeks', done: false },
];

/** 5–7. Learning roadmap, skill checks, practice projects and portfolio, as one composition. */
export const LearnAndBuild: React.FC = () => {
  const reduce = useReducedMotion();
  return (
    <section id="learn" aria-labelledby="learn-title" className="scroll-mt-24 bg-white py-14 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          id="learn-title"
          eyebrow="Learn, prove and build"
          title="A plan that fits your week, and evidence that grows with every step."
          lead="Your roadmap comes from your real gaps and the hours you have. Short skill checks add assessed evidence. Practice projects and a portfolio with links turn “listed” into “applied”."
        />
        <Reveal className="mt-14 grid gap-5 lg:grid-cols-3" stagger={0.1}>
          <RevealItem className="lg:col-span-3">
            <AuroraCard className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-center gap-2 font-heading text-lg font-bold text-aurora-ink">
                    <Route size={20} className="text-aurora-violet" aria-hidden="true" /> Learning roadmap
                  </p>
                  <IllustrativeBadge />
                </div>
                <p className="mt-2 max-w-lg text-sm text-aurora-muted">Phased from your gaps, paced to 6 hours a week, linked to free official resources. Completing an item moves your progress, never your scores.</p>
                <ol className="relative mt-8 space-y-6 pl-8">
                  <span aria-hidden="true" className="absolute bottom-2 left-[11px] top-2 w-0.5 rounded-full bg-aurora-line" />
                  <motion.span
                    aria-hidden="true"
                    className="absolute left-[11px] top-2 w-0.5 origin-top rounded-full [background:var(--aurora-gradient-action)]"
                    style={{ height: '46%' }}
                    initial={reduce ? undefined : { scaleY: 0 }}
                    whileInView={reduce ? undefined : { scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, ease: auroraEase }}
                  />
                  {PHASES.map(p => (
                    <li key={p.title} className="relative">
                      <span
                        aria-hidden="true"
                        className={`absolute -left-8 top-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          p.done ? 'border-transparent text-white [background:var(--aurora-gradient-action)]' : 'border-aurora-line bg-white'
                        }`}
                      >
                        {p.done && <Check size={13} />}
                      </span>
                      <p className="font-semibold text-aurora-ink">
                        {p.title} <span className="sr-only">{p.done ? '(completed)' : '(to do)'}</span>
                      </p>
                      <p className="text-sm text-aurora-muted">{p.detail}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex flex-col gap-4 rounded-3xl bg-aurora-canvas p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-aurora-muted">This week</p>
                  <p className="text-xs font-semibold text-aurora-ink">4 of 6 hours planned</p>
                </div>
                <ul className="space-y-3">
                  {[
                    { title: 'Tableau: getting started', kind: 'Free official tutorial', mins: '90 min' },
                    { title: 'Build one dashboard from a public dataset', kind: 'Practice', mins: '2 h' },
                    { title: 'Write up what the dashboard shows', kind: 'Portfolio note', mins: '30 min' },
                  ].map(item => (
                    <li key={item.title} className="flex items-start justify-between gap-3 rounded-2xl border border-aurora-line bg-white p-3.5 shadow-aurora-sm">
                      <span>
                        <span className="block text-sm font-semibold text-aurora-ink">{item.title}</span>
                        <span className="text-xs text-aurora-muted">{item.kind}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-aurora-sidebar px-2 py-0.5 text-[11px] font-semibold text-aurora-muted">{item.mins}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-auto text-xs text-aurora-muted">Streaks count real activity only, and reminders are opt-in.</p>
              </div>
            </AuroraCard>
          </RevealItem>
          {[
            { icon: <ClipboardCheck size={22} aria-hidden="true" />, title: 'Skill checks', text: 'Short checks for eight core skills. A pass adds assessed evidence once; a fail changes nothing.' },
            { icon: <Hammer size={22} aria-hidden="true" />, title: 'Practice projects', text: '21 project briefs, suggested for your real gaps, taken on and completed at your pace.' },
            {
              icon: (
                <span className="flex items-center gap-2">
                  <FolderGit2 size={22} aria-hidden="true" />
                  <Link2 size={16} aria-hidden="true" />
                  <Award size={18} aria-hidden="true" />
                </span>
              ),
              title: 'Portfolio',
              text: 'Finished work with links, self-reported and labelled so. Public only when you share it.',
            },
          ].map(card => (
            <RevealItem key={card.title}>
              <AuroraCard className="h-full p-6 transition-transform duration-300 hover:-translate-y-1">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-aurora-violet/[0.08] text-aurora-violet">{card.icon}</span>
                <h3 className="mt-4 font-heading text-lg font-bold text-aurora-ink">{card.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-aurora-muted">{card.text}</p>
              </AuroraCard>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
};
