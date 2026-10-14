import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Briefcase, Compass, FileText, Hammer, MessagesSquare } from 'lucide-react';
import { AuroraCard, IllustrativeBadge, Reveal, RevealItem, SectionHeading } from '../../../design/aurora/primitives';
import { auroraEase } from '../../../design/aurora/motion';

const STAGES = [
  { icon: Compass, name: 'Discover', text: 'Upload a resume. See your skills, the evidence behind each one, and how you match 20 careers.' },
  { icon: BookOpen, name: 'Learn', text: 'A roadmap from your real gaps, paced to your weekly hours, with free official resources.' },
  { icon: Hammer, name: 'Build', text: 'Practice projects and a portfolio that turn listed skills into applied evidence.' },
  { icon: MessagesSquare, name: 'Practice', text: 'Mock interviews with a published rubric, follow-up questions and technical tasks.' },
  { icon: Briefcase, name: 'Opportunities', text: 'Track applications with dated histories and reminders, and see your own outcome rates.' },
];

/** 1. How it works: the five stages of the journey, joined by one line. */
export const HowItWorks: React.FC = () => (
  <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-24 py-14 lg:py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading
        id="how-title"
        eyebrow="How SkillBridge works"
        align="center"
        title="One connected journey, from “what can I do?” to “what do I do next?”"
        lead="Each stage feeds the next: evidence you add while learning or building changes your matches and your next step."
      />
      <Reveal as="ol" className="relative mt-16 grid gap-6 md:grid-cols-5 md:gap-4" stagger={0.1}>
        <span aria-hidden="true" className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-aurora-lavender via-aurora-violet to-aurora-sky md:left-[10%] md:right-[10%] md:top-7 md:h-px md:w-auto md:bg-gradient-to-r" />
        {STAGES.map(({ icon: Icon, name, text }, i) => (
          <RevealItem as="li" key={name} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
            <span className="relative z-10 inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-aurora-line bg-white text-aurora-violet shadow-aurora-md">
              <Icon size={22} aria-hidden="true" />
              <span className="absolute -right-1.5 -top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white [background:var(--aurora-gradient-action)]">{i + 1}</span>
            </span>
            <div>
              <h3 className="font-heading text-lg font-bold text-aurora-ink">{name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-aurora-muted">{text}</p>
            </div>
          </RevealItem>
        ))}
      </Reveal>
    </div>
  </section>
);

const RESUME_LINES = [
  { line: 'Data Analyst Intern, Example Retail (2025–2026)', skill: null },
  { line: 'Built weekly sales dashboards in Excel and Power BI', skill: ['Excel', 'Power BI'] },
  { line: 'Wrote SQL queries against the sales warehouse', skill: ['SQL'] },
  { line: 'Project: demand forecast with Python and Pandas', skill: ['Python', 'Pandas'] },
];
const EXTRACTED = [
  { name: 'SQL', kind: 'Applied in a role' },
  { name: 'Power BI', kind: 'Applied in a role' },
  { name: 'Python', kind: 'Used in a project' },
  { name: 'Statistics', kind: 'Listed only' },
];

/** 2. Resume Intelligence: lines on the left become evidence-graded skills on the right. */
export const ResumeIntelligence: React.FC = () => {
  const reduce = useReducedMotion();
  return (
    <section id="resume" aria-labelledby="resume-title" className="scroll-mt-24 py-14 lg:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <SectionHeading
          id="resume-title"
          eyebrow="Resume intelligence"
          title="Your resume, read line by line, with every skill traced to its source."
          lead="PDF or Word, up to 5 MB. Skills come from a shared list of 148 skills with aliases, and are graded by evidence: applied in a role or project counts more than a name in a skills list. Replace, reprocess, download or delete it whenever you like."
        />
        <AuroraCard className="relative p-5 sm:p-7">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-semibold text-aurora-ink">
              <FileText size={16} className="text-aurora-violet" aria-hidden="true" /> resume.pdf
            </p>
            <IllustrativeBadge />
          </div>
          <ol className="mt-5 space-y-2.5">
            {RESUME_LINES.map((l, i) => (
              <motion.li
                key={l.line}
                initial={reduce ? undefined : { opacity: 0, x: -10 }}
                whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5, ease: auroraEase }}
                className="flex items-start gap-3 rounded-xl bg-aurora-canvas px-3 py-2.5 text-sm text-aurora-ink"
              >
                <span className="mt-0.5 w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-aurora-muted">{i + 4}</span>
                <span>
                  {l.line}
                  {l.skill && <span className="ml-2 text-xs font-semibold text-aurora-violet">→ {l.skill.join(', ')}</span>}
                </span>
              </motion.li>
            ))}
          </ol>
          <div className="mt-6 border-t border-aurora-line pt-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-aurora-muted">Skills found, by evidence</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {EXTRACTED.map((s, i) => (
                <motion.li
                  key={s.name}
                  initial={reduce ? undefined : { opacity: 0, scale: 0.9 }}
                  whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4, ease: auroraEase }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                    s.kind === 'Listed only' ? 'border-aurora-line bg-white text-aurora-muted' : 'border-aurora-violet/25 bg-aurora-violet/[0.07] text-aurora-indigo'
                  }`}
                >
                  {s.name} <span className="font-medium">· {s.kind}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </AuroraCard>
      </div>
    </section>
  );
};

const REQUIREMENTS = [
  { skill: 'SQL', weight: 'Required', share: 1, state: 'Applied' },
  { skill: 'Excel', weight: 'Required', share: 1, state: 'Applied' },
  { skill: 'Python', weight: 'Required', share: 0.7, state: 'Project' },
  { skill: 'Statistics', weight: 'Preferred', share: 0.35, state: 'Listed only' },
  { skill: 'Tableau', weight: 'Preferred', share: 0, state: 'Missing' },
];
const READINESS = [
  { name: 'Required skills', value: 82 },
  { name: 'Evidence depth', value: 61 },
  { name: 'Projects', value: 48 },
];

/** 3. Career discovery and readiness: a match is a table you can read, not a black box. */
export const CareerDiscovery: React.FC = () => {
  const reduce = useReducedMotion();
  return (
    <section id="discover" aria-labelledby="discover-title" className="scroll-mt-24 bg-white py-14 lg:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:px-8">
        <div className="order-2 grid gap-5 sm:grid-cols-[1.4fr_1fr] lg:order-1">
          <AuroraCard className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-aurora-muted">Career match</p>
                <p className="mt-1 font-heading text-xl font-extrabold text-aurora-ink">Data Analyst</p>
              </div>
              <IllustrativeBadge />
            </div>
            <ul className="mt-5 space-y-3.5">
              {REQUIREMENTS.map((r, i) => (
                <li key={r.skill}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-aurora-ink">
                      {r.skill} <span className="font-normal text-aurora-muted">· {r.weight}</span>
                    </span>
                    <span className={`text-xs font-semibold ${r.state === 'Missing' ? 'text-aurora-muted' : 'text-aurora-indigo'}`}>{r.state}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-aurora-sidebar" aria-hidden="true">
                    <motion.div
                      className="h-full rounded-full [background:var(--aurora-gradient-action)]"
                      initial={reduce ? { width: `${r.share * 100}%` } : { width: 0 }}
                      whileInView={{ width: `${r.share * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.9, ease: auroraEase }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </AuroraCard>
          <AuroraCard className="flex flex-col justify-between gap-5 p-5 sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-aurora-muted">Readiness</p>
              <p className="mt-1 font-heading text-4xl font-extrabold text-aurora-ink">
                68<span className="text-lg text-aurora-muted">/100</span>
              </p>
              <p className="mt-1 text-xs leading-snug text-aurora-muted">Describes your evidence. It does not predict hiring.</p>
            </div>
            <ul className="space-y-3">
              {READINESS.map(d => (
                <li key={d.name} className="text-xs">
                  <div className="flex justify-between font-medium text-aurora-ink">
                    <span>{d.name}</span>
                    <span className="tabular-nums">{d.value}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-aurora-sidebar" aria-hidden="true">
                    <div className="h-full rounded-full bg-aurora-mint" style={{ width: `${d.value}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </AuroraCard>
        </div>
        <SectionHeading
          className="order-1 lg:order-2"
          id="discover-title"
          eyebrow="Career discovery & readiness"
          title="See exactly why a career fits, requirement by requirement."
          lead="20 careers, each with weighted requirements. Every match opens into the rows that produced it: which skills count, how strongly each is evidenced, and what is missing. Readiness adds the dimensions behind the number and the gaps that matter most."
        />
      </div>
    </section>
  );
};
